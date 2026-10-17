import io
import json
import unittest

from pypdf import PdfReader

import server


class AkcDrawSheetOrderTests(unittest.TestCase):
    def test_specialty_draw_prints_open_specials_veteran_without_changing_trial(self):
        trial = {
            "association": "AKC",
            "trialName": "Ridgeback National",
            "clubName": "National Ridgeback Club",
            "startsOn": "2026-10-17",
            "runPlan": [{"breed": "RR", "runOrder": 1}],
            "preliminaryDraw": {"groups": [
                self.group("Veteran", "VeteranDog"),
                self.group("Specials", "SpecialDog"),
                self.group("Open", "OpenDog"),
            ]},
        }
        before = json.dumps(trial, sort_keys=True)

        ordered = server.draw_groups_for_print(trial)
        self.assertEqual([group["stake"] for group in ordered], ["Open", "Specials", "Veteran"])

        pages = PdfReader(io.BytesIO(server.generate_draw_sheet_pdf(trial))).pages
        text = "\n".join(page.extract_text() or "" for page in pages)
        self.assertLess(text.index("OpenDog"), text.index("SpecialDog"))
        self.assertLess(text.index("SpecialDog"), text.index("VeteranDog"))
        self.assertEqual(json.dumps(trial, sort_keys=True), before)

    @staticmethod
    def group(stake, call_name):
        return {
            "breed": "RR",
            "stake": stake,
            "flight": "A",
            "courses": [{
                "number": 1,
                "hounds": [{
                    "drawPosition": 1,
                    "blanketColor": "Yellow",
                    "callName": call_name,
                }],
            }],
        }


if __name__ == "__main__":
    unittest.main()
