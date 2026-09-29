import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import server


class FakeArchiveHandler:
    def __init__(self, payload):
        raw = json.dumps(payload).encode("utf-8")
        self.headers = {"Content-Length": str(len(raw))}
        self.rfile = io.BytesIO(raw)
        self.response = None

    def send_json(self, payload, status=200):
        self.response = ("json", status, payload)

    def send_zip(self, body, filename, archive_path=""):
        self.response = ("zip", body, filename, archive_path)


class TrialArchiveTests(unittest.TestCase):
    def test_archive_route_creates_downloadable_package(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database = root / "data" / "field_trial_secretary.sqlite"
            backup_dir = root / "backups" / "database"
            archive_dir = root / "backups" / "trial_archives"
            with patch.multiple(
                server,
                DB_PATH=database,
                DB_BACKUP_DIR=backup_dir,
                TRIAL_ARCHIVE_DIR=archive_dir,
            ):
                server.ensure_database()
                server.write_state({"data": {"trials": []}})
                payload = {
                    "trial": {
                        "id": "trial-1",
                        "association": "AKC",
                        "trialName": "Archive Test",
                        "clubName": "Test Club",
                        "startsOn": "2026-09-29",
                    },
                    "state": {"data": {"trials": [{"id": "trial-1"}]}},
                }
                handler = FakeArchiveHandler(payload)
                handled = server.handle_trial_archive_post(handler, SimpleNamespace(path="/api/trial-archive"))

                self.assertTrue(handled)
                kind, body, filename, archive_path = handler.response
                self.assertEqual(kind, "zip")
                self.assertTrue(filename.endswith(".zip"))
                self.assertEqual(Path(archive_path).read_bytes(), body)
                with zipfile.ZipFile(io.BytesIO(body)) as archive:
                    names = set(archive.namelist())
                    self.assertIn("trial-data/trial.json", names)
                    self.assertIn("trial-data/full-state.json", names)
                    self.assertIn("README.txt", names)
                    self.assertTrue(any(name.startswith("database/") and name.endswith(".sqlite") for name in names))

    def test_archive_route_returns_readable_json_error(self):
        handler = FakeArchiveHandler({"trial": {}, "state": "invalid"})
        handled = server.handle_trial_archive_post(handler, SimpleNamespace(path="/api/trial-archive"))

        self.assertTrue(handled)
        kind, status, payload = handler.response
        self.assertEqual(kind, "json")
        self.assertEqual(status, 400)
        self.assertIn("state must be an object", payload["error"])

    def test_other_route_is_not_claimed(self):
        handler = FakeArchiveHandler({})
        self.assertFalse(server.handle_trial_archive_post(handler, SimpleNamespace(path="/api/state")))
        self.assertIsNone(handler.response)


if __name__ == "__main__":
    unittest.main()
