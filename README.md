# BudgetTrack (MVP)

BudgetTrack is a production-minded personal finance tracker built with:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Turso/libSQL
- `bcryptjs` + JWT cookie authentication

## Features

- Multi-user account system (sign up, login, logout)
- Secure password hashing with `bcryptjs`
- JWT session cookie authentication
- User-scoped data access (`user_id` enforced in queries)
- Transactions CRUD with filtering and sorting
- Monthly and category budgets with progress and warnings
- Default + custom categories
- Dashboard KPIs and insights
- Reports with month-over-month comparison
- Settings (profile, monthly target budget, category management)
- Export data as JSON or CSV
- Optional reset-all-data action

## Project structure

- [app](app): Pages + API routes
- [components](components): Reusable UI and feature components
- [lib](lib): Auth, DB client, validation, data services, types
- [db/schema.sql](db/schema.sql): Turso SQL schema
- [.env.example](.env.example): Environment template

## Environment setup

1. Copy env file:

	 `cp .env.example .env.local`

2. Fill values in `.env.local`:

- `TURSO_DATABASE_URL` (libsql URL)
- `TURSO_AUTH_TOKEN` (token with DB access)
- `JWT_SECRET` (long random secret)

## Turso setup example

1. Create DB in Turso.
2. Get DB URL and auth token.
3. Put them in `.env.local`.
4. App initializes schema automatically at runtime.

You can also apply [db/schema.sql](db/schema.sql) manually if preferred.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- On signup, default categories are auto-created.
- All API endpoints validate auth and scope by logged-in user.
- Core protected routes:
	- `/dashboard`
	- `/transactions`
	- `/budgets`
	- `/reports`
	- `/settings`
