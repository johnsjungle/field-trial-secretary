import hashlib
import sqlite3
import unittest
from contextlib import closing

import server
from system_test_runner import run_server_system_tests


class SystemTestRunnerTests(unittest.TestCase):
    def state_hash(self):
        with closing(sqlite3.connect(server.DB_PATH)) as connection:
            row = connection.execute("SELECT state_json FROM app_state WHERE key = ?", (server.STATE_KEY,)).fetchone()
        return hashlib.sha256((row[0] if row else "").encode("utf-8")).hexdigest()

    def test_full_system_runner_passes_and_preserves_saved_state(self):
        before = self.state_hash()
        report = run_server_system_tests(server.__dict__, [])
        self.assertTrue(report["ok"])
        self.assertTrue(report["healthy"])
        self.assertEqual(report["summary"]["failed"], 0)
        self.assertGreaterEqual(report["summary"]["total"], 30)
        self.assertEqual(self.state_hash(), before)
        ids = {row["id"] for row in report["results"]}
        self.assertTrue({"pdf-akc-record", "pdf-asfa-record", "pdf-bie-judges", "database-unchanged", "akc-specials-print-order"} <= ids)

    def test_client_results_are_merged_and_counted(self):
        report = run_server_system_tests(server.__dict__, [{
            "id": "browser-example", "category": "Browser", "name": "Browser example",
            "status": "pass", "details": "Passed in browser", "durationMs": 2,
        }])
        self.assertGreaterEqual(report["summary"]["total"], 31)
        self.assertTrue(any(row["id"] == "browser-example" for row in report["results"]))


if __name__ == "__main__":
    unittest.main()
