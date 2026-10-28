"""Clinical biomarker and lab measurement extractor."""

import re
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

CANONICAL_TEST_KEYS: dict[str, dict[str, Any]] = {
    "fasting_glucose": {
        "display_name": "Fasting Glucose",
        "patterns": [
            r"\b(?:fasting\s+)?glucose\b",
            r"\bfasting\s+blood\s+sugar\b",
            r"\bfbs\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("70.0"),
        "standard_high": Decimal("99.0"),
    },
    "total_cholesterol": {
        "display_name": "Total Cholesterol",
        "patterns": [
            r"\btotal\s+cholesterol\b",
            r"\bcholesterol,\s+total\b",
            r"\bcholesterol\s+total\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("100.0"),
        "standard_high": Decimal("199.0"),
    },
    "hdl_cholesterol": {
        "display_name": "HDL Cholesterol",
        "patterns": [
            r"\bhdl\s+cholesterol\b",
            r"\bhdl-c\b",
            r"\bhigh\s+density\s+lipoprotein\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("40.0"),
        "standard_high": Decimal("60.0"),
    },
    "ldl_cholesterol": {
        "display_name": "LDL Cholesterol",
        "patterns": [
            r"\bldl\s+cholesterol\b",
            r"\bldl-c\b",
            r"\blow\s+density\s+lipoprotein\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("0.0"),
        "standard_high": Decimal("99.0"),
    },
    "triglycerides": {
        "display_name": "Triglycerides",
        "patterns": [
            r"\btriglycerides?\b",
            r"\btrig\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("0.0"),
        "standard_high": Decimal("149.0"),
    },
    "hemoglobin_a1c": {
        "display_name": "Hemoglobin A1c",
        "patterns": [
            r"\bhemoglobin\s+a1c\b",
            r"\bhba1c\b",
            r"\bglycated\s+hemoglobin\b",
            r"\ba1c\b",
        ],
        "default_unit": "%",
        "standard_low": Decimal("4.0"),
        "standard_high": Decimal("5.6"),
    },
    "tsh": {
        "display_name": "Thyroid Stimulating Hormone (TSH)",
        "patterns": [
            r"\btsh\b",
            r"\bthyroid\s+stimulating\s+hormone\b",
            r"\bthyrotropin\b",
        ],
        "default_unit": "uIU/mL",
        "standard_low": Decimal("0.45"),
        "standard_high": Decimal("4.50"),
    },
    "creatinine": {
        "display_name": "Serum Creatinine",
        "patterns": [
            r"\bserum\s+creatinine\b",
            r"\bcreatinine\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("0.60"),
        "standard_high": Decimal("1.20"),
    },
    "bun": {
        "display_name": "Blood Urea Nitrogen (BUN)",
        "patterns": [
            r"\bbun\b",
            r"\bblood\s+urea\s+nitrogen\b",
            r"\burea\s+nitrogen\b",
        ],
        "default_unit": "mg/dL",
        "standard_low": Decimal("7.0"),
        "standard_high": Decimal("20.0"),
    },
    "alt": {
        "display_name": "Alanine Aminotransferase (ALT)",
        "patterns": [
            r"\balt\b",
            r"\bsgpt\b",
            r"\balanine\s+aminotransferase\b",
        ],
        "default_unit": "U/L",
        "standard_low": Decimal("7.0"),
        "standard_high": Decimal("56.0"),
    },
    "ast": {
        "display_name": "Aspartate Aminotransferase (AST)",
        "patterns": [
            r"\bast\b",
            r"\bsgot\b",
            r"\baspartate\s+aminotransferase\b",
        ],
        "default_unit": "U/L",
        "standard_low": Decimal("10.0"),
        "standard_high": Decimal("40.0"),
    },
    "hemoglobin": {
        "display_name": "Hemoglobin",
        "patterns": [
            r"\bhemoglobin\b",
            r"\bhgb\b",
        ],
        "default_unit": "g/dL",
        "standard_low": Decimal("12.0"),
        "standard_high": Decimal("17.5"),
    },
    "white_blood_cells": {
        "display_name": "White Blood Cell Count (WBC)",
        "patterns": [
            r"\bwhite\s+blood\s+cells?\b",
            r"\bwbc\b",
            r"\bleukocytes\b",
        ],
        "default_unit": "10^3/uL",
        "standard_low": Decimal("4.5"),
        "standard_high": Decimal("11.0"),
    },
    "platelets": {
        "display_name": "Platelet Count",
        "patterns": [
            r"\bplatelets?\b",
            r"\bplt\b",
            r"\bthrombocytes\b",
        ],
        "default_unit": "10^3/uL",
        "standard_low": Decimal("150.0"),
        "standard_high": Decimal("450.0"),
    },
    "potassium": {
        "display_name": "Potassium",
        "patterns": [
            r"\bpotassium\b",
            r"\bk\b",
        ],
        "default_unit": "mmol/L",
        "standard_low": Decimal("3.5"),
        "standard_high": Decimal("5.2"),
    },
    "sodium": {
        "display_name": "Sodium",
        "patterns": [
            r"\bsodium\b",
            r"\bna\b",
        ],
        "default_unit": "mmol/L",
        "standard_low": Decimal("135.0"),
        "standard_high": Decimal("145.0"),
    },
}


@dataclass
class ExtractedMeasurement:
    test_name: str
    normalized_test_key: str | None
    value_numeric: Decimal | None
    value_text: str | None
    unit: str | None
    reference_low: Decimal | None
    reference_high: Decimal | None
    measured_on: date | None
    confidence: Decimal
    source_location: str | None
    flag: str | None  # 'normal', 'high', 'low', 'abnormal'


def normalize_analyte_name(raw_name: str) -> tuple[str | None, str]:
    """Match a raw test name against recognized canonical analytes."""
    cleaned = raw_name.strip().lower()
    for key, config in CANONICAL_TEST_KEYS.items():
        for pattern in config["patterns"]:
            if re.search(pattern, cleaned, re.IGNORECASE):
                return key, config["display_name"]
    return None, raw_name.strip()


def calculate_flag(
    value_numeric: Decimal | None,
    ref_low: Decimal | None,
    ref_high: Decimal | None,
) -> str | None:
    """Determine clinical flag based on reference boundaries."""
    if value_numeric is None:
        return None
    if ref_low is not None and value_numeric < ref_low:
        return "low"
    if ref_high is not None and value_numeric > ref_high:
        return "high"
    if ref_low is not None or ref_high is not None:
        return "normal"
    return None


def parse_measurements_from_text(
    text: str,
    default_date: date | None = None,
) -> list[ExtractedMeasurement]:
    """Parse structured medical measurements from OCR or extracted document text."""
    measurements: list[ExtractedMeasurement] = []
    seen_keys: set[str] = set()

    if not text:
        return measurements

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Pattern for line containing test name, value, unit, and reference range
    # e.g.: "Fasting Blood Glucose: 92 mg/dL (Reference: 70 - 99)"
    # or:   "Total Cholesterol     185    mg/dL     100-199"
    # or:   "TSH                   2.14   uIU/mL    0.45 - 4.50"
    for line_idx, line in enumerate(lines):
        for key, config in CANONICAL_TEST_KEYS.items():
            if key in seen_keys:
                continue

            matched = False
            for pat in config["patterns"]:
                match = re.search(pat, line, re.IGNORECASE)
                if match:
                    matched = True
                    break

            if not matched:
                continue

            # Extract numeric value and unit around the match
            # Match formats like: "92 mg/dL", "185 mg/dL", "4.5 %", "2.14 uIU/mL"
            val_pattern = r"(?::\s*|\s+)([<>]?\s*\d+(?:\.\d+)?)\s*([a-zA-Z%/\^0-9]+)?"
            val_match = re.search(val_pattern, line[match.end():])

            if not val_match:
                # Check next line in case of column-split tables
                if line_idx + 1 < len(lines):
                    next_line = lines[line_idx + 1]
                    val_match = re.search(r"^\s*([<>]?\s*\d+(?:\.\d+)?)\s*([a-zA-Z%/\^0-9]+)?", next_line)

            if val_match:
                raw_val = val_match.group(1).replace(" ", "").strip()
                unit = val_match.group(2) or config["default_unit"]

                numeric_val: Decimal | None = None
                text_val: str | None = None

                try:
                    cleaned_num = re.sub(r"^[<>]", "", raw_val)
                    numeric_val = Decimal(cleaned_num)
                    if raw_val.startswith(("<", ">")):
                        text_val = raw_val
                except (InvalidOperation, ValueError):
                    text_val = raw_val

                # Reference range extraction from line: e.g. "70 - 99", "70-99", "< 200"
                ref_low: Decimal | None = None
                ref_high: Decimal | None = None

                ref_match = re.search(r"(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)", line)
                if ref_match:
                    try:
                        ref_low = Decimal(ref_match.group(1))
                        ref_high = Decimal(ref_match.group(2))
                    except (InvalidOperation, ValueError):
                        pass
                else:
                    ref_low = config.get("standard_low")
                    ref_high = config.get("standard_high")

                flag = calculate_flag(numeric_val, ref_low, ref_high)

                measurements.append(
                    ExtractedMeasurement(
                        test_name=config["display_name"],
                        normalized_test_key=key,
                        value_numeric=numeric_val,
                        value_text=text_val,
                        unit=unit,
                        reference_low=ref_low,
                        reference_high=ref_high,
                        measured_on=default_date,
                        confidence=Decimal("0.9500"),
                        source_location=f"line_{line_idx + 1}",
                        flag=flag,
                    )
                )
                seen_keys.add(key)

    return measurements
