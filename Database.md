# MedLab — Database Specification

**Document:** `DATABASE.md`  
**Product:** MedLab  
**Version:** 1.0 MVP  
**Status:** Implementation specification; privacy-sensitive decisions require approval before public launch  
**Primary database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth  
**File storage:** Private Supabase Storage  
**Backend:** FastAPI / Python on Railway  
**Frontend:** Next.js / TypeScript on Vercel  

---

# 1. Database Technology & Configuration Overview

## 1.1 Approved database architecture

MedLab uses Supabase PostgreSQL as its relational system of record.

| Layer | Approved technology | Responsibility |
|---|---|---|
| Relational database | Supabase PostgreSQL | Users' family workspaces, member profiles, document metadata, processing state, extracted findings, AI summaries, measurements, sharing metadata, and audit events |
| Identity | Supabase Auth | Authentication identities, email/password, Google sign-in, email verification, and password recovery |
| Blob storage | Private Supabase Storage | Original uploaded medical files |
| Database access | SQLAlchemy 2.x with Alembic migrations, using a PostgreSQL-compatible async driver | Typed database access, transactions, and controlled schema changes |
| Backend authorization | FastAPI service layer plus PostgreSQL Row-Level Security (RLS) | Request authentication, ownership checks, and defense in depth |
| AI provider | OpenRouter | Approved model routing; model calls are orchestrated by the backend |
| Vector database | Not included in MVP | No separate vector database or embedding table until a measured requirement justifies one |
| Cache | No dedicated cache in MVP | PostgreSQL and bounded application-level caching only for non-sensitive configuration |
| Job processing | PostgreSQL-backed processing-job records and a bounded background worker | Track document extraction, summarization, retries, and permanent deletion |

**Database access rule:** Only the FastAPI backend and explicitly authorized database operations may access application tables. The browser must never receive PostgreSQL credentials, a Supabase service-role key, or direct unrestricted database access.

The backend must use a restricted database role and a clearly defined user-context/RLS strategy for ordinary requests. Any privileged background operation must be isolated, narrowly scoped, and auditable.

## 1.2 Naming conventions

- Table names: lowercase `snake_case`, plural nouns.
- Column names: lowercase `snake_case`.
- Primary keys: PostgreSQL `UUID`, generated with `gen_random_uuid()`.
- Foreign keys: `<referenced_entity>_id`.
- Boolean columns: use clear predicates such as `is_current`, `is_active`, and `is_verified`.
- Timestamps: `TIMESTAMPTZ`, stored in UTC.
- Database identifiers must never be treated as authorization credentials.
- Enumerated values: lowercase `snake_case`.
- Status strings: exact lowercase values specified in Section 3.
- Constraint names: descriptive names such as `fk_medical_documents_family_members` and `ck_share_links_expiry`.
- Index names: `idx_<table>_<columns>`; unique indexes use `uq_<table>_<columns>`.

## 1.3 Standard audit columns

All application-owned tables must have `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

Mutable tables must also have `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`. The application or a controlled database trigger must update this field on every successful mutation.

Append-only audit events do not require `updated_at`.

Tables that support recoverable deletion use `deleted_at TIMESTAMPTZ NULL` where appropriate. Soft deletion must not be applied indiscriminately to every entity.

## 1.4 Deletion rules

- **Hard delete:** Use for dependent records that have no independent retention requirement, after their parent’s approved deletion workflow has completed.
- **Soft delete:** Use for family-member profiles and medical documents when the PRD requires recovery during a defined retention window.
- **Revocation:** Share links must become unusable immediately when revoked, regardless of their original expiry.
- **Permanent deletion:** Must remove eligible database records, source files, extracted text, AI summaries, structured measurements, and other derived content.
- **External objects:** PostgreSQL cascading deletes do not delete Supabase Storage objects. Object deletion must be coordinated by the backend.
- **Backups:** Database deletion does not instantly remove copies in retained backups. The retention and disclosure policy must explain this limitation.

The trash retention period remains an owner-approved product decision. Do not hard-code an unapproved retention duration.

---

# 2. Entity-Relationship (ER) Diagram & Cardinality

## 2.1 Mermaid ER diagram

```mermaid
erDiagram
    AUTH_USERS ||--o| USER_PROFILES : has
    AUTH_USERS ||--o{ FAMILY_WORKSPACES : owns
    FAMILY_WORKSPACES ||--o{ FAMILY_MEMBERS : contains
    FAMILY_WORKSPACES ||--o{ MEDICAL_DOCUMENTS : organizes
    FAMILY_MEMBERS ||--o{ MEDICAL_DOCUMENTS : represents
    MEDICAL_DOCUMENTS ||--|{ DOCUMENT_VERSIONS : has
    DOCUMENT_VERSIONS ||--o{ DOCUMENT_PROCESSING_JOBS : processes
    DOCUMENT_VERSIONS ||--o{ DOCUMENT_EXTRACTIONS : extracts
    DOCUMENT_VERSIONS ||--o{ AI_SUMMARIES : summarizes
    DOCUMENT_VERSIONS ||--o{ MEDICAL_MEASUREMENTS : supports
    DOCUMENT_EXTRACTIONS o|--o{ MEDICAL_MEASUREMENTS : provides
    AUTH_USERS ||--o{ SHARE_LINKS : creates
    DOCUMENT_VERSIONS ||--o{ SHARE_LINKS : shares
    AUTH_USERS o|--o{ AUDIT_EVENTS : performs
    FAMILY_WORKSPACES o|--o{ AUDIT_EVENTS : scopes
    MEDICAL_DOCUMENTS o|--o{ AUDIT_EVENTS : concerns
    SHARE_LINKS o|--o{ AUDIT_EVENTS : records

    AUTH_USERS {
        uuid id PK
    }

    USER_PROFILES {
        uuid user_id PK, FK
        varchar display_name
        timestamptz created_at
        timestamptz updated_at
    }

    FAMILY_WORKSPACES {
        uuid id PK
        uuid owner_user_id FK
        varchar name
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    FAMILY_MEMBERS {
        uuid id PK
        uuid workspace_id FK
        varchar display_name
        varchar relationship_label
        date date_of_birth
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    MEDICAL_DOCUMENTS {
        uuid id PK
        uuid workspace_id FK
        uuid family_member_id FK
        varchar title
        varchar category
        date document_date
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    DOCUMENT_VERSIONS {
        uuid id PK
        uuid document_id FK
        integer version_number
        varchar storage_key
        varchar mime_type
        bigint file_size_bytes
        varchar sha256
        boolean is_current
        timestamptz created_at
    }

    DOCUMENT_PROCESSING_JOBS {
        uuid id PK
        uuid document_version_id FK
        varchar job_type
        varchar status
        integer attempt_count
        varchar safe_error_code
        timestamptz created_at
        timestamptz updated_at
    }

    DOCUMENT_EXTRACTIONS {
        uuid id PK
        uuid document_version_id FK
        text extracted_text
        numeric extraction_confidence
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    AI_SUMMARIES {
        uuid id PK
        uuid document_version_id FK
        text summary_text
        varchar provider
        varchar model
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    MEDICAL_MEASUREMENTS {
        uuid id PK
        uuid document_version_id FK
        uuid extraction_id FK
        varchar test_name
        numeric value_numeric
        varchar value_text
        varchar unit
        date measured_on
        numeric reference_low
        numeric reference_high
        timestamptz created_at
        timestamptz updated_at
    }

    SHARE_LINKS {
        uuid id PK
        uuid document_version_id FK
        uuid created_by_user_id FK
        varchar token_hash
        boolean include_original
        boolean include_summary
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
    }

    AUDIT_EVENTS {
        uuid id PK
        uuid actor_user_id FK
        uuid workspace_id FK
        uuid document_id FK
        uuid share_link_id FK
        varchar action
        varchar outcome
        varchar request_id
        timestamptz created_at
    }

AUTH_USERS represents the Supabase-managed auth.users table. It is an external identity-provider table, not an application-owned table to recreate.
2.2 Relationship rules
- One authenticated user may own one or more family workspaces; the initial UI may create one workspace by default.
- Each workspace has exactly one owner in the MVP.
- A workspace contains multiple family members and documents.
- Every medical document belongs to exactly one workspace and one family member in that same workspace.
- A document has one or more versions. A version represents an immutable uploaded file revision.
- Processing jobs, extractions, summaries, and measurements refer to the exact document version that produced them.
- A measurement may reference its extraction record when extracted from machine-readable text. Manually corrected or separately sourced values must retain source provenance.
- A share link grants access only to one document version and the explicitly selected content.
- Audit events may be associated with an authenticated actor, workspace, document, or share link. Anonymous share access must not require a fictitious user account.
- Many-to-many join tables are not required for the initial owner-only family model. If explicit additional workspace members or invitations are approved later, introduce a membership model through a separately reviewed schema change.
2.3 Deliberately excluded entities
The initial schema does not include:
- Subscription or billing tables.
- Organization/enterprise tenancy.
- Persisted AI conversation and message tables.
- Vector embeddings or a vector-search index.
- A separate document-category table.
- A separate trash table.
- A provider-configuration database table.
- A notification delivery table.
AI conversations default to session-only until persistence and retention are explicitly approved. Provider routing and fallback policy belong in validated server-side configuration, not user-editable database records.

3. Enums & Standardized Value Sets
Use PostgreSQL VARCHAR columns with named CHECK constraints for the initial MVP, unless a migration strategy later establishes a compelling reason to use native PostgreSQL enum types.

This keeps changes to status values manageable while still enforcing allowed values at the database layer.

Values are case-sensitive and must match exactly.
Field	Allowed values	Purpose
family_workspaces.status	active, pending_deletion, deletion_failed	Workspace lifecycle
family_members.relationship_label	self, spouse, partner, child, parent, sibling, dependent, other, unspecified	Optional relationship description
medical_documents.category	lab_result, prescription, imaging, clinical_report, vaccination, discharge_summary, other	Document organization
document_processing_jobs.job_type	extract, summarize, extract_measurements, permanent_delete	Processing operation
document_processing_jobs.status	queued, running, succeeded, failed, cancelled	Job lifecycle
document_extractions.status	pending, succeeded, failed, partial	Extraction result
ai_summaries.status	pending, succeeded, failed	Summary generation result
share_links content selection	include_original and include_summary booleans	Exact permitted share content
audit_events.outcome	success, denied, failure	Security-relevant operation result

Additional controlled values
- document_versions.is_current must have exactly one true row per non-deleted document.
- document_processing_jobs.attempt_count must be non-negative.
- document_extractions.extraction_confidence, when present, must be between 0 and 1.
- medical_measurements.value_numeric and value_text cannot both be NULL.
- share_links.include_original or share_links.include_summary must be true.
- share_links.expires_at must be later than created_at.
- share_links.revoked_at, when present, represents immediate revocation.
Values not represented as database enums
- Authentication provider names remain managed by Supabase Auth.
- OpenRouter model identifiers remain configuration values.
- Medical test names are not an unrestricted set of hard-coded enums; preserve the reported source name and normalize only when the application can establish a reliable identity.
- Reference ranges, units, and test comparability must not be inferred solely from a matching display label.

4. Complete Table & Column Specifications
All application-owned tables use UUID primary keys except user_profiles, whose primary key is the Supabase Auth user UUID.

now() is the default for creation timestamps. Nullable fields with no default are explicitly marked NULL.
4.1 user_profiles
Stores only application-level profile information not already managed by Supabase Auth.
Column Name	Data Type	Nullable?	Default	Constraints	Description
user_id	UUID	NOT NULL	None	PK, FK → auth.users.id	Authenticated user identity
display_name	VARCHAR(120)	NULL	None	Length 1–120 when present	Optional UI display name
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

Do not duplicate the user's email, password hash, OAuth credentials, or authentication tokens here. Supabase Auth owns those fields.
4.2 family_workspaces
Represents the owner-managed family vault.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Workspace identifier
owner_user_id	UUID	NOT NULL	None	FK → auth.users.id	Sole workspace owner
name	VARCHAR(120)	NOT NULL	'My Family'	Length 1–120	Workspace display name
status	VARCHAR(32)	NOT NULL	'active'	CHECK allowed statuses	Workspace lifecycle
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

Do not store medical data or uploaded file contents in this table.
4.3 family_members
Represents the person whose medical records are stored.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Family-member identifier
workspace_id	UUID	NOT NULL	None	FK → family_workspaces.id	Owning workspace
display_name	VARCHAR(160)	NOT NULL	None	Length 1–160	Name shown in the application
relationship_label	VARCHAR(32)	NOT NULL	'unspecified'	CHECK allowed relationship values	Optional relationship category
date_of_birth	DATE	NULL	None	Must not be in the future	Optional date of birth; collect only when justified
notes	TEXT	NULL	None	Length limit enforced by API	Optional non-clinical profile note, if approved
deleted_at	TIMESTAMPTZ	NULL	None	—	Recoverable deletion timestamp
purge_after	TIMESTAMPTZ	NULL	None	Must be later than deleted_at when both exist	Scheduled purge timestamp
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

When a family member is deleted, hide the member and all associated documents from normal views and AI context. Existing share links for those documents must be revoked. Restore must not reactivate old share links.
4.4 medical_documents
Represents a logical medical document and its metadata.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Document identifier
workspace_id	UUID	NOT NULL	None	FK → family_workspaces.id	Workspace owner scope
family_member_id	UUID	NOT NULL	None	FK → family_members.id	Person represented by the document
title	VARCHAR(240)	NOT NULL	None	Length 1–240	User-facing title
category	VARCHAR(40)	NOT NULL	'other'	CHECK allowed categories	Document category
document_date	DATE	NULL	None	—	Date printed on or associated with the record
notes	TEXT	NULL	None	API-enforced maximum length	Optional owner-provided notes
deleted_at	TIMESTAMPTZ	NULL	None	—	Recoverable deletion timestamp
purge_after	TIMESTAMPTZ	NULL	None	Must be later than deleted_at when both exist	Scheduled permanent-deletion timestamp
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Record creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

Cross-table invariant: medical_documents.workspace_id must equal the workspace_id of its family_member_id. Enforce this in the service layer and, where feasible, with composite foreign-key constraints backed by matching unique keys.

The backend must never accept a client-provided workspace ID as proof of ownership.
4.5 document_versions
Stores immutable uploaded-file versions and their private storage references.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	File-version identifier
document_id	UUID	NOT NULL	None	FK → medical_documents.id	Parent logical document
version_number	INTEGER	NOT NULL	None	CHECK > 0; UNIQUE with document_id	Monotonically increasing version number
storage_bucket	VARCHAR(100)	NOT NULL	'medical-documents'	Must match approved private bucket	Storage bucket name
storage_key	TEXT	NOT NULL	None	UNIQUE	Private object key, never a public URL
original_filename	VARCHAR(255)	NOT NULL	None	Length 1–255	Sanitized display filename
mime_type	VARCHAR(127)	NOT NULL	None	CHECK against approved MIME allowlist	Verified content type
file_size_bytes	BIGINT	NOT NULL	None	CHECK > 0 and = 0	Number of attempted executions
idempotency_key	VARCHAR(160)	NOT NULL	None	UNIQUE	Stable deduplication key
provider	VARCHAR(80)	NULL	None	—	Approved provider identifier, when applicable
model	VARCHAR(160)	NULL	None	—	Approved model identifier, when applicable
safe_error_code	VARCHAR(100)	NULL	None	—	Non-sensitive machine-readable error category
started_at	TIMESTAMPTZ	NULL	None	—	Execution start time
finished_at	TIMESTAMPTZ	NULL	None	—	Terminal execution time
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Queue creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last job-state update

Never store raw provider error payloads, secrets, full prompts, or unnecessary medical content in safe_error_code.

Retries must be bounded. A failed extraction or summary must not delete, overwrite, or make the original upload unavailable.
4.7 document_extractions
Stores text extracted from an uploaded document version.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Extraction identifier
document_version_id	UUID	NOT NULL	None	FK → document_versions.id	Source version
status	VARCHAR(24)	NOT NULL	'pending'	CHECK allowed extraction statuses	Extraction result
extracted_text	TEXT	NULL	None	—	Extracted text; highly sensitive
extraction_method	VARCHAR(80)	NULL	None	—	Parser/OCR method identifier
extraction_confidence	NUMERIC(5,4)	NULL	None	CHECK between 0 and 1	Overall extraction confidence when available
safe_error_code	VARCHAR(100)	NULL	None	—	Non-sensitive failure code
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

Retain only the extraction data needed for summaries, comparisons, and user-facing review. Deletion of the source document must trigger deletion of this derived content under the approved retention workflow.
4.8 ai_summaries
Stores AI-generated explanations associated with a specific source version.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Summary identifier
document_version_id	UUID	NOT NULL	None	FK → document_versions.id	Source file version
status	VARCHAR(24)	NOT NULL	'pending'	CHECK allowed summary statuses	Generation state
summary_text	TEXT	NULL	None	Required when status is succeeded	Plain-English explanation
provider	VARCHAR(80)	NULL	None	—	Approved provider identifier
model	VARCHAR(160)	NULL	None	—	Model identifier
prompt_version	VARCHAR(80)	NULL	None	—	Version identifier for the server-managed prompt
source_reference_metadata	JSONB	NOT NULL	'{}'	Object only; validated by application	Minimal references to source sections or medical references
safe_error_code	VARCHAR(100)	NULL	None	—	Non-sensitive failure code
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

A successful summary must be associated with the exact source version used to generate it.

Do not store fabricated citations or unverified source URLs as if they were authoritative. The original uploaded document remains the source of truth.
4.9 medical_measurements
Stores structured reported values used for historical comparison.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Measurement identifier
document_version_id	UUID	NOT NULL	None	FK → document_versions.id	Source version
extraction_id	UUID	NULL	None	FK → document_extractions.id	Extraction provenance when applicable
test_name	VARCHAR(200)	NOT NULL	None	Length 1–200	Reported test name
normalized_test_key	VARCHAR(200)	NULL	None	—	Canonical identity only when safely normalized
value_numeric	NUMERIC(20,8)	NULL	None	—	Numeric result
value_text	VARCHAR(255)	NULL	None	—	Non-numeric or qualitative result
unit	VARCHAR(80)	NULL	None	—	Reported unit
specimen	VARCHAR(120)	NULL	None	—	Specimen/context when reported
measured_on	DATE	NULL	None	—	Measurement date
reference_low	NUMERIC(20,8)	NULL	None	—	Lower reference boundary when reported
reference_high	NUMERIC(20,8)	NULL	None	—	Upper reference boundary when reported
source_location	VARCHAR(255)	NULL	None	—	Page, section, or location in the source document
confidence	NUMERIC(5,4)	NULL	None	CHECK between 0 and 1	Confidence of extraction or normalization
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp
updated_at	TIMESTAMPTZ	NOT NULL	now()	—	Last modification

Do not assume that values with the same display name are comparable. Comparison requires compatible test identity, units, dates, specimen/context where relevant, and reliable provenance.

If the value is qualitative, preserve it in value_text rather than coercing it to a number.
4.10 share_links
Stores metadata for revocable, expiring, unlisted document links.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Share-link identifier
document_version_id	UUID	NOT NULL	None	FK → document_versions.id	Exact document version shared
created_by_user_id	UUID	NOT NULL	None	FK → auth.users.id	Authenticated owner who created the link
token_hash	VARCHAR(128)	NOT NULL	None	UNIQUE	Cryptographic hash of the bearer token
include_original	BOOLEAN	NOT NULL	false	At least one content flag true	Whether the original may be accessed
include_summary	BOOLEAN	NOT NULL	false	At least one content flag true	Whether the saved summary may be accessed
expires_at	TIMESTAMPTZ	NOT NULL	None	CHECK > created_at	Expiry timestamp
revoked_at	TIMESTAMPTZ	NULL	None	—	Immediate revocation timestamp
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Creation timestamp

The raw token is returned to the owner once at link creation and must never be stored in plaintext.

Every share access must verify:
1. The token hash matches a stored link.
2. The link has not expired.
3. The link has not been revoked.
4. The parent document and family member have not been deleted.
5. The requested content flag is enabled.
6. The underlying object exists and is still eligible for access.
A valid share link does not authorize AI questions, family browsing, access to other documents, or workspace membership.
4.11 audit_events
Records security-relevant events without duplicating medical content.
Column Name	Data Type	Nullable?	Default	Constraints	Description
id	UUID	NOT NULL	gen_random_uuid()	PK	Event identifier
actor_user_id	UUID	NULL	None	FK → auth.users.id	Authenticated actor, if present
workspace_id	UUID	NULL	None	FK → family_workspaces.id	Relevant workspace
document_id	UUID	NULL	None	FK → medical_documents.id	Relevant document
share_link_id	UUID	NULL	None	FK → share_links.id	Relevant share link
action	VARCHAR(100)	NOT NULL	None	Controlled application vocabulary	Action such as document_download, share_revoked, or document_deleted
outcome	VARCHAR(16)	NOT NULL	None	CHECK allowed outcomes	success, denied, or failure
request_id	VARCHAR(100)	NULL	None	—	Correlation identifier
ip_prefix_hash	VARCHAR(128)	NULL	None	—	Optional privacy-minimized request correlation
metadata	JSONB	NOT NULL	'{}'	Allowlisted non-sensitive fields only	Minimal operational context
created_at	TIMESTAMPTZ	NOT NULL	now()	—	Event timestamp

Audit events are append-only for ordinary application roles. Do not include raw share tokens, passwords, access tokens, full prompts, extracted text, summaries, or uploaded document contents.

Retention of security logs must be defined separately from medical-record retention.

5. Foreign Keys & Referential Integrity Rules
Use ON UPDATE RESTRICT for all foreign keys unless a specific migration requires a reviewed alternative. UUID primary keys are immutable.
Child table.column	Parent table.column	ON DELETE	Reason
user_profiles.user_id	auth.users.id	CASCADE	Profile is dependent on identity
family_workspaces.owner_user_id	auth.users.id	RESTRICT during normal operation; controlled account-deletion workflow required	Prevent accidental loss of a family vault
family_members.workspace_id	family_workspaces.id	CASCADE after permanent workspace deletion	Member profiles cannot exist without their workspace
medical_documents.workspace_id	family_workspaces.id	CASCADE after permanent workspace deletion	Documents belong to one workspace
medical_documents.family_member_id	family_members.id	RESTRICT during normal operation	Require controlled member/document deletion
document_versions.document_id	medical_documents.id	CASCADE after permanent document deletion	File versions are dependent
document_processing_jobs.document_version_id	document_versions.id	CASCADE after permanent deletion	Jobs are dependent on source versions
document_extractions.document_version_id	document_versions.id	CASCADE after permanent deletion	Extracted text is derived data
ai_summaries.document_version_id	document_versions.id	CASCADE after permanent deletion	Summaries are derived data
medical_measurements.document_version_id	document_versions.id	CASCADE after permanent deletion	Measurements require source provenance
medical_measurements.extraction_id	document_extractions.id	SET NULL when extraction is independently removed	Preserve a measurement only if its remaining source provenance is sufficient and policy permits
share_links.document_version_id	document_versions.id	CASCADE after permanent deletion	Shares cannot outlive the underlying content
share_links.created_by_user_id	auth.users.id	RESTRICT until shares are revoked and account deletion is coordinated	Prevent anonymous orphaned links
audit_events.actor_user_id	auth.users.id	SET NULL where permitted by the approved audit-retention policy	Preserve minimal security history without retaining an unnecessary identity link
audit_events.workspace_id	family_workspaces.id	SET NULL	Audit event may outlive workspace data according to approved retention policy
audit_events.document_id	medical_documents.id	SET NULL	Audit event may outlive the document
audit_events.share_link_id	share_links.id	SET NULL	Audit event may outlive the share record

Deletion workflow requirements
1. The owner requests deletion.
2. The backend authorizes the owner and marks the resource as deleted or pending deletion.
3. Existing share links are revoked immediately.
4. Normal search, timeline, document, and AI-context queries exclude the resource.
5. The recovery window is applied according to the approved retention policy.
6. The deletion worker deletes source files and derived objects from private storage.
7. The worker deletes or cascades the database records containing derived health information.
8. Completion is recorded only after all required deletion steps succeed or an explicit, disclosed exception is documented.
9. Failed deletion is retried and surfaced to restricted operational monitoring without exposing medical content.
10. Restoration is permitted only during the approved recovery window and never reactivates old share links.
Account deletion must be orchestrated before deleting the Supabase Auth identity if doing so would otherwise bypass storage cleanup or leave active share links.

6. Data Integrity Constraints & DB-Level Validation
The database must enforce the following invariants even when application validation is bypassed.
6.1 Required constraints
Entity	Constraint
family_workspaces	status must be one of the approved workspace statuses
family_members	display_name must not be blank after trimming
family_members	date_of_birth must not be in the future
family_members	purge_after must be later than deleted_at when both are present
medical_documents	title must not be blank after trimming
medical_documents	category must be one of the approved categories
medical_documents	Workspace and family-member references must agree
document_versions	version_number > 0
document_versions	file_size_bytes > 0 and no greater than the configured maximum
document_versions	SHA-256 value must have exactly 64 lowercase hexadecimal characters
document_versions	UNIQUE(document_id, version_number)
document_versions	storage_key must be unique
document_versions	At most one current version per document
document_processing_jobs	attempt_count >= 0
document_processing_jobs	idempotency_key must be unique
document_extractions	extraction_confidence must be within [0, 1] when present
ai_summaries	Successful summaries require non-empty summary_text
medical_measurements	At least one of value_numeric or value_text must be present
medical_measurements	Confidence must be within [0, 1] when present
medical_measurements	reference_low <= reference_high when both are present
share_links	At least one of include_original or include_summary must be true
share_links	expires_at > created_at
share_links	token_hash must be unique
audit_events	outcome must be one of the allowed values

6.2 Cross-table constraints
A normal CHECK constraint cannot verify an arbitrary related row. Cross-table integrity must be implemented with composite foreign keys, a controlled trigger, or a transaction-safe service-layer check.

Required invariants:
- A document's workspace_id must match the workspace of its family_member_id.
- A share link's creator must own the workspace containing the shared document.
- A processing job must not run against a deleted document or version.
- A deleted family member's documents cannot be used for new share links or AI requests.
- A document may have no more than one current version.
- A completed summary must reference the exact version processed.
- A measurement's extraction_id, if present, must refer to an extraction from the same document_version_id.
- A share link must not expose content outside its selected document version.
Use a partial unique index on document_versions(document_id) where is_current = true to enforce a single current version.
6.3 Idempotency and concurrency
- Job creation must be idempotent for the same logical operation and source version.
- Concurrent upload-finalization requests must not create duplicate versions.
- Version-number allocation must occur within a transaction or equivalent concurrency-safe operation.
- A worker must claim a queued job atomically before execution.
- Retries must not create duplicate successful summaries for the same source version and logical summary operation.
- Deletion and share access must coordinate so that a deletion request cannot leave a new active share link behind.

7. Query-Driven Indexing Strategy
Create indexes only for actual application query patterns.

Primary-key indexes and indexes created to enforce unique constraints are not repeated in the table below unless their purpose needs explanation.
Index	Type	Query pattern optimized
uq_family_workspaces_owner_id on family_workspaces(owner_user_id)	Unique B-tree, only if product enforces one workspace per owner	Fetch the owner's default workspace during sign-in
idx_family_members_workspace_active on family_members(workspace_id, created_at DESC)	Composite B-tree	List a workspace's family members in the UI
idx_family_members_workspace_deleted on family_members(workspace_id, deleted_at)	B-tree	Exclude deleted members or locate eligible records for trash/recovery
idx_medical_documents_workspace_member_created on medical_documents(workspace_id, family_member_id, created_at DESC)	Composite B-tree	Display a member's recent documents
idx_medical_documents_member_category_date on medical_documents(workspace_id, family_member_id, category, document_date DESC)	Composite B-tree	Filter a member's records by category and document date
idx_medical_documents_workspace_deleted on medical_documents(workspace_id, deleted_at)	B-tree	Exclude deleted documents and find records eligible for purge
uq_document_versions_document_version on document_versions(document_id, version_number)	Unique B-tree	Retrieve a particular version and prevent duplicate version numbers
uq_document_versions_current on document_versions(document_id) where is_current = true	Partial unique B-tree	Guarantee one current file version per document
uq_document_versions_storage_key on document_versions(storage_key)	Unique B-tree	Resolve a private object key and prevent duplicate storage references
idx_processing_jobs_queue on document_processing_jobs(status, created_at)	Composite B-tree	Claim queued jobs in creation order
idx_processing_jobs_version_type on document_processing_jobs(document_version_id, job_type, created_at DESC)	Composite B-tree	Check whether an operation has already been attempted for a version
idx_document_extractions_version_created on document_extractions(document_version_id, created_at DESC)	Composite B-tree	Retrieve extraction results for a document version
idx_ai_summaries_version_created on ai_summaries(document_version_id, created_at DESC)	Composite B-tree	Retrieve the latest successful summary for a document version
idx_measurements_version_date on medical_measurements(document_version_id, measured_on)	Composite B-tree	Retrieve measurements from a particular document
idx_measurements_test_date on medical_measurements(normalized_test_key, measured_on)	Composite B-tree	Compare measurements by normalized test identity and date
uq_share_links_token_hash on share_links(token_hash)	Unique B-tree	Resolve a share token after hashing it
idx_share_links_expiry on share_links(expires_at)	B-tree	Find expired links and clean up eligible metadata
idx_share_links_version on share_links(document_version_id)	B-tree	Revoke all links associated with a version
idx_audit_events_workspace_created on audit_events(workspace_id, created_at DESC)	Composite B-tree	Review security events for a workspace
idx_audit_events_document_created on audit_events(document_id, created_at DESC)	Composite B-tree	Review security events related to a document
idx_audit_events_created on audit_events(created_at)	B-tree	Apply audit retention and time-window queries

Indexing rules
- Add indexes for demonstrated query patterns, foreign-key access paths, and job-processing operations.
- Do not add an index to every column.
- Do not create a GIN index on extracted text, summaries, or JSONB metadata without an approved and tested search requirement.
- Do not store medical document text in a generic full-text index in the initial MVP.
- Search must be scoped by workspace and family member before filtering text or metadata.
- Validate query plans against realistic data before adding further indexes.

8. Data Ownership, Multi-Tenancy & Authorization Model
8.1 Ownership model
MedLab uses a workspace-owned data model.
- family_workspaces.owner_user_id identifies the sole owner.
- family_members.workspace_id establishes member ownership.
- medical_documents.workspace_id and medical_documents.family_member_id establish document scope.
- Derived entities inherit authorization from their source document version.
- Share links grant narrowly scoped, temporary access; they never confer workspace membership.
- Platform operators have no routine permission to read medical content.
Every resource access must be authorized by the backend against the authenticated user and the resource's current workspace ownership.

Never authorize access solely by a UUID, URL, object key, or frontend route.
8.2 RLS policy foundation
Enable RLS on every application-owned table that contains user-related data.

The policy model is deny-by-default.

Supabase database roles are not interchangeable:
- anon: unauthenticated database client.
- authenticated: authenticated Supabase user.
- service_role: privileged server-side role that bypasses RLS.
- admin: not a default Supabase database role. Any future operator role must be explicitly provisioned and scoped; it must not automatically receive health-data access.
Critical backend integration rule
If FastAPI connects using a privileged database credential, PostgreSQL RLS cannot be treated as the only authorization mechanism because privileged roles can bypass policies.

Therefore:
1. Ordinary authenticated operations must run with an RLS-enforced user context or a restricted database role that cannot bypass RLS.
2. If using PostgreSQL directly from FastAPI, set a verified per-request user context transaction-locally and ensure it cannot leak across pooled connections.
3. A user-context value must come from a verified Supabase access token, never from an arbitrary client-supplied header or body field.
4. Service-role credentials may be used only for explicitly privileged background operations.
5. All privileged operations must perform their own ownership/resource checks and write security audit events.
6. Test RLS directly, independently of the application UI.
8.3 RLS policy matrix
The following matrix specifies intended effective permissions. It is the security contract for the database implementation.
Table	anon	authenticated	admin	service_role
user_profiles	No access	Own profile only	No routine access	Restricted operational use
family_workspaces	No access	Own workspace only	No routine content access	Restricted background operations
family_members	No access	Members in own workspace only	No routine content access	Restricted background operations
medical_documents	No access	Documents in own workspace only	No routine content access	Restricted background operations
document_versions	No access	Versions belonging to own workspace only	No routine content access	Restricted background operations
document_processing_jobs	No access	Read status for own workspace; no arbitrary job manipulation	No routine content access	Worker operations only
document_extractions	No access	Extractions belonging to own workspace only	No routine content access	Restricted processing/deletion operations
ai_summaries	No direct database access	Summaries belonging to own workspace only	No routine content access	Restricted processing/deletion operations
medical_measurements	No access	Measurements belonging to own workspace only	No routine content access	Restricted processing/deletion operations
share_links	No direct database access	Create, list, and revoke links for own documents	No routine content access	Restricted share-resolution/cleanup operations
audit_events	No access	No general read; owner-visible security events only if explicitly approved	Metadata-only access if explicitly authorized	Append and restricted retention operations

Share-link exception: An unauthenticated recipient must access shared content through a dedicated FastAPI endpoint. The endpoint validates the raw token against the stored hash and verifies expiration, revocation, selected content, and document lifecycle state. It does not grant the recipient direct anon table access.
8.4 CRUD policy logic
For tables containing workspace-owned records:
- SELECT: Allow only when the authenticated user owns the workspace reached through the record's parent relationships.
- INSERT: Require the target workspace to be owned by the authenticated user and all parent references to belong to that workspace.
- UPDATE: Require ownership before the mutation and validate ownership and lifecycle state after the mutation. Prevent moving a record into a foreign workspace.
- DELETE: Do not permit ordinary hard deletes of medical content. Use the controlled recoverable-deletion workflow and privileged permanent-purge operation.
- Child-table access: Resolve authorization through the document version and parent document; never trust a supplied child UUID independently.
- Service operations: Must be limited to explicit tasks, including processing, retention, and authorized permanent deletion.
The actual policy definitions must be implemented and tested for every application-owned table. A broad policy such as "all authenticated users can read all rows" is prohibited.

9. Sensitive Data, PII & Encryption Handling
9.1 Sensitive data inventory
Data	Storage location	Classification	Required handling
Auth email and password credentials	Supabase Auth	Sensitive identity data	Use provider-managed authentication and password hashing
User display name	user_profiles	Personal information	Return only to the authenticated owner
Family-member names and birth dates	family_members	Personal information	Minimize collection and restrict to the owning workspace
Original medical files	Private Supabase Storage	Highly sensitive health data	Private bucket, authorized access, short-lived signed URLs
Original filenames and storage keys	document_versions	Sensitive metadata	Do not expose storage keys as public URLs
Extracted document text	document_extractions	Highly sensitive health data	Restrict database access; redact logs; purge with source
AI-generated summaries	ai_summaries	Highly sensitive derived health data	Same access and deletion controls as the source
Structured measurements	medical_measurements	Highly sensitive health data	Preserve provenance and restrict by workspace
Share token hashes	share_links	Security-sensitive	Never log; never expose in ordinary responses
Raw share tokens	Owner's initial link creation response only	Bearer secret	Return only when created; do not persist in plaintext
Provider credentials	Backend environment/secret manager	Secret	Never store in application tables
Audit metadata	audit_events	Security-sensitive operational data	Minimize identifying data and enforce retention

9.2 Encryption requirements
- Use HTTPS/TLS for browser-to-backend, backend-to-database, and backend-to-storage traffic.
- Require the provider's supported encryption-at-rest protections for database storage, backups, and file objects.
- Confirm that the selected Supabase plan, configuration, and deployment region meet the product's approved privacy and security requirements.
- Do not claim application-level encryption for data unless it is explicitly implemented and key-managed.
- Never store passwords directly. Supabase Auth manages credential storage and password hashing.
- Use cryptographically secure random values for share tokens and other bearer secrets.
- Store a cryptographic hash of each share token; compare hashes safely and never store the raw token.
- Do not use reversible encryption where a one-way token hash is sufficient.
9.3 API response restrictions
Never return the following in standard API responses:
- Database connection strings.
- Supabase service-role keys or provider API keys.
- Password hashes, authentication refresh tokens, or session secrets.
- Raw share tokens except the one-time share-creation response.
- Private storage credentials or permanent public file URLs.
- Full internal provider request/response payloads.
- Internal stack traces or raw database error messages.
Sensitive medical content may be returned only to a properly authorized owner or to a valid share recipient for the explicitly selected content.
9.4 Logging restrictions
Never log:
- Full medical document contents.
- Extracted medical text.
- AI summaries or full AI conversations.
- Raw file bytes.
- Passwords, authorization headers, or tokens.
- Raw share URLs containing bearer tokens.
- Provider API keys or database connection strings.
Log safe identifiers, operation types, status codes, durations, attempt counts, and non-sensitive error codes.
9.5 Third-party AI data
Before sending health data through OpenRouter, verify and document:
- Which downstream model providers may process the request.
- Data retention and training policies.
- Available privacy controls and processing locations.
- Whether the chosen provider is approved for the intended jurisdiction and use.
- Whether the prompt can be minimized to avoid sending unnecessary identifiers.
- Whether fallback routing preserves the same privacy requirements.
Do not silently fall back to a model/provider whose data-handling policy has not been approved.

10. AI / Vector & Unstructured Storage
10.1 Vector database: N/A for the initial MVP
MedLab does not require a vector database for its initial approved scope.

The first version can retrieve relevant records using:
- Authorized document metadata queries.
- Extracted text associated with the selected document.
- Structured measurements and their provenance.
- Approved medical reference retrieval through the selected backend integration.
Do not add pgvector, a dedicated vector database, embedding tables, or an external vector-search service without an explicit product and architecture decision.

If semantic retrieval becomes necessary, it requires a separately approved design covering embedding dimensions, model identity, similarity metric, tenant filtering, deletion propagation, and provider privacy.
10.2 Private object-storage layout
Use a private Supabase Storage bucket:

- medical-documents

Object keys must follow a stable, non-public structure:

<workspace_id>/<document_id>/<document_version_id>/<randomized_filename>

Rules:
1. Generate object keys on the backend.
2. Do not include medical details or names in object keys.
3. Never use the original filename as the storage path.
4. Never make the bucket public.
5. Store the bucket name and object key in document_versions, not a permanent public URL.
6. Validate file type, size, and content signatures before processing.
7. Use short-lived signed URLs only after authorization, or proxy file access through the backend where required.
8. Recheck share-link status before returning shared content.
9. Ensure deletion and restoration workflows coordinate database state and object storage.
10. Do not treat a hard-to-guess object key as an authorization mechanism.
10.3 Upload and processing lifecycle
1. Authorize the user and target family member.
2. Validate metadata and approved file limits.
3. Upload the file to private storage using a controlled upload flow.
4. Verify the uploaded object and calculate its content digest.
5. Create or finalize the document and version records transactionally where possible.
6. Enqueue idempotent processing jobs.
7. Extract text or structured values using the approved extraction method.
8. Generate a summary using an approved model/provider.
9. Save derived results with exact source-version provenance.
10. Expose processing status to the owner.
If processing fails, the original file remains available. Failed jobs must be retryable without duplicating successful output.

11. Migrations, Seeding & Lifecycle Strategy
11.1 Migration workflow
Use Alembic to manage PostgreSQL schema changes.
- Every schema change must have a reviewed, versioned migration.
- Do not create or alter production tables manually outside the migration process.
- Test migrations against a disposable or staging database before production.
- Separate schema migration from large-scale data backfills.
- Review destructive operations, foreign-key changes, new constraints, and index creation before deployment.
- Never edit an already-applied migration to change production history.
- Do not run migrations independently from multiple application instances at startup.
- Run migrations as a single controlled deployment step.
- Keep frontend and backend deployments compatible with the currently deployed schema.
11.2 Environment lifecycle
Environment	Data policy	Migration rule
Local development	Synthetic, non-identifiable test records	Apply all migrations from the initial baseline
Automated tests	Isolated disposable database and synthetic fixtures	Apply migrations from a clean database before integration tests
Preview/staging	Synthetic or explicitly approved de-identified test data	Run and verify migrations before deployment
Production	Real user data	Backup/restore readiness and migration review before applying changes

Do not copy production medical documents into development or staging for convenience.
11.3 Seed data blueprint
Local development may seed the following synthetic data:
- One development owner identity created through the approved Supabase Auth setup.
- One family workspace.
- Three synthetic family-member profiles.
- A small set of synthetic medical documents spanning approved categories.
- Multiple document versions for at least one synthetic document.
- Processing jobs covering queued, running, succeeded, and failed states.
- Synthetic extraction records with successful, partial, and failed outcomes.
- Successful and failed summary examples.
- Several clearly synthetic measurements with compatible and incompatible units.
- Active, expired, and revoked share-link fixtures using non-production test tokens.
- Audit-event fixtures for successful and denied operations.
Seed restrictions
- Never seed a default production administrator.
- Never seed real medical information.
- Never seed usable production bearer tokens or API credentials.
- Do not disable RLS to make seed data convenient.
- Keep fixture creation idempotent and isolated from production.
- Production setup must not create publicly accessible sample medical documents.
11.4 Safe migration rules
Adding a non-null column
1. Add the column as nullable or with a safe default.
2. Deploy application code that can read both old and new states.
3. Backfill existing rows in controlled batches.
4. Verify completeness.
5. Add the NOT NULL constraint in a separate reviewed migration.
Renaming a column
1. Add the new column.
2. Support both columns temporarily if a rolling deployment requires it.
3. Backfill existing values.
4. Switch application reads and writes.
5. Verify usage and data parity.
6. Remove the old column in a later deployment.
Changing constraints
- Validate existing data before enforcing a new constraint.
- Resolve invalid rows before making the constraint mandatory.
- Avoid large table rewrites during peak traffic.
- Use concurrent index creation where appropriate and supported by the migration tool.
- Ensure the migration runner handles operations that cannot execute inside a transaction separately.
Rollback
- Prefer forward fixes for destructive or data-transforming changes.
- Take and verify backups according to the approved recovery plan before risky migrations.
- Never assume a down migration can reconstruct deleted medical data.
- Do not deploy application code that requires a schema change before that schema change has completed.

12. Backup, Retention & Recovery Considerations
12.1 Backup requirements
Before public launch, document and approve:
- The Supabase database backup plan and frequency.
- Whether Point-in-Time Recovery (PITR) is available on the selected plan and enabled.
- The recovery-point objective (RPO) and recovery-time objective (RTO).
- Retention of database backups.
- Protection and recovery of Supabase Storage objects.
- Who can access backups and how access is audited.
- A tested restoration procedure.
- How restored environments are prevented from sending real user data to unapproved AI providers.
Database backups and Storage object backups are separate concerns. A database restore does not guarantee that every referenced file object is still available.
12.2 Retention policy
Data type	Retention rule
Active family profiles	Retained while the workspace is active and the account is authorized
Active medical documents	Retained until owner deletion or another approved lawful deletion requirement
Trashed documents	Recoverable only for the explicitly approved retention window
Document versions	Deleted with the parent document after permanent deletion is authorized
Extracted text	Deleted with its source document under the permanent-deletion workflow
AI summaries	Deleted with their source document/version
Medical measurements	Deleted with their source document/version
Processing jobs	Retained only as long as needed for retry, troubleshooting, and approved operational audit
Share links	Access expires at expires_at and ends immediately at revocation
Share-link metadata	Purged according to approved security-log and link-retention rules
Audit events	Retained for a documented, approved security-retention period
Database backups	Retained according to the documented backup plan and disclosed deletion limitations
AI-provider data	Governed by the approved provider's documented data terms and configuration

The trash retention period, audit-log retention period, backup retention period, and jurisdiction-specific deletion obligations are not yet locked. Do not invent these as final policy values.
12.3 Point-in-Time Recovery
PITR is recommended if the selected Supabase plan supports it and the recovery requirements justify the cost.

If PITR is unavailable:
- Establish the supported backup frequency.
- Document the maximum expected data-loss window.
- Test restoration from available backups.
- Confirm how file objects are reconciled after a restore.
- Do not claim point-in-time recovery capability without verifying the deployed plan.
12.4 Recovery and reconciliation
After a restore:
1. Verify database schema and migration version.
2. Verify workspace and ownership relationships.
3. Check referenced storage objects for existence.
4. Identify orphaned storage objects and missing file references.
5. Verify share links are not accidentally reactivated if they were revoked after the restored point.
6. Reconcile processing jobs that were running at the recovery point.
7. Ensure deletion jobs do not incorrectly restore permanently deleted content.
8. Verify RLS policies and role grants.
9. Confirm that restored records remain scoped to the correct owner.
10. Complete a security and integrity check before returning the service to normal use.
12.5 Account deletion and privacy obligations
Account deletion must be a controlled workflow, not a simple deletion of the Supabase Auth identity.

The workflow must:
- Confirm the request is authorized.
- Revoke active share links.
- Prevent new uploads and processing for the account being deleted.
- Delete or retain family records according to the approved authority and retention policy.
- Remove original files and all eligible derived health data.
- Delete or anonymize identity links in audit events where policy permits.
- Respect documented legal retention obligations.
- Record the outcome without preserving unnecessary health content.
- Handle external provider and backup retention according to the published privacy policy.
A family owner's account deletion can affect records belonging to other family members. The product owner must approve the legal and operational policy for this situation before public launch.
12.6 Launch-blocking decisions
The following decisions require explicit approval and documentation:
1. Initial jurisdictions: Which countries or regions are approved for launch and data processing?
2. Owner authority: What safeguards apply when records represent adults, children, or dependants?
3. Trash retention: How long can deleted records be restored?
4. Backup retention: How long do backups persist after account or record deletion?
5. AI providers: Which downstream providers and models are approved to process medical information?
6. File limits: What are the maximum file size, allowed MIME types, and per-workspace storage limits?
7. Audit retention: How long are security events retained, and which events may be visible to the owner?
8. Conversation retention: Confirm that AI conversations remain session-only unless a later decision approves persistence.
9. Recovery targets: What RPO/RTO and backup plan are required for the public release?
These decisions must not be silently replaced by implementation defaults.

Final implementation rules
1. PostgreSQL is the system of record for application metadata and derived structured data.
2. Supabase Auth remains the identity authority.
3. Supabase Storage remains private and stores original file objects.
4. FastAPI owns business logic, authorization, AI orchestration, and lifecycle workflows.
5. RLS must be enabled and independently tested.
6. Every resource lookup must enforce workspace ownership or a validated, narrowly scoped share grant.
7. All derived medical data must retain source-version provenance.
8. Document deletion must revoke shares and remove eligible derived data.
9. AI provider fallback must respect approved privacy and cost constraints.
10. Do not add tables, vector stores, caching infrastructure, or distributed systems without an approved requirement.
11. Do not use real medical information in seeds, tests, or non-production environments.
12. Do not launch publicly until the security, privacy, authority, retention, and recovery decisions above have been approved and tested.