# AGENTS.md — JagaJKN Engineering Agent Instructions

> **Applies to:** the entire JagaJKN repository.  
> **Audience:** Codex and other coding agents working on this MVP.  
> **Project stage:** specification and planning completed; application implementation has not started.  
> **Primary goal:** deliver a reliable, explainable **3–5 minute hackathon demo**, not a production JKN compliance system.

## 1. Read this first: sources of truth

Before planning or editing code, read these files **in order**:

1. `docs/SPEC.md` — authoritative **product scope, P1–P5 flows, D1–D5 logical stores, data semantics, security boundaries, and AC01–AC14**.
2. `docs/PLAN.md` — authoritative **M0–M6 implementation sequence, gates, golden fixtures, priorities, and demo runbook**.
3. `AGENTS.md` — coding-agent execution conventions and quality rules.

If instructions conflict, use this order: **explicit current user request → `docs/SPEC.md` (product/domain) → `docs/PLAN.md` (execution) → `AGENTS.md` (working conventions)**. Explain any conflict before changing behavior. Do **not** silently reinterpret domain rules or edit `SPEC.md`/`PLAN.md` to make an implementation appear compliant.

If a domain decision is genuinely unresolved, choose the safe `UNVERIFIED` / `INSUFFICIENT_DATA` state when applicable, document the assumption, and ask for clarification when the uncertainty blocks correctness.

## 2. Mission and scope

**JagaJKN** helps auditors prioritize review of employers' JKN contributions using evidence from contract history, payroll/attendance, deduction/deposit comparisons, and protected worker reports. It also lets workers inspect their contracts and contribution status.

Build a **single role-based web app** with:

- **HR Portal:** maintain synthetic source records for the HR user's own company.
- **Worker Portal:** see the worker's own contracts and contribution timeline; provide P1 contract feedback; submit protected P5 reports.
- **Auditor Portal:** see ranked **company-level** risks, coverage, redacted evidence summaries, and human review status (where in scope).

**North-star demo:** change synthetic HR evidence → persist data → evaluate P1/P2/P3 → calculate P4 → see understandable risk/priority change on auditor dashboard. Demonstrate worker contract/contribution visibility and the P5 anonymous report path.

### Required versus deferred

**P0:** `SPEC.md` F01–F12, AC01–AC14, and the acceptance gates for the active milestone. Preserve the core P1–P5 workflow even if UI features are reduced.

**Only after P0:** in-app notification polish, search/export, expanded audit case management, complex analytics, animations, advanced onboarding.

**Never add to this MVP without explicit scope change:** real BPJS/WLKP/HRIS/payroll/IoT integrations; ML/LLM fraud detection; payment processing; real worker or health data; automatic fraud verdicts, sanctions, fines, or legal employment classification; microservices or distributed infrastructure.

## 3. Architecture and technology constraints

Use the **proposed MVP architecture from `SPEC.md` §8** unless the user approves a change:

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS.
- **API:** Next.js Route Handlers; authenticated, role- and tenant-scoped JSON endpoints.
- **Business:** modular, testable TypeScript services for P1–P5. Prefer pure functions for rules and scoring.
- **Persistence:** Prisma + **one PostgreSQL database**; repository/query layer and transactions.
- **Integrations:** explicit adapters for **mock BPJS confirmations** and synthetic HR/attendance/payroll data.
- **Testing:** unit, integration, authorization/privacy checks, and essential end-to-end demo paths.

**D1–D5 are logical data-store groups, not five databases and not Cloudflare D1.** Do not split the app into separately deployed services.

Use this structure as guidance; align with existing project conventions if the repository already contains equivalent code:

```text
AGENTS.md
app/                         # Next.js pages, layouts, route handlers
  (auth)/login/
  (hr)/hr/
  (worker)/worker/
  (auditor)/auditor/
  api/
src/
  domain/                    # types, policy, indicators, status vocabulary
  services/                  # p1-contract, p2-wage, p3-reconcile, p4-risk, p5-reports
  repositories/              # scoped reads/writes, transactions
  integrations/              # mock BPJS / fixture adapters
  auth/                      # demo session and server-side authorization
  validation/                # request and input validators
  demo/                      # deterministic fixtures, reset/recompute
prisma/                      # schema, migrations, seed
tests/                       # focused domain + integration + E2E tests
docs/SPEC.md
docs/PLAN.md
```

### Responsibility boundaries

- UI components present server-authorized results; **do not** calculate authoritative risk scores in the browser.
- Route handlers validate requests, authorize scope, call services, and map safe response DTOs.
- Services implement domain rules; **do not** bury wage/reconciliation/scoring logic in React components or database queries.
- Repositories handle data access and transactions; **do not** return unrestricted ORM objects to auditor routes.
- Integrations distinguish mock source data from verified institutional sources.
- Keep dependency direction simple: **UI → API/auth → services → repositories → PostgreSQL**. P4 consumes service-level evidence and **aggregated** P5 counts.

## 4. P1–P5 contracts: domain invariants

| Process | Input → logical store → output | Must never break |
|---|---|---|
| **P1: Status kerja** | HR contracts + worker feedback → **D1** versioned contracts/feedback → P4 classification indicator | Each publish creates a **new immutable contract version**; P1 feedback is worker-linked and access-restricted, **not** an anonymous P5 report |
| **P2: Konsistensi upah** | HR attendance + payslips → **D2** attendance/payroll → P4 inconsistency indicator | Compare same period against the contract version **effective in that period**; treat unusual patterns as review signals, not proven violations |
| **P3: Rekonsiliasi** | HR worker 1% deduction + **mock BPJS** deposit confirmation → **D3** deductions/deposits/results → worker status + P4 discrepancy | Compare **same company, same period, same 1% employee-share component**; never compare a 1% deduction sum directly with an unlabeled 5% deposit total |
| **P4: Skor risiko** | P1/P2/P3 evidence + thresholded D4 company report counts → **D5** versioned assessments → auditor priority | Explain each triggered rule, track evidence coverage, preserve assessment history; risk is **not** fraud proof |
| **P5: Laporan pekerja** | Protected worker report → **D4** de-identified report → aggregate count for P4 | Do **not** persist reporter worker/user ID, name, email, IP address, auth/session ID, identifying free text, or attachments |

### Data and status semantics

- Use **synthetic identities and records only**, explicit `YYYY-MM` periods, and integer IDR monetary amounts. Never use floating-point money.
- Effective-date contract lookup matters: do not assume the newest version applied to older payroll periods. Prevent overlapping effective periods or use an explicit deterministic policy as defined in the spec.
- P3 statuses are **`MATCHED`**, **`MISMATCH`**, **`PENDING`**, **`UNVERIFIED`**. `MISMATCH` requires a comparable confirmed amount exceeding documented tolerance; missing evidence is `PENDING` or `UNVERIFIED`, **not** `MISMATCH`.
- A company-period confirmation does **not** prove receipt/settlement for an individual worker. Worker views must label it as a **company-period reconciliation status**.
- P4 coverage is **`COMPLETE`** or **`INCOMPLETE`**. If incomplete, show provisional observed indicators and the risk label **`INSUFFICIENT_DATA`**, not `LOW`.
- Use the current demo policy from `SPEC.md` §7: **P1 25, P2 30, P3 35, P5 10**, each weighted category contributes at most once per company/period. With complete coverage: `LOW` 0–19, `MEDIUM` 20–49, `HIGH` 50–100. These are **demo weights, not statutory or calibrated fraud probabilities**.
- Maintain all six documented granular evidence indicators in `SPEC.md` §7.1a; P1 rapid status changes are informational in P0 and do not independently increase the score.
- The P5 contribution is eligible only when **at least 3** anonymous company reports fall in the defined window. Suppress smaller counts in auditor output and score; P4 must never access reporter identity or report text.
- Never silently overwrite or delete historical contract versions, reconciliation provenance, or previous risk assessment snapshots.

## 5. Security, privacy and ethical copy

Treat these as **blocking requirements**, even for a hackathon:

1. **Authorization belongs on the server.** Every route and data query checks the authenticated session and scope; a selected frontend role is not proof of access.
2. **HR is company-scoped; worker is self-scoped; auditor is aggregate/redacted-scope.** Test ID tampering and direct API requests across boundaries.
3. **P1 contract feedback is restricted and linked.** Do not show the worker's identity or raw complaint on the auditor dashboard.
4. **P5 report path is de-identified.** Resolve company transiently from authorization, persist only the minimal non-identifying report fields, and avoid identity-bearing application/request logs for this route. Do not claim perfect anonymity if infrastructure logging cannot be controlled.
5. **Auditor APIs return safe DTOs.** Do not expose individual payslips, detailed worker contracts, raw worker identifiers, P5 submission metadata, or free-text report narratives.
6. **Demo reset/recalculate are protected operator actions.** Restrict state-changing demo endpoints, and disable demo reset outside approved demo environments.
7. **Never log credentials, session tokens, sensitive request bodies, or raw source data.** Keep configuration/secrets in environment variables; never commit `.env*` secrets.
8. Display the source label **`Synthetic / Demo`** and identify **mock BPJS** confirmations. Use wording such as **"indikasi", "perlu verifikasi", "belum dikonfirmasi"**, not allegations of fraud.
9. Any auditor finding or sanction is a **human decision outside this automated scoring workflow**.

Prefer select-only P5 categories. Avoid report free text and attachments to reduce identification risks. Handle bad inputs with typed validation errors, not accidental data disclosure.

## 6. Demo-driven UX requirements

**Prioritize the auditor experience** because it communicates the value proposition most clearly. Support all three roles, but avoid making every page equally complex.

- `/login`: clearly labeled seeded demo accounts and sign-in status.
- `/hr`: company-scoped workforce/data overview; a worker detail supports contract version history and source editing/imports.
- `/worker`, `/worker/contract`, `/worker/contributions`, `/worker/report`: own contract, version history, honest reconciliation status, protected report form/receipt.
- `/auditor`, `/auditor/companies/[id]`: ranked company list, risk score, evidence coverage, triggered rules, explanations, and redacted drill-down.
- Every critical screen handles **loading, empty, validation failure, server failure/retry, 403, 404**, and domain-specific missing-evidence states.
- Show **numerical score, readable label, rule explanations and evidence completeness** together; never rely on color alone. Use accessible labels, keyboard focus, clear typography and responsive layouts.
- A professional, trustworthy financial/compliance visual design is preferable to charts/animations without decision value.
- **Do not fake pipeline behavior** through static risk cards or hard-coded client-only status changes. Dynamic views must reflect persisted and recomputed results.

## 7. Milestone-by-milestone execution protocol

Follow **`docs/PLAN.md` M0 → M6**. **Do not implement all milestones in one unreviewed burst.** Unless the user requests otherwise, take the next *explicitly requested* milestone/task and stop at its exit gate.

**Before work:**

1. Read `SPEC.md`, `PLAN.md`, and this file; inspect the current repository and relevant code/tests.
2. Identify the assigned milestone, related **Fxx** requirements, and **ACxx** acceptance gates.
3. State a short implementation plan: files to touch, dependencies, tests, and any assumption affecting domain correctness.
4. If no task/milestone was provided, propose the next milestone (normally **M0**) instead of making large speculative changes.

**During work:**

1. Implement the **smallest vertical slice** that produces observable and persisted user value.
2. Validate user inputs, server-side access, and error states as part of the slice.
3. For changes to a rule, scoring policy, contract version selection, or P5 data path, add/update the relevant unit and privacy tests **in the same task**.
4. Check actual package scripts and installed tools before running commands. Do not invent existing commands or claim tests passed unless executed.
5. Reuse existing components and dependencies when adequate; avoid refactoring unrelated modules and generating speculative abstractions.
6. Record unresolved assumptions/decisions concisely; do not fake source data, official API integration, or successful outputs.

**After work:**

1. Run the relevant available checks (lint/typecheck/unit/integration/E2E as applicable). If scripts are not implemented, report that rather than claiming success.
2. Compare behavior with linked `ACxx` checks and the milestone exit gate.
3. Summarize **what changed, tests run with outcomes, demo-visible behavior, blockers, and suggested next task**.
4. Stop at the agreed milestone boundary; request review when a domain or scope decision changes.

### Milestone priorities

| Phase | The result to prove |
|---|---|
| **M0 Scope lock** | P1–P5, mock-data bases, six indicators, golden cases, and route/scope decisions agreed |
| **M1 Foundation** | Real migrations, deterministic seed/reset, 5 companies/100 workers, role-scoped demo sessions |
| **M2 Evidence** | Persisted P1 immutable versions, P2 wage/attendance checks, P3 comparable reconciliation |
| **M3 Risk & auditor** | P4 indicator snapshots, coverage, explained ranks, functional auditor leaderboard/detail |
| **M4 Worker & P5** | Worker self-service + privacy-safe P5 reports/thresholded company counts |
| **M5 Polish & QA** | UI states, cross-role regression, all ACs, deployment and 3–5-minute demo |
| **M6 Buffer** | Two clean-reset rehearsals and a stable backup presentation path |

**Critical path:** synthetic fixtures → P1/P2/P3 outputs → P4 scoring → auditor UI. P5 aggregates should have a stable data contract early, even when the full worker form is implemented in M4.

## 8. Required golden fixtures and regression checks

Use the scenarios in `SPEC.md` §11 and `PLAN.md` §6:

| Company | Expected output (when specified evidence is complete) |
|---|---|
| A | P1 25 + P3 35 = **60 / HIGH** |
| B | P2 30 = **30 / MEDIUM** |
| C | Missing P3 confirmation = **INSUFFICIENT_DATA**, no fabricated delta |
| D | Clean evidence = **0 / LOW** |
| E | 3 anonymous reports = P5 10 / LOW; smaller counts must be suppressed |

Also test: all four P3 statuses; older version remains unchanged after publishing a contract; current-versus-effective contract period selection; out-of-scope HR/worker/auditor API requests; anonymous report storage has no reporter identity; P4 recomputation preserves snapshots; missing-source states never become false fraud findings.

A successful seeded test proves the program behaved as specified **on synthetic fixtures**; it is **not** proof of real-world fraud detection accuracy or legal correctness.

## 9. Collaboration and multi-agent guardrails

Parallel agents may work on **non-overlapping files** after the interfaces are agreed. Assign one owner to each shared concern:

- **Schema/migrations/seed:** one owner at a time.
- **Domain rule definitions and shared API DTOs:** one owner at a time; coordinate changes with dependent services/UI.
- **P1/P2**, **P3/P4**, **frontend**, and **QA** can progress in parallel only when their contracts are stable.
- Avoid multiple agents editing `schema.prisma`, the same migration, shared scoring configuration, or route contracts concurrently.
- Do not merge competing implementations of the same service. Integrate frequently and rerun relevant cross-module tests.

If delegating work, give each agent: **milestone + bounded files + source docs/sections + expected acceptance test + explicit exclusions**. Parallelism must not compromise data-model or scoring consistency.

## 10. Completion report format

When completing any implementation task, report using this concise structure:

```text
Milestone / Task:
Scope completed:
Files changed:
Tests executed and results:
Acceptance criteria verified:
Demo-visible result:
Unresolved issues / decisions:
Next recommended task:
```

**Never claim “done” solely because pages render.** An MVP slice is complete only when domain behavior is persisted, access-controlled, testable, and explainable. If blocked, state exactly what is missing and leave the repository in a coherent state.

---

**Reminder:** `docs/SPEC.md` defines **what** to build; `docs/PLAN.md` defines **when and in what order**; this `AGENTS.md` defines **how an AI coding agent must work**. Keep the project small, the data synthetic, the rules explainable, and the demo reproducible.
