import unittest
import sys
import types

sys.modules.setdefault("pdfplumber", types.SimpleNamespace())
import server


class FinalsStakeCorrectionTests(unittest.TestCase):
    def test_record_rows_move_to_corrected_stake_without_losing_prelim_scores(self):
        groups = [{
            "id": "rr-open",
            "breed": "RR",
            "stake": "Open",
            "courses": [{
                "number": 2,
                "hounds": [{
                    "entryId": "moved",
                    "stake": "Open",
                    "finalsStake": "Specials",
                    "blanketColor": "Pink",
                    "prelimScore": "149",
                }],
            }],
        }, {
            "id": "rr-specials",
            "breed": "RR",
            "stake": "Specials",
            "courses": [],
        }]

        trial = {
            "association": "ASFA",
            "entries": [{
                "id": "moved",
                "callName": "Roger",
                "registrationNumber": "HP62644602",
                "className": "Specials",
            }],
        }
        groups[1]["finalDraw"] = {
            "courses": [{
                "number": 1,
                "hounds": [{
                    "entryId": "moved",
                    "blanketColor": "Yellow",
                    "finalJudge1Score": "76",
                    "finalJudge2Score": "74",
                    "finalScore": "150",
                    "combinedScore": "299",
                }],
            }],
        }

        corrected = server.record_groups_with_corrected_stakes(trial, groups)
        open_group = next(group for group in corrected if group["id"] == "rr-open")
        specials_group = next(group for group in corrected if group["id"] == "rr-specials")
        self.assertEqual(open_group["courses"][0]["hounds"], [])
        moved = specials_group["courses"][0]["hounds"][0]
        self.assertEqual(moved["prelimScore"], "149")
        self.assertEqual(moved["blanketColor"], "Pink")
        self.assertEqual(specials_group["courses"][0]["number"], 2)
        row = server.asfa_record_rows(trial, specials_group)[0]
        self.assertEqual(row["prelimScore"], "149")
        self.assertEqual(row["finalCode"], "1Y")
        self.assertEqual(row["finalJudge1"], "76")
        self.assertEqual(row["finalJudge2"], "74")
        self.assertEqual(row["finalScore"], "150")
        self.assertEqual(row["combinedScore"], "299")

    def test_entry_stake_is_used_when_older_correction_has_no_finals_stake_marker(self):
        trial = {"entries": [{"id": "moved", "className": "Veteran"}]}
        groups = [{
            "id": "ah-open",
            "breed": "AH",
            "stake": "Open",
            "courses": [{"number": 1, "hounds": [{"entryId": "moved", "prelimScore": "152"}]}],
        }, {
            "id": "ah-veteran",
            "breed": "AH",
            "stake": "Veteran",
            "courses": [],
        }]

        corrected = server.record_groups_with_corrected_stakes(trial, groups)
        open_group = next(group for group in corrected if group["id"] == "ah-open")
        veteran_group = next(group for group in corrected if group["id"] == "ah-veteran")
        self.assertEqual(open_group["courses"][0]["hounds"], [])
        self.assertEqual(veteran_group["courses"][0]["hounds"][0]["prelimScore"], "152")


if __name__ == "__main__":
    unittest.main()
