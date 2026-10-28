"""Sliding-window rate limiting infrastructure per API.md Section 9."""

import time
from collections import defaultdict
from threading import Lock

from fastapi import Request

from app.core.errors import RateLimitError


class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding window rate limiter."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int,
    ) -> tuple[bool, int, int]:
        """Check whether identifier has exceeded max_requests within window_seconds.

        Returns: (allowed, remaining, reset_seconds)
        """
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            # Clean expired timestamps
            valid_timestamps = [t for t in self._requests[identifier] if t > cutoff]
            self._requests[identifier] = valid_timestamps

            if len(valid_timestamps) >= max_requests:
                earliest = valid_timestamps[0]
                reset_seconds = max(1, int(earliest + window_seconds - now))
                return False, 0, reset_seconds

            self._requests[identifier].append(now)
            remaining = max(0, max_requests - len(self._requests[identifier]))
            return True, remaining, window_seconds

    def reset(self) -> None:
        """Clear all rate limit buckets (useful for test isolation)."""
        with self._lock:
            self._requests.clear()


limiter = SlidingWindowRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP handling reverse proxy headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def enforce_rate_limit(
    request: Request,
    scope: str,
    max_requests: int,
    window_seconds: int = 60,
    identifier_override: str | None = None,
) -> None:
    """Enforce rate limit, raising RateLimitError if exceeded."""
    identifier = identifier_override or f"{scope}:{get_client_ip(request)}"
    allowed, remaining, reset_seconds = limiter.check_rate_limit(
        identifier, max_requests=max_requests, window_seconds=window_seconds
    )

    if not allowed:
        raise RateLimitError(
            message=f"Rate limit exceeded for {scope}. Please retry in {reset_seconds} seconds."
        )
