<div align="center">

# Kanban Project Management

**A Trello-style board** with drag-and-drop lists & cards, real-time persistence, and a production-ready split stack: **React (Vite)** on the edge, **Express + PostgreSQL** on the server.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Features](#-features) · [Architecture](#-architecture-infographic) · [Local setup](#-local-development) · [Deploy](#-deployment-neon--render--vercel) · [Environment](#-environment-variables)

</div>

---

## Feature map

```mermaid
flowchart LR
  subgraph Productivity
    B[Boards<br/>switch · create · star]
    L[Lists<br/>add · reorder · copy]
    C[Cards<br/>drag · labels · due · checklist]
  end
  subgraph Stack
    F[Vite + React]
    A[Express API]
    D[(PostgreSQL)]
  end
  B --- L
  L --- C
  F --- A
  A --- D
```

| Area | What you get |
|------|----------------|
| **Boards** | Multiple boards, starred boards, titles inline |
| **Lists** | Horizontal columns, **drag to reorder** |
| **Cards** | **Drag-and-drop** between lists, archive, due dates, labels, checklists, activity |
| **UI** | Dark/light theme, responsive layout, Radix primitives + Tailwind |
| **Data** | Normalized SQL schema; no mock data in production builds |

---

## Architecture (infographic)

**Request path in production** — browser loads the SPA from Vercel, which calls your API on Render; the API talks to Neon Postgres.

```mermaid
flowchart LR
  subgraph Browser
    U[User]
  end
  subgraph Vercel
    SPA[Static site<br/>Vite build]
  end
  subgraph Render
    API[Express API<br/>Node]
  end
  subgraph Neon
    DB[(PostgreSQL)]
  end
  U --> SPA
  SPA -->|"VITE_API_URL<br/>HTTPS /api/*"| API
  API -->|"DATABASE_URL<br/>SSL"| DB
```

**Application layers**

```mermaid
flowchart TB
  subgraph Presentation
    R[React 18]
    RR[React Router]
    DND[Drag and drop]
    RQ[Data from REST]
  end
  subgraph API
    EX[Express]
    RT[REST routes /api/boards lists cards]
  end
  subgraph Persistence
    PG[(PostgreSQL)]
  end
  R --> RQ
  RQ --> RT
  RT --> PG
```

---

## Local development

### Prerequisites

- Node.js **20+**
- Docker (for local Postgres) — *optional if you point `DATABASE_URL` elsewhere*

### 1. Database

From the **repository root** (this folder):

```bash
docker compose up -d
```

The first run applies `backend/schema.sql`. The compose file maps host port **`5433`** → container `5432` (avoids clashing with another Postgres on **5432**).

### 2. Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/trello
PORT=5000
FRONTEND_URL=http://127.0.0.1:8080
```

```bash
cd backend && npm install && npm run dev
```

### 3. Frontend

Create `.env` in the repo root:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm install && npm run dev
```

Open **http://127.0.0.1:8080** — create lists/cards, drag items, refresh; data should persist.

**Optional demo SQL** (replace sample data): after `schema.sql`, run `backend/seed_demo.sql` in `psql` or your SQL client.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (default port **8080**) |
| `npm run dev:api` | Backend with watch |
| `npm run dev:db` | `docker compose up -d` |
| `npm run build` | Production `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright |

---

## Deployment (Neon + Render + Vercel)

```mermaid
sequenceDiagram
  participant You
  participant Neon
  participant Render
  participant Vercel
  You->>Neon: Create DB + run schema.sql (+ seed_demo.sql optional)
  You->>Render: Web service from backend/, set DATABASE_URL + FRONTEND_URL
  You->>Vercel: Import repo, set VITE_API_URL, redeploy
  Note over Vercel,Render: VITE_API_URL must be https://your-api.../api
  Note over Render: FRONTEND_URL = exact https://your-app.vercel.app
```

1. **[Neon](https://neon.tech)** — Create a project, run `backend/schema.sql`, optionally `backend/seed_demo.sql`. Copy the connection string (`?sslmode=require` if needed).
2. **[Render](https://render.com)** — Deploy the **backend** (`rootDir: backend` or use `render.yaml` blueprint). Set:
   - `DATABASE_URL` — Neon URL  
   - `FRONTEND_URL` — your live frontend origin(s), comma-separated if you use previews  
   - `PORT` — usually provided by Render  
3. **[Vercel](https://vercel.com)** — Import the repo, framework **Vite**, set **`VITE_API_URL`** = `https://<your-render-service>.onrender.com/api`, then **redeploy** so the variable is baked into the build.

Health check: `GET https://<your-api-host>/api/health` → `{"ok":true}`.

More detail: `.env.example`.

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_URL` | Vercel (build-time) | Public API base, e.g. `https://api.example.com/api` |
| `DATABASE_URL` | Render / local backend | Postgres connection string |
| `FRONTEND_URL` | Render / local backend | Allowed CORS origin(s); match Vercel URL exactly |
| `PORT` | Render / local | API listen port |

---

## Repository layout

```
.
├── src/                 # React SPA
├── backend/             # Express API + schema + seed_demo.sql
├── docker-compose.yml   # Local Postgres
├── render.yaml          # Render Blueprint (API)
├── vercel.json          # SPA rewrites
└── netlify.toml         # Alternative static host
```

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| **Failed to fetch** on live site | Set `VITE_API_URL` on Vercel to **HTTPS** `/api` URL; **redeploy**. Use `https` if the page is `https` (mixed content). |
| CORS errors | Set `FRONTEND_URL` on Render to the **exact** origin of your Vercel app (no path). Comma-separate multiple URLs. |
| Empty boards but API works | Run `seed_demo.sql` or add data in Neon; production does not use fake client-side seed data. |

---

<div align="center">

**Built with a relational model** — boards → lists → cards, labels, members, checklists — served over a small REST API.

[Report issues](https://github.com/aadi761/Kanban-Project-Management---Trello/issues) · [Pull requests welcome](https://github.com/aadi761/Kanban-Project-Management---Trello/pulls)

</div>
