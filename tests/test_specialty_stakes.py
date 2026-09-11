import copy
import io
import unittest
import server
from pypdf import PdfReader


def fixture():
    entries = [{"id": str(i), "houndId": "hound-" + str(i), "callName": name, "registeredName": "Champion " + name, "breed": "RR", "className": "Open", "owner": "Sample Owner", "breeder": "Sample Breeder", "additionalBreeder": True, "additionalKennel": True, "additionalBench": True, "specialtyBreederPartnerId": str(i + 1 if i % 2 else i - 1), "specialtyKennelPartnerId": str(i + 1 if i % 2 else i - 1)} for i, name in enumerate(["Ada", "Mia", "Delta", "Rae", "Solo"], 1)]
    prelim = [{"entryId": e["id"], "prelimScore": "150"} for e in entries]
    finals = [{"entryId": e["id"], "finalScore": "160", "combinedScore": "999", "tieBreakCombinedScore": "1000"} for e in entries]
    return {"id": "specialty-test", "trialName": "Specialty Sample Trial", "clubName": "Sample Club", "startsOn": "2026-09-10", "association": "AKC", "entries": entries, "preliminaryDraw": {"groups": [{"breed": "RR", "courses": [{"hounds": prelim}], "finalDraw": {"courses": [{"hounds": finals}]}}]}}


class SpecialtyTests(unittest.TestCase):
    def test_pairs_once_and_ties(self):
        t=fixture(); original=copy.deepcopy(t); rows=server.specialty_records(t,"Breeder")
        self.assertEqual(len(rows),3); self.assertEqual([r["total"] for r in rows],[620,620,None]); self.assertEqual([r["rank"] for r in rows],["T1","T1",""]); self.assertEqual(t,original)
    def test_no_runoff_or_stored_combined_scores(self):
        t=fixture(); self.assertEqual(server.specialty_score(t,t["entries"][0])["total"],310)
    def test_zero_missing_and_outcomes(self):
        t=fixture(); g=t["preliminaryDraw"]["groups"][0]; g["courses"][0]["hounds"][0]["prelimScore"]=0; g["finalDraw"]["courses"][0]["hounds"][0]["finalScore"]=0
        self.assertEqual(server.specialty_score(t,t["entries"][0])["total"],0)
        for value in ("",None,"NaN","Infinity"):
            g["finalDraw"]["courses"][0]["hounds"][0]["finalScore"]=value
            self.assertIsNone(server.specialty_records(t,"Breeder")[0]["total"])
        g["finalDraw"]["courses"][0]["hounds"][0].update(finalScore="160", finalOutcome="dismissed")
        self.assertIsNone(server.specialty_records(t,"Breeder")[0]["total"])
    def test_invalid_pair_and_removed_flags(self):
        for change in ({"breed":"WH"},{"additionalBreeder":False},{"specialtyBreederPartnerId":"3"},{"houndId":"hound-1"}):
            t=fixture();t["entries"][1].update(change);self.assertIsNone(server.specialty_records(t,"Breeder")[0]["total"])
    def test_independent_stakes_and_trial_scope(self):
        t=fixture();t["entries"][0]["specialtyKennelPartnerId"]="";self.assertIsNone(server.specialty_records(t,"Kennel")[0]["total"]);self.assertEqual(server.specialty_records(t,"Breeder")[0]["total"],620)
        self.assertEqual(len(server.specialty_records(t,"Bench")),5)
    def test_scratched_not_ranked(self):
        t=fixture();t["entries"][0]["rollCallStatus"]="scratched";r=server.specialty_records(t,"Breeder")[0];self.assertIsNone(r["total"]);self.assertEqual(r["rank"],"")
    def test_pdf_contents_and_empty(self):
        t=fixture()
        for results in (False,True):
            reader=PdfReader(io.BytesIO(server.generate_specialty_pdf([t],results))); text="\n".join(p.extract_text() for p in reader.pages)
            self.assertIn("DUAL CHAMPION STAKE",text);self.assertIn("BREEDER STAKE",text);self.assertIn("KENNEL STAKE",text);self.assertIn("Needs a valid partner",text)
            if results:self.assertIn("620",text)
        with self.assertRaises(ValueError):server.generate_specialty_pdf([{"entries":[]}])

if __name__ == "__main__":unittest.main()