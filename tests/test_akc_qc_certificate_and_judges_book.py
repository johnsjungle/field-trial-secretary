import io
import unittest
from unittest.mock import patch

from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

import server


def labeled_pdf(label):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.drawString(72, 720, label)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


class AkcQcCertificateAndJudgesBookTests(unittest.TestCase):
    def trial(self):
        return {
            "association": "AKC",
            "clubName": "Test Coursing Club",
            "siteName": "Green Field",
            "startsOn": "2026-09-30",
            "eventNumber": "2026999902",
            "secretaryName": "Trial Secretary",
            "judges": [{
                "name": "Judge One",
                "number": "12345",
                "address": "100 Main Street",
                "city": "Raleigh",
                "state": "NC",
                "postalCode": "27601",
                "phone": "919-555-0100",
            }],
            "akcTests": [{
                "id": "qc-1",
                "runOrder": 1,
                "callName": "Dash",
                "registeredName": "Dash Registered Name",
                "breed": "WH",
                "registrationNumber": "HP123456",
                "testType": "QC",
                "result": "pass",
                "owner": "Owner One",
                "handler": "Agent One",
                "judgeName": "Judge One",
                "judgeNumber": "12345",
            }],
        }

    def test_qc_certificate_prefills_identity_and_preserves_signature_lines(self):
        reader = PdfReader(io.BytesIO(server.generate_akc_qc_certificate_pdf(self.trial(), "qc-1")))
        self.assertEqual(len(reader.pages), 1)
        self.assertFalse(reader.pages[0].get("/Annots"))
        text = reader.pages[0].extract_text() or ""
        for expected in ("Whippet", "Dash", "Dash Registered Name", "HP123456", "Agent One", "Judge One", "12345", "2026-09-30"):
            self.assertIn(expected, text)
        self.assertIn("Judge’s Signature", text)

    def test_failed_qc_does_not_create_certificate(self):
        trial = self.trial()
        trial["akcTests"][0]["result"] = "fail"
        with self.assertRaisesRegex(ValueError, "cannot be printed"):
            server.generate_akc_qc_certificate_pdf(trial, "qc-1")

    def test_judges_book_cover_prefills_event_and_judge_contacts(self):
        reader = PdfReader(io.BytesIO(server.generate_akc_judges_book_cover_pdf(self.trial())))
        self.assertEqual(len(reader.pages), 1)
        self.assertFalse(reader.pages[0].get("/Annots"))
        text = reader.pages[0].extract_text() or ""
        for expected in ("Test Coursing Club", "2026999902", "Green Field", "Judge One", "100 Main Street", "Raleigh, NC 27601", "919-555-0100"):
            self.assertIn(expected, text)

    def test_submission_packet_starts_with_secretary_cover_and_test_records(self):
        trial = self.trial()
        group = {"id": "regular", "breed": "WH", "stake": "Open", "courses": [{}]}
        row = {
            "callName": "RegularDog",
            "registeredName": "Regular Dog Registered",
            "registrationNumber": "HP-REG",
            "prelimCode": "1Y",
            "prelimJudge1": "75",
            "prelimScore": "75",
        }
        with patch.object(server, "record_groups_for_print", return_value=[group]), \
             patch.object(server, "asfa_record_rows", return_value=[row]), \
             patch.object(server, "judges_for_group", return_value=("Judge One", "")), \
             patch.object(server, "generate_akc_secretary_report_pdf", return_value=labeled_pdf("SECRETARY REPORT")):
            reader = PdfReader(io.BytesIO(server.generate_akc_record_sheet_pdf(
                trial,
                include_secretary_report=True,
                include_judges_book=True,
            )))
        self.assertEqual(len(reader.pages), 4)
        self.assertIn("SECRETARY REPORT", reader.pages[0].extract_text() or "")
        self.assertIn("JUDGES’ BOOK", reader.pages[1].extract_text() or "")
        self.assertIn("Dash", reader.pages[2].extract_text() or "")
        self.assertIn("RegularDog", reader.pages[3].extract_text() or "")


if __name__ == "__main__":
    unittest.main()