import io
import unittest
from unittest.mock import patch

from pypdf import PdfReader

import server


class AkcPostingAndFormsTests(unittest.TestCase):
    def trial(self):
        return {
            "association": "AKC",
            "clubName": "Unique AKC Club 7421",
            "startsOn": "2026-10-07",
            "endsOn": "2026-10-07",
            "eventNumber": "AKC-EVT-7421",
            "secretaryName": "Secretary Sample",
            "trialChair": "Chair Sample",
            "entries": [],
        }

    def test_akc_runoff_judge_overlay_names_tie_and_stake(self):
        pdf = server.build_akc_judge_overlay(self.trial(), {
            "breed": "RR", "stake": "Specials", "flight": "A", "phase": "runoff",
            "course": 1, "runoffText": "2-3 Tie", "judge": "Judge Sample",
            "judgeIndex": 1, "hounds": [],
        })
        text = PdfReader(io.BytesIO(pdf)).pages[0].extract_text() or ""
        self.assertIn("RUNOFF FOR 2-3 TIE - SPECIALS", text)

    def test_akc_record_sheet_prints_tie_draw_placements_and_officers(self):
        group = {"id": "rr-specials", "breed": "RR", "stake": "Specials", "flight": "A", "courses": [{}]}
        row = {
            "callName": "Halo", "registeredName": "Halo Test Hound",
            "registrationNumber": "HP-7421", "prelimCode": "1Y",
            "prelimJudge1": "75", "prelimScore": "75", "finalCode": "1P",
            "finalJudge1": "76", "finalScore": "76", "combinedScore": "151",
            "placement": "2-3 Tie", "stakesRunoffDraw": "1Y",
        }
        with patch.object(server, "record_groups_for_print", return_value=[group]), \
             patch.object(server, "asfa_record_rows", return_value=[row]), \
             patch.object(server, "judges_for_group", return_value=("Judge Sample", "")):
            reader = PdfReader(io.BytesIO(server.generate_akc_record_sheet_pdf(self.trial())))
        text = (reader.pages[0].extract_text() or "").replace("\x00", "")
        self.assertIn("AKC-EVT-7421", text)
        self.assertIn("T2-3", text)
        self.assertIn("1Y", text)
        self.assertIn("Secretary Sample", text)
        self.assertIn("Chair Sample", text)

    def test_akc_record_rows_keep_pending_tie_placement(self):
        trial = self.trial()
        trial["entries"] = [
            {"id": "dog-0", "callName": "Winner", "registrationNumber": "HP-0"},
            {"id": "dog-1", "callName": "Halo", "registrationNumber": "HP-1"},
            {"id": "dog-2", "callName": "Comet", "registrationNumber": "HP-2"},
        ]
        trial["runPlan"] = [{"breed": "RR", "judge1": "Judge Sample"}]
        group = {
            "id": "rr-specials", "breed": "RR", "stake": "Specials",
            "courses": [{"number": 1, "hounds": [
                {"entryId": "dog-0", "prelimScore": "80", "blanketColor": "Yellow"},
                {"entryId": "dog-1", "prelimScore": "75", "blanketColor": "Pink"},
                {"entryId": "dog-2", "prelimScore": "74", "blanketColor": "Blue"},
            ]}],
            "finalDraw": {"courses": [{"number": 1, "hounds": [
                {"entryId": "dog-0", "finalScore": "80", "combinedScore": "160", "placement": "1", "finalBlanketColor": "Yellow"},
                {"entryId": "dog-1", "finalScore": "76", "combinedScore": "151", "placement": "2-3 Tie", "finalBlanketColor": "Pink"},
                {"entryId": "dog-2", "finalScore": "77", "combinedScore": "151", "placement": "2-3 Tie", "finalBlanketColor": "Blue"},
            ]}]},
            "runoffs": [{"key": "2-3-tie-151", "label": "2-3 Tie", "courses": [{
                "number": 2, "hounds": [
                    {"entryId": "dog-1", "tieBreakBlanketColor": "Yellow"},
                    {"entryId": "dog-2", "tieBreakBlanketColor": "Pink"},
                ],
            }]}],
        }
        rows = {row["callName"]: row for row in server.asfa_record_rows(trial, group)}
        self.assertEqual(rows["Halo"]["placement"], "2-3 Tie")
        self.assertEqual(rows["Halo"]["stakesRunoffDraw"], "2Y")
        self.assertEqual(rows["Comet"]["placement"], "2-3 Tie")
        self.assertEqual(rows["Comet"]["stakesRunoffDraw"], "2P")

    def test_stake_runoff_box_includes_course_and_blanket_draw(self):
        group = {
            "id": "rr-specials", "breed": "RR", "stake": "Specials",
            "courses": [{"number": 1, "hounds": [{"entryId": "dog-1"}]}],
            "finalDraw": {"courses": [{"number": 1, "hounds": [
                {"entryId": "dog-0", "combinedScore": "160", "placement": "1"},
                {"entryId": "dog-1", "combinedScore": "151", "placement": "2-3 Tie"},
                {"entryId": "dog-2", "combinedScore": "151", "placement": "2-3 Tie"},
            ]}]},
            "runoffs": [{"key": "2-3-tie-151", "label": "2-3 Tie", "courses": [{
                "number": 2, "hounds": [{"entryId": "dog-1", "tieBreakBlanketColor": "Pink"}],
            }]}],
        }
        boxes = server.stake_runoff_boxes_by_entry(self.trial(), group)
        self.assertEqual(boxes["dog-1"]["label"], "2-3")
        self.assertEqual(boxes["dog-1"]["draw"], "2P")

    def test_akc_secretary_report_is_static_and_not_double_drawn(self):
        reader = PdfReader(io.BytesIO(server.generate_akc_secretary_report_pdf(self.trial())))
        self.assertFalse(reader.trailer["/Root"].get("/AcroForm"))
        self.assertTrue(all(not page.get("/Annots") for page in reader.pages))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        self.assertEqual(text.count("Unique AKC Club 7421"), 1)
        self.assertEqual(text.count("AKC-EVT-7421"), 1)


if __name__ == "__main__":
    unittest.main()
