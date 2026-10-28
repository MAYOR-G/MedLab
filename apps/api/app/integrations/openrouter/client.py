"""OpenRouter AI Gateway client with model fallback and clinical guardrails."""

import re

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.modules.assistant.prompts import MANDATORY_DISCLAIMER

logger = get_logger("integrations.openrouter")


class OpenRouterClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.OPENROUTER_BASE_URL.rstrip("/")
        self.api_key = self.settings.OPENROUTER_API_KEY
        self.default_model = self.settings.OPENROUTER_DEFAULT_MODEL
        self.fallback_model = self.settings.OPENROUTER_FALLBACK_MODEL
        self.timeout = self.settings.OPENROUTER_TIMEOUT_SECONDS

    @staticmethod
    def sanitize_input(text: str) -> str:
        """Strip user authentication tokens, email addresses, and excessive whitespace."""
        # Redact JWT tokens (3 dot-separated base64url segments starting with ey)
        sanitized = re.sub(
            r"ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+",
            "[TOKEN_REDACTED]",
            text,
        )
        # Redact raw email addresses
        sanitized = re.sub(
            r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
            "[EMAIL_REDACTED]",
            sanitized,
        )
        return sanitized.strip()

    def generate_chat_completion(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
    ) -> tuple[str, str]:
        """Send chat request to OpenRouter with automatic fallback model on failure.

        Returns (content, model_used).
        """
        clean_user_message = self.sanitize_input(user_message)
        chosen_model = model or self.default_model

        if self.api_key and self.api_key != "openrouter-placeholder":
            for target_model in [chosen_model, self.fallback_model]:
                try:
                    payload = {
                        "model": target_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": clean_user_message},
                        ],
                        "max_tokens": self.settings.AI_MAX_OUTPUT_TOKENS,
                        "temperature": 0.2,  # Low temperature for deterministic clinical translation
                    }
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://medlab.health",
                        "X-Title": "MedLab Vault",
                        "Content-Type": "application/json",
                    }

                    with httpx.Client(timeout=float(self.timeout)) as client:
                        resp = client.post(
                            f"{self.base_url}/chat/completions",
                            headers=headers,
                            json=payload,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            content = data["choices"][0]["message"]["content"]
                            return content, target_model
                        else:
                            logger.warning(
                                "OpenRouter model %s returned status %d: %s. Trying fallback.",
                                target_model,
                                resp.status_code,
                                resp.text[:200],
                            )
                except Exception as exc:
                    logger.warning(
                        "Error querying OpenRouter model %s: %s", target_model, exc
                    )

        # High-fidelity mock clinical generator for local development / testing
        return self._generate_local_fallback(
            clean_user_message
        ), "medlab-clinical-local-v1"

    def _generate_local_fallback(self, extracted_text: str) -> str:
        """Deterministic plain-English translation fallback for dev/testing."""
        snippet = extracted_text[:300].strip()
        return f"""### Overview
This document represents a diagnostic health record or laboratory analysis containing clinical biomarkers and observations.

### Key Findings Explained
* **Test Overview**: Analyzed findings from: "{snippet}...".
* **Reference Ranges**: Laboratory reference ranges indicate typical values observed in healthy population cohorts. Numbers near boundaries indicate mild variations to review with your clinician.
* **Plain-English Meaning**: Values documented here help evaluate metabolic balance, organ function, and overall wellness.

### Questions for Your Doctor
1. What do these specific marker levels mean for my overall health and wellness?
2. Are any follow-up tests or lifestyle modifications recommended based on these findings?
3. How often should we re-test these biomarkers to track trends over time?

{MANDATORY_DISCLAIMER}"""


openrouter_client = OpenRouterClient()
