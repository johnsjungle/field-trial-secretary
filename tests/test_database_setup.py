import io
from contextlib import closing
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
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


if __name__ == '__main__':
    unittest.main()
