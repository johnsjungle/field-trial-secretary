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
                "a": {"judge1": "45", "judge2": "47", "judge3": "46", "judge4": "48", "judge5": "49", "judge6": "50", "score": "285"},
                "b": {"judge1": "44", "judge2": "45", "judge3": "43", "judge4": "46", "judge5": "47", "judge6": "48", "score": "273"},
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
                "preQualifierHistory": [first],
                "roundHistory": [first],
                "draw": {"courses": [{"number": 1, "hounds": [hound("a", "Alpha", "YELLOW")]}]},
                "outcomes": {"a": {"judge1": "48", "judge2": "49", "judge3": "47", "judge4": "50", "judge5": "48", "judge6": "49", "score": "291"}},
                "finalWinner": "a",
                "judge1": "Judge One",
                "judge2": "Judge Two",
                "judge3": "Judge Three",
                "judge4": "Judge Four",
                "judge5": "Judge Five",
                "judge6": "Judge Six",
            }},
        }

    def test_bie_filter_returns_every_scored_round(self):
        trial = self.trial()
        groups = server.record_groups_for_print(trial, breed="BIE")
        self.assertEqual([group["stake"] for group in groups], ["BIE Pre-Qual 1", "BIE Round 1", "BIE Round 2"])
        first_rows = server.asfa_record_rows(trial, groups[0])
        final_rows = server.asfa_record_rows(trial, groups[-1])
        self.assertEqual([row["prelimScore"] for row in first_rows], ["285", "273"])
        self.assertEqual(first_rows[0]["judgeScores"], ["45", "47", "46", "48", "49", "50"])
        self.assertTrue(all(not row["placement"] for row in first_rows))
        self.assertEqual(final_rows[0]["prelimScore"], "291")
        self.assertEqual(final_rows[0]["placement"], "BIE")

    def test_bie_record_pdf_has_one_page_per_round(self):
        pdf = server.generate_asfa_record_sheet_pdf(self.trial(), breed="BIE")
        reader = PdfReader(io.BytesIO(pdf))
        self.assertEqual(len(reader.pages), 6)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        self.assertIn("BIE Pre-Qual 1", text)
        self.assertIn("BIE Round 1", text)
        self.assertIn("BIE Round 2", text)
        self.assertIn("BIE Judge Score Detail", text)
        self.assertIn("J6: Judge Six", text)
        self.assertIn("291", text)


    def test_qualifier_judge_metadata_is_visible(self):
        trial = self.trial()
        trial["scorebook"]["bif"]["biePhase"] = "prequalifier"
        courses = server.flatten_bif_judge_courses(trial)
        self.assertTrue(courses)
        self.assertEqual(courses[0]["stake"], "BIE Pre-Qualifier")
        self.assertEqual(courses[0]["runoffText"], "PRE-QUAL")
        self.assertEqual(courses[0]["phase"], "bie")
        self.assertEqual(courses[0]["judges"], ["Judge One", "Judge Two", "Judge Three", "Judge Four", "Judge Five", "Judge Six"])
        self.assertEqual(len(server.flatten_asfa_judge_forms(courses)), 6)


if __name__ == "__main__":
    unittest.main()
