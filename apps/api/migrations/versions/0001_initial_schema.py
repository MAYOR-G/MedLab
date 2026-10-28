"""Initial schema for MedLab.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-26 17:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. user_profiles
    op.create_table(
        "user_profiles",
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("display_name", sa.String(120), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # 2. family_workspaces
    op.create_table(
        "family_workspaces",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(120), server_default="My Family", nullable=False),
        sa.Column("status", sa.String(32), server_default="active", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('active', 'pending_deletion', 'deletion_failed')",
            name="ck_family_workspaces_status",
        ),
    )

    # 3. family_members
    op.create_table(
        "family_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("family_workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("display_name", sa.String(160), nullable=False),
        sa.Column(
            "relationship_label",
            sa.String(32),
            server_default="unspecified",
            nullable=False,
        ),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("purge_after", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "relationship_label IN ('self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'dependent', 'other', 'unspecified')",
            name="ck_family_members_relationship",
        ),
        sa.CheckConstraint(
            "length(trim(display_name)) > 0",
            name="ck_family_members_display_name_non_empty",
        ),
        sa.CheckConstraint(
            "date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE",
            name="ck_family_members_dob_not_future",
        ),
    )
    op.create_index(
        "idx_family_members_workspace_active",
        "family_members",
        ["workspace_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_family_members_workspace_deleted",
        "family_members",
        ["workspace_id", "deleted_at"],
    )

    # 4. medical_documents
    op.create_table(
        "medical_documents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("family_workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "family_member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("family_members.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("category", sa.String(40), server_default="other", nullable=False),
        sa.Column("document_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("purge_after", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "category IN ('lab_result', 'prescription', 'imaging', 'clinical_report', 'vaccination', 'discharge_summary', 'other')",
            name="ck_medical_documents_category",
        ),
        sa.CheckConstraint(
            "length(trim(title)) > 0", name="ck_medical_documents_title_non_empty"
        ),
    )
    op.create_index(
        "idx_medical_documents_workspace_member_created",
        "medical_documents",
        ["workspace_id", "family_member_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "idx_medical_documents_member_category_date",
        "medical_documents",
        ["workspace_id", "family_member_id", "category", sa.text("document_date DESC")],
    )
    op.create_index(
        "idx_medical_documents_workspace_deleted",
        "medical_documents",
        ["workspace_id", "deleted_at"],
    )

    # 5. document_versions
    op.create_table(
        "document_versions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("medical_documents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column(
            "storage_bucket",
            sa.String(100),
            server_default="medical-documents",
            nullable=False,
        ),
        sa.Column("storage_key", sa.Text(), nullable=False, unique=True),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(127), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column(
            "is_current", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column("uploaded_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "document_id",
            "version_number",
            name="uq_document_versions_document_version",
        ),
        sa.CheckConstraint(
            "version_number > 0", name="ck_document_versions_version_positive"
        ),
        sa.CheckConstraint(
            "file_size_bytes > 0 AND file_size_bytes <= 26214440",
            name="ck_document_versions_file_size",
        ),
        sa.CheckConstraint(
            "length(sha256) = 64", name="ck_document_versions_sha256_length"
        ),
        sa.CheckConstraint(
            "mime_type IN ('application/pdf', 'image/png', 'image/jpeg')",
            name="ck_document_versions_mime_type",
        ),
    )
    op.create_index(
        "uq_document_versions_current",
        "document_versions",
        ["document_id"],
        unique=True,
        postgresql_where=sa.text("is_current = true"),
    )

    # 6. document_processing_jobs
    op.create_table(
        "document_processing_jobs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("job_type", sa.String(40), nullable=False),
        sa.Column("status", sa.String(24), server_default="queued", nullable=False),
        sa.Column("attempt_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("idempotency_key", sa.String(160), nullable=False, unique=True),
        sa.Column("provider", sa.String(80), nullable=True),
        sa.Column("model", sa.String(160), nullable=True),
        sa.Column("safe_error_code", sa.String(100), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "job_type IN ('extract', 'summarize', 'extract_measurements', 'permanent_delete')",
            name="ck_processing_jobs_type",
        ),
        sa.CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_processing_jobs_status",
        ),
        sa.CheckConstraint(
            "attempt_count >= 0", name="ck_processing_jobs_attempt_count"
        ),
    )
    op.create_index(
        "idx_processing_jobs_queue",
        "document_processing_jobs",
        ["status", sa.text("created_at")],
    )
    op.create_index(
        "idx_processing_jobs_version_type",
        "document_processing_jobs",
        ["document_version_id", "job_type", sa.text("created_at DESC")],
    )

    # 7. document_extractions
    op.create_table(
        "document_extractions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(24), server_default="pending", nullable=False),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("extraction_method", sa.String(80), nullable=True),
        sa.Column("extraction_confidence", sa.Numeric(5, 4), nullable=True),
        sa.Column("safe_error_code", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed', 'partial')",
            name="ck_document_extractions_status",
        ),
        sa.CheckConstraint(
            "extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)",
            name="ck_document_extractions_confidence_range",
        ),
    )

    # 8. ai_summaries
    op.create_table(
        "ai_summaries",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(24), server_default="pending", nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=True),
        sa.Column("provider", sa.String(80), nullable=True),
        sa.Column("model", sa.String(160), nullable=True),
        sa.Column("prompt_version", sa.String(80), nullable=True),
        sa.Column(
            "source_reference_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("safe_error_code", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed')",
            name="ck_ai_summaries_status",
        ),
        sa.CheckConstraint(
            "status != 'succeeded' OR (summary_text IS NOT NULL AND length(trim(summary_text)) > 0)",
            name="ck_ai_summaries_succeeded_has_text",
        ),
    )

    # 9. medical_measurements
    op.create_table(
        "medical_measurements",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "extraction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_extractions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("test_name", sa.String(200), nullable=False),
        sa.Column("normalized_test_key", sa.String(200), nullable=True),
        sa.Column("value_numeric", sa.Numeric(20, 8), nullable=True),
        sa.Column("value_text", sa.String(255), nullable=True),
        sa.Column("unit", sa.String(80), nullable=True),
        sa.Column("specimen", sa.String(120), nullable=True),
        sa.Column("measured_on", sa.Date(), nullable=True),
        sa.Column("reference_low", sa.Numeric(20, 8), nullable=True),
        sa.Column("reference_high", sa.Numeric(20, 8), nullable=True),
        sa.Column("source_location", sa.String(255), nullable=True),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "value_numeric IS NOT NULL OR value_text IS NOT NULL",
            name="ck_medical_measurements_has_value",
        ),
        sa.CheckConstraint(
            "reference_low IS NULL OR reference_high IS NULL OR reference_low <= reference_high",
            name="ck_medical_measurements_reference_range",
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_medical_measurements_confidence_range",
        ),
    )
    op.create_index(
        "idx_measurements_test_date",
        "medical_measurements",
        ["normalized_test_key", "measured_on"],
    )

    # 10. share_links
    op.create_table(
        "share_links",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "document_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("document_versions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(128), nullable=False, unique=True),
        sa.Column(
            "include_original",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "include_summary",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "include_original = true OR include_summary = true",
            name="ck_share_links_has_content",
        ),
        sa.CheckConstraint(
            "expires_at > created_at", name="ck_share_links_expires_after_creation"
        ),
    )
    op.create_index("idx_share_links_expiry", "share_links", ["expires_at"])

    # 11. audit_events
    op.create_table(
        "audit_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("family_workspaces.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("medical_documents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "share_link_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("share_links.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("outcome", sa.String(16), nullable=False),
        sa.Column("request_id", sa.String(100), nullable=True),
        sa.Column("ip_prefix_hash", sa.String(128), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "outcome IN ('success', 'denied', 'failure')",
            name="ck_audit_events_outcome",
        ),
    )
    op.create_index(
        "idx_audit_events_workspace_created",
        "audit_events",
        ["workspace_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("share_links")
    op.drop_table("medical_measurements")
    op.drop_table("ai_summaries")
    op.drop_table("document_extractions")
    op.drop_table("document_processing_jobs")
    op.drop_table("document_versions")
    op.drop_table("medical_documents")
    op.drop_table("family_members")
    op.drop_table("family_workspaces")
    op.drop_table("user_profiles")
