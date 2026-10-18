import io
import unittest

from pypdf import PdfReader

import server


def pdf_text(data: bytes) -> str:
    return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)


class HuntmasterRunoffTests(unittest.TestCase):
    def test_runoff_judge_courses_exclude_forfeits_and_keep_manual_blankets(self):
        trial = {
            "runPlan": [{"breed": "RR", "judge1": "Judge One"}],
            "preliminaryDraw": {
                "groups": [{
                    "id": "rr-open",
                    "breed": "RR",
                    "stake": "Open",
                    "runoffs": [{
                        "key": "1-2TIE-300",
                        "label": "1-2 Tie",
                        "courses": [{
                            "number": 1,
                            "hounds": [
                                {"entryId": "open", "drawPosition": 1, "tieBreakBlanketColor": "Yellow"},
                                {"entryId": "forfeit", "drawPosition": 2, "tieBreakBlanketColor": "Pink", "tieBreakOutcome": "forfeit"},
                                {"entryId": "vet", "drawPosition": 3, "tieBreakBlanketColor": "Blue", "manuallyMoved": True},
                            ],
                        }],
                    }],
                }],
            },
        }

        courses = server.flatten_runoff_judge_courses(trial, "rr-open", "1-2TIE-300")

        self.assertEqual(len(courses), 1)
        self.assertEqual([hound["entryId"] for hound in courses[0]["hounds"]], ["open", "vet"])
        self.assertEqual(courses[0]["hounds"][1]["blanketColor"], "Blue")

    def test_bob_runoff_uses_bob_instead_of_mixed_stake(self):
        group = {
            "breed": "1. RR",
            "judgeBreed": "RR",
            "stake": "BOB",
            "drawStake": "BOB",
            "phase": "bob",
            "mixedStake": True,
            "courses": [{"number": 1, "hounds": []}],
        }
        block = server.flatten_draw_courses([group])[0]
        self.assertEqual(block["stake"], "BOB")
        self.assertTrue(block["mixedStake"])

    def test_bie_and_bif_hound_names_include_breed_initials(self):
        long_name = server.draw_sheet_hound_name(
            {"callName": "An Exceptionally Long Call Name", "breed": "Ibizan Hound"},
            {"breed": "BIE", "phase": "bie", "stake": "BIE"},
            23,
        )
        self.assertTrue(long_name.endswith("(IB)"))
        self.assertLessEqual(len(long_name), 23)
        self.assertEqual(
            server.draw_sheet_hound_name(
                {"callName": "Swift", "breed": "WH"},
                {"breed": "BIF", "phase": "bif", "stake": "BIF"},
            ),
            "Swift (WH)",
        )

    def test_bie_huntmaster_pdf_prints_breed_initials(self):
        trial = {
            "association": "ASFA",
            "trialName": "Grand Prix",
            "clubName": "Test Club",
            "startsOn": "2026-09-28",
            "preliminaryDraw": {
                "phase": "bie",
                "groups": [{
                    "breed": "BIE",
                    "stake": "BIE",
                    "phase": "bie",
                    "courses": [{
                        "number": 1,
                        "hounds": [
                            {"drawPosition": 1, "blanketColor": "Yellow", "callName": "Axel", "breed": "Ibizan Hound"},
                            {"drawPosition": 2, "blanketColor": "Pink", "callName": "Swift", "breed": "WH"},
                        ],
                    }],
                }],
            },
        }
        text = pdf_text(server.generate_draw_sheet_pdf(trial))
        self.assertIn("Axel (IB)", text)
        self.assertIn("Swift (WH)", text)


if __name__ == "__main__":
    unittest.main()
