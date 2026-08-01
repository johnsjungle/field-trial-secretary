from __future__ import annotations

import io
import re
from typing import Any

import pdfplumber


EXPECTED_COLUMNS = [
    "Judge's Name",
    "Orig Lic",
    "License",
    "Street",
    "City",
    "ST",
    "Zip",
    "Telephone",
    "Email Address",
    "Region",
    "Lure Oper",
    "Travel",
]


def _clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ")).strip(" ,")


def _canonical_name(official_name: str) -> str:
    without_notes = re.sub(r"\s+\*+$", "", _clean(official_name)).strip()
    if "," not in without_notes:
        return without_notes
    last_name, given_names = without_notes.split(",", 1)
    return f"{given_names.strip()} {last_name.strip()}".strip()


def _contact_values(value: Any, *, email: bool = False) -> list[str]:
    raw = str(value or "").replace("\r", "\n")
    parts = re.split(r"\n+|\s*,\s*(?=\S)", raw)
    result: list[str] = []
    for part in parts:
        cleaned = re.sub(r"\s*\[c\]\s*", "", part, flags=re.IGNORECASE).strip(" ,")
        if not cleaned:
            continue
        if email:
            cleaned = cleaned.replace(" ", "")
        if cleaned not in result:
            result.append(cleaned)
    return result


def _yes_no_status(value: Any) -> str:
    cleaned = _clean(value)
    return "No" if cleaned in {"", "0", "No"} else cleaned


def _license_type(raw_license: str) -> str:
    value = raw_license.lower()
    if raw_license == "AB":
        return "All-Breed"
    if "appren" in value:
        return "Apprentice"
    if "prov" in value:
        return "Provisional"
    return raw_license or "Not listed"


def parse_asfa_judge_directory(pdf_bytes: bytes, source_name: str = "ASFA Judge Directory") -> dict[str, Any]:
    if not pdf_bytes.startswith(b"%PDF"):
        raise ValueError("The selected file is not a PDF.")

    judges: list[dict[str, Any]] = []
    as_of = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as document:
        for page in document.pages:
            page_text = page.extract_text() or ""
            if not as_of:
                match = re.search(r"AS OF\s+([0-9]{1,2}/[0-9]{2,4})", page_text, re.IGNORECASE)
                if match:
                    as_of = match.group(1)

            for table in page.extract_tables() or []:
                if not table:
                    continue
                header = [_clean(cell) for cell in table[0]]
                if len(header) != len(EXPECTED_COLUMNS) or "Judge's Name" not in header[0]:
                    continue
                for row in table[1:]:
                    cells = list(row or []) + [""] * len(EXPECTED_COLUMNS)
                    official_name = _clean(cells[0])
                    if not official_name:
                        continue
                    phones = _contact_values(cells[7])
                    emails = _contact_values(cells[8], email=True)
                    raw_license = _clean(cells[2])
                    state = _clean(cells[5])
                    judges.append({
                        "name": _canonical_name(official_name),
                        "officialName": official_name,
                        "originalLicenseYear": _clean(cells[1]),
                        "license": raw_license,
                        "licenseType": _license_type(raw_license),
                        "address": _clean(cells[3]),
                        "city": _clean(cells[4]),
                        "state": state,
                        "postalCode": _clean(cells[6]),
                        "country": "Canada" if state == "CN" else "United States",
                        "phone": phones[0] if phones else "",
                        "phones": phones,
                        "email": emails[0] if emails else "",
                        "emails": emails,
                        "region": _clean(cells[9]),
                        "lureOperator": _yes_no_status(cells[10]),
                        "travel": _yes_no_status(cells[11]),
                        "association": "ASFA",
                        "officialDirectory": True,
                        "sourceName": source_name,
                        "sourceAsOf": as_of,
                    })

    if not judges:
        raise ValueError("No ASFA judge rows were found in this PDF.")
    return {"association": "ASFA", "sourceName": source_name, "asOf": as_of, "judges": judges}