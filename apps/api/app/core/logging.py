"""Structured JSON logging with PHI and secret redaction."""

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

# Keys containing sensitive data that must be redacted
SENSITIVE_KEYS = {
    "password",
    "token",
    "authorization",
    "secret",
    "cookie",
    "extracted_text",
    "summary_text",
    "prompt",
    "api_key",
    "signed_url",
    "upload_url",
    "download_url",
}


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redact sensitive keys from dictionary payloads."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data


class JSONFormatter(logging.Formatter):
    """Formats log records as JSON lines."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include request_id and extra fields if available
        if hasattr(record, "request_id"):
            log_entry["requestId"] = record.request_id
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_entry["meta"] = redact_sensitive_data(record.extra_data)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging(log_level: str = "INFO") -> None:
    """Configure root logger with JSON output."""
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    # Remove existing handlers
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)


logger = logging.getLogger("medlab")


def get_logger(name: str = "medlab") -> logging.Logger:
    """Return a logger instance for the given namespace."""
    return logging.getLogger(name)
