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

        corrected = server.record_groups_with_corrected_stakes(groups)
        open_group = next(group for group in corrected if group["id"] == "rr-open")
        specials_group = next(group for group in corrected if group["id"] == "rr-specials")
        self.assertEqual(open_group["courses"][0]["hounds"], [])
        moved = specials_group["courses"][0]["hounds"][0]
        self.assertEqual(moved["prelimScore"], "149")
        self.assertEqual(moved["blanketColor"], "Pink")
        self.assertEqual(specials_group["courses"][0]["number"], 2)


if __name__ == "__main__":
    unittest.main()
