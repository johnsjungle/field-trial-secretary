import copy
import io
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pypdf import PdfReader
import server


class AkcMixedRunoffPaperworkTests(unittest.TestCase):
    def trial(self):
        groups = []
        entries = []
        for stake, entry_id in [('Open', 'open'), ('Veteran', 'vet'), ('Specials', 'special')]:
            hound = dict(entryId=entry_id, callName=entry_id + 'Hound', stake=stake, breed='IG',
                         blanketColor='Yellow', drawPosition=1, prelimScore='75', prelimJudge1Score='75')
            entries.append(dict(id=entry_id, callName=hound['callName'], breed='IG', className=stake, rollCallStatus='present'))
            groups.append(dict(id=entry_id, breed='IG', stake=stake, courses=[dict(number=1, hounds=[hound])],
                               finalDraw=dict(courses=[dict(number=1, hounds=[dict(
                                   **hound, finalScore='76', finalJudge1Score='76', combinedScore='151', placement='1', finalCode='1Y')])])))
        return dict(association='AKC', clubName='Test Club', startsOn='2026-10-31', entries=entries,
                    preliminaryDraw=dict(groups=groups), runPlan=[dict(breed='IG', judge1='Judge One')])

    def test_judge_sheet_explicit_veteran_and_mixed_labels(self):
        trial = self.trial()
        for stake, mixed, expected in [('Veteran', False, 'STAKE: VETERAN'), ('Mixed', True, 'MIXED STAKES: OPEN / VETERAN')]:
            course = dict(breed='IG', stake=stake, mixedStake=mixed, mixedStakes=['Open', 'Veteran'], course=1,
                          phase='final', judge='Judge One', hounds=[])
            text = PdfReader(io.BytesIO(server.build_akc_judge_overlay(trial, course))).pages[0].extract_text()
            self.assertIn(expected, text)

    def test_akc_bob_draw_prints_before_scoring_and_with_result(self):
        trial = self.trial()
        trial['bobRunoffs'] = [dict(key='bob:IG', courses=[dict(number=1, hounds=[
            dict(entryId='open', bobBlanketColor='Blue', bobCode='1B'),
            dict(entryId='vet', bobBlanketColor='Yellow', bobCode='1Y'),
        ])])]
        for scored in (False, True):
            if scored:
                trial['bobRunoffs'][0]['courses'][0]['hounds'][0]['bobScore'] = '79'
            filled = []
            original = server.PdfWriter.update_page_form_field_values
            def capture(writer, page, fields, *args, **kwargs):
                filled.append(copy.deepcopy(fields))
                return original(writer, page, fields, *args, **kwargs)
            before = copy.deepcopy(trial)
            with patch.object(server.PdfWriter, 'update_page_form_field_values', new=capture):
                pdf = server.generate_asfa_record_sheet_pdf(trial, group_ids=['open'])
            self.assertEqual(len(PdfReader(io.BytesIO(pdf)).pages), 1)
            self.assertEqual(filled[0][server._akc_scoresheet_field(1, 16)], '1B/79' if scored else '1B')
            self.assertEqual(trial, before)

    def test_combined_run_shows_bob_draw_for_pending_tie_and_bob_hounds(self):
        trial = self.trial()
        trial['bobRunoffs'] = [dict(key='combined:IG:1-2', tieLabel='1-2 Tie', courses=[dict(number=1, hounds=[
            dict(entryId='a', runoffRole='tie', tieBreakLabel='1-2 Tie', tieBreakCode='1Y'),
            dict(entryId='b', runoffRole='tie', tieBreakLabel='1-2 Tie', tieBreakCode='1P'),
            dict(entryId='vet', runoffRole='bob', bobCode='1B'),
        ])])]
        boxes = server.bob_runoff_boxes_by_entry(trial)
        self.assertEqual({key: value['label'] for key, value in boxes.items()}, dict(a='1Y', b='1P', vet='1B'))
        self.assertTrue(all(not value['code'] for value in boxes.values()))

    def test_selection_does_not_add_unrelated_or_jc_qc_sheets(self):
        trial = self.trial()
        trial['akcTests'] = [dict(id='qc', testType='QC', callName='QcHound', result='PASS')]
        for association in ('AKC', 'ASFA'):
            trial['association'] = association
            groups = server.record_groups_for_print(trial, group_ids=['vet'])
            self.assertEqual([g['id'] for g in groups], ['vet'])
            pdf = server.generate_asfa_record_sheet_pdf(trial, group_ids=['vet'])
            reader = PdfReader(io.BytesIO(pdf))
            self.assertEqual(len(reader.pages), 1)
            text = reader.pages[0].extract_text()
            self.assertIn('vetHound', text)
            self.assertNotIn('openHound', text)
            self.assertNotIn('QcHound', text)
            with self.assertRaises(ValueError):
                server.generate_asfa_record_sheet_pdf(trial, group_ids=[])

    def test_mixed_record_sheets_keep_prelims_finals_and_individual_placements(self):
        trial = self.trial()
        first, second = trial['preliminaryDraw']['groups'][:2]
        mixed = dict(id='mixed', breed='IG', stake='Mixed', mixedStake=True,
                     courses=first['courses'] + second['courses'],
                     finalDraw=dict(courses=first['finalDraw']['courses'] + second['finalDraw']['courses']))
        trial['preliminaryDraw']['groups'] = [mixed]
        for legacy in (False, True):
            if legacy:
                trial['preliminaryDraw']['groups'] = [
                    {**first, 'finalDraw': None, 'mixedStake': True},
                    {**second, 'finalDraw': None},
                    {**mixed, 'courses': [], 'finalsOnly': True},
                ]
            before = copy.deepcopy(trial)
            groups = server.record_groups_for_print(trial, group_ids=['mixed'])
            rows = [row for group in groups for row in server.asfa_record_rows(trial, group)]
            self.assertEqual(len(rows), 2)
            self.assertTrue(all(row['prelimScore'] == '75' and row['finalScore'] == '76' for row in rows))
            self.assertTrue(all(row['combinedScore'] == '151' and row['placement'] == '1' for row in rows))
            self.assertEqual(trial, before)

    def test_running_server_route_honors_selected_groups(self):
        responses = []
        for selection in (['vet'], 'invalid'):
            raw = json.dumps(dict(trial=self.trial(), groupIds=selection)).encode()
            handler = SimpleNamespace(path='/api/asfa-record-sheet', headers={'Content-Length': str(len(raw))},
                                      rfile=io.BytesIO(raw), send_pdf=lambda data, name: responses.append(data),
                                      send_json=lambda data, status=200: responses.append((status, data)))
            server.FieldTrialSecretaryHandler.do_POST(handler)
        self.assertEqual(len(PdfReader(io.BytesIO(responses[0])).pages), 1)
        text = PdfReader(io.BytesIO(responses[0])).pages[0].extract_text()
        self.assertIn('vetHound', text)
        self.assertNotIn('openHound', text)
        self.assertEqual(responses[1][0], 400)


if __name__ == '__main__':
    unittest.main()
