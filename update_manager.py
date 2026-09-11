"""Staged, database-preserving updates for packaged desktop installations."""
from __future__ import annotations
import hashlib
import ipaddress
import json
import os
from pathlib import Path, PurePosixPath
import platform
import plistlib
import re
import secrets
import shutil
import sqlite3
import stat
import subprocess
import sys
import threading
import time
import urllib.request
import urllib.parse
import zipfile

INDEX_URL = 'https://raw.githubusercontent.com/johnsjungle/field-trial-secretary-updates/main/version-index.json'
RELEASE_PREFIX = 'https://github.com/johnsjungle/field-trial-secretary-updates/releases/download/'
WINDOWS_PARTS = ('FieldTrialSecretary.exe', '_internal', 'app', 'database')
MAX_BYTES = 2 * 1024 ** 3
TEAM_ID = 'GB58P794W3'


def version_tuple(value):
    if not re.fullmatch(r'\d+\.\d+\.\d+', str(value)):
        raise ValueError('Invalid version.')
    return tuple(map(int, value.split('.')))


def platform_key():
    if sys.platform == 'win32':
        return 'windows'
    if sys.platform == 'darwin':
        return 'appleSilicon' if platform.machine().lower() in ('arm64', 'aarch64') else 'intel'
    return ''


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        url = urllib.parse.urlparse(newurl)
        if url.scheme != 'https' or url.hostname not in ('github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'):
            raise ValueError('Unexpected download redirect.')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=20) as response:
        data = response.read(1000001)
    if len(data) > 1000000:
        raise ValueError('Update index is too large.')
    return json.loads(data)


def select_update(index, version, current, key):
    if version_tuple(version) <= version_tuple(current):
        raise ValueError('Choose a version newer than the installed version.')
    if index.get('schemaVersion') != 1:
        raise ValueError('Unsupported update index.')
    entry = next((x for x in index.get('versions', []) if x.get('version') == version and x.get('status') == 'available'), None)
    asset = (entry or {}).get('updates', {}).get(key, {})
    url, digest = asset.get('url', ''), asset.get('sha256', '')
    parsed = urllib.parse.urlparse(url)
    expected = RELEASE_PREFIX + 'v' + version + '/'
    if not url.startswith(expected) or parsed.query or parsed.fragment or not re.fullmatch('[a-fA-F0-9]{64}', digest):
        raise ValueError('A verified automatic update is not available for this platform. Use the release download link.')
    suffix = '.zip' if key == 'windows' else '.dmg'
    if not parsed.path.lower().endswith(suffix):
        raise ValueError('Incorrect installer type.')
    return url, digest.lower()


def download_verified(url, digest, destination, progress):
    opener = urllib.request.build_opener(SafeRedirect())
    total = 0
    sha = hashlib.sha256()
    with opener.open(url, timeout=30) as response, open(destination, 'wb') as output:
        expected = int(response.headers.get('Content-Length') or 0)
        if expected > MAX_BYTES:
            raise ValueError('Installer is too large.')
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            total += len(block)
            if total > MAX_BYTES:
                raise ValueError('Installer is too large.')
            output.write(block)
            sha.update(block)
            progress(f'Downloading: {total // 1048576} MB' + (f' of {expected // 1048576} MB' if expected else ''))
    if sha.hexdigest() != digest:
        raise ValueError('Installer checksum failed. Nothing was installed.')


def extract_windows(archive_path, destination, version):
    """Extract only program components; archive data/backups/logs are never copied."""
    seen = set()
    with zipfile.ZipFile(archive_path) as archive:
        if len(archive.infolist()) > 40000 or sum(i.file_size for i in archive.infolist()) > MAX_BYTES:
            raise ValueError('Expanded installer is too large.')
        for info in archive.infolist():
            name = info.filename
            path = PurePosixPath(name)
            if '\\' in name or path.is_absolute() or any(p in ('..', '.') or ':' in p or p.endswith((' ', '.')) for p in path.parts):
                raise ValueError('Unsafe archive path.')
            if stat.S_ISLNK(info.external_attr >> 16):
                raise ValueError('Archive links are not allowed.')
            parts = list(path.parts)
            if parts and parts[0] == 'Field Trial Secretary':
                parts.pop(0)
            if not parts or parts[0] not in WINDOWS_PARTS:
                continue
            rel = Path(*parts)
            key = str(rel).lower()
            if key in seen:
                raise ValueError('Duplicate archive path.')
            seen.add(key)
            target = destination / rel
            if not target.resolve().is_relative_to(destination.resolve()):
                raise ValueError('Unsafe extraction path.')
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(info) as source, open(target, 'wb') as output:
                    shutil.copyfileobj(source, output)
    for name in WINDOWS_PARTS:
        if not (destination / name).exists():
            raise ValueError('Installer is missing ' + name)
    if json.loads((destination / 'app' / 'version.json').read_text(encoding='utf-8-sig')).get('version') != version:
        raise ValueError('Installer version does not match the requested version.')


def app_bundle(executable):
    return next((p for p in Path(executable).resolve().parents if p.suffix == '.app'), None)


def stage_mac(dmg, work, version):
    mount = work / 'mounted'
    mount.mkdir()
    subprocess.run(['/usr/bin/hdiutil', 'attach', '-readonly', '-nobrowse', '-noautoopen', '-mountpoint', str(mount), str(dmg)], check=True, capture_output=True, timeout=120)
    try:
        source = mount / 'Field Trial Secretary.app'
        subprocess.run(['/usr/bin/codesign', '--verify', '--deep', '--strict', '-R', f'anchor apple generic and certificate leaf[subject.OU] = "{TEAM_ID}"', str(source)], check=True, capture_output=True, timeout=120)
        subprocess.run(['/usr/sbin/spctl', '--assess', '--type', 'execute', str(source)], check=True, capture_output=True, timeout=120)
        metadata = source / 'Contents' / 'Resources' / 'app' / 'version.json'
        if not metadata.exists():
            metadata = source / 'Contents' / 'Frameworks' / 'app' / 'version.json'
        if json.loads(metadata.read_text()).get('version') != version:
            raise ValueError('Mac installer version mismatch.')
        staged = work / 'program' / source.name
        staged.parent.mkdir(exist_ok=True)
        subprocess.run(['/usr/bin/ditto', str(source), str(staged)], check=True, capture_output=True, timeout=180)
        return staged
    finally:
        subprocess.run(['/usr/bin/hdiutil', 'detach', str(mount)], capture_output=True, timeout=60)


def write_json(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2), encoding='utf-8')
    temporary.replace(path)


class UpdateManager:
    def __init__(self, root, storage, db_path, version):
        self.root, self.storage, self.db_path = Path(root), Path(storage), Path(db_path)
        self.current = version
        self.lock = threading.RLock()
        self.state = {'phase': 'idle', 'message': ''}
        self.installing = False
        self.work = None
        self.token = None

    def capability(self):
        if not getattr(sys, 'frozen', False) or not platform_key():
            return False, 'Automatic installation requires the packaged Windows or Mac app. Source installations use manual updates.'
        target = app_bundle(sys.executable) if sys.platform == 'darwin' else self.root
        if not target or '/AppTranslocation/' in str(target) or str(target).startswith('/Volumes/'):
            return False, 'Move the app into Applications before updating.'
        parent = target.parent if sys.platform == 'darwin' else target
        if not os.access(parent, os.W_OK):
            return False, 'This installation folder is not writable. Use the download link and install with administrator permissions.'
        return True, ''

    def status(self):
        with self.lock:
            enabled, reason = self.capability()
            result = dict(self.state, supported=enabled, reason=reason, platform=platform_key())
            if self.state['phase'] == 'ready':
                result['token'] = self.token
            history = self.storage / 'updates' / 'last-result.json'
            if history.exists():
                try: result['lastResult'] = json.loads(history.read_text())
                except (ValueError, OSError): pass
            return result

    def prepare(self, version):
        with self.lock:
            enabled, reason = self.capability()
            if not enabled: raise ValueError(reason)
            if self.state['phase'] in ('preparing', 'ready', 'installing'):
                raise ValueError('An update is already in progress. Finish or cancel it first.')
            version_tuple(version)
            self.state = {'phase': 'preparing', 'message': 'Checking the public update index.', 'version': version}
            threading.Thread(target=self._prepare, args=(version,), daemon=True).start()

    def _prepare(self, version):
        try:
            url, digest = select_update(fetch_json(INDEX_URL), version, self.current, platform_key())
            work = self.storage / 'updates' / secrets.token_hex(12)
            work.mkdir(parents=True)
            self.work = work
            suffix = '.zip' if sys.platform == 'win32' else '.dmg'
            archive = work / ('installer' + suffix)
            def progress(message):
                with self.lock: self.state['message'] = message
            download_verified(url, digest, archive, progress)
            progress('Verifying and staging program files.')
            if sys.platform == 'win32':
                extract_windows(archive, work / 'program', version)
                helper = work / 'helper'
                helper.mkdir()
                shutil.copy2(sys.executable, helper / 'FieldTrialSecretary.exe')
                shutil.copytree(self.root / '_internal', helper / '_internal')
                self.helper_exe = helper / 'FieldTrialSecretary.exe'
                target = self.root
            else:
                stage_mac(archive, work, version)
                target = app_bundle(sys.executable)
                helper = work / 'helper.app'
                subprocess.run(['/usr/bin/ditto', str(target), str(helper)], check=True, capture_output=True, timeout=180)
                self.helper_exe = helper / 'Contents' / 'MacOS' / Path(sys.executable).name
            self.target = target
            self.token = secrets.token_urlsafe(32)
            with self.lock: self.state.update(phase='ready', message='Verified update is ready. Install and Restart will back up your database first.')
        except Exception as exc:
            with self.lock: self.state.update(phase='error', message=str(exc))

    def cancel(self):
        with self.lock:
            if self.state['phase'] not in ('ready', 'error'):
                raise ValueError('Wait for preparation to finish before canceling.')
            self.state = {'phase': 'idle', 'message': 'Update canceled. No installed files were changed.'}
            self.token = None

    def install(self, token, host, port):
        with self.lock:
            if self.state['phase'] != 'ready' or not secrets.compare_digest(str(token), str(self.token)):
                raise ValueError('Prepare the update again before installing.')
            self.installing = True
            try:
                backup = self.work / 'database-before-update.sqlite'
                with sqlite3.connect(self.db_path) as source, sqlite3.connect(backup) as destination:
                    source.backup(destination)
                    if destination.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                        raise ValueError('Database backup verification failed.')
                job = {'target': str(self.target), 'work': str(self.work), 'pid': os.getpid(), 'platform': platform_key(), 'version': self.state['version'], 'host': host, 'port': port, 'dbPath': str(self.db_path), 'result': str(self.storage / 'updates' / 'last-result.json'), 'backup': str(backup)}
                write_json(self.work / 'job.json', job)
                kwargs = dict(stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=str(self.work))
                if sys.platform == 'win32': kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP
                else: kwargs['start_new_session'] = True
                subprocess.Popen([str(self.helper_exe), '--apply-program-update', str(self.work / 'job.json')], **kwargs)
                self.state.update(phase='installing', message='Database backed up. Closing and installing the verified update.', backup=str(backup))
            except Exception:
                self.installing = False
                raise


def replace_program_components(target, staged, rollback, names):
    """Move only the explicit program allowlist; restore partial changes on failure."""
    moved, installed = [], []
    rollback.mkdir(parents=True, exist_ok=False)
    try:
        for name in names:
            if name in ('data', 'backups', 'logs', 'updates') or Path(name).name != name:
                raise ValueError('Invalid program component.')
            if (target / name).is_symlink(): raise ValueError('Installation component is a link.')
            if not (staged / name).exists(): raise ValueError('Staged component is missing.')
        for name in names:
            if (target / name).exists():
                shutil.move(str(target / name), str(rollback / name)); moved.append(name)
            shutil.move(str(staged / name), str(target / name)); installed.append(name)
    except Exception:
        restore_components(target, rollback, moved, installed)
        raise
    return moved, installed


def restore_components(target, rollback, moved, installed):
    for name in reversed(installed):
        path = target / name
        if path.is_dir(): shutil.rmtree(path)
        elif path.exists(): path.unlink()
    for name in reversed(moved):
        shutil.move(str(rollback / name), str(target / name))


def parent_alive(pid):
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.windll.kernel32
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle: return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(code))
        ctypes.windll.kernel32.CloseHandle(handle)
        return code.value == 259
    try: os.kill(pid, 0); return True
    except ProcessLookupError: return False


def apply_update_job(job_path):
    job_path = Path(job_path).resolve()
    job = json.loads(job_path.read_text())
    work, target = Path(job['work']).resolve(), Path(job['target']).resolve()
    if work != job_path.parent or not work.name or not Path(job['backup']).is_file():
        raise ValueError('Invalid update job.')
    result = Path(job['result'])
    try:
        for _ in range(120):
            if not parent_alive(int(job['pid'])): break
            time.sleep(1)
        else: raise ValueError('The app did not close. No program files were replaced.')
        if job['platform'] == 'windows':
            names = WINDOWS_PARTS
            destination, staged = target, work / 'program'
            executable = target / 'FieldTrialSecretary.exe'
        else:
            names = (target.name,)
            destination, staged = target.parent, work / 'program'
            executable = target / 'Contents' / 'MacOS' / 'Field Trial Secretary'
        moved, installed = replace_program_components(destination, staged, work / 'rollback', names)
        env = dict(os.environ, CI='1')
        kwargs = dict(stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
        if sys.platform == 'win32': kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        process = None
        try:
            process = subprocess.Popen([str(executable), '--host', job['host'], '--port', str(job['port'])], **kwargs)
            for _ in range(60):
                if process.poll() is not None: raise ValueError('Updated application exited before startup.')
                try:
                    status = fetch_json(f"http://127.0.0.1:{job['port']}/api/status")
                    if status.get('appVersion', {}).get('version') == job['version'] and Path(status.get('dbPath', '')).resolve() == Path(job['dbPath']).resolve(): break
                except Exception: pass
                time.sleep(1)
            else: raise ValueError('Updated application did not pass its startup check.')
        except Exception:
            if process and process.poll() is None:
                process.terminate(); process.wait(timeout=20)
            restore_components(destination, work / 'rollback', moved, installed)
            subprocess.Popen([str(executable), '--host', job['host'], '--port', str(job['port'])], **kwargs)
            raise ValueError('Update startup failed; previous program restored. Your database was not replaced.')
        write_json(result, {'phase':'complete','version':job['version'],'message':'Update installed. Database preserved.','backup':job['backup']})
    except Exception as exc:
        write_json(result, {'phase':'error','version':job['version'],'message':str(exc),'backup':job.get('backup')})


def handle_update_request(handler, manager, write_lock, shutdown):
    path = urllib.parse.urlparse(handler.path).path
    if not path.startswith('/api/update-'): return False
    try:
        if not ipaddress.ip_address(handler.client_address[0]).is_loopback:
            raise ValueError('Updates are available only on this computer.')
        if handler.command == 'GET' and path == '/api/update-status':
            handler.send_json({'ok':True, **manager.status()}); return True
        origin = handler.headers.get('Origin', '')
        allowed = {f'http://127.0.0.1:{handler.server.server_port}',f'http://localhost:{handler.server.server_port}'}
        if handler.command != 'POST' or origin not in allowed or handler.headers.get_content_type() != 'application/json':
            raise ValueError('Update requests must come from the local app.')
        length = int(handler.headers.get('Content-Length','0'))
        if not 0 < length <= 4096: raise ValueError('Invalid update request.')
        payload = json.loads(handler.rfile.read(length))
        if path == '/api/update-prepare': manager.prepare(str(payload.get('version','')))
        elif path == '/api/update-cancel': manager.cancel()
        elif path == '/api/update-install':
            with write_lock:
                manager.install(payload.get('token',''), str(handler.server.server_address[0]), handler.server.server_port)
        else: raise ValueError('Unknown update action.')
        handler.send_json({'ok':True, **manager.status()})
        if manager.installing:
            threading.Thread(target=shutdown, args=(handler.server,), daemon=False).start()
    except Exception as exc:
        handler.send_json({'ok':False,'error':str(exc)},400)
    return True
