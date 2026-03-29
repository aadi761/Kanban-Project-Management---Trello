# Kanban Boards

React (Vite) + Express API + **PostgreSQL**. Relational boards/lists/cards fit SQL well; the backend already uses `pg` and `schema.sql`. **MySQL** would need query rewrites; **MongoDB** would need a different model—use Postgres here.

## Local dev (full stack)

1. **Database** — from this folder:

   ```bash
   docker compose up -d
   ```

   First run applies `backend/schema.sql` (tables + seed labels/users).

2. **Backend** — `backend/.env`:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trello
   PORT=5000
   FRONTEND_URL=http://localhost:8080
   ```

   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Frontend** — `.env` in this folder:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   ```bash
   npm install && npm run dev
   ```

Open http://localhost:8080 — test **add list**, **add card**, **drag**, then **refresh**; data should persist from Postgres.

## Scripts (frontend)

- `npm run dev` — Vite (port 8080)
- `npm run build` — production build
- `npm run preview` — preview build
- `npm test` — Vitest

## Deploy (overview)

1. **Postgres**: Neon, Supabase, Railway, or RDS — run `schema.sql` once, set `DATABASE_URL` on the API host.
2. **API**: Deploy `backend/` (Node) — env: `DATABASE_URL`, `PORT`, `FRONTEND_URL` (your real site URL for CORS).
3. **Frontend**: Deploy static `dist/` (Vercel/Netlify/S3+CDN) — build with `VITE_API_URL=https://your-api.example.com/api`.

See also `.env.example`.
