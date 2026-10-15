import io
from contextlib import closing
import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from unittest.mock import patch

import server


class DatabaseSetupTests(unittest.TestCase):
    def paths(self, root):
        return patch.multiple(
            server,
            DATA_DIR=root / 'data',
            DB_PATH=root / 'data' / 'field_trial_secretary.sqlite',
            BLANK_DB_PATH=root / 'database' / 'blank_field_trial_secretary.sqlite',
            DB_BACKUP_DIR=root / 'backups' / 'database',
            TRIAL_ARCHIVE_DIR=root / 'backups' / 'trial_archives',
            SETTINGS_PATH=root / 'data' / 'app_settings.json',
        )

    def test_create_new_database_starts_empty_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp, self.paths(Path(tmp)):
            server.build_blank_database(server.BLANK_DB_PATH)
            result = server.create_new_database()
            self.assertTrue(result['ready'])
            with closing(sqlite3.connect(server.DB_PATH)) as conn:
                row = conn.execute("select state_json from app_state where key='current'").fetchone()
            state = json.loads(row[0])
            self.assertEqual(state['data']['trials'], [])
            self.assertEqual(state['data']['masterHounds'], [])
            with self.assertRaises(ValueError):
                server.create_new_database()

    def test_restore_valid_database_and_reject_invalid_file(self):
        with tempfile.TemporaryDirectory() as tmp, self.paths(Path(tmp)):
            root = Path(tmp)
            source = root / 'existing.sqlite'
            server.build_blank_database(source)
            with closing(sqlite3.connect(source)) as conn:
                state = server.empty_application_state()
                state['data']['trials'] = [{'id': 'kept'}]
                conn.execute("insert into app_state(key,state_json,updated_at) values(?,?,?)", ('current', json.dumps(state), server.utc_now()))
                conn.commit()
            raw = source.read_bytes()
            result = server.restore_uploaded_database(io.BytesIO(raw), len(raw))
            self.assertTrue(result['restored'])
            self.assertEqual(server.read_state()['data']['trials'][0]['id'], 'kept')

        with tempfile.TemporaryDirectory() as tmp, self.paths(Path(tmp)):
            invalid = b'not a sqlite database' * 50
            with self.assertRaises(ValueError):
                server.restore_uploaded_database(io.BytesIO(invalid), len(invalid))
            self.assertFalse(server.DB_PATH.exists())

    def test_uploaded_database_replaces_current_only_after_validation_and_keeps_safety_copy(self):
        with tempfile.TemporaryDirectory() as tmp, self.paths(Path(tmp)):
            root = Path(tmp)
            server.build_blank_database(server.DB_PATH)
            with closing(sqlite3.connect(server.DB_PATH)) as conn:
                original = server.empty_application_state()
                original['data']['trials'] = [{'id': 'original-trial'}]
                conn.execute("insert into app_state(key,state_json,updated_at) values(?,?,?)", ('current', json.dumps(original), server.utc_now()))
                conn.commit()

            incoming_path = root / 'incoming.sqlite'
            server.build_blank_database(incoming_path)
            with closing(sqlite3.connect(incoming_path)) as conn:
                incoming = server.empty_application_state()
                incoming['data']['trials'] = [{'id': 'incoming-trial'}]
                conn.execute("insert into app_state(key,state_json,updated_at) values(?,?,?)", ('current', json.dumps(incoming), server.utc_now()))
                conn.commit()

            raw = incoming_path.read_bytes()
            result = server.restore_uploaded_database(io.BytesIO(raw), len(raw))
            self.assertEqual(result['state']['data']['trials'][0]['id'], 'incoming-trial')
            safety_path = Path(result['preRestoreBackup'])
            self.assertTrue(safety_path.is_file())
            with closing(sqlite3.connect(safety_path)) as conn:
                saved = json.loads(conn.execute("select state_json from app_state where key='current'").fetchone()[0])
            self.assertEqual(saved['data']['trials'][0]['id'], 'original-trial')

            invalid = b'not a sqlite database' * 50
            with self.assertRaises(ValueError):
                server.restore_uploaded_database(io.BytesIO(invalid), len(invalid))
            self.assertEqual(server.read_state()['data']['trials'][0]['id'], 'incoming-trial')

    def test_admin_backup_routes_return_json_and_create_restore_points(self):
        with tempfile.TemporaryDirectory() as tmp, self.paths(Path(tmp)):
            server.build_blank_database(server.BLANK_DB_PATH)
            server.create_new_database()
            httpd = ThreadingHTTPServer(('127.0.0.1', 0), server.FieldTrialSecretaryHandler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            base_url = f'http://127.0.0.1:{httpd.server_address[1]}'

            def post(path, payload):
                request = Request(
                    base_url + path,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST',
                )
                with urlopen(request, timeout=10) as response:
                    return json.loads(response.read().decode('utf-8'))

            try:
                backup = post('/api/backup', {})
                self.assertTrue(backup['ok'])
                self.assertTrue(Path(backup['backupPath']).is_file())
                self.assertGreaterEqual(len(backup['backups']), 1)

                settings = post('/api/backup-settings', {'maxDbBackups': 12})
                self.assertEqual(settings['settings']['maxDbBackups'], 12)

                restored = post('/api/restore-sqlite-backup', {'fileName': Path(backup['backupPath']).name})
                self.assertTrue(restored['ok'])
                self.assertTrue(Path(restored['preRestoreBackup']).is_file())
                self.assertIsInstance(restored['state'], dict)
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=5)


if __name__ == '__main__':
    unittest.main()
