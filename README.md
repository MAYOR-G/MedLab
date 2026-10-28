# MedLab — Encrypted Family Medical Vault

> **MedLab** is an end-to-end encrypted family medical records vault featuring document management, OCR extraction, AI-generated plain-English translations, longitudinal biomarker comparisons, and time-limited, cryptographically secure sharing.

---

## Monorepo Architecture

- **`apps/web`**: Next.js 14 App Router (TypeScript, Tailwind CSS, shadcn/ui, Radix UI, TanStack Query, date-fns). Hosted on **Vercel**.
- **`apps/api`**: FastAPI modular monolith & async background worker (Python 3.11+, SQLAlchemy 2.x, psycopg 3, Alembic, HTTPX). Hosted on **Railway**.
- **`packages/api-contracts`**: Auto-generated TypeScript types generated directly from the backend's OpenAPI contract.
- **`docs`**: Foundational engineering specifications (`PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `agents_coding_rules.md`, `IMPLEMENTATION_PLAN.md`).

---

## Complete Step-by-Step Guide: Populating Environment Variables

To run MedLab with live authentication, real database persistence, and AI extraction, you need credentials from two services:
1. **Supabase** (PostgreSQL Database, Auth, and Storage)
2. **OpenRouter** (AI Gateway for Gemini / Claude / GPT models)

Follow this step-by-step procedure to retrieve every key and fill your `.env` files.

---

### Step 1: Set Up Your Supabase Project (Database, Auth, Storage)

1. Go to [supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**, select your organization, give your project a name (e.g., `medlab-vault`), set a strong database password, and select a region close to you.
3. Wait ~1 minute for the project to finish provisioning.

---

### Step 2: Retrieve Supabase API & Auth Credentials

In your Supabase project dashboard:

1. Click on the **Settings (gear icon)** at the bottom of the left sidebar.
2. Click on **API** in the settings menu:
   - **Project URL**: Copy the URL under `Project URL` (e.g., `https://abcdefghijklm.supabase.co`).
     - Paste into: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`.
   - **Project API Keys (`anon`/`public`)**: Copy the `anon` `public` key.
     - Paste into: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`.
   - **JWT Secret**: Scroll down to the **JWT Settings** section and reveal the `JWT Secret`.
     - Paste into: `SUPABASE_JWT_SECRET`.
   - **JWKS URL**: Set this to:
     ```
     https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/.well-known/jwks.json
     ```
     *(Replace `<YOUR-PROJECT-REF>` with your actual Supabase project ID from the URL).*

---

### Step 3: Retrieve the PostgreSQL Connection String (`DATABASE_URL`)

In your Supabase project dashboard:

1. Click on **Settings (gear icon)** > **Database**.
2. Scroll to the **Connection string** section and select the **URI** tab.
3. Select **Mode: Transaction** (Port `6543`) or **Session** (Port `5432`):
   - For MedLab's Python backend using `psycopg3`, copy the connection string and change the protocol prefix from `postgresql://` to `postgresql+psycopg://`.
   - **Example format:**
     ```
     postgresql+psycopg://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the database password you created in Step 1.
   - Paste into: `DATABASE_URL` in `apps/api/.env` and the root `.env`.

> **Local PostgreSQL Alternative:** If you prefer running PostgreSQL locally without Supabase cloud:
> ```bash
> DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/postgres
> ```

---

### Step 4: Create the Storage Bucket for Medical Documents

MedLab stores uploaded PDFs, lab panels, and diagnostic images in a private Supabase Storage bucket:

1. In your Supabase dashboard, click on **Storage** in the left sidebar.
2. Click **"New Bucket"**.
3. Set **Bucket Name** to exact value: `medical-documents`.
4. Ensure **Public bucket** is toggled **OFF** (this keeps patient documents private and end-to-end secured).
5. Click **"Save Bucket"**.
6. Set in your `.env`:
   ```bash
   SUPABASE_STORAGE_BUCKET=medical-documents
   ```

---

### Step 5: (Optional but Recommended) Enable Google Sign-In

To allow users to sign in with Google:

1. In Supabase Dashboard, click on **Authentication** > **Providers** > **Google**.
2. Toggle Google to **Enabled**.
3. Create OAuth 2.0 Credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Set **Authorized redirect URIs** to your Supabase callback:
     ```
     https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client Secret** from Google Cloud into the Supabase Google provider settings and click **Save**.

---

### Step 6: Obtain Your AI Gateway Key (OpenRouter / Gemini)

MedLab uses clinical AI extraction to parse laboratory bloodwork and produce plain-English explanations:

1. Go to [openrouter.ai](https://openrouter.ai) and sign in (or sign up).
2. Click **Keys** in the top navigation or account menu.
3. Click **"Create Key"**, give it a name (e.g., `MedLab AI`), and copy the generated token (`sk-or-v1-...`).
4. Set in your `.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-001
   OPENROUTER_FALLBACK_MODEL=openai/gpt-4o-mini
   ```

---

### Step 7: Environment File Placements & Reference Table

Place your credentials into these exact file locations:
1. **Root `.env`**: Central reference file used by Docker and workspace tooling.
2. **`apps/web/.env.local`**: Loaded by Next.js frontend during local development.
3. **`apps/api/.env`**: Loaded by FastAPI backend and Alembic migrations.

#### Complete Environment Variable Reference Table

| Variable Name | Environment File | Where to Get It / Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `apps/web/.env.local`, `.env` | Supabase > Project Settings > API | Public URL of your Supabase instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `apps/web/.env.local`, `.env` | Supabase > Project Settings > API | Public anon client key |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local`, `.env` | Default: `http://127.0.0.1:8000/api/v1` | URL of the local FastAPI backend |
| `NEXT_PUBLIC_APP_URL` | `apps/web/.env.local`, `.env` | Default: `http://localhost:3000` | URL of the Next.js frontend |
| `DATABASE_URL` | `apps/api/.env`, `.env` | Supabase > Settings > Database (URI tab) | PostgreSQL connection string (`postgresql+psycopg://...`) |
| `SUPABASE_URL` | `apps/api/.env`, `.env` | Supabase > Settings > API | Backend copy of Supabase project URL |
| `SUPABASE_ANON_KEY` | `apps/api/.env`, `.env` | Supabase > Settings > API | Backend copy of Supabase anon key |
| `SUPABASE_JWT_SECRET` | `apps/api/.env`, `.env` | Supabase > Settings > API (JWT Settings) | Secret used to verify client JWTs |
| `SUPABASE_JWKS_URL` | `apps/api/.env`, `.env` | `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` | JWKS endpoint for token validation |
| `SUPABASE_STORAGE_BUCKET` | `apps/api/.env`, `.env` | Exact: `medical-documents` | Private storage bucket for documents |
| `FRONTEND_ORIGINS` | `apps/api/.env`, `.env` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed CORS origins for browser fetch |
| `OPENROUTER_API_KEY` | `apps/api/.env`, `.env` | OpenRouter.ai > Keys | API key for medical-grade AI extraction |
| `OPENROUTER_DEFAULT_MODEL` | `apps/api/.env`, `.env` | Default: `google/gemini-2.0-flash-001` | Primary AI model |
| `OPENROUTER_FALLBACK_MODEL` | `apps/api/.env`, `.env` | Default: `openai/gpt-4o-mini` | Fallback AI model |
| `APP_ENV` | `apps/api/.env` | `development` or `production` | Application runtime environment |
| `PORT` | `apps/api/.env` | `8000` | Local API port |
| `DEBUG` | `apps/api/.env` | `true` (dev) / `false` (prod) | FastAPI debug toggle |
| `SHARE_TOKEN_TTL_DEFAULT` | `apps/api/.env` | `86400` (24 hours) | Default lifetime for physician share links |

---

## Database Migrations & Initial Setup

Once your `DATABASE_URL` is configured, apply the database schema:

```bash
# 1. Activate backend virtual environment
cd apps/api
source .venv/bin/activate

# 2. Run Alembic migrations to create all database tables
alembic upgrade head
```

This creates all PostgreSQL tables including `workspaces`, `family_members`, `documents`, `document_versions`, `measurements`, `ai_summaries`, `share_links`, and `audit_events`.

---

## Running the Application Locally

Run the frontend, backend, and background worker concurrently:

### Terminal 1: Backend API
```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
*Health Check: Verify at [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)*

### Terminal 2: Background Extraction Worker
```bash
cd apps/api
source .venv/bin/activate
python -m app.workers.main
```

### Terminal 3: Web Application
```bash
cd apps/web
npm run dev
```
*Access Web App: [http://localhost:3000](http://localhost:3000)*

---

## Verification & Test Suite

Run the full automated test suite to ensure everything is operating at production standard:

```bash
# Run all backend unit, integration, and security tests (41 passing)
apps/api/.venv/bin/pytest apps/api/tests

# Run frontend unit & security invariant tests (3 passing)
npm run test --workspace=apps/web

# Test full Next.js production compilation (19 routes, 0 errors)
npm run build:web
```

---

## Security & Architecture Highlights

- **Zero-Knowledge Architecture:** Patient medical records are tied to authenticated user IDs through PostgreSQL Row-Level Security (RLS).
- **Cryptographic Share Tokens:** 256-bit entropy unlisted URLs with SHA-256 database hashing. Raw tokens never touch our database.
- **Mandatory Disclaimers:** Non-diagnostic clinical disclaimer embedded across all AI summaries, assistant Q&A views, public share viewers, and legal terms.
- **Recoverable Trash & 30-Day Purge:** Immediate share-link revocation upon deletion, 30-day recovery window, and storage file deletion upon permanent purge.
- **No AI Training on Patient Data:** Medical records sent to the extraction engine are explicitly opted out of model training.
