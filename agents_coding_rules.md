# MedLab — AI Coding Agent Rules

**File:** `agents_coding_rules.md`  
**Applies to:** Cursor, Windsurf, Aider, Devin, Codex, Claude Code, Antigravity, and all other AI coding agents working on MedLab.  
**Project:** MedLab — a secure family medical records vault with document management, AI-generated medical explanations, longitudinal measurement comparison, and controlled sharing.

These rules are mandatory. Every coding agent MUST follow them before inspecting, planning, editing, testing, or committing code.

## 1. Prime Directives (Agent Behavior Core)

### 1.1 Source-of-truth hierarchy

You MUST treat the following documents as the authoritative foundation for MedLab:

1. `PRD.md` — approved product requirements, user stories, and MVP scope.
2. `DESIGN.md` — approved visual system, layouts, components, and interaction patterns.
3. `ARCHITECTURE.md` — approved technology stack, system boundaries, directory structure, and deployment architecture.
4. `DATABASE.md` — authoritative database schema, column names, types, constraints, relationships, and data lifecycle rules.
5. `API.md` — authoritative API routes, request/response contracts, authorization, integrations, and error handling.

You MUST read the relevant portions of these documents before starting any task. For architectural, database, API, or design changes, you MUST inspect all affected foundation documents.

The foundation documents are a coordinated contract. You MUST NOT treat one document as permission to contradict another.

If two documents conflict:

1. Identify the exact conflicting requirements.
2. Explain the practical impact.
3. Stop the affected implementation.
4. Ask the human to approve the resolution.
5. Update the relevant documentation only after approval.
6. Resume implementation against the resolved contract.

NEVER silently choose whichever interpretation is easiest to implement.

If a foundation document is missing, unreadable, or incomplete, you MUST state the limitation and request access or clarification when it affects the task. NEVER pretend to have inspected a file you have not read.

### 1.2 Inspect before modifying

Before changing any file, you MUST:

1. Inspect the repository structure and identify the relevant application, service, component, and test directories.
2. Read the target file in full when reasonably sized, or inspect the relevant sections when it is large.
3. Search for existing definitions, imports, usages, related types, API clients, database access functions, and tests.
4. Inspect relevant configuration files, package manifests, lockfiles, and environment-variable documentation.
5. Identify the dependencies and callers affected by the proposed change.
6. Check the applicable foundation documents.
7. Establish the existing behavior before modifying it.

Use the repository's available search, navigation, and version-control tools. Do not assume a file path, function name, library, component, or implementation pattern exists without verifying it.

Before a non-trivial change, provide a concise plan identifying:

- The problem being solved.
- The files expected to change.
- The existing patterns that will be reused.
- The tests or verification steps required.
- Any ambiguity or risk requiring human approval.

For a small, unambiguous change, keep the plan proportionate. Do not waste time producing a lengthy plan for a one-line correction.

### 1.3 Scope discipline

You MUST implement only the requested task and its necessary supporting changes.

NEVER:

- Refactor unrelated modules while implementing a feature.
- Reformat entire files to change a small section.
- Rename unrelated variables, functions, components, or directories.
- Rewrite working code merely because you prefer another style.
- Modify unrelated configuration, deployment, or environment files.
- Change API contracts, database schemas, dependencies, or architecture without authorization.
- Remove working functionality to make a failing test pass.
- Add speculative features, endpoints, settings, or abstractions.
- overwrite existing user changes or discard uncommitted work.
- Run destructive Git operations or destructive database commands without explicit authorization.

If the requested change exposes an adjacent problem, report it separately. Fix it only if it blocks the task or the human approves the additional scope.

Keep diffs small, reviewable, and directly related to the requested outcome.

### 1.4 No hallucinations or invented requirements

If a component, route, database column, enum, environment variable, dependency, service, permission, or user-facing feature is not supported by the foundation documents or established repository implementation, you MUST NOT invent it as if it were approved.

You MUST distinguish between:

- **Approved:** explicitly defined in the foundation documents.
- **Existing implementation:** already present in the repository but potentially subject to review.
- **Proposed:** a suggested improvement that has not been approved.
- **Unknown:** insufficient information to proceed safely.

Ask for approval before introducing a new architectural pattern, database object, public API contract, third-party integration, dependency, or feature outside the approved scope.

You MAY make ordinary local implementation decisions that do not alter the product contract, such as choosing a private helper function name or extracting repeated logic within the requested module.

Do not ask unnecessary questions when the foundation documents and existing code already answer them.

### 1.5 Definition of done

A task is not complete merely because code has been written.

Before declaring completion, you MUST:

- Verify that the implementation matches the approved requirements.
- Run the relevant tests and checks available in the repository.
- Inspect the final diff for accidental changes.
- Confirm that API, database, security, and UI behavior remain consistent.
- Report any checks that could not be run and explain why.
- Identify any remaining risks or unresolved blockers.

NEVER claim that a test passed, a build succeeded, a migration ran, or a deployment completed unless you have evidence that it did.

---

## 2. Code Quality, Naming & Formatting

### 2.1 Naming conventions

Follow the language conventions below unless `ARCHITECTURE.md` or the established repository explicitly specifies otherwise.

| Element | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `DocumentCard` |
| React hooks | `camelCase`, prefixed with `use` | `useDocuments` |
| TypeScript variables | `camelCase` | `documentId` |
| TypeScript functions | `camelCase` | `fetchDocuments` |
| TypeScript types and interfaces | `PascalCase` | `DocumentSummary` |
| Constants | `UPPER_SNAKE_CASE` for true module-level constants | `MAX_UPLOAD_BYTES` |
| Python functions and variables | `snake_case` | `get_document` |
| Python classes | `PascalCase` | `DocumentService` |
| Python constants | `UPPER_SNAKE_CASE` | `REQUEST_TIMEOUT` |
| Database tables | `snake_case`, plural where defined | `medical_documents` |
| Database columns | `snake_case` | `family_member_id` |
| API paths | Lowercase plural `kebab-case` resource names | `/documents` |
| API JSON fields | `camelCase` | `familyMemberId` |
| Environment variables | `UPPER_SNAKE_CASE` | `OPENROUTER_API_KEY` |
| Test files | Follow existing runner conventions | `document-service.test.ts` |

Do not rename public API fields, database columns, or existing exported symbols solely to satisfy personal naming preferences.

### 2.2 Readability and maintainability

You MUST write code that another engineer can understand, test, and maintain.

- Prefer clear names over abbreviations.
- Keep functions focused on one coherent responsibility.
- Keep modules small enough to understand without navigating unrelated concerns.
- Use explicit control flow where it improves security or correctness.
- Avoid deeply nested conditionals when a clear early return is appropriate.
- Avoid magic values; use approved constants or existing configuration.
- Document non-obvious business rules and security-sensitive decisions.
- Prefer simple, established patterns over unnecessary design patterns.
- Follow the existing formatter, lint rules, import ordering, and code conventions.

Do not add comments that merely repeat what the next line already says.

### 2.3 DRY without premature abstraction

You MUST avoid meaningful duplication, but you MUST NOT create abstractions prematurely.

- Reuse existing utilities, components, schemas, services, and hooks where appropriate.
- Extract shared logic when multiple callers genuinely need the same behavior.
- Keep isolated logic local when abstraction would make the code harder to understand.
- Do not introduce a generic framework for a single straightforward use case.
- Do not build speculative extension points for hypothetical future providers or features.
- Keep security-sensitive logic centralized where consistent enforcement is necessary, especially authorization, input validation, and provider error normalization.

### 2.4 Preserve existing developer intent

NEVER remove or rewrite existing developer comments, TODOs, FIXMEs, or logging statements unless:

- The task explicitly requires it.
- The statement is demonstrably obsolete and its removal is approved.
- The statement exposes a secret or creates a security vulnerability that must be addressed immediately.

If an existing comment is inaccurate, update it narrowly rather than deleting it without explanation.

Do not suppress warnings, disable lint rules, remove assertions, or weaken tests merely to obtain a clean build.

Logging changes must preserve useful operational observability without exposing sensitive data.

### 2.5 Formatting and linting

- Use the formatter and linter already configured by the repository.
- Do not introduce a second formatter or linter without approval.
- Follow the existing indentation, quote, semicolon, and line-length conventions.
- Format only the files or sections necessary for the task.
- Do not commit generated formatting churn unrelated to the feature.

---

## 3. Project Structure & File Placement

### 3.1 Follow the approved architecture

`ARCHITECTURE.md` is authoritative for the project directory structure and system boundaries.

Before creating a file, locate the correct existing directory and inspect similar files.

NEVER create a competing directory structure because it seems more familiar. Do not move modules, consolidate directories, or change architectural layers without approval.

If the actual repository structure conflicts with `ARCHITECTURE.md`, document the discrepancy and ask for a decision when it affects implementation.

### 3.2 Responsibility boundaries

Maintain clear separation between the following concerns, using the exact placement defined in `ARCHITECTURE.md`:

| Layer | Responsibility | Must not become |
|---|---|---|
| UI components | Rendering, accessibility, and local presentation behavior | A place for privileged database access or business rules |
| Pages and route-level UI | Screen composition and coordination | A duplicate implementation of domain logic |
| Client-side hooks/state | UI state, loading state, and API interaction | The authoritative security boundary |
| API routes/controllers | HTTP parsing, authentication integration, validation, and response mapping | A repository of unrelated business logic |
| Services/use cases | Business rules, authorization orchestration, and workflow coordination | A direct dependency on UI implementation details |
| Data-access layer | Controlled persistence, query execution, and transaction handling | A place to bypass ownership checks |
| External-service adapters | Provider requests, timeouts, retries, and response normalization | A direct dependency from UI components to third-party APIs |
| Schemas/contracts | Request, response, and data validation | A second, conflicting definition of the database contract |
| Tests | Verification of documented behavior | A replacement for production validation or authorization |

Do not duplicate business rules across frontend, API routes, background jobs, and database access functions. The backend must remain authoritative for protected operations.

### 3.3 File creation rules

Before creating a new file, you MUST determine whether an existing module can support the requirement without becoming overly coupled.

New files MUST:

- Be placed in the approved directory.
- Follow the repository's naming conventions.
- Have a clear single responsibility.
- Use existing dependency-injection and configuration patterns.
- Include relevant tests where appropriate.
- Avoid circular imports and hidden cross-layer dependencies.

Do not create placeholder modules, empty abstractions, unused helpers, or speculative configuration files.

### 3.4 Documentation and configuration

Update documentation when a task intentionally changes an approved contract, but obtain approval before changing the foundation itself.

When a new environment variable is approved:

- Add it to the correct example environment file without a real secret.
- Document its purpose and whether it is required.
- Validate it at startup.
- Keep development and production configuration behavior explicit.
- Never add real credentials to documentation or sample files.

---

## 4. Component & UI Pattern Reuse

### 4.1 Inspect before creating UI

Before building or modifying a component, inspect:

1. Existing shared UI components.
2. Existing screen and feature components.
3. The current design tokens and theme configuration.
4. Existing form, modal, toast, loading, empty-state, and error patterns.
5. The corresponding screen or interaction in `DESIGN.md`.

Reuse an existing component if it satisfies the requirement. Extend it narrowly when necessary.

Do not create a second button, input, card, dialog, notification, or loading component that duplicates an existing shared component without an approved reason.

### 4.2 Design-system compliance

`DESIGN.md` is the source of truth for MedLab's visual design.

You MUST preserve its approved:

- Color palette and semantic color roles.
- Typography scale and font choices.
- Spacing scale.
- Border radii.
- Shadows and elevation.
- Button, input, card, and dialog variants.
- Navigation patterns.
- Responsive behavior.
- Accessibility and interaction expectations.
- Light-only theme requirements, if specified by the design document.

NEVER introduce random hex colors, arbitrary spacing values, new typography scales, decorative gradients, or shadows simply because they look attractive.

Use existing design tokens and semantic classes. If the design system lacks a necessary token, ask for approval before extending it.

### 4.3 Medical-product UI requirements

MedLab handles sensitive family health information. UI changes MUST preserve privacy and clear user understanding.

- Never display one family's records in another family's workspace.
- Do not expose medical content in browser console logs or debugging panels.
- Clearly distinguish document metadata, extracted information, and AI-generated explanations.
- Preserve loading, empty, error, and unavailable states.
- Never imply that AI-generated text is a verified diagnosis.
- Confirm destructive actions according to the existing interaction design.
- Communicate share-link expiry, revocation, and included content accurately.
- Do not make private records publicly accessible to simplify UI implementation.
- Avoid exposing a signed download URL before the user is authorized to access the file.

### 4.4 Accessibility and responsive behavior

- Use semantic HTML elements.
- Provide accessible labels for inputs and controls.
- Support keyboard navigation and visible focus indicators.
- Do not use color alone to communicate a state.
- Preserve appropriate contrast and readable text sizes.
- Ensure dialogs, menus, and notifications follow existing accessibility patterns.
- Follow the approved desktop and mobile navigation behavior.
- Avoid layout shifts that obscure critical feedback or destructive-action controls.

### 4.5 Interaction consistency

Reuse the established patterns for:

- Form validation.
- Submission and disabled states.
- Loading indicators.
- Success and error feedback.
- Confirmation dialogs.
- Empty states.
- Retry behavior.
- Pagination and filtering.
- Upload progress and processing status.

Do not introduce new interaction conventions for a single screen without checking whether a shared pattern already exists.

---

## 5. Dependency & Package Management

### 5.1 Zero rogue installs

**You MUST NOT install, add, upgrade, remove, or replace any npm, Python, system, or other runtime dependency without explicit human approval.**

This prohibition includes:

- `npm install` or `pnpm add` for new dependencies.
- Adding Python packages to `pyproject.toml` or equivalent.
- Upgrading existing packages.
- Replacing an approved library with a preferred alternative.
- Adding UI component libraries, validation libraries, SDKs, database drivers, or test tools.
- Running package commands that modify manifests or lockfiles as a side effect.

Before proposing a dependency, explain:

1. The capability it provides.
2. Why existing dependencies are insufficient.
3. The impact on bundle size, runtime, security, maintenance, and deployment.
4. Whether an existing approved library can solve the problem.

Wait for explicit approval before making the dependency change.

### 5.2 Package-manager consistency

Use the package manager and lockfile already established by the repository and `ARCHITECTURE.md`.

- If the frontend uses `pnpm`, use `pnpm`.
- If it uses `npm`, use `npm`.
- If the Python project uses `uv`, use `uv`.
- Do not introduce another package manager.
- Do not regenerate a lockfile using a different package manager.
- Do not delete or ignore lockfiles to resolve a dependency conflict.
- Do not manually edit lockfiles unless explicitly required and approved.

If the approved package manager is unclear, inspect the repository's lockfiles and configuration. Ask for clarification if the evidence conflicts.

### 5.3 Existing dependency reuse

Before using a library, verify that it is installed, supported by the current version, and used consistently.

Do not assume that a package is available merely because it is common in similar projects.

Prefer built-in platform functionality or an existing approved dependency when it meets the requirement.

### 5.4 Security and compatibility

Never work around dependency incompatibility by silently downgrading packages, disabling security checks, or forcing incompatible peer dependencies.

If a vulnerability or incompatible version blocks the task:

1. Identify the affected package and verified impact.
2. Determine whether the current implementation can work safely without a package change.
3. Propose the smallest safe resolution.
4. Obtain approval for dependency changes.
5. Update tests and lockfiles only through the approved package manager.

---

## 6. Type Safety & Data Validation

### 6.1 TypeScript strictness

TypeScript MUST remain strict.

- Preserve `"strict": true` in TypeScript configuration.
- NEVER use `any` as a convenience.
- Do not use `@ts-ignore`, `@ts-nocheck`, or broad lint suppressions to hide errors.
- Prefer `unknown` for untrusted data and narrow it through validation.
- Use explicit types for API contracts, domain models, and external-provider boundaries.
- Avoid unsafe type assertions where runtime validation is required.
- Keep public function signatures explicit.
- Use discriminated unions for multi-state operations where appropriate.
- Model nullable fields and optional fields separately.

If an existing codebase temporarily violates these rules, do not expand the violation. Fix unrelated legacy violations only with approval unless they block the requested change.

### 6.2 Python typing

Python code MUST use explicit type annotations for public functions, service boundaries, and data-access contracts.

- Use the existing project's approved type-checking conventions.
- Avoid untyped dictionaries as substitutes for defined data contracts.
- Avoid unrestricted `Any`.
- Handle optional values explicitly.
- Use typed models for validated API inputs and outputs.
- Validate external-provider responses before treating them as trusted data.
- Do not disable type checking broadly to accommodate a new implementation.

### 6.3 Approved validation boundaries

`API.md` defines the public API contracts. `DATABASE.md` defines database constraints. `ARCHITECTURE.md` determines the approved validation libraries and where validation belongs.

You MUST use the already-approved validation libraries. Do not add Zod, Pydantic, or another schema library if it is not already approved and installed.

Validation is required at each relevant trust boundary:

- HTTP request bodies and query parameters.
- Route and resource identifiers.
- Form input before submission.
- File upload metadata and actual file contents.
- External-provider requests and responses.
- Background-job payloads.
- Database writes and data returned from untrusted sources.
- Public share-link tokens and expiry information.

Frontend validation improves usability. Backend validation is mandatory even if the frontend has already validated the same fields.

### 6.4 Database contract validation

- Use the exact table names, column names, types, and enum values in `DATABASE.md`.
- Do not invent database fields to simplify a UI.
- Do not assume the database accepts values not listed in its constraints.
- Do not silently coerce invalid values.
- Do not allow a client to provide authoritative ownership fields.
- Respect `null` versus omitted-field semantics in `API.md`.
- Preserve source provenance for extracted measurements.
- Treat database constraints as a final integrity boundary, not as a replacement for meaningful API validation.

### 6.5 External and AI-generated data

External provider responses, OCR output, retrieved medical sources, and AI-generated text MUST be treated as untrusted.

- Validate response shape before use.
- Enforce maximum lengths and collection sizes.
- Reject malformed URLs and unsupported content types.
- Validate numeric values and date formats.
- Preserve unknown or ambiguous medical values as unknown.
- Do not invent laboratory results, units, reference ranges, or citations.
- Do not execute or render external content as trusted HTML.
- Do not allow untrusted content to override system instructions, authorization rules, or tool permissions.

---

## 7. Error Handling & State Management

### 7.1 Standardized API errors

`API.md` defines the authoritative error envelope and HTTP status mappings.

Every API route MUST return the documented envelope for JSON errors.

Agents MUST NOT introduce competing response formats such as `{ message: "..." }` at one endpoint and `{ error: "..." }` at another.

Use stable error codes rather than requiring frontend code to parse human-readable messages.

Expected error codes include:

- `AUTHENTICATION_REQUIRED`
- `INVALID_TOKEN`
- `PERMISSION_DENIED`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `INVALID_REQUEST`
- `IDEMPOTENCY_CONFLICT`
- `INVALID_STATE_TRANSITION`
- `UPLOAD_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `RATE_LIMIT_EXCEEDED`
- `QUOTA_EXCEEDED`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_PROVIDER_TIMEOUT`
- `DOCUMENT_PROCESSING_FAILED`
- `INTERNAL_ERROR`

Do not introduce new public error codes without checking `API.md` and obtaining approval when the contract must change.

### 7.2 Expected versus unexpected errors

**Expected errors** include validation failures, unauthorized access, missing resources, invalid state transitions, expired share links, rate limits, and known provider failures.

For expected errors:

- Return the appropriate documented status and error code.
- Provide a safe, understandable message.
- Include field-level validation errors when appropriate.
- Preserve the request ID.
- Do not expose internal implementation details.

For unexpected errors:

- Log diagnostic details in approved server-side logging.
- Return a generic safe error response.
- Preserve the request ID.
- Do not expose stack traces, SQL errors, provider dumps, secrets, or medical content.

Never catch an error and silently pretend that an operation succeeded.

### 7.3 Frontend error behavior

Reuse the existing global error handling, toast, inline validation, and error-boundary patterns.

- Use inline field errors for form validation.
- Use toast notifications for concise operation-level feedback where the design specifies them.
- Use appropriate empty, retry, and unavailable states for loading and retrieval failures.
- Preserve entered form data when safe to do so.
- Do not display raw backend exception messages directly.
- Do not show success notifications until the operation has actually succeeded or been durably accepted as asynchronous work.
- Avoid duplicate error messages from both local and global handlers.

For `202 Accepted`, communicate that work has been queued or started; do not imply that the AI summary or document processing is already complete.

### 7.4 State management

Use the state-management approach already approved in `ARCHITECTURE.md`.

- Do not add a new global state library without approval.
- Keep transient UI state local when practical.
- Avoid duplicating the same server state across unrelated components.
- Define clear loading, success, empty, error, and pending states.
- Prevent stale asynchronous requests from overwriting newer user selections.
- Handle component unmounts and request cancellation appropriately.
- Do not interpret a cancelled frontend request as proof that a server-side operation was cancelled.
- Do not store medical documents, access tokens, or sensitive summaries in persistent browser storage unless explicitly approved by the architecture and security policy.

### 7.5 Idempotency and transaction safety

For operations identified in `API.md` as requiring `Idempotency-Key`:

- Preserve the key through legitimate retries.
- Ensure equivalent retries do not duplicate the operation.
- Reject reuse of the same key with a materially different request.
- Do not invent a new idempotency-storage design without checking `DATABASE.md`.
- Use transactions for related database changes that must succeed or fail together.
- Do not retry a non-idempotent external operation without a documented deduplication strategy.

---

## 8. Security, Secrets & Data Privacy

### 8.1 Never expose secrets

**NEVER hardcode credentials, tokens, passwords, or private keys in application code.**

All secrets MUST be supplied through approved server-side environment configuration or the deployment platform's secret manager.

This includes:

- `OPENROUTER_API_KEY`.
- Any approved AI fallback-provider key.
- `SUPABASE_SERVICE_ROLE_KEY`.
- `DATABASE_URL` credentials.
- Email-provider credentials.
- Webhook signing secrets.
- Private signing keys.
- Internal service credentials.

Never commit real secrets to Git, documentation, screenshots, logs, test fixtures, or example environment files.

Use placeholder values in `.env.example`. If a secret is accidentally exposed, report it immediately and follow the approved rotation process.

### 8.2 Client/server trust boundaries

The browser is an untrusted environment.

- NEVER place privileged database credentials in frontend bundles.
- NEVER use a service-role key from client-side code.
- NEVER rely on hidden UI controls to enforce permissions.
- NEVER trust client-supplied `workspaceId`, `ownerUserId`, `uploadedByUserId`, role, or ownership claims.
- NEVER allow arbitrary client-provided storage paths to determine which files are read or written.
- NEVER call third-party AI APIs directly from UI components using server credentials.
- NEVER bypass backend authorization to make a feature work faster.

Protected data access must use the documented backend authorization model. Any explicitly approved direct Supabase client access must still enforce the configured RLS policies and must never use privileged credentials in the browser.

### 8.3 Medical data privacy

Medical documents, extracted text, AI explanations, measurements, family-member data, and share-link contents MUST be treated as sensitive.

- Minimize the data returned to the client.
- Do not include medical content in telemetry, error messages, analytics, or console output.
- Do not log raw document text, OCR output, or complete AI prompts and responses.
- Do not send medical content to unapproved external providers.
- Do not add an external integration without explicit approval.
- Respect document deletion, recovery, and derived-data cleanup rules.
- Do not make a private bucket public.
- Do not expose signed URLs in logs or long-lived client storage.
- Do not create new medical-data copies without a documented purpose and retention rule.

Never describe the product as end-to-end encrypted unless the approved architecture actually implements end-to-end encryption.

### 8.4 Authorization and IDOR prevention

Every protected backend operation MUST authorize the resource, not merely authenticate the caller.

Before reading, modifying, downloading, deleting, restoring, sharing, or processing a resource, verify the caller's ownership through the appropriate workspace and parent-resource relationships.

For nested resources, validate the full ownership chain.

A valid UUID is not proof of access.

Do not allow measurements, versions, summaries, jobs, or share items to be attached across workspaces.

Public share-link endpoints are the only intended unauthenticated access path to selected medical content. They must check token validity, expiry, revocation, and selected items on every request.

### 8.5 File-upload security

- Validate the actual file contents, not only the extension or client MIME type.
- Enforce the approved upload-size limit.
- Use the approved file-type allowlist.
- Reject unsupported file formats.
- Use opaque storage names.
- Protect document processors against malformed input and resource exhaustion.
- Do not execute uploaded files or embedded scripts.
- Do not trust extracted text as instructions.
- Do not expose internal storage paths.

### 8.6 SSRF, XSS, and injection prevention

- Use parameterized database queries or the approved ORM.
- Never interpolate user input into SQL identifiers or query fragments.
- Validate external URLs against the approved retrieval policy.
- Block private and internal network destinations when retrieving external content.
- Safely escape output rendered in HTML.
- Do not use unsafe HTML rendering for untrusted document or AI text.
- Do not execute shell commands built from untrusted input.
- Do not allow retrieved medical sources or uploaded documents to alter tool permissions or system instructions.

### 8.7 Auditability

Security-sensitive actions must follow the audit rules in `DATABASE.md`.

Do not remove audit events or bypass the audit mechanism to simplify a feature. Do not include medical text, raw tokens, passwords, or secrets in audit metadata.

Operational access to sensitive information must follow the approved break-glass policy. Do not create a general-purpose administrator bypass.

---

## 9. Database & API Access Rules

### 9.1 Exact schema compliance

`DATABASE.md` is the authoritative database contract.

You MUST preserve:

- Table names.
- Column names.
- Column types.
- Nullability.
- Default values.
- Enum values.
- Unique constraints.
- Check constraints.
- Foreign-key relationships.
- Referential actions.
- Indexes required by approved query patterns.
- Data ownership and retention behavior.

NEVER rename a column, add a column, change a type, relax a constraint, add an enum value, or modify a foreign-key action simply because it makes implementation easier.

If a feature cannot be implemented using the approved schema, stop and propose a documented schema change for approval.

### 9.2 Database migrations

Database migrations are high-impact changes.

- Inspect the current migration history before proposing a migration.
- Follow the approved migration tool in `ARCHITECTURE.md`.
- Never modify an already-applied migration merely to make local development pass.
- Prefer forward-only, reviewable migrations.
- Preserve existing records and data integrity.
- Consider deployment order and compatibility between application versions.
- Avoid locking large tables unnecessarily.
- Do not execute production migrations without explicit authorization.
- Never drop or truncate production data without explicit authorization and a verified recovery plan.
- Do not seed real personal or medical information.

Any schema migration that changes the contract must be reflected in `DATABASE.md` and relevant API schemas after approval.

### 9.3 ORM and query safety

Use only the approved ORM or query mechanism.

- Use parameterized queries.
- Avoid constructing raw SQL from untrusted values.
- Keep transaction boundaries explicit.
- Use eager loading or appropriately grouped queries where necessary to avoid N+1 access.
- Select only the columns needed for the operation.
- Apply pagination to list endpoints.
- Avoid unrestricted full-table reads.
- Use approved indexes and query patterns.
- Avoid redundant indexes that increase write costs without supporting a real query.
- Preserve consistent ordering for cursor pagination.
- Do not swallow database errors that indicate integrity or consistency failures.

Raw SQL is permitted only where supported by the approved architecture and written safely with parameters.

### 9.4 Ownership and row-level security

Follow the RLS and backend access model in `DATABASE.md`.

- Never disable RLS to work around an authorization problem.
- Never assume `service_role` is protected by RLS.
- Never use privileged credentials for routine user-facing operations if the approved architecture specifies user-scoped access.
- Verify ownership in the backend even when the database also enforces access restrictions.
- Keep internal worker permissions narrowly scoped.
- Do not allow clients to write authoritative ownership or audit-attribution fields.
- Ensure cross-workspace resource references are rejected.

### 9.5 Document processing and derived data

Extracted text, AI summaries, measurements, processing jobs, and file versions must remain linked to their approved source records.

- Preserve document-version provenance.
- Do not silently attach a result to the wrong version.
- Make retries idempotent.
- Ensure deleted source data triggers the documented derived-data cleanup.
- Avoid persisting raw AI conversations or chat history unless persistence is explicitly approved.
- Do not introduce a vector database, embedding table, or vector extension unless approved by the foundation documents and the human.
- Do not store redundant copies of medical content without a documented purpose and retention policy.

### 9.6 Third-party adapters

All external-service access must go through the approved adapter or service boundary.

- Do not call OpenRouter from React components.
- Do not scatter provider-specific HTTP calls across business logic.
- Apply documented timeouts, retry limits, and error normalization.
- Respect circuit-breaker behavior and approved fallback configuration.
- Validate external responses before persistence.
- Never return raw provider errors to users.
- Never change the provider, model, or medical-source allowlist without approval.

---

## 10. Testing & QA Expectations

### 10.1 Test placement

Follow the test structure established by the repository and `ARCHITECTURE.md`.

Use the existing conventions, such as adjacent test files or approved `__tests__` directories. Do not introduce a competing test directory structure or install a new testing framework without approval.

Every new non-trivial feature MUST have appropriate automated tests.

### 10.2 Required test categories

| Test category | Expectations |
|---|---|
| Unit tests | Validate isolated business rules, parsing, mapping, and error handling |
| API tests | Validate status codes, request schemas, response envelopes, and error codes |
| Authorization tests | Verify ownership and denial of cross-workspace access |
| Database tests | Verify constraints, transactions, relationships, and persistence behavior |
| Integration tests | Verify interactions between approved application layers |
| UI tests | Verify relevant loading, success, empty, error, and validation states using the existing test stack |
| Security tests | Verify access control, secret boundaries, file validation, and share-link restrictions |
| Regression tests | Preserve existing behavior for the affected feature |

Test depth must match the risk. Changes involving medical data, authorization, file access, or sharing require more rigorous coverage than purely cosmetic changes.

### 10.3 Deterministic tests

Tests MUST be repeatable and independent of unpredictable external services.

- Mock third-party HTTP calls in unit tests.
- Use controlled fixtures and deterministic inputs.
- Avoid dependence on live AI providers.
- Avoid dependence on real medical records.
- Do not use production credentials or real user data in tests.
- Control time when testing expiry, retention, timestamps, and retry behavior.
- Avoid arbitrary sleeps when a deterministic synchronization mechanism is available.
- Clean up test-created records and storage objects.
- Avoid test-order dependencies.
- Do not weaken assertions to eliminate flaky failures.

Integration tests may use approved local or isolated test services. External calls must be explicit, controlled, and never triggered accidentally by ordinary test runs.

### 10.4 Mandatory security scenarios

For affected functionality, test at least the relevant cases below:

- Unauthenticated requests are rejected.
- Expired or invalid tokens are rejected.
- A user cannot access another workspace's resources.
- A user cannot use a document UUID to access an unauthorized version or summary.
- A user cannot share a document version belonging to another workspace.
- A share link cannot expose unselected items.
- Expired or revoked share links stop granting access.
- A deleted document cannot be downloaded through the normal API.
- Invalid file types and oversized files are rejected.
- Invalid enums, malformed UUIDs, and incorrect field types are rejected.
- Idempotent retries do not create duplicate operations.
- Provider failures produce safe, documented errors.
- Logs and error responses do not contain medical content or secrets.

### 10.5 Verification commands

Before completing a task, run the relevant existing commands for:

- Type checking.
- Linting.
- Formatting checks.
- Unit tests.
- Relevant integration tests.
- Production build.
- Migration validation, if applicable.

Discover the actual commands from repository scripts and configuration files. Do not invent a test command or assume a tool is installed.

Run the smallest relevant checks first, followed by broader checks when practical. Do not claim full verification if only a subset was executed.

If a check fails:

1. Determine whether the failure is caused by the change.
2. Fix failures within the approved scope.
3. Report unrelated pre-existing failures separately.
4. Never hide a failure by removing tests, disabling checks, or changing assertions without justification and approval.

### 10.6 Human review boundaries

Human approval is required before:

- Introducing a dependency.
- Changing public API contracts.
- Changing database schema or migration behavior.
- Changing authentication or authorization architecture.
- Modifying RLS or privileged database access.
- Adding an external provider or transmitting medical content to a new service.
- Altering data retention, deletion, or recovery rules.
- Performing destructive operations.
- Deploying to production or executing production migrations when not explicitly authorized.

---

## 11. Git, Commit & Changelog Discipline

### 11.1 Inspect repository state first

Before editing or committing, inspect the Git status and current branch.

- Preserve existing uncommitted changes.
- Do not assume the working tree is clean.
- Do not overwrite user modifications.
- Do not reset, rebase, amend, or force-push without explicit authorization.
- Do not stage unrelated files.
- Do not include secrets, credentials, local databases, generated artifacts, or temporary debugging output in commits.

If user changes overlap with the task, inspect them carefully and preserve their intent.

### 11.2 Commit message convention

Use Conventional Commits when creating commits:

- `feat:` — new approved functionality.
- `fix:` — bug fixes.
- `refactor:` — approved structural changes without intended behavior changes.
- `test:` — tests.
- `docs:` — documentation.
- `chore:` — maintenance and tooling.
- `perf:` — performance improvements.
- `security:` — security-specific changes, if this prefix is supported by the repository's existing convention.

Examples:

- `feat: add family member management`
- `fix: enforce document ownership checks`
- `test: cover expired share links`
- `docs: clarify upload validation rules`

Keep messages concise, specific, and truthful.

### 11.3 Atomic changes

Prefer small, logical, independently reviewable commits.

- Do not combine unrelated features into one commit.
- Do not include broad formatting changes alongside a small bug fix.
- Do not commit half-finished features unless explicitly requested.
- Do not create commits unless the task or human instruction calls for them.
- Do not rewrite commit history without approval.
- Do not automatically push to a remote repository.

If the task requires multiple changes, organize them into logical units and explain the sequence.

### 11.4 Changelog and documentation discipline

Update a changelog only if the repository already has one or the task explicitly requires it.

Do not create a new changelog system, release process, or versioning policy without approval.

When an approved change affects API behavior, database structure, environment configuration, security boundaries, or operational procedures, update the relevant documentation in the same task where practical.

Do not modify the five foundational documents merely to make the implementation appear compliant. Update them only when a real, approved contract change has occurred.

### 11.5 Final report

At the end of each task, provide a concise report containing:

1. **Implemented:** What changed and why.
2. **Files changed:** The relevant file paths.
3. **Verification:** The tests, lint checks, type checks, and builds actually run, with their results.
4. **Security or data impact:** Any relevant authorization, privacy, migration, or external-service implications.
5. **Outstanding issues:** Known failures, missing configuration, untested behavior, or required human decisions.

Do not claim completion if a release-blocking issue remains unresolved.

---

## Final Enforcement Rules

These rules override an agent's default tendency to improvise, expand scope, or optimize for apparent task completion.

1. **Inspect before modifying.**
2. **Follow the approved foundation documents.**
3. **Never invent product requirements, database objects, API contracts, dependencies, or permissions.**
4. **Never expand the task scope without approval.**
5. **Never weaken security, validation, type safety, or tests to make an implementation pass.**
6. **Never expose secrets or unauthorized medical data.**
7. **Never bypass backend authorization or database integrity controls.**
8. **Never perform destructive or production-impacting operations without authorization.**
9. **Reuse established components, services, patterns, and dependencies before creating alternatives.**
10. **Verify the actual result and report honestly.**

**When in doubt, stop the affected change, explain the ambiguity, and ask for a decision. A safe, reviewable implementation is more valuable than a fast implementation that violates MedLab's approved contracts.**