BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 0001_initial_schema

CREATE TABLE user_profiles (
    user_id UUID NOT NULL, 
    display_name VARCHAR(120), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_user_profiles PRIMARY KEY (user_id)
);

CREATE TABLE family_workspaces (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    owner_user_id UUID NOT NULL, 
    name VARCHAR(120) DEFAULT 'My Family' NOT NULL, 
    status VARCHAR(32) DEFAULT 'active' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_family_workspaces PRIMARY KEY (id), 
    CONSTRAINT ck_family_workspaces_ck_family_workspaces_status CHECK (status IN ('active', 'pending_deletion', 'deletion_failed'))
);

CREATE TABLE family_members (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    workspace_id UUID NOT NULL, 
    display_name VARCHAR(160) NOT NULL, 
    relationship_label VARCHAR(32) DEFAULT 'unspecified' NOT NULL, 
    date_of_birth DATE, 
    notes TEXT, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    purge_after TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_family_members PRIMARY KEY (id), 
    CONSTRAINT ck_family_members_ck_family_members_relationship CHECK (relationship_label IN ('self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'dependent', 'other', 'unspecified')), 
    CONSTRAINT ck_family_members_ck_family_members_display_name_non_empty CHECK (length(trim(display_name)) > 0), 
    CONSTRAINT ck_family_members_ck_family_members_dob_not_future CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE), 
    CONSTRAINT fk_family_members_workspace_id_family_workspaces FOREIGN KEY(workspace_id) REFERENCES family_workspaces (id) ON DELETE CASCADE
);

CREATE INDEX idx_family_members_workspace_active ON family_members (workspace_id, created_at DESC);

CREATE INDEX idx_family_members_workspace_deleted ON family_members (workspace_id, deleted_at);

CREATE TABLE medical_documents (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    workspace_id UUID NOT NULL, 
    family_member_id UUID NOT NULL, 
    title VARCHAR(240) NOT NULL, 
    category VARCHAR(40) DEFAULT 'other' NOT NULL, 
    document_date DATE, 
    notes TEXT, 
    deleted_at TIMESTAMP WITH TIME ZONE, 
    purge_after TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_medical_documents PRIMARY KEY (id), 
    CONSTRAINT ck_medical_documents_ck_medical_documents_category CHECK (category IN ('lab_result', 'prescription', 'imaging', 'clinical_report', 'vaccination', 'discharge_summary', 'other')), 
    CONSTRAINT ck_medical_documents_ck_medical_documents_title_non_empty CHECK (length(trim(title)) > 0), 
    CONSTRAINT fk_medical_documents_workspace_id_family_workspaces FOREIGN KEY(workspace_id) REFERENCES family_workspaces (id) ON DELETE CASCADE, 
    CONSTRAINT fk_medical_documents_family_member_id_family_members FOREIGN KEY(family_member_id) REFERENCES family_members (id) ON DELETE RESTRICT
);

CREATE INDEX idx_medical_documents_workspace_member_created ON medical_documents (workspace_id, family_member_id, created_at DESC);

CREATE INDEX idx_medical_documents_member_category_date ON medical_documents (workspace_id, family_member_id, category, document_date DESC);

CREATE INDEX idx_medical_documents_workspace_deleted ON medical_documents (workspace_id, deleted_at);

CREATE TABLE document_versions (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_id UUID NOT NULL, 
    version_number INTEGER NOT NULL, 
    storage_bucket VARCHAR(100) DEFAULT 'medical-documents' NOT NULL, 
    storage_key TEXT NOT NULL, 
    original_filename VARCHAR(255) NOT NULL, 
    mime_type VARCHAR(127) NOT NULL, 
    file_size_bytes BIGINT NOT NULL, 
    sha256 VARCHAR(64) NOT NULL, 
    is_current BOOLEAN DEFAULT true NOT NULL, 
    uploaded_by_user_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_document_versions PRIMARY KEY (id), 
    CONSTRAINT uq_document_versions_document_version UNIQUE (document_id, version_number), 
    CONSTRAINT ck_document_versions_ck_document_versions_version_positive CHECK (version_number > 0), 
    CONSTRAINT ck_document_versions_ck_document_versions_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214440), 
    CONSTRAINT ck_document_versions_ck_document_versions_sha256_length CHECK (length(sha256) = 64), 
    CONSTRAINT ck_document_versions_ck_document_versions_mime_type CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg')), 
    CONSTRAINT fk_document_versions_document_id_medical_documents FOREIGN KEY(document_id) REFERENCES medical_documents (id) ON DELETE CASCADE, 
    CONSTRAINT uq_document_versions_storage_key UNIQUE (storage_key)
);

CREATE UNIQUE INDEX uq_document_versions_current ON document_versions (document_id) WHERE is_current = true;

CREATE TABLE document_processing_jobs (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_version_id UUID NOT NULL, 
    job_type VARCHAR(40) NOT NULL, 
    status VARCHAR(24) DEFAULT 'queued' NOT NULL, 
    attempt_count INTEGER DEFAULT '0' NOT NULL, 
    idempotency_key VARCHAR(160) NOT NULL, 
    provider VARCHAR(80), 
    model VARCHAR(160), 
    safe_error_code VARCHAR(100), 
    started_at TIMESTAMP WITH TIME ZONE, 
    finished_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_document_processing_jobs PRIMARY KEY (id), 
    CONSTRAINT ck_document_processing_jobs_ck_processing_jobs_type CHECK (job_type IN ('extract', 'summarize', 'extract_measurements', 'permanent_delete')), 
    CONSTRAINT ck_document_processing_jobs_ck_processing_jobs_status CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')), 
    CONSTRAINT ck_document_processing_jobs_ck_processing_jobs_attempt_count CHECK (attempt_count >= 0), 
    CONSTRAINT fk_document_processing_jobs_document_version_id_documen_e6ef FOREIGN KEY(document_version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
    CONSTRAINT uq_document_processing_jobs_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX idx_processing_jobs_queue ON document_processing_jobs (status, created_at);

CREATE INDEX idx_processing_jobs_version_type ON document_processing_jobs (document_version_id, job_type, created_at DESC);

CREATE TABLE document_extractions (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_version_id UUID NOT NULL, 
    status VARCHAR(24) DEFAULT 'pending' NOT NULL, 
    extracted_text TEXT, 
    extraction_method VARCHAR(80), 
    extraction_confidence NUMERIC(5, 4), 
    safe_error_code VARCHAR(100), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_document_extractions PRIMARY KEY (id), 
    CONSTRAINT ck_document_extractions_ck_document_extractions_status CHECK (status IN ('pending', 'succeeded', 'failed', 'partial')), 
    CONSTRAINT ck_document_extractions_ck_document_extractions_confide_0ad3 CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)), 
    CONSTRAINT fk_document_extractions_document_version_id_document_versions FOREIGN KEY(document_version_id) REFERENCES document_versions (id) ON DELETE CASCADE
);

CREATE TABLE ai_summaries (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_version_id UUID NOT NULL, 
    status VARCHAR(24) DEFAULT 'pending' NOT NULL, 
    summary_text TEXT, 
    provider VARCHAR(80), 
    model VARCHAR(160), 
    prompt_version VARCHAR(80), 
    source_reference_metadata JSONB DEFAULT '{}'::jsonb NOT NULL, 
    safe_error_code VARCHAR(100), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_ai_summaries PRIMARY KEY (id), 
    CONSTRAINT ck_ai_summaries_ck_ai_summaries_status CHECK (status IN ('pending', 'succeeded', 'failed')), 
    CONSTRAINT ck_ai_summaries_ck_ai_summaries_succeeded_has_text CHECK (status != 'succeeded' OR (summary_text IS NOT NULL AND length(trim(summary_text)) > 0)), 
    CONSTRAINT fk_ai_summaries_document_version_id_document_versions FOREIGN KEY(document_version_id) REFERENCES document_versions (id) ON DELETE CASCADE
);

CREATE TABLE medical_measurements (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_version_id UUID NOT NULL, 
    extraction_id UUID, 
    test_name VARCHAR(200) NOT NULL, 
    normalized_test_key VARCHAR(200), 
    value_numeric NUMERIC(20, 8), 
    value_text VARCHAR(255), 
    unit VARCHAR(80), 
    specimen VARCHAR(120), 
    measured_on DATE, 
    reference_low NUMERIC(20, 8), 
    reference_high NUMERIC(20, 8), 
    source_location VARCHAR(255), 
    confidence NUMERIC(5, 4), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_medical_measurements PRIMARY KEY (id), 
    CONSTRAINT ck_medical_measurements_ck_medical_measurements_has_value CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL), 
    CONSTRAINT ck_medical_measurements_ck_medical_measurements_reference_range CHECK (reference_low IS NULL OR reference_high IS NULL OR reference_low <= reference_high), 
    CONSTRAINT ck_medical_measurements_ck_medical_measurements_confide_9949 CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)), 
    CONSTRAINT fk_medical_measurements_document_version_id_document_versions FOREIGN KEY(document_version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
    CONSTRAINT fk_medical_measurements_extraction_id_document_extractions FOREIGN KEY(extraction_id) REFERENCES document_extractions (id) ON DELETE SET NULL
);

CREATE INDEX idx_measurements_test_date ON medical_measurements (normalized_test_key, measured_on);

CREATE TABLE share_links (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    document_version_id UUID NOT NULL, 
    created_by_user_id UUID NOT NULL, 
    token_hash VARCHAR(128) NOT NULL, 
    include_original BOOLEAN DEFAULT false NOT NULL, 
    include_summary BOOLEAN DEFAULT false NOT NULL, 
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
    revoked_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_share_links PRIMARY KEY (id), 
    CONSTRAINT ck_share_links_ck_share_links_has_content CHECK (include_original = true OR include_summary = true), 
    CONSTRAINT ck_share_links_ck_share_links_expires_after_creation CHECK (expires_at > created_at), 
    CONSTRAINT fk_share_links_document_version_id_document_versions FOREIGN KEY(document_version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
    CONSTRAINT uq_share_links_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_share_links_expiry ON share_links (expires_at);

CREATE TABLE audit_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL, 
    actor_user_id UUID, 
    workspace_id UUID, 
    document_id UUID, 
    share_link_id UUID, 
    action VARCHAR(100) NOT NULL, 
    outcome VARCHAR(16) NOT NULL, 
    request_id VARCHAR(100), 
    ip_prefix_hash VARCHAR(128), 
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT pk_audit_events PRIMARY KEY (id), 
    CONSTRAINT ck_audit_events_ck_audit_events_outcome CHECK (outcome IN ('success', 'denied', 'failure')), 
    CONSTRAINT fk_audit_events_workspace_id_family_workspaces FOREIGN KEY(workspace_id) REFERENCES family_workspaces (id) ON DELETE SET NULL, 
    CONSTRAINT fk_audit_events_document_id_medical_documents FOREIGN KEY(document_id) REFERENCES medical_documents (id) ON DELETE SET NULL, 
    CONSTRAINT fk_audit_events_share_link_id_share_links FOREIGN KEY(share_link_id) REFERENCES share_links (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_events_workspace_created ON audit_events (workspace_id, created_at DESC);

INSERT INTO alembic_version (version_num) VALUES ('0001_initial_schema') RETURNING alembic_version.version_num;

-- Running upgrade 0001_initial_schema -> 0002_row_level_security

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;;

ALTER TABLE family_workspaces ENABLE ROW LEVEL SECURITY;;

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;;

ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;;

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;;

ALTER TABLE document_processing_jobs ENABLE ROW LEVEL SECURITY;;

ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;;

ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;;

ALTER TABLE medical_measurements ENABLE ROW LEVEL SECURITY;;

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;;

CREATE POLICY user_profiles_owner_all ON user_profiles
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);;

CREATE POLICY family_workspaces_owner_all ON family_workspaces
            FOR ALL
            USING (auth.uid() = owner_user_id)
            WITH CHECK (auth.uid() = owner_user_id);;

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
            );;

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
            );;

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
            );;

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
            );;

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
            );;

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
            );;

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
            );;

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
            );;

CREATE POLICY audit_events_insert ON audit_events
            FOR INSERT
            WITH CHECK (true);;

UPDATE alembic_version SET version_num='0002_row_level_security' WHERE alembic_version.version_num = '0001_initial_schema';

COMMIT;

