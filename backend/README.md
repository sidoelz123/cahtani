# CahTani AI — Backend Documentations

This folder contains the backend REST API service for **CahTani AI**, built using **HonoJS**, **Drizzle ORM**, and **Cloudflare Workers (D1)** / **Node.js**.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

---

## 🔑 Environment Variables & Secrets

Create a `.env` file in the `backend/` directory or configure secrets using `wrangler secret put`:

| Variable | Description | Required | Example |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for AI diagnosis, chat & schedules | Yes | `AIzaSy...` |
| `ADMIN_EMAIL` | Email for seeding the primary admin user account | Yes | `admin@cahtani.id` |
| `ADMIN_PASSWORD` | Password for seeding the primary admin user account | Yes | `SecureAdminPass123!` |
| `ADMIN_NAME` | Display name for the seeded admin account | Optional | `Admin CahTani` |
| `ADMIN_PHONE` | Phone number for the admin account | Optional | `081100000000` |
| `PORT` / `BACKEND_PORT` | HTTP port when running backend on Node.js runtime | Optional | `5000` |
| `DATABASE_URL` | Local SQLite database file path (when running outside D1) | Optional | `file:../cahtani.db` |

---

## 💻 Local Development

### Running with Wrangler (Cloudflare Workers environment)
```bash
npm run dev
# or directly:
npx wrangler dev
```

### Running with Node.js runtime (`tsx`)
```bash
npm run dev:node
```

---

## 🗄️ Database Management (Drizzle ORM & Cloudflare D1)

The Drizzle ORM schema is located at **`src/db/schema.ts`**.

### 1. Generate Migrations
Generate SQL migration files whenever `src/db/schema.ts` is updated:

```bash
npm run db:generate
```

### 2. Apply Migrations

- **Local D1 Database (`--local`)**:
  ```bash
  npm run db:migrate:local
  # or: npx wrangler d1 migrations apply DB --local
  ```

- **Remote Production D1 Database (`--remote`)**:
  ```bash
  npm run db:migrate:prod
  # or: npx wrangler d1 migrations apply DB --remote
  ```

---

## 🌱 Admin Seeding Script

The project includes an idempotent seeding script (`src/scripts/seed.ts`) that cleans up legacy demo accounts and provisions the primary admin user account using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Option A: Via Command Line (CLI)
```bash
ADMIN_EMAIL="admin@cahtani.id" ADMIN_PASSWORD="YourSecurePassword123!" npm run db:seed
```

### Option B: Via HTTP Endpoint
You can also trigger the seeding routine on demand via HTTP on a running server configured with `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment secrets:

```bash
curl https://your-backend-api.com/api/auth/seed
```

---

## 🔐 Setting Production Secrets on Cloudflare Workers

Set environment secrets securely in Cloudflare Workers using Wrangler:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
```

---

## 📚 API Documentation (Swagger / OpenAPI)

Interactive Swagger UI documentation and OpenAPI specification are built directly into the backend server:

- 📖 **Swagger UI Docs**: `/docs` (also available at `/swagger` and `/api/docs`)
- 📄 **OpenAPI 3.0 Spec**: `/api/openapi.json`

---

## 🌐 Deployment

To deploy the backend to Cloudflare Workers:

```bash
npm run deploy
# or: npx wrangler deploy
```

Ensure your `wrangler.toml` file contains your valid Cloudflare D1 `database_id`:

```toml
name = "cahtani-backend"
main = "server.ts"
compatibility_date = "2024-09-23"

[[d1_databases]]
binding = "DB"
database_name = "cahtani-db"
database_id = "YOUR_D1_DATABASE_ID_HERE"
migrations_dir = "migrations"
```

