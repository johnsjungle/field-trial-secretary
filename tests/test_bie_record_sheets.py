import io
import unittest

from pypdf import PdfReader

import server


def hound(entry_id, name, color):
    return {
        "entryId": entry_id,
        "callName": name,
        "registeredName": name + " Registered",
        "registrationNumber": "REG-" + entry_id,
        "breed": "WH",
        "bifBlanketColor": color,
    }


class BieRecordSheetTests(unittest.TestCase):
    def trial(self):
        first = {
            "number": 1,
            "draw": {"courses": [{"number": 1, "hounds": [hound("a", "Alpha", "YELLOW"), hound("b", "Bravo", "PINK")]}]},
            "outcomes": {
                "a": {"judge1": "45", "judge2": "47", "score": "92"},
                "b": {"judge1": "44", "judge2": "45", "score": "89"},
            },
        }
        return {
            "id": "trial",
            "association": "ASFA",
            "clubName": "Test Club",
            "startsOn": "2026-09-13",
            "entries": [],
            "scorebook": {"bif": {
                "eventType": "BIE",
                "elimination": True,
                "roundHistory": [first],
                "draw": {"courses": [{"number": 1, "hounds": [hound("a", "Alpha", "YELLOW")]}]},
                "outcomes": {"a": {"judge1": "48", "judge2": "49", "score": "97"}},
                "finalWinner": "a",
                "judge1": "Judge One",
                "judge2": "Judge Two",
            }},
        }

    def test_bie_filter_returns_every_scored_round(self):
        trial = self.trial()
        groups = server.record_groups_for_print(trial, breed="BIE")
        self.assertEqual([group["stake"] for group in groups], ["BIE Round 1", "BIE Round 2"])
        first_rows = server.asfa_record_rows(trial, groups[0])
        final_rows = server.asfa_record_rows(trial, groups[1])
        self.assertEqual([row["prelimScore"] for row in first_rows], ["92", "89"])
        self.assertTrue(all(not row["placement"] for row in first_rows))
        self.assertEqual(final_rows[0]["prelimScore"], "97")
        self.assertEqual(final_rows[0]["placement"], "BIE")

    def test_bie_record_pdf_has_one_page_per_round(self):
        pdf = server.generate_asfa_record_sheet_pdf(self.trial(), breed="BIE")
        reader = PdfReader(io.BytesIO(pdf))
        self.assertEqual(len(reader.pages), 2)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        self.assertIn("BIE Round 1", text)
        self.assertIn("BIE Round 2", text)


if __name__ == "__main__":
    unittest.main()

