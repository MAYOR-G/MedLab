# MedLab — Product Requirements Document (PRD)

**Document status:** Draft for approval  
**Product:** MedLab  
**Version:** 1.0 MVP  
**Purpose:** Single source of truth for product scope and implementation requirements  
**Audience:** Product owner, designers, AI coding agents, developers, QA, and deployment operators

---

## 1. Project Overview & Executive Summary

### 1.1 Problem Statement

Families often keep medical reports, laboratory results, prescriptions, scans, and other health documents across paper folders, email attachments, messaging apps, and individual devices. This makes records difficult to organize, retrieve, compare over time, and explain to people without medical training. Sharing a record can also expose more information than intended or leave copies accessible longer than expected.

MedLab addresses this problem with a family-focused medical document vault and an AI assistant that explains uploaded records in plain English.

### 1.2 Value Proposition

MedLab provides one place for a designated family owner to:

- Store and retrieve supported medical documents.
- Organize records by family member, category, and date.
- Read saved, plain-English AI summaries alongside original documents.
- Ask questions about one document or a person's uploaded history.
- Compare comparable measurements over time when source data is sufficiently clear.
- Share selected document content through revocable, expiring links.

**Product principle:** Preserve the original medical record as the source of truth. AI-generated content is explanatory, may be incomplete, and must not be presented as a diagnosis or as a replacement for professional medical advice.

### 1.3 Target Users & Personas

| Persona | Description | Primary goals |
|---|---|---|
| Family owner | Primary account holder who manages the family workspace and records | Upload, organize, understand, retrieve, and share family records |
| Family member represented in records | A child, dependant, or other family member whose documents are managed by the owner | Have their records represented accurately and handled according to applicable authorization and privacy requirements |
| Share-link recipient | A person who receives an authorized temporary link, such as a family member or healthcare professional | View only the content selected by the owner until access expires or is revoked |
| Unauthenticated visitor | A person who has not signed in | Understand the product, register, or sign in |
| Platform operator | Authorized technical operator responsible for service reliability and security | Maintain service health without routine access to private medical content |

The agreed MVP uses an **owner-managed family model**. The owner is intended to manage all family members' records. Before public launch, this model must be reviewed against applicable consent, guardianship, and adult-record access requirements. The application must not assume that biological or household relationships automatically confer legal authority.

### 1.4 Approved Tech Stack

| Layer | Approved choice | Responsibility |
|---|---|---|
| Frontend | Next.js + TypeScript | Responsive web application and user interface |
| Styling | Tailwind CSS | Consistent responsive styling |
| Backend API | Python + FastAPI on Railway | Authorization, business rules, orchestration, document processing, AI calls, and share access |
| Database | Supabase Postgres | Persistent application records and metadata |
| Authentication | Supabase Auth | Email/password, email verification, password recovery, and Google sign-in |
| File storage | Private Supabase Storage buckets | Original medical documents and generated artifacts where appropriate |
| AI gateway | OpenRouter | Access to approved language models, subject to provider-specific privacy and routing controls |
| Medical references | Reputable government health agencies and established medical institutions | Contextual explanations of medical terms and health information |
| Frontend hosting | Vercel | Web application deployment |
| Backend hosting | Railway | FastAPI service and background-processing capability |

#### Architectural constraints

- The frontend must not contain service-role keys, AI API keys, or other privileged secrets.
- The backend must be the enforcement point for sensitive business rules and authorization. Hiding UI controls is not authorization.
- Supabase Row Level Security (RLS) must be configured for applicable user-accessible database tables. Backend service-role access must be tightly restricted and must never be exposed to clients.
- Private documents must not be stored on an ephemeral application filesystem as their permanent home.
- AI provider selection must be configurable and restricted to an approved list; automatic fallback must not bypass privacy requirements.
- Do not add a payment system, separate vector database, analytics platform, or additional infrastructure unless approved.

---

## 2. Core User Journeys & User Stories

### 2.1 Journey A — Register and create a family workspace

1. Visitor opens the public landing page.
2. Visitor chooses registration or sign-in.
3. User registers with email/password or Google.
4. Email verification is completed when required by the configured authentication flow.
5. User enters the authenticated application and creates or confirms the family workspace.
6. User adds a family-member profile and opens the member's record area.

**Completion outcome:** An authenticated owner can access an empty family workspace and begin adding records.

### 2.2 Journey B — Upload and understand a medical document

1. Owner selects a family member.
2. Owner chooses **Upload document**.
3. User selects a supported file and enters available metadata, such as document title, category, document date, and optional notes.
4. The application validates file type and size before upload and repeats relevant validation on the server.
5. Original file is stored privately. The database records its owner, family member, metadata, and processing status.
6. The interface confirms the original has been saved and shows processing status.
7. Background processing extracts text or structured values where possible.
8. AI generates a plain-English summary using the extracted content and approved reference material as appropriate.
9. Summary and processing metadata are saved with the document.
10. User opens the document detail page to view the original, summary, extracted findings when available, and processing status.

**Completion outcome:** The original document remains available even if extraction or AI processing fails.

### 2.3 Journey C — Review history and compare results

1. Owner opens a family-member profile.
2. Owner browses a chronological timeline or filters by category/date.
3. Owner opens a document or the medical-history comparison view.
4. MedLab identifies candidate measurements from stored, source-grounded data.
5. Comparisons are shown only when the measurements are sufficiently comparable by test identity, units, dates, and available reference ranges.
6. The UI distinguishes reported values from AI interpretation and explains limitations.
7. If information is missing or inconsistent, MedLab reports that a reliable comparison cannot be made rather than inventing a conclusion.

**Completion outcome:** User can review historical records and supported trends without MedLab presenting a clinical diagnosis.

### 2.4 Journey D — Ask the AI assistant

1. Owner opens a document-specific assistant or the selected family member's history assistant.
2. The UI makes the active document or family member scope visible.
3. User enters a question.
4. Backend verifies authorization and retrieves only the relevant permitted records.
5. Backend sends the minimum necessary context to an approved model.
6. Assistant returns an answer grounded in available records and approved medical references where available.
7. The answer identifies uncertainty and does not fabricate missing data.
8. Conversation persistence, if enabled for the MVP, is limited to the relevant family-member scope and protected by the same access controls.

**Completion outcome:** User receives an understandable, appropriately qualified explanation tied to the correct person's records.

### 2.5 Journey E — Share a document temporarily

1. Owner opens a document and chooses **Share**.
2. Owner selects the allowed content: original file, AI summary, or both.
3. Owner selects an expiration duration from supported options. Initial examples agreed during discovery include one minute, one hour, and two days; the final duration list requires confirmation.
4. Backend generates a cryptographically secure, high-entropy token and stores only a secure representation of it where practical.
5. Application displays a copyable share link and its expiration.
6. Recipient opens the link and can access only the selected content while the link remains valid.
7. Backend checks expiry, revocation, and link status on every access.
8. Owner can revoke the link before expiry.
9. Expired or revoked links return an access-denied/expired experience and disclose no document content.

**Completion outcome:** Recipient receives temporary access to exactly the content selected by the owner.

**Limit:** MedLab can revoke future access but cannot guarantee deletion of a copy already downloaded, photographed, or otherwise retained by a recipient.

### 2.6 Journey F — Delete and recover a record

1. Owner selects a record and chooses **Move to trash**.
2. Application explains the recoverability/retention behaviour and asks for confirmation.
3. Record is removed from normal timelines and search results.
4. Record enters a recoverable deleted state and cannot be opened through ordinary document routes or new share links.
5. Existing share links are revoked when a record is deleted.
6. Authorized owner can restore the record during the retention window.
7. After the retention window, the system permanently deletes the original and associated derived data according to the approved deletion policy, subject to documented backup-retention limits and applicable legal obligations.

**Completion outcome:** User understands the distinction between recoverable deletion and permanent deletion.

### 2.7 User Stories and Acceptance Criteria

#### Authentication and workspace

**US-01 — Register**

As a visitor, I want to register with email/password or Google, so that I can securely access my family's records.

Acceptance criteria:
- Valid registration creates an authenticated account.
- Invalid email/password inputs receive clear validation feedback.
- Email verification is enforced when configured.
- Duplicate or failed registration does not create an inconsistent workspace.
- Privileged credentials are never sent to the browser.

**US-02 — Recover access**

As an account owner, I want to recover my account, so that I can regain access if I forget my password.

Acceptance criteria:
- Password reset uses Supabase Auth's secure recovery flow.
- Responses do not reveal whether arbitrary email addresses belong to accounts.
- Recovery links/tokens are time-limited according to provider configuration.

**US-03 — Manage family members**

As a family owner, I want to create and update family-member profiles, so that records can be organized for the right person.

Acceptance criteria:
- A profile can be created, viewed, and updated by its authorized owner.
- Every record is associated with the correct family workspace and family member.
- The UI makes the currently selected member clear.
- Deleting a profile cannot silently orphan or expose its records; the system must apply an explicit retention/transfer policy.

#### Document management

**US-04 — Upload a document**

As a family owner, I want to upload medical files, so that I can preserve records in one place.

Acceptance criteria:
- Only supported file types and configured size limits are accepted.
- Validation occurs client-side for usability and server-side for enforcement.
- Original file storage is private by default.
- A successful original upload is persisted even if downstream processing fails.
- Upload/processing failures are reported accurately and are retryable where safe.
- Duplicate retries do not create duplicate processing jobs or inconsistent records.

**US-05 — View and download a document**

As a family owner, I want to view and download an uploaded record, so that I can inspect or reuse the original.

Acceptance criteria:
- Only authorized users can obtain a document or a short-lived viewing/download URL.
- A document detail view shows original-file access, metadata, summary status, and processing errors when applicable.
- Downloaded content matches the stored original.
- Unsupported previews provide a download option rather than a broken viewer.

**US-06 — Organize records**

As a family owner, I want to browse records by date and category, so that I can find a record quickly.

Acceptance criteria:
- Records are scoped to the selected family member.
- Timeline ordering is deterministic, with a documented fallback when a document date is unknown.
- Category and date filters can be combined.
- Empty and no-results states offer a relevant next action.

**US-07 — Recover a deleted record**

As a family owner, I want to restore a record from trash, so that an accidental deletion is recoverable.

Acceptance criteria:
- Trash records are excluded from normal search and timeline views.
- Only authorized owners can restore records.
- Restoring a record does not silently reactivate old share links.
- Expired retention records cannot be restored after permanent deletion.

#### AI and history

**US-08 — Read an AI summary**

As a family owner, I want a plain-English summary of a medical document, so that I can understand what it reports.

Acceptance criteria:
- Summary is saved and associated with the correct document/version.
- Summary generation status is visible.
- Summary is labelled as AI-generated informational content.
- The system does not invent values or silently fill in missing measurements.
- Failure to generate a summary does not remove or corrupt the original.

**US-09 — Ask questions about records**

As a family owner, I want to ask questions about one document or one person's records, so that I can understand the information more easily.

Acceptance criteria:
- Requests are authorized and scoped to the selected document/person.
- One person's records are never included in another person's context.
- Answers distinguish source facts from interpretation and communicate uncertainty.
- The assistant does not claim to diagnose, prescribe, or replace a clinician.
- Requests that exceed configured limits fail gracefully and do not trigger unlimited retries.

**US-10 — Compare historical measurements**

As a family owner, I want to compare supported measurements over time, so that I can understand changes in reported results.

Acceptance criteria:
- Comparisons use identifiable matching tests and compatible units.
- Dates and source documents are available to inspect.
- Reference ranges are shown only when provided by or reliably associated with the source.
- Incompatible or ambiguous results are excluded or clearly marked as not comparable.
- Trend descriptions do not assert a diagnosis or imply causation.

#### Sharing

**US-11 — Create a share link**

As a family owner, I want to share selected document content through an expiring link, so that a recipient can access it temporarily.

Acceptance criteria:
- Owner selects original, summary, or both.
- Link token is unguessable and not derived from document IDs.
- Expiry is enforced by the backend at every access.
- The recipient sees no additional family records or account metadata.
- Link creation, expiry, and revocation states are clear.

**US-12 — Revoke a share link**

As a family owner, I want to revoke a share link, so that future access ends before its scheduled expiry.

Acceptance criteria:
- Revocation takes effect on the next server-side access check.
- Revoked links disclose no content.
- Revoking one link does not alter the underlying original or other links.
- Access logging avoids storing the full bearer token.

#### Reliability and settings

**US-13 — Retry failed processing**

As a family owner, I want MedLab to retry failed AI processing safely, so that temporary provider failures do not block use of my documents.

Acceptance criteria:
- Original document remains available.
- Retry attempts are bounded and idempotent.
- Fallback models are drawn only from an approved configuration.
- Fallback does not bypass provider privacy requirements or budget controls.
- Final failure is visible with a retry path when allowed.

**US-14 — Understand data handling**

As a family owner, I want clear information about AI processing, deletion, and sharing, so that I can make informed choices about sensitive records.

Acceptance criteria:
- The application explains that AI providers may process relevant document content.
- Privacy and retention disclosures match actual implementation and provider terms.
- Recoverable deletion duration and permanent-deletion behaviour are stated.
- Share-link limitations are explained before or during link creation.

---

## 3. Features & Functional Requirements

Priority definitions:
- **P0 — Must Have for MVP:** Required for a safe, usable release.
- **P1 — Important:** Expected in the MVP if feasible; may be staged with explicit approval.
- **P2 — Future/Nice-to-Have:** Excluded from the initial MVP unless approved.

### 3.1 Public site and authentication

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| AUTH-01 | P0 | Provide landing page, registration, sign-in, sign-out, and authenticated route protection. | Authenticated routes must not render sensitive data before authorization succeeds. |
| AUTH-02 | P0 | Support email/password and Google sign-in through Supabase Auth. | Handle cancelled OAuth, invalid credentials, duplicate identities, expired sessions, and provider errors. |
| AUTH-03 | P0 | Support email verification and password reset. | Do not disclose account existence in recovery responses. |
| AUTH-04 | P0 | Create or initialize an owner workspace after successful first sign-in. | Workspace initialization must be idempotent; retries must not create duplicate workspaces. |
| AUTH-05 | P1 | Support optional multi-factor authentication if available through the approved Supabase configuration. | Do not claim MFA is active unless it is implemented and tested. |

### 3.2 Family profiles and access

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| FAM-01 | P0 | Allow the owner to create, view, and edit family-member profiles. | Collect only necessary profile information; do not require a full date of birth unless justified. |
| FAM-02 | P0 | Associate each record with exactly one family workspace and intended family member. | Reject missing, foreign, or mismatched ownership references. |
| FAM-03 | P0 | Show selected family-member context clearly across records and AI interactions. | Switching member must clear or replace prior member-specific context. |
| FAM-04 | P0 | Enforce server-side authorization for all family and record operations. | Never rely only on client-supplied family-member IDs. |
| FAM-05 | P0 | Document and implement the approved owner-authority model before public launch. | Legal authority, guardianship, consent, and adult-record access require review for intended launch jurisdictions. |
| FAM-06 | P1 | Allow owner to archive or remove a family-member profile under a defined data-retention policy. | No silent cascade deletion; define how records are retained, restored, or permanently removed. |

### 3.3 Upload and document storage

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| DOC-01 | P0 | Accept PDF reports, JPEG/PNG photos or scans, prescriptions, lab reports, and other explicitly supported medical files. | “Other medical files” does not mean every format. Publish the supported MIME/extension list. |
| DOC-02 | P0 | Enforce configurable file-size limits and supported content types. | Validate extension, MIME type, and file signature where practical. Reject executable or unsupported content. |
| DOC-03 | P0 | Store originals in private Supabase Storage. | No public buckets or permanent public URLs for medical documents. |
| DOC-04 | P0 | Save document metadata, ownership, storage key, and processing state. | Metadata and storage operations must handle partial failure and safe cleanup. |
| DOC-05 | P0 | Permit authorized viewing and downloading of originals. | Use short-lived signed URLs or an equivalently protected access mechanism. |
| DOC-06 | P0 | Support title, category, document date when known, upload timestamp, and optional notes. | Unknown document dates remain unknown; do not fabricate dates from upload time. |
| DOC-07 | P0 | Provide processing status independently of upload status. | A stored original can be successful while extraction or AI processing has failed. |
| DOC-08 | P0 | Retry safe operations without duplicate records or duplicate jobs. | Use idempotency keys or equivalent deduplication for retried requests/jobs. |
| DOC-09 | P1 | Extract text from supported PDFs and images, using OCR when required. | Low-quality, rotated, handwritten, encrypted, or corrupt files may fail; communicate this without losing the original. |
| DOC-10 | P1 | Provide an in-browser preview for supported file types. | If preview fails, retain a secure download option. |

### 3.4 AI summaries and assistant

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| AI-01 | P0 | Generate and persist a plain-English summary for supported documents. | Summary must be linked to the document and its processing/version state. |
| AI-02 | P0 | Label AI output as informational and not a medical diagnosis. | Do not imply clinician review unless a clinician has actually reviewed it. |
| AI-03 | P0 | Ground generated summaries in extracted source content. | Missing or unreadable information must not be invented. |
| AI-04 | P0 | Show summary status and errors separately from original-file status. | Original remains available on AI failure. |
| AI-05 | P0 | Scope AI context to the selected document or selected individual's records. | Cross-family or cross-member context leakage is a release-blocking defect. |
| AI-06 | P0 | Enforce configured request/token/cost limits and bounded retries. | Do not retry indefinitely or repeatedly bill for the same failed operation. |
| AI-07 | P0 | Support automatic fallback to an approved alternative model. | Fallback is permitted only if provider privacy terms, data handling, supported inputs, and budget limits meet configured requirements. |
| AI-08 | P0 | Use trusted medical references for relevant medical explanations when available. | External references provide context, not proof that a specific patient's result has been correctly interpreted. |
| AI-09 | P0 | Communicate uncertainty, conflicting information, and unsupported questions. | Do not make definitive diagnosis, treatment, or medication decisions. Urgent or potentially serious symptoms should receive an appropriate prompt to seek professional or emergency care, without attempting diagnosis. |
| AI-10 | P0 | Provide a document-scoped and person-scoped question-answering experience. | Retrieval must apply authorization filters before content reaches the model. |
| AI-11 | P0 | Support comparisons of compatible historical measurements. | Compare only sufficiently matching tests and compatible units; preserve source, date, and available ranges. |
| AI-12 | P1 | Store AI conversation history for later retrieval. | This was not explicitly finalized. If included, scope and retention must be approved; otherwise treat conversations as session-only. |
| AI-13 | P1 | Store extracted structured values with source provenance and confidence/quality indicators. | Low-confidence values must be flagged or excluded from comparisons. |

### 3.5 Medical history and search

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| HIST-01 | P0 | Display records in a chronological timeline. | Use document date when available, with a visible fallback to upload date. |
| HIST-02 | P0 | Filter records by category and date. | Filters must remain scoped to the selected member. |
| HIST-03 | P0 | Display saved summaries and processing state from the document detail view. | Never show a stale summary as current after the source document or extraction is changed without marking its version/state. |
| HIST-04 | P0 | Compare compatible historical results. | Different tests, units, methods, or reference ranges must not be treated as equivalent without a reliable conversion/matching rule. |
| HIST-05 | P1 | Search document titles, categories, notes, and extracted text where available. | Search must exclude deleted records and obey the same authorization rules as direct document access. |

### 3.6 Sharing

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| SHARE-01 | P0 | Create an unlisted, high-entropy share link for selected content. | Do not use sequential IDs or predictable tokens. |
| SHARE-02 | P0 | Allow owner to choose original, AI summary, or both. | Recipient must not gain access to unrelated metadata or other family records. |
| SHARE-03 | P0 | Support configured expiration durations. | Initial proposed examples: one minute, one hour, and two days. Exact options and minimum/maximum duration require approval. |
| SHARE-04 | P0 | Enforce expiry and revocation on every request. | Client-side countdown or hidden UI is insufficient. Expired/revoked links must not serve cached private content through the application. |
| SHARE-05 | P0 | Allow owner to revoke an active link. | Revocation must take effect on subsequent access checks. |
| SHARE-06 | P0 | Log share creation, revocation, and relevant access events without logging bearer tokens or medical content. | Define a limited retention policy for security logs. |
| SHARE-07 | P0 | Explain link limitations. | Recipients may download or copy content before expiry; MedLab cannot revoke those copies. |
| SHARE-08 | P1 | Provide a view of active, expired, and revoked links. | Do not expose a share token unnecessarily in dashboard lists. |

### 3.7 Deletion and retention

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| DEL-01 | P0 | Allow an owner to move a document to recoverable trash. | Removed records must not appear in normal timeline, search, AI retrieval, or new sharing flows. |
| DEL-02 | P0 | Allow recovery within a configured retention window. | Restoration must revalidate storage availability and must not reactivate prior links. |
| DEL-03 | P0 | Revoke active share links when a document is deleted. | Do not assume link expiry alone is sufficient. |
| DEL-04 | P0 | Permanently delete originals and associated derived data after the retention period, subject to disclosed backup constraints and legal obligations. | Include summaries, extracted text, embeddings if any, and derived artifacts. |
| DEL-05 | P0 | Define retention for backups, logs, and provider-held data. | Do not promise immediate erasure from backups or third-party systems unless verified by their documented behaviour and terms. |
| DEL-06 | P1 | Allow account/workspace deletion with a confirmation and clear explanation of impact. | Define how family members, records, share links, and recoverable items are handled before enabling. |

### 3.8 Reliability, operations, and minimal notifications

| ID | Priority | Requirement | Business rules / edge cases |
|---|---|---|---|
| OPS-01 | P0 | Use background processing for extraction and AI work that may take longer than a normal request. | Job state must be persisted; interrupted jobs must be recoverable. |
| OPS-02 | P0 | Use bounded retries, idempotency, timeouts, and exponential backoff where appropriate. | Do not retry permanent validation errors. |
| OPS-03 | P0 | Enforce rate limits and per-user/family usage limits. | Protect against abuse and unexpected AI bills. |
| OPS-04 | P0 | Provide minimal in-app processing status and error feedback. | Separate email notifications and a notification centre are not required for MVP. |
| OPS-05 | P0 | Record operational errors without logging document contents, full prompts, credentials, or share tokens. | Redact sensitive values from logs and exception reports. |
| OPS-06 | P0 | Provide health checks and actionable service monitoring. | Monitoring must not expose protected medical data. |
| OPS-07 | P1 | Provide basic usage/cost telemetry at an aggregate or appropriately minimized level. | Avoid retaining raw medical content for analytics. |

---

## 4. Pages, Screens & Navigation Flow

Route names below are proposed defaults and may be adjusted during design. Private routes must enforce authentication and authorization server-side.

| Route | Screen | Main components | Primary actions / navigation |
|---|---|---|---|
| `/` | Public landing page | Product explanation, privacy/AI disclaimers, primary CTA, sign-in link | Register or sign in |
| `/auth/sign-up` | Registration | Email/password form, Google sign-in, validation and terms/privacy links | Create account |
| `/auth/sign-in` | Sign-in | Email/password, Google sign-in, password reset link | Authenticate |
| `/auth/forgot-password` | Password recovery | Email field, generic confirmation state | Start recovery |
| `/auth/callback` | Authentication callback | Session completion/error state | Redirect to intended route |
| `/auth/verify` | Verification result | Verification status and next steps | Continue to dashboard or retry |
| `/dashboard` | Family dashboard | Family-member selector/list, recent records, upload CTA, processing status | Select member, upload, open record |
| `/family` | Family members | Member cards/list, add/edit actions | Open member or profile form |
| `/family/new` | Add family member | Profile form with minimal necessary fields | Save and open member |
| `/family/[memberId]` | Member overview | Member header, timeline, category/date filters, upload CTA, comparison entry point | Open document, upload, compare |
| `/family/[memberId]/edit` | Edit member | Editable profile fields | Save or cancel |
| `/documents/upload` | Upload document | File picker/drop zone, member selector, metadata fields, validation/progress | Upload and open processing state |
| `/documents/[documentId]` | Document detail | Secure preview/download, metadata, AI summary, status/errors, share/delete actions | Ask AI, share, edit metadata, move to trash |
| `/documents/[documentId]/edit` | Edit document metadata | Title, category, date, notes | Save changes |
| `/family/[memberId]/assistant` | Member-scoped AI assistant | Chat/question input, active-member indicator, source references and uncertainty labels | Ask questions about authorized records |
| `/documents/[documentId]/assistant` | Document-scoped AI assistant | Document context, question input, source-grounded answer | Ask about one document |
| `/family/[memberId]/history` | History comparison | Supported measurement series/table, source/date references, comparability warnings | Inspect supporting records |
| `/shares` | Share management | Active/expired/revoked share list, expiry and content type | Inspect or revoke link |
| `/shares/[shareId]` | Share detail (owner) | Link status, selected content, expiry, revoke action | Revoke link |
| `/trash` | Recoverable trash | Deleted records, deletion date, restore action, retention notice | Restore record |
| `/settings` | Account/settings | Account information, session/security options, privacy and retention explanations | Update available settings, sign out |
| `/share/[token]` | Recipient share page | Expiry/access status, only owner-selected content, download/preview when allowed | View permitted content |
| `/privacy` | Privacy information | Data handling, AI processing, retention, sharing limitations | Return to app |
| `/terms` | Terms of use | Product terms and medical-information limitations | Return to app |
| Not found | 404 | Clear message and safe navigation | Return to landing/dashboard |
| Unauthorized/expired share | Access error | Generic expired, revoked, or unavailable message | Return to landing page |

### Navigation rules

- Authenticated application navigation should prioritize Dashboard, Family, and account/settings access.
- A selected family-member context must remain visible on that member's pages.
- Upload flows must start with or explicitly confirm the target family member.
- AI screens must clearly indicate whether their context is one document or one family member's history.
- Share recipient routes must not expose authenticated application navigation or unrelated family data.
- Do not disclose whether a private document or share token exists when the requester is unauthorized, beyond the minimum useful status required for a legitimate recipient experience.
- Modal/dialog inventory includes: add/edit family member, upload metadata/confirmation, share-link creation, revoke confirmation, move-to-trash confirmation, restore confirmation, and destructive account/workspace actions if enabled.
- Do not create separate appointment, medication-reminder, billing, or clinician portal screens in the MVP.

---

## 5. Roles, Authentication & Permissions

### 5.1 Roles

| Role | Description |
|---|---|
| Guest | Unauthenticated visitor |
| Family owner | Authenticated owner of a family workspace |
| Share recipient | Person presenting a valid temporary share token; need not have an account |
| Platform operator | Authorized technical operator with restricted operational privileges |

No clinician role is included in the MVP. The application is not a clinical decision-support system or provider EHR.

### 5.2 Access-control matrix

Legend: **Yes** = allowed within the role's scope; **Conditional** = allowed only with explicit validation/authorization; **No** = not allowed.

| Resource/action | Guest | Family owner | Share recipient | Platform operator |
|---|---|---|---|---|
| View public landing/terms/privacy | Yes | Yes | Yes | Yes |
| View private dashboard/family profiles | No | Yes, own workspace | No | No routine access |
| Create/update family profiles | No | Yes, own workspace | No | No routine access |
| Upload documents | No | Yes, own workspace | No | No |
| View/download original document | No | Yes, own workspace | Conditional: only selected content and while link valid | No routine access |
| View AI summaries | No | Yes, own workspace | Conditional: only if selected and link valid | No routine access |
| Ask AI about records | No | Yes, authorized scope | No | No |
| View cross-document comparisons | No | Yes, authorized member scope | No | No |
| Create/revoke share links | No | Yes, own workspace | No | No routine access |
| Move to trash/restore records | No | Yes, own workspace | No | No routine access |
| Permanently delete after retention | No | System process under approved policy; owner may request eligible deletion | No | Restricted operational action only if authorized and audited |
| View service health metrics | No | No | No | Conditional |
| Access document content for debugging | No | No | No | Prohibited by default; exceptional access requires explicit authorization, minimum scope, and audit |

### 5.3 Authentication and authorization requirements

- Supabase Auth is the identity provider.
- Email/password and Google sign-in are required.
- Apply verification and recovery flows supported by the configured authentication provider.
- Backend validates session/access tokens on protected API requests.
- Authorize every resource by workspace ownership and the relevant family-member/document relationship.
- Use deny-by-default authorization.
- Prevent insecure direct object references: knowing a document ID, member ID, or share ID must not grant access.
- Apply RLS to user-accessible database tables and test policies independently of UI behaviour.
- Use privileged service-role credentials only on trusted server infrastructure, with minimal access and rotation procedures.
- Share recipients are authorized by a valid, unexpired, unrevoked share token and the specific permitted resource/content—not by possession of a document ID alone.
- Operator access to medical content is prohibited by default. Any exceptional support access must be justified, time-limited, least-privilege, and audited.
- The final owner-authority model must be reviewed for consent, guardianship, adult records, and intended launch regions before public launch.

---

## 6. Data Requirements & Core Entities

This section defines conceptual data requirements only; it is not a database schema.

| Entity | Purpose | Key conceptual attributes |
|---|---|---|
| User/account | Represents an authenticated person | Auth provider identity, email, account status, created/updated timestamps |
| Family workspace | Groups family records under one owner | Owner reference, workspace status, created/updated timestamps |
| Family member | Represents the person whose records are stored | Workspace reference, display name, relationship/role where necessary, optional minimal identifying details, status |
| Medical document | Represents the uploaded original and its metadata | Workspace/member references, title, category, original storage key, MIME type, size, document date if known, upload timestamp, notes, deletion state |
| Processing job | Tracks extraction, OCR, summary, and retry work | Document reference, job type, state, attempts, provider/model identifier, safe error code, timestamps |
| Extracted content | Stores text or structured information derived from a source | Document/version reference, extracted text or values, source location/provenance, extraction confidence/quality, creation timestamp |
| AI summary | Stores generated explanation associated with a document version | Document reference, source version, summary text, model/provider metadata, generation status, created timestamp |
| AI conversation/message | Supports document- or member-scoped questions if persistence is approved | Workspace/member/document scope, message role/content, source references, provider metadata, timestamps, retention state |
| Medical measurement | Represents a structured reported result used in comparisons | Source document, test identity, value, unit, specimen/context when available, date, reference range, source provenance, confidence |
| Share link | Controls temporary recipient access | Document reference, token hash/secure token representation, permitted content, creation/expiry/revocation timestamps, status, creator |
| Deletion/trash state | Supports recoverable deletion and retention | Resource reference, deletion timestamp, scheduled permanent-deletion time, restore status |
| Security/audit event | Records security-relevant actions | Actor or anonymous share identifier, action, resource reference, timestamp, minimal request metadata, outcome |
| Provider/model configuration | Controls approved AI models and fallback | Provider/model identifier, approval status, capability constraints, privacy review status, budget/limit configuration |

### Relationships and invariants

- A family workspace has one designated owner in the initial MVP.
- A family workspace contains family-member profiles and their medical documents.
- Every medical document belongs to one workspace and one family member.
- Summaries, extracted values, and measurements must retain provenance to their source document/version.
- AI conversations, if persisted, must have an explicit document or family-member scope.
- Share links grant access only to one document's explicitly selected content; they do not grant workspace membership.
- A deleted document must be excluded from ordinary retrieval, search, AI context, and new sharing.
- Restore does not reactivate previously issued share links.
- Permanent deletion must cover originals and associated derived records, subject to disclosed backup and legal-retention limitations.
- Use stable internal identifiers; never expose predictable identifiers as authorization credentials.

---

## 7. External Integrations & APIs

### 7.1 Supabase Auth

**Purpose:** Authentication and session management.

**Data sent/received:** Sign-in credentials or OAuth flow data; identity/session tokens; verification and password-recovery events.

**Requirements:**
- Use provider-supported secure flows.
- Configure allowed redirect URLs for production and local development.
- Keep privileged secrets server-side.
- Handle expired/revoked sessions and OAuth cancellation.
- Review provider terms and relevant data-location settings.

### 7.2 Supabase Postgres

**Purpose:** Persistent application metadata, family records, document metadata, processing state, AI summaries, share metadata, and other approved entities.

**Data sent/received:** Application records and authorization-scoped queries.

**Requirements:**
- Enable and test RLS for applicable tables.
- Use migrations and environment-specific configuration.
- Avoid storing original binary files in ordinary database rows.
- Keep database credentials out of client bundles.
- Backups and retention must be documented.

### 7.3 Supabase Storage

**Purpose:** Private storage of uploaded originals and any explicitly approved generated files.

**Data sent/received:** File bytes, storage keys, metadata, and authorized short-lived access URLs.

**Requirements:**
- Private buckets by default.
- Server-side authorization and short-lived signed URLs or equivalent controlled access.
- Validate uploads before accepting them into the processing pipeline.
- Define object deletion, restore, and permanent-deletion behaviour.
- Never treat an unguessable storage key alone as authorization.

### 7.4 OpenRouter and approved model providers

**Purpose:** AI summarization, question answering, and supported interpretation of extracted medical information.

**Data sent:** Minimum necessary extracted text, relevant structured values, question, limited context, and approved reference excerpts. Avoid sending the original binary file unless a specific model capability is approved and required.

**Data received:** Model-generated summaries, answers, structured extraction when supported, and provider error/usage metadata.

**Requirements:**
- Keep API keys on the backend.
- Maintain an allowlist of models/providers and explicit fallback order.
- Review data retention, training use, processing locations, subprocessors, and contractual terms for each provider/model route.
- Do not route sensitive data to a fallback provider merely because it is cheaper.
- Use request timeouts, bounded retries, usage limits, and idempotency.
- Minimize prompt content and redact irrelevant identifiers where practical.
- Do not log full prompts, extracted records, or model responses by default.
- Treat model output as untrusted input; validate structured output before persistence/use.
- Store provider/model identifiers and minimal usage metadata for troubleshooting and cost control.
- The public launch gate must include a documented decision on whether the selected route is appropriate for medical data in each launch jurisdiction.

### 7.5 Medical reference sources

**Purpose:** Supply reliable contextual information about medical terminology, tests, and health concepts.

**Preferred source types:** Government health agencies and established medical institutions. Specific APIs or retrieval methods are not yet selected.

**Data sent/received:** Queries may contain general medical terms or de-identified concepts; returned content includes explanatory material, source URLs/titles, and publication/update metadata where available.

**Requirements:**
- Prefer reputable, traceable sources and retain source attribution for user-facing claims where feasible.
- Avoid sending identifiable personal health information to reference-search services unless specifically approved.
- Separate reference facts from the user's reported results and the model's interpretation.
- Handle unavailable, stale, contradictory, or irrelevant sources transparently.
- Do not invent citations or imply that a reference source validated a patient's diagnosis.

### 7.6 OCR/document extraction

**Purpose:** Extract text from PDFs and images so summaries and comparisons can be generated.

**Status:** Extraction/OCR provider is not finalized. First assess available libraries and deployment constraints; use an external service only if needed and approved.

**Requirements:**
- Prefer processing methods that minimize third-party exposure of medical content.
- Preserve original files independently of extraction.
- Record processing state and extraction quality.
- Handle encrypted PDFs, corrupt files, low-resolution scans, rotation, handwriting, and unsupported formats with clear failure states.

### 7.7 Hosting and deployment services

**Vercel:** Hosts the Next.js frontend.

**Railway:** Hosts FastAPI and approved background-processing components.

**Requirements:**
- Separate development, test/staging, and production environments.
- Use environment variables or managed secrets; never commit credentials.
- Restrict production access and review deployment logs for sensitive data leakage.
- Configure HTTPS, domain/redirect allowlists, health checks, and controlled release/rollback procedures.

### 7.8 Webhooks and notifications

- No email notification system beyond authentication emails is required for the initial MVP.
- No payment gateway is required.
- Any asynchronous processing callback/webhook must authenticate its source, reject replay where relevant, and avoid exposing sensitive data.
- Prefer persisted job polling/status endpoints where this is simpler and sufficiently reliable.

---

## 8. UI/UX States (Loading, Empty & Error States)

### 8.1 Loading states

| View/action | Required state |
|---|---|
| Sign-in/register | Inline submission state; prevent duplicate submissions; preserve safe field values |
| Dashboard | Skeleton layout for family and recent records; avoid flashing another member's data |
| Family member page | Member header and record-list skeleton scoped to the selected member |
| Upload | Upload progress, then a distinct processing state; do not claim AI completion when only file upload has completed |
| Document detail | Secure preview loading state; summary loading/status area independent of preview |
| AI question | Pending indicator, prevent accidental duplicate submission, allow recovery after timeout |
| History comparison | Loading state that identifies the selected member and requested range |
| Share creation | Pending state; do not display a link until creation succeeds |
| Trash/restore/delete | Pending action state and confirmation for destructive or consequential operations |
| Authentication callback | Clear processing state and safe failure path |

### 8.2 Empty states

| View | Required empty-state content |
|---|---|
| New dashboard | Brief explanation of the vault and a primary **Add your first record** action |
| No family members | Prompt to create the first family-member profile |
| Member with no records | Message that no records exist for this member and an upload CTA |
| No filter results | Explain that no records match the current filters and offer to clear them |
| No summary yet | Show processing status or a retry action; do not display a fabricated summary |
| No comparable measurements | Explain that there are not yet enough compatible results to compare |
| No AI conversation | Suggested examples of safe questions, without implying diagnostic capability |
| No active shares | Explain temporary sharing and offer to create a share link from a document |
| Empty trash | State that there are no recoverable deleted records |

### 8.3 Error and fallback states

| Scenario | Expected behaviour |
|---|---|
| Invalid form input | Inline field-specific error, accessible error announcement, no submission |
| Network/API failure | Plain-language message, preserve user input where safe, offer retry when appropriate |
| Upload rejected | State the specific supported-type or size constraint; do not start processing |
| Upload interrupted | Show failed/incomplete status and safe retry; avoid duplicate document/job creation |
| Upload succeeds, AI fails | Keep original available; show processing failure and controlled retry |
| OCR confidence too low | Mark extraction as uncertain; avoid definitive values or comparisons |
| AI provider timeout/rate limit | Bounded retry, approved fallback if eligible, then clear failure state |
| AI budget/request limit reached | Explain that AI processing is temporarily unavailable or limited; preserve the original |
| Unauthorized private route | Return a safe unauthorized/not-found experience without leaking resource existence |
| Expired/revoked share link | Show generic unavailable/expired message; do not return document bytes or metadata |
| Storage preview failure | Offer secure download if authorized |
| Record in trash | Exclude from normal access; provide restore route only to the authorized owner |
| Permanent deletion | Prevent restore after the retention window and communicate the resulting state where appropriate |
| Backend unavailable | Friendly service error; do not expose stack traces, credentials, or internal identifiers |
| 404 | Provide a clear not-found page and safe navigation |
| Unhandled error | Show a generic error identifier if useful; record a redacted diagnostic event |

### 8.4 UX and content rules

- Keep the interface calm, clear, and non-alarmist.
- Make the selected family member visible on all member-scoped screens.
- Use plain language for medical explanations and system errors.
- Label AI-generated material consistently.
- Do not use colour alone to communicate abnormal results, failure, or status.
- Confirm irreversible or consequential actions.
- Explain sharing expiry and recoverable deletion before users commit.
- Avoid unnecessary notification systems, dashboards, or settings outside the agreed MVP.

---

## 9. Non-Functional Requirements

### 9.1 Performance and reliability

Targets below are proposed engineering goals and must be verified in the deployed environment.

| Area | Target |
|---|---|
| Standard page navigation/API reads | p95 under 500 ms for application API requests excluding third-party processing, under normal expected load |
| Dashboard initial render | Usable shell rendered quickly; target LCP ≤ 2.5 seconds on a representative mid-range mobile connection |
| Upload initiation | Immediate validation feedback; progress shown for non-trivial uploads |
| AI processing | Asynchronous; UI must not block indefinitely. Show status and recover from timeout/failure |
| Share access check | Authorization and expiry check on every request; no reliance on client-side state |
| Availability | Target 99.5% monthly service availability for MVP, subject to selected hosting plans and third-party dependencies |
| Retries | Bounded, idempotent, and observable |
| Recovery | Document originals must remain intact through AI/provider failures; backups and restore procedures must be tested |

Do not promise a processing-time SLA for AI/OCR until representative files and providers have been benchmarked.

### 9.2 Responsiveness

- Mobile-first layout.
- Proposed breakpoints: small mobile below 640 px; tablet 640–1023 px; desktop 1024 px and above.
- Core actions—upload, read summary, browse records, and open a share link—must work on mobile and desktop.
- Avoid requiring hover for core interactions.
- Document preview must degrade gracefully on devices that cannot display a particular format.

### 9.3 Accessibility

Target WCAG 2.2 AA for primary workflows.

- Semantic headings, landmarks, labels, and form controls.
- Full keyboard access and visible focus states.
- Accessible dialogs with focus management.
- Screen-reader announcements for upload/AI status changes and validation errors.
- Sufficient contrast and non-colour status cues.
- Meaningful alt text for informative imagery; decorative images ignored by assistive technology.
- Respect reduced-motion preferences.

### 9.4 Security and privacy

- HTTPS in production.
- Secure session handling and token validation.
- Least-privilege service credentials and secret management.
- RLS and backend authorization tests.
- Private storage and short-lived access URLs.
- Rate limits for authentication, uploads, AI requests, and share creation.
- Input validation, output validation, secure error handling, and protection against common web vulnerabilities.
- CSRF protections where applicable to the chosen session/cookie design; secure cookie flags where cookies are used.
- Content Security Policy and appropriate security headers.
- Malware/file-type checks appropriate to the supported upload surface.
- Audit security-relevant actions without recording medical contents or secrets.
- Retention and deletion policy covering database records, object storage, derived AI data, logs, backups, and third-party providers.
- Review relevant health-data/privacy laws for launch jurisdictions before public launch. Do not claim compliance or certification without a completed review and evidence.

### 9.5 Medical safety

- AI output is informational and not a diagnosis.
- Do not fabricate missing data or citations.
- Preserve source document and provenance for extracted values.
- Distinguish reported values, reference ranges, external context, and model interpretation.
- Avoid unsupported clinical recommendations.
- For potentially urgent concerns, direct users to appropriate professional/emergency care without attempting to diagnose.
- Test on representative synthetic or properly authorized sample documents before processing real user records at scale.

### 9.6 SEO

- Public landing, terms, and privacy pages may be indexed as appropriate.
- Authenticated pages, document routes, family pages, assistant conversations, and share-management pages must not be publicly indexed.
- Apply suitable robots directives and authentication protections; robots directives alone are not a security control.
- Do not put medical information, document titles, or member identifiers into public metadata, URLs, analytics, or SEO tags.

### 9.7 Browser/device compatibility

- Support current stable versions of Chrome, Edge, Firefox, and Safari.
- Test responsive layouts on current iOS Safari and Android Chrome.
- Use graceful fallbacks for unsupported file previews and browser APIs.
- Avoid relying on a single browser-specific feature for security or document access.

### 9.8 Observability and maintainability

- Structured, redacted logs with correlation IDs.
- Health checks for backend and processing dependencies.
- Monitoring for error rates, processing failures, latency, and AI usage/cost.
- No medical content or credentials in normal logs.
- Document environment setup, migrations, deployment, rollback, and recovery procedures.
- Automated tests for authorization boundaries, share expiry/revocation, deletion lifecycle, and AI scoping.

---

## 10. MVP Scope, Out-of-Scope & Success Criteria

### 10.1 Strictly In-Scope (MVP)

- Public landing page and privacy/terms information.
- Email/password and Google authentication.
- Family owner workspace and family-member profiles.
- Supported medical document upload with validation and private storage.
- Document metadata, viewing, and downloading.
- Automated background extraction/OCR where supported.
- Saved plain-English AI summaries.
- Document-scoped and family-member-scoped AI questions.
- Chronological timeline and category/date filtering.
- Automatic comparisons of sufficiently comparable historical measurements.
- Trusted medical reference context with appropriate source attribution where available.
- Temporary share links for owner-selected content, expiry, and revocation.
- Recoverable trash, restoration, and documented permanent-deletion policy.
- Minimal in-app processing status and error feedback.
- Bounded retries, approved AI-model fallback, cost controls, and security logging.
- Responsive UI, accessibility for core workflows, tests, and production deployment configuration.
- Essential privacy/security review before public acceptance of real medical records.

### 10.2 Strictly Out-of-Scope (Non-Goals)

Unless separately approved, do not build:

- Clinical diagnosis, treatment plans, prescribing, or medication recommendations.
- A clinician portal, hospital/EHR integration, or healthcare-provider workflow.
- Appointment booking, calendar integration, or reminders.
- Medication reminders, refill tracking, or medication-management workflows.
- Payments, subscriptions, billing, or marketplace functionality.
- Separate family-member accounts and granular multi-user collaboration in the initial owner-managed model.
- Public social features or publicly searchable medical profiles.
- A dedicated mobile app.
- Automatic sharing with healthcare providers.
- Unlimited file formats or unlimited upload size.
- A vector database or complex RAG infrastructure unless evaluation demonstrates it is needed and the owner approves it.
- Email notifications or a full notification centre beyond authentication emails.
- Analytics or advertising that uses medical data.
- Claims of HIPAA, GDPR, or other regulatory compliance without appropriate legal/security assessment and implementation evidence.

### 10.3 Definition of Done

The MVP is ready for public launch only when all applicable items pass:

**Product**
- [ ] A user can register, sign in, sign out, and recover account access.
- [ ] Owner can create and manage family-member profiles.
- [ ] Owner can upload supported documents, view/download originals, and edit metadata.
- [ ] AI summaries are saved, correctly associated with source documents, and clearly labelled.
- [ ] User can ask scoped questions and review supported history comparisons.
- [ ] User can create, inspect, and revoke share links with server-enforced expiry.
- [ ] User can move a document to trash and restore it within the approved retention window.
- [ ] Unsupported files, empty states, loading states, and processing failures are handled clearly.

**Security and privacy**
- [ ] Automated tests demonstrate that one workspace cannot access another workspace's records.
- [ ] Tests prove member/document IDs cannot bypass authorization.
- [ ] Share links cannot access unselected content, other documents, or records after expiry/revocation.
- [ ] Deletion removes records from normal UI, search, AI retrieval, and sharing paths.
- [ ] Secrets and medical content are not exposed in client bundles or routine logs.
- [ ] AI provider/model routes and data-handling terms are reviewed and approved for the intended launch.
- [ ] Consent/guardianship and family-owner authority model is reviewed for intended launch regions.
- [ ] Privacy, terms, retention, sharing, and AI disclosures accurately describe implementation.

**AI quality and safety**
- [ ] Representative supported documents have been tested for extraction and summary quality.
- [ ] Unreadable or ambiguous documents do not result in fabricated values.
- [ ] Comparisons reject or flag incompatible measurements and units.
- [ ] AI failure and approved fallback paths are bounded, observable, and cost-limited.
- [ ] Answers are scoped to the correct person/document.
- [ ] Medical limitations and uncertainty are visible to users.

**Operations**
- [ ] Production environment variables and secrets are configured securely.
- [ ] Health checks, redacted logs, error monitoring, and backup/recovery procedures are documented.
- [ ] Database migration and deployment/rollback procedures are tested.
- [ ] Core flows pass responsive and accessibility checks.
- [ ] No unresolved critical/high-severity security defects remain.

### 10.4 Success Metrics

Instrument only what is necessary and avoid collecting medical content for analytics.

| Metric | Initial success signal |
|---|---|
| Registration completion | Users can complete signup and reach an initialized workspace without blocking defects |
| First document upload | New owners can upload a supported document successfully |
| Document availability | Successfully uploaded originals remain retrievable regardless of AI outcome |
| AI processing reliability | Processing success/failure rates and retry outcomes are measured; baseline targets are set after representative testing |
| Summary usefulness | User feedback indicates summaries are understandable and faithful to the source |
| Comparison integrity | No known test case with incompatible units/tests is silently presented as a valid trend |
| Sharing correctness | All expiry/revocation authorization tests pass |
| Security isolation | Zero cross-workspace or cross-member leakage in the test suite |
| Cost control | Per-request and aggregate AI usage are measurable, with configured limits and no unbounded retries |
| Operational reliability | Errors and failed jobs are observable and recoverable |

Do not set a numerical clinical-accuracy claim without a defined evaluation set, review methodology, and appropriate qualified review.

---

## 11. Assumptions & Open Decisions Requiring Approval

### 11.1 Assumptions used in this draft

| ID | Assumption | Why it was used | Required follow-up |
|---|---|---|---|
| A-01 | Each workspace has one designated owner for MVP. | Matches the agreed family-owner model. | Confirm final authority/consent approach before public launch. |
| A-02 | Adult family members' records may be managed by the owner only where legally authorized; relationship alone is insufficient. | Global product and sensitive-data context. | Obtain jurisdiction-specific review and decide how authorization is represented. |
| A-03 | Initial upload formats include PDF, JPEG, and PNG, with additional formats enabled only after testing. | Keeps upload and OCR behaviour bounded. | Approve final MIME/extension list and size limits. |
| A-04 | Proposed share durations include one minute, one hour, and two days. | These were examples from discovery, not a final exhaustive list. | Approve allowed duration options and maximum duration. |
| A-05 | AI conversation history persistence is not yet confirmed. | Document summaries and Q&A were agreed, but retention of full chat history was not explicitly settled. | Decide session-only versus persisted history and retention period. |
| A-06 | OCR/extraction implementation is not yet selected. | No provider/library was agreed. | Benchmark privacy-preserving options against representative files. |
| A-07 | A separate vector database is not required initially. | Avoids unnecessary cost and operational complexity. | Reconsider only if retrieval quality requires it. |
| A-08 | “Global” means global product intent, not automatic legal readiness in every jurisdiction. | Laws and provider requirements differ. | Define initial eligible jurisdictions and launch restrictions after review. |
| A-09 | AI fallback uses an approved provider/model allowlist. | Fallback must not bypass data-handling requirements. | Approve providers, models, routing, and cost limits. |
| A-10 | Recoverable deletion uses a configured retention window. | Recoverability was chosen, but duration was not specified. | Approve trash retention duration and backup deletion expectations. |
| A-11 | The public launch follows essential security and privacy checks. | Public MVP was chosen with a security gate. | Define accountable sign-off and release checklist. |
| A-12 | Share recipients do not need an account for a valid share link. | Link-only sharing was selected. | Confirm; if approved, ensure recipients receive only the selected content. |

### 11.2 Decisions requiring owner approval before `design.md` or implementation

| Decision | Proposed default | Why it matters |
|---|---|---|
| D-01: Family owner authority | Owner manages all records in the workspace, with explicit legal/consent safeguards for dependants and adults | Access rights and compliance affect core data isolation and onboarding |
| D-02: Initial launch jurisdictions | Choose an explicitly reviewed initial set rather than claim readiness worldwide | Determines privacy, consent, data-location, and provider requirements |
| D-03: AI provider privacy floor | Use only models/providers whose data terms and processing locations are approved for the intended use | Medical data may be routed through OpenRouter to different providers |
| D-04: Share expiration choices | Offer one minute, one hour, and two days initially, with a defined maximum | Determines UI options and backend validation |
| D-05: Trash retention | Choose a fixed recovery period, then permanently delete eligible data | Determines retention jobs and user disclosures |
| D-06: Conversation retention | Default to session-only until persistence and retention are approved | Full chat history may contain sensitive health information |
| D-07: File limits | Set maximum file size and per-workspace storage/usage limits after cost and provider evaluation | Prevents abuse and unpredictable processing costs |
| D-08: Extraction/OCR method | Benchmark local/server-side extraction first, then approve an external provider only if needed | Determines cost, reliability, and third-party data exposure |
| D-09: Measurement comparison rules | Compare only recognized matching tests and compatible units with source provenance | Prevents misleading historical trends |
| D-10: Public launch sign-off | Require product, security, privacy, and AI-quality checklist completion | A public launch with real medical data has materially higher risk than a demo |

### Approval rule

Do not silently resolve open decisions that affect privacy, legal authority, medical interpretation, or third-party disclosure. Use the proposed defaults only where they do not conflict with explicit owner direction. Record any approved changes in the PRD before implementation begins.

**Next step:** Review and approve this PRD. Once the flagged decisions are confirmed, proceed to `design.md` for information architecture, screen layouts, visual system, interaction states, and design acceptance criteria.
