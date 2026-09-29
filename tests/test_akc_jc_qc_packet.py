import io
import unittest
from unittest.mock import patch

from pypdf import PdfReader

import server


def test_entry(entry_id, name, test_type, result, judge, order):
    return {
        "id": entry_id,
        "runOrder": order,
        "callName": name,
        "registeredName": name + " Has A Long Registered Name",
        "breed": "WH",
        "registrationNumber": "HP-" + entry_id,
        "testType": test_type,
        "result": result,
        "judgeName": judge,
    }


class AkcJcQcPacketTests(unittest.TestCase):
    def trial(self):
        return {
            "association": "AKC",
            "clubName": "Test Club",
            "startsOn": "2026-09-29",
            "eventNumber": "2026999901",
            "secretaryName": "Trial Secretary",
            "akcTests": [
                test_entry("1", "Alpha", "JC", "pass", "Judge One", 1),
                test_entry("2", "Bravo", "QC", "fail", "Judge One", 2),
                test_entry("3", "Charlie", "JC", "pending", "Judge Two", 3),
            ],
        }

    def test_official_test_sheet_groups_by_judge_and_flattens(self):
        reader = PdfReader(io.BytesIO(server.generate_akc_test_record_sheet_pdf(self.trial())))
        self.assertEqual(len(reader.pages), 2)
        self.assertFalse(reader.trailer["/Root"].get("/AcroForm"))
        self.assertTrue(all(not page.get("/Annots") for page in reader.pages))
        first = reader.pages[0].extract_text() or ""
        second = reader.pages[1].extract_text() or ""
        self.assertIn("Judge One", first)
        self.assertIn("Alpha", first)
        self.assertIn("Bravo", first)
        self.assertIn("JC", first)
        self.assertIn("QC", first)
        self.assertIn("Judge Two", second)
        self.assertIn("Charlie", second)

    def test_test_pages_precede_regular_scoresheets(self):
        group = {"id": "regular", "breed": "WH", "stake": "Open", "courses": [{}]}
        row = {
            "callName": "RegularDog",
            "registeredName": "Regular Dog Registered",
            "registrationNumber": "HP-REG",
            "prelimCode": "1Y",
            "prelimJudge1": "75",
            "prelimScore": "75",
        }
        with patch.object(server, "record_groups_for_print", return_value=[group]), patch.object(server, "asfa_record_rows", return_value=[row]), patch.object(server, "judges_for_group", return_value=("Judge Three", "")):
            reader = PdfReader(io.BytesIO(server.generate_akc_record_sheet_pdf(self.trial())))
        self.assertEqual(len(reader.pages), 3)
        self.assertIn("Alpha", reader.pages[0].extract_text() or "")
        self.assertIn("Charlie", reader.pages[1].extract_text() or "")
        self.assertIn("RegularDog", reader.pages[2].extract_text() or "")

    def test_test_only_packet_is_allowed(self):
        with patch.object(server, "record_groups_for_print", return_value=[]):
            reader = PdfReader(io.BytesIO(server.generate_akc_record_sheet_pdf(self.trial())))
        self.assertEqual(len(reader.pages), 2)


if __name__ == "__main__":
    unittest.main()