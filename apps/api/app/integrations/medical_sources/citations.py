"""Trusted medical reference sources and citation metadata."""

from typing import Any

TRUSTED_MEDICAL_SOURCES = {
    "cmp": {
        "title": "Comprehensive Metabolic Panel (CMP)",
        "source": "MedlinePlus (National Library of Medicine)",
        "url": "https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/",
    },
    "cbc": {
        "title": "Complete Blood Count (CBC)",
        "source": "MedlinePlus",
        "url": "https://medlineplus.gov/lab-tests/complete-blood-count/",
    },
    "lipid": {
        "title": "Lipid Panel & Cholesterol Tests",
        "source": "American Heart Association",
        "url": "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol/how-to-get-your-cholesterol-tested",
    },
    "glucose": {
        "title": "Blood Glucose & HbA1c Tests",
        "source": "American Diabetes Association",
        "url": "https://diabetes.org/about-diabetes/diagnosis",
    },
    "tsh": {
        "title": "Thyroid Function Tests (TSH)",
        "source": "American Thyroid Association",
        "url": "https://www.thyroid.org/thyroid-function-tests/",
    },
    "general": {
        "title": "Understanding Your Medical Lab Test Results",
        "source": "MedlinePlus",
        "url": "https://medlineplus.gov/lab-tests/",
    },
}


def get_relevant_citations(text: str) -> list[dict[str, Any]]:
    """Match document keywords with authoritative medical citations."""
    lower_text = text.lower()
    citations = []

    if any(
        k in lower_text
        for k in ("metabolic", "cmp", "bun", "creatinine", "alt", "ast", "bilirubin")
    ):
        citations.append(TRUSTED_MEDICAL_SOURCES["cmp"])

    if any(
        k in lower_text
        for k in ("cbc", "hemoglobin", "platelet", "white blood", "hematocrit")
    ):
        citations.append(TRUSTED_MEDICAL_SOURCES["cbc"])

    if any(
        k in lower_text for k in ("cholesterol", "lipid", "triglyceride", "hdl", "ldl")
    ):
        citations.append(TRUSTED_MEDICAL_SOURCES["lipid"])

    if any(k in lower_text for k in ("glucose", "a1c", "hba1c", "fasting sugar")):
        citations.append(TRUSTED_MEDICAL_SOURCES["glucose"])

    if any(k in lower_text for k in ("tsh", "thyroid", "thyroxine", "t3", "t4")):
        citations.append(TRUSTED_MEDICAL_SOURCES["tsh"])

    if not citations:
        citations.append(TRUSTED_MEDICAL_SOURCES["general"])

    return citations
