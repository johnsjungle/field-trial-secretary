import io
import unittest
from pypdf import PdfReader
import server


def pdf_text(data: bytes) -> str:
    return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)


class MultiFieldSheetLabelTests(unittest.TestCase):
    def setUp(self):
        self.trial = {
            "trialName": "Major Event",
            "clubName": "Test Club",
            "startsOn": "2026-09-12",
            "eventFields": [
                {"id": "field-1", "name": "North Field"},
                {"id": "field-2", "name": "South Field"},
            ],
            "runPlan": [
                {"breed": "RR", "fieldId": "field-1", "judge1": "Judge One", "judge2": "Judge Two"},
                {"breed": "WH", "fieldId": "field-2", "judge1": "Judge One", "judge2": "Judge Two"},
            ],
        }
        self.group = {"breed": "RR", "stake": "Open", "flight": "A", "courses": []}
        self.course = {"breed": "RR", "stake": "Open", "flight": "A", "course": 1, "fieldName": "North Field", "hounds": [], "judges": ["Judge One"]}

    def test_field_mapping_only_labels_multi_field_trials(self):
        self.assertEqual(server.field_name_for_breed(self.trial, "RR"), "North Field")
        single = {**self.trial, "eventFields": [{"id": "field-1", "name": "North Field"}]}
        self.assertEqual(server.field_name_for_breed(single, "RR"), "")

    def test_flattened_draw_course_carries_field(self):
        group = {**self.group, "courses": [{"number": 1, "hounds": []}]}
        block = server.flatten_draw_courses([group], self.trial)[0]
        self.assertEqual(block["fieldName"], "North Field")

    def test_draw_courses_are_grouped_into_separate_fields(self):
        blocks = [
            {**self.course, "fieldName": "North Field"},
            {**self.course, "breed": "WH", "fieldName": "South Field"},
            {**self.course, "course": 2, "fieldName": "North Field"},
        ]
        grouped = server.draw_courses_by_field(blocks)
        self.assertEqual([name for name, _courses in grouped], ["North Field", "South Field"])
        self.assertEqual([course["course"] for course in grouped[0][1]], [1, 2])
        self.assertEqual([course["breed"] for course in grouped[1][1]], ["WH"])

    def test_generated_draw_pdf_has_one_field_per_page(self):
        trial = {
            **self.trial,
            "association": "ASFA",
            "preliminaryDraw": {
                "groups": [
                    {
                        "breed": "RR",
                        "stake": "Open",
                        "flight": "A",
                        "courses": [{"number": 1, "hounds": [{"drawPosition": 1, "blanketColor": "Yellow", "callName": "NorthDog"}]}],
                    },
                    {
                        "breed": "WH",
                        "stake": "Open",
                        "flight": "A",
                        "courses": [{"number": 1, "hounds": [{"drawPosition": 1, "blanketColor": "Yellow", "callName": "SouthDog"}]}],
                    },
                ]
            },
        }
        pages = PdfReader(io.BytesIO(server.generate_draw_sheet_pdf(trial))).pages
        self.assertEqual(len(pages), 2)
        north_text = pages[0].extract_text() or ""
        south_text = pages[1].extract_text() or ""
        self.assertIn("FIELD: North Field", north_text)
        self.assertIn("NorthDog", north_text)
        self.assertNotIn("SouthDog", north_text)
        self.assertIn("FIELD: South Field", south_text)
        self.assertIn("SouthDog", south_text)
        self.assertNotIn("NorthDog", south_text)

    def test_generated_judge_pdf_has_one_field_per_page(self):
        trial = {
            **self.trial,
            "association": "ASFA",
            "preliminaryDraw": {
                "groups": [
                    {
                        "id": "north-group",
                        "breed": "RR",
                        "stake": "Open",
                        "flight": "A",
                        "courses": [{"number": 1, "hounds": []}],
                    },
                    {
                        "id": "south-group",
                        "breed": "WH",
                        "stake": "Open",
                        "flight": "A",
                        "courses": [{"number": 1, "hounds": []}],
                    },
                ]
            },
        }
        pages = PdfReader(io.BytesIO(server.generate_judge_sheets_pdf(trial))).pages
        self.assertEqual(len(pages), 2)
        north_text = pages[0].extract_text() or ""
        south_text = pages[1].extract_text() or ""
        self.assertIn("FIELD: North Field", north_text)
        self.assertNotIn("FIELD: South Field", north_text)
        self.assertIn("FIELD: South Field", south_text)
        self.assertNotIn("FIELD: North Field", south_text)

    def test_draw_and_judge_overlays_print_field(self):
        draw = server.build_draw_overlay(self.trial, "ASFA", [self.course], 1, 1, server.asfa_draw_layout(None))
        asfa_judge = server.build_asfa_judge_overlay(self.trial, [{**self.course, "judge": "Judge One", "judgeIndex": 1}], server.asfa_judge_layout(None))
        akc_judge = server.build_akc_judge_overlay(self.trial, {**self.course, "judge": "Judge One", "judgeIndex": 1})
        for document in (draw, asfa_judge, akc_judge):
            self.assertIn("FIELD: North Field", pdf_text(document))

    def test_asfa_and_akc_record_overlays_print_field(self):
        asfa_record = server.build_asfa_record_overlay(self.trial, self.group, [], 0, 0, 0, 0, server.asfa_record_layout(None))
        akc_record = server.build_akc_scoresheet_breed_overlay(self.group, self.trial)
        self.assertIn("FIELD: North Field", pdf_text(asfa_record))
        self.assertIn("FIELD: North Field", pdf_text(akc_record))


if __name__ == "__main__":
    unittest.main()
