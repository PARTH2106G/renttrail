# RentTrail — Starter Scaffold

Landlord-tenant document, verification & rent-cycle manager. Built to solve a real problem: tracking India's multi-week tenant police-verification process, rent cycles, and dispute-proof event logs — starting with a single-landlord use case (e.g. your own family's apartment) and generalizable to a multi-property SaaS later.

## What's included

- **`/server`** — Express + MongoDB REST API, MVC structure, JWT auth, all 7 core models (User, Property, Tenant, Agreement, Verification, RentPayment, EventLog), a working Agreement CRUD flow that auto-generates the rent-payment schedule, a state-machine-enforced Verification tracker, and a node-cron job that flags overdue rent daily.
- **`/client`** — placeholder for your React app (not scaffolded here — use `npx create-react-app client` or Vite, then drop in the Dockerfile already provided).
- **`docker-compose.yml`** — spins up MongoDB, the API, and the client together.

## Quick start (local, without Docker)

```bash
cd server
cp .env.example .env      # then fill in JWT_SECRET
npm install
npm run dev                # requires MongoDB running locally, or point MONGO_URI at Atlas
```

API health check: `GET http://localhost:5000/api/health`

## Quick start (Docker)

```bash
cp server/.env.example server/.env   # fill in JWT_SECRET
docker compose up --build
```

## API surface so far

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create landlord/manager account |
| POST | `/api/auth/login` | Get JWT |
| GET/POST | `/api/properties` | List / add properties |
| PUT | `/api/properties/:id` | Update property |
| GET/POST | `/api/agreements` | List / create agreement (auto-generates rent schedule) |
| GET/PUT | `/api/agreements/:id` | Read / update one agreement |
| PATCH | `/api/agreements/:id/terminate` | End an agreement, logs the event |
| POST | `/api/verifications` | Start a verification record |
| GET | `/api/verifications/agreement/:agreementId` | Check verification status |
| PATCH | `/api/verifications/:id/stage` | Move through submitted → in_review → cleared/flagged |
| GET | `/api/rent-payments/agreement/:agreementId` | View rent schedule |
| PATCH | `/api/rent-payments/:id/mark-paid` | Record a payment |
| POST | `/api/event-logs` | Log a repair/notice/inspection event |
| GET | `/api/event-logs/agreement/:agreementId` | Dispute-ready event history |

## What's intentionally NOT built yet (your team's actual sprint work)

- Tenant CRUD routes/controller (same pattern as Property — good first task to split across teammates)
- PDF agreement generation (PDFKit is already a dependency)
- File upload to S3 for verification documents/inventory photos (Multer is already a dependency)
- The React frontend
- Real reminder dispatch (email/SMS/WhatsApp) inside `rentReminderJob.js` — currently only flags overdue status

---

## Suggested 8-week sprint plan (team of 4)

| Week | Focus | Suggested split |
|---|---|---|
| 1 | Requirements lock + wireframes + finalize schema (already scaffolded above — review and adjust to your actual apartment's needs) | Everyone: 1 backend-lead, 1 frontend-lead, 2 flex |
| 2 | Auth flow end-to-end (register/login UI + protected routes) + Property CRUD (backend done, needs Tenant CRUD + frontend) | 2 backend, 2 frontend |
| 3 | Agreement creation flow (form → API → auto rent-schedule) + Agreement list/detail UI | 2 backend, 2 frontend |
| 4 | Verification tracker UI (visualize the state machine as a stepper) + document checklist upload (S3/Multer) | 2 backend, 2 frontend |
| 5 | Rent-payment dashboard: due/paid/overdue views, mark-paid flow, digital receipt PDF generation | 2 backend, 2 frontend |
| 6 | Event log (repair requests, notices, inspections) + dispute-evidence PDF export bundling the full log | 2 backend, 2 frontend |
| 7 | Polish: responsive UI pass, activity logs for admin actions, notification reminders wired to a real provider, bug fixes | Everyone |
| 8 | Dockerize fully, deploy to AWS (EC2 + S3 + MongoDB Atlas), write the project report, prepare demo with your parents' real apartment as the case study | Everyone |

**Tip for your report:** since this is genuinely solving your family's problem, document the *before* (how your parents currently track verification/rent/repairs — probably WhatsApp + memory) and the *after* with screenshots. That real before/after comparison is worth more marks and more interview mileage than any amount of extra features.
