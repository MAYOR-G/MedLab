"""PDF text extraction adapter using pypdf."""

import io
import re
from decimal import Decimal

from pypdf import PdfReader

from app.core.logging import get_logger

logger = get_logger("processing.extractors.pdf")


class PDFExtractionResult:
    def __init__(self, text: str, page_count: int, confidence: Decimal, method: str):
        self.text = text
        self.page_count = page_count
        self.confidence = confidence
        self.method = method


def extract_pdf_text(file_bytes: bytes) -> PDFExtractionResult:
    """Extract machine-readable text from PDF bytes.

    Calculates heuristic extraction confidence score based on character density and page yield.
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    page_count = len(reader.pages)
    if page_count == 0:
        return PDFExtractionResult(
            text="", page_count=0, confidence=Decimal("0.0"), method="pypdf_empty"
        )

    extracted_pages: list[str] = []
    total_characters = 0

    for idx, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
            # Clean excessive consecutive newlines / control characters
            cleaned_text = re.sub(r"\n{3,}", "\n\n", page_text.strip())
            if cleaned_text:
                extracted_pages.append(f"--- [Page {idx + 1}] ---\n{cleaned_text}")
                total_characters += len(cleaned_text)
        except Exception as e:
            logger.warning("Error extracting text from PDF page %d: %s", idx + 1, e)

    full_text = "\n\n".join(extracted_pages).strip()

    # Calculate confidence: Average characters per page
    if total_characters == 0:
        # Scanned PDF without text layer (needs OCR)
        return PDFExtractionResult(
            text="[Scanned document: No embedded text layer detected. OCR required.]",
            page_count=page_count,
            confidence=Decimal("0.20"),
            method="pypdf_text_layer_missing",
        )

    avg_chars_per_page = total_characters / page_count
    # High confidence if > 150 chars per page on average
    if avg_chars_per_page > 150:
        confidence = Decimal("0.95")
    elif avg_chars_per_page > 50:
        confidence = Decimal("0.80")
    else:
        confidence = Decimal("0.50")

    return PDFExtractionResult(
        text=full_text,
        page_count=page_count,
        confidence=confidence,
        method="pypdf_text_layer",
    )
