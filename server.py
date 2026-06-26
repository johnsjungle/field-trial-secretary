from __future__ import annotations

import argparse
import base64
import copy
import io
import json
import shutil
import sqlite3
import sys
import threading
import webbrowser
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import pypdfium2 as pdfium
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
APP_DIR = ROOT / "app"
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "field_trial_secretary.sqlite"
DB_BACKUP_DIR = ROOT / "backups" / "database"
STATE_KEY = "current"
MAX_DB_BACKUPS = 75
MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
TEMPLATE_IMAGE_CACHE: dict[str, bytes] = {}
TEMPLATE_IMAGE_LOCK = threading.Lock()
DRAW_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "SEC-05-Draw-Order-Rev-08-01.pdf",
    "AKC": APP_DIR / "templates" / "akc" / "JERSC2-Lure-Coursing-Draw-Order.pdf",
}
JUDGE_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "SEC-02-Judging-Form-Rev-04-01-26.pdf",
    "AKC": APP_DIR / "templates" / "akc" / "JERSC1-Lure-Coursing-Judges-Sheet-5-18.pdf",
}
RECORD_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "SEC-01-Record-Sheet-Rev-03-02.pdf",
}
SECRETARY_REPORT_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "REC-25-Field-Trial-Secretary-Report-New-03-26.pdf",
    "AKC": APP_DIR / "templates" / "akc" / "JFSEC2-Event-Secretary-Report-10-25.pdf",
}
DEFAULT_ASFA_RECORD_LAYOUT = {
    "headerFontSize": 10,
    "bodyFontSize": 8.5,
    "codeFontSize": 8.5,
    "globalYAdjust": 0,
    "breedX": 158,
    "stakeX": 392,
    "flightX": 622,
    "enteredX": 426,
    "refundsX": 555,
    "perCapitaX": 720,
    "breedY": 77,
    "stakeY": 77,
    "flightY": 77,
    "enteredY": 102,
    "refundsY": 102,
    "perCapitaY": 102,
    "rowTop": 164,
    "rowHeight": 18.1,
    "callNameX": 36,
    "callNameY": 164,
    "registrationX": 124,
    "registrationY": 164,
    "prelimCodeX": 250,
    "prelimCodeY": 164,
    "prelimJudge1X": 293,
    "prelimJudge1Y": 164,
    "prelimJudge2X": 334,
    "prelimJudge2Y": 164,
    "prelimScoreX": 373,
    "prelimScoreY": 164,
    "finalCodeX": 414,
    "finalCodeY": 164,
    "finalJudge1X": 456,
    "finalJudge1Y": 164,
    "finalJudge2X": 498,
    "finalJudge2Y": 164,
    "finalScoreX": 535,
    "finalScoreY": 164,
    "combinedScoreX": 585,
    "combinedScoreY": 164,
    "placementX": 760,
    "placementY": 164,
    "judge1X": 365,
    "judge1Y": 542,
    "judge2X": 365,
    "judge2Y": 565,
    "footerClubX": 160,
    "footerClubY": 566,
    "footerDateX": 395,
    "footerDateY": 566,
    "fieldClerkX": 575,
    "fieldClerkY": 542,
    "fieldSecretaryX": 575,
    "fieldSecretaryY": 565,
    "scratchReasonX": 650,
    "scratchLineStartX": 30,
    "scratchLineEndX": 770,
    "scratchLineYOffset": -5,
}
DEFAULT_ASFA_JUDGE_LAYOUT = {
    "fontSize": 8,
    "circleWeight": 1.5,
    "globalYAdjust": 0,
    "rightFormYAdjust": 1.5,
    "clubX": 108,
    "clubY": 96,
    "dateX": 286,
    "dateY": 96,
    "breedCircleY": 127,
    "breedCircleW": 9,
    "breedCircleH": 7,
    "otherBreedX": 292,
    "otherBreedY": 169,
    "stakeCircleY": 147,
    "stakeCircleW": 15,
    "stakeCircleH": 8,
    "flightCircleX": 58,
    "flightCircleY": 167,
    "flightCircleW": 8,
    "flightCircleH": 7,
    "phaseCircleX": 66,
    "phaseCircleY": 217,
    "phaseCircleW": 18,
    "phaseCircleH": 7,
    "finalPhaseCircleX": 106,
    "finalPhaseCircleY": 217,
    "finalPhaseCircleW": 16,
    "finalPhaseCircleH": 7,
    "bobPhaseCircleX": 169,
    "bobPhaseCircleY": 197,
    "bobPhaseCircleW": 18,
    "bobPhaseCircleH": 7,
    "bifPhaseCircleX": 244,
    "bifPhaseCircleY": 197,
    "bifPhaseCircleW": 18,
    "bifPhaseCircleH": 7,
    "biePhaseCircleX": 319,
    "biePhaseCircleY": 197,
    "biePhaseCircleW": 18,
    "biePhaseCircleH": 7,
    "lciLargeX": 91,
    "lciSmallX": 162,
    "lciShMixX": 239,
    "lciCircleY": 169,
    "lciCircleW": 24,
    "lciCircleH": 7,
    "courseCircleY": 217,
    "courseCircleXAdjust": 0,
    "courseCircleW": 8,
    "courseCircleH": 7,
    "phaseTextX": 66,
    "phaseTextY": 218,
    "judgeX": 150,
    "judgeY": 235,
    "judgeNumberCircleX": 62,
    "judgeNumber1CircleY": 235,
    "judgeNumber2CircleY": 252,
    "judgeNumberCircleW": 10,
    "judgeNumberCircleH": 7,
    "colorStrikeTopY": 266,
    "colorStrikeBottomY": 494,
    "yellowColumnX": 205,
    "pinkColumnX": 285,
    "blueColumnX": 365,
    "colorColumnW": 80,
}
DEFAULT_ASFA_SECRETARY_LAYOUT = {
    "fontSize": 9,
    "circleWeight": 1.5,
    "globalYAdjust": 0,
    "clubX": 115,
    "clubY": 129,
    "regionX": 490,
    "regionY": 129,
    "chairX": 205,
    "chairY": 158,
    "emailX": 183,
    "emailY": 194,
    "dateX": 114,
    "dateY": 229,
    "locationX": 330,
    "locationY": 229,
    "q1YesX": 455,
    "q1NoX": 499,
    "q1Y": 272,
    "q2YesX": 483,
    "q2NoX": 525,
    "q2Y": 392,
    "q3YesX": 483,
    "q3NoX": 525,
    "q3Y": 442,
    "q4YesX": 483,
    "q4NoX": 525,
    "q4Y": 530,
    "q5YesX": 483,
    "q5NoX": 525,
    "q5Y": 580,
    "q6YesX": 483,
    "q6NoX": 525,
    "q6Y": 630,
    "answerCircleW": 13,
    "answerCircleH": 7,
    "notesX": 86,
    "notesY": 336,
    "page2ClubX": 112,
    "page2ClubY": 115,
    "page2DateX": 372,
    "page2DateY": 115,
    "entryFirstRowY": 148,
    "entryRowHeight": 14,
    "openX": 201,
    "fchX": 232,
    "vetsX": 265,
    "entryTotalX": 306,
    "breederX": 358,
    "kennelX": 409,
    "benchX": 453,
    "specialTotalX": 501,
    "totalsY": 477,
    "breedFeeX": 535,
    "breedFeeY": 544,
    "specialFeeX": 535,
    "specialFeeY": 582,
    "recordsFeeX": 535,
    "recordsFeeY": 619,
    "checkAmountX": 535,
    "checkAmountY": 656,
    "paypalAmountX": 535,
    "paypalAmountY": 693,
    "paypalIdX": 348,
    "paypalIdY": 720,
}


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_database() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    DB_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                state_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS backup_events (
                id INTEGER PRIMARY KEY,
                created_at TEXT NOT NULL,
                backup_path TEXT NOT NULL,
                reason TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS entry_documents (
                id TEXT PRIMARY KEY,
                file_name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                content BLOB NOT NULL,
                size_bytes INTEGER NOT NULL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def read_state() -> dict | None:
    ensure_database()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT state_json FROM app_state WHERE key = ?",
            (STATE_KEY,),
        ).fetchone()
    if not row:
        return None
    return json.loads(row[0])


def prune_backups() -> None:
    backups = sorted(DB_BACKUP_DIR.glob("field_trial_secretary-*.sqlite"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_backup in backups[MAX_DB_BACKUPS:]:
        old_backup.unlink(missing_ok=True)


def create_database_backup(reason: str) -> str:
    ensure_database()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = DB_BACKUP_DIR / f"field_trial_secretary-{timestamp}.sqlite"
    shutil.copy2(DB_PATH, backup_path)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO backup_events (created_at, backup_path, reason) VALUES (?, ?, ?)",
            (utc_now(), str(backup_path), reason),
        )
        conn.commit()
    prune_backups()
    return str(backup_path)


def write_state(state: dict) -> dict:
    ensure_database()
    if DB_PATH.exists():
        create_database_backup("before_state_save")
    updated_at = utc_now()
    state = {**state, "savedToSQLiteAt": updated_at}
    state_json = json.dumps(state, ensure_ascii=False, separators=(",", ":"))
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO app_state (key, state_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                state_json = excluded.state_json,
                updated_at = excluded.updated_at
            """,
            (STATE_KEY, state_json, updated_at),
        )
        conn.commit()
    return state


def render_template_page_png(template_path: Path, cache_key: str, page_index: int = 0) -> bytes:
    with TEMPLATE_IMAGE_LOCK:
        cached = TEMPLATE_IMAGE_CACHE.get(cache_key)
        if cached:
            return cached
        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")
        document = pdfium.PdfDocument(str(template_path))
        try:
            page = document[page_index]
            bitmap = page.render(scale=2)
            image = bitmap.to_pil()
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            body = buffer.getvalue()
            TEMPLATE_IMAGE_CACHE[cache_key] = body
            return body
        finally:
            document.close()


def save_entry_document(payload: dict) -> dict:
    ensure_database()
    file_name = str(payload.get("fileName") or "entry-document").strip()
    mime_type = str(payload.get("mimeType") or "application/octet-stream").strip()
    source = str(payload.get("source") or "Jotform email").strip()
    encoded = str(payload.get("contentBase64") or "")
    if "," in encoded and encoded.split(",", 1)[0].startswith("data:"):
        encoded = encoded.split(",", 1)[1]
    if not encoded:
        raise ValueError("contentBase64 is required")
    content = base64.b64decode(encoded, validate=True)
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValueError("document is larger than the 20 MB limit")
    document_id = str(payload.get("id") or f"doc-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}")
    created_at = utc_now()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO entry_documents (id, file_name, mime_type, content, size_bytes, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (document_id, file_name, mime_type, sqlite3.Binary(content), len(content), source, created_at),
        )
        conn.commit()
    return {
        "id": document_id,
        "fileName": file_name,
        "mimeType": mime_type,
        "sizeBytes": len(content),
        "source": source,
        "createdAt": created_at,
    }


def read_entry_document(document_id: object) -> dict | None:
    if not document_id:
        return None
    ensure_database()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, file_name, mime_type, content, size_bytes, source, created_at FROM entry_documents WHERE id = ?",
            (str(document_id),),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "fileName": row[1],
        "mimeType": row[2],
        "content": bytes(row[3]),
        "sizeBytes": row[4],
        "source": row[5],
        "createdAt": row[6],
    }


def draw_groups_for_print(trial: dict) -> list[dict]:
    draw = trial.get("preliminaryDraw") or {}
    groups = list(draw.get("groups") or [])
    run_order = {
        clean_text(row.get("breed")): int(row.get("runOrder") or 999)
        for row in trial.get("runPlan") or []
    }
    stake_order = ["OPEN", "FIELDCHAMPION", "FCH", "VETERAN", "SINGLES", "LCI"]

    def sort_key(group: dict) -> tuple:
        stake = clean_text(group.get("stake"))
        stake_index = stake_order.index(stake) if stake in stake_order else 999
        return (
            run_order.get(clean_text(group.get("breed")), 999),
            str(group.get("breed") or ""),
            stake_index,
            str(group.get("stake") or ""),
        )

    return sorted(groups, key=sort_key)


def clean_text(value: object) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def safe_text(value: object, limit: int = 28) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 1)].rstrip() + "."


def generate_draw_sheet_pdf(trial: dict) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = DRAW_TEMPLATES.get(association, DRAW_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Draw sheet template not found: {template_path}")

    course_blocks = flatten_draw_courses(draw_groups_for_print(trial))
    if not course_blocks:
        raise ValueError("No preliminary draw courses were found.")

    page_capacity = draw_sheet_page_capacity(association)
    writer = PdfWriter()

    for page_start in range(0, len(course_blocks), page_capacity):
        page_courses = course_blocks[page_start:page_start + page_capacity]
        page = fresh_template_page(template_path)
        overlay = PdfReader(io.BytesIO(build_draw_overlay(
            trial,
            association,
            page_courses,
            page_start // page_capacity + 1,
            page_start + 1,
        ))).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def draw_sheet_page_capacity(association: str) -> int:
    return 15 if association == "AKC" else 21


def flatten_draw_courses(groups: list[dict]) -> list[dict]:
    blocks: list[dict] = []
    for group in groups:
        for course in group.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            blocks.append({
                "breed": group.get("breed") or "",
                "stake": abbreviate_stake(group.get("stake") or ""),
                "mixedStake": bool(group.get("mixedStake")),
                "manualNote": group.get("manualNote") or "",
                "course": course.get("number") or "",
                "hounds": hounds,
            })
    return blocks


def abbreviate_stake(stake: str) -> str:
    normalized = clean_text(stake)
    if normalized == "FIELDCHAMPION":
        return "FCh"
    return stake


def build_draw_overlay(trial: dict, association: str, course_blocks: list[dict], page_number: int, first_order: int) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    pdf.setTitle("Official Draw Order Sheet")
    if association == "AKC":
        draw_akc_overlay(pdf, trial, course_blocks, page_number, first_order)
    else:
        draw_asfa_overlay(pdf, trial, course_blocks, page_number, first_order)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_overlay(pdf: canvas.Canvas, trial: dict, course_blocks: list[dict], page_number: int, first_order: int) -> None:
    columns = [36, 297, 545]
    rows = [137, 200, 263, 326, 389, 452, 515]
    draw_page_header(pdf, trial, page_number, first_order, first_order + len(course_blocks) - 1)
    draw_sheet_numbers(pdf, columns, rows, len(course_blocks), page_number, 195, 58)
    pdf.setFont("Helvetica", 6)
    for index, block in enumerate(course_blocks):
        column, top = draw_block_position(index, columns, rows)
        draw_check(pdf, column + 38, 90)
        pdf.drawString(column + 35, y_from_top(top + 4), safe_text(block["breed"], 24))
        pdf.drawString(column + 35, y_from_top(top + 21), safe_text(block["stake"], 12))
        pdf.drawString(column + 35, y_from_top(top + 36), "A")
        pdf.drawString(column + 35, y_from_top(top + 51), str(block["course"]))
        draw_hound_lines(pdf, column + 91, top + 21, block)


def draw_akc_overlay(pdf: canvas.Canvas, trial: dict, course_blocks: list[dict], page_number: int, first_order: int) -> None:
    columns = [27, 279, 540]
    rows = [132, 223, 314, 405, 496]
    draw_page_header(pdf, trial, page_number, first_order, first_order + len(course_blocks) - 1)
    draw_sheet_numbers(pdf, columns, rows, len(course_blocks), page_number, 166, 58)
    pdf.setFont("Helvetica", 6)
    for index, block in enumerate(course_blocks):
        column, top = draw_block_position(index, columns, rows)
        draw_check(pdf, column + 51, 84)
        pdf.drawString(column + 3, y_from_top(top + 6), f"{safe_text(block['breed'], 18)} - {safe_text(block['stake'], 8)}")
        pdf.drawString(column + 18, y_from_top(top + 41), str(block["course"]))
        draw_hound_lines(pdf, column + 43, top + 31, block)


def draw_page_header(pdf: canvas.Canvas, trial: dict, page_number: int, first_order: int, last_order: int) -> None:
    pdf.setFont("Helvetica-Bold", 6)
    title = " | ".join(str(part) for part in [
        trial.get("trialName") or "Trial",
        trial.get("startsOn") or "",
        trial.get("clubName") or "",
    ] if part)
    pdf.drawRightString(780, 604, safe_text(title, 95))
    pdf.drawRightString(780, 594, f"Courses {first_order}-{last_order}")


def draw_block_position(index: int, columns: list[int], rows: list[int]) -> tuple[int, int]:
    row_count = len(rows)
    column_index = index // row_count
    row_index = index % row_count
    return columns[column_index], rows[row_index]


def draw_sheet_numbers(pdf: canvas.Canvas, columns: list[int], rows: list[int], course_count: int, page_number: int, x_offset: int, title_top: int) -> None:
    pdf.setFont("Helvetica-Bold", 10)
    row_count = len(rows)
    first_sheet_number = ((page_number - 1) * len(columns)) + 1
    for column_index, column in enumerate(columns):
        if column_index * row_count >= course_count:
            continue
        pdf.drawString(column + x_offset, y_from_top(title_top), f"#{first_sheet_number + column_index}")


def draw_check(pdf: canvas.Canvas, x: float, top: float) -> None:
    y = y_from_top(top)
    pdf.setLineWidth(0.7)
    pdf.rect(x - 1, y - 1, 7, 7, stroke=1, fill=0)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(x, y, "X")


def draw_hound_lines(pdf: canvas.Canvas, x: float, first_top: float, block: dict) -> None:
    hounds_by_color = {
        clean_text(hound.get("blanketColor")): hound
        for hound in block.get("hounds") or []
    }
    for offset, color in enumerate(["YELLOW", "PINK", "BLUE"]):
        hound = hounds_by_color.get(color)
        if not hound:
            continue
        notes = []
        if block.get("mixedStake"):
            notes.append(abbreviate_stake(hound.get("stake") or block.get("stake")))
        if hound.get("manuallyMoved"):
            notes.append("manual")
        if hound.get("ownerSeparationGroup"):
            notes.append(f"sep {hound.get('ownerSeparationGroup')}")
        name = hound.get("callName") or hound.get("registeredName") or "Unnamed hound"
        line = safe_text(name, 23)
        if notes:
            line = safe_text(f"{line} ({', '.join(notes)})", 34)
        pdf.drawString(x, y_from_top(first_top + (15 * offset)), line)


def y_from_top(top: float) -> float:
    return 612 - top


def generate_judge_sheets_pdf(trial: dict, layout: dict | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    courses = flatten_judge_courses(trial)
    if not courses:
        raise ValueError("No preliminary draw courses were found.")

    writer = PdfWriter()

    if association == "AKC":
        for course in courses:
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_akc_judge_overlay(trial, course))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
    else:
        forms = flatten_asfa_judge_forms(courses)
        layout_settings = asfa_judge_layout(layout)
        for start in range(0, len(forms), 2):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_judge_overlay(trial, forms[start:start + 2], layout_settings))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_runoff_judge_sheets_pdf(trial: dict, group_id: str, runoff_key: str, layout: dict | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    courses = flatten_runoff_judge_courses(trial, group_id, runoff_key)
    if not courses:
        raise ValueError("No runoff draw courses were found.")

    writer = PdfWriter()
    if association == "AKC":
        for course in courses:
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_akc_judge_overlay(trial, course))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
    else:
        forms = flatten_asfa_judge_forms(courses)
        layout_settings = asfa_judge_layout(layout)
        for start in range(0, len(forms), 2):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_judge_overlay(trial, forms[start:start + 2], layout_settings))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_finals_judge_sheets_pdf(trial: dict, group_id: str, layout: dict | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    courses = flatten_finals_judge_courses(trial, group_id)
    if not courses:
        raise ValueError("No finals draw courses were found for that stake.")

    writer = PdfWriter()
    if association == "AKC":
        for course in courses:
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_akc_judge_overlay(trial, course))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
    else:
        forms = flatten_asfa_judge_forms(courses)
        layout_settings = asfa_judge_layout(layout)
        for start in range(0, len(forms), 2):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_judge_overlay(trial, forms[start:start + 2], layout_settings))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_bif_judge_sheets_pdf(trial: dict, layout: dict | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    courses = flatten_bif_judge_courses(trial)
    if not courses:
        raise ValueError("No BIF draw courses were found.")

    writer = PdfWriter()
    if association == "AKC":
        for course in courses:
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_akc_judge_overlay(trial, course))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
    else:
        forms = flatten_asfa_judge_forms(courses)
        layout_settings = asfa_judge_layout(layout)
        for start in range(0, len(forms), 2):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_judge_overlay(trial, forms[start:start + 2], layout_settings))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_asfa_record_sheet_pdf(trial: dict, group_id: str = "", breed: str = "", layout: dict | None = None, sort_mode: str = "") -> bytes:
    template_path = RECORD_TEMPLATES["ASFA"]
    if not template_path.exists():
        raise FileNotFoundError(f"ASFA record sheet template not found: {template_path}")

    groups = record_groups_for_print(trial, group_id, breed, sort_mode)
    if not groups:
        raise ValueError("No score rows were found for that ASFA record sheet.")

    writer = PdfWriter()
    rows_per_page = 10
    layout_settings = asfa_record_layout(layout)
    for group in groups:
        rows = asfa_record_rows(trial, group)
        if not rows:
            continue
        refund_count = sum(1 for row in rows if asfa_record_refund_reason(row))
        per_capita_count = max(0, len(rows) - refund_count)
        for page_start in range(0, len(rows), rows_per_page):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_record_overlay(
                trial,
                group,
                rows[page_start:page_start + rows_per_page],
                len(rows),
                refund_count,
                per_capita_count,
                page_start,
                layout_settings,
            ))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
        append_first_time_documents_for_group(writer, trial, group)

    if not writer.pages:
        raise ValueError("No ASFA record sheet pages could be created.")

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_asfa_secretary_report_pdf(trial: dict, layout: dict | None = None) -> bytes:
    template_path = SECRETARY_REPORT_TEMPLATES["ASFA"]
    if not template_path.exists():
        raise FileNotFoundError(f"ASFA secretary report template not found: {template_path}")

    reader = PdfReader(str(template_path))
    writer = PdfWriter()
    layout_settings = asfa_secretary_layout(layout)
    for index, source_page in enumerate(reader.pages):
        page = copy.deepcopy(source_page)
        page.transfer_rotation_to_content()
        if index in {0, 1}:
            overlay = PdfReader(io.BytesIO(build_asfa_secretary_report_overlay(trial, page, index, layout_settings))).pages[0]
            page.merge_page(overlay)
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def asfa_record_layout(layout: dict | None) -> dict:
    merged = dict(DEFAULT_ASFA_RECORD_LAYOUT)
    if isinstance(layout, dict):
        legacy = {
            "breedY": layout.get("headerTop"),
            "stakeY": layout.get("headerTop"),
            "flightY": layout.get("headerTop"),
            "enteredY": layout.get("enteredTop"),
            "callNameY": layout.get("rowTop"),
            "registrationY": layout.get("rowTop"),
            "prelimCodeY": layout.get("rowTop"),
            "prelimJudge1Y": layout.get("rowTop"),
            "prelimJudge2Y": layout.get("rowTop"),
            "prelimScoreY": layout.get("rowTop"),
            "finalCodeY": layout.get("rowTop"),
            "finalJudge1Y": layout.get("rowTop"),
            "finalJudge2Y": layout.get("rowTop"),
            "finalScoreY": layout.get("rowTop"),
            "combinedScoreY": layout.get("rowTop"),
            "placementY": layout.get("rowTop"),
            "footerClubY": layout.get("footerTop"),
            "footerDateY": layout.get("footerTop"),
        }
        layout = {**legacy, **layout}
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            if key == "globalYAdjust":
                merged[key] = value
            elif value > 0:
                merged[key] = value
    return merged


def asfa_judge_layout(layout: dict | None) -> dict:
    merged = dict(DEFAULT_ASFA_JUDGE_LAYOUT)
    if isinstance(layout, dict):
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            if key in {"globalYAdjust", "rightFormYAdjust", "courseCircleXAdjust"}:
                merged[key] = value
            elif value > 0:
                merged[key] = value
    return merged


def asfa_secretary_layout(layout: dict | None) -> dict:
    merged = dict(DEFAULT_ASFA_SECRETARY_LAYOUT)
    if isinstance(layout, dict):
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            if key == "globalYAdjust":
                merged[key] = value
            elif value > 0:
                merged[key] = value
    return merged


def record_groups_for_print(trial: dict, group_id: str = "", breed: str = "", sort_mode: str = "") -> list[dict]:
    groups = draw_groups_for_print(trial)
    if group_id:
        groups = [group for group in groups if str(group.get("id") or "") == str(group_id)]
    elif breed:
        groups = [group for group in groups if clean_text(group.get("breed")) == clean_text(breed)]
    elif sort_mode == "alpha":
        groups = sorted(groups, key=record_packet_sort_key)
    return groups


def record_packet_sort_key(group: dict) -> tuple:
    stake_order = {
        "OPEN": 1,
        "FIELDCHAMPION": 2,
        "FCH": 2,
        "EXCELLENT": 2,
        "VETERAN": 3,
        "SINGLES": 4,
    }
    return (
        str(group.get("breed") or "").upper(),
        stake_order.get(clean_text(group.get("stake")), 99),
        str(group.get("stake") or "").upper(),
    )


def asfa_record_rows(trial: dict, group: dict) -> list[dict]:
    entries_by_id = {
        str(entry.get("id") or ""): entry
        for entry in trial.get("entries") or []
    }
    final_by_entry = final_codes_by_entry(group)
    final_score_by_entry = final_scores_by_entry(group)
    final_judge_scores = final_judge_scores_by_entry(group)
    final_outcome_by_id = final_outcome_by_entry(group)
    combined_by_entry = final_combined_scores_by_entry(group)
    final_placement_by_entry = final_placements_by_entry(group)
    rows = []
    for course in sorted(group.get("courses") or [], key=lambda item: int(item.get("number") or 0)):
        for hound in sorted_hounds_by_blanket(course.get("hounds") or []):
            entry = entries_by_id.get(str(hound.get("entryId") or "")) or {}
            rows.append({
                "callName": hound.get("callName") or hound.get("registeredName") or entry.get("callName") or entry.get("registeredName") or "Unnamed hound",
                "registrationNumber": entry.get("registrationNumber") or hound.get("registrationNumber") or "",
                "rollCallStatus": entry.get("rollCallStatus") or "",
                "rollCallNotes": entry.get("rollCallNotes") or "",
                "prelimOutcome": hound.get("prelimOutcome") or "",
                "finalOutcome": final_outcome_by_id.get(str(hound.get("entryId") or "")) or "",
                "prelimCode": course_color_code(course.get("number"), hound.get("blanketColor")),
                "prelimJudge1": hound.get("prelimJudge1Score") or "",
                "prelimJudge2": hound.get("prelimJudge2Score") or "",
                "prelimScore": score_or_outcome(hound.get("prelimScore"), hound.get("prelimOutcome")),
                "finalCode": final_by_entry.get(str(hound.get("entryId") or "")) or "",
                "finalJudge1": final_judge_scores.get(str(hound.get("entryId") or ""), {}).get("judge1", ""),
                "finalJudge2": final_judge_scores.get(str(hound.get("entryId") or ""), {}).get("judge2", ""),
                "finalScore": final_score_by_entry.get(str(hound.get("entryId") or "")) or "",
                "combinedScore": combined_by_entry.get(str(hound.get("entryId") or "")) or "",
                "placement": final_placement_by_entry.get(str(hound.get("entryId") or "")) or "",
            })
    return rows


def final_outcome_by_entry(group: dict) -> dict[str, str]:
    outcomes: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                outcomes[entry_id] = str(hound.get("finalOutcome") or "")
    return outcomes


def asfa_record_refund_reason(row: dict) -> str:
    status = clean_text(row.get("rollCallStatus"))
    notes = clean_text(row.get("rollCallNotes"))
    if status == "LAME" or "LAME" in notes:
        return "LAME"
    if status in {"INSEASON", "SEASON"} or "INSEASON" in notes or "SEASON" in notes:
        return "IN SEASON"
    if row_outcome_is_dismissed(row.get("prelimOutcome")) or row_outcome_is_dismissed(row.get("finalOutcome")):
        return "DISMISSED"
    return ""


def row_outcome_is_dismissed(outcome: object) -> bool:
    return clean_text(outcome) in {"DIS", "DISMISSED"}


def final_codes_by_entry(group: dict) -> dict[str, str]:
    codes: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                codes[entry_id] = hound.get("finalCode") or course_color_code(course.get("number"), hound.get("blanketColor"))
    return codes


def append_first_time_documents_for_group(writer: PdfWriter, trial: dict, group: dict) -> None:
    entries_by_id = {str(entry.get("id") or ""): entry for entry in trial.get("entries") or []}
    seen_documents: set[str] = set()
    for entry_id in group_entry_ids(group):
        entry = entries_by_id.get(entry_id)
        if not entry or not bool(entry.get("firstTime")):
            continue
        for document_id in first_time_document_ids_for_entry(entry, group):
            if not document_id or document_id in seen_documents:
                continue
            seen_documents.add(document_id)
            document = read_entry_document(document_id)
            if not document:
                continue
            append_document_to_writer(writer, document)


def group_entry_ids(group: dict) -> list[str]:
    entry_ids: list[str] = []
    for course in group.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id and entry_id not in entry_ids:
                entry_ids.append(entry_id)
    return entry_ids


def first_time_document_ids_for_entry(entry: dict, group: dict) -> list[str]:
    ids: list[str] = []
    registration_id = str(entry.get("registrationCertDocumentId") or "")
    coursing_id = str(entry.get("coursingCertDocumentId") or "")
    if registration_id:
        ids.append(registration_id)
    if not is_quasi_breed_record_group(group) and coursing_id:
        ids.append(coursing_id)
    if not ids:
        ids.extend(str(document_id) for document_id in entry.get("documentIds") or [] if document_id)
    return ids


def is_quasi_breed_record_group(group: dict) -> bool:
    normalized_breed = clean_text(group.get("breed"))
    normalized_stake = clean_text(group.get("stake"))
    return normalized_breed == "SINGLES" or normalized_stake == "SINGLES" or normalized_breed.startswith("LCI") or normalized_stake.startswith("LCI")


def append_document_to_writer(writer: PdfWriter, document: dict) -> None:
    mime_type = str(document.get("mimeType") or "").lower()
    content = document.get("content") or b""
    try:
        if "pdf" in mime_type or str(document.get("fileName") or "").lower().endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                writer.add_page(page)
            return
        if mime_type.startswith("image/") or str(document.get("fileName") or "").lower().endswith((".jpg", ".jpeg", ".png")):
            reader = PdfReader(io.BytesIO(image_document_to_pdf(content)))
            for page in reader.pages:
                writer.add_page(page)
    except Exception:
        return


def image_document_to_pdf(content: bytes) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    image = ImageReader(io.BytesIO(content))
    image_width, image_height = image.getSize()
    page_width, page_height = letter
    margin = 36
    scale = min((page_width - (2 * margin)) / image_width, (page_height - (2 * margin)) / image_height)
    width = image_width * scale
    height = image_height * scale
    x = (page_width - width) / 2
    y = (page_height - height) / 2
    pdf.drawImage(image, x, y, width=width, height=height, preserveAspectRatio=True, mask="auto")
    pdf.save()
    return buffer.getvalue()


def final_scores_by_entry(group: dict) -> dict[str, str]:
    scores: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                scores[entry_id] = str(hound.get("finalScore") or "") or score_or_outcome("", hound.get("finalOutcome"))
    return scores


def final_judge_scores_by_entry(group: dict) -> dict[str, dict[str, str]]:
    scores: dict[str, dict[str, str]] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                scores[entry_id] = {
                    "judge1": str(hound.get("finalJudge1Score") or ""),
                    "judge2": str(hound.get("finalJudge2Score") or ""),
                }
    return scores


def final_combined_scores_by_entry(group: dict) -> dict[str, str]:
    scores: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                scores[entry_id] = str(hound.get("combinedScore") or "")
    return scores


def final_placements_by_entry(group: dict) -> dict[str, str]:
    placements: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                placements[entry_id] = str(hound.get("placement") or "")
    return placements


def sorted_hounds_by_blanket(hounds: list[dict]) -> list[dict]:
    order = {"YELLOW": 1, "PINK": 2, "BLUE": 3}
    return sorted(
        hounds,
        key=lambda hound: (
            order.get(clean_text(hound.get("blanketColor")), 99),
            int(hound.get("drawPosition") or 0),
        ),
    )


def course_color_code(course_number: object, color: object) -> str:
    color_code = {"YELLOW": "Y", "PINK": "P", "BLUE": "B"}.get(clean_text(color), "")
    if not color_code:
        return ""
    return f"{course_number}{color_code}"


def score_or_outcome(score: object, outcome: object) -> str:
    if score not in (None, ""):
        return str(score)
    return {
        "excused": "EXC",
        "dismissed": "DIS",
        "dq": "DQ",
        "disqualified": "DQ",
        "forfeit": "F",
        "no_score": "NS",
    }.get(str(outcome or ""), "")


def build_asfa_record_overlay(trial: dict, group: dict, rows: list[dict], entry_count: int, refund_count: int, per_capita_count: int, page_start: int, layout: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    pdf.setTitle("ASFA Record Sheet")
    draw_asfa_record_header(pdf, trial, group, entry_count, refund_count, per_capita_count, page_start, layout)
    draw_asfa_record_rows(pdf, rows, layout)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_record_header(pdf: canvas.Canvas, trial: dict, group: dict, entry_count: int, refund_count: int, per_capita_count: int, page_start: int, layout: dict) -> None:
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica-Bold", layout["headerFontSize"])
    pdf.drawString(layout["breedX"], y_from_top(asfa_record_y(layout, "breedY")), safe_text(group.get("breed"), 24))
    pdf.drawString(layout["stakeX"], y_from_top(asfa_record_y(layout, "stakeY")), safe_text(abbreviate_stake(group.get("stake") or ""), 18))
    pdf.drawString(layout["flightX"], y_from_top(asfa_record_y(layout, "flightY")), "A")
    pdf.drawString(layout["enteredX"], y_from_top(asfa_record_y(layout, "enteredY")), str(entry_count))
    pdf.drawString(layout["refundsX"], y_from_top(asfa_record_y(layout, "refundsY")), str(refund_count))
    pdf.drawString(layout["perCapitaX"], y_from_top(asfa_record_y(layout, "perCapitaY")), str(per_capita_count))
    pdf.setFont("Helvetica", 7)
    if page_start:
        pdf.drawRightString(770, y_from_top(104), f"Continued - rows {page_start + 1}+")
    judge1, judge2 = judges_for_group(trial, group)
    pdf.drawString(layout["judge1X"], y_from_top(asfa_record_y(layout, "judge1Y")), safe_text(judge1, 32))
    pdf.drawString(layout["judge2X"], y_from_top(asfa_record_y(layout, "judge2Y")), safe_text(judge2, 32))
    pdf.drawString(layout["footerClubX"], y_from_top(asfa_record_y(layout, "footerClubY")), safe_text(trial.get("clubName"), 32))
    pdf.drawString(layout["footerDateX"], y_from_top(asfa_record_y(layout, "footerDateY")), safe_text(trial.get("startsOn"), 14))
    pdf.drawString(layout["fieldClerkX"], y_from_top(asfa_record_y(layout, "fieldClerkY")), safe_text(trial.get("fieldClerk"), 32))
    pdf.drawString(layout["fieldSecretaryX"], y_from_top(asfa_record_y(layout, "fieldSecretaryY")), safe_text(trial.get("secretaryName"), 32))


def judges_for_group(trial: dict, group: dict) -> tuple[str, str]:
    target = clean_text(group.get("breed"))
    for row in trial.get("runPlan") or []:
        if clean_text(row.get("breed")) == target:
            return str(row.get("judge1") or ""), str(row.get("judge2") or "")
    return "", ""


def draw_asfa_record_rows(pdf: canvas.Canvas, rows: list[dict], layout: dict) -> None:
    pdf.setFillColorRGB(0.75, 0, 0)
    for index, row in enumerate(rows):
        row_offset = index * layout["rowHeight"]
        pdf.setFont("Helvetica", layout["bodyFontSize"])
        pdf.drawString(layout["callNameX"], y_from_top(asfa_record_y(layout, "callNameY", row_offset)), safe_text(row.get("callName"), 21))
        pdf.drawString(layout["registrationX"], y_from_top(asfa_record_y(layout, "registrationY", row_offset)), safe_text(row.get("registrationNumber"), 17))
        pdf.setFont("Helvetica-Bold", layout["codeFontSize"])
        pdf.drawCentredString(layout["prelimCodeX"], y_from_top(asfa_record_y(layout, "prelimCodeY", row_offset)), safe_text(row.get("prelimCode"), 4))
        pdf.drawCentredString(layout["prelimJudge1X"], y_from_top(asfa_record_y(layout, "prelimJudge1Y", row_offset)), safe_text(row.get("prelimJudge1"), 8))
        pdf.drawCentredString(layout["prelimJudge2X"], y_from_top(asfa_record_y(layout, "prelimJudge2Y", row_offset)), safe_text(row.get("prelimJudge2"), 8))
        pdf.drawCentredString(layout["prelimScoreX"], y_from_top(asfa_record_y(layout, "prelimScoreY", row_offset)), safe_text(row.get("prelimScore"), 8))
        pdf.drawCentredString(layout["finalCodeX"], y_from_top(asfa_record_y(layout, "finalCodeY", row_offset)), safe_text(row.get("finalCode"), 4))
        pdf.drawCentredString(layout["finalJudge1X"], y_from_top(asfa_record_y(layout, "finalJudge1Y", row_offset)), safe_text(row.get("finalJudge1"), 8))
        pdf.drawCentredString(layout["finalJudge2X"], y_from_top(asfa_record_y(layout, "finalJudge2Y", row_offset)), safe_text(row.get("finalJudge2"), 8))
        pdf.drawCentredString(layout["finalScoreX"], y_from_top(asfa_record_y(layout, "finalScoreY", row_offset)), safe_text(row.get("finalScore"), 8))
        pdf.drawCentredString(layout["combinedScoreX"], y_from_top(asfa_record_y(layout, "combinedScoreY", row_offset)), safe_text(row.get("combinedScore"), 8))
        pdf.drawCentredString(layout["placementX"], y_from_top(asfa_record_y(layout, "placementY", row_offset)), safe_text(row.get("placement"), 10))
        reason = asfa_record_refund_reason(row)
        if reason:
            strike_y = y_from_top(asfa_record_y(layout, "callNameY", row_offset) + layout.get("scratchLineYOffset", -5))
            pdf.saveState()
            pdf.setStrokeColorRGB(0.75, 0, 0)
            pdf.setFillColorRGB(0.75, 0, 0)
            pdf.setLineWidth(1.4)
            pdf.line(layout["scratchLineStartX"], strike_y, layout["scratchLineEndX"], strike_y)
            pdf.setFont("Helvetica-Bold", layout["bodyFontSize"])
            pdf.drawString(layout["scratchReasonX"], y_from_top(asfa_record_y(layout, "callNameY", row_offset)), reason)
            pdf.restoreState()


def asfa_record_y(layout: dict, key: str, row_offset: float = 0) -> float:
    return layout[key] + layout.get("globalYAdjust", 0) + row_offset


def build_asfa_secretary_report_overlay(trial: dict, page, page_index: int = 0, layout: dict | None = None) -> bytes:
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(width, height))
    pdf.setTitle("ASFA Field Trial Secretary Report")
    layout = layout or DEFAULT_ASFA_SECRETARY_LAYOUT
    if page_index == 0:
        draw_asfa_secretary_page_one(pdf, trial, height, layout)
    elif page_index == 1:
        draw_asfa_secretary_page_two(pdf, trial, height, layout)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_secretary_page_one(pdf: canvas.Canvas, trial: dict, height: float, layout: dict) -> None:
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica-Bold", layout["fontSize"])
    pdf.drawString(layout["clubX"], secretary_y(height, layout, "clubY"), safe_text(trial.get("clubName"), 48))
    pdf.drawString(layout["regionX"], secretary_y(height, layout, "regionY"), safe_text(trial.get("region"), 8))
    pdf.drawString(layout["chairX"], secretary_y(height, layout, "chairY"), safe_text(trial.get("trialChair"), 46))
    pdf.drawString(layout["emailX"], secretary_y(height, layout, "emailY"), safe_text(trial.get("secretaryEmail"), 55))
    pdf.drawString(layout["dateX"], secretary_y(height, layout, "dateY"), safe_text(trial.get("startsOn"), 18))
    pdf.drawString(layout["locationX"], secretary_y(height, layout, "locationY"), safe_text(trial_location_text(trial), 42))

    answers = secretary_report_answers(trial)
    yes_no_marks = [
        ("judgesChanged", "q1YesX", "q1NoX", "q1Y"),
        ("premiumChanged", "q2YesX", "q2NoX", "q2Y"),
        ("openVetFirstTimers", "q3YesX", "q3NoX", "q3Y"),
        ("singlesFirstTimers", "q4YesX", "q4NoX", "q4Y"),
        ("workingOffDismissal", "q5YesX", "q5NoX", "q5Y"),
        ("changeOfInfo", "q6YesX", "q6NoX", "q6Y"),
    ]
    for key, yes_x_key, no_x_key, y_key in yes_no_marks:
        mark_yes_no(pdf, answers.get(key), layout[yes_x_key], layout[no_x_key], secretary_y(height, layout, y_key), layout)

    notes = str(trial.get("secretaryJudgeChangeNotes") or "").strip()
    if notes:
        pdf.setFont("Helvetica", 8)
        draw_wrapped_lines(pdf, notes, layout["notesX"], secretary_y(height, layout, "notesY"), 455, 10, max_lines=3)


def draw_asfa_secretary_page_two(pdf: canvas.Canvas, trial: dict, height: float, layout: dict) -> None:
    counts = asfa_secretary_entry_counts(trial)
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica-Bold", max(7, layout["fontSize"] - 1))
    pdf.drawString(layout["page2ClubX"], secretary_y(height, layout, "page2ClubY"), safe_text(trial.get("clubName"), 34))
    pdf.drawString(layout["page2DateX"], secretary_y(height, layout, "page2DateY"), safe_text(trial.get("startsOn"), 14))

    rows = [
        ("Afghan Hounds", "AH"),
        ("Azawakh", "AZ"),
        ("Basenji", "BA"),
        ("Borzoi", "BZ"),
        ("Cirneco dell'Etna", "CE"),
        ("Greyhounds", "GH"),
        ("Ibizan Hounds", "IB"),
        ("Irish Wolfhounds", "IW"),
        ("Italian Greyhounds", "IG"),
        ("Peruvian Inca Orchid", "PIO"),
        ("Pharaoh Hounds", "PH"),
        ("Rhodesian Ridgebacks", "RR"),
        ("Saluki", "SA"),
        ("Scottish Deerhounds", "SD"),
        ("Silken Windhounds", "SW"),
        ("Sloughis", "SL"),
        ("Whippets", "WH"),
        ("Provisional", "PROVISIONAL"),
        ("Singles", "SINGLES"),
        ("LCI Large", "LCILARGE"),
        ("LCI Small", "LCISMALL"),
        ("LCI SH Mix", "LCISHMIX"),
    ]
    y = secretary_y(height, layout, "entryFirstRowY")
    row_height = layout["entryRowHeight"]
    pdf.setFont("Helvetica-Bold", 8)
    totals = {"open": 0, "fch": 0, "vets": 0, "total": 0}
    for index, (_, key) in enumerate(rows):
        row = counts.get(key, {})
        if row:
            draw_count_row(pdf, row, y - (index * row_height), layout)
            for total_key in totals:
                totals[total_key] += int(row.get(total_key, 0) or 0)

    special = asfa_secretary_special_counts(trial)
    total_y = secretary_y(height, layout, "totalsY")
    draw_centered_number(pdf, totals["open"], layout["openX"], total_y)
    draw_centered_number(pdf, totals["fch"], layout["fchX"], total_y)
    draw_centered_number(pdf, totals["vets"], layout["vetsX"], total_y)
    draw_centered_number(pdf, totals["total"], layout["entryTotalX"], total_y)
    draw_centered_number(pdf, special["breeder"], layout["breederX"], total_y)
    draw_centered_number(pdf, special["kennel"], layout["kennelX"], total_y)
    draw_centered_number(pdf, special["bench"], layout["benchX"], total_y)
    draw_centered_number(pdf, special["total"], layout["specialTotalX"], total_y)

    per_capita_rate = secretary_per_capita_rate(trial)
    breed_fee = totals["total"] * per_capita_rate
    special_fee = special["total"]
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawRightString(layout["breedFeeX"], secretary_y(height, layout, "breedFeeY"), money_text(breed_fee))
    pdf.drawRightString(layout["specialFeeX"], secretary_y(height, layout, "specialFeeY"), money_text(special_fee))
    pdf.drawRightString(layout["recordsFeeX"], secretary_y(height, layout, "recordsFeeY"), money_text(15))
    draw_optional_money(pdf, trial.get("secretaryCheckAmount"), layout["checkAmountX"], secretary_y(height, layout, "checkAmountY"))
    draw_optional_money(pdf, trial.get("secretaryPaypalAmount"), layout["paypalAmountX"], secretary_y(height, layout, "paypalAmountY"))
    pdf.drawString(layout["paypalIdX"], secretary_y(height, layout, "paypalIdY"), safe_text(trial.get("secretaryPaypalTransactionId"), 36))


def secretary_report_answers(trial: dict) -> dict[str, str]:
    return {
        "judgesChanged": yes_no_value(trial.get("secretaryJudgesChanged"), "no"),
        "premiumChanged": yes_no_value(trial.get("secretaryPremiumChanged"), "no"),
        "openVetFirstTimers": yes_no_value(trial.get("secretaryOpenVetFirstTimers"), auto_open_vet_first_timers(trial)),
        "singlesFirstTimers": yes_no_value(trial.get("secretarySinglesFirstTimers"), auto_singles_first_timers(trial)),
        "workingOffDismissal": yes_no_value(trial.get("secretaryWorkingOffDismissal"), "no"),
        "changeOfInfo": yes_no_value(trial.get("secretaryChangeOfInfo"), "no"),
    }


def yes_no_value(value: object, default: str = "no") -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"yes", "y", "true", "1"}:
        return "yes"
    if normalized in {"no", "n", "false", "0"}:
        return "no"
    return default


def secretary_y(height: float, layout: dict, key: str) -> float:
    return height - (layout[key] + layout.get("globalYAdjust", 0))


def mark_yes_no(pdf: canvas.Canvas, answer: str, yes_x: float, no_x: float, y: float, layout: dict) -> None:
    target_x = yes_x if answer == "yes" else no_x
    draw_circle(pdf, target_x, y, layout["answerCircleW"], layout["answerCircleH"], layout["circleWeight"])


def auto_open_vet_first_timers(trial: dict) -> str:
    for entry in trial.get("entries") or []:
        stake = clean_text(entry.get("className"))
        if bool(entry.get("firstTime")) and ("OPEN" in stake or "VETERAN" in stake):
            return "yes"
    return "no"


def auto_singles_first_timers(trial: dict) -> str:
    for entry in trial.get("entries") or []:
        if bool(entry.get("firstTime")) and clean_text(entry.get("className")) == "SINGLES":
            return "yes"
    return "no"


def trial_location_text(trial: dict) -> str:
    parts = [
        trial.get("locationName"),
        trial.get("locationCity"),
        trial.get("locationState"),
    ]
    return ", ".join(str(part) for part in parts if part)


def draw_wrapped_lines(pdf: canvas.Canvas, text: str, x: float, y: float, max_width: float, line_height: float, max_lines: int = 3) -> None:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdf.stringWidth(candidate, "Helvetica", 8) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
        if len(lines) >= max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    for index, line in enumerate(lines[:max_lines]):
        pdf.drawString(x, y - (index * line_height), safe_text(line, 90))


def asfa_secretary_entry_counts(trial: dict) -> dict[str, dict[str, int]]:
    counts: dict[str, dict[str, int]] = {}
    for entry in trial.get("entries") or []:
        key = secretary_breed_key(entry)
        if not key:
            continue
        row = counts.setdefault(key, {"open": 0, "fch": 0, "vets": 0, "total": 0})
        column = secretary_stake_column(entry.get("className"))
        row[column] += 1
        row["total"] += 1
    return counts


def secretary_breed_key(entry: dict) -> str:
    class_key = clean_text(entry.get("className"))
    if class_key == "SINGLES":
        return "SINGLES"
    if class_key.startswith("LCILARGE"):
        return "LCILARGE"
    if class_key.startswith("LCISMALL"):
        return "LCISMALL"
    if class_key.startswith("LCISIGHTHOUNDMIX") or class_key.startswith("LCISHMIX"):
        return "LCISHMIX"
    return secretary_breed_code(entry.get("breed"))


def secretary_breed_code(breed: object) -> str:
    normalized = clean_text(breed)
    aliases = {
        "A": "AH",
        "AFGHANHOUND": "AH",
        "AFGHANHOUNDS": "AH",
        "BORZOI": "BZ",
        "B": "BZ",
        "DEERHOUND": "SD",
        "DH": "SD",
        "SCOTTISHDEERHOUND": "SD",
        "S": "SA",
        "SALUKI": "SA",
        "W": "WH",
        "WHIPPET": "WH",
    }
    known = {"AH", "AZ", "BA", "BZ", "CE", "GH", "IB", "IW", "IG", "PIO", "PH", "RR", "SA", "SD", "SW", "SL", "WH"}
    mapped = aliases.get(normalized, normalized)
    return mapped if mapped in known else "PROVISIONAL"


def secretary_stake_column(stake: object) -> str:
    normalized = clean_text(stake)
    if "VETERAN" in normalized:
        return "vets"
    if "FIELDCHAMPION" in normalized or "FCH" in normalized or "EXCELLENT" in normalized:
        return "fch"
    return "open"


def draw_count_row(pdf: canvas.Canvas, row: dict, y: float, layout: dict) -> None:
    draw_centered_number(pdf, row.get("open", 0), layout["openX"], y)
    draw_centered_number(pdf, row.get("fch", 0), layout["fchX"], y)
    draw_centered_number(pdf, row.get("vets", 0), layout["vetsX"], y)
    draw_centered_number(pdf, row.get("total", 0), layout["entryTotalX"], y)


def draw_centered_number(pdf: canvas.Canvas, value: object, x: float, y: float) -> None:
    try:
        number = int(value or 0)
    except (TypeError, ValueError):
        number = 0
    if number:
        pdf.drawCentredString(x, y, str(number))


def asfa_secretary_special_counts(trial: dict) -> dict[str, int]:
    breeder = positive_int(trial.get("secretarySpecialBreederCount"))
    kennel = positive_int(trial.get("secretarySpecialKennelCount"))
    bench = positive_int(trial.get("secretarySpecialBenchCount"))
    return {"breeder": breeder, "kennel": kennel, "bench": bench, "total": breeder + kennel + bench}


def secretary_per_capita_rate(trial: dict) -> float:
    try:
        rate = float(trial.get("secretaryPerCapitaRate") or 4)
    except (TypeError, ValueError):
        rate = 4.0
    return 3.5 if abs(rate - 3.5) < 0.01 else 4.0


def positive_int(value: object) -> int:
    try:
        return max(0, int(float(value or 0)))
    except (TypeError, ValueError):
        return 0


def money_text(value: object) -> str:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0.0
    return f"{amount:,.2f}"


def draw_optional_money(pdf: canvas.Canvas, value: object, x: float, y: float) -> None:
    if str(value or "").strip() == "":
        return
    pdf.drawRightString(x, y, money_text(value))


def fresh_template_page(template_path: Path):
    reader = PdfReader(str(template_path))
    page = copy.deepcopy(reader.pages[0])
    page.transfer_rotation_to_content()
    return page


def flatten_judge_courses(trial: dict) -> list[dict]:
    judges_by_breed = {
        clean_text(row.get("breed")): [value for value in [row.get("judge1"), row.get("judge2")] if value]
        for row in trial.get("runPlan") or []
    }
    courses = []
    for group in draw_groups_for_print(trial):
        for course in group.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            courses.append({
                "breed": group.get("breed") or "",
                "stake": abbreviate_stake(group.get("stake") or ""),
                "course": course.get("number") or "",
                "mixedStake": bool(group.get("mixedStake")),
                "judges": judges_by_breed.get(clean_text(group.get("breed")), []),
                "hounds": hounds,
            })
    return courses


def flatten_runoff_judge_courses(trial: dict, group_id: str, runoff_key: str) -> list[dict]:
    judges_by_breed = {
        clean_text(row.get("breed")): [value for value in [row.get("judge1"), row.get("judge2")] if value]
        for row in trial.get("runPlan") or []
    }
    draw = trial.get("preliminaryDraw") or {}
    for group in draw.get("groups") or []:
        if str(group.get("id") or "") != str(group_id):
            continue
        runoff = next((item for item in group.get("runoffs") or [] if str(item.get("key") or "") == str(runoff_key)), None)
        if not runoff:
            return []
        courses = []
        for course in runoff.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            normalized_hounds = [
                {
                    **hound,
                    "blanketColor": hound.get("tieBreakBlanketColor") or hound.get("blanketColor"),
                    "stake": hound.get("stake") or group.get("stake"),
                }
                for hound in hounds
            ]
            courses.append({
                "breed": group.get("breed") or "",
                "stake": f"{abbreviate_stake(group.get('stake') or '')} Runoff",
                "course": course.get("number") or "",
                "mixedStake": False,
                "judges": judges_by_breed.get(clean_text(group.get("breed")), []),
                "hounds": normalized_hounds,
            })
        return courses
    return []


def flatten_finals_judge_courses(trial: dict, group_id: str) -> list[dict]:
    judges_by_breed = {
        clean_text(row.get("breed")): [value for value in [row.get("judge1"), row.get("judge2")] if value]
        for row in trial.get("runPlan") or []
    }
    draw = trial.get("preliminaryDraw") or {}
    for group in draw.get("groups") or []:
        if str(group.get("id") or "") != str(group_id):
            continue
        final_draw = group.get("finalDraw") or {}
        courses = []
        for course in final_draw.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            normalized_hounds = [
                {
                    **hound,
                    "blanketColor": hound.get("finalBlanketColor") or hound.get("blanketColor"),
                    "stake": hound.get("stake") or group.get("stake"),
                }
                for hound in hounds
            ]
            courses.append({
                "breed": group.get("breed") or "",
                "stake": abbreviate_stake(group.get("stake") or ""),
                "course": course.get("number") or "",
                "phase": "final",
                "mixedStake": bool(group.get("mixedStake")),
                "judges": judges_by_breed.get(clean_text(group.get("breed")), []),
                "hounds": normalized_hounds,
            })
        return courses
    return []


def flatten_bif_judge_courses(trial: dict) -> list[dict]:
    bif = (trial.get("scorebook") or {}).get("bif") or {}
    draw = bif.get("draw") or {}
    judges = [value for value in [bif.get("judge1"), bif.get("judge2")] if value]
    courses = []
    for course in draw.get("courses") or []:
        hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
        normalized_hounds = [
            {
                **hound,
                "blanketColor": hound.get("bifBlanketColor") or hound.get("blanketColor"),
                "stake": hound.get("bobStake") or hound.get("stake") or "BIF",
            }
            for hound in hounds
        ]
        courses.append({
            "breed": "BIF",
            "stake": "BIF",
            "course": course.get("number") or "",
            "phase": "bif",
            "mixedStake": True,
            "judges": judges,
            "hounds": normalized_hounds,
        })
    return courses


def flatten_asfa_judge_forms(courses: list[dict]) -> list[dict]:
    forms = []
    for course in courses:
        judges = course.get("judges") or [""]
        for index, judge in enumerate(judges):
            forms.append({**course, "judge": judge, "judgeIndex": index + 1})
    return forms


def build_akc_judge_overlay(trial: dict, course: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle("Preliminary Judge Sheet")
    pdf.setFont("Helvetica", 8)
    judges = course.get("judges") or []
    pdf.drawString(234, 733, safe_text(trial.get("clubName"), 34))
    pdf.drawString(275, 716, safe_text(trial.get("startsOn"), 16))
    pdf.drawString(390, 696, safe_text(course.get("breed"), 16))
    pdf.drawString(390, 642, safe_text(course.get("stake"), 14))
    draw_check_mark(pdf, 204, 657)
    draw_akc_stake_check(pdf, course.get("stake"))
    draw_akc_course_check(pdf, course.get("course"))
    pdf.drawString(236, 588, safe_text(judges[0] if len(judges) > 0 else "", 30))
    pdf.drawString(236, 568, safe_text(judges[1] if len(judges) > 1 else "", 30))
    draw_akc_judge_hounds(pdf, course)
    pdf.save()
    return buffer.getvalue()


def draw_akc_stake_check(pdf: canvas.Canvas, stake: object) -> None:
    normalized = clean_text(stake)
    x = 204
    if normalized in {"FCH", "FIELDCHAMPION", "SPECIAL"}:
        x = 276
    draw_check_mark(pdf, x, 671)


def draw_akc_course_check(pdf: canvas.Canvas, course_number: object) -> None:
    try:
        number = int(course_number)
    except (TypeError, ValueError):
        return
    if 1 <= number <= 10:
        x_positions = {1: 241, 2: 257, 3: 273, 4: 289, 5: 305, 6: 320, 7: 336, 8: 352, 9: 368, 10: 385}
        draw_check_mark(pdf, x_positions[number], 612)


def draw_akc_judge_hounds(pdf: canvas.Canvas, course: dict) -> None:
    x_by_color = {"YELLOW": 312, "PINK": 356, "BLUE": 399}
    pdf.setFont("Helvetica-Bold", 7)
    for hound in course.get("hounds") or []:
        x = x_by_color.get(clean_text(hound.get("blanketColor")))
        if not x:
            continue
        label = safe_text(hound.get("callName") or hound.get("registeredName"), 12)
        if course.get("mixedStake"):
            label = safe_text(f"{label}/{abbreviate_stake(hound.get('stake') or course.get('stake'))}", 16)
        pdf.drawCentredString(x, 532, label)


def build_asfa_judge_overlay(trial: dict, forms: list[dict], layout: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    pdf.setTitle("Preliminary Judge Sheets")
    for index, form in enumerate(forms):
        x = 36 if index == 0 else 441
        y_adjust = 0 if index == 0 else layout.get("rightFormYAdjust", 1.5)
        draw_asfa_judge_form(pdf, trial, form, x, y_adjust, layout)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_judge_form(pdf: canvas.Canvas, trial: dict, form: dict, x: float, y_adjust: float, layout: dict) -> None:
    y_adjust += layout.get("globalYAdjust", 0)
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica", layout["fontSize"])
    pdf.drawString(x + layout["clubX"], y_from_top(layout["clubY"] + y_adjust), safe_text(trial.get("clubName"), 30))
    pdf.drawString(x + layout["dateX"], y_from_top(layout["dateY"] + y_adjust), safe_text(trial.get("startsOn"), 14))
    draw_asfa_breed_mark(pdf, x, form.get("breed"), y_adjust, layout)
    draw_asfa_stake_mark(pdf, x, form.get("stake"), y_adjust, layout)
    draw_asfa_flight_mark(pdf, x, y_adjust, layout)
    draw_asfa_phase_mark(pdf, x, y_adjust, layout, form.get("phase"))
    draw_asfa_course_mark(pdf, x, form.get("course"), y_adjust, layout)
    draw_asfa_judge_number_mark(pdf, x, form.get("judgeIndex") or 1, y_adjust, layout)
    pdf.drawString(x + layout["judgeX"], y_from_top(layout["judgeY"] + y_adjust), safe_text(form.get("judge"), 26))
    draw_asfa_unused_color_strikes(pdf, x, form, y_adjust, layout)


def draw_asfa_unused_color_strikes(pdf: canvas.Canvas, x: float, form: dict, y_adjust: float, layout: dict) -> None:
    used_colors = {
        clean_text(hound.get("blanketColor"))
        for hound in form.get("hounds") or []
        if clean_text(hound.get("blanketColor")) in {"YELLOW", "PINK", "BLUE"}
    }
    if not used_colors:
        return
    columns = {
        "YELLOW": layout["yellowColumnX"],
        "PINK": layout["pinkColumnX"],
        "BLUE": layout["blueColumnX"],
    }
    top_y = y_from_top(layout["colorStrikeTopY"] + y_adjust)
    bottom_y = y_from_top(layout["colorStrikeBottomY"] + y_adjust)
    width = layout["colorColumnW"]
    pdf.saveState()
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setLineWidth(1.25)
    for color, offset_x in columns.items():
        if color in used_colors:
            continue
        left = x + offset_x
        right = left + width
        pdf.line(left, top_y, right, bottom_y)
        pdf.line(right, top_y, left, bottom_y)
    pdf.restoreState()


def draw_asfa_breed_mark(pdf: canvas.Canvas, x: float, breed: object, y_adjust: float, layout: dict) -> None:
    breed_code_positions = {
        "A": x + 57,
        "AFGHANHOUND": x + 57,
        "AFGHANHOUNDS": x + 57,
        "AZ": x + 72,
        "AZAWAKH": x + 72,
        "AZAWAKHS": x + 72,
        "BA": x + 90,
        "BASENJI": x + 90,
        "BASENJIS": x + 90,
        "B": x + 104,
        "BORZOI": x + 104,
        "BORZOIS": x + 104,
        "CE": x + 121,
        "CIRNECODELLETNA": x + 121,
        "CIRNECHI": x + 121,
        "G": x + 134,
        "GREYHOUND": x + 134,
        "GREYHOUNDS": x + 134,
        "IB": x + 149,
        "IBIZANHOUND": x + 149,
        "IBIZANHOUNDS": x + 149,
        "IW": x + 164,
        "IRISHWOLFHOUND": x + 164,
        "IRISHWOLFHOUNDS": x + 164,
        "IG": x + 179,
        "ITALIANGREYHOUND": x + 179,
        "ITALIANGREYHOUNDS": x + 179,
        "P": x + 191,
        "PHARAOHOUND": x + 191,
        "PHARAOHHOUNDS": x + 191,
        "PIO": x + 207,
        "PORTUGUESEPODENGO": x + 207,
        "PORTUGUESEPODENGOS": x + 207,
        "RR": x + 227,
        "RHODESIANRIDGEBACK": x + 227,
        "RHODESIANRIDGEBACKS": x + 227,
        "S": x + 242,
        "SALUKI": x + 242,
        "SALUKIS": x + 242,
        "SD": x + 259,
        "SCOTTISHDEERHOUND": x + 259,
        "SCOTTISHDEERHOUNDS": x + 259,
        "SL": x + 278,
        "SLOUGHI": x + 278,
        "SLOUGHIS": x + 278,
        "SW": x + 299,
        "SILKENWINDHOUND": x + 299,
        "SILKENWINDHOUNDS": x + 299,
        "W": x + 316,
        "WHIPPET": x + 316,
        "WHIPPETS": x + 316,
    }
    normalized = clean_text(breed)
    target_x = breed_code_positions.get(normalized)
    if target_x:
        draw_circle(pdf, target_x, y_from_top(layout["breedCircleY"] + y_adjust), layout["breedCircleW"], layout["breedCircleH"], layout["circleWeight"])
    else:
        pdf.drawString(x + layout["otherBreedX"], y_from_top(layout["otherBreedY"] + y_adjust), safe_text(breed, 10))


def draw_asfa_stake_mark(pdf: canvas.Canvas, x: float, stake: object, y_adjust: float, layout: dict) -> None:
    normalized = clean_text(stake)
    lci_type = asfa_lci_type(normalized)
    if lci_type:
        draw_asfa_lci_mark(pdf, x, lci_type, y_adjust, layout)
        for candidate in ("OPEN", "EXCELLENT", "VETERAN"):
            if normalized.endswith(candidate):
                normalized = candidate
                break
    x_positions = {
        "OPEN": x + 65,
        "FCH": x + 103,
        "FIELDCHAMPION": x + 103,
        "EXCELLENT": x + 146,
        "VETERAN": x + 196,
        "SINGLES": x + 245,
    }
    draw_circle(pdf, x_positions.get(normalized, x + 65), y_from_top(layout["stakeCircleY"] + y_adjust), layout["stakeCircleW"], layout["stakeCircleH"], layout["circleWeight"])


def asfa_lci_type(normalized_stake: str) -> str:
    if normalized_stake.startswith("LCISMALL"):
        return "SMALL"
    if normalized_stake.startswith("LCILARGE"):
        return "LARGE"
    if normalized_stake.startswith("LCISIGHTHOUNDMIX") or normalized_stake.startswith("LCISHMIX"):
        return "SHMIX"
    return ""


def draw_asfa_lci_mark(pdf: canvas.Canvas, x: float, lci_type: str, y_adjust: float, layout: dict) -> None:
    x_positions = {
        "LARGE": x + layout["lciLargeX"],
        "SMALL": x + layout["lciSmallX"],
        "SHMIX": x + layout["lciShMixX"],
    }
    target_x = x_positions.get(lci_type)
    if target_x:
        draw_circle(pdf, target_x, y_from_top(layout["lciCircleY"] + y_adjust), layout["lciCircleW"], layout["lciCircleH"], layout["circleWeight"])


def draw_asfa_phase_mark(pdf: canvas.Canvas, x: float, y_adjust: float, layout: dict, phase: object = "") -> None:
    normalized = clean_text(phase)
    if normalized == "FINAL":
        draw_circle(pdf, x + layout["finalPhaseCircleX"], y_from_top(layout["finalPhaseCircleY"] + y_adjust), layout["finalPhaseCircleW"], layout["finalPhaseCircleH"], layout["circleWeight"])
        return
    if normalized == "BOB":
        draw_circle(pdf, x + layout["bobPhaseCircleX"], y_from_top(layout["bobPhaseCircleY"] + y_adjust), layout["bobPhaseCircleW"], layout["bobPhaseCircleH"], layout["circleWeight"])
        return
    if normalized == "BIF":
        draw_circle(pdf, x + layout["bifPhaseCircleX"], y_from_top(layout["bifPhaseCircleY"] + y_adjust), layout["bifPhaseCircleW"], layout["bifPhaseCircleH"], layout["circleWeight"])
        return
    if normalized == "BIE":
        draw_circle(pdf, x + layout["biePhaseCircleX"], y_from_top(layout["biePhaseCircleY"] + y_adjust), layout["biePhaseCircleW"], layout["biePhaseCircleH"], layout["circleWeight"])
        return
    draw_circle(pdf, x + layout["phaseCircleX"], y_from_top(layout["phaseCircleY"] + y_adjust), layout["phaseCircleW"], layout["phaseCircleH"], layout["circleWeight"])


def draw_asfa_flight_mark(pdf: canvas.Canvas, x: float, y_adjust: float, layout: dict) -> None:
    draw_circle(pdf, x + layout["flightCircleX"], y_from_top(layout["flightCircleY"] + y_adjust), layout["flightCircleW"], layout["flightCircleH"], layout["circleWeight"])


def draw_asfa_judge_number_mark(pdf: canvas.Canvas, x: float, judge_index: object, y_adjust: float, layout: dict) -> None:
    try:
        index = int(judge_index)
    except (TypeError, ValueError):
        index = 1
    y_key = "judgeNumber2CircleY" if index == 2 else "judgeNumber1CircleY"
    draw_circle(pdf, x + layout["judgeNumberCircleX"], y_from_top(layout[y_key] + y_adjust), layout["judgeNumberCircleW"], layout["judgeNumberCircleH"], layout["circleWeight"])


def draw_asfa_course_mark(pdf: canvas.Canvas, x: float, course_number: object, y_adjust: float, layout: dict) -> None:
    try:
        number = int(course_number)
    except (TypeError, ValueError):
        return
    x_offset = layout.get("courseCircleXAdjust", 0)
    x_positions = {1: x + 164 + x_offset, 2: x + 186 + x_offset, 3: x + 207 + x_offset, 4: x + 235 + x_offset, 5: x + 262 + x_offset, 6: x + 290 + x_offset, 7: x + 317 + x_offset, 8: x + 344 + x_offset}
    if number in x_positions:
        draw_circle(pdf, x_positions[number], y_from_top(layout["courseCircleY"] + y_adjust), layout["courseCircleW"], layout["courseCircleH"], layout["circleWeight"])
    else:
        pdf.drawString(x + layout["phaseTextX"], y_from_top(layout["phaseTextY"] + y_adjust), str(course_number))


def draw_check_mark(pdf: canvas.Canvas, x: float, y: float) -> None:
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(x, y, "X")


def draw_circle(pdf: canvas.Canvas, center_x: float, center_y: float, radius_x: float, radius_y: float, line_width: float = 1.5) -> None:
    pdf.setLineWidth(line_width)
    pdf.ellipse(center_x - radius_x, center_y - radius_y, center_x + radius_x, center_y + radius_y, stroke=1, fill=0)


class FieldTrialSecretaryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, payload: dict, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_pdf(self, body: bytes, filename: str) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f'inline; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_png(self, body: bytes, filename: str) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Disposition", f'inline; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            state = read_state()
            self.send_json({"ok": True, "state": state})
            return
        if parsed.path == "/api/status":
            self.send_json({"ok": True, "dbPath": str(DB_PATH), "time": utc_now()})
            return
        if parsed.path == "/api/template-image/asfa-judge":
            try:
                body = render_template_page_png(JUDGE_TEMPLATES["ASFA"], "asfa-judge")
                self.send_png(body, "asfa-judge-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/asfa-record":
            try:
                body = render_template_page_png(RECORD_TEMPLATES["ASFA"], "asfa-record")
                self.send_png(body, "asfa-record-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/asfa-secretary-1":
            try:
                body = render_template_page_png(SECRETARY_REPORT_TEMPLATES["ASFA"], "asfa-secretary-1", 0)
                self.send_png(body, "asfa-secretary-report-page-1.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/asfa-secretary-2":
            try:
                body = render_template_page_png(SECRETARY_REPORT_TEMPLATES["ASFA"], "asfa-secretary-2", 1)
                self.send_png(body, "asfa-secretary-report-page-2.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                state = payload.get("state")
                if not isinstance(state, dict):
                    raise ValueError("state must be an object")
                saved = write_state(state)
                self.send_json({"ok": True, "savedToSQLiteAt": saved["savedToSQLiteAt"]})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/backup":
            try:
                backup_path = create_database_backup("manual_api_backup")
                self.send_json({"ok": True, "backupPath": backup_path})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/document":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("document payload must be an object")
                document = save_entry_document(payload)
                self.send_json({"ok": True, "document": document})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/draw-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_draw_sheet_pdf(trial)
                association = str(trial.get("association") or "ASFA").lower()
                self.send_pdf(pdf, f"{association}-draw-order-sheet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_judge_sheets_pdf(
                    trial,
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                )
                association = str(trial.get("association") or "ASFA").lower()
                self.send_pdf(pdf, f"{association}-preliminary-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/runoff-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_runoff_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    str(payload.get("runoffKey") or ""),
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                )
                association = str(trial.get("association") or "ASFA").lower()
                self.send_pdf(pdf, f"{association}-runoff-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/finals-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_finals_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                )
                association = str(trial.get("association") or "ASFA").lower()
                self.send_pdf(pdf, f"{association}-finals-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/bif-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_bif_judge_sheets_pdf(
                    trial,
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                )
                association = str(trial.get("association") or "ASFA").lower()
                self.send_pdf(pdf, f"{association}-bif-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    str(payload.get("breed") or ""),
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                    str(payload.get("sortMode") or ""),
                )
                self.send_pdf(pdf, "asfa-record-sheet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-packet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    "",
                    "",
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                    "alpha",
                )
                self.send_pdf(pdf, "asfa-record-sheet-packet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-secretary-report":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
                trial = payload.get("trial")
                if not isinstance(trial, dict):
                    raise ValueError("trial must be an object")
                pdf = generate_asfa_secretary_report_pdf(
                    trial,
                    payload.get("layout") if isinstance(payload.get("layout"), dict) else None,
                )
                self.send_pdf(pdf, "asfa-field-trial-secretary-report.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        self.send_error(HTTPStatus.NOT_FOUND)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Field Trial Secretary locally with SQLite storage.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--open-browser", action="store_true", help="Open the local app page in the default browser after startup.")
    args = parser.parse_args()

    ensure_database()
    server = ThreadingHTTPServer((args.host, args.port), FieldTrialSecretaryHandler)
    url = f"http://{args.host}:{args.port}/"
    print(f"Field Trial Secretary running at {url}")
    print(f"SQLite database: {DB_PATH}")
    print("Press Ctrl+C to stop.")
    if args.open_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
