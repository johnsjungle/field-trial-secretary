import unittest, tempfile, zipfile, json
from pathlib import Path
from unittest.mock import patch
import update_manager as u

class UpdateTests(unittest.TestCase):
    def test_selection(self):
        url=u.RELEASE_PREFIX+'v0.4.0/package.zip'
        index={'schemaVersion':1,'versions':[{'version':'0.4.0','status':'available','updates':{'windows':{'url':url,'sha256':'a'*64}}}]}
        self.assertEqual(u.select_update(index,'0.4.0','0.3.10','windows'),(url,'a'*64))
        with self.assertRaises(ValueError):u.select_update(index,'0.4.0','0.4.0','windows')
        index['versions'][0]['updates']['windows']['url']='https://evil.test/package.zip'
        with self.assertRaises(ValueError):u.select_update(index,'0.4.0','0.3.10','windows')
    def test_linux_appimage_selection(self):
        url=u.RELEASE_PREFIX+'v0.4.0/HALO-0.4.0-x86_64.AppImage'
        index={'schemaVersion':1,'versions':[{'version':'0.4.0','status':'available','updates':{'linuxAppImage':{'url':url,'sha256':'b'*64}}}]}
        self.assertEqual(u.select_update(index,'0.4.0','0.3.10','linuxAppImage'),(url,'b'*64))
        index['versions'][0]['updates']['linuxAppImage']['url']=u.RELEASE_PREFIX+'v0.4.0/HALO-0.4.0-amd64.deb'
        with self.assertRaises(ValueError):u.select_update(index,'0.4.0','0.3.10','linuxAppImage')

    def test_stage_linux_appimage(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'download.AppImage'; source.write_bytes(b'x'*(1024*1024))
            staged=u.stage_linux_appimage(source,root/'work','0.4.0','HALO.AppImage')
            self.assertTrue(staged.is_file())
            if u.os.name != 'nt': self.assertTrue(staged.stat().st_mode & 0o100)
            with self.assertRaises(ValueError):u.stage_linux_appimage(source,root/'bad','0.4.0','../HALO.AppImage')

    def test_extract_excludes_data_and_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); archive=root/'a.zip'
            with zipfile.ZipFile(archive,'w') as z:
                for name in ['FieldTrialSecretary.exe','_internal/a','database/schema.sql']:z.writestr('Field Trial Secretary/'+name,'program')
                z.writestr('Field Trial Secretary/app/version.json',json.dumps({'version':'0.4.0'}))
                z.writestr('Field Trial Secretary/data/field_trial_secretary.sqlite','DO NOT COPY')
            u.extract_windows(archive,root/'out','0.4.0')
            self.assertFalse((root/'out/data').exists())
            with zipfile.ZipFile(archive,'w') as z:z.writestr('../escape','bad')
            with self.assertRaises(ValueError):u.extract_windows(archive,root/'other','0.4.0')
    def test_partial_failure_rolls_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); target=root/'target'; stage=root/'stage';target.mkdir();stage.mkdir()
            for name in ['a','b']:
                (target/name).write_text('old');(stage/name).write_text('new')
            (target/'data').mkdir();(target/'data/db').write_text('trial')
            move=u.shutil.move
            def failing(src,dst):
                if src==str(stage/'b'):raise OSError('simulated installation failure')
                return move(src,dst)
            with patch.object(u.shutil,'move',side_effect=failing):
                with self.assertRaises(OSError):u.replace_program_components(target,stage,root/'rollback',('a','b'))
            self.assertEqual((target/'a').read_text(),'old');self.assertEqual((target/'b').read_text(),'old');self.assertEqual((target/'data/db').read_text(),'trial')

if __name__=='__main__':unittest.main()
