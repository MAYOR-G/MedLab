"""Row-Level Security (RLS) policies for MedLab.

Revision ID: 0002_row_level_security
Revises: 0001_initial_schema
Create Date: 2026-10-26 17:35:00
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0002_row_level_security"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = [
    "user_profiles",
    "family_workspaces",
    "family_members",
    "medical_documents",
    "document_versions",
    "document_processing_jobs",
    "document_extractions",
    "ai_summaries",
    "medical_measurements",
    "share_links",
    "audit_events",
]


def upgrade() -> None:
    # 1. Enable RLS on all tables
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")

    # 2. user_profiles policies (User owns their profile)
    op.execute("""
        CREATE POLICY user_profiles_owner_all ON user_profiles
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    """)

    # 3. family_workspaces policies (Owner owns the workspace)
    op.execute("""
        CREATE POLICY family_workspaces_owner_all ON family_workspaces
            FOR ALL
            USING (auth.uid() = owner_user_id)
            WITH CHECK (auth.uid() = owner_user_id);
    """)

    # 4. family_members policies (Scoped by owning workspace)
    op.execute("""
        CREATE POLICY family_members_owner_all ON family_members
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM family_workspaces
                    WHERE family_workspaces.id = family_members.workspace_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM family_workspaces
                    WHERE family_workspaces.id = family_members.workspace_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 5. medical_documents policies (Scoped by owning workspace)
    op.execute("""
        CREATE POLICY medical_documents_owner_all ON medical_documents
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM family_workspaces
                    WHERE family_workspaces.id = medical_documents.workspace_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM family_workspaces
                    WHERE family_workspaces.id = medical_documents.workspace_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 6. document_versions policies (Cascaded through document -> workspace)
    op.execute("""
        CREATE POLICY document_versions_owner_all ON document_versions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM medical_documents
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE medical_documents.id = document_versions.document_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM medical_documents
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE medical_documents.id = document_versions.document_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 7. document_processing_jobs (Read own status, modifications restricted)
    op.execute("""
        CREATE POLICY processing_jobs_owner_select ON document_processing_jobs
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = document_processing_jobs.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 8. document_extractions (Scoped through version -> document -> workspace)
    op.execute("""
        CREATE POLICY document_extractions_owner_select ON document_extractions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = document_extractions.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 9. ai_summaries (Scoped through version -> document -> workspace)
    op.execute("""
        CREATE POLICY ai_summaries_owner_select ON ai_summaries
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = ai_summaries.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 10. medical_measurements (Scoped through version -> document -> workspace)
    op.execute("""
        CREATE POLICY medical_measurements_owner_select ON medical_measurements
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = medical_measurements.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 11. share_links (Created and managed by document owner)
    op.execute("""
        CREATE POLICY share_links_owner_all ON share_links
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = share_links.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM document_versions
                    JOIN medical_documents ON medical_documents.id = document_versions.document_id
                    JOIN family_workspaces ON family_workspaces.id = medical_documents.workspace_id
                    WHERE document_versions.id = share_links.document_version_id
                    AND family_workspaces.owner_user_id = auth.uid()
                )
            );
    """)

    # 12. audit_events (Append-only insert by authenticated actors)
    op.execute("""
        CREATE POLICY audit_events_insert ON audit_events
            FOR INSERT
            WITH CHECK (true);
    """)


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
