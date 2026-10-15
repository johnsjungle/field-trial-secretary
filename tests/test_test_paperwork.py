import copy
import io
import unittest

from pypdf import PdfReader

import server


class FilledTestPaperworkTests(unittest.TestCase):
    def test_asfa_packet_uses_sample_data_and_all_alignment_forms(self):
        source = {"association": "ASFA", "clubName": "Selected ASFA Club", "eventNumber": "ASFA-TEST-77"}
        original = copy.deepcopy(source)
        reader = PdfReader(io.BytesIO(server.generate_test_paperwork_pdf(source, {})))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        self.assertEqual(source, original)
        self.assertGreaterEqual(len(reader.pages), 13)
        self.assertIn("SAMPLE DATA FOR ALIGNMENT REVIEW", text)
        self.assertIn("Selected ASFA Club", text)
        self.assertIn("Halo", text)
        self.assertIn("AlignmentHound45", text)
        self.assertIn("Swift", text)
        self.assertIn("ASFA FIELD TRIAL SECRETARY REPORT", text)

        sample = server.build_test_paperwork_trial("ASFA")
        self.assertEqual(len(sample["entries"]), 47)
        self.assertEqual(len(sample["preliminaryDraw"]["groups"][0]["courses"]), 15)

    def test_akc_packet_includes_trial_and_jc_qc_forms(self):
        source = {"association": "AKC", "clubName": "Selected AKC Club", "eventNumber": "AKC-TEST-88"}
        reader = PdfReader(io.BytesIO(server.generate_test_paperwork_pdf(source, {})))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        self.assertGreaterEqual(len(reader.pages), 11)
        self.assertIn("SAMPLE DATA FOR ALIGNMENT REVIEW", text)
        self.assertIn("Selected AKC Club", text)
        self.assertIn("AKC-TEST-88", text)
        self.assertIn("AlignmentHound45", text)
        self.assertIn("QUALIFIED COURSER/JUNIOR COURSER", text)
        self.assertIn("Qualified Courser Certificate", text)
        self.assertIn("JUDGES", text.upper())

        sample = server.build_test_paperwork_trial("AKC")
        self.assertEqual(len(sample["entries"]), 45)
        self.assertEqual(len(sample["preliminaryDraw"]["groups"][0]["courses"]), 15)


if __name__ == "__main__":
    unittest.main()
