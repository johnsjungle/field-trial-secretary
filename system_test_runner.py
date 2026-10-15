from __future__ import annotations

import hashlib
import io
import json
import sqlite3
import time
import traceback
from copy import deepcopy
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Callable

from pypdf import PdfReader


def _entry(entry_id: str, name: str, score: int, association: str) -> dict:
    return {
        "id": entry_id,
        "houndId": f"hound-{entry_id}",
        "callName": name,
        "registeredName": f"Champion {name} System Test",
        "registrationNumber": f"HP-{entry_id.upper()}",
        "breed": "RR",
        "className": "Open",
        "owner": f"Owner {name}",
        "breeder": "HALO Test Breeder",
        "sex": "Dog" if entry_id.endswith("1") else "Bitch",
        "dob": "2022-01-01",
        "rollCallStatus": "present",
        "firstTime": entry_id.endswith("1") and association == "ASFA",
        "prelimScore": str(score),
    }


def _trial_fixture(association: str) -> dict:
    association = association.upper()
    maximum = 50 if association == "AKC" else 100
    first_prelim = 36 if association == "AKC" else 76
    second_prelim = 35 if association == "AKC" else 74
    first_final = 37 if association == "AKC" else 78
    second_final = 30 if association == "AKC" else 72
    entries = [
        _entry("dog-1", "Halo", first_prelim, association),
        _entry("dog-2", "Comet", second_prelim, association),
    ]
    group = {
        "id": f"{association.lower()}-rr-open",
        "breed": "RR",
        "stake": "Open",
        "flight": "A",
        "fieldId": "field-1",
        "courses": [{
            "id": "prelim-course-1",
            "number": 1,
            "hounds": [
                {
                    "entryId": "dog-1",
                    "callName": "Halo",
                    "registeredName": entries[0]["registeredName"],
                    "registrationNumber": entries[0]["registrationNumber"],
                    "blanketColor": "Yellow",
                    "prelimJudge1Score": str(first_prelim),
                    "prelimScore": str(first_prelim),
                },
                {
                    "entryId": "dog-2",
                    "callName": "Comet",
                    "registeredName": entries[1]["registeredName"],
                    "registrationNumber": entries[1]["registrationNumber"],
                    "blanketColor": "Pink",
                    "prelimJudge1Score": str(second_prelim),
                    "prelimScore": str(second_prelim),
                },
            ],
        }],
        "finalDraw": {"courses": [{
            "id": "final-course-1",
            "number": 1,
            "hounds": [
                {
                    "entryId": "dog-1",
                    "callName": "Halo",
                    "finalBlanketColor": "Yellow",
                    "blanketColor": "Yellow",
                    "finalJudge1Score": str(first_final),
                    "finalScore": str(first_final),
                    "combinedScore": str(first_prelim + first_final),
                    "placement": "1",
                },
                {
                    "entryId": "dog-2",
                    "callName": "Comet",
                    "finalBlanketColor": "Pink",
                    "blanketColor": "Pink",
                    "finalJudge1Score": str(second_final),
                    "finalScore": str(second_final),
                    "combinedScore": str(second_prelim + second_final),
                    "placement": "2",
                },
            ],
        }]},
    }
    return {
        "id": f"system-{association.lower()}",
        "trialName": f"HALO {association} System Test",
        "association": association,
        "clubName": "HALO System Test Club",
        "startsOn": "2026-10-08",
        "endsOn": "2026-10-08",
        "eventNumber": f"{association}-SYSTEM-100",
        "siteName": "System Test Field",
        "locationName": "System Test Field",
        "locationCity": "Test City",
        "locationState": "PA",
        "secretaryName": "Test Secretary",
        "trialChair": "Test Chair",
        "fieldClerk": "Test Clerk",
        "entries": entries,
        "judges": [{
            "name": "Judge One",
            "number": "12345",
            "address": "100 Main Street",
            "city": "Test City",
            "state": "PA",
            "postalCode": "17000",
            "phone": "555-0100",
        }],
        "workers": [{"name": "Test Clerk", "role": "Field Clerk"}],
        "eventFields": [{"id": "field-1", "name": "Field 1"}],
        "rollCallLanes": [{"id": "lane-1", "name": "Lane 1"}],
        "runPlan": [{
            "breed": "RR",
            "judge1": "Judge One",
            "judge2": "",
            "fieldId": "field-1",
            "rollCallLaneId": "lane-1",
            "runOrder": 1,
        }],
        "preliminaryDraw": {"groups": [group]},
        "resultState": {"bobResultsByEntry": {"dog-1": "BOB"}},
        "scorebook": {"prelimComplete": True},
        "maximumJudgeScore": maximum,
    }


def _runoff_fixture(association: str) -> tuple[dict, str, str]:
    trial = _trial_fixture(association)
    group = trial["preliminaryDraw"]["groups"][0]
    key = "1-2-tie-system"
    group["runoffs"] = [{
        "key": key,
        "label": "1-2 Tie",
        "courses": [{
            "number": 2,
            "hounds": [
                {"entryId": "dog-1", "callName": "Halo", "drawPosition": 1, "tieBreakBlanketColor": "Yellow"},
                {"entryId": "dog-2", "callName": "Comet", "drawPosition": 2, "tieBreakBlanketColor": "Pink"},
            ],
        }],
    }]
    return trial, str(group["id"]), key


def _akc_test_fixture() -> dict:
    trial = _trial_fixture("AKC")
    trial["akcTests"] = [{
        "id": "qc-1",
        "runOrder": 1,
        "callName": "Dash",
        "registeredName": "Dash Qualified Courser",
        "breed": "WH",
        "registrationNumber": "HP-QC-1",
        "testType": "QC",
        "result": "pass",
        "owner": "Owner One",
        "handler": "Agent One",
        "judgeName": "Judge One",
        "judgeNumber": "12345",
    }, {
        "id": "jc-1",
        "runOrder": 2,
        "callName": "Swift",
        "registeredName": "Swift Junior Courser",
        "breed": "WH",
        "registrationNumber": "HP-JC-1",
        "testType": "JC",
        "result": "fail",
        "judgeName": "Judge One",
    }]
    return trial


def build_test_paperwork_trial(association: str, source_trial: dict | None = None) -> dict:
    """Return a fully populated, isolated trial used only for alignment review."""
    association = str(association or "ASFA").upper()
    trial = deepcopy(_trial_fixture(association))
    source_trial = source_trial if isinstance(source_trial, dict) else {}
    for key in (
        "clubName", "trialName", "startsOn", "endsOn", "eventNumber", "siteName",
        "locationName", "locationAddress", "locationCity", "locationState", "locationPostalCode",
        "secretaryName", "secretaryEmail", "secretaryPhone", "trialChair", "fieldClerk", "region",
    ):
        if source_trial.get(key) not in (None, ""):
            trial[key] = source_trial[key]

    trial.update({
        "testTrial": True,
        "trialName": trial.get("trialName") or f"HALO {association} Filled Paperwork Test",
        "clubName": trial.get("clubName") or "HALO TEST COURSING CLUB",
        "eventNumber": trial.get("eventNumber") or f"{association}-TEST-2026-100",
        "siteName": trial.get("siteName") or "HALO Alignment Test Field",
        "locationName": trial.get("locationName") or "HALO Alignment Test Field",
        "locationAddress": trial.get("locationAddress") or "100 Test Course Lane",
        "locationCity": trial.get("locationCity") or "Sample City",
        "locationState": trial.get("locationState") or "PA",
        "locationPostalCode": trial.get("locationPostalCode") or "17000",
        "secretaryName": trial.get("secretaryName") or "Sample Trial Secretary",
        "secretaryEmail": trial.get("secretaryEmail") or "secretary@example.test",
        "secretaryPhone": trial.get("secretaryPhone") or "555-0101",
        "trialChair": trial.get("trialChair") or "Sample Trial Chair",
        "fieldClerk": trial.get("fieldClerk") or "Sample Field Clerk",
        "region": trial.get("region") or "6",
        "secretaryJudgesChanged": "yes",
        "secretaryPremiumChanged": "yes",
        "secretaryOpenVetFirstTimers": "yes",
        "secretarySinglesFirstTimers": "yes",
        "secretaryWorkingOffDismissal": "yes",
        "secretaryChangeOfInfo": "yes",
        "secretarySpecialBreederCount": "2",
        "secretarySpecialKennelCount": "2",
        "secretarySpecialBenchCount": "1",
        "secretaryLciRegistrationCount": "1",
        "secretaryLciRegistrationCountManual": True,
        "secretaryPerCapitaRate": "3.50",
        "secretaryCheckAmount": "42.00",
        "secretaryPaypalAmount": "7.00",
        "secretaryPaypalTransactionId": "TEST-PAYPAL-12345",
    })

    trial["judges"] = [
        trial["judges"][0],
        {
            "name": "Judge Two", "number": "67890", "address": "200 Sample Avenue",
            "city": "Example City", "state": "OH", "postalCode": "43000", "phone": "555-0102",
        },
    ]
    trial["runPlan"][0]["judge2"] = "Judge Two"
    owners = [
        ("Owner Halo", "101 Hound Road", "Testville", "PA", "17001", "555-0111", "halo.owner@example.test"),
        ("Owner Comet", "202 Coursing Way", "Exampleton", "OH", "43001", "555-0222", "comet.owner@example.test"),
    ]
    for index, entry in enumerate(trial["entries"]):
        owner, address, city, state, postal, phone, email = owners[index]
        entry.update({
            "owner": owner, "ownerAddress": address, "ownerCity": city, "ownerState": state,
            "ownerPostalCode": postal, "ownerPhone": phone, "ownerEmail": email,
            "handler": f"Handler {entry['callName']}", "sex": "Dog" if index == 0 else "Bitch",
            "dob": f"202{index + 1}-0{index + 2}-1{index + 2}", "firstTime": index == 0,
            "infoChanged": index == 0, "ownerSeparationRequested": index == 1,
            "breeder": "Sample Hound Breeder", "paid": index == 0,
        })

    group = trial["preliminaryDraw"]["groups"][0]
    group["flight"] = "A"
    group["courses"][0]["hounds"][0].update({"prelimJudge1Score": "38" if association == "AKC" else "78", "prelimJudge2Score": "37" if association == "AKC" else "76", "prelimScore": "75" if association == "AKC" else "154"})
    group["courses"][0]["hounds"][1].update({"prelimJudge1Score": "36" if association == "AKC" else "75", "prelimJudge2Score": "35" if association == "AKC" else "74", "prelimScore": "71" if association == "AKC" else "149"})
    group["finalDraw"]["courses"][0]["hounds"][0].update({"finalJudge1Score": "39" if association == "AKC" else "79", "finalJudge2Score": "38" if association == "AKC" else "77", "finalScore": "77" if association == "AKC" else "156", "combinedScore": "152" if association == "AKC" else "310", "placement": "1"})
    group["finalDraw"]["courses"][0]["hounds"][1].update({"finalJudge1Score": "35" if association == "AKC" else "74", "finalJudge2Score": "34" if association == "AKC" else "73", "finalScore": "69" if association == "AKC" else "147", "combinedScore": "140" if association == "AKC" else "296", "placement": "2"})

    # Fill nearly every draw-order block and enough record rows to exercise
    # multiple full pages plus a final partial page. Vary text lengths so the
    # review packet exposes both vertical drift and horizontal clipping.
    target_regular_entries = 45
    blanket_colors = ["Yellow", "Pink", "Blue"]
    for number in range(3, target_regular_entries + 1):
        call_name = f"Hound{number:02d}" if number % 5 else f"AlignmentHound{number:02d}"
        registered_name = (
            f"MBIF DC HALO Alignment Sample Hound Number {number:02d}"
            if number % 4 == 0
            else f"HALO Sample Registered Hound {number:02d}"
        )
        trial["entries"].append({
            "id": f"dog-{number}", "houndId": f"hound-dog-{number}", "callName": call_name,
            "registeredName": registered_name, "registrationNumber": f"HP-TEST-{number:06d}",
            "breed": "RR", "className": "Open", "owner": f"Sample Owner {number:02d}",
            "ownerAddress": f"{100 + number} Test Hound Lane", "ownerCity": "Sample City",
            "ownerState": "PA", "ownerPostalCode": f"17{number:03d}", "ownerPhone": f"555-{number:04d}",
            "ownerEmail": f"owner{number:02d}@example.test", "handler": f"Handler {number:02d}",
            "breeder": "HALO Sample Breeder", "sex": "Dog" if number % 2 else "Bitch",
            "dob": f"2022-{((number - 1) % 12) + 1:02d}-{((number - 1) % 27) + 1:02d}",
            "rollCallStatus": "present", "firstTime": False, "paid": number % 3 != 0,
        })

    regular_entries = [entry for entry in trial["entries"] if entry.get("breed") == "RR"]
    prelim_courses = []
    final_courses = []
    for course_index, start in enumerate(range(0, len(regular_entries), 3), 1):
        course_entries = regular_entries[start:start + 3]
        prelim_hounds = []
        final_hounds = []
        for position, entry in enumerate(course_entries, 1):
            prelim_one = (38 - ((start + position) % 5)) if association == "AKC" else (79 - ((start + position) % 6))
            prelim_two = (37 - ((start + position) % 4)) if association == "AKC" else (78 - ((start + position) % 5))
            final_one = (39 - ((start + position) % 5)) if association == "AKC" else (80 - ((start + position) % 6))
            final_two = (38 - ((start + position) % 4)) if association == "AKC" else (79 - ((start + position) % 5))
            prelim_total = prelim_one + prelim_two
            final_total = final_one + final_two
            placement = str(start + position) if start + position <= (5 if association == "AKC" else 4) else ""
            common = {
                "entryId": entry["id"], "callName": entry["callName"], "registeredName": entry["registeredName"],
                "registrationNumber": entry["registrationNumber"], "drawPosition": position,
                "blanketColor": blanket_colors[position - 1],
            }
            prelim_hounds.append({
                **common, "prelimJudge1Score": str(prelim_one), "prelimJudge2Score": str(prelim_two),
                "prelimScore": str(prelim_total),
            })
            final_hounds.append({
                **common, "finalBlanketColor": blanket_colors[position - 1],
                "finalJudge1Score": str(final_one), "finalJudge2Score": str(final_two),
                "finalScore": str(final_total), "combinedScore": str(prelim_total + final_total), "placement": placement,
            })
        prelim_courses.append({"id": f"prelim-course-{course_index}", "number": course_index, "hounds": prelim_hounds})
        final_courses.append({"id": f"final-course-{course_index}", "number": course_index, "hounds": final_hounds})
    group["courses"] = prelim_courses
    group["finalDraw"] = {"courses": final_courses}
    trial["runPlan"][0]["entryCount"] = len(regular_entries)

    if association == "AKC":
        trial["akcTests"] = deepcopy(_akc_test_fixture()["akcTests"])
    else:
        lci_entries = [
            {
                "id": "lci-1", "houndId": "hound-lci-1", "callName": "Swift", "registeredName": "Swift Sample Companion",
                "registrationNumber": "LCI-TEST-1", "breed": "LCI Small", "className": "Open", "owner": "LCI Sample Owner",
                "ownerAddress": "303 LCI Trail", "ownerCity": "Sample City", "ownerState": "PA", "ownerPostalCode": "17002",
                "ownerPhone": "555-0333", "ownerEmail": "lci.owner@example.test", "handler": "LCI Sample Handler", "sex": "Bitch",
                "dob": "2023-03-13", "firstTime": True, "infoChanged": True, "rollCallStatus": "present", "paid": True,
            },
            {
                "id": "lci-2", "houndId": "hound-lci-2", "callName": "Dash", "registeredName": "Dash Sample Companion",
                "registrationNumber": "LCI-TEST-2", "breed": "LCI Small", "className": "Veteran", "owner": "Second LCI Owner",
                "ownerAddress": "404 Test Field Road", "ownerCity": "Example City", "ownerState": "OH", "ownerPostalCode": "43002",
                "ownerPhone": "555-0444", "ownerEmail": "dash.owner@example.test", "handler": "Second LCI Handler", "sex": "Dog",
                "dob": "2020-04-14", "firstTime": False, "rollCallStatus": "present", "paid": False,
            },
        ]
        trial["entries"].extend(lci_entries)
        trial["runPlan"].append({
            "breed": "LCI Small", "judge1": "Judge One", "judge2": "Judge Two",
            "fieldId": "field-1", "rollCallLaneId": "lane-1", "runOrder": 2,
        })
        trial["preliminaryDraw"]["groups"].append({
            "id": "asfa-lci-small-open", "breed": "LCI Small", "stake": "Open", "flight": "A", "fieldId": "field-1",
            "courses": [{"id": "lci-prelim-1", "number": 1, "hounds": [
                {"entryId": "lci-1", "callName": "Swift", "registeredName": "Swift Sample Companion", "registrationNumber": "LCI-TEST-1", "blanketColor": "Yellow", "prelimJudge1Score": "77", "prelimJudge2Score": "76", "prelimScore": "153"},
                {"entryId": "lci-2", "callName": "Dash", "registeredName": "Dash Sample Companion", "registrationNumber": "LCI-TEST-2", "blanketColor": "Pink", "prelimJudge1Score": "75", "prelimJudge2Score": "74", "prelimScore": "149"},
            ]}],
            "finalDraw": {"courses": [{"id": "lci-final-1", "number": 1, "hounds": [
                {"entryId": "lci-1", "callName": "Swift", "finalBlanketColor": "Yellow", "finalJudge1Score": "78", "finalJudge2Score": "77", "finalScore": "155", "combinedScore": "308", "placement": "1"},
                {"entryId": "lci-2", "callName": "Dash", "finalBlanketColor": "Pink", "finalJudge1Score": "74", "finalJudge2Score": "73", "finalScore": "147", "combinedScore": "296", "placement": "2"},
            ]}]},
        })
    return trial


def _bie_fixture() -> dict:
    def hound(entry_id: str, name: str, color: str) -> dict:
        return {
            "entryId": entry_id,
            "callName": name,
            "registeredName": f"{name} Registered",
            "registrationNumber": f"REG-{entry_id}",
            "breed": "WH",
            "bifBlanketColor": color,
        }

    round_one = {
        "number": 1,
        "draw": {"courses": [{"number": 1, "hounds": [
            hound("bie-a", "Alpha", "YELLOW"),
            hound("bie-b", "Bravo", "PINK"),
        ]}]},
        "outcomes": {
            "bie-a": {"judge1": "45", "judge2": "47", "score": "92"},
            "bie-b": {"judge1": "44", "judge2": "45", "score": "89"},
        },
    }
    return {
        "id": "system-bie",
        "association": "ASFA",
        "clubName": "HALO System Test Club",
        "startsOn": "2026-10-08",
        "entries": [],
        "scorebook": {"bif": {
            "eventType": "BIE",
            "elimination": True,
            "roundHistory": [round_one],
            "draw": {"courses": [{"number": 1, "hounds": [hound("bie-a", "Alpha", "YELLOW")]}]},
            "outcomes": {"bie-a": {"judge1": "48", "judge2": "49", "score": "97"}},
            "finalWinner": "bie-a",
            "judge1": "Judge One",
            "judge2": "Judge Two",
        }},
    }


def _specialty_fixture() -> dict:
    trial = _trial_fixture("AKC")
    trial["entries"][0].update({
        "additionalBreeder": True,
        "additionalKennel": True,
        "additionalBench": True,
        "specialtyBreederPartnerId": "dog-2",
        "specialtyKennelPartnerId": "dog-2",
        "specialtyBreederName": "HALO Test Breeder",
        "specialtyKennelName": "HALO Test Kennel",
    })
    trial["entries"][1].update({
        "additionalBreeder": True,
        "additionalKennel": True,
        "additionalBench": True,
        "specialtyBreederPartnerId": "dog-1",
        "specialtyKennelPartnerId": "dog-1",
        "specialtyBreederName": "HALO Test Breeder",
        "specialtyKennelName": "HALO Test Kennel",
    })
    return trial


def _pdf_detail(data: bytes, expected_text: str = "") -> str:
    if not isinstance(data, (bytes, bytearray)) or not bytes(data).startswith(b"%PDF"):
        raise AssertionError("The generator did not return a PDF.")
    reader = PdfReader(io.BytesIO(data))
    if not reader.pages:
        raise AssertionError("The generated PDF has no pages.")
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if expected_text and expected_text not in text:
        raise AssertionError(f"Generated PDF is missing expected text: {expected_text}")
    return f"{len(reader.pages)} PDF page{'s' if len(reader.pages) != 1 else ''}"


def _check_result(
    results: list[dict],
    check_id: str,
    category: str,
    name: str,
    callback: Callable[[], Any],
) -> None:
    started = time.perf_counter()
    try:
        detail = callback()
        status = "pass"
        if isinstance(detail, dict):
            status = str(detail.get("status") or "pass")
            detail = detail.get("details") or ""
        results.append({
            "id": check_id,
            "category": category,
            "name": name,
            "status": status,
            "details": str(detail or "Passed"),
            "durationMs": round((time.perf_counter() - started) * 1000),
        })
    except Exception as exc:
        results.append({
            "id": check_id,
            "category": category,
            "name": name,
            "status": "fail",
            "details": str(exc) or exc.__class__.__name__,
            "durationMs": round((time.perf_counter() - started) * 1000),
            "technicalDetails": "".join(traceback.format_exception_only(type(exc), exc)).strip(),
        })


def run_server_system_tests(context: dict, client_results: list[dict] | None = None) -> dict:
    started_at = datetime.now(timezone.utc)
    started = time.perf_counter()
    results: list[dict] = []

    for row in client_results or []:
        if not isinstance(row, dict):
            continue
        results.append({
            "id": str(row.get("id") or "client-check")[:100],
            "category": str(row.get("category") or "Browser")[:80],
            "name": str(row.get("name") or "Browser check")[:160],
            "status": str(row.get("status") or "fail") if str(row.get("status") or "") in {"pass", "fail", "warning"} else "fail",
            "details": str(row.get("details") or "")[:1000],
            "durationMs": max(0, int(row.get("durationMs") or 0)),
        })

    root: Path = context["ROOT"]
    app_dir: Path = context["APP_DIR"]
    db_path: Path = context["DB_PATH"]
    blank_db_path: Path = context["BLANK_DB_PATH"]

    state_before = None
    if context["database_is_ready"]():
        with closing(sqlite3.connect(db_path)) as conn:
            row = conn.execute("SELECT state_json FROM app_state WHERE key = ?", ("current",)).fetchone()
            state_before = hashlib.sha256((row[0] if row else "").encode("utf-8")).hexdigest()

    _check_result(results, "server-version", "Application", "Version metadata is valid", lambda: _version_check(context))
    _check_result(results, "server-assets", "Application", "Required app files are present", lambda: _required_assets_check(context, root, app_dir))
    _check_result(results, "server-templates", "Official Forms", "All official PDF templates open", lambda: _template_check(context))
    _check_result(results, "server-blank-db", "Database", "Blank starter database is healthy", lambda: _starter_database_check(context, blank_db_path))
    _check_result(results, "server-live-db", "Database", "Current database passes SQLite integrity", lambda: _live_database_check(context))
    _check_result(results, "server-memory-db", "Database", "Database schema initializes in isolation", lambda: _memory_database_check(context))
    _check_result(results, "server-update-index", "Updates", "Bundled update catalog is valid", lambda: _update_index_check(app_dir))

    asfa = _trial_fixture("ASFA")
    akc = _trial_fixture("AKC")
    akc_tests = _akc_test_fixture()
    asfa_runoff, asfa_runoff_group, asfa_runoff_key = _runoff_fixture("ASFA")
    akc_runoff, akc_runoff_group, akc_runoff_key = _runoff_fixture("AKC")
    bie = _bie_fixture()
    specialty = _specialty_fixture()

    _check_result(results, "pdf-asfa-draw", "Draws", "ASFA draw sheet generates", lambda: _pdf_detail(context["generate_draw_sheet_pdf"](asfa), "Halo"))
    _check_result(results, "pdf-akc-draw", "Draws", "AKC draw sheet generates", lambda: _pdf_detail(context["generate_draw_sheet_pdf"](akc), "Halo"))
    _check_result(results, "pdf-asfa-judge", "Judging", "ASFA judge sheets generate", lambda: _pdf_detail(context["generate_judge_sheets_pdf"](asfa), "Judge One"))
    _check_result(results, "pdf-akc-judge", "Judging", "AKC judge sheets generate", lambda: _pdf_detail(context["generate_judge_sheets_pdf"](akc), "Judge One"))
    _check_result(results, "pdf-asfa-finals", "Judging", "ASFA finals judge sheets generate", lambda: _pdf_detail(context["generate_finals_judge_sheets_pdf"](asfa, "asfa-rr-open"), "Judge One"))
    _check_result(results, "pdf-akc-finals", "Judging", "AKC finals judge sheets generate", lambda: _pdf_detail(context["generate_finals_judge_sheets_pdf"](akc, "akc-rr-open"), "Judge One"))
    _check_result(results, "pdf-asfa-runoff", "Runoffs", "ASFA tie runoff judge sheets generate", lambda: _pdf_detail(context["generate_runoff_judge_sheets_pdf"](asfa_runoff, asfa_runoff_group, asfa_runoff_key), "Judge One"))
    _check_result(results, "pdf-akc-runoff", "Runoffs", "AKC tie runoff sheets name the placements", lambda: _pdf_detail(context["generate_runoff_judge_sheets_pdf"](akc_runoff, akc_runoff_group, akc_runoff_key), "1-2 TIE"))
    _check_result(results, "pdf-asfa-record", "Scoring & Records", "ASFA record sheet generates", lambda: _pdf_detail(context["generate_asfa_record_sheet_pdf"](asfa), "Halo"))
    _check_result(results, "pdf-akc-record", "Scoring & Records", "AKC record sheet prints placement and event number", lambda: _akc_record_check(context, akc))
    _check_result(results, "pdf-asfa-test-paperwork", "Official Forms", "ASFA filled alignment-review packet generates", lambda: _pdf_detail(context["generate_test_paperwork_pdf"]({"association": "ASFA"}), "SAMPLE DATA FOR ALIGNMENT REVIEW"))
    _check_result(results, "pdf-akc-test-paperwork", "Official Forms", "AKC filled alignment-review packet generates", lambda: _pdf_detail(context["generate_test_paperwork_pdf"]({"association": "AKC"}), "SAMPLE DATA FOR ALIGNMENT REVIEW"))
    _check_result(results, "rules-akc-minimum", "Scoring & Records", "AKC one-judge qualifying minimum is 50", lambda: _akc_minimum_check(context, akc))
    _check_result(results, "rules-outcomes", "Scoring & Records", "Non-scoring outcomes have record-sheet labels", lambda: _outcome_check(context))
    _check_result(results, "pdf-asfa-secretary", "Final Paperwork", "ASFA secretary report generates", lambda: _pdf_detail(context["generate_asfa_secretary_report_pdf"](asfa), "HALO System Test Club"))
    _check_result(results, "pdf-akc-secretary", "Final Paperwork", "AKC secretary report generates", lambda: _pdf_detail(context["generate_akc_secretary_report_pdf"](akc), "HALO System Test Club"))
    _check_result(results, "pdf-asfa-entry", "Entries", "ASFA first-time entry form generates", lambda: _pdf_detail(context["generate_asfa_entry_forms_pdf"](asfa), "Halo"))
    _check_result(results, "pdf-akc-test-record", "AKC JC/QC", "AKC JC/QC test record generates", lambda: _pdf_detail(context["generate_akc_test_record_sheet_pdf"](akc_tests), "Dash"))
    _check_result(results, "pdf-akc-qc-cert", "AKC JC/QC", "AKC QC certificate generates", lambda: _pdf_detail(context["generate_akc_qc_certificate_pdf"](akc_tests, "qc-1"), "Dash"))
    _check_result(results, "pdf-akc-judges-book", "AKC JC/QC", "AKC Judges' Book cover generates", lambda: _pdf_detail(context["generate_akc_judges_book_cover_pdf"](akc_tests), "Judge One"))
    _check_result(results, "pdf-catalog-entries", "Reports", "Entry catalog generates", lambda: _pdf_detail(context["generate_catalog_entries_pdf"]([asfa, akc]), "HALO"))
    _check_result(results, "pdf-catalog-final", "Reports", "Final catalog generates", lambda: _pdf_detail(context["generate_catalog_final_pdf"]([asfa, akc]), "HALO"))
    _check_result(results, "pdf-specialty", "Specialty Stakes", "Specialty catalog and results generate", lambda: _specialty_check(context, specialty))
    _check_result(results, "pdf-bie-record", "BIF/BIE", "BIE round record sheets generate", lambda: _pdf_detail(context["generate_asfa_record_sheet_pdf"](bie, breed="BIE"), "BIE"))
    _check_result(results, "pdf-bie-judges", "BIF/BIE", "BIE judge sheets generate", lambda: _pdf_detail(context["generate_bif_judge_sheets_pdf"](bie), "Judge One"))
    _check_result(results, "template-preview", "Official Forms", "Template renderer creates a preview image", lambda: _template_preview_check(context))

    if state_before is not None:
        _check_result(results, "database-unchanged", "Safety", "System test does not change saved trial data", lambda: _state_unchanged_check(db_path, state_before))
    else:
        results.append({
            "id": "database-unchanged",
            "category": "Safety",
            "name": "System test does not change saved trial data",
            "status": "warning",
            "details": "No active database was available for before-and-after comparison.",
            "durationMs": 0,
        })

    counts = {
        "total": len(results),
        "passed": sum(row["status"] == "pass" for row in results),
        "failed": sum(row["status"] == "fail" for row in results),
        "warnings": sum(row["status"] == "warning" for row in results),
    }
    return {
        "ok": True,
        "healthy": counts["failed"] == 0,
        "startedAt": started_at.isoformat().replace("+00:00", "Z"),
        "completedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "durationMs": round((time.perf_counter() - started) * 1000),
        "summary": counts,
        "results": results,
    }


def _version_check(context: dict) -> str:
    data = context["app_version_info"]()
    version = str(data.get("version") or "")
    if len(version.split(".")) != 3 or not all(part.isdigit() for part in version.split(".")):
        raise AssertionError("Version number is not semantic major.minor.patch.")
    return f"HALO v{version}"


def _required_assets_check(context: dict, root: Path, app_dir: Path) -> str:
    required = [
        app_dir / "index.html",
        app_dir / "script.js",
        app_dir / "styles.css",
        app_dir / "updates.js",
        app_dir / "association_rules.js",
    ]
    missing = [str(path.name) for path in required if not path.is_file()]
    if missing:
        raise AssertionError("Missing required files: " + ", ".join(missing))
    if context.get("update_manager") is None:
        raise AssertionError("Program updater module is unavailable.")
    return f"{len(required)} required files and updater module found"


def _template_check(context: dict) -> str:
    paths = set(context["DRAW_TEMPLATES"].values())
    paths.update(context["JUDGE_TEMPLATES"].values())
    paths.update(context["RECORD_TEMPLATES"].values())
    paths.update(context["SECRETARY_REPORT_TEMPLATES"].values())
    paths.update(context["ENTRY_FORM_TEMPLATES"].values())
    paths.update({
        context["AKC_TEST_RECORD_TEMPLATE"],
        context["AKC_QC_CERTIFICATE_TEMPLATE"],
        context["AKC_JUDGES_BOOK_TEMPLATE"],
    })
    for path in paths:
        if not Path(path).is_file():
            raise AssertionError(f"Missing template: {Path(path).name}")
        if not PdfReader(path).pages:
            raise AssertionError(f"Template has no pages: {Path(path).name}")
    return f"{len(paths)} official templates opened"


def _starter_database_check(context: dict, path: Path) -> str:
    if path.is_file():
        return _sqlite_integrity(path)
    with TemporaryDirectory(prefix="halo-system-test-") as folder:
        generated = Path(folder) / "blank.sqlite"
        context["build_blank_database"](generated)
        _sqlite_integrity(generated)
    return "Starter database generated from the bundled schema: ok"


def _sqlite_integrity(path: Path) -> str:
    if not path.is_file():
        raise AssertionError(f"Database file is missing: {path.name}")
    with closing(sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)) as conn:
        result = conn.execute("PRAGMA integrity_check").fetchone()
    if not result or str(result[0]).lower() != "ok":
        raise AssertionError(f"SQLite integrity check returned: {result}")
    return "SQLite integrity_check: ok"


def _live_database_check(context: dict) -> str | dict:
    if not context["database_is_ready"]():
        return {"status": "warning", "details": "No current database is selected."}
    return _sqlite_integrity(Path(context["DB_PATH"]))


def _memory_database_check(context: dict) -> str:
    with closing(sqlite3.connect(":memory:")) as conn:
        context["ensure_app_tables"](conn)
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
    required = {"app_state", "backup_events", "stored_documents", "state_history"}
    missing = required - tables
    if missing:
        raise AssertionError("Missing schema tables: " + ", ".join(sorted(missing)))
    return "Isolated schema created with all application tables"


def _update_index_check(app_dir: Path) -> str:
    version = json.loads((app_dir / "version.json").read_text(encoding="utf-8"))
    index = json.loads((app_dir / "version-index.json").read_text(encoding="utf-8"))
    versions = index.get("versions") or []
    if index.get("schemaVersion") != 1 or not versions:
        raise AssertionError("Version index schema is invalid.")
    current = next((row for row in versions if row.get("version") == version.get("version")), None)
    if not current:
        raise AssertionError("Installed version is missing from the bundled update catalog.")
    status = current.get("status")
    if status == "pending":
        return f"v{version.get('version')} release build is pending publication"
    if status != "available":
        raise AssertionError("Installed version is not marked available or pending publication.")
    updates = current.get("updates") or {}
    missing = [key for key in ("windows", "appleSilicon", "intel", "linuxAppImage") if not (updates.get(key) or {}).get("sha256")]
    if missing:
        raise AssertionError("Missing update checksums: " + ", ".join(missing))
    return f"v{version.get('version')} is available for four updater platforms"


def _akc_record_check(context: dict, trial: dict) -> str:
    data = context["generate_asfa_record_sheet_pdf"](trial)
    detail = _pdf_detail(data, trial["eventNumber"])
    text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)
    if "1" not in text or "2" not in text:
        raise AssertionError("AKC placements were not found in the record sheet.")
    return f"{detail}; event number and placements found"


def _akc_minimum_check(context: dict, trial: dict) -> str:
    group = trial["preliminaryDraw"]["groups"][0]
    minimum = context["placement_qualifying_minimum_for_group"](trial, group)
    rows = context["asfa_record_rows"](trial, group)
    if minimum != 50 or [row["placement"] for row in rows] != ["1-BOB", "2"]:
        raise AssertionError(f"Expected 50-point minimum and placements 1-BOB, 2; got {minimum} and {[row['placement'] for row in rows]}")
    return "50-point minimum retained both valid placements"


def _outcome_check(context: dict) -> str:
    expected = {
        "lame": "LAME",
        "excused": "EXC",
        "dismissed": "DIS",
        "disqualified": "DQ",
        "forfeit": "FOR",
        "pull": "PUL",
        "no_score": "NS",
    }
    actual = {key: context["score_or_outcome"]("", key) for key in expected}
    if actual != expected:
        raise AssertionError(f"Outcome labels differ: {actual}")
    return f"{len(expected)} scoring outcomes have printable labels"


def _specialty_check(context: dict, trial: dict) -> str:
    entries = context["generate_specialty_pdf"]([trial], results=False)
    results = context["generate_specialty_pdf"]([trial], results=True)
    _pdf_detail(entries, "BREEDER STAKE")
    _pdf_detail(results, "KENNEL STAKE")
    return "Entry and result specialty reports generated"


def _template_preview_check(context: dict) -> str:
    data = context["render_template_page_png"](context["RECORD_TEMPLATES"]["AKC"], "system-test-akc-record")
    if not isinstance(data, (bytes, bytearray)) or not bytes(data).startswith(b"\x89PNG"):
        raise AssertionError("Template preview is not a PNG image.")
    return f"Rendered {len(data):,} byte PNG preview"


def _state_unchanged_check(db_path: Path, before: str) -> str:
    with closing(sqlite3.connect(db_path)) as conn:
        row = conn.execute("SELECT state_json FROM app_state WHERE key = ?", ("current",)).fetchone()
    after = hashlib.sha256((row[0] if row else "").encode("utf-8")).hexdigest()
    if after != before:
        raise AssertionError("Saved application state changed while tests were running.")
    return "Saved state hash is unchanged"
