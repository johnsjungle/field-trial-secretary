import unittest
from unittest.mock import patch
from pypdf import PdfReader
from reportlab.pdfbase import pdfmetrics
import server


def row(label):
    return {
        'callName': label,
        'registeredName': label + ' Registered',
        'registrationNumber': 'REG-' + label,
        'prelimCode': '1Y',
        'prelimJudge1': '75',
        'prelimScore': '75',
    }


class AkcPacketFieldIsolationTests(unittest.TestCase):
    def test_call_name_with_breed_suffix_fits_its_column(self):
        for name in ('Axel (RR)', 'Daisy (RR)', 'Hunter (RR)', 'Christopher (RR)'):
            text, font, size = server.fit_akc_call_name(name)
            self.assertEqual(text, name)
            self.assertEqual(font, '/Helv')
            self.assertGreaterEqual(size, 5.5)
            self.assertLessEqual(size, 11.0)
            self.assertLessEqual(pdfmetrics.stringWidth(text, 'Helvetica', size), 49.1)

    def test_every_page_explicitly_clears_rows_and_checkboxes(self):
        blank = server.blank_akc_scoresheet_fields()
        self.assertEqual(blank['BIF'], '/Off')
        self.assertEqual(blank['OPEN'], '/Off')
        self.assertEqual(blank['List Box7'], '')
        self.assertEqual(blank[server._akc_scoresheet_field(12, 16)], '')
        self.assertEqual(len([key for key in blank if key.startswith('Text')]), 192)
        template_fields = set(PdfReader(server.RECORD_TEMPLATES['AKC']).get_fields())
        clearable = template_fields - {'Signature69', 'Signature70', 'Signature71'}
        self.assertFalse(clearable - set(blank))

    def test_short_group_does_not_repeat_prior_group_rows(self):
        groups = [
            {'id': 'regular', 'breed': 'WH', 'stake': 'Open', 'courses': [{}]},
            {'id': 'bie', 'breed': 'BIF', 'stake': 'BIF', 'phase': 'bif', 'courses': [{}]},
        ]
        rows = {
            'regular': [row('STALE%d' % number) for number in range(1, 9)],
            'bie': [row('CURRENT%d' % number) for number in range(1, 4)],
        }
        trial = {'association': 'AKC', 'clubName': 'Test Club', 'startsOn': '2026-09-12', 'eventNumber': 'TEST'}
        with patch.object(server, 'record_groups_for_print', return_value=groups), patch.object(server, 'asfa_record_rows', side_effect=lambda _trial, group: rows[group['id']]), patch.object(server, 'judges_for_group', return_value=('Judge One', '')):
            pdf = server.generate_akc_record_sheet_pdf(trial)
        reader = PdfReader(__import__('io').BytesIO(pdf))
        pages = reader.pages
        self.assertEqual(len(pages), 2)
        self.assertFalse(reader.trailer['/Root'].get('/AcroForm'))
        self.assertTrue(all(not page.get('/Annots') for page in pages))
        second = pages[1].extract_text() or ''
        for number in range(1, 4):
            self.assertIn('CURRENT%d' % number, second)
        for number in range(1, 9):
            self.assertNotIn('STALE%d' % number, second)


if __name__ == '__main__':
    unittest.main()
