# SportVision AI

SportVision AI is a full-stack web application that uses **Google Gemini's vision AI** to analyze sports images. Upload any sports photo and get instant AI-powered identification of the sport, a detailed description, and a confidence score — all tied to your personal account with a full history of past analyses.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Authentication | NextAuth v4 (Google OAuth) |
| Database ORM | Prisma v6 |
| Database | MongoDB Atlas |
| AI / Vision | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Runtime | Node.js / React 19 |

---

## Features

- **AI Sport Detection** — Upload an image and Gemini Vision identifies the sport, generates a description, and returns a confidence score.
- **Google OAuth** — One-click sign in with your Google account via NextAuth.
- **Per-User History** — Every analysis is saved to MongoDB and displayed in a personal history dashboard.
- **Drag-and-Drop Upload** — Intuitive upload UI with real-time progress and animated scanning feedback.
- **Server-Side Privacy** — History queries are gated behind server-side session checks; users can only access their own data.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── login/page.tsx                  # Google sign-in page
│   ├── signup/page.tsx                 # Account creation page
│   ├── upload/page.tsx                 # Image upload & analysis UI
│   ├── dashboard/
│   │   └── history/page.tsx            # Per-user analysis history
│   ├── providers/
│   │   └── NextAuthProvider.tsx        # Session provider wrapper
│   └── api/
│       ├── auth/[...nextauth]/route.ts # NextAuth configuration
│       ├── upload/route.ts             # File upload + AI trigger
│       └── analyze/route.ts           # Gemini vision analysis
├── components/
│   └── Navbar.tsx                      # Global navigation bar
└── lib/
    ├── prisma.ts                       # Prisma singleton client
    └── db-utils.ts                     # Database query helpers
prisma/
└── schema.prisma                       # MongoDB schema (User, Upload, Account, Session)
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **MongoDB Atlas** cluster (free tier works fine)
- A **Google Cloud** project with OAuth 2.0 credentials
- A **Google AI Studio** API key for Gemini

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kavithiS/SportVision-AI.git
cd SportVision-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set the following:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Atlas connection string
DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/sportvision

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> **Never commit `.env.local` to version control.** It is already listed in `.gitignore`.

### 4. Set up the database

Push the Prisma schema to your MongoDB Atlas cluster:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma db push` | Sync the Prisma schema to MongoDB |
| `npx prisma studio` | Open Prisma Studio to browse your database |

---

## How It Works

### Upload Flow

1. User selects or drags an image onto the upload page.
2. The client POSTs the image as `multipart/form-data` to `/api/upload`.
3. The server saves the file to `public/uploads/`, then calls `/api/analyze` internally.
4. The analysis result (`sportName`, `description`, `confidence`) is stored in MongoDB via Prisma, linked to the authenticated user.
5. The result is returned to the client and displayed immediately.

### AI Analysis

`/api/analyze` sends the image to **Gemini 2.5 Flash** with a structured vision prompt. The model returns a JSON payload:

```json
{
  "sport": "Basketball",
  "description": "A player drives to the basket during a fast break...",
  "confidence": 0.97
}
```

The route includes robust JSON parsing with a model fallback strategy for reliability.

### Authentication

NextAuth is configured with the **Google provider** and **`@next-auth/prisma-adapter`**. On first sign-in, a `User`, `Account`, and `Session` record are automatically created in MongoDB. The session callback exposes the database user ID to both Server and Client Components.

### Database Schema

| Model | Purpose |
|---|---|
| `User` | Stores authenticated user profile |
| `Account` | Links Google OAuth credentials to a user |
| `Session` | Manages active NextAuth sessions |
| `VerificationToken` | Handles email verification tokens |
| `Upload` | Stores image URL, sport name, AI description, and timestamp per user |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key for Gemini |
| `DATABASE_URL` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_URL` | ✅ | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | ✅ | Random secret for signing NextAuth JWTs |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth 2.0 client secret from Google Cloud Console |

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create a new **OAuth 2.0 Client ID** (Web application).
3. Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**.
4. Copy the Client ID and Client Secret into `.env.local`.

---

## Security Notes

- `.env.local` is gitignored — never commit real credentials.
- User history is protected by server-side session validation; users can only query their own uploads.
- Uploaded images are served from `public/uploads/` — for production deployments with sensitive images, replace with private object storage (e.g. AWS S3) and use signed URLs.
- All AI analysis runs server-side; the Gemini API key is never exposed to the browser.

---

## Deployment

This project is compatible with **Vercel** (recommended) or any Node.js hosting platform.

1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Add all environment variables from the **Environment Variables Reference** table in the Vercel project settings.
4. Deploy — Vercel will run `npm run build` automatically.

> For production, update `NEXTAUTH_URL` to your live domain and add the production callback URL to your Google OAuth credentials.

---

## License

This project is for educational and demonstration purposes.
- Remove any accidental secrets from local `.env` files and add a commit note you can use when pushing.
- Add minimal tests for `/api/upload` and `/api/analyze` endpoints.

Tell me which of those you'd like next and I'll proceed.
