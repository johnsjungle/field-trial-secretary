from __future__ import annotations

import argparse
import update_manager

# The copied updater runs without starting the application server.
if __name__ == "__main__" and "--apply-program-update" in __import__("sys").argv:
    update_manager.apply_update_job(__import__("sys").argv[__import__("sys").argv.index("--apply-program-update") + 1])
    raise SystemExit(0)

import base64
import copy
import hashlib
import io
import ipaddress
import json
import os
import re
import subprocess
import shutil
import socket
import sqlite3
import sys
import threading
import time
import traceback
import webbrowser
import zipfile
import zlib
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import socket
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, unquote, urlencode, urljoin, urlparse, urlunparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

import pypdfium2 as pdfium
from asfa_judges import parse_asfa_judge_directory
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


IS_FROZEN = bool(getattr(sys, "frozen", False))
IS_MAC_APP = IS_FROZEN and sys.platform == "darwin"

if IS_MAC_APP:
    ROOT = Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
elif IS_FROZEN:
    ROOT = Path(sys.executable).resolve().parent
else:
    ROOT = Path(__file__).resolve().parent

APP_DIR = ROOT / "app"
STORAGE_ROOT = (
    Path.home() / "Library" / "Application Support" / "Field Trial Secretary"
    if IS_MAC_APP
    else ROOT
)
DATA_DIR = STORAGE_ROOT / "data"
DB_PATH = DATA_DIR / "field_trial_secretary.sqlite"
VERSION_PATH = APP_DIR / "version.json"
DB_BACKUP_DIR = STORAGE_ROOT / "backups" / "database"
TRIAL_ARCHIVE_DIR = STORAGE_ROOT / "backups" / "trial_archives"
TRANSFER_PACKAGE_DIR = STORAGE_ROOT / "backups" / "transfer_packages"
APP_RESTORE_BACKUP_DIR = STORAGE_ROOT / "backups" / "app_file_restores"
LOG_DIR = STORAGE_ROOT / "logs"
APP_LOG_PATH = LOG_DIR / "field_trial_secretary.log"
SETTINGS_PATH = DATA_DIR / "app_settings.json"
STATE_KEY = "current"
DEFAULT_MAX_DB_BACKUPS = 30
MIN_DB_BACKUPS = 5
MAX_DB_BACKUPS_LIMIT = 250
MAX_UNDO_HISTORY = 20
MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
TEMPLATE_IMAGE_CACHE: dict[str, bytes] = {}
TEMPLATE_IMAGE_LOCK = threading.Lock()
STATE_WRITE_LOCK = threading.RLock()


class NullWriter:
    def write(self, _text: str) -> int:
        return 0

    def flush(self) -> None:
        return None


if sys.stdout is None:
    sys.stdout = NullWriter()
if sys.stderr is None:
    sys.stderr = NullWriter()


class ExclusiveTrialHTTPServer(ThreadingHTTPServer):
    """Prevent a second Windows process from serving stale code on this port."""
    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.allow_reuse_address = False
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def app_log(message: str) -> None:
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with open(APP_LOG_PATH, "a", encoding="utf-8") as handle:
            handle.write(f"{utc_now()} {message}\n")
    except Exception:
        pass
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
    "AKC": APP_DIR / "templates" / "akc" / "JERSC3-Lure-Coursing-Scoresheet-4-22.pdf",
}
ENTRY_FORM_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "EF-A-Entry-Form-Rev-06-26.pdf",
    "ASFA_LCI": APP_DIR / "templates" / "asfa" / "EF-A-LCI-Entry-Form-Rev-08-24.pdf",
}
SECRETARY_REPORT_TEMPLATES = {
    "ASFA": APP_DIR / "templates" / "asfa" / "REC-25-Field-Trial-Secretary-Report-Rev-08-26.pdf",
    "AKC": APP_DIR / "templates" / "akc" / "JFSEC2-Event-Secretary-Report-10-25.pdf",
}
DEFAULT_ASFA_RECORD_LAYOUT = {
    "headerFontSize": 10,
    "bodyFontSize": 8.5,
    "codeFontSize": 8.5,
    "footerFontSize": 9,
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
    "stakesRunoffLabelX": 640,
    "stakesRunoffLabelY": 159,
    "stakesRunoffCodeX": 640,
    "stakesRunoffCodeY": 169,
    "secondRunoffLabelX": 682,
    "secondRunoffLabelY": 159,
    "secondRunoffCodeX": 682,
    "secondRunoffCodeY": 169,
    "bobRunoffLabelX": 724,
    "bobRunoffLabelY": 159,
    "bobRunoffCodeX": 724,
    "bobRunoffCodeY": 169,
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
    "provisionalStakeX": 305,
    "mixedTextX": 292,
    "mixedTextY": 169,
    "flightCircleX": 58,
    "flightCircleStepX": 31.5,
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
    "phaseTextY": 197,
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

DEFAULT_AKC_DRAW_LAYOUT = {
    "globalXAdjust": 0,
    "globalYAdjust": 0,
    "prelimChkX": 52.4,
    "prelimChkY": 89.9,
    "finalChkX": 96.4,
    "finalChkY": 89.9,
    "runoffChkX": 158.4,
    "runoffChkY": 89.9,
    "bifChkX": 202.4,
    "bifChkY": 89.9,
    "sheetNumberX": 166,
    "sheetNumberY": 58,
    "sheetNumberFontSize": 12,
    "blockStartY": 132,
    "blockYStep": 91,
    "houndFontSize": 9.5,
    "breedCircleXAdjust": 0,
    "breedCircleYOffset": 4.78,
    "breedCircleRx": 10,
    "breedCircleRy": 6,
    "breedCircleWeight": 1.4,
    "breedCenterA": 7.82,
    "breedCenterBA": 26.94,
    "breedCenterB": 46.06,
    "breedCenterG": 61.85,
    "breedCenterIB": 79.03,
    "breedCenterIG": 97.60,
    "breedCenterIW": 117.35,
    "breedCenterP": 135.14,
    "breedCenterR": 150.38,
    "breedCenterS": 165.67,
    "breedCenterSD": 184.30,
    "breedCenterW": 201.50,
    "unlistedBreedX": 8,
    "unlistedBreedY": 29,
    "unlistedBreedFontSize": 9.5,
    "courseNumX": 8,
    "courseNumY": 48,
    "courseNumberFontSize": 10,
    "yellowX": 52,
    "yellowY": 20,
    "pinkX": 52,
    "pinkY": 33,
    "blueX": 52,
    "blueY": 46,
}
DEFAULT_ASFA_DRAW_LAYOUT = {
    "globalXAdjust": 0,
    "globalYAdjust": 0,
    "checkSize": 7,
    "checkWeight": 0.7,
    "checkFontSize": 8,
    "breedTextX": 35,
    "breedTextYAdjust": 0,
    "stakeTextX": 35,
    "stakeTextYAdjust": 0,
    "prelimCheckX": 74,
    "prelimCheckY": 90,
    "finalCheckX": 113,
    "finalCheckY": 90,
    "runoffCheckX": 183,
    "runoffCheckY": 90,
    "bobCheckX": 231,
    "bobCheckY": 90,
    "bifCheckX": 281,
    "bifCheckY": 90,
}
DEFAULT_ASFA_SECRETARY_LAYOUT = {
    "templateRevision": "8-26",
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
    "breedFeeY": 529,
    "specialFeeX": 535,
    "specialFeeY": 567,
    "lciRegistrationCountX": 355,
    "lciRegistrationCountY": 594,
    "lciRegistrationFeeX": 535,
    "lciRegistrationFeeY": 594,
    "recordsFeeX": 535,
    "recordsFeeY": 621,
    "checkAmountX": 535,
    "checkAmountY": 648,
    "paypalAmountX": 535,
    "paypalAmountY": 675,
    "paypalIdX": 348,
    "paypalIdY": 702,
}
DEFAULT_ASFA_ENTRY_LAYOUT = {
    "fontSize": 8,
    "smallFontSize": 6.5,
    "circleWeight": 1.4,
    "globalYAdjust": 0,
    "copyOffsetX": 396,
    "trialClubX": 30,
    "trialClubY": 58,
    "trialDateX": 30,
    "trialDateY": 72,
    "trialSecretaryX": 205,
    "trialSecretaryY": 58,
    "trialSecretaryEmailX": 205,
    "trialSecretaryEmailY": 72,
    "breedX": 54,
    "breedY": 82,
    "callNameX": 78,
    "callNameY": 112,
    "registeredNameX": 126,
    "registeredNameY": 141,
    "registrationX": 74,
    "registrationY": 202,
    "dobX": 276,
    "dobY": 202,
    "ownerX": 118,
    "ownerY": 252,
    "addressX": 74,
    "addressY": 281,
    "phoneX": 58,
    "phoneY": 311,
    "cityX": 48,
    "cityY": 340,
    "stateX": 232,
    "stateY": 340,
    "zipX": 302,
    "zipY": 340,
    "emailX": 58,
    "emailY": 369,
    "regionX": 288,
    "regionY": 369,
    "stakeCheckY": 169,
    "openX": 70,
    "fchX": 112,
    "veteranX": 163,
    "singlesX": 228,
    "provisionalX": 296,
    "kennelX": 70,
    "kennelY": 184,
    "breederX": 117,
    "breederY": 184,
    "benchX": 165,
    "benchY": 184,
    "dogX": 252,
    "bitchX": 317,
    "sexCheckY": 226,
    "ownerSeparationX": 245,
    "ownerSeparationY": 188,
    "firstAsfaTrialX": 30,
    "firstAsfaTrialY": 402,
    "firstTimeEntryX": 30,
    "firstTimeEntryY": 435,
    "changeInfoX": 30,
    "changeInfoY": 468,
    "dismissedX": 30,
    "dismissedY": 501,
    "checkSize": 7,
    "signatureX": 230,
    "signatureY": 581,
}
DEFAULT_ASFA_LCI_ENTRY_LAYOUT = {
    "fontSize": 8,
    "smallFontSize": 6.5,
    "circleWeight": 1.4,
    "globalYAdjust": 0,
    "copyOffsetX": 396,
    "trialClubX": 30,
    "trialClubY": 64,
    "trialDateX": 30,
    "trialDateY": 78,
    "trialSecretaryX": 205,
    "trialSecretaryY": 64,
    "trialSecretaryEmailX": 205,
    "trialSecretaryEmailY": 78,
    "breedX": 54,
    "breedY": 88,
    "callNameX": 78,
    "callNameY": 118,
    "registeredNameX": 126,
    "registeredNameY": 147,
    "registrationX": 74,
    "registrationY": 223,
    "dobX": 276,
    "dobY": 223,
    "ownerX": 118,
    "ownerY": 273,
    "addressX": 74,
    "addressY": 302,
    "phoneX": 58,
    "phoneY": 332,
    "cityX": 48,
    "cityY": 361,
    "stateX": 232,
    "stateY": 361,
    "zipX": 302,
    "zipY": 361,
    "emailX": 58,
    "emailY": 390,
    "regionX": 288,
    "regionY": 390,
    "lciDivisionY": 171,
    "lciSmallX": 82,
    "lciLargeX": 174,
    "lciMixX": 295,
    "stakeCheckY": 196,
    "openX": 83,
    "excellentX": 176,
    "veteranX": 272,
    "dogX": 252,
    "bitchX": 317,
    "sexCheckY": 247,
    "firstTimeEntryX": 30,
    "firstTimeEntryY": 425,
    "changeInfoX": 30,
    "changeInfoY": 467,
    "checkSize": 7,
    "signatureX": 230,
    "signatureY": 581,
}


def utc_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    TRIAL_ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS state_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                previous_state BLOB NOT NULL,
                previous_hash TEXT NOT NULL,
                resulting_hash TEXT NOT NULL,
                summary TEXT NOT NULL
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


def state_content_json(state: dict | None) -> str:
    data = copy.deepcopy((state or {}).get("data") or {})
    if isinstance(data, dict):
        # Changing the selected trial is navigation, not a data action worth undoing.
        data.pop("activeTrialId", None)
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def state_content_hash(state: dict | None) -> str:
    return hashlib.sha256(state_content_json(state).encode("utf-8")).hexdigest()


def summarize_state_change(previous: dict, current: dict) -> str:
    previous_data = previous.get("data") if isinstance(previous.get("data"), dict) else {}
    current_data = current.get("data") if isinstance(current.get("data"), dict) else {}
    summaries: list[str] = []
    previous_trials = {
        str(row.get("id") or row.get("trialId") or index): row
        for index, row in enumerate(previous_data.get("trials") or [])
        if isinstance(row, dict)
    }
    current_trials = {
        str(row.get("id") or row.get("trialId") or index): row
        for index, row in enumerate(current_data.get("trials") or [])
        if isinstance(row, dict)
    }
    changed_trial_ids = {
        trial_id
        for trial_id in previous_trials.keys() | current_trials.keys()
        if previous_trials.get(trial_id) != current_trials.get(trial_id)
    }
    if len(changed_trial_ids) == 1:
        trial_id = next(iter(changed_trial_ids))
        trial = current_trials.get(trial_id) or previous_trials.get(trial_id) or {}
        name = str(trial.get("trialName") or trial.get("clubName") or "selected trial").strip()
        summaries.append(f"Trial change: {name}")
    elif changed_trial_ids:
        summaries.append(f"Changes across {len(changed_trial_ids)} trials")
    collection_labels = (
        ("masterHounds", "hound database"),
        ("masterJudges", "judge database"),
        ("masterWorkers", "worker database"),
        ("formTemplateStatus", "form templates"),
        ("formAlignment", "report alignment"),
        ("entryImportTemplates", "import mappings"),
        ("deletedTrials", "deleted-trial recovery list"),
    )
    for key, label in collection_labels:
        if previous_data.get(key) != current_data.get(key):
            summaries.append(label.capitalize())
    return "; ".join(summaries[:3]) if summaries else "Last saved data change"


def undo_status() -> dict:
    ensure_database()
    with sqlite3.connect(DB_PATH) as conn:
        current_row = conn.execute(
            "SELECT state_json FROM app_state WHERE key = ?", (STATE_KEY,)
        ).fetchone()
        history_row = conn.execute(
            "SELECT created_at, resulting_hash, summary FROM state_history ORDER BY id DESC LIMIT 1"
        ).fetchone()
        history_count = conn.execute("SELECT COUNT(*) FROM state_history").fetchone()[0]
    if not current_row or not history_row:
        return {"available": False, "historyCount": int(history_count or 0), "message": "No recent action is available to undo."}
    current_state = json.loads(current_row[0])
    if state_content_hash(current_state) != history_row[1]:
        return {
            "available": False,
            "historyCount": int(history_count or 0),
            "message": "The current data no longer matches the undo history. Create or restore a SQLite backup instead.",
        }
    return {
        "available": True,
        "historyCount": int(history_count or 0),
        "createdAt": history_row[0],
        "summary": history_row[2],
    }


def undo_last_action() -> dict:
    ensure_database()
    status = undo_status()
    if not status.get("available"):
        raise ValueError(status.get("message") or "No recent action is available to undo.")
    safety_backup = create_database_backup("before_undo_last_action")
    restored_at = utc_now()
    with sqlite3.connect(DB_PATH) as conn:
        current_row = conn.execute(
            "SELECT state_json FROM app_state WHERE key = ?", (STATE_KEY,)
        ).fetchone()
        history_row = conn.execute(
            "SELECT id, previous_state, resulting_hash, summary FROM state_history ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not current_row or not history_row:
            raise ValueError("No recent action is available to undo.")
        current_state = json.loads(current_row[0])
        if state_content_hash(current_state) != history_row[2]:
            raise ValueError("The data changed before the undo could be completed. Try again.")
        restored_state = json.loads(zlib.decompress(history_row[1]).decode("utf-8"))
        restored_state["savedToSQLiteAt"] = restored_at
        restored_json = json.dumps(restored_state, ensure_ascii=False, separators=(",", ":"))
        conn.execute(
            "UPDATE app_state SET state_json = ?, updated_at = ? WHERE key = ?",
            (restored_json, restored_at, STATE_KEY),
        )
        conn.execute("DELETE FROM state_history WHERE id = ?", (history_row[0],))
        conn.commit()
    return {
        "state": restored_state,
        "undone": history_row[3],
        "savedToSQLiteAt": restored_at,
        "safetyBackup": safety_backup,
        "undo": undo_status(),
    }


def database_integrity_status() -> dict:
    ensure_database()
    started = datetime.now()
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute("PRAGMA integrity_check").fetchall()
    messages = [str(row[0]) for row in rows if row]
    ok = messages == ["ok"]
    elapsed_ms = int((datetime.now() - started).total_seconds() * 1000)
    return {
        "ok": ok,
        "status": "ok" if ok else "error",
        "messages": messages,
        "checkedAt": utc_now(),
        "elapsedMs": elapsed_ms,
        "dbPath": str(DB_PATH),
    }


def normalize_backup_retention(value: object) -> int:
    try:
        count = int(value)
    except (TypeError, ValueError):
        count = DEFAULT_MAX_DB_BACKUPS
    return max(MIN_DB_BACKUPS, min(MAX_DB_BACKUPS_LIMIT, count))


def read_app_settings() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    settings = {"maxDbBackups": DEFAULT_MAX_DB_BACKUPS}
    try:
        loaded = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            settings.update(loaded)
    except Exception:
        pass
    settings["maxDbBackups"] = normalize_backup_retention(settings.get("maxDbBackups"))
    return settings


def write_app_settings(settings: dict) -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    current = read_app_settings()
    current["maxDbBackups"] = normalize_backup_retention(settings.get("maxDbBackups", current.get("maxDbBackups")))
    SETTINGS_PATH.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
    prune_backups()
    return current


def prune_backups() -> None:
    max_backups = normalize_backup_retention(read_app_settings().get("maxDbBackups"))
    backups = sorted(DB_BACKUP_DIR.glob("field_trial_secretary-*.sqlite"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_backup in backups[max_backups:]:
        old_backup.unlink(missing_ok=True)


def create_database_backup(reason: str) -> str:
    ensure_database()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
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


def list_database_backups() -> list[dict]:
    DB_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    backup_paths = {path.resolve() for path in DB_BACKUP_DIR.glob("*.sqlite") if path.is_file()}
    for path in sorted(backup_paths, key=lambda item: item.stat().st_mtime, reverse=True):
        stat = path.stat()
        rows.append(
            {
                "fileName": path.name,
                "path": str(path),
                "size": stat.st_size,
                "modifiedAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            }
        )
    return rows


def backup_path_from_name(file_name: str) -> Path:
    cleaned = Path(str(file_name or "")).name
    if not cleaned or not cleaned.endswith(".sqlite"):
        raise ValueError("Choose a SQLite backup file.")
    path = (DB_BACKUP_DIR / cleaned).resolve()
    backup_root = DB_BACKUP_DIR.resolve()
    if backup_root not in path.parents or not path.exists() or not path.is_file():
        raise ValueError("Backup file was not found.")
    return path


def restore_database_backup(file_name: str) -> dict:
    ensure_database()
    backup_path = backup_path_from_name(file_name)
    pre_restore_path = create_database_backup("before_sqlite_restore")
    shutil.copy2(backup_path, DB_PATH)
    return {
        "restoredFrom": str(backup_path),
        "preRestoreBackup": pre_restore_path,
        "state": read_state(),
    }


def safe_filename_part(value: object, fallback: str = "trial") -> str:
    text = str(value or fallback).strip().lower()
    cleaned = "".join(char if char.isalnum() else "-" for char in text)
    cleaned = "-".join(part for part in cleaned.split("-") if part)
    return cleaned or fallback


def create_trial_archive_package(payload: dict) -> tuple[bytes, str, str]:
    ensure_database()
    trial = payload.get("trial")
    state = payload.get("state")
    if not isinstance(trial, dict):
        raise ValueError("trial must be an object")
    if not isinstance(state, dict):
        raise ValueError("state must be an object")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    trial_slug = safe_filename_part(
        "_".join(str(trial.get(key) or "") for key in ("startsOn", "clubName", "trialName")).strip("_"),
        "field-trial",
    )
    filename = f"{trial_slug}-final-archive-{timestamp}.zip"
    archive_path = TRIAL_ARCHIVE_DIR / filename
    sqlite_backup_path = Path(create_database_backup("final_trial_archive"))
    notes: list[str] = [
        f"Archive created: {utc_now()}",
        f"Trial: {trial.get('trialName') or 'Untitled trial'}",
        f"Club: {trial.get('clubName') or ''}",
        f"Date: {trial.get('startsOn') or ''}",
        "",
        "The SQLite backup contains the uploaded first-time-entry documents stored in the entry_documents table.",
    ]

    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.write(sqlite_backup_path, f"database/{sqlite_backup_path.name}")
        archive.writestr("trial-data/trial.json", json.dumps(trial, ensure_ascii=False, indent=2))
        archive.writestr("trial-data/full-state.json", json.dumps(state, ensure_ascii=False, indent=2))

        if clean_text(trial.get("association") or "ASFA") == "ASFA":
            record_layout = payload.get("recordLayout") if isinstance(payload.get("recordLayout"), dict) else None
            secretary_layout = payload.get("secretaryLayout") if isinstance(payload.get("secretaryLayout"), dict) else None
            try:
                entry_layout = payload.get("entryLayout") if isinstance(payload.get("entryLayout"), dict) else None
                lci_entry_layout = payload.get("lciEntryLayout") if isinstance(payload.get("lciEntryLayout"), dict) else None
                archive.writestr("reports/asfa-record-packet.pdf", generate_asfa_record_sheet_pdf(trial, "", "", record_layout, "alpha", entry_layout, lci_entry_layout, secretary_layout, True, True, False, True))
            except Exception as exc:
                notes.append(f"ASFA record packet was not generated: {exc}")
            try:
                archive.writestr("reports/asfa-secretary-report.pdf", generate_asfa_secretary_report_pdf(trial, secretary_layout))
            except Exception as exc:
                notes.append(f"ASFA secretary report was not generated: {exc}")

        archive.writestr("README.txt", "\n".join(notes) + "\n")

    return archive_path.read_bytes(), filename, str(archive_path)


def should_skip_transfer_file(path: Path) -> bool:
    parts = set(path.relative_to(ROOT).parts)
    return bool(parts & {".git", ".agents", ".codex", "__pycache__", "build", "tmp", "output", "transfer_packages"})


def add_directory_to_archive(archive: zipfile.ZipFile, source: Path, prefix: str) -> None:
    if not source.exists():
        return
    for path in source.rglob("*"):
        if not path.is_file() or should_skip_transfer_file(path):
            continue
        archive.write(path, f"{prefix}/{path.relative_to(source).as_posix()}")


def latest_portable_zip() -> Path | None:
    portable_dir = ROOT / "portable"
    if not portable_dir.exists():
        return None
    zips = sorted(portable_dir.glob("*.zip"), key=lambda path: path.stat().st_mtime, reverse=True)
    return zips[0] if zips else None


def portable_package_folder() -> Path:
    return ROOT / "portable" / "Field Trial Secretary"


def app_version_info() -> dict:
    fallback = {
        "name": "Field Trial Secretary",
        "version": "0.0.0",
        "releaseDate": "",
        "channel": "local",
        "notes": "",
    }
    try:
        data = json.loads(VERSION_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = {}
    if not isinstance(data, dict):
        data = {}
    merged = {**fallback, **data}
    merged["version"] = str(merged.get("version") or fallback["version"])
    return merged


PROGRAM_UPDATER = update_manager.UpdateManager(ROOT, STORAGE_ROOT, DB_PATH, app_version_info().get("version", "0.0.0"))

def app_version_label() -> str:
    version = app_version_info().get("version") or "0.0.0"
    return re.sub(r"[^0-9A-Za-z._-]+", "-", str(version)).strip("-") or "0.0.0"


def newest_relevant_app_file() -> tuple[Path | None, float]:
    candidates: list[Path] = []
    for file_name in RESTORABLE_ROOT_FILES:
        candidates.append(ROOT / file_name)
    for folder in (APP_DIR, ROOT / "database"):
        if folder.exists():
            candidates.extend(path for path in folder.rglob("*") if path.is_file())
    newest_path: Path | None = None
    newest_time = 0.0
    for path in candidates:
        if not path.exists() or not path.is_file() or should_skip_transfer_file(path):
            continue
        mtime = path.stat().st_mtime
        if mtime > newest_time:
            newest_path = path
            newest_time = mtime
    return newest_path, newest_time


def portable_package_status() -> dict:
    portable_zip = latest_portable_zip()
    newest_path, newest_time = newest_relevant_app_file()
    if not portable_zip:
        return {
            "hasPortable": False,
            "current": False,
            "appVersion": app_version_info(),
            "message": "No portable zip was found.",
            "newestAppFile": str(newest_path) if newest_path else "",
            "newestAppFileModifiedAt": datetime.fromtimestamp(newest_time).isoformat() if newest_time else "",
        }
    zip_time = portable_zip.stat().st_mtime
    current = not newest_time or zip_time >= newest_time
    return {
        "hasPortable": True,
        "current": current,
        "appVersion": app_version_info(),
        "zipName": portable_zip.name,
        "zipPath": str(portable_zip),
        "zipModifiedAt": datetime.fromtimestamp(zip_time).isoformat(),
        "zipSize": portable_zip.stat().st_size,
        "newestAppFile": str(newest_path) if newest_path else "",
        "newestAppFileModifiedAt": datetime.fromtimestamp(newest_time).isoformat() if newest_time else "",
        "message": "Portable package is current." if current else "Portable package is older than current app files.",
    }


def build_portable_package() -> dict:
    if getattr(sys, "frozen", False):
        raise ValueError("This app is running from the portable EXE. Close it, open the source-folder copy of Field Trial Secretary on the build computer, then run Build Portable EXE from Admin > Tools.")
    script = ROOT / "build_portable_package.ps1"
    if not script.exists():
        raise FileNotFoundError("build_portable_package.ps1 was not found.")
    before = latest_portable_zip()
    command = [
        "powershell.exe",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script),
    ]
    result = subprocess.run(
        command,
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=900,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout or "Portable build failed.").strip())
    after = latest_portable_zip()
    if not after or (before and after == before and after.stat().st_mtime <= before.stat().st_mtime):
        raise RuntimeError("Portable build completed, but no new portable zip was found.")
    return {
        "zipName": after.name,
        "zipPath": str(after),
        "zipModifiedAt": datetime.fromtimestamp(after.stat().st_mtime).isoformat(),
        "zipSize": after.stat().st_size,
        "stdout": result.stdout[-4000:],
        "status": portable_package_status(),
    }


def create_transfer_package(payload: dict) -> tuple[bytes, str, str]:
    ensure_database()
    state = payload.get("state")
    if state is not None and not isinstance(state, dict):
        raise ValueError("state must be an object")

    status = portable_package_status()
    if not status.get("hasPortable") or not status.get("current"):
        build_portable_package()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    version_label = app_version_label()
    filename = f"field-trial-secretary-{version_label}-installer-{timestamp}.zip"
    TRANSFER_PACKAGE_DIR.mkdir(parents=True, exist_ok=True)
    package_path = TRANSFER_PACKAGE_DIR / filename
    package_folder = portable_package_folder()
    if not package_folder.exists():
        raise RuntimeError("Portable package folder was not created.")

    notes = [
        "Field Trial Secretary Installer Package",
        f"Version: {app_version_info().get('version')}",
        f"Created: {utc_now()}",
        "",
        "What is included:",
        "- FieldTrialSecretary.exe and its bundled Python runtime files",
        "- current SQLite database: Field Trial Secretary\\data\\field_trial_secretary.sqlite",
        "- blank starter database: Field Trial Secretary\\data\\blank_field_trial_secretary.sqlite",
        "- app files and official PDF templates",
        "- empty backup folders that the app will use on the new computer",
        "",
        "Move to another computer:",
        "1. Copy this zip to the other computer.",
        "2. Right-click the zip and choose Extract All.",
        "3. Extract it into the folder where you want the app to live.",
        "4. Open the Field Trial Secretary folder.",
        "5. Double-click Start Field Trial Secretary.vbs, or use the desktop shortcut if one was created.",
        "",
        "Run without installing:",
        "Open Field Trial Secretary and double-click Start Field Trial Secretary.vbs.",
        "",
        "Important: create a fresh transfer package after making program changes or entering new trial data.",
        "The target computer does not need Python installed.",
    ]

    with zipfile.ZipFile(package_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("README-TRANSFER.txt", "\n".join(notes) + "\n")
        archive.writestr(
            "Start Field Trial Secretary.bat",
            '@echo off\r\n'
            'cd /d "%~dp0Field Trial Secretary"\r\n'
            'call "Start Field Trial Secretary.bat"\r\n',
        )
        archive.writestr(
            "Start Field Trial Secretary.vbs",
            'Set shell = CreateObject("WScript.Shell")\r\n'
            'Set fso = CreateObject("Scripting.FileSystemObject")\r\n'
            'root = fso.GetParentFolderName(WScript.ScriptFullName)\r\n'
            'appFolder = fso.BuildPath(root, "Field Trial Secretary")\r\n'
            'shell.CurrentDirectory = appFolder\r\n'
            'shell.Run """" & fso.BuildPath(appFolder, "Start Field Trial Secretary.vbs") & """", 0, False\r\n',
        )
        for path in package_folder.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(package_folder).as_posix()
            if relative.startswith("backups/database/") or relative.startswith("backups/trial_archives/"):
                continue
            if relative.startswith("backups/transfer_packages/") or relative.startswith("backups/app_file_restores/"):
                continue
            archive.write(path, f"Field Trial Secretary/{relative}")

    return package_path.read_bytes(), filename, str(package_path)


def create_program_update_package() -> tuple[bytes, str, str]:
    status = portable_package_status()
    if not status.get("hasPortable") or not status.get("current"):
        build_portable_package()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    version_label = app_version_label()
    filename = f"field-trial-secretary-{version_label}-program-update-{timestamp}.zip"
    TRANSFER_PACKAGE_DIR.mkdir(parents=True, exist_ok=True)
    package_path = TRANSFER_PACKAGE_DIR / filename
    package_folder = portable_package_folder()
    if not package_folder.exists():
        raise RuntimeError("Portable package folder was not created.")

    update_bat = (
        '@echo off\r\n'
        'setlocal\r\n'
        'set "SOURCE=%~dp0Field Trial Secretary"\r\n'
        'set "DEFAULT_TARGET=%USERPROFILE%\\Documents\\Field Trial Secretary Portable"\r\n'
        'echo Field Trial Secretary program updater\r\n'
        'echo.\r\n'
        'echo This updates program files only. It will not replace your SQLite trial database.\r\n'
        'echo.\r\n'
        'echo Press Enter to use the default target folder, or type the folder to update:\r\n'
        'echo %DEFAULT_TARGET%\r\n'
        'echo.\r\n'
        'set /P "TARGET=Install folder to update: "\r\n'
        'if "%TARGET%"=="" set "TARGET=%DEFAULT_TARGET%"\r\n'
        'echo.\r\n'
        'echo Target: %TARGET%\r\n'
        'choice /C YN /M "Continue"\r\n'
        'if errorlevel 2 exit /b 1\r\n'
        'if not exist "%TARGET%" mkdir "%TARGET%"\r\n'
        'for /D %%D in ("%SOURCE%\\*") do (\r\n'
        '  if /I not "%%~nxD"=="data" if /I not "%%~nxD"=="backups" xcopy "%%~fD" "%TARGET%\\%%~nxD\\" /E /I /Y >nul\r\n'
        ')\r\n'
        'for %%F in ("%SOURCE%\\*") do (\r\n'
        '  xcopy "%%~fF" "%TARGET%\\" /Y >nul\r\n'
        ')\r\n'
        'if exist "%SOURCE%\\data\\blank_field_trial_secretary.sqlite" (\r\n'
        '  if not exist "%TARGET%\\data" mkdir "%TARGET%\\data"\r\n'
        '  copy /Y "%SOURCE%\\data\\blank_field_trial_secretary.sqlite" "%TARGET%\\data\\blank_field_trial_secretary.sqlite" >nul\r\n'
        ')\r\n'
        'if errorlevel 1 (\r\n'
        '  echo.\r\n'
        '  echo Update did not complete.\r\n'
        '  pause\r\n'
        '  exit /b 1\r\n'
        ')\r\n'
        'echo.\r\n'
        'echo Update complete. Your SQLite database was left alone.\r\n'
        'pause\r\n'
    )

    notes = [
        "Field Trial Secretary Program Update Package",
        f"Version: {app_version_info().get('version')}",
        f"Created: {utc_now()}",
        "",
        "This package updates program files only.",
        "It does not include or replace data\\field_trial_secretary.sqlite.",
        "",
        "Use on a computer that already has Field Trial Secretary installed:",
        "1. Close Field Trial Secretary on that computer.",
        "2. Copy this zip to that computer.",
        "3. Right-click the zip and choose Extract All.",
        "4. Double-click Update Field Trial Secretary.bat.",
        "5. Press Enter for the default folder or type the installed app folder.",
        "6. Start Field Trial Secretary again.",
    ]

    with zipfile.ZipFile(package_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("README-PROGRAM-UPDATE.txt", "\n".join(notes) + "\n")
        archive.writestr("Update Field Trial Secretary.bat", update_bat)
        for path in package_folder.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(package_folder).as_posix()
            if relative == "data/field_trial_secretary.sqlite":
                continue
            if relative.startswith("backups/"):
                continue
            archive.write(path, f"Field Trial Secretary/{relative}")

    return package_path.read_bytes(), filename, str(package_path)


RESTORABLE_ROOT_FILES = {
    "update_manager.py",
    "server.py",
    "start_field_trial_secretary.ps1",
    "build_portable_package.ps1",
    "backup_field_trial_secretary.ps1",
    "FieldTrialSecretary.spec",
    "README.md",
    "BACKUP_AND_TRANSFER.md",
    "PHASE_1_SQLITE_MODE.md",
    "TRIAL_DAY_DATA_SAFETY.md",
}


def is_restorable_app_file(member_name: str) -> bool:
    normalized = member_name.replace("\\", "/").lstrip("/")
    if not normalized or normalized.endswith("/"):
        return False
    parts = normalized.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        return False
    if parts[0] in {"app", "database"}:
        return True
    return len(parts) == 1 and parts[0] in RESTORABLE_ROOT_FILES


def create_app_files_restore_backup() -> str:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    APP_RESTORE_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = APP_RESTORE_BACKUP_DIR / f"app-files-before-restore-{timestamp}.zip"
    with zipfile.ZipFile(backup_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_name in sorted(RESTORABLE_ROOT_FILES):
            path = ROOT / file_name
            if path.exists() and path.is_file():
                archive.write(path, file_name)
        add_directory_to_archive(archive, APP_DIR, "app")
        add_directory_to_archive(archive, ROOT / "database", "database")
    return str(backup_path)


def restore_app_files_from_transfer_package(payload: dict) -> dict:
    encoded = str(payload.get("contentBase64") or "")
    if "," in encoded and encoded.split(",", 1)[0].startswith("data:"):
        encoded = encoded.split(",", 1)[1]
    if not encoded.strip():
        raise ValueError("Transfer package file was empty.")
    package_bytes = base64.b64decode(encoded)
    pre_restore_backup = create_app_files_restore_backup()
    restored: list[str] = []
    skipped: list[str] = []
    with zipfile.ZipFile(io.BytesIO(package_bytes)) as archive:
        for member in archive.infolist():
            normalized = member.filename.replace("\\", "/").lstrip("/")
            if not is_restorable_app_file(normalized):
                if normalized and not normalized.endswith("/"):
                    skipped.append(normalized)
                continue
            target = (ROOT / normalized).resolve()
            if ROOT.resolve() not in target.parents and target != ROOT.resolve():
                skipped.append(normalized)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source, open(target, "wb") as destination:
                shutil.copyfileobj(source, destination)
            restored.append(normalized)
    if not restored:
        raise ValueError("No restorable app files were found in that transfer package.")
    return {
        "restoredCount": len(restored),
        "restored": restored[:25],
        "skippedCount": len(skipped),
        "preRestoreBackup": pre_restore_backup,
    }


def restart_command(host: str, port: int) -> list[str]:
    if getattr(sys, "frozen", False):
        return [sys.executable, "--host", host, "--port", str(port)]
    return [sys.executable, str(ROOT / "server.py"), "--host", host, "--port", str(port)]


def restart_server(server: ThreadingHTTPServer) -> None:
    host, port = server.server_address[:2]
    host = str(host or "127.0.0.1")
    command = restart_command(host, int(port))
    time.sleep(0.4)
    server.shutdown()
    server.server_close()
    time.sleep(1.0)
    kwargs = {
        "cwd": str(ROOT),
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if sys.platform.startswith("win"):
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
    subprocess.Popen(command, **kwargs)


def shutdown_server(server: ThreadingHTTPServer) -> None:
    time.sleep(0.4)
    server.shutdown()
    server.server_close()


def write_state(state: dict) -> dict:
    with STATE_WRITE_LOCK:
        return write_state_unlocked(state)


def write_state_unlocked(state: dict) -> dict:
    if PROGRAM_UPDATER.installing:
        raise RuntimeError("An update is installing; state writes are paused.")
    ensure_database()
    if DB_PATH.exists():
        create_database_backup("before_state_save")
    updated_at = utc_now()
    state = {**state, "savedToSQLiteAt": updated_at}
    state_json = json.dumps(state, ensure_ascii=False, separators=(",", ":"))
    with sqlite3.connect(DB_PATH) as conn:
        previous_row = conn.execute(
            "SELECT state_json FROM app_state WHERE key = ?", (STATE_KEY,)
        ).fetchone()
        if previous_row:
            previous_state = json.loads(previous_row[0])
            previous_hash = state_content_hash(previous_state)
            resulting_hash = state_content_hash(state)
            if previous_hash != resulting_hash:
                conn.execute(
                    """
                    INSERT INTO state_history (
                        created_at, previous_state, previous_hash, resulting_hash, summary
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        updated_at,
                        sqlite3.Binary(zlib.compress(previous_row[0].encode("utf-8"), level=6)),
                        previous_hash,
                        resulting_hash,
                        summarize_state_change(previous_state, state),
                    ),
                )
                conn.execute(
                    """
                    DELETE FROM state_history
                    WHERE id NOT IN (
                        SELECT id FROM state_history ORDER BY id DESC LIMIT ?
                    )
                    """,
                    (MAX_UNDO_HISTORY,),
                )
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


def render_template_half_page_png(template_path: Path, cache_key: str, split_x: float, page_index: int = 0) -> bytes:
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
            page_width = float(page.get_width())
            split_pixels = int((split_x / page_width) * image.width)
            cropped = image.crop((0, 0, split_pixels, image.height))
            buffer = io.BytesIO()
            cropped.save(buffer, format="PNG")
            body = buffer.getvalue()
            TEMPLATE_IMAGE_CACHE[cache_key] = body
            return body
        finally:
            document.close()


class _NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _public_document_url(url: object) -> str:
    value = str(url or "").strip()
    parsed = urlparse(value)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Document links must use http:// or https://.")
    try:
        addresses = {
            result[4][0].split("%", 1)[0]
            for result in socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme.lower() == "https" else 80))
        }
    except socket.gaierror as exc:
        raise ValueError("The document link host could not be found.") from exc
    if not addresses:
        raise ValueError("The document link host could not be found.")
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValueError("Private or local-network document links are not allowed.")
    return value


def _normalized_document_download_url(url: object) -> str:
    value = str(url or "").strip()
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    if host in {"drive.google.com", "www.drive.google.com"}:
        match = re.search(r"/file/d/([^/]+)", parsed.path)
        query = parse_qs(parsed.query)
        file_id = match.group(1) if match else (query.get("id") or [""])[0]
        if file_id:
            return f"https://drive.google.com/uc?{urlencode({'export': 'download', 'id': file_id})}"
    if host in {"dropbox.com", "www.dropbox.com"}:
        query = parse_qs(parsed.query)
        query["dl"] = ["1"]
        return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))
    return value


def _document_type(content: bytes) -> tuple[str, str]:
    if content.startswith(b"%PDF-"):
        return "application/pdf", ".pdf"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    raise ValueError("The link did not return a PDF, JPEG, or PNG file. It may require a login or permission change.")


def _download_file_name(url: str, headers, extension: str) -> str:
    disposition = str(headers.get("Content-Disposition") or "")
    match = re.search(r"filename\*?=(?:UTF-8''|[\"']?)([^\"';]+)", disposition, flags=re.IGNORECASE)
    candidate = unquote(match.group(1).strip()) if match else unquote(Path(urlparse(url).path).name)
    candidate = re.sub(r"[^A-Za-z0-9._ -]+", "_", candidate).strip(" ._") or "entry-document"
    if Path(candidate).suffix.lower() not in {".pdf", ".png", ".jpg", ".jpeg"}:
        candidate = f"{candidate}{extension}"
    return candidate


def save_entry_document_bytes(
    content: bytes,
    file_name: object,
    mime_type: object,
    source: object,
    document_id: object = None,
) -> dict:
    ensure_database()
    if not content:
        raise ValueError("The document is empty.")
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValueError("Document is larger than the 20 MB limit.")
    saved_id = str(document_id or f"doc-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}")
    saved_name = str(file_name or "entry-document").strip()
    saved_mime = str(mime_type or "application/octet-stream").strip()
    saved_source = str(source or "Entry document").strip()
    created_at = utc_now()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO entry_documents (id, file_name, mime_type, content, size_bytes, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (saved_id, saved_name, saved_mime, sqlite3.Binary(content), len(content), saved_source, created_at),
        )
        conn.commit()
    return {
        "id": saved_id,
        "fileName": saved_name,
        "mimeType": saved_mime,
        "sizeBytes": len(content),
        "source": saved_source,
        "createdAt": created_at,
    }


def save_entry_document(payload: dict) -> dict:
    encoded = str(payload.get("contentBase64") or "")
    if "," in encoded and encoded.split(",", 1)[0].startswith("data:"):
        encoded = encoded.split(",", 1)[1]
    if not encoded:
        raise ValueError("contentBase64 is required")
    content = base64.b64decode(encoded, validate=True)
    return save_entry_document_bytes(
        content,
        payload.get("fileName") or "entry-document",
        payload.get("mimeType") or "application/octet-stream",
        payload.get("source") or "Jotform email",
        payload.get("id"),
    )


def save_linked_entry_document(payload: dict) -> dict:
    requested_url = _normalized_document_download_url(payload.get("url"))
    current_url = requested_url
    opener = build_opener(_NoRedirectHandler())
    response = None
    for _ in range(5):
        current_url = _public_document_url(current_url)
        request = Request(
            current_url,
            headers={
                "User-Agent": "Field-Trial-Secretary/0.3",
                "Accept": "application/pdf,image/png,image/jpeg",
            },
        )
        try:
            response = opener.open(request, timeout=20)
            break
        except HTTPError as exc:
            if exc.code in {301, 302, 303, 307, 308} and exc.headers.get("Location"):
                current_url = urljoin(current_url, exc.headers["Location"])
                continue
            raise ValueError(f"The document link could not be downloaded (HTTP {exc.code}).") from exc
        except URLError as exc:
            raise ValueError("The document link could not be downloaded.") from exc
    if response is None:
        raise ValueError("The document link redirected too many times.")
    with response:
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > MAX_DOCUMENT_BYTES:
            raise ValueError("Document is larger than the 20 MB limit.")
        content = response.read(MAX_DOCUMENT_BYTES + 1)
        mime_type, extension = _document_type(content)
        file_name = _download_file_name(current_url, response.headers, extension)
    source_host = urlparse(requested_url).hostname or "linked document"
    return save_entry_document_bytes(
        content,
        file_name,
        mime_type,
        f"Entry import link from {source_host}",
    )


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
            str(group.get("flight") or ""),
        )

    return sorted(groups, key=sort_key)


def clean_text(value: object) -> str:
    return "".join(ch for ch in str(value or "").upper() if ch.isalnum())


def safe_text(value: object, limit: int = 28) -> str:
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 1)].rstrip() + "."


def field_name_for_breed(trial: dict, breed: object) -> str:
    """Return a field label only when this trial actually uses multiple fields."""
    fields = list(trial.get("eventFields") or [])
    if len(fields) <= 1:
        return ""
    target = clean_text(breed)
    run_row = next((row for row in trial.get("runPlan") or [] if clean_text(row.get("breed")) == target), None)
    if not run_row:
        return ""
    field_id = str(run_row.get("fieldId") or "")
    field = next((item for item in fields if str(item.get("id") or "") == field_id), None)
    return str((field or {}).get("name") or field_id).strip()


def printable_field_label(trial: dict, breed: object) -> str:
    name = field_name_for_breed(trial, breed)
    return f"FIELD: {name}" if name else ""

def draw_field_label(pdf: canvas.Canvas, field_name: object, x: float, y: float, *, right: bool = False, font_size: float = 7) -> None:
    name = str(field_name or "").strip()
    if not name:
        return
    pdf.saveState()
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica-Bold", font_size)
    label = safe_text(f"FIELD: {name}", 34)
    if right:
        pdf.drawRightString(x, y, label)
    else:
        pdf.drawString(x, y, label)
    pdf.restoreState()


def draw_courses_by_field(course_blocks: list[dict]) -> list[tuple[str, list[dict]]]:
    """Keep every printed draw page within one field while preserving run order."""
    grouped: list[tuple[str, list[dict]]] = []
    positions: dict[str, int] = {}
    for block in course_blocks:
        field_name = str(block.get("fieldName") or "").strip()
        key = clean_text(field_name) or "__UNASSIGNED__"
        if key not in positions:
            positions[key] = len(grouped)
            grouped.append((field_name, []))
        grouped[positions[key]][1].append(block)
    return grouped


def printable_hound_name(hound: dict) -> str:
    name = hound.get("callName") or hound.get("registeredName") or "Unnamed hound"
    text = re.sub(r"\s*\(\s*sep(?:arate)?\s+[A-Z0-9]{1,3}\s*\)\s*$", "", str(name), flags=re.IGNORECASE)
    text = re.sub(r"\s*\(\s*(?:open|field champion|fch|veteran)?\s*BOB\s*\)\s*$", "", text, flags=re.IGNORECASE)
    return text.strip() or "Unnamed hound"


def generate_draw_sheet_pdf(trial: dict, layout: dict | None = None, copies: int = 1) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = DRAW_TEMPLATES.get(association, DRAW_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Draw sheet template not found: {template_path}")

    course_blocks = flatten_draw_courses(draw_groups_for_print(trial), trial)
    if not course_blocks:
        raise ValueError("No preliminary draw courses were found.")

    layout_settings = akc_draw_layout(layout) if association == "AKC" else asfa_draw_layout(layout)
    copy_count = max(1, min(10, int(copies or 1)))
    page_capacity = draw_sheet_page_capacity(association)
    writer = PdfWriter()

    for _field_name, field_courses in draw_courses_by_field(course_blocks):
        if association == "ASFA" and copy_count > 1 and len(field_courses) <= 7:
            for copy_start in range(0, copy_count, 3):
                copies_on_page = min(3, copy_count - copy_start)
                page_courses = []
                for _ in range(copies_on_page):
                    page_courses.extend(field_courses)
                    page_courses.extend([None] * (7 - len(field_courses)))
                page = fresh_template_page(template_path)
                overlay = PdfReader(io.BytesIO(build_draw_overlay(
                    trial,
                    association,
                    page_courses,
                    copy_start // 3 + 1,
                    1,
                    layout_settings,
                    True,
                ))).pages[0]
                page.merge_page(overlay)
                writer.add_page(page)
            continue

        for _copy_index in range(copy_count):
            for page_start in range(0, len(field_courses), page_capacity):
                page_courses = field_courses[page_start:page_start + page_capacity]
                page = fresh_template_page(template_path)
                overlay = PdfReader(io.BytesIO(build_draw_overlay(
                    trial,
                    association,
                    page_courses,
                    page_start // page_capacity + 1,
                    page_start + 1,
                    layout_settings,
                    False,
                ))).pages[0]
                page.merge_page(overlay)
                writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()



def akc_draw_layout(layout: dict | None) -> dict:
    merged = {**DEFAULT_AKC_DRAW_LAYOUT}
    if isinstance(layout, dict):
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            merged[key] = value
    return merged

def asfa_draw_layout(layout: dict | None) -> dict:
    merged = {**DEFAULT_ASFA_DRAW_LAYOUT}
    if isinstance(layout, dict):
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            merged[key] = value
    return merged


def draw_sheet_page_capacity(association: str) -> int:
    return 15 if association == "AKC" else 21


def flatten_draw_courses(groups: list[dict], trial: dict | None = None) -> list[dict]:
    blocks: list[dict] = []
    for group in groups:
        for course in group.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            blocks.append({
                "breed": group.get("breed") or "",
                "fieldName": field_name_for_breed(trial or {}, group.get("breed")),
                "stake": "Mixed" if group.get("mixedStake") else abbreviate_stake(group.get("stake") or ""),
                "mixedStake": bool(group.get("mixedStake")),
                "judgeBreed": group.get("judgeBreed"),
                "drawStake": group.get("drawStake"),
                "runoffText": group.get("runoffText") or "",
                "sourceFlight": group.get("flight") or "",
                "manualNote": group.get("manualNote") or "",
                "phase": group.get("phase") or "",
                "flight": group.get("flight") or "A",
                "course": course.get("number") or "",
                "hounds": hounds,
            })
    return blocks


def abbreviate_stake(stake: str) -> str:
    normalized = clean_text(stake)
    if normalized == "FIELDCHAMPION":
        return "FCh"
    return stake


def build_draw_overlay(trial: dict, association: str, course_blocks: list[dict | None], page_number: int, first_order: int, layout: dict, duplicate_copy_numbers: bool = False) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    pdf.setTitle("Official Draw Order Sheet")
    if association == "AKC":
        draw_akc_overlay(pdf, trial, course_blocks, page_number, first_order, layout)
    else:
        draw_asfa_overlay(pdf, trial, course_blocks, page_number, first_order, layout, duplicate_copy_numbers)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_overlay(pdf: canvas.Canvas, trial: dict, course_blocks: list[dict | None], page_number: int, first_order: int, layout: dict, duplicate_copy_numbers: bool = False) -> None:
    columns = [36, 297, 545]
    rows = [137, 200, 263, 326, 389, 452, 515]
    non_empty_blocks = [block for block in course_blocks if block]
    if any(block is None for block in course_blocks):
        logical_count = next((index for index, block in enumerate(course_blocks) if block is None), len(non_empty_blocks))
    else:
        logical_count = len(non_empty_blocks)
    field_name = next((str(block.get("fieldName") or "").strip() for block in non_empty_blocks if block.get("fieldName")), "")
    draw_page_header(pdf, trial, page_number, first_order, first_order + max(0, logical_count - 1), field_name)
    draw_field_above_draw_titles(pdf, field_name, columns, len(course_blocks), len(rows), 130)
    draw_sheet_numbers(pdf, columns, rows, len(course_blocks), page_number, 195, 58, duplicate_copy_numbers)
    pdf.setFont("Helvetica", 6)
    for index, block in enumerate(course_blocks):
        if not block:
            continue
        column, top = draw_block_position(index, columns, rows)
        draw_asfa_draw_sheet_phase_checks(pdf, column, block, trial, layout)
        pdf.drawString(column + layout["breedTextX"], y_from_top(top + 4 + layout["breedTextYAdjust"]), safe_text(block["breed"], 24))
        pdf.drawString(column + layout["stakeTextX"], y_from_top(top + 21 + layout["stakeTextYAdjust"]), safe_text(block["stake"], 12))
        pdf.drawString(column + 35, y_from_top(top + 36), safe_text(block.get("flight") or "A", 2))
        pdf.drawString(column + 35, y_from_top(top + 51), str(block["course"]))
        draw_hound_lines(pdf, column + 91, top + 21, block)


def draw_asfa_draw_sheet_phase_checks(pdf: canvas.Canvas, column: int, block: dict, trial: dict, layout: dict) -> None:
    phase = clean_text(block.get("phase") or (trial.get("preliminaryDraw") or {}).get("phase"))
    stake = clean_text(block.get("stake"))
    is_bob = phase in {"BOB"} or "BOB" in stake
    is_bif = phase in {"BIF"} or "BIF" in stake
    is_final = phase in {"FINAL", "FINALS"} or "FINAL" in stake
    is_runoff = phase in {"RUNOFF", "BOB"} or "RUNOFF" in stake or "TIE" in stake
    if is_runoff:
        draw_check(pdf, column + layout["runoffCheckX"] + layout["globalXAdjust"], layout["runoffCheckY"] + layout["globalYAdjust"], layout)
    elif is_final:
        draw_check(pdf, column + layout["finalCheckX"] + layout["globalXAdjust"], layout["finalCheckY"] + layout["globalYAdjust"], layout)
    elif not is_bif:
        draw_check(pdf, column + layout["prelimCheckX"] + layout["globalXAdjust"], layout["prelimCheckY"] + layout["globalYAdjust"], layout)
    if is_bob:
        draw_check(pdf, column + layout["bobCheckX"] + layout["globalXAdjust"], layout["bobCheckY"] + layout["globalYAdjust"], layout)
    if is_bif:
        draw_check(pdf, column + layout["bifCheckX"] + layout["globalXAdjust"], layout["bifCheckY"] + layout["globalYAdjust"], layout)


def draw_akc_existing_checkbox_mark(pdf: canvas.Canvas, x: float, top: float) -> None:
    """Mark a checkbox already printed on the official AKC template."""
    pdf.saveState()
    pdf.setFillColorRGB(0.85, 0, 0)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(x, y_from_top(top), "X")
    pdf.restoreState()


def draw_akc_overlay(pdf: canvas.Canvas, trial: dict, course_blocks: list[dict], page_number: int, first_order: int, layout: dict | None = None) -> None:
    columns = [27, 279, 540]
    field_name = next((str(block.get("fieldName") or "").strip() for block in course_blocks if block and block.get("fieldName")), "")
    draw_page_header(pdf, trial, page_number, first_order, first_order + len(course_blocks) - 1, field_name)

    layout_cfg = layout or {}
    global_x = float(layout_cfg.get("globalXAdjust", 0))
    global_y = float(layout_cfg.get("globalYAdjust", 0))
    block_start_y = float(layout_cfg.get("blockStartY", 132))
    block_y_step = float(layout_cfg.get("blockYStep", 91))
    rows = [block_start_y + (index * block_y_step) for index in range(5)]
    draw_field_above_draw_titles(pdf, field_name, columns, len(course_blocks), len(rows), 126)
    sheet_number_x = float(layout_cfg.get("sheetNumberX", 166))
    sheet_number_y = float(layout_cfg.get("sheetNumberY", 58))
    sheet_number_font_size = float(layout_cfg.get("sheetNumberFontSize", 12))
    draw_sheet_numbers(
        pdf, columns, rows, len(course_blocks), page_number,
        sheet_number_x + global_x, sheet_number_y + global_y,
        font_size=sheet_number_font_size, color=(0.85, 0, 0),
    )

    prelim_check_x = float(layout_cfg.get("prelimChkX", 57))
    final_check_x = float(layout_cfg.get("finalChkX", 104))
    runoff_check_x = float(layout_cfg.get("runoffChkX", 149))
    bif_check_x = float(layout_cfg.get("bifChkX", 192))
    legacy_phase_y = float(layout_cfg.get("phaseChkY", 86))
    prelim_check_y = float(layout_cfg.get("prelimChkY", legacy_phase_y))
    final_check_y = float(layout_cfg.get("finalChkY", legacy_phase_y))
    runoff_check_y = float(layout_cfg.get("runoffChkY", legacy_phase_y))
    bif_check_y = float(layout_cfg.get("bifChkY", legacy_phase_y))

    breed_centers = {
        "A": float(layout_cfg.get("breedCenterA", 9)),
        "BA": float(layout_cfg.get("breedCenterBA", 27)),
        "B": float(layout_cfg.get("breedCenterB", 46)),
        "G": float(layout_cfg.get("breedCenterG", 64)),
        "IB": float(layout_cfg.get("breedCenterIB", 81)),
        "IG": float(layout_cfg.get("breedCenterIG", 99)),
        "IW": float(layout_cfg.get("breedCenterIW", 118)),
        "P": float(layout_cfg.get("breedCenterP", 137)),
        "R": float(layout_cfg.get("breedCenterR", 152)),
        "S": float(layout_cfg.get("breedCenterS", 167)),
        "SD": float(layout_cfg.get("breedCenterSD", 184)),
        "W": float(layout_cfg.get("breedCenterW", 202)),
    }
    breed_aliases = {
        "AH": "A", "AFGHAN": "A",
        "BASENJI": "BA",
        "BZ": "B", "BORZOI": "B",
        "GH": "G", "GREYHOUND": "G",
        "IBIZAN": "IB",
        "ITALIAN": "IG",
        "IRISH": "IW",
        "PH": "P", "PHARAOH": "P",
        "RR": "R", "RHODESIAN": "R",
        "SA": "S", "SALUKI": "S",
        "DH": "SD", "SCOTTISH": "SD",
        "WH": "W", "WHIPPET": "W",
    }

    breed_circle_x_adjust = float(layout_cfg.get("breedCircleXAdjust", 0))
    breed_circle_y_offset = float(layout_cfg.get("breedCircleYOffset", 4))
    breed_circle_rx = float(layout_cfg.get("breedCircleRx", 10))
    breed_circle_ry = float(layout_cfg.get("breedCircleRy", 6))
    breed_circle_weight = float(layout_cfg.get("breedCircleWeight", 1.4))
    hound_font_size = float(layout_cfg.get("houndFontSize", 9.5))
    unlisted_breed_x = float(layout_cfg.get("unlistedBreedX", 8))
    unlisted_breed_y = float(layout_cfg.get("unlistedBreedY", 29))
    unlisted_breed_font_size = float(layout_cfg.get("unlistedBreedFontSize", 9.5))
    course_num_x_offset = float(layout_cfg.get("courseNumX", 8))
    course_num_y_offset = float(layout_cfg.get("courseNumY", 48))
    course_number_font_size = float(layout_cfg.get("courseNumberFontSize", 10))
    yellow_x_offset = float(layout_cfg.get("yellowX", layout_cfg.get("houndTextX", 52)))
    yellow_y_offset = float(layout_cfg.get("yellowY", 20))
    pink_x_offset = float(layout_cfg.get("pinkX", layout_cfg.get("houndTextX", 52)))
    pink_y_offset = float(layout_cfg.get("pinkY", 33))
    blue_x_offset = float(layout_cfg.get("blueX", layout_cfg.get("houndTextX", 52)))
    blue_y_offset = float(layout_cfg.get("blueY", 46))

    blocks_per_column = len(rows)
    for column_index, column_x in enumerate(columns):
        column_blocks = course_blocks[
            column_index * blocks_per_column:(column_index + 1) * blocks_per_column
        ]
        column_blocks = [block for block in column_blocks if block]
        if not column_blocks:
            continue
        first_block = column_blocks[0]
        stake = clean_text(first_block.get("stake") or "")
        phase = clean_text(first_block.get("phase") or "")
        is_final = "FINAL" in phase or "FINAL" in stake
        is_runoff = "RUNOFF" in phase or "RUNOFF" in stake or "BOB" in phase or "TIE" in stake
        is_bif = "BIF" in phase or "BIF" in stake
        checkbox_column_x = column_x + global_x
        if is_runoff:
            draw_akc_existing_checkbox_mark(pdf, checkbox_column_x + runoff_check_x, runoff_check_y + global_y)
        elif is_final:
            draw_akc_existing_checkbox_mark(pdf, checkbox_column_x + final_check_x, final_check_y + global_y)
        elif not is_bif:
            draw_akc_existing_checkbox_mark(pdf, checkbox_column_x + prelim_check_x, prelim_check_y + global_y)
        if is_bif:
            draw_akc_existing_checkbox_mark(pdf, checkbox_column_x + bif_check_x, bif_check_y + global_y)

    for index, block in enumerate(course_blocks):
        if not block:
            continue
        column, top = draw_block_position(index, columns, rows)
        column_x = column + global_x
        block_top = top + global_y


        raw_breed = clean_text(block.get("judgeBreed") or block.get("breed") or "")
        breed_key = raw_breed if raw_breed in breed_centers else breed_aliases.get(raw_breed)
        breed_offset = breed_centers.get(breed_key)
        if breed_offset is not None:
            center_x = column_x + breed_offset + breed_circle_x_adjust
            center_y = y_from_top(block_top + breed_circle_y_offset)
            pdf.setStrokeColorRGB(0.85, 0, 0)
            pdf.setLineWidth(breed_circle_weight)
            pdf.ellipse(
                center_x - breed_circle_rx, center_y - breed_circle_ry,
                center_x + breed_circle_rx, center_y + breed_circle_ry,
                stroke=1, fill=0,
            )
        elif raw_breed not in {"", "BIF", "BIE"}:
            label = "Singles" if raw_breed == "SINGLES" else clean_text(block.get("breed") or "")
            pdf.setFillColorRGB(0.85, 0, 0)
            pdf.setFont("Helvetica-Bold", unlisted_breed_font_size)
            pdf.drawString(
                column_x + unlisted_breed_x,
                y_from_top(block_top + unlisted_breed_y),
                label[:16],
            )

        pdf.setFillColorRGB(0.85, 0, 0)
        pdf.setFont("Helvetica-Bold", course_number_font_size)
        pdf.drawString(
            column_x + course_num_x_offset,
            y_from_top(block_top + course_num_y_offset),
            str(block["course"]),
        )

        # Keep the stake and flight with the course number when courses restart.
        stake_label = str(block.get("drawStake") or block.get("stake") or "").strip()
        if clean_text(stake_label) in {"FIELDCHAMPION", "FCH", "FC", "SPECIAL", "SPECIALS"}:
            stake_label = "Special"
        elif clean_text(stake_label) == "VETERAN":
            stake_label = "Veteran"
        label_size = 7.0
        while pdf.stringWidth(stake_label, "Helvetica-Bold", label_size) > 34 and label_size > 4:
            label_size -= 0.25
        pdf.setFont("Helvetica-Bold", label_size)
        pdf.drawCentredString(column_x + 18, y_from_top(block_top + course_num_y_offset + 8), stake_label)
        flight = str(block.get("sourceFlight") if block.get("judgeBreed") else block.get("flight") or "").strip()
        if flight:
            pdf.setFont("Helvetica-Bold", 7)
            pdf.drawCentredString(column_x + 18, y_from_top(block_top + course_num_y_offset + 16), "Flight " + flight)

        runoff_label = str(block.get("runoffText") or "").strip()
        if runoff_label:
            pdf.setFont("Helvetica-Bold", 8)
            pdf.drawString(column_x + yellow_x_offset, y_from_top(block_top + max(yellow_y_offset, pink_y_offset, blue_y_offset) + 12), safe_text("Runoff: " + runoff_label, 36))

        pdf.setFont("Helvetica-Bold", hound_font_size)
        pdf.setFillColorRGB(0.8, 0, 0)
        hounds_by_color = {
            clean_text(hound.get("blanketColor")): hound
            for hound in (block.get("hounds") or [])
        }
        color_positions = {
            "YELLOW": (yellow_x_offset, yellow_y_offset),
            "PINK": (pink_x_offset, pink_y_offset),
            "BLUE": (blue_x_offset, blue_y_offset),
        }
        for color, (x_offset, y_offset) in color_positions.items():
            hound = hounds_by_color.get(color)
            if not hound:
                continue
            line = safe_text(draw_sheet_hound_name(hound, block), 22)
            if hound.get("manuallyMoved"):
                line = safe_text(f"{line} (m)", 26)
            pdf.drawString(
                column_x + x_offset,
                y_from_top(block_top + y_offset),
                line,
            )
        pdf.setFillColorRGB(0, 0, 0)

def draw_page_header(pdf: canvas.Canvas, trial: dict, page_number: int, first_order: int, last_order: int, field_name: str = "") -> None:
    pdf.setFont("Helvetica-Bold", 6)
    title = " | ".join(str(part) for part in [
        trial.get("trialName") or "Trial",
        trial.get("startsOn") or "",
        trial.get("clubName") or "",
    ] if part)
    pdf.drawRightString(780, 604, safe_text(title, 95))
    if not field_name:
        pdf.drawRightString(780, 594, f"Courses {first_order}-{last_order}")


def draw_field_above_draw_titles(pdf: canvas.Canvas, field_name: str, columns: list[int], course_count: int, row_count: int, center_offset: float) -> None:
    if not field_name or not course_count or not row_count:
        return
    active_columns = min(len(columns), (course_count + row_count - 1) // row_count)
    pdf.saveState()
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica-Bold", 8)
    label = safe_text(f"FIELD: {field_name}", 34)
    for column in columns[:active_columns]:
        pdf.drawCentredString(column + center_offset, y_from_top(20), label)
    pdf.restoreState()


def draw_block_position(index: int, columns: list[int], rows: list[int]) -> tuple[int, int]:
    row_count = len(rows)
    column_index = index // row_count
    row_index = index % row_count
    return columns[column_index], rows[row_index]


def draw_sheet_numbers(pdf: canvas.Canvas, columns: list[int], rows: list[int], course_count: int, page_number: int, x_offset: int, title_top: int, duplicate_copy_numbers: bool = False, font_size: float = 10, color: tuple[float, float, float] = (0, 0, 0)) -> None:
    pdf.setFont("Helvetica-Bold", font_size)
    pdf.setFillColorRGB(*color)
    row_count = len(rows)
    first_sheet_number = ((page_number - 1) * len(columns)) + 1
    for column_index, column in enumerate(columns):
        if column_index * row_count >= course_count:
            continue
        sheet_number = first_sheet_number if duplicate_copy_numbers else first_sheet_number + column_index
        pdf.drawString(column + x_offset, y_from_top(title_top), f"#{sheet_number}")
    pdf.setFillColorRGB(0, 0, 0)


def draw_check(pdf: canvas.Canvas, x: float, top: float, layout: dict | None = None) -> None:
    size = (layout or {}).get("checkSize", 7)
    y = y_from_top(top)
    pdf.setLineWidth((layout or {}).get("checkWeight", 0.7))
    pdf.rect(x - 1, y - 1, size, size, stroke=1, fill=0)
    pdf.setFont("Helvetica-Bold", (layout or {}).get("checkFontSize", 8))
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
        if hound.get("manuallyMoved"):
            notes.append("manual")
        name = draw_sheet_hound_name(hound, block)
        line = safe_text(name, 23)
        if notes:
            line = safe_text(f"{line} ({', '.join(notes)})", 34)
        pdf.drawString(x, y_from_top(first_top + (15 * offset)), line)


def draw_sheet_hound_name(hound: dict, block: dict) -> str:
    name = printable_hound_name(hound)
    if clean_text(block.get("breed")) == "SINGLES" or clean_text(block.get("stake")) == "SINGLES":
        breed = str(hound.get("breed") or hound.get("entryBreed") or hound.get("registeredBreed") or "").strip()
        display = breed_display_for_record(breed)
        if display and display not in name:
            return f"{name} ({display})"
    return name


def y_from_top(top: float) -> float:
    return 612 - top


def append_judge_sheets_by_field(writer: PdfWriter, trial: dict, courses: list[dict], template_path: Path, association: str, layout: dict | None = None) -> None:
    """Paginate judge forms without placing different fields on the same page."""
    for _field_name, field_courses in draw_courses_by_field(courses):
        if association == "AKC":
            append_akc_judge_forms(writer, trial, field_courses, template_path)
            continue
        forms = flatten_asfa_judge_forms(field_courses)
        layout_settings = asfa_judge_layout(layout)
        for start in range(0, len(forms), 2):
            page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_asfa_judge_overlay(trial, forms[start:start + 2], layout_settings))).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)


def generate_judge_sheets_pdf(trial: dict, layout: dict | None = None, group_ids: list[str] | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    courses = flatten_judge_courses(trial, group_ids)
    if not courses:
        raise ValueError("No preliminary draw courses were found.")

    writer = PdfWriter()
    append_judge_sheets_by_field(writer, trial, courses, template_path, association, layout)

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
    append_judge_sheets_by_field(writer, trial, courses, template_path, association, layout)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_finals_judge_sheets_pdf(trial: dict, group_id: str, layout: dict | None = None, group_ids: list[str] | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    template_path = JUDGE_TEMPLATES.get(association, JUDGE_TEMPLATES["ASFA"])
    if not template_path.exists():
        raise FileNotFoundError(f"Judge sheet template not found: {template_path}")

    selected_group_ids = [str(value or "") for value in (group_ids or []) if str(value or "")]
    if not selected_group_ids and group_id:
        selected_group_ids = [str(group_id)]
    courses = []
    for selected_group_id in selected_group_ids:
        courses.extend(flatten_finals_judge_courses(trial, selected_group_id))
    if not courses:
        raise ValueError("No finals draw courses were found for the selected stake.")

    writer = PdfWriter()
    append_judge_sheets_by_field(writer, trial, courses, template_path, association, layout)

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
    append_judge_sheets_by_field(writer, trial, courses, template_path, association, layout)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_asfa_record_sheet_pdf(
    trial: dict,
    group_id: str = "",
    breed: str = "",
    layout: dict | None = None,
    sort_mode: str = "",
    entry_layout: dict | None = None,
    lci_entry_layout: dict | None = None,
    secretary_layout: dict | None = None,
    include_secretary_report: bool = False,
    include_first_time_documents: bool = False,
    combine_mixed_posting: bool = False,
    include_signed_judge_sheets: bool = False,
) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()

    # AKC uses form-fill rather than coordinate overlay — delegate entirely
    if association == "AKC":
        return generate_akc_record_sheet_pdf(
            trial,
            group_id=group_id,
            breed=breed,
            sort_mode=sort_mode,
            combine_mixed_posting=combine_mixed_posting,
            include_signed_judge_sheets=include_signed_judge_sheets,
            include_first_time_documents=include_first_time_documents,
            entry_layout=entry_layout,
            lci_entry_layout=lci_entry_layout,
        )

    template_path = RECORD_TEMPLATES.get(association, RECORD_TEMPLATES["ASFA"])
    if not template_path.exists():
        template_path = RECORD_TEMPLATES["ASFA"]

    groups = record_groups_for_print(trial, group_id, breed, sort_mode, combine_mixed_posting)
    if not groups:
        raise ValueError("No score rows were found for that ASFA record sheet.")

    writer = PdfWriter()
    if include_secretary_report and not group_id and not breed:
        secretary_reader = PdfReader(io.BytesIO(generate_asfa_secretary_report_pdf(trial, secretary_layout)))
        for page in secretary_reader.pages:
            writer.add_page(page)

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
            overlay_bytes = build_asfa_record_overlay(
                trial,
                group,
                rows[page_start:page_start + rows_per_page],
                len(rows),
                refund_count,
                per_capita_count,
                page_start,
                layout_settings,
            )
            overlay = PdfReader(io.BytesIO(overlay_bytes)).pages[0]
            page.merge_page(overlay)
            writer.add_page(page)
        if include_signed_judge_sheets:
            append_signed_judge_sheets_for_group(writer, group)
        if include_first_time_documents and clean_text(group.get("breed")) not in {"BIF", "BIE"}:
            append_first_time_documents_for_group(writer, trial, group, entry_layout, lci_entry_layout)

    if not writer.pages:
        raise ValueError("No ASFA record sheet pages could be created.")

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def _akc_scoresheet_field(row: int, col: int) -> str:
    """Return the JERSC3 form field name for 1-based row (1-12) and column (1-16)."""
    if row == 1:
        return f"Text{col}"
    elif row <= 11:
        return f"Text{row}{col}"
    else:  # row == 12
        # Col 16 has a naming anomaly in the published form
        if col == 16:
            return "Text11216"
        return f"Text121{col}"


def fit_akc_registered_name(value: object) -> tuple[str, str, float]:
    """Fit a full registered name inside the JERSC3 multiline name field."""
    text = " ".join(str(value or "").split())
    if not text:
        return ("", "/Helv", 10.0)

    available_width = 106.0
    maximum_size = 11.0
    minimum_single_line_size = 7.5
    width_at_maximum = pdfmetrics.stringWidth(text, "Helvetica", maximum_size)
    if width_at_maximum <= available_width:
        return (text, "/Helv", maximum_size)

    single_line_size = maximum_size * available_width / width_at_maximum
    if single_line_size >= minimum_single_line_size:
        return (text, "/Helv", round(single_line_size, 2))

    words = text.split()
    candidates: list[tuple[float, str, str]] = []
    for split_at in range(1, len(words)):
        first_line = " ".join(words[:split_at])
        second_line = " ".join(words[split_at:])
        widest = max(
            pdfmetrics.stringWidth(first_line, "Helvetica", minimum_single_line_size),
            pdfmetrics.stringWidth(second_line, "Helvetica", minimum_single_line_size),
        )
        candidates.append((widest, first_line, second_line))

    if not candidates:
        return (text, "/Helv", max(5.5, round(single_line_size, 2)))

    widest, first_line, second_line = min(candidates, key=lambda candidate: candidate[0])
    wrapped_size = minimum_single_line_size
    if widest > available_width:
        wrapped_size = max(5.5, minimum_single_line_size * available_width / widest)
    return (first_line + chr(10) + second_line, "/Helv", round(wrapped_size, 2))

def fit_akc_call_name(value: object) -> tuple[str, str, float]:
    """Shrink a call name, including its breed suffix, to the JERSC3 column."""
    text = " ".join(str(value or "").split())
    if not text:
        return ("", "/Helv", 11.0)
    available_width = 49.0
    maximum_size = 11.0
    width = pdfmetrics.stringWidth(text, "Helvetica", maximum_size)
    size = maximum_size if width <= available_width else max(5.5, maximum_size * available_width / width)
    return (text, "/Helv", round(size, 2))

AKC_SCORESHEET_BREED_CIRCLES = {
    "A": (101.4, 102.8, 7.0),
    "AZ": (122.0, 102.8, 10.0),
    "BA": (145.9, 102.8, 10.0),
    "B": (166.2, 102.8, 7.0),
    "C": (180.6, 102.8, 7.0),
    "G": (198.1, 102.8, 7.0),
    "IB": (217.3, 102.8, 9.0),
    "IG": (238.5, 102.8, 9.0),
    "IW": (261.2, 102.8, 10.0),
    "N": (281.7, 102.8, 7.0),
    "P": (298.4, 102.8, 7.0),
    "PIO": (320.4, 102.8, 12.0),
    "PP": (34.4, 113.2, 9.0),
    "PPP": (59.7, 113.2, 12.0),
    "RR": (86.0, 113.2, 10.0),
    "S": (106.0, 113.2, 7.0),
    "SD": (125.2, 113.2, 10.0),
    "SL": (147.7, 113.2, 9.0),
    "TR": (170.8, 113.2, 10.0),
    "W": (192.8, 113.2, 8.0),
    "OTHER": (220.6, 113.2, 16.0),
}

AKC_SCORESHEET_BREED_ALIASES = {
    "AH": "A", "AFGHAN": "A",
    "AZAWAKH": "AZ",
    "BASENJI": "BA",
    "BZ": "B", "BORZOI": "B",
    "CE": "C", "CIRNECO": "C",
    "GH": "G", "GREYHOUND": "G",
    "IBIZAN": "IB",
    "ITALIAN": "IG",
    "IRISH": "IW",
    "NBS": "N", "NORRBOTTENSPETS": "N",
    "PH": "P", "PHARAOH": "P",
    "POD": "PP", "PODENGO": "PP",
    "RR": "RR", "RHODESIAN": "RR",
    "SA": "S", "SALUKI": "S",
    "DH": "SD", "SCOTTISH": "SD", "DEERHOUND": "SD",
    "SLOUGHI": "SL",
    "THAI": "TR",
    "WH": "W", "WHIPPET": "W",
}


def akc_scoresheet_breed_key(value: object) -> str:
    raw = clean_text(value)
    if raw in AKC_SCORESHEET_BREED_CIRCLES:
        return raw
    return AKC_SCORESHEET_BREED_ALIASES.get(raw, "OTHER" if raw and raw != "BIF" else "")


def build_akc_scoresheet_breed_overlay(group: dict, trial: dict | None = None) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    draw_field_label(pdf, field_name_for_breed(trial or {}, group.get("breed")), 780, 600, right=True, font_size=8)
    breed_key = akc_scoresheet_breed_key(group.get("breed"))
    circle = AKC_SCORESHEET_BREED_CIRCLES.get(breed_key)
    if circle:
        center_x, center_top, radius_x = circle
        center_y = y_from_top(center_top)
        pdf.setStrokeColorRGB(0.85, 0, 0)
        pdf.setLineWidth(1.4)
        pdf.ellipse(center_x - radius_x, center_y - 6.5, center_x + radius_x, center_y + 6.5, stroke=1, fill=0)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def akc_scoresheet_award_and_placement(value: object) -> tuple[str, str]:
    text = str(value or "").strip()
    normalized = clean_text(text)
    award = "BIF" if "BIF" in normalized else "BOB" if "BOB" in normalized else ""
    placement_parts = [
        part.strip()
        for part in text.replace("/", "-").split("-")
        if clean_text(part) not in {"BOB", "BIF"}
    ]
    placement = placement_parts[0] if placement_parts else ""
    return award, placement


def blank_akc_scoresheet_fields() -> dict[str, object]:
    """Return explicit empty values for every reusable field on JERSC3."""
    fields: dict[str, object] = {
        "Host Club Name": "",
        "Date": "",
        "Event": "",
        "of Entries": "",
        "of Starters": "",
        "Breed Other": "",
        "Judge 1 Print Name": "",
        "Judge 2 Print Name": "",
        "List Box7": "",
        "OPEN": "/Off",
        "open veteran": "/Off",
        "Special": "/Off",
        "BIF": "/Off",
    }
    for flight in "ABCDE":
        fields[f"Stake {flight}"] = "/Off"
    for row in range(1, 13):
        for column in range(1, 17):
            fields[_akc_scoresheet_field(row, column)] = ""
    return fields


def generate_akc_record_sheet_pdf(
    trial: dict,
    group_id: str = "",
    breed: str = "",
    sort_mode: str = "",
    combine_mixed_posting: bool = False,
    include_signed_judge_sheets: bool = False,
    include_first_time_documents: bool = False,
    entry_layout: dict | None = None,
    lci_entry_layout: dict | None = None,
) -> bytes:
    """Fill the AKC JERSC3 Lure Coursing Scoresheet using its built-in PDF form fields."""
    template_path = RECORD_TEMPLATES["AKC"]
    if not template_path.exists():
        raise FileNotFoundError(f"AKC record sheet template not found: {template_path}")

    groups = record_groups_for_print(trial, group_id, breed, sort_mode, combine_mixed_posting)
    if not groups:
        raise ValueError("No score rows were found for the AKC record sheet.")

    final_writer = PdfWriter()
    rows_per_page = 12  # JERSC3 has 12 hound rows per page

    for group in groups:
        rows = asfa_record_rows(trial, group)
        if not rows:
            continue

        total_count = len(rows)
        starters = sum(
            1 for r in rows
            if clean_text(r.get("prelimScore")) not in {"SCRATCH", "DISQUALIFIED", "ABSENT", "CANCELLED", "EXCUSED"}
        )

        for page_start in range(0, max(1, len(rows)), rows_per_page):
            page_rows = rows[page_start:page_start + rows_per_page]

            # Clone a fresh copy of the template (preserves AcroForm structure)
            writer = PdfWriter(clone_from=template_path)

            # JERSC3 reuses field names on every packet page. Clear every
            # reusable field before filling this page so a PDF viewer cannot
            # carry earlier group values into unused rows or checkboxes.
            fields = blank_akc_scoresheet_fields()

            # ── Header ──────────────────────────────────────────────────────
            fields["Host Club Name"] = safe_text(trial.get("clubName") or "", 50)
            fields["Date"] = safe_text(trial.get("startsOn") or "", 20)
            fields["Event"] = safe_text(trial.get("eventNumber") or "", 20)
            fields["of Entries"] = str(total_count)
            fields["of Starters"] = str(starters)

            # ── Stake / breed checkboxes ─────────────────────────────────────
            raw_stake = clean_text(group.get("stake") or "")
            raw_breed_grp = clean_text(group.get("breed") or "")
            if "OPEN" in raw_stake and "VETERAN" not in raw_stake:
                fields["OPEN"] = "/Yes"
            if "VETERAN" in raw_stake:
                fields["open veteran"] = "/Yes"
            if "SPECIAL" in raw_stake or raw_stake in {"FIELDCHAMPION", "FCH", "FC"}:
                fields["Special"] = "/Yes"
            if "BIF" in raw_stake or raw_breed_grp == "BIF":
                fields["BIF"] = "/Yes"
            split_flight = str(group.get("flight") or "").strip().upper()
            if split_flight in {"A", "B", "C", "D", "E"}:
                fields[f"Stake {split_flight}"] = "/Yes"
            breed_key = akc_scoresheet_breed_key(group.get("breed"))
            fields["Breed Other"] = safe_text(group.get("breed") or "", 25) if breed_key == "OTHER" else ""

            # ── Hound rows ───────────────────────────────────────────────────
            for i, row in enumerate(page_rows):
                r = i + 1  # 1-based row index within the form
                award, placement = akc_scoresheet_award_and_placement(row.get("placement"))
                fields[_akc_scoresheet_field(r, 1)] = award
                fields[_akc_scoresheet_field(r, 2)] = safe_text(placement, 5)
                fields[_akc_scoresheet_field(r, 3)] = safe_text(row.get("registrationNumber") or "", 14)
                fields[_akc_scoresheet_field(r, 4)] = fit_akc_registered_name(row.get("registeredName") or "")
                fields[_akc_scoresheet_field(r, 5)] = fit_akc_call_name(safe_text(row.get("callName") or "", 18))
                # Preliminary scoring
                fields[_akc_scoresheet_field(r, 6)] = safe_text(row.get("prelimCode") or "", 8)
                fields[_akc_scoresheet_field(r, 7)] = safe_text(str(row.get("prelimJudge1") or ""), 6)
                fields[_akc_scoresheet_field(r, 8)] = safe_text(str(row.get("prelimJudge2") or ""), 6)
                fields[_akc_scoresheet_field(r, 9)] = safe_text(str(row.get("prelimScore") or ""), 6)
                # Final scoring
                fields[_akc_scoresheet_field(r, 10)] = safe_text(row.get("finalCode") or "", 8)
                fields[_akc_scoresheet_field(r, 11)] = safe_text(str(row.get("finalJudge1") or ""), 6)
                fields[_akc_scoresheet_field(r, 12)] = safe_text(str(row.get("finalJudge2") or ""), 6)
                fields[_akc_scoresheet_field(r, 13)] = safe_text(str(row.get("finalScore") or ""), 6)
                fields[_akc_scoresheet_field(r, 14)] = safe_text(str(row.get("combinedScore") or ""), 6)
                fields[_akc_scoresheet_field(r, 15)] = safe_text(str(row.get("stakesRunoffCode") or ""), 6)
                fields[_akc_scoresheet_field(r, 16)] = safe_text(str(row.get("bobRunoffCode") or ""), 6)

            # ── Judges ───────────────────────────────────────────────────────
            judge1, judge2 = judges_for_group(trial, group)
            fields["Judge 1 Print Name"] = safe_text(judge1, 50)
            fields["Judge 2 Print Name"] = safe_text(judge2, 50)

            # Fill and flatten so fields render as static text
            writer.update_page_form_field_values(
                writer.pages[0],
                fields,
                auto_regenerate=False,
                flatten=True,
            )
            # Blank signature widgets and any other template controls do not
            # belong in the static packet. Removing the remaining annotations
            # also prevents same-named widgets from sharing values across pages.
            writer.pages[0].pop("/Annots", None)

            buf = io.BytesIO()
            writer.write(buf)
            filled_reader = PdfReader(io.BytesIO(buf.getvalue()))
            filled_page = filled_reader.pages[0]
            breed_overlay = PdfReader(io.BytesIO(build_akc_scoresheet_breed_overlay(group, trial))).pages[0]
            filled_page.merge_page(breed_overlay)
            final_writer.add_page(filled_page)

        if include_signed_judge_sheets:
            append_signed_judge_sheets_for_group(final_writer, group)
        if include_first_time_documents and clean_text(group.get("breed")) != "BIF":
            append_first_time_documents_for_group(final_writer, trial, group, entry_layout, lci_entry_layout)

    if not final_writer.pages:
        raise ValueError("No AKC record sheet pages could be created.")

    output = io.BytesIO()
    final_writer.write(output)
    return output.getvalue()


def _build_akc_record_overlay_DELETED() -> None:  # kept as placeholder — body removed
    pass  # noqa: replaced by generate_akc_record_sheet_pdf


def build_akc_record_overlay(trial: dict, group: dict, rows: list[dict], total_count: int, page_start: int, layout: dict | None = None) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))
    pdf.setTitle("Official AKC Lure Coursing Scoresheet")

    layout_cfg = layout or {}
    global_x = float(layout_cfg.get("globalXAdjust", 0))
    global_y = float(layout_cfg.get("globalYAdjust", 0))

    club_name_x = float(layout_cfg.get("clubNameX", 95)) + global_x
    club_name_y = float(layout_cfg.get("clubNameY", 88)) + global_y
    starts_on_x = float(layout_cfg.get("startsOnX", 355)) + global_x
    starts_on_y = float(layout_cfg.get("startsOnY", 88)) + global_y
    event_num_x = float(layout_cfg.get("eventNumX", 495)) + global_x
    event_num_y = float(layout_cfg.get("eventNumY", 88)) + global_y
    entries_count_x = float(layout_cfg.get("entriesCountX", 615)) + global_x
    starters_count_x = float(layout_cfg.get("startersCountX", 730)) + global_x
    row_top = float(layout_cfg.get("rowTop", 175)) + global_y
    row_height = float(layout_cfg.get("rowHeight", 24))

    judge1_x = float(layout_cfg.get("judge1X", 115)) + global_x
    judge1_y = float(layout_cfg.get("judge1Y", 544)) + global_y
    judge2_x = float(layout_cfg.get("judge2X", 520)) + global_x
    judge2_y = float(layout_cfg.get("judge2Y", 544)) + global_y
    field_clerk_x = float(layout_cfg.get("fieldClerkX", 115)) + global_x
    field_secretary_x = float(layout_cfg.get("fieldSecretaryX", 390)) + global_x
    chair_name_x = float(layout_cfg.get("chairNameX", 670)) + global_x

    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(club_name_x, y_from_top(club_name_y), safe_text(trial.get("clubName") or "", 35))
    pdf.drawString(starts_on_x, y_from_top(starts_on_y), safe_text(trial.get("startsOn") or "", 15))
    pdf.drawString(event_num_x, y_from_top(event_num_y), safe_text(trial.get("eventNumber") or "", 15))
    pdf.drawString(entries_count_x, y_from_top(club_name_y), str(total_count))
    starters = sum(1 for r in rows if clean_text(r.get("prelimScore")) not in {"SCRATCH", "DISQUALIFIED", "ABSENT", "CANCELLED", "EXCUSED"})
    pdf.drawString(starters_count_x, y_from_top(club_name_y), str(starters))

    raw_breed = clean_text(group.get("breed") or "")
    akc_breed_x_offsets = {
        "A": 97.8, "AH": 97.8, "AFGHAN": 97.8,
        "AZ": 115,
        "BA": 139, "BASENJI": 139,
        "B": 162.8, "BZ": 162.8, "BORZOI": 162.8,
        "C": 177, "CE": 177, "CIRNECO": 177,
        "G": 194.2, "GH": 194.2, "GREYHOUND": 194.2,
        "IB": 212, "IBIZAN": 212,
        "IG": 232.6, "ITALIAN": 232.6,
        "IW": 254.3, "IRISH": 254.3,
        "N": 278,
        "P": 295.3, "PH": 295.3, "PHARAOH": 295.3,
        "PIO": 311.5,
        "PP": 28.2, "PPP": 50.5,
        "RR": 78.8, "RHODESIAN": 78.8,
        "S": 103.3, "SA": 103.3, "SALUKI": 103.3,
        "SD": 118.8, "DH": 118.8, "SCOTTISH": 118.8,
        "SL": 141.6, "SLOUGHI": 141.6,
        "TR": 163.9,
        "W": 187.8, "WH": 187.8, "WHIPPET": 187.8,
    }
    breed_x = akc_breed_x_offsets.get(raw_breed)
    if breed_x is not None:
        breed_y = 117 if raw_breed in {"PP", "PPP"} else 106
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(breed_x + global_x, y_from_top(breed_y + global_y), "X")
    else:
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(230 + global_x, y_from_top(106 + global_y), safe_text(group.get("breed") or "", 15))

    raw_stake = clean_text(group.get("stake") or "")
    pdf.setFont("Helvetica-Bold", 10)
    if "OPEN" in raw_stake:
        pdf.drawString(400 + global_x, y_from_top(116 + global_y), "X")
    elif "VETERAN" in raw_stake:
        pdf.drawString(495 + global_x, y_from_top(116 + global_y), "X")
    elif "SPECIAL" in raw_stake:
        pdf.drawString(555 + global_x, y_from_top(116 + global_y), "X")
    elif "BIF" in raw_stake:
        pdf.drawString(605 + global_x, y_from_top(116 + global_y), "X")

    pdf.setFont("Helvetica", 8)
    for i, row in enumerate(rows):
        r_y = row_top + (i * row_height)
        pdf.drawString(30 + global_x, y_from_top(r_y), safe_text(row.get("placement") or "", 5))
        pdf.drawString(85 + global_x, y_from_top(r_y), safe_text(row.get("registrationNumber") or "", 14))
        pdf.drawString(175 + global_x, y_from_top(r_y), safe_text(row.get("registeredName") or "", 22))
        pdf.drawString(300 + global_x, y_from_top(r_y), safe_text(row.get("callName") or "", 12))

        prelim_course = f"{row.get('prelimCourse') or ''} {row.get('prelimBlanket') or ''}".strip()
        pdf.drawString(370 + global_x, y_from_top(r_y), safe_text(prelim_course, 6))
        pdf.drawString(405 + global_x, y_from_top(r_y), safe_text(row.get("prelimJudge1") or "", 5))
        pdf.drawString(440 + global_x, y_from_top(r_y), safe_text(row.get("prelimJudge2") or "", 5))
        pdf.drawString(475 + global_x, y_from_top(r_y), safe_text(row.get("prelimScore") or "", 5))

        final_course = f"{row.get('finalCourse') or ''} {row.get('finalBlanket') or ''}".strip()
        pdf.drawString(510 + global_x, y_from_top(r_y), safe_text(final_course, 6))
        pdf.drawString(555 + global_x, y_from_top(r_y), safe_text(row.get("finalJudge1") or "", 5))
        pdf.drawString(590 + global_x, y_from_top(r_y), safe_text(row.get("finalJudge2") or "", 5))
        pdf.drawString(625 + global_x, y_from_top(r_y), safe_text(row.get("finalScore") or "", 5))

        pdf.drawString(665 + global_x, y_from_top(r_y), safe_text(row.get("totalScore") or "", 5))
        pdf.drawString(715 + global_x, y_from_top(r_y), safe_text(row.get("runoffScore") or "", 5))
        pdf.drawString(755 + global_x, y_from_top(r_y), safe_text(row.get("bobRunoffScore") or "", 5))

    pdf.setFont("Helvetica", 8)
    pdf.drawString(judge1_x, y_from_top(judge1_y), safe_text(group.get("judge1") or trial.get("judge1") or "", 25))
    pdf.drawString(judge2_x, y_from_top(judge2_y), safe_text(group.get("judge2") or trial.get("judge2") or "", 25))
    pdf.drawString(field_clerk_x, y_from_top(judge1_y + 22), safe_text(trial.get("clerkName") or "", 25))
    pdf.drawString(field_secretary_x, y_from_top(judge1_y + 22), safe_text(trial.get("secretaryName") or "", 25))
    pdf.drawString(chair_name_x, y_from_top(judge1_y + 21), safe_text(trial.get("chairName") or "", 20))

    pdf.save()
    return buffer.getvalue()


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


def generate_akc_secretary_report_pdf(trial: dict) -> bytes:
    template_path = SECRETARY_REPORT_TEMPLATES["AKC"]
    if not template_path.exists():
        raise FileNotFoundError(f"AKC secretary report template not found: {template_path}")

    def display_date(value: object) -> str:
        text = str(value or "").strip()
        try:
            return datetime.strptime(text, "%Y-%m-%d").strftime("%m/%d/%Y")
        except ValueError:
            return text

    entries = trial.get("entries") if isinstance(trial.get("entries"), list) else []
    entry_count = len(entries)
    service_fee = entry_count * 4.50
    location = ", ".join(
        value for value in [
            str(trial.get("locationName") or "").strip(),
            str(trial.get("locationCity") or trial.get("nearestCity") or "").strip(),
            str(trial.get("locationState") or "").strip(),
        ] if value
    )
    misconduct = str(trial.get("akcSecretaryMisconduct") or "no").lower() == "yes"
    judge_changed = str(
        trial.get("akcSecretaryJudgesChanged")
        or trial.get("secretaryJudgesChanged")
        or "no"
    ).lower() == "yes"
    judge_complaint = str(trial.get("akcSecretaryJudgeComplaints") or "no").lower() == "yes"
    location_satisfactory = str(trial.get("akcSecretaryLocationSatisfactory") or "yes").lower() == "yes"
    dog_protest = str(trial.get("akcSecretaryDogProtest") or "no").lower() == "yes"
    committee_names = []
    for value in [trial.get("trialChair"), trial.get("secretaryName")]:
        name = str(value or "").strip()
        if name and name not in committee_names:
            committee_names.append(name)
    for worker in trial.get("workers") or []:
        if not isinstance(worker, dict):
            continue
        name = str(worker.get("name") or worker.get("workerName") or "").strip()
        if name and name not in committee_names:
            committee_names.append(name)

    committee_notes = str(trial.get("akcSecretaryCommitteeNotes") or "").strip()
    if committee_notes:
        committee_lines = [line.strip() for line in committee_notes.splitlines() if line.strip()][:3]
    else:
        committee_lines = [
            ", ".join(committee_names[:4]),
            ", ".join(committee_names[4:8]),
            ", ".join(committee_names[8:12]),
        ]
    committee_lines += [""] * (3 - len(committee_lines))

    fields = {
        "text_clubname": safe_text(trial.get("clubName") or "", 80),
        "report_attached_y": "/Yes" if misconduct else "/Off",
        "report_attached_n": "/Off" if misconduct else "/Yes",
        "text_location": safe_text(location, 100),
        "event_date1": display_date(trial.get("startsOn")),
        "event_date2": display_date(trial.get("endsOn") or trial.get("startsOn")),
        "text_eventnum": safe_text(trial.get("eventNumber") or "", 30),
        "number_of_entries": str(entry_count),
        "text_entryfeesenclosed": f"{service_fee:.2f}",
        "judge_change_y": "/Yes" if judge_changed else "/Off",
        "judge_change_n": "/Off" if judge_changed else "/Yes",
        "additional_judge_info": safe_text(trial.get("akcSecretaryJudgeChangeNotes") or trial.get("secretaryJudgeChangeNotes") or "", 180),
        "judge_complaint_y": "/Yes" if judge_complaint else "/Off",
        "judge_complaint_n": "/Off" if judge_complaint else "/Yes",
        "location_satisfactory_y": "/Yes" if location_satisfactory else "/Off",
        "location_satisfactory_n": "/Off" if location_satisfactory else "/Yes",
        "dog_protest_y": "/Yes" if dog_protest else "/Off",
        "dog_protest_n": "/Off" if dog_protest else "/Yes",
        "committee_info_line1": safe_text(committee_lines[0], 100),
        "committee_info_line2": safe_text(committee_lines[1], 100),
        "committee_info_line3": safe_text(committee_lines[2], 100),
        "date_signed": datetime.now().strftime("%m/%d/%Y"),
        "Telephone": safe_text(trial.get("secretaryPhone") or "", 30),
        "Email": safe_text(trial.get("secretaryEmail") or "", 80),
    }

    reader = PdfReader(str(template_path))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.update_page_form_field_values(writer.pages[0], fields, auto_regenerate=False, flatten=True)
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def generate_secretary_report_pdf(trial: dict, layout: dict | None = None) -> bytes:
    association = str(trial.get("association") or "ASFA").upper()
    if association == "AKC":
        return generate_akc_secretary_report_pdf(trial)
    return generate_asfa_secretary_report_pdf(trial, layout)

def generate_asfa_entry_forms_pdf(trial: dict, entry_id: str = "", layout: dict | None = None, lci_layout: dict | None = None) -> bytes:
    entries = first_time_entries_for_print(trial, entry_id)
    if not entries:
        raise ValueError("No first-time ASFA entries were found for entry forms.")

    writer = PdfWriter()
    regular_layout = asfa_entry_layout(layout)
    lci_layout_settings = asfa_lci_entry_layout(lci_layout)
    for entry in entries:
        template_path = ENTRY_FORM_TEMPLATES["ASFA_LCI"] if is_lci_entry(entry) else ENTRY_FORM_TEMPLATES["ASFA"]
        if not template_path.exists():
            raise FileNotFoundError(f"ASFA entry form template not found: {template_path}")
        layout_settings = lci_layout_settings if is_lci_entry(entry) else regular_layout
        page = fresh_half_page_template(template_path, layout_settings["copyOffsetX"])
        overlay_bytes = build_asfa_lci_entry_form_overlay(trial, entry, page, layout_settings) if is_lci_entry(entry) else build_asfa_entry_form_overlay(trial, entry, page, layout_settings)
        overlay = PdfReader(io.BytesIO(overlay_bytes)).pages[0]
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


def asfa_entry_layout(layout: dict | None) -> dict:
    merged = dict(DEFAULT_ASFA_ENTRY_LAYOUT)
    if isinstance(layout, dict):
        if not layout.get("stakeCheckY") and layout.get("stakeCircleY"):
            layout = {**layout, "stakeCheckY": layout.get("stakeCircleY")}
        if not layout.get("sexCheckY") and layout.get("sexY"):
            layout = {**layout, "sexCheckY": layout.get("sexY")}
        for key in merged:
            try:
                value = float(layout.get(key))
            except (TypeError, ValueError):
                continue
            if key in {"globalYAdjust", "rightFormXAdjust", "rightFormYAdjust"}:
                merged[key] = value
            elif value > 0:
                merged[key] = value
    return merged


def asfa_lci_entry_layout(layout: dict | None) -> dict:
    merged = dict(DEFAULT_ASFA_LCI_ENTRY_LAYOUT)
    if isinstance(layout, dict):
        if not layout.get("sexCheckY") and layout.get("sexY"):
            layout = {**layout, "sexCheckY": layout.get("sexY")}
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


def first_time_entries_for_print(trial: dict, entry_id: str = "") -> list[dict]:
    entries = [entry for entry in trial.get("entries") or [] if bool(entry.get("firstTime"))]
    if entry_id:
        entries = [entry for entry in entries if str(entry.get("id") or "") == str(entry_id)]
    return sorted(entries, key=lambda entry: (
        str(run_group_breed_for_entry(entry)).upper(),
        str(run_group_stake_for_entry(entry)).upper(),
        str(entry.get("callName") or entry.get("registeredName") or "").upper(),
    ))


def build_asfa_entry_form_overlay(trial: dict, entry: dict, page, layout: dict) -> bytes:
    source = entry_form_source(trial, entry)
    buffer = io.BytesIO()
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    pdf = canvas.Canvas(buffer, pagesize=(width, height))
    pdf.setTitle("ASFA First-Time Entry Form")
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica", layout["fontSize"])

    draw_asfa_entry_trial_context(pdf, layout, trial)
    draw_asfa_entry_text(pdf, layout, "breed", run_group_breed_for_entry(source), 20)
    draw_asfa_entry_text(pdf, layout, "callName", source.get("callName") or entry_registered_name_for_form(source), 24)
    draw_asfa_entry_text(pdf, layout, "registeredName", entry_registered_name_for_form(source) or source.get("callName"), 34)
    draw_asfa_entry_text(pdf, layout, "registration", entry_registration_text(source), 28)
    draw_asfa_entry_text(pdf, layout, "dob", source.get("dob"), 12)
    draw_asfa_entry_text(pdf, layout, "owner", entry_owner_for_form(source), 34)
    draw_asfa_entry_text(pdf, layout, "address", entry_address_line(source), 38)
    draw_asfa_entry_text(pdf, layout, "phone", source.get("ownerPhone"), 18)
    draw_asfa_entry_text(pdf, layout, "city", source.get("ownerCity"), 20)
    draw_asfa_entry_text(pdf, layout, "state", source.get("ownerState"), 4)
    draw_asfa_entry_text(pdf, layout, "zip", source.get("ownerPostalCode"), 10)
    draw_asfa_entry_text(pdf, layout, "email", source.get("ownerEmail"), 30)
    draw_asfa_entry_text(pdf, layout, "region", trial.get("region"), 8)

    draw_asfa_entry_stake_mark(pdf, layout, run_group_stake_for_entry(entry))
    if entry_flag(entry, "additionalKennel"):
        draw_asfa_entry_check(pdf, layout, "kennel")
    if entry_flag(entry, "additionalBreeder"):
        draw_asfa_entry_check(pdf, layout, "breeder")
    if entry_flag(entry, "additionalBench"):
        draw_asfa_entry_check(pdf, layout, "bench")
    draw_asfa_entry_sex_mark(pdf, layout, source.get("sex"))
    if entry.get("ownerSeparationRequested"):
        draw_asfa_entry_check(pdf, layout, "ownerSeparation")
    if not is_quasi_breed_entry(entry):
        draw_asfa_entry_check(pdf, layout, "firstAsfaTrial")
    draw_asfa_entry_check(pdf, layout, "firstTimeEntry")
    if entry_flag(entry, "infoChanged"):
        draw_asfa_entry_check(pdf, layout, "changeInfo")
    if entry_flag(entry, "dismissedLastSix"):
        draw_asfa_entry_check(pdf, layout, "dismissed")
    draw_asfa_entry_signature(pdf, layout, source)
    pdf.save()
    return buffer.getvalue()


def build_asfa_lci_entry_form_overlay(trial: dict, entry: dict, page, layout: dict) -> bytes:
    source = entry_form_source(trial, entry)
    buffer = io.BytesIO()
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    pdf = canvas.Canvas(buffer, pagesize=(width, height))
    pdf.setTitle("ASFA LCI First-Time Entry Form")
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica", layout["fontSize"])

    draw_asfa_entry_trial_context(pdf, layout, trial)
    draw_asfa_lci_entry_text(pdf, layout, "breed", run_group_breed_for_entry(source), 20)
    draw_asfa_lci_entry_text(pdf, layout, "callName", source.get("callName") or entry_registered_name_for_form(source), 24)
    draw_asfa_lci_entry_text(pdf, layout, "registeredName", entry_registered_name_for_form(source) or source.get("callName"), 34)
    draw_asfa_lci_entry_text(pdf, layout, "registration", entry_registration_text(source), 28)
    draw_asfa_lci_entry_text(pdf, layout, "dob", source.get("dob"), 12)
    draw_asfa_lci_entry_text(pdf, layout, "owner", entry_owner_for_form(source), 34)
    draw_asfa_lci_entry_text(pdf, layout, "address", entry_address_line(source), 38)
    draw_asfa_lci_entry_text(pdf, layout, "phone", source.get("ownerPhone"), 18)
    draw_asfa_lci_entry_text(pdf, layout, "city", source.get("ownerCity"), 20)
    draw_asfa_lci_entry_text(pdf, layout, "state", source.get("ownerState"), 4)
    draw_asfa_lci_entry_text(pdf, layout, "zip", source.get("ownerPostalCode"), 10)
    draw_asfa_lci_entry_text(pdf, layout, "email", source.get("ownerEmail"), 30)
    draw_asfa_lci_entry_text(pdf, layout, "region", trial.get("region"), 8)

    draw_asfa_lci_division_mark(pdf, layout, source)
    draw_asfa_lci_stake_mark(pdf, layout, run_group_stake_for_entry(entry))
    draw_asfa_lci_sex_mark(pdf, layout, source.get("sex"))
    draw_asfa_entry_check(pdf, layout, "firstTimeEntry")
    if entry_flag(entry, "infoChanged"):
        draw_asfa_entry_check(pdf, layout, "changeInfo")
    draw_asfa_entry_signature(pdf, layout, source)
    pdf.save()
    return buffer.getvalue()


def draw_asfa_entry_text(pdf: canvas.Canvas, layout: dict, key: str, value: object, limit: int) -> None:
    if not value:
        return
    font_size = layout["smallFontSize"] if key in {"registration", "email", "address"} else layout["fontSize"]
    text = safe_text(value, limit)
    if key in {"email", "trialSecretaryEmail"}:
        text = safe_text(value, 254)
        right_edge = layout.get("regionX", 288) - 8 if key == "email" else layout.get("copyOffsetX", 396) - 8
        max_width = max(40, right_edge - layout[f"{key}X"])
        while font_size > 4 and pdf.stringWidth(text, "Helvetica", font_size) > max_width:
            font_size -= 0.25
    pdf.setFont("Helvetica", font_size)
    pdf.drawString(layout[f"{key}X"], y_from_top(asfa_entry_y(layout, f"{key}Y")), text)


def draw_asfa_lci_entry_text(pdf: canvas.Canvas, layout: dict, key: str, value: object, limit: int) -> None:
    draw_asfa_entry_text(pdf, layout, key, value, limit)


def draw_asfa_entry_trial_context(pdf: canvas.Canvas, layout: dict, trial: dict) -> None:
    pdf.setFont("Helvetica", layout.get("smallFontSize", layout.get("fontSize", 8)))
    draw_asfa_entry_text(pdf, layout, "trialClub", f"Club: {trial.get('clubName') or ''}", 34)
    draw_asfa_entry_text(pdf, layout, "trialDate", f"Date: {trial_date_for_entry_form(trial)}", 26)
    draw_asfa_entry_text(pdf, layout, "trialSecretary", f"FTS: {trial.get('secretaryName') or ''}", 28)
    draw_asfa_entry_text(pdf, layout, "trialSecretaryEmail", f"Email: {trial.get('secretaryEmail') or ''}", 34)
    pdf.setFont("Helvetica", layout["fontSize"])


def trial_date_for_entry_form(trial: dict) -> str:
    starts_on = str(trial.get("startsOn") or "").strip()
    ends_on = str(trial.get("endsOn") or "").strip()
    if starts_on and ends_on and starts_on != ends_on:
        return f"{starts_on} - {ends_on}"
    return starts_on or ends_on


def draw_asfa_entry_stake_mark(pdf: canvas.Canvas, layout: dict, stake: object) -> None:
    normalized = clean_text(stake)
    if "VETERAN" in normalized:
        x_key = "veteranX"
    elif normalized in {"FCH", "FIELDCHAMPION", "EXCELLENT"}:
        x_key = "fchX"
    elif normalized == "SINGLES":
        x_key = "singlesX"
    elif normalized == "PROVISIONAL":
        x_key = "provisionalX"
    else:
        x_key = "openX"
    draw_asfa_entry_check_at(pdf, layout, layout[x_key], y_from_top(asfa_entry_y(layout, "stakeCheckY")))


def draw_asfa_entry_sex_mark(pdf: canvas.Canvas, layout: dict, sex: object) -> None:
    normalized = clean_text(sex)
    if normalized not in {"DOG", "MALE", "BITCH", "FEMALE"}:
        return
    x_key = "bitchX" if normalized in {"BITCH", "FEMALE"} else "dogX"
    draw_asfa_entry_check_at(pdf, layout, layout[x_key], y_from_top(asfa_entry_y(layout, "sexCheckY")))


def draw_asfa_lci_division_mark(pdf: canvas.Canvas, layout: dict, entry: dict) -> None:
    breed = clean_text(run_group_breed_for_entry(entry))
    if breed == "LCISMALL":
        x_key = "lciSmallX"
    elif breed == "LCILARGE":
        x_key = "lciLargeX"
    else:
        x_key = "lciMixX"
    draw_asfa_entry_check_at(pdf, layout, layout[x_key], y_from_top(asfa_entry_y(layout, "lciDivisionY")))


def draw_asfa_lci_stake_mark(pdf: canvas.Canvas, layout: dict, stake: object) -> None:
    normalized = clean_text(stake)
    if "VETERAN" in normalized:
        x_key = "veteranX"
    elif "EXCELLENT" in normalized:
        x_key = "excellentX"
    else:
        x_key = "openX"
    draw_asfa_entry_check_at(pdf, layout, layout[x_key], y_from_top(asfa_entry_y(layout, "stakeCheckY")))


def draw_asfa_lci_sex_mark(pdf: canvas.Canvas, layout: dict, sex: object) -> None:
    draw_asfa_entry_sex_mark(pdf, layout, sex)


def draw_asfa_entry_check(pdf: canvas.Canvas, layout: dict, key: str) -> None:
    x = layout[f"{key}X"]
    y = y_from_top(asfa_entry_y(layout, f"{key}Y"))
    draw_asfa_entry_check_at(pdf, layout, x, y)


def draw_asfa_entry_check_at(pdf: canvas.Canvas, layout: dict, x: float, y: float) -> None:
    size = layout["checkSize"]
    pdf.setLineWidth(layout["circleWeight"])
    pdf.rect(x, y - size + 2, size, size, stroke=1, fill=0)
    pdf.setFont("Helvetica-Bold", max(6, size))
    pdf.drawString(x + 1.2, y - size + 2.2, "X")


def draw_asfa_entry_signature(pdf: canvas.Canvas, layout: dict, entry: dict) -> None:
    signature = entry_signature_for_form(entry)
    if not signature:
        return
    pdf.setFont("Helvetica", layout["fontSize"])
    pdf.drawString(layout["signatureX"], y_from_top(asfa_entry_y(layout, "signatureY")), safe_text(signature, 30))


def asfa_entry_y(layout: dict, key: str) -> float:
    return Number_or_zero(layout.get(key)) + Number_or_zero(layout.get("globalYAdjust"))


def Number_or_zero(value: object) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def entry_registration_text(entry: dict) -> str:
    registry = str(entry.get("registry") or "").strip()
    number = str(entry.get("registrationNumber") or "").strip()
    reg_type = str(entry.get("registrationType") or "").strip()
    pieces = [piece for piece in (registry, number) if piece]
    text = " ".join(pieces)
    return f"{text} ({reg_type})" if text and reg_type else text


def entry_form_source(trial: dict, entry: dict) -> dict:
    hound = master_hound_for_entry(trial, entry)
    if not hound:
        return entry
    source = dict(entry)
    for key in (
        "callName",
        "registeredName",
        "breed",
        "registrationNumber",
        "registry",
        "registrationType",
        "dob",
        "sex",
        "owner",
        "ownerEmail",
        "ownerPhone",
        "ownerAddress",
        "ownerCity",
        "ownerState",
        "ownerPostalCode",
        "ownerCountry",
        "breeder",
        "sire",
        "dam",
    ):
        value = hound.get(key)
        if value not in (None, ""):
            source[key] = value
    source["signatureName"] = hound.get("owner") or source.get("signatureName") or source.get("owner")
    return source


def master_hound_for_entry(trial: dict, entry: dict) -> dict | None:
    hounds = []
    if isinstance(trial.get("masterHounds"), list):
        hounds.extend(trial.get("masterHounds") or [])
    hounds.extend(load_master_hounds_from_state())
    hound_id = str(entry.get("houndId") or "")
    if hound_id:
        for hound in hounds:
            if str(hound.get("id") or "") == hound_id:
                return hound
    entry_reg = clean_text(entry.get("registrationNumber"))
    if entry_reg:
        for hound in hounds:
            if entry_reg in {clean_text(hound.get("registrationNumber")), clean_text(hound.get("alternateRegistrationNumber"))}:
                return hound
    entry_name = clean_text(entry.get("registeredName"))
    entry_call = clean_text(entry.get("callName"))
    entry_breed = clean_text(entry.get("breed"))
    for hound in hounds:
        if entry_name and clean_text(hound.get("registeredName")) == entry_name:
            return hound
        if entry_call and clean_text(hound.get("callName")) == entry_call and (not entry_breed or clean_text(hound.get("breed")) == entry_breed):
            return hound
    return None


def load_master_hounds_from_state() -> list[dict]:
    if not DB_PATH.exists():
        return []
    try:
        with sqlite3.connect(DB_PATH) as conn:
            row = conn.execute("select state_json from app_state where key = ?", (STATE_KEY,)).fetchone()
        if not row:
            return []
        state = json.loads(row[0])
        data = state.get("data") if isinstance(state.get("data"), dict) else state
        hounds = data.get("masterHounds") if isinstance(data, dict) else []
        return hounds if isinstance(hounds, list) else []
    except Exception:
        return []


def entry_registered_name_for_form(entry: dict) -> str:
    return clean_entry_form_text(entry.get("registeredName"), entry.get("callName"))


def entry_owner_for_form(entry: dict) -> str:
    return clean_entry_form_text(entry.get("owner"))


def entry_signature_for_form(entry: dict) -> str:
    signature = clean_entry_form_text(entry.get("signatureName"))
    return signature or entry_owner_for_form(entry)


def clean_entry_form_text(value: object, call_name: object = "", strip_sire_dam: bool = False) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    if strip_sire_dam:
        text = re.sub(r"\s+\bSire\b.*$", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"\s+\b(?:Address|Add\.?|Phone|Email|E-mail|City|State|Zip)\b\.?:?\s*$", "", text, flags=re.IGNORECASE).strip()
    if not strip_sire_dam:
        text = dedupe_repeated_phrase(text)
    return text


def dedupe_repeated_phrase(value: str) -> str:
    words = value.split()
    if len(words) % 2 == 0 and words[:len(words) // 2] == words[len(words) // 2:]:
        return " ".join(words[:len(words) // 2])
    return value


def entry_address_line(entry: dict) -> str:
    return " ".join(str(entry.get(key) or "").strip() for key in ("ownerAddress", "ownerCountry") if str(entry.get(key) or "").strip())


def entry_flag(entry: dict, key: str) -> bool:
    value = entry.get(key)
    if isinstance(value, bool):
        return value
    return clean_text(value) in {"YES", "Y", "TRUE", "1", "CHECKED"}


def run_group_breed_for_entry(entry: dict) -> str:
    lci = parse_lci_class(entry.get("className"))
    if lci:
        return lci["division"]
    if clean_text(entry.get("className")) == "SINGLES":
        return "Singles"
    return str(entry.get("breed") or "Unknown")


def run_group_stake_for_entry(entry: dict) -> str:
    lci = parse_lci_class(entry.get("className"))
    if lci:
        return lci["stake"]
    if clean_text(entry.get("className")) == "SINGLES":
        return "Singles"
    return str(entry.get("className") or "Open")


def parse_lci_class(value: object) -> dict | None:
    label = str(value or "").strip()
    normalized = clean_text(label)
    divisions = {
        "LCISMALL": "LCI Small",
        "LCILARGE": "LCI Large",
        "LCISIGHTHOUNDMIX": "LCI Sighthound Mix",
        "LCISHMIX": "LCI Sighthound Mix",
    }
    for key, division in divisions.items():
        if normalized.startswith(key):
            remainder = normalized.removeprefix(key)
            stake = "Veteran" if "VETERAN" in remainder else "Excellent" if "EXCELLENT" in remainder else "Open"
            return {"division": division, "stake": stake}
    return None


def is_quasi_breed_entry(entry: dict) -> bool:
    return clean_text(run_group_breed_for_entry(entry)) == "SINGLES" or clean_text(run_group_breed_for_entry(entry)).startswith("LCI")


def is_lci_entry(entry: dict) -> bool:
    return clean_text(run_group_breed_for_entry(entry)).startswith("LCI") or clean_text(entry.get("className")).startswith("LCI")


def record_groups_for_print(trial: dict, group_id: str = "", breed: str = "", sort_mode: str = "", combine_mixed_posting: bool = False) -> list[dict]:
    groups = draw_groups_for_print(trial)
    if group_id:
        groups = [group for group in groups if str(group.get("id") or "") == str(group_id)]
    elif breed:
        groups = [group for group in groups if clean_text(group.get("breed")) == clean_text(breed)]
    elif sort_mode == "alpha":
        groups = sorted(groups, key=record_packet_sort_key)
    if not combine_mixed_posting:
        groups = split_mixed_record_groups(groups)
    event_label = clean_text(((trial.get("scorebook") or {}).get("bif") or {}).get("eventType") or "BIF")
    if not group_id and (not breed or clean_text(breed) == event_label):
        groups.extend(bif_record_groups(trial))
    return groups


def bif_record_groups(trial: dict) -> list[dict]:
    bif = (trial.get("scorebook") or {}).get("bif") or {}
    event_label = "BIE" if clean_text(bif.get("eventType")) == "BIE" else "BIF"
    rounds = []
    if event_label == "BIE" and bif.get("elimination"):
        rounds.extend(bif.get("roundHistory") or [])
    rounds.append({"draw": bif.get("draw") or {}, "outcomes": bif.get("outcomes") or {}})
    groups = []
    for index, round_data in enumerate(rounds, start=1):
        courses = (round_data.get("draw") or {}).get("courses") or []
        if not any((course.get("hounds") or []) for course in courses):
            continue
        stake = event_label if len(rounds) == 1 else f"{event_label} Round {round_data.get('number') or index}"
        group = {
            "id": f"asfa-record-{event_label.lower()}-{index}",
            "breed": event_label,
            "stake": stake,
            "phase": event_label.lower(),
            "courses": courses,
            "recordOutcomes": round_data.get("outcomes") or {},
        }
        if event_label == "BIE" and bif.get("elimination"):
            group["recordFinalWinner"] = str(bif.get("finalWinner") or "") if index == len(rounds) else ""
        groups.append(group)
    return groups


def bif_record_group(trial: dict) -> dict | None:
    groups = bif_record_groups(trial)
    return groups[-1] if groups else None


def split_mixed_record_groups(groups: list[dict]) -> list[dict]:
    split_groups: list[dict] = []
    for group in groups:
        if not group.get("mixedStake"):
            split_groups.append(group)
            continue
        stakes = []
        for course in group.get("courses") or []:
            for hound in course.get("hounds") or []:
                stake = str(hound.get("stake") or group.get("stake") or "").strip()
                if stake and clean_text(stake) not in {clean_text(item) for item in stakes}:
                    stakes.append(stake)
        if not stakes:
            split_groups.append(group)
            continue
        for stake in stakes:
            stake_key = clean_text(stake)
            split_group = copy.deepcopy(group)
            split_group["stake"] = stake
            split_group["mixedStake"] = False
            split_group["id"] = f"{group.get('id') or ''}::{stake_key}"
            split_group["courses"] = [
                {
                    **course,
                    "hounds": [
                        hound for hound in course.get("hounds") or []
                        if clean_text(hound.get("stake") or group.get("stake")) == stake_key
                    ],
                }
                for course in group.get("courses") or []
            ]
            final_draw = split_group.get("finalDraw") or {}
            if isinstance(final_draw, dict):
                split_group["finalDraw"] = {
                    **final_draw,
                    "courses": [
                        {
                            **course,
                            "hounds": [
                                hound for hound in course.get("hounds") or []
                                if clean_text(hound.get("stake") or group.get("stake")) == stake_key
                            ],
                        }
                        for course in final_draw.get("courses") or []
                    ],
                }
            split_groups.append(split_group)
    return split_groups


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
        str(group.get("flight") or "").upper(),
    )


def asfa_record_rows(trial: dict, group: dict) -> list[dict]:
    if clean_text(group.get("phase")) in {"BIF", "BIE"} or clean_text(group.get("breed")) in {"BIF", "BIE"}:
        return asfa_bif_record_rows(trial, group)
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
    award_by_entry = asfa_record_bob_awards_by_entry(trial)
    stake_runoff_by_entry = stake_runoff_boxes_by_entry(trial, group)
    bob_runoff_by_entry = bob_runoff_boxes_by_entry(trial)
    qualifying_minimum = placement_qualifying_minimum_for_group(trial, group)
    rows = []
    for course in sorted(group.get("courses") or [], key=lambda item: int(item.get("number") or 0)):
        for hound in sorted_hounds_by_blanket(course.get("hounds") or []):
            entry_id = str(hound.get("entryId") or "")
            entry = entries_by_id.get(str(hound.get("entryId") or "")) or {}
            placement = final_placement_by_entry.get(entry_id) or ""
            if placement and not combined_score_qualifies(combined_by_entry.get(entry_id), qualifying_minimum):
                placement = ""
            if "TIE" in clean_text(placement):
                placement = ""
            rows.append({
                "callName": asfa_record_call_name(hound, entry, group),
                "registeredName": entry.get("registeredName") or hound.get("registeredName") or "",
                "registrationNumber": entry.get("registrationNumber") or hound.get("registrationNumber") or "",
                "rollCallStatus": entry.get("rollCallStatus") or "",
                "rollCallNotes": entry.get("rollCallNotes") or "",
                "prelimOutcome": hound.get("prelimOutcome") or "",
                "finalOutcome": final_outcome_by_id.get(str(hound.get("entryId") or "")) or "",
                "prelimCode": course_color_code(course.get("number"), hound.get("blanketColor")),
                "prelimJudge1": hound.get("prelimJudge1Score") or "",
                "prelimJudge2": hound.get("prelimJudge2Score") or "",
                "prelimScore": score_or_outcome(hound.get("prelimScore"), hound.get("prelimOutcome")),
                "finalCode": final_by_entry.get(entry_id) or "",
                "finalJudge1": final_judge_scores.get(entry_id, {}).get("judge1", ""),
                "finalJudge2": final_judge_scores.get(entry_id, {}).get("judge2", ""),
                "finalScore": final_score_by_entry.get(entry_id) or "",
                "combinedScore": combined_by_entry.get(entry_id) or "",
                "stakesRunoffLabel": stake_runoff_by_entry.get(entry_id, {}).get("label", ""),
                "stakesRunoffColor": stake_runoff_by_entry.get(entry_id, {}).get("color", ""),
                "stakesRunoffCode": stake_runoff_by_entry.get(entry_id, {}).get("code", ""),
                "bobRunoffLabel": bob_runoff_by_entry.get(entry_id, {}).get("label", ""),
                "bobRunoffCode": bob_runoff_by_entry.get(entry_id, {}).get("code", ""),
                "placement": asfa_record_placement_text(placement, award_by_entry.get(entry_id)),
            })
    return rows


def asfa_record_call_name(hound: dict, entry: dict, group: dict) -> str:
    name = str(hound.get("callName") or hound.get("registeredName") or entry.get("callName") or entry.get("registeredName") or "Unnamed hound")
    if clean_text(group.get("breed")) == "SINGLES" or clean_text(group.get("stake")) == "SINGLES":
        breed = str(entry.get("breed") or hound.get("breed") or hound.get("entryBreed") or "").strip()
        display = breed_display_for_record(breed)
        if display and display not in name:
            return f"{name} ({display})"
    return name


def placement_qualifying_minimum_for_group(trial: dict, group: dict) -> float:
    judge1, judge2 = judges_for_group(trial, group)
    return 200.0 if str(judge2 or "").strip() else 100.0


def combined_score_qualifies(score: object, qualifying_minimum: float) -> bool:
    try:
        return float(score) >= qualifying_minimum
    except (TypeError, ValueError):
        return False


def breed_display_for_record(value: object) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    normalized = clean_text(text)
    if normalized.startswith("LCI"):
        return text
    code = secretary_breed_code(normalized)
    return code if code != "PROVISIONAL" else text


def asfa_bif_record_rows(trial: dict, group: dict) -> list[dict]:
    entries_by_id = {
        str(entry.get("id") or ""): entry
        for entry in trial.get("entries") or []
    }
    bif = (trial.get("scorebook") or {}).get("bif") or {}
    outcomes = group.get("recordOutcomes") if "recordOutcomes" in group else (bif.get("outcomes") or {})
    bif_results = bif_results_by_entry(trial)
    bif_tie_boxes = bif_tie_runoff_boxes_by_entry(bif)
    rows = []
    for course in sorted(group.get("courses") or [], key=lambda item: int(item.get("number") or 0)):
        for hound in sorted_hounds_by_blanket([
            {
                **hound,
                "blanketColor": hound.get("bifBlanketColor") or hound.get("blanketColor"),
            }
            for hound in course.get("hounds") or []
        ]):
            entry_id = str(hound.get("entryId") or "")
            entry = entries_by_id.get(entry_id) or {}
            outcome = normalized_record_outcome(outcomes.get(entry_id))
            placement = bif_results.get(entry_id) or ""
            event_label = "BIE" if clean_text(group.get("breed")) == "BIE" else "BIF"
            if "recordFinalWinner" in group:
                placement = event_label if group.get("recordFinalWinner") and entry_id == str(group.get("recordFinalWinner")) else ""
            if clean_text(placement) != event_label:
                placement = ""
            call_name = hound.get("callName") or hound.get("registeredName") or entry.get("callName") or entry.get("registeredName") or "Unnamed hound"
            breed_display = breed_display_for_record(entry.get("breed") or hound.get("breed") or hound.get("entryBreed") or "")
            if breed_display and breed_display not in str(call_name):
                call_name = f"{call_name} ({breed_display})"
            rows.append({
                "callName": call_name,
                "registeredName": entry.get("registeredName") or hound.get("registeredName") or "",
                "registrationNumber": entry.get("registrationNumber") or hound.get("registrationNumber") or "",
                "rollCallStatus": "",
                "rollCallNotes": "",
                "prelimOutcome": outcome.get("value") or "",
                "finalOutcome": "",
                "prelimCode": course_color_code(course.get("number"), hound.get("bifBlanketColor") or hound.get("blanketColor")),
                "prelimJudge1": outcome.get("judge1") or "",
                "prelimJudge2": outcome.get("judge2") or "",
                "prelimScore": score_or_outcome(outcome.get("score"), outcome.get("value")),
                "finalCode": "",
                "finalJudge1": "",
                "finalJudge2": "",
                "finalScore": "",
                "combinedScore": outcome.get("score") or "",
                "stakesRunoffLabel": bif_tie_boxes.get(entry_id, {}).get("label", ""),
                "stakesRunoffCode": bif_tie_boxes.get(entry_id, {}).get("code", ""),
                "secondRunoffLabel": bif_tie_boxes.get(entry_id, {}).get("secondLabel", ""),
                "secondRunoffCode": bif_tie_boxes.get(entry_id, {}).get("secondCode", ""),
                "bobRunoffLabel": bif_tie_boxes.get(entry_id, {}).get("bobLabel", ""),
                "bobRunoffCode": bif_tie_boxes.get(entry_id, {}).get("bobCode", ""),
                "placement": placement,
            })
    return rows


def bif_tie_runoff_boxes_by_entry(bif: dict) -> dict[str, dict[str, str]]:
    boxes: dict[str, dict[str, str]] = {}
    tie_runoffs = bif.get("tieRunoffs") or []
    if not tie_runoffs and bif.get("tieRunoff"):
        tie_runoffs = [bif.get("tieRunoff")]
    slots = [
        ("label", "code"),
        ("secondLabel", "secondCode"),
        ("bobLabel", "bobCode"),
    ]
    for index, runoff in enumerate(tie_runoffs):
        label_key, code_key = slots[min(index, len(slots) - 1)]
        outcomes = (runoff or {}).get("outcomes") or {}
        for course in (((runoff or {}).get("draw") or {}).get("courses") or []):
            for hound in course.get("hounds") or []:
                entry_id = str(hound.get("entryId") or "")
                if not entry_id:
                    continue
                outcome = normalized_record_outcome(outcomes.get(entry_id))
                code = score_or_outcome(outcome.get("score"), outcome.get("value"))
                if code:
                    boxes.setdefault(entry_id, {})
                    boxes[entry_id][label_key] = "BIF Tie"
                    boxes[entry_id][code_key] = str(code)
    return boxes


def asfa_record_bob_awards_by_entry(trial: dict) -> dict[str, str]:
    awards: dict[str, str] = {}
    for entry_id, result in ((trial.get("resultState") or {}).get("bobResultsByEntry") or {}).items():
        if result == "BOB":
            awards[str(entry_id)] = "BOB"
    return awards


def asfa_record_placement_text(placement: object, award: object) -> str:
    placement_text = str(placement or "").strip()
    award_text = str(award or "").strip()
    if not award_text:
        return placement_text
    if placement_text and clean_text(placement_text) != clean_text(award_text):
        return f"{placement_text}-{award_text}"
    return award_text


def original_stake_tie_labels_by_entry(group: dict) -> dict[str, str]:
    score_groups: dict[float, list[str]] = {}
    for course in (group.get("finalDraw") or {}).get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if not entry_id or hound.get("finalOutcome"):
                continue
            try:
                score = float(str(hound.get("combinedScore") or "").strip())
            except (TypeError, ValueError):
                continue
            score_groups.setdefault(score, []).append(entry_id)

    labels: dict[str, str] = {}
    placement_start = 1
    for score in sorted(score_groups, reverse=True):
        entry_ids = score_groups[score]
        placement_end = placement_start + len(entry_ids) - 1
        if len(entry_ids) > 1 and placement_start <= 5:
            visible_end = min(placement_end, 5)
            placement_names = ["NBQ" if number == 5 else str(number) for number in range(placement_start, visible_end + 1)]
            label = "-".join(placement_names)
            for entry_id in entry_ids:
                labels[entry_id] = label
        placement_start = placement_end + 1
    return labels

def stake_runoff_boxes_by_entry(trial: dict, group: dict) -> dict[str, dict[str, str]]:
    boxes: dict[str, dict[str, str]] = {}
    original_tie_labels = original_stake_tie_labels_by_entry(group)
    final_tie_state = {
        str(hound.get("entryId") or ""): hound
        for course in (group.get("finalDraw") or {}).get("courses") or []
        for hound in course.get("hounds") or []
        if hound.get("entryId")
    }
    for runoff in group.get("runoffs") or []:
        fallback_label = concise_tie_label(runoff.get("label") or "")
        suppress_pending_codes = runoff_resolved_without_scores(runoff)
        for course in runoff.get("courses") or []:
            for hound in course.get("hounds") or []:
                entry_id = str(hound.get("entryId") or "")
                label = original_tie_labels.get(entry_id) or fallback_label
                state = final_tie_state.get(entry_id) or {}
                code = runoff_record_value(
                    state.get("tieBreakOutcome") or hound.get("tieBreakOutcome"),
                    state.get("tieBreakScore") or hound.get("tieBreakScore"),
                    "",
                    suppress_pending_codes,
                    state.get("tieBreakForfeitOrder") or hound.get("tieBreakForfeitOrder"),
                )
                if entry_id and (code or label):
                    boxes[entry_id] = {
                        "label": label,
                        "color": runoff_blanket_color_code(hound, course),
                        "code": str(code),
                    }
    group_entry_ids = {
        str(hound.get("entryId") or "")
        for course in group.get("courses") or []
        for hound in course.get("hounds") or []
        if hound.get("entryId")
    }
    for runoff in trial.get("bobRunoffs") or []:
        if runoff.get("purpose") != "stakeOverall":
            continue
        if clean_text(runoff.get("breed")) != clean_text(group.get("breed")) or clean_text(runoff.get("stake")) != clean_text(group.get("stake")):
            continue
        suppress_pending_codes = runoff_resolved_without_scores(runoff)
        for course in runoff.get("courses") or []:
            for hound in course.get("hounds") or []:
                entry_id = str(hound.get("entryId") or "")
                if entry_id not in group_entry_ids:
                    continue
                code = runoff_record_value(
                    hound.get("bobOutcome") or hound.get("tieBreakOutcome"),
                    hound.get("bobScore") or hound.get("tieBreakScore"),
                    "",
                    suppress_pending_codes,
                    hound.get("bobForfeitOrder") or hound.get("tieBreakForfeitOrder"),
                )
                boxes[entry_id] = {
                    "label": "Overall",
                    "color": runoff_blanket_color_code(hound, course),
                    "code": str(code),
                }
    group_id = str(group.get("id") or "").split("::", 1)[0]
    for runoff in (trial.get("bobRunoffs") or []):
        if str(runoff.get("tieGroupId") or "") not in {str(group.get("id") or ""), group_id}:
            continue
        fallback_label = concise_tie_label(runoff.get("tieLabel") or runoff.get("label") or "")
        suppress_pending_codes = runoff_resolved_without_scores(runoff)
        is_combined = combined_tie_bob_runoff(runoff)
        tie_winner_ids = combined_tie_winner_entry_ids(runoff) if is_combined else set()
        for course in runoff.get("courses") or []:
            for hound in course.get("hounds") or []:
                if hound.get("runoffRole") != "tie" and clean_text(hound.get("tieBreakLabel")) in {"BOB", ""}:
                    continue
                entry_id = str(hound.get("entryId") or "")
                label = original_tie_labels.get(entry_id) or fallback_label
                state = final_tie_state.get(entry_id) or {}
                score_value = state.get("tieBreakScore") or hound.get("tieBreakScore")
                outcome_value = state.get("tieBreakOutcome") or hound.get("tieBreakOutcome")
                if not is_combined:
                    score_value = score_value or hound.get("bobScore")
                    outcome_value = outcome_value or hound.get("bobOutcome")
                code = runoff_record_value(
                    outcome_value,
                    score_value,
                    "",
                    suppress_pending_codes,
                    state.get("tieBreakForfeitOrder") or hound.get("tieBreakForfeitOrder"),
                )
                if (
                    is_combined
                    and entry_id in tie_winner_ids
                    and (
                        clean_text(hound.get("tieBreakOutcome")) in {"FORFEIT", "FOR"}
                        or combined_tie_has_forfeit(runoff)
                    )
                ):
                    code = ""
                if entry_id and (code or label):
                    boxes[entry_id] = {
                        "label": label,
                        "color": runoff_blanket_color_code(hound, course),
                        "code": str(code),
                    }
    return boxes


def bob_runoff_boxes_by_entry(trial: dict) -> dict[str, dict[str, str]]:
    boxes: dict[str, dict[str, str]] = {}
    for runoff in trial.get("bobRunoffs") or []:
        suppress_pending_codes = runoff_resolved_without_scores(runoff)
        key_text = clean_text(runoff.get("key"))
        is_combined = combined_tie_bob_runoff(runoff)
        tie_winner_ids = combined_tie_winner_entry_ids(runoff) if is_combined else set()
        is_bob_runoff = key_text.startswith("BOB") or key_text.startswith("COMBINED") or key_text.startswith("BOBTIE") or clean_text(runoff.get("phase")) == "BOB"
        for course in runoff.get("courses") or []:
            for hound in course.get("hounds") or []:
                if hound.get("isPlaceholder"):
                    continue
                entry_id = str(hound.get("entryId") or "")
                role = clean_text(hound.get("runoffRole") or hound.get("tieBreakLabel") or "")
                is_tie_hound = combined_tie_hound(hound)
                include_hound = role in {"BOB", ""} or is_bob_runoff
                if is_combined:
                    include_hound = not is_tie_hound or entry_id in tie_winner_ids
                if not entry_id or not include_hound:
                    continue
                blanket_code = (
                    hound.get("bobCode")
                    or hound.get("tieBreakCode")
                    or course_color_code(
                        course.get("number"),
                        hound.get("bobBlanketColor")
                        or hound.get("tieBreakBlanketColor")
                        or hound.get("blanketColor"),
                    )
                )
                if suppress_pending_codes:
                    blanket_code = ""
                result = runoff_record_value(
                    hound.get("bobOutcome") or hound.get("tieBreakOutcome"),
                    hound.get("bobScore") or hound.get("tieBreakScore"),
                    "",
                    True,
                )
                boxes[entry_id] = {"label": str(blanket_code), "code": str(result)}
    return boxes


def combined_tie_bob_runoff(runoff: dict) -> bool:
    key_text = clean_text(runoff.get("key"))
    return key_text.startswith("COMBINED") or (
        bool(runoff.get("tieLabel"))
        and any(combined_tie_hound(hound) for hound in runoff_hounds(runoff))
        and any(not combined_tie_hound(hound) for hound in runoff_hounds(runoff) if not hound.get("isPlaceholder"))
    )


def runoff_hounds(runoff: dict) -> list[dict]:
    return [
        hound
        for course in runoff.get("courses") or []
        for hound in course.get("hounds") or []
        if isinstance(hound, dict)
    ]


def combined_tie_hound(hound: dict) -> bool:
    role = clean_text(hound.get("runoffRole"))
    label = clean_text(hound.get("tieBreakLabel"))
    return role == "TIE" or (label not in {"", "BOB"} and "TIE" in label)


def combined_tie_winner_entry_ids(runoff: dict) -> set[str]:
    tie_hounds = [
        hound
        for hound in runoff_hounds(runoff)
        if not hound.get("isPlaceholder") and combined_tie_hound(hound)
    ]
    placed_winners = {
        str(hound.get("entryId") or "")
        for hound in tie_hounds
        if clean_text(hound.get("tieBreakResolvedPlacement")) == "1" and hound.get("entryId")
    }
    if placed_winners:
        return placed_winners

    scored: list[tuple[float, str]] = []
    for hound in tie_hounds:
        score_text = str(hound.get("tieBreakScore") or "").strip()
        try:
            scored.append((float(score_text), str(hound.get("entryId") or "")))
        except ValueError:
            pass
    if scored:
        scored.sort(reverse=True)
        top_score = scored[0][0]
        return {entry_id for score, entry_id in scored if score == top_score and entry_id}

    active = [
        str(hound.get("entryId") or "")
        for hound in tie_hounds
        if not clean_text(hound.get("tieBreakOutcome")) and hound.get("entryId")
    ]
    if len(active) == 1:
        return {active[0]}

    forfeits: list[tuple[int, str]] = []
    for hound in tie_hounds:
        if clean_text(hound.get("tieBreakOutcome")) not in {"FORFEIT", "FOR"}:
            continue
        try:
            order = int(str(hound.get("tieBreakForfeitOrder") or "0"))
        except ValueError:
            order = 0
        forfeits.append((order, str(hound.get("entryId") or "")))
    if forfeits:
        forfeits.sort(reverse=True)
        return {forfeits[0][1]} if forfeits[0][1] else set()

    return set()


def combined_tie_has_forfeit(runoff: dict) -> bool:
    return any(
        clean_text(hound.get("tieBreakOutcome")) in {"FORFEIT", "FOR"}
        for hound in runoff_hounds(runoff)
        if not hound.get("isPlaceholder") and combined_tie_hound(hound)
    )


def runoff_resolved_without_scores(runoff: dict) -> bool:
    hounds = [
        hound
        for course in runoff.get("courses") or []
        for hound in course.get("hounds") or []
        if not hound.get("isPlaceholder")
    ]
    has_outcome = any(hound.get("tieBreakOutcome") or hound.get("bobOutcome") for hound in hounds)
    has_score = any(str(hound.get("tieBreakScore") or hound.get("bobScore") or "").strip() for hound in hounds)
    return has_outcome and not has_score


def runoff_record_value(
    outcome: object,
    score: object,
    code: object,
    suppress_pending_code: bool = False,
    forfeit_order: object = None,
) -> str:
    if clean_text(outcome) in {"FORFEIT", "FOR"}:
        order = str(forfeit_order or "").strip()
        return f"F{order}" if order else "F"
    if str(score or "").strip():
        return str(score).strip()
    if outcome:
        return record_score_outcome_label(outcome)
    if suppress_pending_code:
        return ""
    return str(code or "")


def concise_tie_label(value: object) -> str:
    text = str(value or "").replace(" Runoff", "").replace(" Tie", "").strip()
    return text or "Tie"


def runoff_label_with_blanket(label: object, hound: dict, course: dict) -> str:
    text = str(label or "").strip()
    color_code = runoff_blanket_color_code(hound, course)
    return f"{text}({color_code})" if text and color_code else text


def runoff_blanket_color_code(hound: dict, course: dict) -> str:
    color = (
        hound.get("tieBreakBlanketColor")
        or hound.get("bobBlanketColor")
        or hound.get("blanketColor")
    )
    color_code = {"YELLOW": "Y", "PINK": "P", "BLUE": "B"}.get(clean_text(color), "")
    if not color_code:
        draw_code = str(hound.get("tieBreakCode") or hound.get("bobCode") or "").strip().upper()
        if draw_code.endswith(("Y", "P", "B")):
            color_code = draw_code[-1]
    return color_code


def normalized_record_outcome(value: object) -> dict[str, str]:
    if isinstance(value, dict):
        return {
            "value": str(value.get("value") or ""),
            "forfeitOrder": str(value.get("forfeitOrder") or ""),
            "judge1": str(value.get("judge1") or ""),
            "judge2": str(value.get("judge2") or ""),
            "score": str(value.get("score") or ""),
        }
    if value:
        return {"value": str(value), "forfeitOrder": "", "judge1": "", "judge2": "", "score": ""}
    return {"value": "", "forfeitOrder": "", "judge1": "", "judge2": "", "score": ""}


def record_score_outcome_label(value: object) -> str:
    normalized = clean_text(value)
    labels = {
        "FORFEIT": "FOR",
        "FOR": "FOR",
        "EXCUSED": "EXC",
        "EXC": "EXC",
        "DISMISSED": "DIS",
        "DIS": "DIS",
        "DISQUALIFIED": "DQ",
        "DQ": "DQ",
        "PULL": "PUL",
        "PULLED": "PUL",
        "PUL": "PUL",
    }
    return labels.get(normalized, str(value or ""))


def bif_results_by_entry(trial: dict) -> dict[str, str]:
    bif = (trial.get("scorebook") or {}).get("bif") or {}
    if bif.get("eventType") == "BIE" and bif.get("elimination"):
        winner = str(bif.get("finalWinner") or "")
        return {winner: "BIE"} if winner else {}
    results = bif_main_results_by_entry(bif)
    tie_results = bif_tie_results_by_entry(bif)
    results.update({entry_id: result for entry_id, result in tie_results.items() if result})
    if clean_text(bif.get("eventType")) == "BIE":
        results = {entry_id: result.replace("BIF", "BIE") for entry_id, result in results.items()}
    return results


def bif_main_results_by_entry(bif: dict) -> dict[str, str]:
    outcomes = bif.get("outcomes") or {}
    rows = []
    for course in ((bif.get("draw") or {}).get("courses") or []):
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            outcome = normalized_record_outcome(outcomes.get(entry_id))
            try:
                score = float(outcome.get("score") or "")
            except ValueError:
                score = None
            rows.append({"entryId": entry_id, "score": score, "outcome": outcome.get("value") or ""})
    return bif_results_from_rows(rows)


def bif_tie_results_by_entry(bif: dict) -> dict[str, str]:
    tie_runoffs = bif.get("tieRunoffs") or []
    if not tie_runoffs and bif.get("tieRunoff"):
        tie_runoffs = [bif.get("tieRunoff")]
    if not tie_runoffs:
        return {}
    current = tie_runoffs[-1] or {}
    outcomes = current.get("outcomes") or {}
    rows = []
    for course in ((current.get("draw") or {}).get("courses") or []):
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            outcome = normalized_record_outcome(outcomes.get(entry_id))
            try:
                score = float(outcome.get("score") or "")
            except ValueError:
                score = None
            rows.append({"entryId": entry_id, "score": score, "outcome": outcome.get("value") or ""})
    return bif_results_from_rows(rows)


def bif_results_from_rows(rows: list[dict]) -> dict[str, str]:
    if not rows or any(row["score"] is None and not row["outcome"] for row in rows):
        return {}
    scored = sorted([row for row in rows if row["score"] is not None and not row["outcome"]], key=lambda row: row["score"], reverse=True)
    if not scored:
        return {row["entryId"]: record_score_outcome_label(row["outcome"]) for row in rows if row["outcome"]}
    top_score = scored[0]["score"]
    top_ids = {row["entryId"] for row in scored if row["score"] == top_score}
    return {
        row["entryId"]: ("BIF Tie" if row["entryId"] in top_ids and len(top_ids) > 1 else "BIF" if row["entryId"] in top_ids else record_score_outcome_label(row["outcome"]))
        for row in rows
    }


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
    if status in {"BREEDDQ", "BREEDDISQUALIFIED"} or "BREEDDQ" in notes or "BREEDDISQUALIFIED" in notes:
        return "BREED DQ"
    if status in {"SCRATCHED", "SCRATCH"} or "SCRATCHED" in notes or "SCRATCH" in notes:
        return "SCRATCHED"
    return ""


def asfa_record_strike_reason(row: dict) -> str:
    reason = asfa_record_refund_reason(row)
    if clean_text(reason) in {"DISMISSED", "EXCUSED"}:
        return ""
    return reason


def final_codes_by_entry(group: dict) -> dict[str, str]:
    codes: dict[str, str] = {}
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            entry_id = str(hound.get("entryId") or "")
            if entry_id:
                codes[entry_id] = hound.get("finalCode") or course_color_code(course.get("number"), hound.get("blanketColor"))
    return codes


def append_first_time_documents_for_group(writer: PdfWriter, trial: dict, group: dict, entry_layout: dict | None = None, lci_entry_layout: dict | None = None) -> None:
    entries_by_id = {str(entry.get("id") or ""): entry for entry in trial.get("entries") or []}
    seen_documents: set[str] = set()
    layout_settings = asfa_entry_layout(entry_layout)
    lci_layout_settings = asfa_lci_entry_layout(lci_entry_layout)
    for entry_id in group_entry_ids(group):
        entry = entries_by_id.get(entry_id)
        if not entry or not (bool(entry.get("firstTime")) or bool(entry.get("infoChanged"))):
            continue
        append_asfa_entry_form_for_entry(writer, trial, entry, lci_layout_settings if is_lci_entry(entry) else layout_settings)
        document_ids = first_time_document_ids_for_entry(entry, group) if bool(entry.get("firstTime")) else []
        if bool(entry.get("infoChanged")):
            document_ids.extend(information_change_document_ids_for_entry(entry))
        for document_id in document_ids:
            if not document_id or document_id in seen_documents:
                continue
            seen_documents.add(document_id)
            document = read_entry_document(document_id)
            if not document:
                continue
            append_document_to_writer(writer, document)


def append_signed_judge_sheets_for_group(writer: PdfWriter, group: dict) -> None:
    seen_documents: set[str] = set()
    for document_id in signed_judge_sheet_document_ids_for_group(group):
        if not document_id or document_id in seen_documents:
            continue
        seen_documents.add(document_id)
        document = read_entry_document(document_id)
        if not document:
            continue
        append_document_to_writer(writer, document)


def signed_judge_sheet_document_ids_for_group(group: dict) -> list[str]:
    ids: list[str] = []
    for course in group.get("courses") or []:
        for hound in course.get("hounds") or []:
            if outcome_requires_signed_judge_sheet(hound.get("prelimOutcome")):
                ids.extend(document_ids_from_hound(hound, "prelimSignedJudgeSheetIds", "prelimSignedJudgeSheets"))
    final_draw = group.get("finalDraw") or {}
    for course in final_draw.get("courses") or []:
        for hound in course.get("hounds") or []:
            if outcome_requires_signed_judge_sheet(hound.get("finalOutcome")):
                ids.extend(document_ids_from_hound(hound, "finalSignedJudgeSheetIds", "finalSignedJudgeSheets"))
    return ids


def document_ids_from_hound(hound: dict, id_key: str, record_key: str) -> list[str]:
    ids = [str(document_id) for document_id in hound.get(id_key) or [] if document_id]
    for document in hound.get(record_key) or []:
        document_id = str((document or {}).get("id") or "")
        if document_id and document_id not in ids:
            ids.append(document_id)
    return ids


def outcome_requires_signed_judge_sheet(outcome: object) -> bool:
    normalized = clean_text(outcome)
    return normalized in {"EXCUSED", "EXC", "DISMISSED", "DIS", "DISQUALIFIED", "DQ"}


def append_asfa_entry_form_for_entry(writer: PdfWriter, trial: dict, entry: dict, layout: dict) -> None:
    template_path = ENTRY_FORM_TEMPLATES["ASFA_LCI"] if is_lci_entry(entry) else ENTRY_FORM_TEMPLATES["ASFA"]
    if not template_path.exists():
        return
    try:
        page = fresh_half_page_template(template_path, layout["copyOffsetX"])
        overlay_bytes = build_asfa_lci_entry_form_overlay(trial, entry, page, layout) if is_lci_entry(entry) else build_asfa_entry_form_overlay(trial, entry, page, layout)
        overlay = PdfReader(io.BytesIO(overlay_bytes)).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
    except Exception:
        return


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
    lci_registration_id = str(entry.get("lciRegistrationDocumentId") or "")
    if registration_id:
        ids.append(registration_id)
    if not is_quasi_breed_record_group(group) and coursing_id:
        ids.append(coursing_id)
    if bool(entry.get("needsLciRegistration")) and lci_registration_id:
        ids.append(lci_registration_id)
    if not ids:
        ids.extend(str(document_id) for document_id in entry.get("documentIds") or [] if document_id)
    return ids


def information_change_document_ids_for_entry(entry: dict) -> list[str]:
    ids: list[str] = []
    candidates = [
        entry.get("registrationCertDocumentId"),
        entry.get("coursingCertDocumentId"),
        entry.get("lciRegistrationDocumentId"),
        *(entry.get("documentIds") or []),
        *[(record or {}).get("id") for record in entry.get("documentRecords") or []],
    ]
    for document_id in candidates:
        value = str(document_id or "")
        if value and value not in ids:
            ids.append(value)
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
        "pull": "PUL",
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
    draw_field_label(pdf, field_name_for_breed(trial, group.get("breed")), 780, 600, right=True, font_size=8)
    pdf.drawString(layout["breedX"], y_from_top(asfa_record_y(layout, "breedY")), safe_text(group.get("breed"), 24))
    pdf.drawString(layout["stakeX"], y_from_top(asfa_record_y(layout, "stakeY")), safe_text(asfa_record_stake_label(group), 22))
    pdf.drawString(layout["flightX"], y_from_top(asfa_record_y(layout, "flightY")), safe_text(group.get("flight") or "A", 2))
    pdf.drawString(layout["enteredX"], y_from_top(asfa_record_y(layout, "enteredY")), str(entry_count))
    pdf.drawString(layout["refundsX"], y_from_top(asfa_record_y(layout, "refundsY")), str(refund_count))
    pdf.drawString(layout["perCapitaX"], y_from_top(asfa_record_y(layout, "perCapitaY")), str(per_capita_count))
    pdf.setFont("Helvetica", 7)
    if page_start:
        pdf.drawRightString(770, y_from_top(104), f"Continued - rows {page_start + 1}+")
    pdf.setFont("Helvetica", layout.get("footerFontSize", 9))
    judge1, judge2 = judges_for_group(trial, group)
    pdf.drawString(layout["judge1X"], y_from_top(asfa_record_y(layout, "judge1Y")), safe_text(judge1, 32))
    pdf.drawString(layout["judge2X"], y_from_top(asfa_record_y(layout, "judge2Y")), safe_text(judge2, 32))
    pdf.drawString(layout["footerClubX"], y_from_top(asfa_record_y(layout, "footerClubY")), safe_text(trial.get("clubName"), 32))
    pdf.drawString(layout["footerDateX"], y_from_top(asfa_record_y(layout, "footerDateY")), safe_text(trial.get("startsOn"), 14))
    pdf.drawString(layout["fieldClerkX"], y_from_top(asfa_record_y(layout, "fieldClerkY")), safe_text(trial.get("fieldClerk"), 32))
    pdf.drawString(layout["fieldSecretaryX"], y_from_top(asfa_record_y(layout, "fieldSecretaryY")), safe_text(trial.get("secretaryName"), 32))


def asfa_record_stake_label(group: dict) -> str:
    if not group.get("mixedStake"):
        return abbreviate_stake(group.get("stake") or "")
    stakes: list[str] = []
    seen: set[str] = set()
    for course in group.get("courses") or []:
        for hound in course.get("hounds") or []:
            stake = str(hound.get("stake") or "").strip()
            key = clean_text(stake)
            if stake and key not in seen:
                seen.add(key)
                stakes.append(abbreviate_stake(stake))
    if not stakes:
        return "Mixed"
    return f"Mixed ({' - '.join(stakes)})"


def judges_for_group(trial: dict, group: dict) -> tuple[str, str]:
    if clean_text(group.get("breed")) == "BIF" or clean_text(group.get("phase")) == "BIF":
        bif = (trial.get("scorebook") or {}).get("bif") or {}
        return str(bif.get("judge1") or ""), str(bif.get("judge2") or "")
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
        stakes_runoff_label = safe_text(row.get("stakesRunoffLabel"), 16)
        stakes_runoff_font_size = min(float(layout["codeFontSize"]), 8.5)
        while stakes_runoff_font_size > 4.0 and pdf.stringWidth(stakes_runoff_label, "Helvetica-Bold", stakes_runoff_font_size) > 40:
            stakes_runoff_font_size -= 0.5
        stakes_label_y = asfa_record_y(layout, "stakesRunoffLabelY", row_offset) - 5
        pdf.setFont("Helvetica-Bold", stakes_runoff_font_size)
        pdf.drawCentredString(layout["stakesRunoffLabelX"], y_from_top(stakes_label_y), stakes_runoff_label)
        stakes_runoff_color = safe_text(row.get("stakesRunoffColor"), 2)
        pdf.setFont("Helvetica-Bold", 7.5)
        pdf.drawCentredString(layout["stakesRunoffLabelX"], y_from_top(stakes_label_y + 6), stakes_runoff_color)
        pdf.setFont("Helvetica-Bold", layout["codeFontSize"])
        pdf.drawCentredString(layout["stakesRunoffCodeX"], y_from_top(asfa_record_y(layout, "stakesRunoffCodeY", row_offset)), safe_text(row.get("stakesRunoffCode"), 5))
        pdf.drawCentredString(layout["secondRunoffLabelX"], y_from_top(asfa_record_y(layout, "secondRunoffLabelY", row_offset)), safe_text(row.get("secondRunoffLabel"), 8))
        pdf.drawCentredString(layout["secondRunoffCodeX"], y_from_top(asfa_record_y(layout, "secondRunoffCodeY", row_offset)), safe_text(row.get("secondRunoffCode"), 5))
        pdf.drawCentredString(layout["bobRunoffLabelX"], y_from_top(asfa_record_y(layout, "bobRunoffLabelY", row_offset)), safe_text(row.get("bobRunoffLabel"), 8))
        pdf.drawCentredString(layout["bobRunoffCodeX"], y_from_top(asfa_record_y(layout, "bobRunoffCodeY", row_offset)), safe_text(row.get("bobRunoffCode"), 5))
        draw_record_placement(pdf, row.get("placement"), layout, row_offset)
        reason = asfa_record_strike_reason(row)
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


def draw_record_placement(pdf: canvas.Canvas, value: object, layout: dict, row_offset: float) -> None:
    text = str(value or "").strip()
    if "-" not in text:
        pdf.drawCentredString(layout["placementX"], y_from_top(asfa_record_y(layout, "placementY", row_offset)), safe_text(text, 10))
        return
    parts = [part.strip() for part in text.split("-") if part.strip()]
    if len(parts) <= 1:
        pdf.drawCentredString(layout["placementX"], y_from_top(asfa_record_y(layout, "placementY", row_offset)), safe_text(text, 10))
        return
    y = asfa_record_y(layout, "placementY", row_offset) - 7
    for index, part in enumerate(parts[:2]):
        pdf.drawCentredString(layout["placementX"], y_from_top(y + (index * 13)), safe_text(part, 8))


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
    lci_registration_count = secretary_lci_registration_count(trial)
    lci_registration_fee = lci_registration_count * 10
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawRightString(layout["breedFeeX"], secretary_y(height, layout, "breedFeeY"), money_text(breed_fee))
    pdf.drawRightString(layout["specialFeeX"], secretary_y(height, layout, "specialFeeY"), money_text(special_fee))
    pdf.drawCentredString(
        layout["lciRegistrationCountX"],
        secretary_y(height, layout, "lciRegistrationCountY"),
        str(lci_registration_count),
    )
    pdf.drawRightString(
        layout["lciRegistrationFeeX"],
        secretary_y(height, layout, "lciRegistrationFeeY"),
        money_text(lci_registration_fee),
    )
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
        "workingOffDismissal": yes_no_value(trial.get("secretaryWorkingOffDismissal"), auto_working_off_dismissal(trial)),
        "changeOfInfo": yes_no_value(trial.get("secretaryChangeOfInfo"), auto_change_of_info(trial)),
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


def auto_working_off_dismissal(trial: dict) -> str:
    return "yes" if any(bool(entry.get("dismissedLastSix")) for entry in trial.get("entries") or []) else "no"


def auto_change_of_info(trial: dict) -> str:
    return "yes" if any(bool(entry.get("infoChanged")) for entry in trial.get("entries") or []) else "no"


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
        if not secretary_entry_counts_for_per_capita(entry):
            continue
        key = secretary_breed_key(entry)
        if not key:
            continue
        row = counts.setdefault(key, {"open": 0, "fch": 0, "vets": 0, "total": 0})
        column = secretary_stake_column(entry.get("className"))
        row[column] += 1
        row["total"] += 1
    return counts


def secretary_breed_key(entry: dict) -> str:
    breed_key = clean_text(entry.get("breed"))
    class_key = clean_text(entry.get("className"))
    if class_key == "SINGLES":
        return "SINGLES"
    if breed_key.startswith("LCILARGE") or class_key.startswith("LCILARGE"):
        return "LCILARGE"
    if breed_key.startswith("LCISMALL") or class_key.startswith("LCISMALL"):
        return "LCISMALL"
    if (
        breed_key.startswith("LCISIGHTHOUNDMIX")
        or breed_key.startswith("LCISHMIX")
        or class_key.startswith("LCISIGHTHOUNDMIX")
        or class_key.startswith("LCISHMIX")
    ):
        return "LCISHMIX"
    return secretary_breed_code(entry.get("breed"))


def secretary_entry_counts_for_per_capita(entry: dict) -> bool:
    status = clean_text(entry.get("rollCallStatus"))
    notes = clean_text(entry.get("rollCallNotes"))
    if status in {"LAME", "INSEASON", "SEASON", "BREEDDQ", "BREEDDISQUALIFIED", "SCRATCHED", "SCRATCH"}:
        return False
    if any(value in notes for value in ("LAME", "INSEASON", "SEASON", "BREEDDQ", "BREEDDISQUALIFIED", "SCRATCHED", "SCRATCH")):
        return False
    return True


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
        "SCOTTISHDEERHOUNDS": "SD",
        "G": "GH", "GREYHOUND": "GH", "P": "PH", "PHARAOHHOUND": "PH",
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


def secretary_lci_registration_count(trial: dict) -> int:
    configured = positive_int(trial.get("secretaryLciRegistrationCount"))
    if bool(trial.get("secretaryLciRegistrationCountManual")) or configured > 0:
        return configured
    return sum(1 for entry in trial.get("entries") or [] if bool(entry.get("needsLciRegistration")))


def secretary_per_capita_rate(trial: dict) -> float:
    try:
        rate = float(trial.get("secretaryPerCapitaRate") or 3.5)
    except (TypeError, ValueError):
        rate = 3.5
    valid_rates = (3.5, 4.0, 4.5, 5.0, 6.0)
    return next((valid_rate for valid_rate in valid_rates if abs(rate - valid_rate) < 0.01), 3.5)


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


def fresh_half_page_template(template_path: Path, split_x: float):
    page = fresh_template_page(template_path)
    page.mediabox.lower_left = (0, 0)
    page.mediabox.upper_right = (split_x, float(page.mediabox.height))
    page.cropbox.lower_left = (0, 0)
    page.cropbox.upper_right = (split_x, float(page.mediabox.height))
    return page


def flatten_judge_courses(trial: dict, group_ids: list[str] | None = None) -> list[dict]:
    judges_by_breed = {
        clean_text(row.get("breed")): [value for value in [row.get("judge1"), row.get("judge2")] if value]
        for row in trial.get("runPlan") or []
    }
    selected_ids = {str(value or "") for value in (group_ids or []) if str(value or "")}
    courses = []
    for group in draw_groups_for_print(trial):
        if selected_ids and str(group.get("id") or "") not in selected_ids:
            continue
        for course in group.get("courses") or []:
            hounds = sorted(course.get("hounds") or [], key=lambda hound: int(hound.get("drawPosition") or 0))
            mixed_stakes = sorted({
                abbreviate_stake(hound.get("stake") or "")
                for hound in hounds
                if hound.get("stake")
            }, key=lambda value: clean_text(value))
            courses.append({
                "breed": group.get("judgeBreed") or group.get("breed") or "",
                "fieldName": field_name_for_breed(trial, group.get("breed")),
                "stake": group.get("judgeStake") or abbreviate_stake(group.get("stake") or ""),
                "flight": group.get("flight") or "A",
                "lciType": infer_lci_type_from_group_and_hounds(group, hounds),
                "course": course.get("number") or "",
                "phase": group.get("phase") or "",
                "runoffText": group.get("runoffText") or "",
                "mixedStake": bool(group.get("mixedStake")),
                "mixedStakes": mixed_stakes,
                "mixedText": group.get("manualNote") or "Mixed",
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
                "fieldName": field_name_for_breed(trial, group.get("breed")),
                "stake": abbreviate_stake(group.get("stake") or ""),
                "flight": group.get("flight") or "A",
                "lciType": infer_lci_type_from_group_and_hounds(group, normalized_hounds),
                "course": course.get("number") or "",
                "phase": "runoff",
                "runoffText": runoff.get("label") or "",
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
                "fieldName": field_name_for_breed(trial, group.get("breed")),
                "stake": abbreviate_stake(group.get("stake") or ""),
                "flight": group.get("flight") or "A",
                "lciType": infer_lci_type_from_group_and_hounds(group, normalized_hounds),
                "course": course.get("number") or "",
                "phase": "final",
                "mixedStake": bool(group.get("mixedStake")),
                "mixedStakes": sorted({
                    abbreviate_stake(hound.get("stake") or "")
                    for hound in normalized_hounds
                    if hound.get("stake")
                }, key=lambda value: clean_text(value)),
                "mixedText": group.get("manualNote") or "Mixed",
                "judges": judges_by_breed.get(clean_text(group.get("breed")), []),
                "hounds": normalized_hounds,
            })
        return courses
    return []


def infer_lci_type_from_group_and_hounds(group: dict, hounds: list[dict]) -> str:
    for value in (group.get("lciType"), group.get("breed"), group.get("stake"), group.get("judgeBreed"), group.get("judgeStake")):
        lci_type = asfa_lci_type(clean_text(value))
        if lci_type:
            return lci_type
    for hound in hounds or []:
        for value in (hound.get("breed"), hound.get("className"), hound.get("stake"), hound.get("entryBreed"), hound.get("entryClassName")):
            lci_type = asfa_lci_type(clean_text(value))
            if lci_type:
                return lci_type
    return ""


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
                "stake": hound.get("bobStake") or hound.get("stake") or "",
            }
            for hound in hounds
        ]
        courses.append({
            "breed": "BIE" if bif.get("eventType") == "BIE" else "BIF",
            "stake": "",
            "course": course.get("number") or "",
            "phase": "bie" if bif.get("eventType") == "BIE" else "bif",
            "mixedStake": False,
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


def append_akc_judge_forms(writer: PdfWriter, trial: dict, courses: list[dict], template_path: Path) -> None:
    forms = flatten_asfa_judge_forms(courses)
    crop_left = 189.0
    crop_bottom = 189.0
    slot_width = 264.0
    for start in range(0, len(forms), 3):
        output_page = writer.add_blank_page(width=792, height=612)
        for slot, form in enumerate(forms[start:start + 3]):
            source_page = fresh_template_page(template_path)
            overlay = PdfReader(io.BytesIO(build_akc_judge_overlay(trial, form))).pages[0]
            source_page.merge_page(overlay)
            output_page.merge_translated_page(
                source_page,
                (slot * slot_width) - crop_left,
                4.0 - crop_bottom,
                expand=False,
                over=True,
            )

AKC_JUDGE_BREED_CIRCLES = {
    "A": (231.37, 4.0),
    "AZ": (240.81, 5.5),
    "BA": (250.81, 5.8),
    "B": (260.59, 4.0),
    "G": (268.50, 4.0),
    "IB": (277.21, 5.0),
    "IG": (286.71, 5.0),
    "IW": (296.87, 5.5),
    "P": (305.86, 4.0),
    "PP": (315.18, 5.5),
    "R": (322.99, 4.0),
    "S": (330.53, 4.0),
    "SD": (340.08, 5.5),
    "SL": (351.41, 5.0),
    "TR": (362.63, 5.5),
    "W": (371.10, 4.5),
}

AKC_JUDGE_BREED_ALIASES = {
    "AH": "A", "AFGHAN": "A",
    "AZAWAKH": "AZ",
    "BASENJI": "BA",
    "BZ": "B", "BORZOI": "B",
    "GH": "G", "GREYHOUND": "G",
    "IBIZAN": "IB",
    "ITALIAN": "IG",
    "IRISH": "IW",
    "PH": "P", "PHARAOH": "P",
    "POD": "PP", "PODENGO": "PP",
    "RR": "R", "RHODESIAN": "R",
    "SA": "S", "SALUKI": "S",
    "DH": "SD", "SCOTTISH": "SD", "DEERHOUND": "SD",
    "SLOUGHI": "SL",
    "THAI": "TR",
    "WH": "W", "WHIPPET": "W",
}


def draw_akc_judge_breed_mark(pdf: canvas.Canvas, breed: object) -> None:
    raw = clean_text(breed)
    breed_key = raw if raw in AKC_JUDGE_BREED_CIRCLES else AKC_JUDGE_BREED_ALIASES.get(raw, "")
    circle = AKC_JUDGE_BREED_CIRCLES.get(breed_key)
    if circle:
        center_x, radius_x = circle
        draw_circle(pdf, center_x, 693.11, radius_x, 5.0, 1.4)
        return
    if raw and raw != "BIF":
        pdf.drawString(390, 696, safe_text(breed, 12))

def build_akc_judge_overlay(trial: dict, course: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle("AKC Judge Sheet")
    pdf.setFillColorRGB(0.75, 0, 0)
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(234, 733, safe_text(trial.get("clubName"), 34))
    pdf.drawString(275, 716, safe_text(trial.get("startsOn"), 16))
    draw_field_label(pdf, course.get("fieldName"), 420, 748, right=True, font_size=7)
    draw_akc_judge_breed_mark(pdf, course.get("breed"))
    draw_akc_phase_check(pdf, course.get("phase"))
    if not draw_akc_stake_check(pdf, course.get("stake")):
        pdf.drawString(390, 642, safe_text(course.get("stake"), 14))
    draw_akc_course_check(pdf, course.get("course"))
    draw_akc_split_stake_mark(pdf, course.get("flight"))
    judge_index = max(1, min(2, int(course.get("judgeIndex") or 1)))
    judge_y = 588 if judge_index == 1 else 568
    pdf.drawString(236, judge_y, safe_text(course.get("judge") or "", 30))
    draw_akc_unused_color_strikes(pdf, course)
    pdf.save()
    return buffer.getvalue()


def draw_akc_split_stake_mark(pdf: canvas.Canvas, flight: object) -> None:
    label = str(flight or "").strip().upper()
    if label not in {"A", "B", "C", "D", "E"}:
        return
    # Centers measured from the A-E glyphs in the bundled AKC judge template.
    center_x = {"A": 240.8, "B": 257.8, "C": 274.9, "D": 292.4, "E": 309.6}[label]
    draw_circle(pdf, center_x, 640.5, 7.5, 6.0, 1.4)

def draw_akc_stake_check(pdf: canvas.Canvas, stake: object) -> bool:
    normalized = clean_text(stake)
    if normalized == "OPEN":
        x = 204
    elif normalized in {"FCH", "FIELDCHAMPION", "SPECIAL", "SPECIALS"}:
        x = 276
    elif normalized in {"BOB", "BIF", "BOBBIF"}:
        x = 348
    else:
        return False
    draw_check_mark(pdf, x, 671)
    return True


def draw_akc_phase_check(pdf: canvas.Canvas, phase: object) -> None:
    normalized = clean_text(phase)
    if normalized in {"FINAL", "FINALS"}:
        draw_check_mark(pdf, 276, 657)
    elif normalized in {"RUNOFF", "RUNOFFS", "TIE"}:
        draw_check_mark(pdf, 348, 657)
    elif normalized not in {"BIF", "BOB", "BIE"}:
        draw_check_mark(pdf, 204, 657)


def draw_akc_course_check(pdf: canvas.Canvas, course_number: object) -> None:
    try:
        number = int(course_number)
    except (TypeError, ValueError):
        return
    if 1 <= number <= 10:
        x_positions = {1: 242.75, 2: 258.60, 3: 274.44, 4: 290.28, 5: 306.12, 6: 321.96, 7: 337.81, 8: 353.65, 9: 369.49, 10: 387.97}
        draw_circle(pdf, x_positions[number], 614.92, 6.5, 5.5, 1.5)


def draw_akc_unused_color_strikes(pdf: canvas.Canvas, course: dict) -> None:
    used_colors = {
        clean_text(hound.get("blanketColor"))
        for hound in course.get("hounds") or []
        if clean_text(hound.get("blanketColor")) in {"YELLOW", "PINK", "BLUE"}
    }
    if not used_colors:
        return
    columns = {
        "YELLOW": (290, 334),
        "PINK": (334, 378),
        "BLUE": (378, 422),
    }
    top_y = 538
    bottom_y = 330
    pdf.saveState()
    pdf.setStrokeColorRGB(0.75, 0, 0)
    pdf.setLineWidth(1.25)
    for color, (left, right) in columns.items():
        if color in used_colors:
            continue
        pdf.line(left, top_y, right, bottom_y)
        pdf.line(right, top_y, left, bottom_y)
    pdf.restoreState()


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
    field_name = str(form.get("fieldName") or "").strip()
    if field_name:
        pdf.saveState()
        pdf.setFillColorRGB(0.75, 0, 0)
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawCentredString(x + 202, y_from_top(76 + y_adjust), safe_text(f"FIELD: {field_name}", 34))
        pdf.restoreState()
    draw_asfa_breed_mark(pdf, x, form.get("breed"), y_adjust, layout)
    lci_type = infer_asfa_lci_type(form)
    if lci_type:
        draw_asfa_lci_mark(pdf, x, lci_type, y_adjust, layout)
    draw_asfa_stake_mark(pdf, x, form.get("stake"), y_adjust, layout, form.get("phase"), form)
    draw_asfa_mixed_text(pdf, x, form, y_adjust, layout)
    draw_asfa_flight_mark(pdf, x, form.get("flight") or "A", y_adjust, layout)
    draw_asfa_phase_mark(pdf, x, y_adjust, layout, form.get("phase"))
    draw_asfa_runoff_text(pdf, x, form.get("runoffText"), y_adjust, layout)
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
        "AF": x + 57,
        "AH": x + 57,
        "AFGHANHOUND": x + 57,
        "AFGHANHOUNDS": x + 57,
        "AZ": x + 72,
        "AZAWAKH": x + 72,
        "AZAWAKHS": x + 72,
        "BA": x + 90,
        "BASENJI": x + 90,
        "BASENJIS": x + 90,
        "B": x + 104,
        "BZ": x + 104,
        "BORZOI": x + 104,
        "BORZOIS": x + 104,
        "C": x + 121,
        "CE": x + 121,
        "CIRNECODELLETNA": x + 121,
        "CIRNECHI": x + 121,
        "G": x + 134,
        "GH": x + 134,
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
        "PH": x + 191,
        "PHARAOHOUND": x + 191,
        "PHARAOHHOUNDS": x + 191,
        "PIO": x + 207,
        "PERUVIANINCAORCHID": x + 207,
        "PERUVIANINCAORCHIDS": x + 207,
        "RR": x + 227,
        "RHODESIANRIDGEBACK": x + 227,
        "RHODESIANRIDGEBACKS": x + 227,
        "S": x + 242,
        "SA": x + 242,
        "SALUKI": x + 242,
        "SALUKIS": x + 242,
        "SD": x + 259,
        "DH": x + 259,
        "DEERHOUND": x + 259,
        "DEERHOUNDS": x + 259,
        "SCOTTISHDEERHOUND": x + 259,
        "SCOTTISHDEERHOUNDS": x + 259,
        "SL": x + 278,
        "SLOUGHI": x + 278,
        "SLOUGHIS": x + 278,
        "SW": x + 299,
        "SILKENWINDHOUND": x + 299,
        "SILKENWINDHOUNDS": x + 299,
        "W": x + 316,
        "WH": x + 316,
        "WHIPPET": x + 316,
        "WHIPPETS": x + 316,
    }
    normalized = clean_text(breed)
    if normalized in {"BIF", "BIE"}:
        return
    if "LCI" in normalized:
        return
    if asfa_lci_type(normalized):
        return
    target_x = breed_code_positions.get(normalized)
    if target_x:
        draw_circle(pdf, target_x, y_from_top(layout["breedCircleY"] + y_adjust), layout["breedCircleW"], layout["breedCircleH"], layout["circleWeight"])
    else:
        pdf.drawString(x + layout["otherBreedX"], y_from_top(layout["otherBreedY"] + y_adjust), safe_text(breed, 10))


def draw_asfa_mixed_text(pdf: canvas.Canvas, x: float, form: dict, y_adjust: float, layout: dict) -> None:
    if clean_text(form.get("phase")) in {"BIF", "BIE"} or clean_text(form.get("breed")) in {"BIF", "BIE"}:
        return
    if not form.get("mixedStake"):
        return
    text = form.get("mixedText") or "Mixed"
    pdf.drawString(x + layout.get("mixedTextX", layout.get("otherBreedX", 292)), y_from_top(layout.get("mixedTextY", layout.get("otherBreedY", 169)) + y_adjust), safe_text(text, 12))


def draw_asfa_stake_mark(pdf: canvas.Canvas, x: float, stake: object, y_adjust: float, layout: dict, phase: object = "", form: dict | None = None) -> None:
    normalized_phase = clean_text(phase)
    if normalized_phase in {"BIF", "BIE"} or (form and clean_text(form.get("breed")) in {"BIF", "BIE"}):
        return
    raw_stakes = [stake]
    if form and form.get("mixedStake"):
        raw_stakes = form.get("mixedStakes") or [
            hound.get("stake")
            for hound in form.get("hounds") or []
            if hound.get("stake")
        ]
    if form and asfa_form_has_provisional_breed(form):
        raw_stakes.append("Provisional")
    normalized_stakes: list[str] = []
    for raw_stake in raw_stakes:
        normalized = clean_text(raw_stake)
        lci_type = asfa_lci_type(normalized)
        if lci_type:
            for candidate in ("OPEN", "EXCELLENT", "VETERAN"):
                if normalized.endswith(candidate):
                    normalized = candidate
                    break
        if normalized and normalized not in normalized_stakes:
            normalized_stakes.append(normalized)
    if not normalized_stakes:
        return
    x_positions = {
        "OPEN": x + 65,
        "FCH": x + 103,
        "FIELDCHAMPION": x + 103,
        "EXCELLENT": x + 146,
        "VETERAN": x + 196,
        "SINGLES": x + 245,
        "PROVISIONAL": x + layout.get("provisionalStakeX", 305),
    }
    for normalized in normalized_stakes:
        if normalized_phase in {"BOB", "BIF", "BIE"} and normalized in {"", "BOB", "BIF", "BIE", "BOBTIE", "BOBTIERUNOFF"}:
            continue
        if normalized in {"RUNOFF", "TIE", "BOB", "BIF", "BIE", "BOBTIE", "BOBTIERUNOFF", "MIXED"}:
            continue
        target_x = x_positions.get(normalized)
        if not target_x:
            continue
        draw_circle(pdf, target_x, y_from_top(layout["stakeCircleY"] + y_adjust), layout["stakeCircleW"], layout["stakeCircleH"], layout["circleWeight"])


def asfa_form_has_provisional_breed(form: dict) -> bool:
    values = [form.get("breed")]
    values.extend(
        hound.get(key)
        for hound in form.get("hounds") or []
        for key in ("breed", "entryBreed", "registeredBreed")
    )
    for value in values:
        normalized = clean_text(value)
        if not normalized or normalized in {"BIF", "BIE", "SINGLES"} or normalized.startswith("LCI"):
            continue
        if secretary_breed_code(normalized) == "PROVISIONAL":
            return True
    return False


def asfa_lci_type(normalized_stake: str) -> str:
    normalized = clean_text(normalized_stake)
    if "LCI" not in normalized:
        return ""
    if normalized in {"LCIS", "LCISM", "LCISMALL"} or normalized.startswith("LCISMALL"):
        return "SMALL"
    if normalized in {"LCIL", "LCILG", "LCILARGE"} or normalized.startswith("LCILARGE"):
        return "LARGE"
    if (
        normalized in {"LCISH", "LCISHMIX", "LCISIGHTHOUNDMIX"}
        or normalized.startswith("LCISIGHTHOUNDMIX")
        or normalized.startswith("LCISHMIX")
        or ("LCI" in normalized and "MIX" in normalized)
    ):
        return "SHMIX"
    if "SMALL" in normalized:
        return "SMALL"
    if "LARGE" in normalized:
        return "LARGE"
    if "SIGHTHOUND" in normalized or "SH" in normalized:
        return "SHMIX"
    return ""


def infer_asfa_lci_type(form: dict) -> str:
    for value in (form.get("lciType"), form.get("breed"), form.get("stake"), form.get("judgeBreed"), form.get("judgeStake")):
        lci_type = asfa_lci_type(clean_text(value))
        if lci_type:
            return lci_type
    for hound in form.get("hounds") or []:
        for value in (
            hound.get("breed"),
            hound.get("className"),
            hound.get("stake"),
            hound.get("entryBreed"),
            hound.get("entryClassName"),
        ):
            lci_type = asfa_lci_type(clean_text(value))
            if lci_type:
                return lci_type
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
    if normalized in {"RUNOFF", "TIE", "TIERUNOFF"}:
        return
    draw_circle(pdf, x + layout["phaseCircleX"], y_from_top(layout["phaseCircleY"] + y_adjust), layout["phaseCircleW"], layout["phaseCircleH"], layout["circleWeight"])


def draw_asfa_runoff_text(pdf: canvas.Canvas, x: float, runoff_text: object, y_adjust: float, layout: dict) -> None:
    text = str(runoff_text or "").replace(" Tie", "").replace(" Runoff", "").strip()
    if not text:
        return
    pdf.setFont("Helvetica-Bold", layout["fontSize"])
    pdf.drawString(x + layout["phaseTextX"], y_from_top(layout["phaseTextY"] + y_adjust), safe_text(text, 12))


def draw_asfa_flight_mark(pdf: canvas.Canvas, x: float, flight: object, y_adjust: float, layout: dict) -> None:
    label = str(flight or "A").strip().upper()
    index = max(0, min(9, ord(label[:1]) - ord("A"))) if label else 0
    flight_x = layout["flightCircleX"] + (index * layout.get("flightCircleStepX", 31.5))
    draw_circle(pdf, x + flight_x, y_from_top(layout["flightCircleY"] + y_adjust), layout["flightCircleW"], layout["flightCircleH"], layout["circleWeight"])


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


CATALOG_BREED_NAMES = {
    "A": "Afghan Hound", "AH": "Afghan Hound", "AZ": "Azawakh",
    "BA": "Basenji", "B": "Borzoi", "BZ": "Borzoi", "C": "Cirneco dell'Etna",
    "CE": "Cirneco dell'Etna", "G": "Greyhound", "GH": "Greyhound",
    "IB": "Ibizan Hound", "IG": "Italian Greyhound", "IW": "Irish Wolfhound",
    "N": "Norrbottenspets", "NBS": "Norrbottenspets", "HW": "Hortaya Borzaya", "P": "Pharaoh Hound", "PH": "Pharaoh Hound",
    "PIO": "Peruvian Inca Orchid", "PP": "Portuguese Podengo Pequeno",
    "PPP": "Portuguese Podengo Pequeno", "RR": "Rhodesian Ridgeback",
    "S": "Saluki", "SA": "Saluki", "SD": "Scottish Deerhound",
    "DH": "Scottish Deerhound", "DEERHOUND": "Scottish Deerhound", "SCOTTISHDEERHOUND": "Scottish Deerhound", "SCOTTISHDEERHOUNDS": "Scottish Deerhound", "SL": "Sloughi", "SW": "Silken Windhound",
    "TR": "Thai Ridgeback", "W": "Whippet", "WH": "Whippet",
    "CH": "Chart Polski", "GA": "Galgo Espanol", "MA": "Magyar Agar",
    "POD": "Portuguese Podengo", "SINGLES": "Singles",
    "LCI SMALL": "LCI Small", "LCI LARGE": "LCI Large",
    "LCI SIGHTHOUND MIX": "LCI Sighthound Mix", "BIF": "Best in Field",
}
CATALOG_STAKE_ORDER = {
    "OPEN": 1, "FIELDCHAMPION": 2, "FCH": 2, "SPECIAL": 2,
    "EXCELLENT": 2, "VETERAN": 3, "PROVISIONAL": 4, "SINGLES": 5, "BIF": 6,
}
CATALOG_OUTCOME_LABELS = {
    "ABSENT": "Absent", "SCRATCH": "Scratch", "SCRATCHED": "Scratch",
    "LAME": "Lame", "INSEASON": "In season", "BREEDDQ": "Breed DQ",
    "EXCUSED": "Excused", "DISMISSED": "Dismissed", "DQ": "Disqualified",
    "DISQUALIFIED": "Disqualified", "FORFEIT": "Forfeit", "FOR": "Forfeit",
    "PULL": "Pulled", "PUL": "Pulled", "NOSCORE": "No score", "NS": "No score",
}


def catalog_clean_text(value: object) -> str:
    text = str(value or "").strip()
    replacements = {
        "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
        "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u00a0": " ",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).encode("latin-1", "replace").decode("latin-1")


def catalog_breed_label(value: object) -> str:
    text = catalog_clean_text(value)
    normalized = clean_text(text)
    if normalized.startswith("LCI"):
        if "SMALL" in normalized:
            return "LCI Small"
        if "LARGE" in normalized:
            return "LCI Large"
        return "LCI Sighthound Mix"
    return CATALOG_BREED_NAMES.get(normalized, text or "Unknown Breed")


def catalog_stake_label(value: object) -> str:
    text = catalog_clean_text(value) or "Open"
    normalized = clean_text(text)
    return {
        "FCH": "Field Champion", "FIELDCHAMPION": "Field Champion",
        "SPECIALS": "Special", "SPECIAL": "Special",
    }.get(normalized, text)


def catalog_trial_date(value: object, include_year: bool = True) -> str:
    text = catalog_clean_text(value)
    try:
        date = datetime.fromisoformat(text[:10])
    except (TypeError, ValueError):
        return text or "Date not set"
    if os.name == "nt":
        return date.strftime("%a %b %#d, %Y" if include_year else "%a %#m/%#d")
    return date.strftime("%a %b %-d, %Y" if include_year else "%a %-m/%-d")


def catalog_trial_label(trial: dict) -> str:
    date_text = catalog_trial_date(trial.get("startsOn") or trial.get("endsOn"), include_year=False)
    association = catalog_clean_text(trial.get("association") or "ASFA").upper()
    return f"{date_text} {association}".strip()


def catalog_hound_identity(source: dict) -> str:
    for key in ("registrationNumber", "alternateRegistrationNumber", "houndId", "id"):
        value = clean_text(source.get(key))
        if value:
            return f"REG:{value}"
    return "NAME:" + "|".join((
        clean_text(source.get("registeredName")), clean_text(source.get("callName")), clean_text(source.get("breed")),
    ))


def catalog_group_key(entry: dict) -> tuple[str, str]:
    return catalog_breed_label(run_group_breed_for_entry(entry)), catalog_stake_label(run_group_stake_for_entry(entry))


def catalog_group_sort_key(item: tuple[tuple[str, str], object]) -> tuple:
    (breed, stake), _value = item
    return breed.upper(), CATALOG_STAKE_ORDER.get(clean_text(stake), 99), stake.upper()


def catalog_wrap_lines(text: object, font_name: str, font_size: float, max_width: float) -> list[str]:
    value = catalog_clean_text(text)
    if not value:
        return []
    lines: list[str] = []
    current = ""
    for word in value.split():
        candidate = f"{current} {word}".strip()
        if not current or pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


class CatalogPdfCanvas:
    def __init__(self, title: str, trials: list[dict]):
        self.buffer = io.BytesIO()
        self.pdf = canvas.Canvas(self.buffer, pagesize=letter)
        self.pdf.setTitle(title)
        self.title = title
        self.trials = trials
        self.page_number = 0
        self.y = 0.0
        self.section = ""
        self.new_page()

    def new_page(self) -> None:
        if self.page_number:
            self.draw_footer()
            self.pdf.showPage()
        self.page_number += 1
        self.pdf.setFillColorRGB(0.02, 0.29, 0.30)
        self.pdf.rect(0, 760, letter[0], 32, stroke=0, fill=1)
        self.pdf.setFillColorRGB(1, 1, 1)
        self.pdf.setFont("Helvetica-Bold", 15)
        self.pdf.drawString(36, 772, self.title)
        self.pdf.setFillColorRGB(0.12, 0.12, 0.12)
        trial_dates = [catalog_trial_date(trial.get("startsOn") or trial.get("endsOn"), include_year=False) for trial in self.trials]
        associations = sorted({catalog_clean_text(trial.get("association") or "ASFA").upper() for trial in self.trials})
        self.pdf.setFont("Helvetica", 8)
        subtitle = f"{len(self.trials)} selected trial{'s' if len(self.trials) != 1 else ''} | {', '.join(associations)} | {', '.join(trial_dates)}"
        self.pdf.drawString(36, 746, safe_text(subtitle, 120))
        self.pdf.setStrokeColorRGB(0.78, 0.58, 0.12)
        self.pdf.setLineWidth(2)
        self.pdf.line(36, 738, letter[0] - 36, 738)
        self.y = 720
        if self.section:
            self.draw_section(self.section)

    def draw_footer(self) -> None:
        self.pdf.setStrokeColorRGB(0.78, 0.82, 0.82)
        self.pdf.setLineWidth(0.5)
        self.pdf.line(36, 34, letter[0] - 36, 34)
        self.pdf.setFillColorRGB(0.35, 0.38, 0.38)
        self.pdf.setFont("Helvetica", 7.5)
        clubs = ", ".join(dict.fromkeys(catalog_clean_text(trial.get("clubName")) for trial in self.trials if trial.get("clubName")))
        self.pdf.drawString(36, 22, safe_text(clubs or "Field Trial Secretary", 85))
        self.pdf.drawRightString(letter[0] - 36, 22, f"Page {self.page_number}")

    def ensure(self, height: float) -> None:
        if self.y - height < 45:
            self.new_page()

    def draw_section(self, label: str) -> None:
        self.section = label
        self.ensure(30)
        self.pdf.setFillColorRGB(0.91, 0.95, 0.94)
        self.pdf.rect(36, self.y - 19, letter[0] - 72, 21, stroke=0, fill=1)
        self.pdf.setFillColorRGB(0.02, 0.29, 0.30)
        self.pdf.setFont("Helvetica-Bold", 10.5)
        self.pdf.drawString(43, self.y - 13, catalog_clean_text(label).upper())
        self.y -= 28

    def finish(self) -> bytes:
        self.draw_footer()
        self.pdf.save()
        return self.buffer.getvalue()


def catalog_entry_records(trials: list[dict]) -> dict[tuple[str, str], list[dict]]:
    grouped: dict[tuple[str, str], dict[str, dict]] = {}
    for trial in trials:
        trial_label = catalog_trial_label(trial)
        for entry in trial.get("entries") or []:
            source = entry_form_source(trial, entry)
            if not (source.get("callName") or source.get("registeredName") or source.get("registrationNumber")):
                continue
            group_key = catalog_group_key(entry)
            identity = catalog_hound_identity(source)
            record = grouped.setdefault(group_key, {}).setdefault(identity, {"source": dict(source), "trials": []})
            if trial_label not in record["trials"]:
                record["trials"].append(trial_label)
    return {
        group: sorted(records.values(), key=lambda record: (
            catalog_clean_text(record["source"].get("callName")).upper(),
            catalog_clean_text(record["source"].get("registeredName")).upper(),
        )) for group, records in grouped.items()
    }


def catalog_entry_lines(record: dict) -> list[tuple[str, float, str]]:
    source = record["source"]
    call_name = catalog_clean_text(source.get("callName") or source.get("registeredName") or "Unnamed hound")
    registered = catalog_clean_text(source.get("registeredName"))
    registration = catalog_clean_text(source.get("registrationNumber"))
    dob = catalog_clean_text(source.get("dob") or source.get("dateOfBirth"))
    sex = catalog_clean_text(source.get("sex"))
    headline = f'"{call_name}"'
    if registered and clean_text(registered) != clean_text(call_name):
        headline += f" ~ {registered}"
    if registration:
        headline += f" ({registration})"
    if dob:
        headline += f" {dob}"
    if sex:
        headline += f" ({sex})"
    lines: list[tuple[str, float, str]] = [("Helvetica-Bold", 9.4, headline)]
    sire = catalog_clean_text(source.get("sire"))
    dam = catalog_clean_text(source.get("dam"))
    if sire or dam:
        lines.append(("Helvetica", 8.2, " x ".join(part for part in (sire, dam) if part)))
    breeder = catalog_clean_text(source.get("breeder"))
    if breeder:
        lines.append(("Helvetica", 8.2, f"Breeder: {breeder}"))
    owner = catalog_clean_text(source.get("owner"))
    location = ", ".join(part for part in (
        catalog_clean_text(source.get("ownerCity")), catalog_clean_text(source.get("ownerState")), catalog_clean_text(source.get("ownerCountry")),
    ) if part)
    contact = " | ".join(part for part in (catalog_clean_text(source.get("ownerEmail")), catalog_clean_text(source.get("ownerPhone"))) if part)
    owner_line = f"Owner: {owner or 'Not provided'}"
    if location:
        owner_line += f" - {location}"
    if contact:
        owner_line += f" | {contact}"
    lines.append(("Helvetica", 8.2, owner_line))
    lines.append(("Helvetica-Oblique", 7.6, f"Entered: {', '.join(record['trials'])}"))
    return lines


def generate_catalog_entries_pdf(trials: list[dict]) -> bytes:
    if not trials:
        raise ValueError("Select at least one trial for Catalog Entries.")
    grouped = catalog_entry_records(trials)
    if not grouped:
        raise ValueError("The selected trials do not contain any hound entries.")
    document = CatalogPdfCanvas("LURE COURSING - CATALOG ENTRIES", trials)
    max_width = letter[0] - 86
    for (breed, stake), records in sorted(grouped.items(), key=catalog_group_sort_key):
        document.section = ""
        document.ensure(110)
        document.draw_section(f"{breed} - {stake}")
        for record in records:
            wrapped: list[tuple[str, float, str]] = []
            for font_name, font_size, line in catalog_entry_lines(record):
                wrapped.extend((font_name, font_size, wrapped_line) for wrapped_line in catalog_wrap_lines(line, font_name, font_size, max_width))
            needed = sum(11 if size >= 9 else 9.5 for _font, size, _line in wrapped) + 8
            document.ensure(needed)
            for font_name, font_size, line in wrapped:
                document.pdf.setFillColorRGB(0.08, 0.09, 0.09)
                document.pdf.setFont(font_name, font_size)
                document.pdf.drawString(43, document.y, line)
                document.y -= 11 if font_size >= 9 else 9.5
            document.pdf.setStrokeColorRGB(0.86, 0.88, 0.88)
            document.pdf.setLineWidth(0.35)
            document.pdf.line(43, document.y + 2, letter[0] - 43, document.y + 2)
            document.y -= 7
    return document.finish()


def catalog_find_entry_for_row(trial: dict, row: dict) -> dict:
    registration = clean_text(row.get("registrationNumber"))
    call_name = clean_text(row.get("callName"))
    registered_name = clean_text(row.get("registeredName"))
    for entry in trial.get("entries") or []:
        if registration and registration in {clean_text(entry.get("registrationNumber")), clean_text(entry.get("alternateRegistrationNumber"))}:
            return entry
    for entry in trial.get("entries") or []:
        if registered_name and clean_text(entry.get("registeredName")) == registered_name:
            return entry
        if call_name and clean_text(entry.get("callName")) == call_name:
            return entry
    return row


def catalog_ordinal(value: str) -> str:
    return {"1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "NBQ", "NBQ": "NBQ"}.get(value.upper(), value)


def catalog_result_text(row: dict) -> str:
    placement = catalog_clean_text(row.get("placement"))
    if placement:
        return " / ".join(catalog_ordinal(part) for part in placement.replace("/", "-").split("-") if part)
    for key in ("finalOutcome", "prelimOutcome", "rollCallStatus"):
        value = catalog_clean_text(row.get(key))
        label = CATALOG_OUTCOME_LABELS.get(clean_text(value))
        if label:
            return label
    if row.get("finalCode") or row.get("combinedScore"):
        return "No placement"
    if row.get("prelimCode") or row.get("prelimScore"):
        return "Pending finals"
    return "Pending"


def catalog_final_records(trials: list[dict]) -> tuple[dict[tuple[str, str], list[dict]], list[dict]]:
    grouped: dict[tuple[str, str], dict[str, dict]] = {}
    event_awards: list[dict] = []
    for index, trial in enumerate(trials):
        trial_key = str(trial.get("id") or f"trial-{index}")
        trial_label = catalog_trial_label(trial)
        seen_entries: set[str] = set()
        for group in record_groups_for_print(trial, sort_mode="alpha"):
            rows = asfa_record_rows(trial, group)
            if clean_text(group.get("breed")) in {"BIF", "BIE"}:
                award = clean_text(group.get("breed"))
                for row in rows:
                    if clean_text(row.get("placement")) == award:
                        event_awards.append({"trial": trial_label, "award": award, "hound": catalog_clean_text(row.get("callName"))})
                continue
            group_key = catalog_breed_label(group.get("breed")), catalog_stake_label(group.get("stake"))
            for row in rows:
                entry = catalog_find_entry_for_row(trial, row)
                source = entry_form_source(trial, entry) if entry is not row else row
                identity = catalog_hound_identity(source)
                seen_entries.add(identity)
                record = grouped.setdefault(group_key, {}).setdefault(identity, {"source": dict(source), "results": {}})
                record["results"][trial_key] = catalog_result_text(row)
        for entry in trial.get("entries") or []:
            source = entry_form_source(trial, entry)
            identity = catalog_hound_identity(source)
            if identity in seen_entries:
                continue
            record = grouped.setdefault(catalog_group_key(entry), {}).setdefault(identity, {"source": dict(source), "results": {}})
            record["results"][trial_key] = CATALOG_OUTCOME_LABELS.get(clean_text(entry.get("rollCallStatus"))) or "Pending"
    return {
        group: sorted(records.values(), key=lambda record: (
            catalog_clean_text(record["source"].get("callName")).upper(), catalog_clean_text(record["source"].get("registeredName")).upper(),
        )) for group, records in grouped.items()
    }, event_awards


def generate_catalog_final_pdf(trials: list[dict]) -> bytes:
    if not trials:
        raise ValueError("Select at least one trial for Catalog Final.")
    grouped, event_awards = catalog_final_records(trials)
    if not grouped:
        raise ValueError("The selected trials do not contain any hound entries.")
    document = CatalogPdfCanvas("LURE COURSING - CATALOG FINAL", trials)
    trial_keys = [str(trial.get("id") or f"trial-{index}") for index, trial in enumerate(trials)]
    trial_labels = [catalog_trial_label(trial) for trial in trials]
    result_x, detail_x = 43, 183
    result_width, detail_width = 128, letter[0] - 183 - 43
    for (breed, stake), records in sorted(grouped.items(), key=catalog_group_sort_key):
        document.section = ""
        document.ensure(110)
        document.draw_section(f"{breed} - {stake}")
        for record in records:
            source = record["source"]
            call_name = catalog_clean_text(source.get("callName") or source.get("registeredName") or "Unnamed hound")
            registered = catalog_clean_text(source.get("registeredName"))
            registration = catalog_clean_text(source.get("registrationNumber"))
            headline = f'"{call_name}"'
            if registered and clean_text(registered) != clean_text(call_name):
                headline += f" ~ {registered}"
            if registration:
                headline += f" ({registration})"
            headline_lines = catalog_wrap_lines(headline, "Helvetica-Bold", 9.2, detail_width)
            owner = catalog_clean_text(source.get("owner"))
            owner_lines = catalog_wrap_lines(f"Owner: {owner}", "Helvetica", 8.1, detail_width) if owner else []
            detail_lines = headline_lines + owner_lines
            result_lines = [f"{label}: {record['results'].get(key, '--')}" for key, label in zip(trial_keys, trial_labels)]
            needed = (max(len(result_lines), len(detail_lines), 1) * 10.5) + 9
            document.ensure(needed)
            y_start = document.y
            document.pdf.setFillColorRGB(0.16, 0.18, 0.18)
            document.pdf.setFont("Helvetica-Bold", 7.7)
            for line_index, line in enumerate(result_lines):
                wrapped = catalog_wrap_lines(line, "Helvetica-Bold", 7.7, result_width)
                document.pdf.drawString(result_x, y_start - (line_index * 10.5), safe_text(wrapped[0] if wrapped else line, 35))
            for line_index, line in enumerate(detail_lines):
                is_headline = line_index < len(headline_lines)
                document.pdf.setFont("Helvetica-Bold" if is_headline else "Helvetica", 9.2 if is_headline else 8.1)
                document.pdf.drawString(detail_x, y_start - (line_index * 10.5), line)
            document.y -= needed
            document.pdf.setStrokeColorRGB(0.86, 0.88, 0.88)
            document.pdf.setLineWidth(0.35)
            document.pdf.line(43, document.y + 4, letter[0] - 43, document.y + 4)
    if event_awards:
        document.section = ""
        document.draw_section("Event Awards")
        for award in event_awards:
            document.ensure(18)
            document.pdf.setFont("Helvetica-Bold", 9)
            document.pdf.setFillColorRGB(0.12, 0.12, 0.12)
            document.pdf.drawString(43, document.y, f"{award['trial']} - {award['award']}: {award['hound']}")
            document.y -= 16
    return document.finish()


def catalog_report_filename(kind: str, trials: list[dict]) -> str:
    dates = sorted(catalog_clean_text(trial.get("startsOn") or trial.get("endsOn"))[:10] for trial in trials if trial.get("startsOn") or trial.get("endsOn"))
    suffix = dates[0] if len(dates) == 1 else f"{dates[0]}-to-{dates[-1]}" if dates else datetime.now().strftime("%Y-%m-%d")
    return f"catalog-{kind}-{suffix}.pdf"


def specialty_score(trial: dict, entry: dict) -> dict:
    """Regular preliminary + final only; runoffs and BOB never contribute."""
    import math
    def number(value):
        if value is None or isinstance(value, bool) or not str(value).strip():
            return None
        try:
            result = float(value)
            return result if math.isfinite(result) else None
        except (ValueError, TypeError):
            return None
    result = {"prelim": None, "final": None, "total": None, "status": "Awaiting scores"}
    if entry.get("rollCallStatus") in {"absent", "lame", "in_season", "breed_dq", "scratched", "excused"}:
        result["status"] = str(entry["rollCallStatus"]).replace("_", " ").title()
        return result
    for group in (trial.get("preliminaryDraw") or {}).get("groups") or []:
        prelim = next((h for c in group.get("courses") or [] for h in c.get("hounds") or [] if h.get("entryId") == entry.get("id")), None)
        if prelim is None:
            continue
        final = next((h for c in (group.get("finalDraw") or {}).get("courses") or [] for h in c.get("hounds") or [] if h.get("entryId") == entry.get("id")), {})
        result["prelim"] = number(prelim.get("prelimScore"))
        result["final"] = number(final.get("finalScore"))
        outcome = prelim.get("prelimOutcome") or final.get("finalOutcome")
        if outcome:
            result["status"] = str(outcome).replace("_", " ").title()
        elif result["prelim"] is not None and result["final"] is not None:
            result["total"] = result["prelim"] + result["final"]
            result["status"] = "Complete"
        return result
    return result


def specialty_records(trial: dict, kind: str) -> list[dict]:
    flag = "additional" + kind
    partner_key = "specialty" + kind + "PartnerId"
    name_key = "specialty" + kind + "Name"
    entries = [e for e in trial.get("entries") or [] if entry_flag(e, flag)]
    by_id = {str(e.get("id")): e for e in entries}
    seen = set()
    records = []
    for entry in sorted(entries, key=lambda e: (str(e.get("callName") or "").casefold(), str(e.get("id")))):
        entry_id = str(entry.get("id"))
        if entry_id in seen:
            continue
        members = [entry]
        issue = ""
        if kind != "Bench":
            partner = by_id.get(str(entry.get(partner_key) or ""))
            same_hound = partner and ((entry.get("houndId") and entry.get("houndId") == partner.get("houndId")) or (entry.get("registrationNumber") and clean_text(entry.get("registrationNumber")) == clean_text(partner.get("registrationNumber"))))
            if partner and partner is not entry and not same_hound and str(partner.get(partner_key)) == entry_id and catalog_breed_label(partner.get("breed")) == catalog_breed_label(entry.get("breed")):
                members.append(partner)
            else:
                issue = "Needs a valid partner"
        seen.update(str(e.get("id")) for e in members)
        scores = [specialty_score(trial, e) for e in members]
        total = sum(s["total"] for s in scores) if not issue and all(s["total"] is not None for s in scores) else None
        names = list(dict.fromkeys(catalog_clean_text(e.get(name_key) or e.get("breeder" if kind == "Breeder" else "owner")) for e in members))
        records.append({"members": members, "scores": scores, "name": "; ".join(n for n in names if n), "breed": catalog_breed_label(entry.get("breed")), "total": total, "status": issue or ("Complete" if total is not None else "; ".join(dict.fromkeys(s["status"] for s in scores if s["total"] is None)))})
    for i, record in enumerate(records, 1):
        record["number"] = i
        record["rank"] = ""
    # Compete within a breed, across the regular stakes and split flights.
    for breed in {r["breed"] for r in records}:
        ranked = sorted([r for r in records if r["breed"] == breed and r["total"] is not None], key=lambda r: -r["total"])
        for record in ranked:
            position = 1 + sum(r["total"] > record["total"] for r in ranked)
            tied = sum(r["total"] == record["total"] for r in ranked) > 1
            record["rank"] = ("T" if tied else "") + str(position)
    return records


def generate_specialty_pdf(trials: list[dict], results: bool = False) -> bytes:
    if not any(entry_flag(e, "additional" + kind) for t in trials for e in t.get("entries") or [] for kind in ("Bench", "Breeder", "Kennel")):
        raise ValueError("No Bench, Breeder, or Kennel entries are selected in these trials.")
    document = CatalogPdfCanvas("SPECIALTY STAKES - " + ("RESULTS" if results else "CATALOG"), trials)
    def line(text, bold=False, size=10):
        for wrapped in catalog_wrap_lines(text, "Helvetica-Bold" if bold else "Helvetica", size, letter[0] - 86):
            document.ensure(size + 5)
            document.pdf.setFillColorRGB(0.08, 0.09, 0.09)
            document.pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            document.pdf.drawString(43, document.y, wrapped)
            document.y -= size + 4
    for trial in trials:
        document.section = ""
        document.ensure(80)
        line(catalog_clean_text(trial.get("trialName") or trial.get("clubName")) + " | " + catalog_trial_label(trial), True, 11)
        if results:
            line("Totals use preliminary and final scores only. Rankings are by breed; ties remain tied. Incomplete entries are not ranked. Rankings are provisional while scores or partners are missing.", size=8)
        for kind in ("Bench", "Breeder", "Kennel"):
            records = specialty_records(trial, kind)
            if not records:
                continue
            label = "Dual Champion" if kind == "Bench" else kind
            document.section = ""
            document.ensure(65)
            document.draw_section(label + " Stake")
            if results:
                records.sort(key=lambda r: (r["breed"], r["total"] is None, -(r["total"] or 0), r["number"]))
            for record in records:
                document.ensure(75 if results else 45)
                names = " & ".join(catalog_clean_text(e.get("callName") or e.get("registeredName") or "Unnamed hound") for e in record["members"])
                if kind == "Bench":
                    entry = record["members"][0]
                    line('"' + names + '"  ' + catalog_clean_text(entry.get("registeredName")))
                else:
                    line(f'#{record["number"]}  {names} [{record["name"] or "Name not entered"}]', True)
                if results:
                    for entry, score in zip(record["members"], record["scores"]):
                        fmt = lambda v: "--" if v is None else f"{v:g}"
                        line(f'{entry.get("callName") or "Hound"}: Prelim {fmt(score["prelim"])} + Final {fmt(score["final"])} = {fmt(score["total"])}', size=9)
                    total = "--" if record["total"] is None else f'{record["total"]:g}'
                    line(f'{record["breed"]} | Rank {record["rank"] or "--"} | Total {total} | {record["status"]}', True, 9)
                elif len(record["members"]) != 2 and kind != "Bench":
                    line(record["status"], size=8)
                document.y -= 9
    return document.finish()

def handle_catalog_report_post(handler, parsed) -> bool:
    if parsed.path not in {"/api/catalog-entries", "/api/catalog-final", "/api/specialty-catalog", "/api/specialty-results"}:
        return False
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length)
    try:
        payload = json.loads(raw.decode("utf-8"))
    except Exception:
        handler.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
        return True
    trial_ids = payload.get("trialIds")
    if isinstance(trial_ids, list):
        requested_ids = [str(value) for value in trial_ids if str(value).strip()]
        state = read_state() or {}
        data = state.get("data") if isinstance(state.get("data"), dict) else state
        available_trials = data.get("trials") if isinstance(data, dict) else []
        trials_by_id = {
            str(trial.get("id")): trial
            for trial in available_trials or []
            if isinstance(trial, dict) and trial.get("id") is not None
        }
        trials = [trials_by_id[trial_id] for trial_id in requested_ids if trial_id in trials_by_id]
        if len(trials) != len(requested_ids):
            handler.send_json({"ok": False, "error": "One or more selected trials could not be loaded from SQLite. Refresh the page and try again."}, HTTPStatus.BAD_REQUEST)
            return True
    else:
        trials = payload.get("trials")
    if not isinstance(trials, list) or not trials or not all(isinstance(trial, dict) for trial in trials):
        handler.send_json({"ok": False, "error": "Select at least one saved trial for the catalog."}, HTTPStatus.BAD_REQUEST)
        return True
    try:
        if parsed.path in {"/api/specialty-catalog", "/api/specialty-results"}:
            body = generate_specialty_pdf(trials, results=parsed.path == "/api/specialty-results")
            filename = catalog_report_filename("specialty-results" if parsed.path.endswith("results") else "specialty-entries", trials)
        elif parsed.path == "/api/catalog-final":
            body = generate_catalog_final_pdf(trials)
            filename = catalog_report_filename("final", trials)
        else:
            body = generate_catalog_entries_pdf(trials)
            filename = catalog_report_filename("entries", trials)
        handler.send_pdf(body, filename)
    except Exception as exc:
        handler.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
    return True

class FieldTrialSecretaryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def log_message(self, format: str, *args) -> None:
        app_log(f"{self.client_address[0]} {format % args}")

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

    def send_zip(self, body: bytes, filename: str, archive_path: str = "") -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        if archive_path:
            self.send_header("X-Archive-Path", archive_path)
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

    def send_stored_document(self, document: dict) -> None:
        body = document.get("content") or b""
        filename = str(document.get("fileName") or "entry-document")
        mime_type = str(document.get("mimeType") or "application/octet-stream")
        safe_filename = filename.replace('"', "")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Disposition", f'inline; filename="{safe_filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if update_manager.handle_update_request(self, PROGRAM_UPDATER, STATE_WRITE_LOCK, shutdown_server):
            return
        parsed = urlparse(self.path)
        if parsed.path == "/api/undo-status":
            try:
                with STATE_WRITE_LOCK:
                    self.send_json({"ok": True, "undo": undo_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/state":
            state = read_state()
            self.send_json({"ok": True, "state": state})
            return
        if parsed.path == "/api/status":
            self.send_json({
                "ok": True,
                "dbPath": str(DB_PATH),
                "time": utc_now(),
                "appVersion": app_version_info(),
                "runtime": {
                    "root": str(ROOT),
                    "isPortableExe": bool(getattr(sys, "frozen", False)),
                    "canBuildPortable": (not getattr(sys, "frozen", False)) and (ROOT / "build_portable_package.ps1").exists(),
                },
            })
            return
        if parsed.path == "/api/version":
            self.send_json({"ok": True, "appVersion": app_version_info()})
            return
        if parsed.path == "/api/database-integrity":
            try:
                self.send_json({"ok": True, "integrity": database_integrity_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/database-backups":
            try:
                settings = read_app_settings()
                self.send_json({"ok": True, "backupDir": str(DB_BACKUP_DIR), "settings": settings, "backups": list_database_backups()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/backup-settings":
            try:
                self.send_json({"ok": True, "settings": read_app_settings()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/portable-status":
            try:
                self.send_json({"ok": True, "portable": portable_package_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
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
        if parsed.path == "/api/template-image/asfa-draw":
            try:
                body = render_template_page_png(DRAW_TEMPLATES["ASFA"], "asfa-draw")
                self.send_png(body, "asfa-draw-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/asfa-entry":
            try:
                body = render_template_half_page_png(ENTRY_FORM_TEMPLATES["ASFA"], "asfa-entry-half", DEFAULT_ASFA_ENTRY_LAYOUT["copyOffsetX"])
                self.send_png(body, "asfa-entry-form-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/akc-draw":
            try:
                body = render_template_page_png(DRAW_TEMPLATES["AKC"], "akc-draw")
                self.send_png(body, "akc-draw-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/akc-record":
            try:
                body = render_template_page_png(RECORD_TEMPLATES["AKC"], "akc-record")
                self.send_png(body, "akc-record-sheet-template.png")
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
        if parsed.path.startswith("/api/document/"):
            document_id = unquote(parsed.path.removeprefix("/api/document/"))
            document = read_entry_document(document_id)
            if not document:
                self.send_json({"ok": False, "error": "Document not found."}, HTTPStatus.NOT_FOUND)
                return
            self.send_stored_document(document)
            return
        super().do_GET()

    def do_POST(self) -> None:
        if update_manager.handle_update_request(self, PROGRAM_UPDATER, STATE_WRITE_LOCK, shutdown_server):
            return
        if PROGRAM_UPDATER.installing:
            self.send_json({"ok": False, "error": "An update is installing. Please wait for restart."}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        parsed = urlparse(self.path)
        if handle_catalog_report_post(self, parsed):
            return
        if parsed.path == "/api/build-portable":
            try:
                payload = build_portable_package()
                self.send_json({"ok": True, **payload})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/restart":
            try:
                self.send_json({"ok": True, "message": "Field Trial Secretary is restarting the app server."})
                threading.Thread(target=restart_server, args=(self.server,), daemon=False).start()
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/shutdown":
            try:
                self.send_json({"ok": True, "message": "Field Trial Secretary has saved your data and closed the app server."})
                threading.Thread(target=shutdown_server, args=(self.server,), daemon=False).start()
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/client-log":
            length = min(int(self.headers.get("Content-Length", "0")), 8192)
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                payload = {"raw": raw.decode("utf-8", errors="ignore")}
            app_log(f"CLIENT LOG: {payload}")
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/undo-last-action":
            try:
                with STATE_WRITE_LOCK:
                    self.send_json({"ok": True, **undo_last_action()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/state":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            state = payload.get("state")
            if not isinstance(state, dict):
                self.send_json({"ok": False, "error": "Payload missing state object."}, HTTPStatus.BAD_REQUEST)
                return
            write_state(state)
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/save-trial":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            save_trial_to_db(trial)
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/draw-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            layout = payload.get("layout")
            copies = int(payload.get("copies") or 1)
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_draw_sheet_pdf(trial, layout=layout, copies=copies)
                filename = f"{association.lower()}-draw-sheet.pdf"
                self.send_pdf(pdf, filename)
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path in {"/api/judge-sheet", "/api/judge-sheets"}:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            group_ids = payload.get("groupIds")
            layout = payload.get("layout")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_judge_sheets_pdf(trial, layout, group_ids if isinstance(group_ids, list) else None)
                self.send_pdf(pdf, f"{association.lower()}-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/finals-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_finals_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    payload.get("layout"),
                    payload.get("groupIds") if isinstance(payload.get("groupIds"), list) else None,
                )
                self.send_pdf(pdf, f"{association.lower()}-finals-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/runoff-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_runoff_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    str(payload.get("runoffKey") or ""),
                    payload.get("layout"),
                )
                self.send_pdf(pdf, f"{association.lower()}-runoff-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/bif-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_bif_judge_sheets_pdf(trial, payload.get("layout"))
                self.send_pdf(pdf, f"{association.lower()}-bif-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            group_id = str(payload.get("groupId") or "")
            breed = str(payload.get("breed") or "")
            layout = payload.get("layout")
            entry_layout = payload.get("entryLayout")
            lci_entry_layout = payload.get("lciEntryLayout")
            sort_mode = str(payload.get("sortMode") or "")
            include_secretary_report = bool(payload.get("includeSecretaryReport"))
            include_first_time_documents = bool(payload.get("includeFirstTimeDocuments"))
            combine_mixed_posting = bool(payload.get("combineMixedPosting"))
            include_signed_judge_sheets = bool(payload.get("includeSignedJudgeSheets"))
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    group_id=group_id,
                    breed=breed,
                    layout=layout,
                    sort_mode=sort_mode,
                    entry_layout=entry_layout,
                    lci_entry_layout=lci_entry_layout,
                    include_secretary_report=include_secretary_report,
                    include_first_time_documents=include_first_time_documents,
                    combine_mixed_posting=combine_mixed_posting,
                    include_signed_judge_sheets=include_signed_judge_sheets,
                )
                association = str(trial.get("association") or "ASFA").upper()
                self.send_pdf(pdf, f"{association.lower()}-record-sheet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-secretary-report":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            layout = payload.get("layout")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_secretary_report_pdf(trial, layout)
                self.send_pdf(pdf, f"{association.lower()}-secretary-report.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-packet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    layout=payload.get("layout"),
                    sort_mode=str(payload.get("sortMode") or "alpha"),
                    entry_layout=payload.get("entryLayout"),
                    lci_entry_layout=payload.get("lciEntryLayout"),
                    secretary_layout=payload.get("secretaryLayout"),
                    include_secretary_report=True,
                    include_first_time_documents=True,
                    include_signed_judge_sheets=True,
                )
                self.send_pdf(pdf, "asfa-record-packet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        super().do_POST()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Field Trial Secretary locally with SQLite storage.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--open-browser", action="store_true", help="Open the local app page in the default browser after startup.")
    args = parser.parse_args()

    ensure_database()
    server = ExclusiveTrialHTTPServer((args.host, args.port), FieldTrialSecretaryHandler)
    url = f"http://{args.host}:{args.port}/"
    print(f"Field Trial Secretary running at {url}")
    print(f"SQLite database: {DB_PATH}")
    print("Press Ctrl+C to stop.")
    should_open_browser = args.open_browser or (
        IS_MAC_APP and not bool(os.environ.get("CI"))
    )
    if should_open_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    server.serve_forever()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        app_log("Fatal startup error:\n" + traceback.format_exc())
        raise
def infer_asfa_lci_type(form: dict) -> str:
    for value in (form.get("lciType"), form.get("breed"), form.get("stake"), form.get("judgeBreed"), form.get("judgeStake")):
        lci_type = asfa_lci_type(clean_text(value))
        if lci_type:
            return lci_type
    for hound in form.get("hounds") or []:
        for value in (
            hound.get("breed"),
            hound.get("className"),
            hound.get("stake"),
            hound.get("entryBreed"),
            hound.get("entryClassName"),
        ):
            lci_type = asfa_lci_type(clean_text(value))
            if lci_type:
                return lci_type
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
    if normalized in {"RUNOFF", "TIE", "TIERUNOFF"}:
        return
    draw_circle(pdf, x + layout["phaseCircleX"], y_from_top(layout["phaseCircleY"] + y_adjust), layout["phaseCircleW"], layout["phaseCircleH"], layout["circleWeight"])


def draw_asfa_runoff_text(pdf: canvas.Canvas, x: float, runoff_text: object, y_adjust: float, layout: dict) -> None:
    text = str(runoff_text or "").replace(" Tie", "").replace(" Runoff", "").strip()
    if not text:
        return
    pdf.setFont("Helvetica-Bold", layout["fontSize"])
    pdf.drawString(x + layout["phaseTextX"], y_from_top(layout["phaseTextY"] + y_adjust), safe_text(text, 12))


def draw_asfa_flight_mark(pdf: canvas.Canvas, x: float, flight: object, y_adjust: float, layout: dict) -> None:
    label = str(flight or "A").strip().upper()
    index = max(0, min(9, ord(label[:1]) - ord("A"))) if label else 0
    flight_x = layout["flightCircleX"] + (index * layout.get("flightCircleStepX", 31.5))
    draw_circle(pdf, x + flight_x, y_from_top(layout["flightCircleY"] + y_adjust), layout["flightCircleW"], layout["flightCircleH"], layout["circleWeight"])


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

    def log_message(self, format: str, *args) -> None:
        app_log(f"{self.client_address[0]} {format % args}")

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

    def send_zip(self, body: bytes, filename: str, archive_path: str = "") -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        if archive_path:
            self.send_header("X-Archive-Path", archive_path)
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

    def send_stored_document(self, document: dict) -> None:
        body = document.get("content") or b""
        filename = str(document.get("fileName") or "entry-document")
        mime_type = str(document.get("mimeType") or "application/octet-stream")
        safe_filename = filename.replace('"', "")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Disposition", f'inline; filename="{safe_filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if update_manager.handle_update_request(self, PROGRAM_UPDATER, STATE_WRITE_LOCK, shutdown_server):
            return
        parsed = urlparse(self.path)
        if parsed.path == "/api/undo-status":
            try:
                with STATE_WRITE_LOCK:
                    self.send_json({"ok": True, "undo": undo_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/state":
            state = read_state()
            self.send_json({"ok": True, "state": state})
            return
        if parsed.path == "/api/status":
            self.send_json({
                "ok": True,
                "dbPath": str(DB_PATH),
                "time": utc_now(),
                "appVersion": app_version_info(),
                "runtime": {
                    "root": str(ROOT),
                    "isPortableExe": bool(getattr(sys, "frozen", False)),
                    "canBuildPortable": (not getattr(sys, "frozen", False)) and (ROOT / "build_portable_package.ps1").exists(),
                },
            })
            return
        if parsed.path == "/api/version":
            self.send_json({"ok": True, "appVersion": app_version_info()})
            return
        if parsed.path == "/api/database-integrity":
            try:
                self.send_json({"ok": True, "integrity": database_integrity_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/database-backups":
            try:
                settings = read_app_settings()
                self.send_json({"ok": True, "backupDir": str(DB_BACKUP_DIR), "settings": settings, "backups": list_database_backups()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/backup-settings":
            try:
                self.send_json({"ok": True, "settings": read_app_settings()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/portable-status":
            try:
                self.send_json({"ok": True, "portable": portable_package_status()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
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
        if parsed.path == "/api/template-image/asfa-draw":
            try:
                body = render_template_page_png(DRAW_TEMPLATES["ASFA"], "asfa-draw")
                self.send_png(body, "asfa-draw-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/asfa-entry":
            try:
                body = render_template_half_page_png(ENTRY_FORM_TEMPLATES["ASFA"], "asfa-entry-half", DEFAULT_ASFA_ENTRY_LAYOUT["copyOffsetX"])
                self.send_png(body, "asfa-entry-form-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/akc-draw":
            try:
                body = render_template_page_png(DRAW_TEMPLATES["AKC"], "akc-draw")
                self.send_png(body, "akc-draw-sheet-template.png")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/template-image/akc-record":
            try:
                body = render_template_page_png(RECORD_TEMPLATES["AKC"], "akc-record")
                self.send_png(body, "akc-record-sheet-template.png")
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
        if parsed.path.startswith("/api/document/"):
            document_id = unquote(parsed.path.removeprefix("/api/document/"))
            document = read_entry_document(document_id)
            if not document:
                self.send_json({"ok": False, "error": "Document not found."}, HTTPStatus.NOT_FOUND)
                return
            self.send_stored_document(document)
            return
        super().do_GET()

    def do_POST(self) -> None:
        if update_manager.handle_update_request(self, PROGRAM_UPDATER, STATE_WRITE_LOCK, shutdown_server):
            return
        if PROGRAM_UPDATER.installing:
            self.send_json({"ok": False, "error": "An update is installing. Please wait for restart."}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        parsed = urlparse(self.path)
        if handle_catalog_report_post(self, parsed):
            return
        if parsed.path == "/api/build-portable":
            try:
                payload = build_portable_package()
                self.send_json({"ok": True, **payload})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/restart":
            try:
                self.send_json({"ok": True, "message": "Field Trial Secretary is restarting the app server."})
                threading.Thread(target=restart_server, args=(self.server,), daemon=False).start()
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/shutdown":
            try:
                self.send_json({"ok": True, "message": "Field Trial Secretary has saved your data and closed the app server."})
                threading.Thread(target=shutdown_server, args=(self.server,), daemon=False).start()
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if parsed.path == "/api/client-log":
            length = min(int(self.headers.get("Content-Length", "0")), 8192)
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                payload = {"raw": raw.decode("utf-8", errors="ignore")}
            app_log(f"CLIENT LOG: {payload}")
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/undo-last-action":
            try:
                with STATE_WRITE_LOCK:
                    self.send_json({"ok": True, **undo_last_action()})
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/state":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            state = payload.get("state")
            if not isinstance(state, dict):
                self.send_json({"ok": False, "error": "Payload missing state object."}, HTTPStatus.BAD_REQUEST)
                return
            write_state(state)
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/save-trial":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            save_trial_to_db(trial)
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/draw-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            layout = payload.get("layout")
            copies = int(payload.get("copies") or 1)
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_draw_sheet_pdf(trial, layout=layout, copies=copies)
                filename = f"{association.lower()}-draw-sheet.pdf"
                self.send_pdf(pdf, filename)
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path in {"/api/judge-sheet", "/api/judge-sheets"}:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            group_ids = payload.get("groupIds")
            layout = payload.get("layout")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_judge_sheets_pdf(trial, layout, group_ids if isinstance(group_ids, list) else None)
                self.send_pdf(pdf, f"{association.lower()}-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/finals-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_finals_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    payload.get("layout"),
                    payload.get("groupIds") if isinstance(payload.get("groupIds"), list) else None,
                )
                self.send_pdf(pdf, f"{association.lower()}-finals-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/runoff-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_runoff_judge_sheets_pdf(
                    trial,
                    str(payload.get("groupId") or ""),
                    str(payload.get("runoffKey") or ""),
                    payload.get("layout"),
                )
                self.send_pdf(pdf, f"{association.lower()}-runoff-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/bif-judge-sheets":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_bif_judge_sheets_pdf(trial, payload.get("layout"))
                self.send_pdf(pdf, f"{association.lower()}-bif-judge-sheets.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-sheet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            group_id = str(payload.get("groupId") or "")
            breed = str(payload.get("breed") or "")
            layout = payload.get("layout")
            entry_layout = payload.get("entryLayout")
            lci_entry_layout = payload.get("lciEntryLayout")
            sort_mode = str(payload.get("sortMode") or "")
            include_secretary_report = bool(payload.get("includeSecretaryReport"))
            include_first_time_documents = bool(payload.get("includeFirstTimeDocuments"))
            combine_mixed_posting = bool(payload.get("combineMixedPosting"))
            include_signed_judge_sheets = bool(payload.get("includeSignedJudgeSheets"))
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    group_id=group_id,
                    breed=breed,
                    layout=layout,
                    sort_mode=sort_mode,
                    entry_layout=entry_layout,
                    lci_entry_layout=lci_entry_layout,
                    include_secretary_report=include_secretary_report,
                    include_first_time_documents=include_first_time_documents,
                    combine_mixed_posting=combine_mixed_posting,
                    include_signed_judge_sheets=include_signed_judge_sheets,
                )
                association = str(trial.get("association") or "ASFA").upper()
                self.send_pdf(pdf, f"{association.lower()}-record-sheet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-secretary-report":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            layout = payload.get("layout")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                association = str(trial.get("association") or "ASFA").upper()
                pdf = generate_secretary_report_pdf(trial, layout)
                self.send_pdf(pdf, f"{association.lower()}-secretary-report.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        if parsed.path == "/api/asfa-record-packet":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8"))
            except Exception:
                self.send_json({"ok": False, "error": "Invalid JSON payload."}, HTTPStatus.BAD_REQUEST)
                return
            trial = payload.get("trial")
            if not isinstance(trial, dict):
                self.send_json({"ok": False, "error": "Payload missing trial object."}, HTTPStatus.BAD_REQUEST)
                return
            try:
                pdf = generate_asfa_record_sheet_pdf(
                    trial,
                    layout=payload.get("layout"),
                    sort_mode=str(payload.get("sortMode") or "alpha"),
                    entry_layout=payload.get("entryLayout"),
                    lci_entry_layout=payload.get("lciEntryLayout"),
                    secretary_layout=payload.get("secretaryLayout"),
                    include_secretary_report=True,
                    include_first_time_documents=True,
                    include_signed_judge_sheets=True,
                )
                self.send_pdf(pdf, "asfa-record-packet.pdf")
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        super().do_POST()
