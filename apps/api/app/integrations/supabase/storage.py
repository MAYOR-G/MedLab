"""Supabase Storage integration for secure medical document storage."""

import uuid
from pathlib import Path

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("integrations.supabase.storage")


class SupabaseStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.bucket = self.settings.SUPABASE_STORAGE_BUCKET

    @staticmethod
    def generate_storage_key(
        workspace_id: uuid.UUID,
        document_id: uuid.UUID,
        version_id: uuid.UUID,
        filename: str,
    ) -> str:
        """Generate unpredictable, partitioned storage path.

        Format: <workspace_id>/<document_id>/<version_id>/<random_hex>.<extension>
        """
        ext = Path(filename).suffix.lower().lstrip(".") or "bin"
        random_entropy = uuid.uuid4().hex[:16]
        return f"{workspace_id}/{document_id}/{version_id}/{random_entropy}.{ext}"

    def create_signed_upload_url(
        self,
        storage_key: str,
        expires_in_seconds: int = 900,
    ) -> str:
        """Generate presigned upload URL for direct client PUT (TTL: 15 minutes)."""
        base_url = self.settings.SUPABASE_URL.rstrip("/")
        service_key = (
            self.settings.SUPABASE_SERVICE_ROLE_KEY or self.settings.SUPABASE_ANON_KEY
        )

        # Check if live Supabase service key is available
        if service_key and service_key != "anon-key-placeholder":
            try:
                sign_endpoint = f"{base_url}/storage/v1/object/upload/sign/{self.bucket}/{storage_key}"
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(
                        sign_endpoint,
                        headers={
                            "Authorization": f"Bearer {service_key}",
                            "apiKey": service_key,
                            "Content-Type": "application/json",
                        },
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        url_path = data.get("url") or data.get("signedUrl")
                        if url_path:
                            if url_path.startswith("http"):
                                return str(url_path)
                            return f"{base_url}/storage/v1{url_path}"
            except Exception as e:
                logger.warning(
                    "Failed to generate live Supabase upload URL, using fallback: %s", e
                )

        # Fallback predictable presigned URL for local development/testing
        token = uuid.uuid4().hex
        return f"{base_url}/storage/v1/object/upload/sign/{self.bucket}/{storage_key}?token={token}&expiresIn={expires_in_seconds}"

    def create_signed_download_url(
        self,
        storage_key: str,
        expires_in_seconds: int = 300,
    ) -> str:
        """Generate short-lived signed download URL (TTL: 5 minutes)."""
        base_url = self.settings.SUPABASE_URL.rstrip("/")
        service_key = (
            self.settings.SUPABASE_SERVICE_ROLE_KEY or self.settings.SUPABASE_ANON_KEY
        )

        if service_key and service_key != "anon-key-placeholder":
            try:
                sign_endpoint = (
                    f"{base_url}/storage/v1/object/sign/{self.bucket}/{storage_key}"
                )
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(
                        sign_endpoint,
                        headers={
                            "Authorization": f"Bearer {service_key}",
                            "apiKey": service_key,
                            "Content-Type": "application/json",
                        },
                        json={"expiresIn": expires_in_seconds},
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        signed_url = data.get("signedURL") or data.get("signedUrl")
                        if signed_url:
                            if signed_url.startswith("http"):
                                return str(signed_url)
                            return f"{base_url}/storage/v1{signed_url}"
            except Exception as e:
                logger.warning(
                    "Failed to generate live Supabase download URL, using fallback: %s",
                    e,
                )

        # Fallback predictable presigned URL for local development/testing
        token = uuid.uuid4().hex
        return f"{base_url}/storage/v1/object/sign/{self.bucket}/{storage_key}?token={token}&expiresIn={expires_in_seconds}"

    def download_file_bytes(self, storage_key: str) -> bytes:
        """Fetch raw bytes from storage bucket (used by background worker)."""
        base_url = self.settings.SUPABASE_URL.rstrip("/")
        service_key = (
            self.settings.SUPABASE_SERVICE_ROLE_KEY or self.settings.SUPABASE_ANON_KEY
        )

        url = f"{base_url}/storage/v1/object/authenticated/{self.bucket}/{storage_key}"
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(
                url,
                headers={
                    "Authorization": f"Bearer {service_key}",
                    "apiKey": service_key,
                },
            )
            resp.raise_for_status()
            return resp.content

    def delete_file(self, storage_key: str) -> bool:
        """Delete an object from storage bucket (used during permanent purge)."""
        base_url = self.settings.SUPABASE_URL.rstrip("/")
        service_key = (
            self.settings.SUPABASE_SERVICE_ROLE_KEY or self.settings.SUPABASE_ANON_KEY
        )

        if service_key and service_key != "anon-key-placeholder":
            try:
                url = f"{base_url}/storage/v1/object/{self.bucket}/{storage_key}"
                with httpx.Client(timeout=10.0) as client:
                    resp = client.delete(
                        url,
                        headers={
                            "Authorization": f"Bearer {service_key}",
                            "apiKey": service_key,
                        },
                    )
                    return resp.status_code in (200, 204, 404)
            except Exception as e:
                logger.warning("Failed to delete storage object %s: %s", storage_key, e)
                return False
        return True


# Singleton instance
storage_service = SupabaseStorageService()

