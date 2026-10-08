import io
import unittest

from pypdf import PdfReader

import server


class RecordSheetOutcomeTests(unittest.TestCase):
    def trial(self, association="ASFA"):
        return {
            "association": association,
            "clubName": "Outcome Test Club",
            "startsOn": "2026-10-07",
            "eventNumber": "OUTCOME-100",
            "secretaryName": "Secretary Sample",
            "trialChair": "Chair Sample",
            "fieldClerk": "Clerk Sample",
            "entries": [
                {
                    "id": "runner",
                    "callName": "Runner",
                    "registeredName": "Runner Registered",
                    "registrationNumber": "HP100",
                    "breed": "RR",
                    "className": "Open",
                    "rollCallStatus": "present",
                },
                {
                    "id": "lame-before-draw",
                    "callName": "LameDog",
                    "registeredName": "Lame Dog Registered",
                    "registrationNumber": "HP101",
                    "breed": "RR",
                    "className": "Open",
                    "rollCallStatus": "lame",
                },
                {
                    "id": "absent-before-draw",
                    "callName": "AbsentDog",
                    "registeredName": "Absent Dog Registered",
                    "registrationNumber": "HP102",
                    "breed": "RR",
                    "className": "Open",
                    "rollCallStatus": "absent",
                },
            ],
            "runPlan": [{"breed": "RR", "judge1": "Judge Sample"}],
            "preliminaryDraw": {
                "groups": [{
                    "id": "rr-open",
                    "breed": "RR",
                    "stake": "Open",
                    "flight": "A",
                    "courses": [{
                        "number": 1,
                        "hounds": [{
                            "entryId": "runner",
                            "callName": "Runner",
                            "registeredName": "Runner Registered",
                            "registrationNumber": "HP100",
                            "blanketColor": "Yellow",
                            "prelimJudge1Score": "75",
                            "prelimScore": "75",
                        }],
                    }],
                    "finalDraw": {"courses": [{
                        "number": 1,
                        "hounds": [{
                            "entryId": "runner",
                            "blanketColor": "Yellow",
                            "finalOutcome": "lame",
                        }],
                    }]},
                }],
            },
        }

    def test_unavailable_entries_are_retained_and_labeled(self):
        trial = self.trial()
        groups = server.record_groups_for_print(trial)
        self.assertEqual(len(groups), 1)
        rows = {row["callName"]: row for row in server.asfa_record_rows(trial, groups[0])}
        self.assertEqual(set(rows), {"Runner", "LameDog", "AbsentDog"})
        self.assertEqual(rows["LameDog"]["prelimScore"], "LAME")
        self.assertEqual(rows["AbsentDog"]["prelimScore"], "ABS")
        self.assertEqual(rows["Runner"]["finalScore"], "LAME")
        self.assertEqual(server.asfa_record_strike_reason(rows["LameDog"]), "LAME")
        self.assertEqual(server.asfa_record_strike_reason(rows["AbsentDog"]), "ABSENT")
        self.assertFalse(server.record_row_is_starter(rows["LameDog"]))
        self.assertFalse(server.record_row_is_starter(rows["AbsentDog"]))
        self.assertTrue(server.record_row_is_starter(rows["Runner"]))

    def test_all_unavailable_stake_still_gets_a_record_group(self):
        trial = self.trial()
        trial["entries"] = [trial["entries"][1]]
        trial["preliminaryDraw"] = {"groups": []}
        groups = server.record_groups_for_print(trial)
        self.assertEqual(len(groups), 1)
        self.assertEqual(groups[0]["breed"], "RR")
        self.assertEqual(groups[0]["stake"], "Open")
        rows = server.asfa_record_rows(trial, groups[0])
        self.assertEqual(rows[0]["callName"], "LameDog")
        self.assertEqual(rows[0]["prelimScore"], "LAME")

    def test_every_supported_status_has_printable_record_text(self):
        scoring_outcomes = {
            "lame": "LAME",
            "excused": "EXC",
            "dismissed": "DIS",
            "disqualified": "DQ",
            "forfeit": "FOR",
            "pull": "PUL",
            "no_score": "NS",
        }
        for outcome, expected in scoring_outcomes.items():
            with self.subTest(scoring_outcome=outcome):
                self.assertEqual(server.score_or_outcome("", outcome), expected)

        roll_call_outcomes = {
            "absent": ("ABS", "ABSENT"),
            "lame": ("LAME", "LAME"),
            "in_season": ("SEASON", "IN SEASON"),
            "breed_dq": ("BDQ", "BREED DQ"),
            "scratched": ("SCR", "SCRATCHED"),
            "excused": ("EXC", "EXCUSED"),
        }
        for status, (score_text, strike_text) in roll_call_outcomes.items():
            with self.subTest(roll_call_status=status):
                self.assertEqual(server.score_or_outcome("", "", status), score_text)
                self.assertEqual(server.record_roll_call_outcome_label(status), strike_text)

    def test_asfa_and_akc_pdfs_print_outcome_labels(self):
        for association in ("ASFA", "AKC"):
            with self.subTest(association=association):
                pdf = server.generate_asfa_record_sheet_pdf(self.trial(association))
                text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(pdf)).pages)
                self.assertIn("LameDog", text)
                self.assertIn("LAME", text)
                self.assertIn("AbsentDog", text)
                self.assertTrue("ABSENT" in text or "ABS" in text)


if __name__ == "__main__":
    unittest.main()
