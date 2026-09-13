import tempfile
import unittest
from pathlib import Path

import server


class UndoHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        root = Path(self.temp.name)
        self.originals = {
            name: getattr(server, name)
            for name in ("DATA_DIR", "DB_PATH", "DB_BACKUP_DIR", "TRIAL_ARCHIVE_DIR", "SETTINGS_PATH")
        }
        server.DATA_DIR = root
        server.DB_PATH = root / "state.sqlite"
        server.DB_BACKUP_DIR = root / "backups"
        server.TRIAL_ARCHIVE_DIR = root / "archives"
        server.SETTINGS_PATH = root / "settings.json"

    def tearDown(self):
        for name, value in self.originals.items():
            setattr(server, name, value)
        self.temp.cleanup()

    @staticmethod
    def state(label):
        return {
            "app": "Field Trial Secretary",
            "version": 1,
            "data": {
                "trials": [{"id": "trial", "trialName": "Undo Test", "notes": label}],
                "masterHounds": [],
                "masterJudges": [],
                "masterWorkers": [],
            },
        }

    def test_repeated_undo_walks_backward_without_restoring_its_own_backup(self):
        server.write_state(self.state("first"))
        server.write_state(self.state("second"))
        server.write_state(self.state("third"))

        first_undo = server.undo_last_action()
        self.assertEqual(first_undo["state"]["data"]["trials"][0]["notes"], "second")
        self.assertTrue(first_undo["undo"]["available"])

        second_undo = server.undo_last_action()
        self.assertEqual(second_undo["state"]["data"]["trials"][0]["notes"], "first")
        self.assertFalse(second_undo["undo"]["available"])
        self.assertEqual(server.read_state()["data"]["trials"][0]["notes"], "first")


if __name__ == "__main__":
    unittest.main()
