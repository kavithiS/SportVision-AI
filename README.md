# SportVision AI

A Next.js (App Router) demo application that lets users upload sports images and uses Google Gemini (Generative AI) to identify the sport and provide a short description. The project includes authentication (NextAuth + Google), per-user history persisted with Prisma + MongoDB, and a local uploads folder for image storage.

This README explains how to run the project locally, required environment variables, architecture choices, and security notes for submission.

---

## Quick start

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Prepare environment variables. Create a `.env.local` file (see **Environment** section below).

3. Start the dev server:

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser.

---

## Environment variables

Create `.env.local` in the project root with the following keys (example values omitted):

- `GEMINI_API_KEY` — Google Generative AI API key (required for image analysis).
- `GEMINI_MODEL` — Optional model id (e.g. `gemini-2.5-flash` or `gemini-pro-vision`).
- `DATABASE_URL` — Prisma / MongoDB connection string (e.g. MongoDB Atlas URI).
- `GOOGLE_CLIENT_ID` — OAuth client id for Google provider.
- `GOOGLE_CLIENT_SECRET` — OAuth client secret for Google provider.
- `NEXTAUTH_SECRET` — Random secret for NextAuth sessions.

For local development you can copy `.env.local.example` and fill in values. Never commit your real API keys to the repository.

---

## Database & Migrations

This project uses Prisma with MongoDB (Prisma client is configured in `src/lib/prisma.ts`, schema in `prisma/schema.prisma`). For development, you can run:

```bash
# generate Prisma client
npx prisma generate

# (for SQL databases you would run migrations) For MongoDB use `prisma db push` to sync schema
npx prisma db push
```

Note: If you prefer PostgreSQL, replace `DATABASE_URL` and run migrations as normal. The code uses Prisma models and the NextAuth Prisma adapter.

---

## How it works (high level)

- Frontend: Next.js App Router using Tailwind CSS. Pages of interest: `app/page.tsx`, `app/upload/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/dashboard/history/page.tsx`.
- Authentication: NextAuth with Google provider and `@next-auth/prisma-adapter` to persist users.
- Uploads: Client uploads to `POST /api/upload` (see `src/app/api/upload/route.ts`). Files are saved to `public/uploads/` and analyzed by calling `POST /api/analyze`.
- AI: `src/app/api/analyze/route.ts` integrates with Google Generative AI (`@google/generative-ai`) to run a vision + instruction prompt and return a JSON result (`sport`, `description`, `confidence`).
- Persistence: Upload metadata and AI results are saved to the database via Prisma (if user is authenticated).

This design keeps analysis logic on the server and keeps user-specific history private (server verifies session before returning uploads).

---

## Running & Testing

- Dev server:

```bash
npm run dev
```

- Build locally:

```bash
npm run build
npm start
```

- If you need to exercise the analyze/upload APIs directly, use `curl` or Postman to POST files to `/api/upload` (the upload endpoint performs analysis automatically).

---

## Design choices (brief)

- Database: MongoDB + Prisma — chosen for quick iteration and flexible document storage of AI analysis payloads. Prisma provides type-safe models and integrates with NextAuth via the Prisma adapter.
- Auth: NextAuth (Google) — quick to integrate, familiar dev experience, and works well with Prisma adapter and session callbacks used in Server Components.
- AI: Google Gemini via `@google/generative-ai` — required by the assessment and provides robust vision + language primitives for image analysis.
- Storage: Local `public/uploads/` for the prototype; this keeps the demo self-contained. For production, swap to S3/Supabase and update upload URL logic.

---

## Security & Privacy notes

- Do NOT commit `.env.local` or any files containing API keys. Remove any accidentally committed secrets and rotate keys immediately.
- Uploaded images are stored in `public/uploads/` (publicly accessible); if sensitive data is expected, switch to private object storage and serve images through signed URLs.
- The app enforces that users can only see their own history via server-side session checks before querying uploads.

---

## What to include for submission

- Push this repository to a public GitHub repo and include the URL in your submission.
- Include `.env.local.example` with placeholder names for required environment variables (no real keys).
- In the `README` include short notes explaining your choices (database, auth, AI) — this file already contains those.

---

If you want, I can also:

- Add a `.env.local.example` file.
- Remove any accidental secrets from local `.env` files and add a commit note you can use when pushing.
- Add minimal tests for `/api/upload` and `/api/analyze` endpoints.

Tell me which of those you'd like next and I'll proceed.
