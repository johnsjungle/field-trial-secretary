import copy
import io
import unittest
from unittest.mock import patch

from pypdf import PdfReader
import server


class AkcSpecialsPathsTests(unittest.TestCase):
    def fixture(self):
        trial = {
            'association': 'AKC', 'trialName': 'Specials audit', 'clubName': 'Test Club',
            'startsOn': '2026-10-31', 'eventNumber': 'AKC-SPECIALS-AUDIT',
            'runPlan': [{'breed': 'RR', 'runOrder': 1, 'judge1': 'Judge One', 'judge2': 'Judge Two'}],
            'entries': [], 'preliminaryDraw': {'groups': []},
        }
        # Deliberately start out of order so every output must apply its own sort.
        for stake in ('Veteran', 'Specials', 'Open'):
            entry_id = stake.lower()
            entry = {'id': entry_id, 'breed': 'RR', 'className': stake,
                     'callName': stake + 'Hound', 'registeredName': stake + ' Registered',
                     'registrationNumber': 'HP-' + entry_id, 'rollCallStatus': 'present'}
            hound = {'entryId': entry_id, 'breed': 'RR', 'stake': stake, 'blanketColor': 'Yellow',
                     'drawPosition': 1, 'callName': entry['callName'],
                     'prelimJudge1Score': '35', 'prelimJudge2Score': '36', 'prelimScore': '71'}
            trial['entries'].append(entry)
            trial['preliminaryDraw']['groups'].append({
                'id': entry_id, 'breed': 'RR', 'stake': stake, 'flight': 'A',
                'courses': [{'number': 1, 'hounds': [hound]}],
                'finalDraw': {'courses': [{'number': 1, 'hounds': [{
                    **hound, 'finalBlanketColor': 'Yellow', 'finalCode': '1Y',
                    'finalJudge1Score': '36', 'finalJudge2Score': '37', 'finalScore': '73',
                    'combinedScore': '144', 'placement': '1',
                }]}]},
            })
        return trial

    def test_draw_and_judges_keep_specials_in_the_correct_order(self):
        trial = self.fixture()
        self.assertEqual([g['stake'] for g in server.draw_groups_for_print(trial)], ['Open', 'Specials', 'Veteran'])
        courses = server.flatten_judge_courses(trial)
        self.assertEqual([c['stake'] for c in courses], ['Open', 'Specials', 'Veteran'])
        final = server.flatten_finals_judge_courses(trial, 'specials')
        self.assertEqual(final[0]['stake'], 'Specials')
        self.assertEqual(final[0]['hounds'][0]['callName'], 'SpecialsHound')
        for data in (server.generate_draw_sheet_pdf(trial), server.generate_judge_sheets_pdf(trial), server.generate_finals_judge_sheets_pdf(trial, 'specials')):
            self.assertGreater(len(PdfReader(io.BytesIO(data)).pages), 0)

    def test_record_packet_pages_are_open_specials_veteran(self):
        trial = self.fixture()
        before = copy.deepcopy(trial)
        groups = server.record_groups_for_print(trial, sort_mode='alpha')
        self.assertEqual([g['stake'] for g in groups], ['Open', 'Specials', 'Veteran'])
        filled_pages = []
        original_fill = server.PdfWriter.update_page_form_field_values

        def capture_fill(writer, page, fields, *args, **kwargs):
            filled_pages.append(copy.deepcopy(fields))
            return original_fill(writer, page, fields, *args, **kwargs)

        with patch.object(server.PdfWriter, 'update_page_form_field_values', new=capture_fill):
            reader = PdfReader(io.BytesIO(server.generate_akc_record_sheet_pdf(trial, sort_mode='alpha')))
        texts = [page.extract_text() or '' for page in reader.pages]
        self.assertEqual(len(texts), 3)
        for text, stake in zip(texts, ('Open', 'Specials', 'Veteran')):
            self.assertIn(stake + 'Hound', text)
            self.assertIn('144', text)
        # The delivered packet is static, so verify the values sent to the real
        # PDF form filler before the widgets are flattened and removed.
        self.assertEqual(filled_pages[1]['Special'], '/Yes')
        self.assertNotEqual(filled_pages[0]['Special'], '/Yes')
        self.assertNotEqual(filled_pages[2]['Special'], '/Yes')
        self.assertEqual(trial, before, 'Printing must not mutate the trial')

    def test_record_packet_sorts_champion_aliases_before_veteran(self):
        for alias in ('Specials', 'Special', 'FCh', 'FC', 'Field Champion'):
            with self.subTest(alias=alias):
                groups = [{'breed': 'RR', 'stake': stake} for stake in ('Veteran', alias, 'Open')]
                self.assertEqual([g['stake'] for g in sorted(groups, key=server.record_packet_sort_key)], ['Open', alias, 'Veteran'])

    def test_specials_scores_catalog_and_judge_marks_are_retained(self):
        trial = self.fixture()
        group = next(g for g in trial['preliminaryDraw']['groups'] if g['stake'] == 'Specials')
        row = server.asfa_record_rows(trial, group)[0]
        self.assertEqual((row['prelimScore'], row['finalScore'], row['combinedScore'], row['placement']), ('71', '73', '144', '1'))
        for generator in (server.generate_catalog_entries_pdf, server.generate_catalog_final_pdf):
            text = '\n'.join(page.extract_text() or '' for page in PdfReader(io.BytesIO(generator([trial]))).pages)
            self.assertIn('SpecialsHound', text)
            self.assertLess(text.index('OpenHound'), text.index('SpecialsHound'))
            self.assertLess(text.index('SpecialsHound'), text.index('VeteranHound'))
        for alias in ('Specials', 'Special', 'FCh', 'FC', 'Field Champion'):
            with self.subTest(alias=alias), patch.object(server, 'draw_check_mark') as mark:
                self.assertTrue(server.draw_akc_stake_check(None, alias))
                mark.assert_called_once_with(None, 276, 671)


if __name__ == '__main__':
    unittest.main()
