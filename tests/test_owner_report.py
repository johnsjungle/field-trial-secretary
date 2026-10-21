import io
import unittest

from pypdf import PdfReader

import server


class OwnerReportTests(unittest.TestCase):
    def trials(self):
        return [
            {
                "id": "sat",
                "trialName": "Saturday Trial",
                "clubName": "Owner Test Club",
                "startsOn": "2026-10-24",
                "association": "AKC",
                "entries": [
                    {"id": "a1", "callName": "OwnerTestHalo", "registeredName": "Owner Test Halo One", "registrationNumber": "ZZOWNER100", "owner": "John Smith", "ownerEmail": "john@example.com"},
                    {"id": "a2", "callName": "OwnerTestComet", "registeredName": "Owner Test Comet Two", "registrationNumber": "ZZOWNER200", "owner": "Mary Jones"},
                    {"id": "a3", "callName": "OwnerTestUnknown", "registeredName": "Owner Test Unknown Three", "registrationNumber": "ZZOWNER300", "owner": ""},
                ],
            },
            {
                "id": "sun",
                "trialName": "Sunday Trial",
                "clubName": "Owner Test Club",
                "startsOn": "2026-10-25",
                "association": "AKC",
                "entries": [
                    {"id": "b1", "callName": "OwnerTestHalo", "registeredName": "Owner Test Halo One", "registrationNumber": "ZZOWNER100", "owner": "Jon Smith", "ownerPhone": "555-0100"},
                    {"id": "b2", "callName": "OwnerTestNova", "registeredName": "Owner Test Nova Four", "registrationNumber": "ZZOWNER400", "owner": "Jones, Mary"},
                ],
            },
        ]

    def test_similarity_and_threshold_control(self):
        self.assertEqual(server.owner_name_similarity("Mary Jones", "Jones, Mary"), 100)
        self.assertGreaterEqual(server.owner_name_similarity("John Smith", "Jon Smith"), 90)
        strict = server.owner_report_records(self.trials(), 100)
        close = server.owner_report_records(self.trials(), 90)
        self.assertEqual(len(strict["owners"]), 3)
        self.assertEqual(len(close["owners"]), 2)
        self.assertEqual(len(close["missingEntries"]), 1)

    def test_same_hound_across_trials_counts_once(self):
        report = server.owner_report_records(self.trials(), 90)
        smith = next(group for group in report["owners"] if "Smith" in group["name"])
        self.assertEqual(smith["entryCount"], 2)
        self.assertEqual(len(smith["hounds"]), 1)
        self.assertEqual(len(smith["trials"]), 2)
        self.assertEqual(set(smith["aliases"]), {"John Smith", "Jon Smith"})

    def test_pdf_lists_matches_and_missing_owner(self):
        pdf = server.generate_owner_report_pdf(self.trials(), 90)
        text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(pdf)).pages)
        self.assertIn("TRIAL OWNER LIST", text)
        self.assertIn("Matched spellings", text)
        self.assertIn("John Smith", text)
        self.assertIn("Jon Smith", text)
        self.assertIn("OWNER NAME MISSING", text)
        self.assertIn("OwnerTestUnknown", text)


if __name__ == "__main__":
    unittest.main()
