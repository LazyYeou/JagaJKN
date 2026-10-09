# JagaJKN

Role-based JKN contribution-audit demo. All identities and source data are synthetic. This prototype does not make legal findings or prove fraud.

## Requirements

- Node.js 22+
- PostgreSQL 15+
- npm

## Local setup

1. Create a local PostgreSQL database named `jagajkn`.
2. Copy `.env.example` to `.env`; set `DATABASE_URL` for your local PostgreSQL user. Generate separate random values for `SESSION_SECRET` and `DEMO_OPERATOR_KEY` (each at least 32 bytes). Keep `.env` private; never commit it.
3. Install and initialize:

   ```powershell
   npm install
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   npm run dev
   ```

4. Open `http://localhost:3000/login` and choose a seeded HR, worker, or auditor identity.

`DEMO_MODE=true` enables account selection for the known synthetic identities. It is not public registration or production authentication. Set `DEMO_MODE=false` to disable demo login and reset endpoints. In production, demo actions also require `DEMO_ENVIRONMENT=approved`.

The operator account is not shown in the public account list. To request an operator session, POST `{"operatorKey":"<DEMO_OPERATOR_KEY>"}` to `/api/demo/operator-session`; then POST to `/api/demo/reset`. The reset endpoint works only with an operator session and `DEMO_MODE=true`. Do not expose demo reset on an unapproved environment.

## Seed contents

Seed/reset runs transactionally and recreates the same synthetic baseline: 5 companies, 100 workers, seeded role accounts, effective-dated contract versions, 3 months of attendance/payroll/deduction records, mock company-period confirmations, and the M0 P1/P3/P5 fixture records. The demo period is `2026-09`. Seed output reports counts only.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

`db:seed` and `db:reset` are destructive and refuse to run unless `DEMO_MODE=true`.

## M2 evidence pipeline

- HR worker details: `/hr/workers/[workerId]` publishes immutable contract versions and accepts validated attendance, payroll, and 1% deduction forms.
- HR APIs: `POST /api/hr/workers/:id/contracts`, `/api/hr/attendance/import`, `/api/hr/payroll/import`, `/api/hr/deductions/import`, `GET /api/hr/evidence?period=YYYY-MM`.
- Worker APIs: `GET /api/worker/contract?period=YYYY-MM`, `POST /api/worker/contract-feedback`, `GET /api/worker/contributions`.
- Source changes and evaluations persist transactionally. P2/P3 evaluations append snapshots; earlier results remain readable.
- Mock BPJS confirmation is read through the adapter and compared only with company-period employee-share 1% deductions.
- `npm run db:recompute-evidence` appends P2/P3 snapshots for existing source periods without clearing or changing source rows.

M2 behavior, migration/backfill and verification details are recorded in [`docs/M2.md`](./docs/M2.md).

## M3 risk and auditor

- `/auditor` shows complete assessments in risk order and a separate incomplete-evidence queue; `/auditor/companies/[id]?period=YYYY-MM` shows redacted indicators and assessment history.
- Only the seeded demo operator can use `/demo` to request recalculation. The operator API uses `DEMO_OPERATOR_KEY`; the auditor role cannot recalculate.
- P4 stores `demo-v1` score/coverage/indicator snapshots. P5 contributes only thresholded aggregates; counts below 3 are suppressed. These scores are review priority signals, not fraud findings.
- `npm run db:recompute-evidence` appends P1/P2/P3/P4 snapshots for existing evidence periods without resetting source rows.

M3 rules and verification are documented in [`docs/M3.md`](./docs/M3.md).

## M4 worker and protected reports

- Worker pages: `/worker`, `/worker/contract`, `/worker/contributions`, `/worker/report`.
- P1 contract feedback remains linked to the worker and selected contract version; it is not the P5 report channel.
- `POST /api/worker/reports` accepts only a random UUID submission ID, `YYYY-MM` period, and controlled category. Reusing the same ID/payload returns the same receipt without counting a duplicate.
- Report rows store only ID, company, period, category, and creation time. The worker receives a receipt; auditor/P4 receive only the thresholded company-period aggregate.

M4 privacy and API verification is documented in [`docs/M4.md`](./docs/M4.md).

Database/API integration tests are intentionally restricted to a dedicated database named `jagajkn_m1_test`; they reseed/reset that database:

```powershell
$env:DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/jagajkn_m1_test?schema=public"
$env:M1_TEST_DATABASE_URL = $env:DATABASE_URL
$env:DEMO_MODE = "true"
$env:DEMO_ENVIRONMENT = "approved"
$env:SESSION_SECRET = "<test-only-secret-at-least-32-bytes>"
$env:DEMO_OPERATOR_KEY = "<test-only-operator-key-at-least-32-bytes>"
npm run db:deploy
npm run test:db
npm run test:migration
npm run build
npm run test:api
npx playwright install chromium
npm run test:e2e
```

`test:migration` requires a fresh, empty test database named `jagajkn_upgrade_test`; it builds an M1-shaped fixture and checks the M2 backfill. Keep it separate from user/demo databases.

Playwright browser checks require Chromium and only mutate `jagajkn_m1_test`:

```powershell
$env:DATABASE_URL = "postgresql://<user>:<password>@localhost:5432/jagajkn_m1_test?schema=public"
$env:M1_TEST_DATABASE_URL = $env:DATABASE_URL
$env:DEMO_MODE = "true"
$env:DEMO_ENVIRONMENT = "approved"
$env:SESSION_SECRET = "<test-only-secret-at-least-32-bytes>"
$env:DEMO_OPERATOR_KEY = "<test-only-operator-key-at-least-32-bytes>"
npx playwright install chromium
npm run build
npm run test:e2e
```

The E2E runner deploys migrations, reseeds this dedicated test database, builds into `.next-e2e/`, then starts the browser test server. It rejects any database name other than `jagajkn_m1_test`; startup is capped at 15 seconds and database connection timeout at 5 seconds. Separate build directory avoids colliding with a concurrently running local `next dev` server.

M5 local QA and rehearsal evidence is recorded in [`docs/M5.md`](./docs/M5.md). Deployment remains pending hosting approval/configuration.
