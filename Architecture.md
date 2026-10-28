# MedLab — Architecture Specification

**Document:** `ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** Architecture baseline for implementation  
**Product:** MedLab — Family Medical Records & AI Health Assistant  
**Architecture style:** Decoupled Next.js frontend + FastAPI modular monolith  
**Database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth  
**File storage:** Private Supabase Storage  
**AI provider gateway:** OpenRouter  
**Frontend hosting:** Vercel  
**Backend hosting:** Railway  

---

## 1. Architecture Overview & Core Philosophy

### 1.1 Architectural pattern

MedLab uses a **decoupled frontend and backend API**, with a modular monolith for backend business logic.

The frontend is a Next.js application responsible for rendering, navigation, form interactions, and presentation. The FastAPI backend is the authoritative application layer responsible for business rules, permissions, data access, file operations, AI orchestration, and share-link security.

Supabase provides managed PostgreSQL, authentication, and private object storage. OpenRouter provides access to approved language models.

The architecture consists of five principal layers:

1. **Presentation:** Next.js, React, TypeScript, and the approved design system.
2. **Application API:** FastAPI routes, request validation, authentication dependencies, and business orchestration.
3. **Domain and services:** Family access rules, medical records, document processing, AI explanations, and sharing.
4. **Persistence and external adapters:** PostgreSQL, Supabase Storage, Supabase Auth verification, and OpenRouter.
5. **Infrastructure:** Vercel, Railway, Supabase, environment configuration, CI/CD, and operational monitoring.

### 1.2 High-level system diagram

    User Browser
        |
        | HTTPS
        v
    Vercel — Next.js Application
        |
        | HTTPS + authenticated API requests
        v
    Railway — FastAPI Application
        |
        +---- Authentication verification
        |       |
        |       v
        |    Supabase Auth / JWT verification
        |
        +---- Application services
        |       |
        |       +---- PostgreSQL through SQLAlchemy
        |       |
        |       +---- Private Supabase Storage
        |       |
        |       +---- OpenRouter AI adapter
        |
        +---- Database-backed document processing jobs
                |
                v
             Railway Worker
             (same backend codebase)

    External recipient
        |
        | HTTPS + unlisted share token
        v
    FastAPI share-link endpoints
        |
        +---- Validate token, expiry, revocation, and scope
        +---- Return only authorized shared content

The worker is a separate runtime process using the same backend codebase, database, service layer, and configuration. It is not a separate microservice or independently designed domain.

### 1.3 Core engineering principles

#### Simplicity first

- Use one frontend application.
- Use one backend codebase.
- Use one primary relational database.
- Use private object storage.
- Use one AI provider gateway.
- Add infrastructure only when a demonstrated requirement justifies it.

Do not introduce microservices, Kubernetes, Redis, Kafka, a separate vector database, or a distributed workflow engine into the MVP.

#### Clear ownership of business logic

FastAPI owns authoritative business logic and permissions.

Next.js must not independently implement a competing version of family permissions, document ownership rules, share-link validation, or AI access policy.

Frontend validation improves user experience but never replaces backend validation.

#### Explicit boundaries

- UI components do not query PostgreSQL.
- UI components do not hold Supabase service-role credentials.
- Business services do not depend on React or Next.js.
- API routes do not contain substantial business logic.
- External provider calls go through adapters.
- Authorization is enforced in the backend, close to the data operation.
- Share-link access is isolated from authenticated family-account access.

#### Strict type safety

- Use TypeScript for the frontend.
- Use Python type annotations and Pydantic models for the backend.
- Define explicit API request and response contracts.
- Generate or maintain typed frontend API models from the FastAPI OpenAPI specification.
- Do not use untyped response objects as the normal application contract.

#### Colocation without duplication

Place code near the feature that owns it when the code is specific to that feature.

Shared utilities should be introduced only when there is a real shared responsibility. Avoid generic service registries, unnecessary base classes, and speculative plugin systems.

#### Security by default

Medical records are sensitive information.

Every access to a record, document, AI context, family profile, or share link must be authorized on the server. Frontend visibility, hidden buttons, and unpredictable identifiers are not security controls.

#### Durable processing

Document upload and AI analysis are separate operations. A successful upload must remain successful even if AI processing fails.

Processing work that must survive application restarts must be persisted, not held only in an in-memory background task.

### 1.4 Architectural decisions

| Concern | Decision |
|---|---|
| Frontend/backend relationship | Decoupled Next.js + FastAPI |
| Backend pattern | Modular monolith |
| Main database | Supabase PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Database migrations | Alembic |
| Authentication | Supabase Auth |
| File storage | Private Supabase Storage bucket |
| AI provider | OpenRouter behind an adapter |
| Background processing | PostgreSQL-backed job records and a worker |
| Cache | No shared application cache in MVP |
| Queue broker | None in MVP |
| Vector database | None in MVP |
| Frontend hosting | Vercel |
| Backend and worker hosting | Railway |
| Deployment automation | GitHub Actions and platform integrations |
| API documentation | FastAPI-generated OpenAPI |
| API versioning | `/api/v1` |

### 1.5 Non-negotiable architectural rules

1. The backend is the source of truth for permissions and business rules.
2. Supabase service-role or secret credentials never enter frontend code.
3. Database queries live in the backend data-access and service layers.
4. Files are private by default.
5. AI-generated explanations are not diagnoses or verified clinical decisions.
6. An AI provider failure must not destroy or invalidate the original document.
7. Share-link tokens are treated as secrets.
8. No medical data is logged by default.
9. Production data must never be used casually in development or test environments.
10. No public launch until security-critical tests and deployment checks pass.

---

## 2. Approved Tech Stack & Dependency Manifest

### 2.1 Frontend

| Layer | Approved choice | Reason |
|---|---|---|
| Framework | Next.js App Router | Routing, rendering, layouts, and production frontend deployment |
| Language | TypeScript, strict mode | Compile-time checks and maintainable application contracts |
| UI runtime | React | Component-based interface |
| Styling | Tailwind CSS | Consistent implementation of `DESIGN.md` tokens |
| UI primitives | shadcn/ui with Radix UI primitives as needed | Accessible dialogs, menus, forms, and other common controls |
| Icons | Lucide React | Consistent outline iconography |
| Server data fetching | Native `fetch` through the API client | Minimal dependencies and explicit request behavior |
| Client-side server-state cache | TanStack Query | Query lifecycle, mutation state, and cache invalidation where client-side fetching is required |
| Local state | React state and context | Local UI interactions and narrowly scoped shared state |
| Forms | React Hook Form | Practical form state and validation integration |
| Frontend validation | Zod | Typed client-side validation schemas |
| Dates | date-fns | Date formatting and comparison without a heavy date library |
| API contracts | Generated TypeScript types from FastAPI OpenAPI | Reduces frontend/backend contract drift |
| Testing | Vitest, React Testing Library, Playwright | Unit, component, and end-to-end tests |

#### Frontend state rules

Use the simplest state mechanism that fits the data.

- **Server Components:** page rendering and initial reads where appropriate.
- **TanStack Query:** client-managed API reads, mutations, retries, and invalidation when needed.
- **React state:** dialog visibility, active tabs, temporary selections, and other local UI state.
- **React context:** narrowly scoped state shared by a component subtree.
- **URL search parameters:** shareable filters, pagination, and search terms when appropriate.

Do not introduce Redux, Zustand, or another global store by default.

Do not use TanStack Query as a replacement for the backend API or as a durable storage layer.

#### Frontend styling rules

- Follow the approved `DESIGN.md` palette, typography, spacing, radii, and component behavior.
- Define design tokens centrally.
- Use Tailwind utilities and shared design-system components rather than repeated custom styling.
- Keep shared primitives in the designated UI component directory.
- Do not introduce a second styling engine.
- Do not add a second component library for convenience.
- Do not make unapproved dark mode a requirement; MedLab is light-theme-only for version 1.0.

### 2.2 Backend and runtime

| Layer | Approved choice | Reason |
|---|---|---|
| Language | Python | Fits AI integration and application development |
| API framework | FastAPI | Typed HTTP APIs, validation, dependency injection, and OpenAPI |
| Runtime | Supported stable Python release, pinned per project | Predictable deployment behavior |
| ASGI server | Uvicorn | Standard FastAPI runtime |
| Request/response validation | Pydantic v2 | Explicit data contracts and validation |
| ORM | SQLAlchemy 2.x | Relational data access and transaction management |
| PostgreSQL driver | psycopg 3 | Maintained PostgreSQL driver with synchronous and asynchronous options |
| Migrations | Alembic | Versioned, reviewable schema evolution |
| HTTP client | HTTPX | External provider calls, connection reuse, and explicit timeouts |
| JWT verification | A maintained JWT library compatible with Supabase's signing configuration | Verify authenticated requests correctly |
| Configuration | Pydantic Settings | Typed environment configuration and fail-fast validation |
| Logging | Python standard logging with structured JSON output | Consistent operational logs without unnecessary observability dependencies |
| Testing | pytest, HTTPX test utilities | API and service tests |
| Static analysis | Ruff and mypy or an equivalent strict type-checking setup | Consistent Python quality checks |

#### Database driver decision

Use SQLAlchemy 2.x with the Psycopg 3 driver as the default database-access approach.

Prefer synchronous SQLAlchemy sessions and a synchronous PostgreSQL driver initially unless a measured workload or explicit concurrency requirement justifies adopting asynchronous database access.

Do not mix synchronous and asynchronous database patterns casually.

Use one consistent session lifecycle and transaction convention throughout the backend.

### 2.3 Database and storage

| Layer | Approved choice | Rules |
|---|---|---|
| Relational database | Supabase PostgreSQL | Authoritative structured data store |
| ORM | SQLAlchemy 2.x | Database access through backend services/repositories |
| Migrations | Alembic | All schema changes are version-controlled |
| Object storage | Supabase Storage | Private medical-document bucket |
| Application cache | None initially | Avoid stale sensitive data and unnecessary infrastructure |
| Job persistence | PostgreSQL | Durable document-processing jobs |
| Vector search | Deferred | Use relational metadata and supported document search first |

#### Connection pooling

Use Supabase's supported connection options appropriate to the deployment environment.

- Use the connection mode recommended for the selected Supabase and Railway configuration.
- Prefer a transaction-capable pooler mode where compatible with the ORM and migration workflow.
- Use a direct database connection for schema migrations when required by the selected deployment configuration.
- Configure a small, explicit connection pool.
- Account for the combined connections of API and worker processes.
- Set connection and query timeouts.
- Never create a new engine for every request.
- Never allow connection pools to grow without limits.

The final pool sizes must be chosen based on Supabase plan limits, Railway process counts, and measured traffic.

### 2.4 Infrastructure and hosting

| Layer | Approved choice | Responsibility |
|---|---|---|
| Source control | GitHub | Source history and review |
| Frontend deployment | Vercel | Next.js hosting and preview deployments |
| Backend deployment | Railway | FastAPI application |
| Background worker | Railway worker process | Durable AI/document-processing jobs |
| Database | Supabase | Managed PostgreSQL |
| Authentication | Supabase Auth | User identity and authentication lifecycle |
| File storage | Supabase Storage | Private document objects |
| AI gateway | OpenRouter | Model API routing |
| CI | GitHub Actions | Lint, type checks, tests, and build validation |
| DNS | Managed DNS configured for the chosen domains | Domain resolution |
| TLS | Hosting-platform managed certificates | HTTPS |
| Error reporting | Structured application logs initially; optional approved error-monitoring service later | Diagnostics |

No separate CDN, API gateway, container orchestration platform, or distributed cache is required for the initial release.

### 2.5 Approved core libraries

#### Frontend

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `shadcn/ui` components selected for actual use
- `@radix-ui/*` primitives required by those components
- `lucide-react`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `date-fns`
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@playwright/test`

Install only packages needed by the implemented product.

#### Backend

- `fastapi`
- `uvicorn`
- `pydantic`
- `pydantic-settings`
- `sqlalchemy`
- `psycopg`
- `alembic`
- `httpx`
- A maintained JWT/JWKS verification library selected during implementation
- `pytest`
- `pytest-cov`
- `ruff`
- `mypy`, or an explicitly chosen equivalent

Use a maintained Supabase Python client only where it materially simplifies supported Auth or Storage operations. Do not use it as an excuse to bypass the application's service and authorization layers.

### 2.6 Dependency policies

The approved stack is a constraint, not an invitation to install every listed package.

Before adding a dependency:
1. Check whether an approved library already solves the problem.
2. Confirm that the new package is maintained and compatible.
3. Evaluate its security and transitive dependency impact.
4. Document the reason for adding it.
5. Avoid adding overlapping libraries.

#### Banned or deferred dependencies

Do not introduce the following without explicit architectural approval:

- Redux or Zustand for ordinary UI state.
- A second styling engine such as styled-components.
- A second component framework alongside shadcn/ui and Radix.
- Axios when native `fetch` or HTTPX is sufficient.
- A second date library.
- A second validation framework for the same layer.
- Redis, Kafka, RabbitMQ, or a managed queue service in MVP.
- Celery or another distributed task framework in MVP.
- Kubernetes or microservices.
- A separate vector database in MVP.
- An ORM/query builder alongside SQLAlchemy.
- Multiple AI SDKs that duplicate OpenRouter access.
- An in-house authentication system.
- Direct database access from frontend code.
- Ad hoc SQL string concatenation.
- An analytics package that captures medical data or sensitive page contents by default.

---

## 3. Frontend & Backend System Architecture

### 3.1 Frontend architecture

The frontend is a Next.js App Router application written in TypeScript.

It owns:
- Page composition.
- Navigation.
- Presentation and design tokens.
- Form interactions.
- Client-side input feedback.
- Display of API results.
- User-friendly loading, empty, and error states.

It does not own:
- Authoritative authorization decisions.
- Medical record ownership rules.
- Storage access policies.
- AI prompt execution.
- Share-token validation.
- Database transactions.
- Durable document-processing jobs.

### 3.2 Rendering strategy

Use a hybrid rendering approach.

#### Server Components

Use Server Components for:
- Static public content.
- Public landing-page content.
- Authenticated page shells where appropriate.
- Initial server-side reads where secure session forwarding is available.
- Noninteractive layout elements.

#### Client Components

Use Client Components for:
- Interactive forms.
- Search controls.
- Dialogs and menus.
- File-selection interactions.
- AI conversation interfaces.
- Upload progress.
- Interactive charts.
- Client-side query and mutation behavior.

Do not mark entire pages as Client Components merely because one section needs interactivity.

#### Static generation

Static generation is appropriate for public, non-sensitive content.

Do not statically generate private medical records or user-specific dashboard content.

#### Caching

Private medical responses must not be stored in shared public caches.

- Use explicit no-store behavior for sensitive reads and mutations where applicable.
- Do not apply public CDN caching to authenticated record responses.
- Avoid Next.js shared caching for user-specific data.
- Keep any client-side query cache scoped to the active session and authorization context.
- Clear or invalidate relevant cached data on sign-out and account/family-context changes.

### 3.3 Routing

Use Next.js App Router conventions.

Organize routes by public, authentication, and authenticated application concerns.

Suggested route groups:

- Public pages: landing and public informational content.
- Authentication pages: sign-in, registration, and recovery.
- Authenticated application: overview, records, assistant, family, and settings.
- Public share viewer: isolated, token-authorized pages.

Route groups are organizational. They do not create authorization boundaries on their own.

### 3.4 Frontend data-fetching rules

- All domain data comes from FastAPI.
- The frontend may use Supabase Auth SDKs for authentication.
- The frontend must not query private application tables directly through the Supabase client.
- The frontend must not use the Supabase service-role key.
- Use a centralized typed API client.
- Attach the authenticated user's access token to protected API requests.
- Validate the response shape at appropriate boundaries.
- Handle `401`, `403`, `404`, `409`, `422`, `429`, and `5xx` responses consistently.
- Avoid duplicating the same fetch logic across multiple components.
- Use request cancellation where appropriate.
- Do not retry non-idempotent mutations automatically without a safe idempotency strategy.

The frontend should use the official Supabase SSR integration for session handling across server and browser contexts. Do not assume that the client-side SDK automatically creates an HttpOnly session cookie. Document the actual token-storage behavior and apply the appropriate XSS protections.

### 3.5 Backend architecture

The backend is a modular monolith with clear internal modules.

Recommended module boundaries:

- Authentication and authorization.
- Users and family membership.
- Medical records and metadata.
- Document upload and retrieval.
- Document processing.
- AI explanation and conversation.
- Historical comparison.
- Sharing.
- Health-source adapters.
- System health and operational endpoints.

Each module may contain:
- API routes.
- Pydantic schemas.
- Service functions.
- Data-access functions or repositories where warranted.
- Domain-specific exceptions.
- Tests.

Avoid creating repository abstractions for trivial single-query cases unless they improve testability, reuse, or isolation.

### 3.6 Backend request lifecycle

A normal authenticated request follows this sequence:

1. FastAPI receives the request.
2. Middleware applies request-level controls and correlation identifiers.
3. The route validates the request shape.
4. Authentication dependencies verify the caller's identity.
5. The relevant service checks resource and family permissions.
6. The data-access layer performs authorized reads or mutations.
7. External adapters are invoked if needed.
8. The service returns a defined result.
9. The route serializes the response through a Pydantic schema.
10. Errors are translated into safe API responses.
11. Structured logs record operational metadata without sensitive medical content.

### 3.7 Service-layer rules

Services own business operations.

Examples:
- Create a medical record.
- Verify that the user can access a record.
- Generate an AI explanation.
- Schedule document processing.
- Create a share link.
- Revoke a share link.
- Compare compatible historical observations.

Routes should remain thin and delegate business behavior to services.

Services should not import frontend modules or depend on request-specific global state.

Pass the authenticated principal and relevant request context explicitly.

### 3.8 Background processing

Document processing requires a durable mechanism because uploaded files may need OCR, extraction, AI explanation, and summary persistence.

Use a small PostgreSQL-backed job system in the same backend repository.

The API:
1. Validates and stores the uploaded file.
2. Creates the record metadata.
3. Creates a processing-job record.
4. Commits the transaction.
5. Returns the saved record and its processing status.

The worker:
1. Claims an available job.
2. Marks it as processing with a lease or equivalent recovery mechanism.
3. Performs the supported extraction and AI tasks.
4. Saves the result and status.
5. Records a safe failure state when processing fails.
6. Retries only failures classified as retryable.

Use database transactions and locking appropriate to the chosen PostgreSQL implementation so multiple worker instances cannot accidentally process the same job concurrently.

The worker must recover jobs left in an abandoned processing state after a process crash.

Do not use in-memory background tasks as the only durable record of a required operation.

### 3.9 Middleware pipeline

Keep middleware minimal and explicit.

Recommended responsibilities:
- Trusted-host or host validation where applicable.
- CORS enforcement.
- Request correlation ID.
- Security-related response headers.
- Request timing and structured access logging.
- Rate-limit integration where configured.

Authentication and resource authorization should primarily be enforced through FastAPI dependencies and service-layer checks, not by relying exclusively on middleware.

---

## 4. End-to-End Data Flow & State Lifecycle

### 4.1 Read flow

Example: loading the medical records page.

1. The user opens the records page.
2. Next.js renders the page shell.
3. The frontend obtains the current authenticated session using the approved Supabase Auth integration.
4. The API client calls the FastAPI records endpoint over HTTPS.
5. The access token is sent through the approved authorization mechanism.
6. FastAPI verifies the token and establishes the authenticated principal.
7. The records service checks family and record-level access.
8. SQLAlchemy retrieves only authorized metadata.
9. Pydantic serializes the response.
10. The frontend renders the result.
11. The frontend shows loading, empty, success, or error feedback as appropriate.

Private record responses must not be publicly cached.

The same authorization checks apply even if the frontend previously loaded the record.

### 4.2 Write and mutation flow

Example: editing record metadata.

1. The user changes a field.
2. The form performs client-side validation.
3. The user submits the form.
4. The API client sends the request with authentication.
5. FastAPI validates the request through Pydantic.
6. The service verifies access to the target record.
7. The service applies business rules and normalization.
8. SQLAlchemy starts or uses the required transaction.
9. The service performs the authorized mutation.
10. The transaction commits.
11. The API returns the saved representation.
12. The frontend invalidates or updates relevant query data.
13. The UI displays success only after confirmation.

If the operation fails, the frontend preserves user input when safe and communicates the failure.

### 4.3 File upload flow

1. The user selects a supported file.
2. The frontend performs basic file-size and type checks.
3. The user confirms the target family member and metadata.
4. The frontend submits the upload using the approved upload mechanism.
5. The backend verifies authentication and permission to upload for that member.
6. The backend validates the actual file content and size.
7. The backend assigns a server-generated object key.
8. The file is uploaded to a private Supabase Storage bucket.
9. The backend creates or finalizes the medical record metadata.
10. A processing job is persisted.
11. The backend returns the record and current processing status.
12. The worker extracts supported content and generates the approved AI explanation.
13. The worker stores the explanation and processing status.
14. The frontend refreshes or polls the record status.
15. The user can open the original document regardless of an optional AI-processing failure, subject to authorization.

#### Upload consistency

Storage and PostgreSQL do not share one atomic transaction.

The implementation must account for partial failures.

For example:
- If the object upload succeeds but the database write fails, perform safe cleanup or record a recoverable orphan for reconciliation.
- If the record exists but job creation fails, return a clearly recoverable error and provide a safe way to enqueue processing again.
- If processing fails, retain the original file and record.
- Never report full success when the original object has not been safely persisted.

Use server-generated object keys that do not contain medical details or personal information.

### 4.4 Document retrieval flow

1. The frontend requests a record.
2. The backend authenticates the user.
3. The service verifies access to the record.
4. The service retrieves the record metadata.
5. The backend creates a short-lived signed URL or streams the file through an authorized endpoint, according to the selected download strategy.
6. The user views or downloads the original file.

Signed URLs must be short-lived and must not be written to logs.

The final implementation must choose one consistent retrieval pattern for ordinary document access. A short-lived signed URL is the default for supported browser previews and downloads when its exposure and expiry behavior are acceptable.

### 4.5 AI explanation flow

1. A document-processing job is claimed by the worker.
2. The worker retrieves the private file using server credentials.
3. The extraction service obtains supported text or image input.
4. The service normalizes the content and records extraction limitations.
5. The AI service builds a task-specific prompt.
6. The OpenRouter adapter selects an approved model.
7. The adapter submits the request with explicit timeout and output constraints.
8. The response is parsed and validated.
9. The service checks required fields and rejects malformed or unsafe output.
10. The result is saved with its source record, model metadata, and generation status.
11. The worker marks the job complete.
12. The frontend shows the saved explanation with clear AI provenance.

Never mark unvalidated free-form output as a successfully structured medical explanation.

### 4.6 Historical comparison flow

1. The user opens a supported comparison view.
2. The backend checks access to the relevant family member and records.
3. The comparison service retrieves relevant saved observations.
4. The service checks units, measurement types, dates, and source metadata.
5. Compatible observations are normalized where a safe conversion is defined.
6. Incompatible observations are excluded or explicitly flagged.
7. The API returns structured comparison data and limitations.
8. The frontend renders the comparison and a text summary.

The application must not silently compare unrelated tests or values with different units.

### 4.7 Share-link creation flow

1. An authorized owner opens the sharing interface.
2. The owner selects the exact records or permitted content.
3. The owner chooses an allowed expiration duration.
4. The frontend presents the final scope and expiry for review.
5. The backend rechecks the owner's permissions.
6. The backend validates the selected content and expiry.
7. The backend generates a cryptographically secure random token.
8. The database stores a hash of the token, the approved scope, expiry, owner, and revocation state.
9. The raw token is returned only when the link is successfully created.
10. The owner copies or shares the URL.

Do not store the raw bearer token in the database or logs.

### 4.8 Share-link access flow

1. A recipient opens the unlisted share URL.
2. The backend extracts the token from the designated route.
3. The backend hashes the token and locates the corresponding share record.
4. The backend checks expiry, revocation, and active status.
5. The backend loads only the records explicitly included in the share scope.
6. The backend returns the permitted representation.
7. File retrieval uses a controlled, short-lived access mechanism.
8. Expired or revoked links return an unavailable state without revealing unrelated account information.

Public share routes must not inherit authenticated-user access or use the owner identity as implicit authorization for unrelated content.

### 4.9 State lifecycle

Use explicit, persisted states where a workflow spans requests or process restarts.

Examples:

**Document**
- `uploaded`
- `processing`
- `ready`
- `processing_failed`
- `deleted` or the approved soft-deletion state

**Processing job**
- `pending`
- `processing`
- `succeeded`
- `retryable_failed`
- `failed`

**Share link**
- `active`
- `expired`
- `revoked`

The exact names may be adjusted during domain modeling, but the lifecycle and transitions must remain explicit and documented.

Do not infer a record's status solely from the presence or absence of an AI summary.

---

## 5. Exact Project Folder & File Structure

The repository contains the Next.js application and the FastAPI backend as separate deployable applications, with shared API contracts generated from the backend's OpenAPI specification.

Recommended monorepo layout:

    medlab/
    ├── apps/
    │   ├── web/
    │   │   ├── public/
    │   │   ├── src/
    │   │   │   ├── app/
    │   │   │   │   ├── (public)/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── privacy/
    │   │   │   │   ├── (auth)/
    │   │   │   │   │   ├── login/
    │   │   │   │   ├── signup/
    │   │   │   │   └── forgot-password/
    │   │   │   ├── (app)/
    │   │   │   │   └── app/
    │   │   │   │       ├── layout.tsx
    │   │   │   │       ├── page.tsx
    │   │   │   │       ├── records/
    │   │   │   │       │   ├── page.tsx
    │   │   │   │       │   ├── upload/
    │   │   │   │       │   └── [recordId]/
    │   │   │   │       ├── assistant/
    │   │   │   │       ├── family/
    │   │   │   │       │   └── [memberId]/
    │   │   │   │       ├── search/
    │   │   │   │       └── settings/
    │   │   │   ├── share/
    │   │   │   │   └── [token]/
    │   │   │   ├── auth/
    │   │   │   │   └── callback/
    │   │   │   ├── error.tsx
    │   │   │   ├── global-error.tsx
    │   │   │   ├── not-found.tsx
    │   │   │   ├── layout.tsx
    │   │   │   └── globals.css
    │   │   ├── components/
    │   │   │   ├── ui/
    │   │   │   ├── layout/
    │   │   │   ├── forms/
    │   │   │   └── feedback/
    │   │   ├── features/
    │   │   │   ├── auth/
    │   │   │   ├── dashboard/
    │   │   │   ├── records/
    │   │   │   ├── uploads/
    │   │   │   ├── assistant/
    │   │   │   ├── family/
    │   │   │   ├── sharing/
    │   │   │   └── settings/
    │   │   ├── lib/
    │   │   │   ├── api/
    │   │   │   ├── auth/
    │   │   │   ├── env/
    │   │   │   ├── query/
    │   │   │   └── utils/
    │   │   ├── hooks/
    │   │   ├── types/
    │   │   ├── tests/
    │   │   │   ├── unit/
    │   │   │   └── components/
    │   │   ├── next.config.ts
    │   │   ├── package.json
    │   │   └── tsconfig.json
    │   │
    │   └── api/
    │       ├── app/
    │       │   ├── main.py
    │       │   ├── core/
    │       │   │   ├── config.py
    │       │   │   ├── logging.py
    │       │   │   ├── security.py
    │       │   │   ├── errors.py
    │       │   │   └── middleware.py
    │       │   ├── api/
    │       │   │   ├── router.py
    │       │   │   └── v1/
    │       │   │       ├── auth.py
    │       │   │       ├── health.py
    │       │   │       ├── family.py
    │       │   │       ├── records.py
    │       │   │       ├── uploads.py
    │       │   │       ├── documents.py
    │       │   │       ├── assistant.py
    │       │   │       ├── comparisons.py
    │       │   │       └── sharing.py
    │       │   ├── dependencies/
    │       │   │   ├── auth.py
    │       │   │   ├── database.py
    │       │   │   └── permissions.py
    │       │   ├── modules/
    │       │   │   ├── users/
    │       │   │   ├── family/
    │       │   │   ├── records/
    │       │   │   ├── uploads/
    │       │   │   ├── processing/
    │       │   │   ├── assistant/
    │       │   │   ├── comparisons/
    │       │   │   └── sharing/
    │       │   ├── services/
    │       │   │   ├── storage_service.py
    │       │   │   ├── auth_service.py
    │       │   │   └── job_service.py
    │       │   ├── integrations/
    │       │   │   ├── supabase/
    │       │   │   ├── openrouter/
    │       │   │   └── medical_sources/
    │       │   ├── db/
    │       │   │   ├── base.py
    │       │   │   ├── session.py
    │       │   │   └── models/
    │       │   ├── schemas/
    │       │   ├── workers/
    │       │   │   ├── main.py
    │       │   │   └── processing_worker.py
    │       │   └── utils/
    │       ├── migrations/
    │       │   ├── env.py
    │       │   └── versions/
    │       ├── tests/
    │       │   ├── unit/
    │       │   ├── integration/
    │       │   ├── security/
    │       │   └── conftest.py
    │       ├── pyproject.toml
    │       └── alembic.ini
    │
    ├── packages/
    │   └── api-contracts/
    │       ├── README.md
    │       └── generated/
    │
    ├── docs/
    │   ├── PRD.md
    │   ├── DESIGN.md
    │   └── ARCHITECTURE.md
    │
    ├── scripts/
    ├── .github/
    │   └── workflows/
    ├── .gitignore
    ├── .env.example
    └── README.md

This tree defines the intended structure. Directories should be created as needed; do not populate the repository with empty modules or placeholder abstractions merely to match the diagram.

### 5.1 Frontend folder responsibilities

#### `apps/web/src/app/`

Owns route definitions, layouts, page composition, and Next.js route-level error states.

Keep page files thin. They should compose feature components and coordinate data loading, not implement domain rules.

#### `apps/web/src/components/ui/`

Contains shared, low-level design-system primitives, such as buttons, inputs, dialogs, badges, and cards.

These components should remain generic and follow `DESIGN.md`.

#### `apps/web/src/components/layout/`

Contains the application shell, desktop sidebar, mobile navigation, page headers, and shared layout components.

#### `apps/web/src/features/`

Contains feature-specific components, hooks, client schemas, and view models.

Examples:
- Record list filters belong to `features/records/`.
- Upload form behavior belongs to `features/uploads/`.
- Share-link creation UI belongs to `features/sharing/`.

Do not place domain-specific components in the generic UI directory.

#### `apps/web/src/lib/api/`

Contains the centralized API client, typed request helpers, error parsing, and API-specific utilities.

No feature component should independently reimplement authentication headers or error normalization.

#### `apps/web/src/lib/auth/`

Contains the approved Supabase browser/server client setup and frontend session utilities.

Never place service-role credentials here.

#### `apps/web/src/lib/env/`

Contains frontend environment access and validation. Public variables must be explicitly distinguished from server-only variables.

#### `apps/web/src/hooks/`

Contains genuinely reusable hooks that are not specific to one feature.

Prefer feature-local hooks when a hook has only one clear owner.

#### `apps/web/src/types/`

Contains shared frontend types not generated from the API specification and not owned by a single feature.

Do not duplicate generated API response definitions manually.

### 5.2 Backend folder responsibilities

#### `apps/api/app/main.py`

Creates the FastAPI application, registers middleware and routers, and initializes application-level resources.

Do not place business logic here.

#### `apps/api/app/api/`

Contains HTTP route handlers and API version registration.

Routes:
- Parse requests.
- Apply dependencies.
- Call services.
- Return defined responses.

They must not become the main location for business rules or large database queries.

#### `apps/api/app/dependencies/`

Contains reusable request dependencies:
- Authentication.
- Database sessions.
- Permission-related dependencies.
- Other cross-cutting request dependencies.

Resource-specific permissions must still be verified by the relevant service.

#### `apps/api/app/modules/`

Contains feature-specific backend domain logic.

Each module may contain:
- `models.py` for module-specific ORM models where appropriate.
- `schemas.py` for module-specific Pydantic models.
- `service.py` for business operations.
- `repository.py` for data-access logic when warranted.
- `exceptions.py` for module-specific failures.

Keep this structure lightweight. Avoid splitting every simple function into multiple files without a clear benefit.

#### `apps/api/app/services/`

Contains shared application-level services that coordinate multiple domain modules or integrations.

If a service clearly belongs to one domain, keep it inside that module instead.

#### `apps/api/app/integrations/`

Contains adapters for external systems.

External SDKs and HTTP APIs must be isolated here rather than imported throughout the domain layer.

#### `apps/api/app/db/`

Contains database engine/session lifecycle, shared ORM metadata, and model registration.

No route should create its own database engine.

#### `apps/api/app/schemas/`

Contains genuinely cross-module request or response contracts. Feature-specific schemas should remain with their module unless reuse justifies centralization.

#### `apps/api/app/workers/`

Contains the durable processing worker entry point and worker orchestration.

Workers call the same services as the API. They do not implement separate copies of business rules.

#### `apps/api/migrations/`

Contains Alembic configuration and versioned database migrations.

All schema changes must be represented by migrations.

#### `apps/api/tests/`

Contains unit, integration, and security-focused tests.

Keep tests near their logical category, with shared fixtures in `conftest.py` where appropriate.

### 5.3 Naming conventions

#### Frontend

- React components: `PascalCase`, such as `RecordCard.tsx`.
- Routes and directories: Next.js conventions; otherwise `kebab-case` for named folders.
- Hooks: `use-kebab-case.ts` or the project's consistently chosen TypeScript convention.
- Utilities: `kebab-case.ts`.
- Tests: use `.test.ts` or `.test.tsx` consistently.
- Constants: descriptive uppercase names only where the value is genuinely a constant.

#### Backend

- Python files and modules: `snake_case.py`.
- Functions and variables: `snake_case`.
- Classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Test files: `test_<module>.py`.
- Migration names: descriptive, unique, and ordered by Alembic.

### 5.4 Import direction

Allowed high-level dependency direction:

    Routes
      -> Services
        -> Domain logic / repositories
          -> Database or external adapters

Shared schemas, configuration, and core utilities may be imported by multiple layers.

Forbidden patterns:
- Database modules importing API route modules.
- Domain services importing frontend code.
- Integrations importing route handlers.
- Circular imports between feature modules.
- UI components importing database clients for application-data queries.

### 5.5 Shared contracts

The backend's OpenAPI document is the authoritative API contract.

Generate or update frontend API types as part of development and CI. Generated files must be clearly marked as generated and must not be manually edited.

Do not create a second, independently maintained API specification.

---

## 6. Database Interaction & Data Access Layer

### 6.1 Database ownership

PostgreSQL is the authoritative store for structured application data.

Supabase Storage is the authoritative store for original file objects.

The backend owns all normal application-data writes and reads. The frontend must not query private application tables directly using Supabase's data client.

### 6.2 ORM and session lifecycle

Use one SQLAlchemy engine per backend process.

Use a session factory configured during application startup.

For each request:
1. Acquire a database session.
2. Execute the required operation.
3. Commit only when the service has completed a successful write.
4. Roll back on failure.
5. Close the session.

Never retain a request-scoped session across unrelated requests.

Worker jobs must use their own bounded session lifecycle.

### 6.3 Query placement

Database access is allowed only in:
- Backend repositories/data-access modules.
- Approved service-level data-access code for simple cases.
- Migration scripts.

It is not allowed in:
- Next.js UI components.
- React hooks.
- API response serializers.
- External provider adapters.
- Frontend feature modules.

Keep authorization close to each resource lookup and mutation.

A query that retrieves a record by identifier must still verify that the current principal is permitted to access that record.

### 6.4 Transaction handling

Use explicit transaction boundaries for operations that change multiple related database records.

Examples:
- Creating record metadata and a processing-job record.
- Creating a share-link record and its selected content scope.
- Updating related ownership metadata.
- Saving an AI result and marking its processing job complete.

Transactions should be short. Do not hold a database transaction open while waiting for an external AI API or large file upload.

For long-running external work:
1. Persist the required state.
2. Commit.
3. Perform the external operation.
4. Start a new transaction to persist the result.

### 6.5 Migrations

Use Alembic for every schema change.

Rules:
- Never manually change the production schema without a migration.
- Review generated migrations before applying them.
- Keep migrations small and understandable.
- Test migrations against a clean database.
- Test upgrades from the current supported schema.
- Use a direct database connection where the migration requires it.
- Run production migrations as a controlled deployment step.
- Never let every API replica independently run migrations at startup.

Destructive changes should use a staged migration when necessary: add compatible structures, migrate data, update application behavior, and remove obsolete structures only after validation.

### 6.6 Connection pooling

Configure a bounded connection pool appropriate to the database plan.

Account for:
- API processes.
- Worker processes.
- CI/test processes.
- Migration jobs.
- Other authorized database consumers.

Do not set large pool sizes without calculating the combined connection count.

### 6.7 Caching policy

No shared application cache is required for MVP.

For sensitive data:
- Prefer correctness over aggressive caching.
- Do not publicly cache private responses.
- Invalidate client-side query state after mutations.
- Clear user-specific query state on sign-out.
- Revalidate permissions for every sensitive operation.

A cache may be introduced later for a demonstrated bottleneck, with explicit expiry, invalidation, and privacy rules.

### 6.8 Soft deletion and retention

The product requires recoverable deletion behavior, but the exact retention period must be approved.

The database model and service behavior must distinguish:
- Active records.
- Soft-deleted records.
- Records eligible for restoration.
- Records permanently deleted according to the approved policy.

A soft-deleted record must not appear in normal lists or remain accessible through ordinary share links.

The backend must also account for associated storage objects, AI-generated content, derived metadata, and relevant processing jobs.

Do not claim permanent erasure while copies remain in application-controlled storage or other systems covered by the deletion commitment.

### 6.9 Data integrity

Use database constraints for invariants that should not depend solely on application behavior.

Examples include:
- Required relationships.
- Unique identifiers.
- Non-null required fields.
- Valid status constraints where practical.
- Referential integrity.
- Appropriate uniqueness for share-token hashes.

The application must still validate business rules before committing data.

---

## 7. Authentication, Authorization & Session Architecture

### 7.1 Identity provider

Use Supabase Auth for:
- Email-based authentication.
- Google OAuth.
- Session lifecycle.
- Password recovery and supported account-management flows.

Do not build a custom password store or independent authentication system.

### 7.2 Authentication flow

1. The user signs in through the approved Supabase Auth flow.
2. Supabase issues its supported session and token credentials.
3. The frontend manages the session through the official Supabase integration.
4. The frontend sends an access token with protected FastAPI requests.
5. FastAPI verifies the token's signature and required claims.
6. The backend establishes the authenticated principal.
7. The service authorizes the requested resource operation.

The backend must validate the issuer, audience where applicable, expiry, and supported signing algorithm.

Use the configured Supabase signing-key/JWKS mechanism or another documented, supported verification path.

Do not trust a user ID supplied in a request body as proof of identity.

Do not trust unverified JWT payloads.

### 7.3 Session and token handling

- Use the official Supabase SSR integration in Next.js.
- Follow the provider's recommended PKCE and session-refresh behavior.
- Use HTTPS in production.
- Use secure cookie settings where cookies are used.
- Apply an appropriate SameSite policy.
- Do not assume that Supabase browser-managed session cookies are HttpOnly.
- Never place service-role keys or other server secrets in browser storage.
- Avoid logging access tokens, refresh tokens, OAuth codes, or callback URLs containing secrets.
- Clear frontend query state on sign-out.
- Handle expired sessions with a clear reauthentication flow.

If a future implementation introduces a backend-for-frontend session proxy, that is an architectural change requiring explicit design and CSRF review, not an ad hoc frontend workaround.

### 7.4 Authentication versus authorization

Authentication answers: "Who is making this request?"

Authorization answers: "Is this principal allowed to perform this operation on this resource?"

The second question must be evaluated for every sensitive request.

The frontend may hide actions that are unavailable to a user, but the backend must enforce the same restrictions independently.

### 7.5 Authorization model

The initial model includes:
- Authenticated account owner.
- Family members represented in the family account.
- Explicitly authorized users, if independent family access is approved.
- Public share-link recipients with narrowly scoped bearer-token access.

The exact member-role and invitation rules must be finalized before implementation. The architecture must not assume that a family profile automatically has its own login or permission to access records.

### 7.6 Resource authorization

Every service that accesses protected data must verify:
- The authenticated principal.
- The relevant family/account relationship.
- The target record's ownership or membership.
- The requested action.
- Any applicable sharing restrictions.
- The current record and link status.

Authorization must cover:
- Listing.
- Reading.
- Editing.
- Deleting.
- Downloading.
- Uploading.
- AI context retrieval.
- Historical comparison.
- Share-link creation and revocation.

Avoid insecure direct object references by ensuring that changing a record ID cannot bypass access checks.

### 7.7 Supabase Row Level Security

Supabase RLS can provide defense in depth where supported and correctly configured.

However:
- Do not treat frontend Supabase clients as the authoritative application API.
- Do not disable RLS casually.
- Document the role used for each database connection.
- Restrict privileged credentials to the backend.
- Verify the effective database role and its RLS behavior.
- Do not assume that RLS applies to operations made using privileged service credentials.

The backend's service-layer authorization remains mandatory even when RLS is enabled.

### 7.8 Service-role credentials

Supabase service-role or equivalent secret credentials:
- Exist only in server-side runtime configuration.
- Are never included in a Next.js public environment variable.
- Are never returned by an API endpoint.
- Are never placed in client bundles.
- Are never committed to source control.
- Are never logged.

Use the narrowest available credential and access pattern for each operation.

### 7.9 Share-link authorization

Share links use a separate, explicit authorization path.

- Generate a cryptographically random token.
- Store only a secure hash of the token.
- Validate expiry and revocation on every access.
- Restrict access to the exact selected records.
- Use only the required storage permissions.
- Do not grant access to the owner's wider family account.
- Do not log raw tokens.
- Avoid third-party scripts and analytics on public share pages.
- Apply no-index behavior and restrictive cache headers.

A share token is a bearer credential. Anyone possessing it may be able to access its scoped content until it expires or is revoked.

---

## 8. API Architecture & Communication Contracts

### 8.1 API conventions

Base path:

`/api/v1`

Use resource-oriented HTTP endpoints.

Examples of route families:
- Authentication and current-user context.
- Family members.
- Medical records.
- Uploads and documents.
- AI assistant.
- Historical comparisons.
- Share links.
- Health and readiness checks.

Use plural nouns for collection resources and stable resource identifiers for individual resources.

Use HTTP methods consistently:
- `GET` for reads.
- `POST` for creation or explicit commands.
- `PATCH` for partial updates.
- `DELETE` for deletion or revocation where semantically appropriate.

Avoid route names tied to frontend component names.

### 8.2 Response contracts

Use explicit Pydantic response models.

Successful responses should have a consistent shape appropriate to the endpoint, without unnecessary wrapper nesting.

For ordinary JSON endpoints, use a consistent success envelope where it materially improves API consistency:

- `data`: response payload.
- `meta`: optional pagination or contextual metadata.
- `request_id`: request correlation identifier where appropriate.

Errors should have a consistent structure containing:
- A stable machine-readable error code.
- A safe user-facing message.
- Optional field-level validation details.
- A request identifier for support and diagnostics.

Do not expose internal exception messages, SQL errors, tokens, storage credentials, or provider secrets.

File streaming and binary responses are exempt from JSON envelopes.

### 8.3 Status codes

Use status codes consistently.

| Status | Meaning |
|---|---|
| `200` | Successful read or update |
| `201` | Resource created |
| `202` | Accepted asynchronous operation |
| `204` | Successful operation without a response body |
| `400` | Invalid request semantics |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | Resource unavailable or not found |
| `409` | State conflict or duplicate operation |
| `413` | Payload too large |
| `415` | Unsupported media type |
| `422` | Request validation failure |
| `429` | Rate limit exceeded |
| `500` | Unexpected internal failure |
| `502` / `503` | Upstream or service unavailable |
| `504` | Upstream timeout where applicable |

For sensitive resources, choose response behavior that does not unnecessarily reveal whether a resource exists when the caller is unauthorized.

### 8.4 Request validation

Validate every untrusted request at the API boundary.

- Use Pydantic models.
- Reject unknown or invalid fields according to the endpoint contract.
- Enforce length and numeric bounds.
- Normalize permitted inputs.
- Validate enums and state transitions.
- Validate identifiers.
- Apply authorization after authentication.
- Validate file metadata and content independently.

Client-side validation is for usability, not security.

### 8.5 Pagination

Use explicit pagination for growing collections.

For the initial MVP, offset/limit pagination is acceptable for ordinary metadata lists.

Rules:
- Apply a sensible default limit.
- Enforce a maximum limit.
- Use stable ordering.
- Include pagination metadata when needed.
- Do not allow clients to request unlimited record lists.
- Consider cursor pagination later for very large or frequently changing datasets.

Use filters that correspond to supported product capabilities. Do not claim full-text medical search unless it is implemented.

### 8.6 Idempotency

Operations that may be retried need explicit retry behavior.

For important creation operations, use idempotency keys or equivalent deduplication where duplicate execution would be harmful.

Prioritize:
- Upload finalization.
- Processing-job creation.
- AI generation requests.
- Share-link creation.
- Destructive actions.

The exact idempotency mechanism should be selected per operation rather than added as a complex global framework.

### 8.7 Rate limiting

Apply rate limits to:
- Authentication-sensitive endpoints where appropriate.
- Upload initiation.
- AI requests.
- Expensive document processing.
- Share-link creation.
- Public share-link resolution.
- Search endpoints if abuse becomes material.

Use per-user and, where necessary, per-IP limits.

The first implementation may use bounded application-level limits or a supported platform control. Do not add Redis solely to support basic rate limiting.

If multiple backend replicas make in-memory limits insufficient, reassess the design before scaling.

### 8.8 OpenAPI contract

FastAPI generates the API specification.

Rules:
- Every public endpoint has documented request and response models.
- Security requirements are reflected in the specification.
- Error responses are documented.
- Generated frontend types are updated from the specification.
- CI detects unintended contract drift.
- Do not expose internal debugging endpoints in production documentation unless intended.

### 8.9 Health endpoints

Provide:
- A liveness endpoint that indicates whether the process is running.
- A readiness endpoint that checks essential dependencies sufficiently for deployment health.

Do not expose credentials, raw database connection details, or sensitive configuration in health responses.

---

## 9. External Services & Third-Party Integrations

### 9.1 Integration boundary

External services must be accessed through explicit adapters.

The domain layer should depend on application-level interfaces or well-defined service methods, not on provider-specific response shapes throughout the codebase.

Approved integrations:
- Supabase Auth.
- Supabase Storage.
- PostgreSQL through SQLAlchemy.
- OpenRouter.
- Approved medical-source retrieval providers where confirmed.

Do not add integrations simply because a provider is available.

### 9.2 Supabase Auth adapter

Responsibilities:
- Configure supported Auth integration.
- Support the approved identity flows.
- Verify or obtain identity information through supported mechanisms.
- Handle provider errors safely.

Do not treat a decoded, unverified JWT as proof of identity.

### 9.3 Supabase Storage adapter

Responsibilities:
- Upload private files.
- Retrieve authorized objects.
- Generate short-lived signed URLs where appropriate.
- Delete objects according to the approved retention policy.
- Report storage failures.
- Support safe cleanup of orphaned objects.

Use server-generated object keys.

Avoid filenames containing unnecessary personal or medical information.

### 9.4 OpenRouter adapter

Responsibilities:
- Send approved model requests.
- Apply timeouts.
- Apply token and output limits.
- Normalize provider errors.
- Record model and usage metadata when available.
- Apply approved model fallback rules.
- Validate responses before returning them to application services.

No feature module should call OpenRouter directly.

### 9.5 Medical-source adapter

Use a provider adapter only for approved, reliable sources.

Responsibilities:
- Retrieve permitted source material.
- Normalize titles, URLs, publication information, and relevant excerpts.
- Preserve provenance.
- Handle source failures and timeouts.
- Prevent retrieved content from being treated as trusted instructions.

Source selection and source-grounding behavior must be explicit in the AI service.

Do not represent an AI response as externally verified if no usable source was retrieved.

### 9.6 Timeouts and retries

Every external network request must have explicit connection and response timeouts.

Retry rules:
- Retry transient network errors and approved transient upstream failures.
- Use bounded exponential backoff with jitter where appropriate.
- Do not retry indefinitely.
- Do not retry non-idempotent requests without deduplication.
- Do not retry invalid input or permission failures.
- Respect provider rate-limit guidance.

Retries must be bounded by the overall job deadline and cost budget.

### 9.7 Webhooks

Do not introduce webhooks unless a selected integration actually requires them.

If webhooks are introduced:
- Verify signatures according to the provider's specification.
- Validate timestamps and replay protection where supported.
- Deduplicate repeated events.
- Persist the event before acknowledging it when durable processing is required.
- Do not trust webhook payloads without verification.
- Never log secrets from webhook headers or payloads.

### 9.8 External content handling

External source material and uploaded document text are untrusted content.

- Do not follow instructions embedded in uploaded documents.
- Do not treat retrieved web pages as system prompts.
- Do not allow external content to authorize tool calls.
- Keep system instructions separate from document text.
- Limit retrieved content to what is relevant.
- Escape content when rendering it.
- Preserve source references for the user's review.

---

## 10. AI / LLM Architecture

AI is a core MedLab capability and must have a dedicated application layer.

### 10.1 AI service boundary

Use a single AI orchestration layer behind the backend's service architecture.

Responsibilities:
- Task classification.
- Prompt selection.
- Context preparation.
- Model selection.
- Provider invocation.
- Output validation.
- Source attribution.
- Token and cost limits.
- Failure handling.
- Persistence of approved results.

The AI service must not have unrestricted access to all family records.

It receives only the authorized context required for the current task.

### 10.2 Provider routing

OpenRouter is the approved model gateway.

Define an explicit model configuration for each task type, such as:
- Document summarization.
- Plain-language medical explanation.
- Structured extraction.
- General health-information responses.
- Historical comparison assistance where an LLM is actually necessary.

Do not assume one model is best for every task.

Model configuration must include:
- Provider model identifier.
- Supported input modalities.
- Maximum input size.
- Maximum output tokens.
- Timeout.
- Cost limits where supported.
- Structured-output capability.
- Approved fallback model, if any.

Keep model selection in configuration or a centralized policy module rather than scattering model strings throughout feature code.

### 10.3 Prompt management

Store prompts in a dedicated, version-controlled prompt directory or a clearly defined prompt module.

Prompts should be:
- Task-specific.
- Versioned.
- Testable.
- Explicit about limitations.
- Explicit about output format.
- Explicit about treating uploaded documents and retrieved text as untrusted input.

Avoid one enormous universal prompt for every AI operation.

Record the prompt version used for a generated explanation when operationally useful.

Do not include real patient data in source-controlled prompt fixtures.

### 10.4 Document-processing pipeline

The pipeline should separate deterministic extraction from probabilistic interpretation.

Recommended stages:

1. File validation.
2. File-type detection.
3. Text extraction for supported formats.
4. OCR or image interpretation where supported.
5. Extraction quality assessment.
6. Structured field extraction where required.
7. Plain-language summary generation.
8. Output validation.
9. Persistence.
10. Processing-status update.

Do not send unsupported files to the model and hope it can interpret them.

If extraction quality is insufficient, persist a clear failure or partial-result state instead of inventing content.

### 10.5 Structured outputs

For outputs used by the application:
- Define explicit Pydantic models.
- Require expected fields.
- Validate types and permitted values.
- Enforce maximum lengths.
- Reject malformed output.
- Handle missing values explicitly.
- Keep unsupported claims out of structured fields.
- Persist the validated result, not arbitrary provider output.

Structured output from a model is not automatically medically correct. Validation establishes shape and consistency, not clinical truth.

### 10.6 AI explanation content

A document explanation may include:
- A concise summary.
- A plain-language explanation.
- Important terms and their meanings.
- Relevant findings extracted from the document.
- Source-backed context where available.
- Missing information and uncertainty.
- Appropriate guidance about seeking qualified medical advice.

The product must clearly distinguish the original document from generated explanation.

Do not:
- Present generated output as a confirmed diagnosis.
- Invent values absent from the source.
- Treat a laboratory reference range as universal across all laboratories.
- Claim a result is normal without adequate context.
- Invent external citations.
- Hide uncertainty when the document is ambiguous.

### 10.7 RAG and retrieval strategy

Use a pragmatic retrieval approach for version 1.0.

Start with:
- Authorized record metadata.
- Saved extracted text where permitted.
- Relevant document summaries.
- Explicitly selected family-member context.
- Approved external medical sources when required.

Retrieve only the records necessary for the user's request.

Apply authorization before including any record in model context.

Do not add a dedicated vector database at MVP launch without a demonstrated retrieval requirement that cannot be met adequately through simpler means.

If semantic search becomes necessary, evaluate PostgreSQL capabilities and the existing Supabase environment before adding another service.

### 10.8 General health assistant

The assistant may answer general health-information questions if that scope is approved.

When the user asks about personal records:
1. Determine the relevant family-member scope.
2. Verify access.
3. Retrieve only authorized and relevant information.
4. Include the necessary context in the model request.
5. Clearly identify the response as AI-generated.
6. Provide sources where available.
7. Preserve uncertainty and limitations.

Do not silently include every family document in every conversation.

### 10.9 Streaming

Streaming may be used for interactive assistant responses if it improves perceived responsiveness.

Rules:
- Use a supported streaming protocol consistently.
- Keep authentication and authorization in place for the entire request.
- Handle disconnects and cancellation.
- Do not persist incomplete responses as completed answers.
- Validate and finalize structured results before treating them as authoritative saved records.
- Avoid streaming sensitive content to unintended clients.
- Do not let a client disconnect cause an important background processing job to disappear.

Automatic document-processing jobs should normally use durable job status and persisted results rather than relying on a streaming connection.

### 10.10 Token and cost guardrails

Enforce:
- Maximum input size.
- Maximum output tokens.
- Per-task timeout.
- Per-user request limits.
- A bounded number of provider retries.
- Approved model fallbacks.
- Limits on retrieved context.
- Usage tracking where supported.

Do not send an entire document history when a small subset is sufficient.

Do not retry the same expensive request indefinitely.

### 10.11 Fallback behavior

When a provider or model fails:
1. Classify the error.
2. Retry only if the failure is transient and retryable.
3. Use an approved fallback model if appropriate.
4. Validate fallback output using the same schema.
5. Record the final processing state.
6. Retain the original file and any prior valid saved result.

Fallback must not silently downgrade to an unapproved model or bypass validation.

If all approved providers fail, return a clear unavailable state.

### 10.12 AI security and privacy

- Never include API keys in prompts.
- Do not send unrelated family records.
- Do not log raw prompts or full medical documents by default.
- Avoid using sensitive production data in evaluation fixtures.
- Confirm the selected provider's data handling and retention terms before production.
- Treat uploaded documents and retrieved web content as untrusted input.
- Restrict model-driven tools to explicitly approved operations.
- Do not let model output directly execute database writes without service validation and authorization.

### 10.13 AI observability

Record operational metadata such as:
- Task type.
- Model identifier.
- Prompt version.
- Duration.
- Input/output token counts where available.
- Retry count.
- Success or failure classification.
- Request or job identifier.

Do not record full medical text or sensitive generated content in standard application logs.

---

## 11. Environment Configuration & Secrets Management

### 11.1 Configuration rules

Use typed configuration and fail-fast validation.

The backend must refuse to start if required secrets, connection settings, or critical security configuration are missing or invalid.

Optional integrations may be disabled explicitly, but the application must not silently substitute insecure defaults.

The frontend must distinguish public browser-safe configuration from server-only secrets.

### 11.2 Frontend public variables

The following values may be public if they contain no secrets:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anonymous client key, where supported |
| `NEXT_PUBLIC_API_BASE_URL` | Public FastAPI base URL |

Only values explicitly designed to be public may use the `NEXT_PUBLIC_` prefix.

The Supabase publishable/anonymous key is not a substitute for authorization. Database and storage policies must still be correctly configured.

### 11.3 Frontend server-only variables

Where needed:

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged Supabase operation, only if genuinely required |

Prefer keeping privileged Supabase operations in FastAPI. If the frontend does not need this credential, it must not be defined for the frontend deployment.

Never prefix a secret with `NEXT_PUBLIC_`.

### 11.4 Backend required variables

| Variable | Purpose |
|---|---|
| `APP_ENV` | Runtime environment identifier |
| `APP_NAME` | Application identity |
| `API_V1_PREFIX` | API version prefix |
| `DATABASE_URL` | PostgreSQL connection URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public-key operations where required by the backend integration |
| `SUPABASE_JWKS_URL` or documented signing-key configuration | JWT verification configuration, when required by the selected signing mode |
| `SUPABASE_STORAGE_BUCKET` | Private document bucket |
| `FRONTEND_ORIGINS` | Explicit allowed frontend origins |
| `OPENROUTER_API_KEY` | OpenRouter secret |
| `OPENROUTER_BASE_URL` | Approved OpenRouter API base URL |

Use the correct public or secret Supabase credential for each operation. The exact authentication and signing-key configuration must match the selected Supabase project.

### 11.5 Backend conditional variables

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side operations only where required |
| `OPENROUTER_DEFAULT_MODEL` | Default approved model |
| `OPENROUTER_FALLBACK_MODEL` | Approved fallback, if configured |
| `OPENROUTER_TIMEOUT_SECONDS` | External model request timeout |
| `AI_MAX_INPUT_TOKENS` | Input limit |
| `AI_MAX_OUTPUT_TOKENS` | Output limit |
| `AI_MAX_RETRIES` | Bounded retry policy |
| `UPLOAD_MAX_BYTES` | Server-enforced upload size limit |
| `UPLOAD_ALLOWED_MIME_TYPES` | Supported file types |
| `SHARE_TOKEN_TTL_DEFAULT` | Default share-link expiry where applicable |
| `LOG_LEVEL` | Application log level |
| `WORKER_POLL_INTERVAL_SECONDS` | Worker polling interval |
| `WORKER_CONCURRENCY` | Bounded processing concurrency |
| `SENTRY_DSN` | Optional approved error-reporting integration |
| `MEDICAL_SOURCE_API_KEY` | Required only if an approved source provider needs a key |

Variable names may be consolidated during implementation, but the distinction between required, optional, public, and secret values must remain explicit.

### 11.6 `.env.example` blueprint

The repository's `.env.example` should document variable names and safe placeholders only.

It must:
- Contain no real credentials.
- Distinguish frontend and backend configuration.
- Mark optional integrations.
- Explain which runtime uses each variable.
- Document where secrets are configured in Vercel or Railway.
- Avoid including real patient data, URLs containing tokens, or production connection strings.

Do not commit a populated `.env` file.

### 11.7 Secret storage

Production secrets belong in the hosting platform's protected environment configuration or an approved secret manager.

Rules:
- Restrict access to production credentials.
- Rotate credentials when exposure is suspected.
- Use separate credentials and projects for development, staging, and production where practical.
- Never print secrets during deployment.
- Never expose secrets in build output or client bundles.
- Audit any use of privileged Supabase credentials.

### 11.8 Runtime validation

At startup:
1. Load environment configuration.
2. Validate required variables and formats.
3. Validate required model and provider configuration.
4. Initialize the database engine.
5. Initialize external-service adapters without unnecessarily failing on optional services.
6. Fail clearly if a required dependency cannot be configured.

Do not defer discovering a missing critical secret until a user initiates a medical operation.

### 11.9 Environment separation

Use separate development, preview/staging, and production configuration.

Do not allow:
- Preview deployments to access production medical records by default.
- Local development to use production storage unintentionally.
- Test jobs to delete or mutate production data.
- Public client configuration to contain privileged credentials.

---

## 12. Error Handling, Logging & Observability

### 12.1 Error hierarchy

Use a consistent error taxonomy.

Recommended categories:
- Validation errors.
- Authentication errors.
- Authorization errors.
- Resource-not-found errors.
- Conflict/state-transition errors.
- Storage errors.
- External-provider errors.
- AI output-validation errors.
- Processing errors.
- Rate-limit errors.
- Unexpected internal errors.

Map internal exceptions to stable, documented API error codes.

Do not expose raw exceptions to users.

### 12.2 User-facing errors

Messages should explain:
- What failed.
- Whether the original record remains available.
- Whether the action can be retried.
- What the user can do next.

Examples:
- "The document was uploaded, but its explanation could not be generated."
- "We couldn't save these changes. Your edits are still available to retry."
- "This share link is no longer available."
- "Your session has expired. Sign in to continue."

Avoid blaming the user or exposing internal implementation details.

### 12.3 Frontend error boundaries

Use Next.js error boundaries for unexpected page and segment failures.

The global error experience must:
- Be calm and understandable.
- Offer retry or safe navigation where possible.
- Avoid displaying sensitive values.
- Avoid exposing stack traces.
- Preserve safe navigation context.

Expected API failures should be handled through normal UI states, not thrown into a global error boundary unnecessarily.

### 12.4 Structured logging

Use structured JSON logs in the backend.

Where practical, include:
- Timestamp.
- Severity.
- Service name.
- Environment.
- Request ID.
- Route or operation name.
- HTTP status.
- Duration.
- Error category.
- Job ID for background processing.
- Model identifier and usage metadata where appropriate.

Avoid including:
- Medical document contents.
- AI prompts or full generated explanations.
- Access and refresh tokens.
- Raw share tokens.
- Passwords or OAuth codes.
- Unnecessary personal identifiers.
- Full file URLs containing sensitive access tokens.
- Database connection strings.
- API keys.

Logs must not become an alternative medical-record store.

### 12.5 Request correlation

Assign or propagate a validated request correlation ID.

Include it in:
- API responses where appropriate.
- Backend logs.
- Processing-job logs.
- Provider-operation diagnostics.

Do not accept an arbitrary unvalidated client header as a trusted security identity.

### 12.6 Error reporting

An approved error-reporting service may be added if it can be configured to avoid collecting sensitive medical data.

Before enabling it:
- Review payload capture.
- Disable unnecessary request-body collection.
- Scrub sensitive headers.
- Scrub query parameters containing tokens.
- Avoid replay capture on medical-record pages.
- Avoid including medical content in breadcrumbs.
- Document retention and access policy.

If these protections cannot be guaranteed, use structured logs without sensitive payloads until an appropriate setup is available.

### 12.7 Operational metrics

Track aggregate operational measurements such as:
- API request duration and error rate.
- Database connectivity and query failures.
- Upload failures.
- Processing-job completion time.
- Retry count.
- AI provider latency and failure rate.
- Token usage and estimated cost.
- Worker backlog.
- Expired or abandoned processing jobs.

Use aggregate metrics and opaque identifiers rather than medical content.

### 12.8 Health checks and alerts

Monitor:
- API liveness and readiness.
- Database connectivity.
- Worker health.
- Processing backlog.
- External provider failure rates.
- Storage errors.

Alert thresholds should be chosen based on actual usage and deployment capabilities. Do not build an elaborate observability platform before the MVP needs it.

---

## 13. Security Boundaries & Hardening Rules

MedLab processes sensitive health information. Security requirements are release gates, not optional future improvements.

### 13.1 Trust boundaries

Treat the following as untrusted:
- Browser requests.
- Request bodies and query parameters.
- Uploaded files and filenames.
- Extracted document text.
- Model-generated output.
- External web content.
- Share-link tokens.
- Webhook payloads.
- Client-supplied identifiers.
- Browser-provided file metadata.

Validate all inputs at the appropriate trust boundary.

### 13.2 Authorization

- Enforce access in FastAPI services.
- Verify permissions for each target resource.
- Do not authorize by frontend state.
- Do not assume knowledge of an identifier grants access.
- Check access before including data in AI context.
- Check access before creating signed storage URLs.
- Check share scope before returning shared content.
- Recheck permission after consequential state changes.

### 13.3 File-upload security

The backend must enforce:
- Maximum file size.
- Allowed file types.
- Actual content/type validation.
- Server-generated object keys.
- Authorized family-member assignment.
- Private storage.
- Safe error handling.
- Resource and processing limits.

Additional rules:
- Do not execute uploaded content.
- Do not trust file extensions alone.
- Do not trust client-supplied MIME types alone.
- Avoid serving active content inline from an untrusted origin.
- Treat PDFs and images as untrusted inputs.
- Use safe preview behavior and content-disposition headers where applicable.
- Apply malware scanning if required by the selected deployment and threat model; do not claim it exists unless implemented.
- Avoid public buckets for medical documents.

### 13.4 Storage security

- The document bucket is private.
- Object keys are not authorization credentials.
- Signed URLs have short expiries.
- Signed URLs are generated only after access checks.
- Signed URLs are never logged.
- Access to the storage bucket is restricted to approved operations.
- Object deletion follows the approved retention policy.
- Storage access must not expose unrelated records.

### 13.5 SQL injection

- Use SQLAlchemy's parameterized query mechanisms.
- Never construct SQL by concatenating user input.
- Validate sorting and filtering fields against explicit allowlists.
- Restrict database privileges.
- Do not expose database error messages to users.

### 13.6 XSS

- Use React's normal escaping behavior.
- Avoid rendering untrusted HTML.
- Sanitize any intentionally rendered rich content with an approved sanitizer.
- Do not inject model output as raw HTML.
- Apply a considered Content Security Policy.
- Avoid unnecessary third-party scripts on medical and share-link pages.
- Keep sensitive tokens out of script-accessible URLs wherever possible.

### 13.7 CSRF

Bearer-token API requests are not automatically vulnerable to traditional cookie-based CSRF in the same way as ambient cookie-authenticated requests. However, the actual implementation must be evaluated based on how tokens are stored and sent.

- Prefer explicit authorization headers for direct API calls.
- If authenticated mutations use cookies, apply CSRF protections appropriate to the design.
- Validate origin and content type where appropriate.
- Use secure SameSite cookie settings where applicable.
- Do not assume CORS alone prevents CSRF.
- Review any future Next.js server-side proxy for CSRF and session-forwarding behavior.

### 13.8 CORS

Allow only the explicit frontend origins required for each environment.

Rules:
- Do not use wildcard origins with credentialed requests.
- Separate development, preview, and production policies.
- Avoid allowing arbitrary preview domains to access production data.
- Allow only required methods and headers.
- Treat CORS as a browser access policy, not authorization.

### 13.9 Security headers

Configure appropriate response headers, including:
- Content Security Policy.
- `X-Content-Type-Options: nosniff`.
- A suitable `Referrer-Policy`.
- Frame restrictions through CSP or an appropriate equivalent.
- Strict transport security in production when HTTPS deployment is established.
- Appropriate cache-control headers for sensitive responses.

Do not introduce a CSP that breaks authentication, required API calls, or supported document previews without testing the actual deployment.

### 13.10 Rate limiting and abuse prevention

Rate-limit:
- AI requests.
- Uploads.
- Public share-link access.
- Link creation and revocation.
- Authentication-sensitive flows where applicable.
- Expensive search or processing operations.

Apply bounded file sizes, request sizes, timeouts, and worker concurrency.

Prevent repeated requests from creating unlimited AI jobs or excessive provider costs.

### 13.11 Share-link hardening

- Use high-entropy random tokens.
- Store token hashes.
- Compare expiry using server-side time.
- Recheck revocation on every request.
- Limit the token to explicitly selected content.
- Avoid third-party analytics and external assets that could leak tokens.
- Use restrictive cache headers.
- Prevent search-engine indexing.
- Avoid logging raw URLs containing tokens.
- Do not reveal owner account details in failure states.
- Revoke links when the product's deletion and sharing rules require it.

### 13.12 AI-specific security

- Treat document content as untrusted.
- Prevent prompt injection from changing system rules.
- Do not give the model direct unrestricted database access.
- Do not allow model output to override authorization.
- Validate any structured action before execution.
- Restrict tools to explicit, least-privilege operations.
- Keep provider credentials outside prompts.
- Bound context and output size.
- Validate source attribution.
- Keep AI-generated content clearly labeled.

### 13.13 Privacy and data minimization

- Collect only the information required for product functionality.
- Avoid logging sensitive medical details.
- Do not expose medical details in unnecessary notifications.
- Keep private responses out of public caches.
- Define retention and deletion behavior.
- Review provider data-handling terms before production.
- Restrict production-data access to authorized personnel.
- Use synthetic data for development and tests.

### 13.14 Security review release gate

Before public launch, verify:
- Cross-family record access is denied.
- Cross-member access follows the approved permission model.
- Private storage objects cannot be accessed without authorization.
- Expired and revoked share links fail.
- Share links expose only selected content.
- Authentication token verification is correct.
- Secrets are absent from frontend bundles and logs.
- Upload validation works on the server.
- AI requests cannot retrieve unauthorized records.
- Deletion and retention behavior matches the published policy.
- Rate limits and file-size limits are enforced.
- Backup, recovery, and incident-response expectations are documented.

---

## 14. Testing, Deployment & Scalability Roadmap

### 14.1 Testing strategy

Use a pragmatic testing pyramid.

#### Unit tests

Test pure business rules and transformations.

Examples:
- Permission decisions.
- State transitions.
- Share-link expiry rules.
- Input normalization.
- Unit conversion and comparison eligibility.
- AI output validation.
- Retry classification.
- Prompt-output parsing.

Unit tests must not require production services or real medical records.

#### Integration tests

Test interactions among:
- FastAPI routes.
- Authentication dependencies.
- SQLAlchemy.
- PostgreSQL.
- Storage adapters.
- Processing-job persistence.
- AI adapter behavior.

Use a dedicated test database or isolated test environment.

Mock external AI and medical-source calls in routine CI tests. Keep a small number of controlled contract tests for provider integrations when useful.

#### Security tests

Include explicit tests for:
- Unauthorized record access.
- Cross-family access.
- Privilege escalation.
- Expired tokens.
- Expired and revoked share links.
- Share-link scope violations.
- File-type spoofing.
- Oversized uploads.
- Invalid state transitions.
- Sensitive information leakage in error responses.
- Rate-limit enforcement.

These tests are essential, not optional enhancements.

#### Frontend tests

Use component tests for:
- Form validation.
- Loading and error states.
- Record status displays.
- Permission-aware UI behavior.
- Share-link confirmation.
- Responsive navigation behavior where testable.

Frontend tests do not replace backend authorization tests.

#### End-to-end tests

Use Playwright for critical journeys:
1. Create or authenticate a test account.
2. Create or select a permitted family member.
3. Upload a synthetic medical document.
4. Confirm the record is saved.
5. Confirm processing status updates.
6. Open the original document.
7. Review the saved AI explanation using a controlled provider stub or test fixture.
8. Create a share link.
9. Confirm that only selected content is available.
10. Verify expiry or revocation behavior.
11. Confirm that an unauthorized user cannot access protected content.

Use synthetic data and isolated environments.

### 14.2 CI pipeline

GitHub Actions should run appropriate checks on pull requests.

Frontend:
- Dependency installation using the lockfile.
- Linting.
- Type checking.
- Unit/component tests.
- Production build.

Backend:
- Dependency installation using a locked environment.
- Ruff linting and formatting checks.
- Type checking.
- Unit tests.
- Integration tests against an isolated test database where configured.
- Migration validation.

Repository:
- Check for accidental secrets.
- Validate generated API contracts.
- Review dependency changes.
- Run the relevant security checks.

Do not merge code that bypasses required authorization or security tests.

### 14.3 Local development

Local development should require only the services needed for the task.

Recommended setup:
- Next.js frontend.
- FastAPI backend.
- A dedicated development Supabase project or isolated local Supabase environment.
- Development OpenRouter credentials only when AI integration is being tested.

Use synthetic documents and test users.

Provide a README with:
- Setup prerequisites.
- Environment configuration.
- Database migration instructions.
- Frontend startup.
- Backend startup.
- Worker startup.
- Test commands.
- Troubleshooting notes.

Do not require developers to connect to production data.

### 14.4 Preview and staging

Use preview deployments for frontend changes and a controlled staging environment for backend integration and release testing.

Rules:
- Preview environments must not access production medical records by default.
- Use staging database and storage resources.
- Use separate provider credentials where practical.
- Validate CORS and callback URLs for each environment.
- Test authentication and file handling against the actual deployment configuration.
- Do not assume local success proves production configuration is correct.

### 14.5 Production deployment

Recommended release sequence:

1. Merge reviewed changes.
2. Run CI checks.
3. Build and deploy the backend to the intended release environment.
4. Apply reviewed, backward-compatible database migrations.
5. Verify backend readiness.
6. Deploy or promote the frontend.
7. Verify authentication, records access, uploads, and core API operations.
8. Verify worker processing.
9. Verify share-link authorization and expiry.
10. Monitor error rates and processing backlog.

The precise order of backend and frontend promotion should preserve compatibility between deployed API versions.

### 14.6 Database migrations during deployment

- Do not run migrations from every API instance at startup.
- Run migrations as an explicit deployment step.
- Review migration effects before production.
- Prefer backward-compatible migrations for rolling deployments.
- Have a documented recovery plan for failed migrations.
- Do not assume that reversing a schema migration can safely recover deleted data.
- Back up or otherwise protect critical data according to the approved operational plan.

### 14.7 Backup and recovery

Before production launch, define:
- PostgreSQL backup coverage.
- Backup retention.
- Recovery objectives appropriate to the product.
- Storage-object recovery or retention policy.
- Procedures for restoring database/object consistency.
- Access controls for backup data.
- Periodic restoration verification.

A database backup alone may not restore a complete medical record if the associated file objects are missing.

### 14.8 MVP scope

Build now:
- Next.js App Router frontend.
- FastAPI modular monolith.
- Supabase Auth integration.
- Supabase PostgreSQL persistence.
- Private Supabase Storage.
- Explicit family and record authorization.
- Medical record upload and retrieval.
- Durable processing-job persistence.
- A small background worker using the same backend codebase.
- AI explanations through OpenRouter.
- Structured AI-output validation.
- Approved medical-source retrieval where confirmed.
- Basic historical comparison for compatible saved observations.
- Unlisted, expiring, revocable share links.
- Typed API contracts.
- Basic structured logging.
- Core automated tests.
- CI and controlled deployments.

### 14.9 Explicitly deferred

Do not build these in version 1.0 without a concrete requirement:
- Microservices.
- Kubernetes.
- Redis.
- Kafka or RabbitMQ.
- Celery.
- Dedicated distributed workflow engines.
- A separate vector database.
- A generic plugin framework.
- A complex multi-provider AI orchestration platform.
- Multiple interchangeable ORM layers.
- A custom authentication service.
- Real-time collaboration.
- Advanced analytics pipelines.
- A sophisticated notification platform.
- Unnecessary frontend global state infrastructure.
- A separate API gateway.

### 14.10 Growth path

Introduce additional infrastructure only when measured constraints justify it.

Potential future steps:
- Add PostgreSQL-backed query optimization and appropriate indexes before adding caches.
- Add a shared rate-limit store if multiple API replicas require consistent limits.
- Increase worker capacity or split specialized workloads when processing backlog requires it.
- Add semantic retrieval if measured search quality cannot meet product needs through the simpler approach.
- Add stronger operational monitoring when usage and incident risk justify it.
- Separate backend domains into services only when independent deployment, scaling, ownership, or isolation requirements justify the operational cost.

Do not preemptively adopt distributed infrastructure for hypothetical future traffic.

### 14.11 Definition of architectural readiness

The implementation is ready for production review when:
- The folder structure and import boundaries are followed.
- API contracts are explicit and typed.
- Database access is centralized.
- Authentication and authorization are independently enforced.
- File storage is private.
- Processing jobs survive process restarts.
- AI output is validated and clearly identified.
- Share links are scoped, expiring, and revocable.
- Secrets are configured correctly.
- Logs exclude sensitive medical content.
- Critical security and integration tests pass.
- Production migrations and rollback/recovery procedures are documented.
- The final family-access, share-link, medical-AI, and retention decisions are approved.

---

## Final Architectural Rule

When a coding agent must choose between a simple implementation that follows these boundaries and a more elaborate pattern, it must choose the simpler implementation.

Do not invent new services, libraries, storage systems, state managers, database abstractions, or deployment layers without a specific requirement and an explicit architectural reason.

**FastAPI owns the business rules. PostgreSQL owns structured application state. Supabase Storage owns private file objects. Supabase Auth owns identity. OpenRouter is accessed through the AI adapter. The frontend presents the product but never substitutes for server-side security.**