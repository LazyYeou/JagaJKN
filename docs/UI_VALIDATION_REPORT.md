# JagaJKN redesign validation report

Date: 9 October 2026 · Milestone/task: M5 substantial frontend redesign.

## Scope completed

Audit and proposal were written before application edits. All primary portals now share a decision-first visual language and responsive navigation.

- **Auditor:** ranked company workspace with explicit review actions, concise reasons, larger score/label anchors and a distinct incomplete-evidence queue. Mobile rankings become stacked rows instead of a 920px-wide scroller.
- **Company detail:** assessment summary, triggered-first evidence articles with six distinct rule names, coverage/provenance rail and preserved snapshot history. Missing evidence shows an unavailable contribution instead of an evaluated zero. Mock-BPJS comparison explicitly labeled.
- **HR:** task guide, worker source workspace before history, source/contract task selection, one source editor at a time, retained drafts, prior/proposed contract comparison and local operation feedback. Publish success reports the submitted effective date.
- **Worker:** contract and latest contribution answers before identity metadata, clear next actions, linked feedback separated from P5, readable contribution timeline and prominent report receipt with keyboard focus.
- **Shell and recovery:** compact mobile header, modal navigation drawer with focus wrapping/Escape/focus return, single active navigation item, skip link, named focusable history tables, reusable loading/empty/header/metric/status patterns and clearer failure recovery.
- **Login:** auditor-first keyboard-operable role tabs, selected-role seeded accounts, processing and failure feedback.
- **Operator:** calculation-first presentation; protected recalculation and reset confirmation preserved.

API contracts, auth policy, repositories/services, scoring, Prisma schema and data models were not edited. No dependencies added.

## Files changed

| Group | Files |
|---|---|
| Deliverables | `UI_UX_AUDIT.md`, `UI_REDESIGN_PLAN.md`, `UI_VALIDATION_REPORT.md` |
| Design foundation | `app/globals.css`, new `src/components/ui.tsx`, new `src/components/risk-copy.ts` |
| Shell | `src/components/portal-shell.tsx`, `portal-navigation.tsx`, `logout-button.tsx` |
| Auditor | `app/auditor/page.tsx`, `app/auditor/companies/[companyId]/page.tsx` |
| HR | `app/hr/page.tsx`, `app/hr/workers/[workerId]/page.tsx`, `src/components/hr-evidence-editor.tsx` |
| Worker | all four `app/worker/**/page.tsx` screens, `src/components/contract-feedback-form.tsx`, `contribution-timeline.tsx`, `protected-report-form.tsx` |
| Login/operator/recovery | `app/login/page.tsx`, `app/demo/page.tsx`, `src/components/operator-recalculate-panel.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/worker/error.tsx`, all four portal `loading.tsx` files |
| Verification | new `scripts/ui-review.mjs`, new `scripts/ui-checks.mjs`, new `tests/e2e/ui-redesign.spec.ts`, updated `tests/e2e/m5-demo.spec.ts`, `tests/e2e/run.mjs`, `.gitignore` |

## Environment and reproducibility

Windows / Node 22.18 / Next.js 15.5.27 / Playwright Chromium. Visual review used seeded sessions against existing local synthetic demo data, without source writes or resets. Mutating database/API/browser suites used a separately created **`jagajkn_m1_test`** database, existing migrations and deterministic seed. No environment secrets printed or changed.

Regression wrapper derives the dedicated test database only for a local host, or accepts explicitly configured `M1_TEST_DATABASE_URL`; it rejects other database names. Load local environment using Node's `--env-file` flag:

```powershell
node --env-file=.env scripts/ui-checks.mjs db:deploy test:db test:e2e test:api
node --env-file=.env scripts/ui-review.mjs after
```

`test:e2e` performs migration deploy, seed, optimized build and browser tests. `test:e2e:browser` can reuse a completed `.next-e2e` production build. Generated screenshots/builds are ignored by `.gitignore`.

## Checks executed and outcomes

| Check / exact invocation | Result |
|---|---|
| `npm run typecheck` | PASS, including final invocation after application changes |
| `npm test` | PASS: 22 unit tests; authorization, session/environment, P1/P2/P3/P4 rules and P5 validation/privacy |
| `node --env-file=.env scripts/ui-checks.mjs db:deploy test:db …` | Migration deploy PASS; database integration PASS (1 top-level integration test with multiple assertions) |
| `npm run build` through `test:e2e` | PASS: optimized production compilation, type validation and 22 static-page generation steps; all dynamic portal/API routes built |
| `node --env-file=.env scripts/ui-checks.mjs test:e2e:browser test:api` | Final PASS: 7 browser tests; API integration PASS (1 top-level test with multiple scope/privacy assertions) |
| `node --env-file=.env scripts/ui-review.mjs after` | PASS: 12 routes × 2 viewports, zero axe violations and zero page-wide overflow |
| Tablet checks in browser suite | PASS: auditor at 768px and 1024px, no page-wide overflow |
| Lint | NOT RUN: no `lint` script or standalone lint tooling configured in repository |

Initial runs exposed stale/ambiguous test selectors, a login navigation race in the test helper, native-dialog boundary focus behavior, and short build/walkthrough runner timeouts. Selectors now target exact elements, sign-in waits for its authorized destination, drawer explicitly wraps focus, and timeouts reflect the actual multi-role/screenshot workflow. Final build, typecheck and all listed suites pass. No rule/privacy checks removed to obtain a pass.

## Browser journeys and states verified

1. Clean reset → auditor baseline → company C incomplete detail.
2. HR payroll correction → persisted P2 result → new immutable contract version → operator recomputation → company B moves from 30/MEDIUM to 0/LOW; history preserved.
3. Worker self-scoped contract/history → linked P1 feedback → contribution discrepancy with company-period disclaimer.
4. P5 report receipt → counts 1–2 suppressed → third report contributes 10; auditor response contains only permitted aggregate data.
5. Mobile keyboard navigation, active child route and protected reset cancellation.
6. Login role-tab arrow/Home/End semantics; failed sign-in remains enabled/recoverable.
7. Drawer keyboard wrapping, Escape and focus return; failed report preserves input and retry submission ID/payload, with no added identity fields.
8. Real unassessed period: no complete assessments and separate evidence queue; focusable company history; tablet overflow checks.
9. Delayed and empty login account responses; meaningful loading and missing-seed instructions.
10. HR source-task switching retains unsaved payroll input; contract preview marks changes; publishing a selected **2026-11-01** effective date displays that actual date and retains v1/v3 history.

Additional source inspection covers SSR skeletons, empty HR workforce, missing contract/deductions, shared server-error boundaries and existing server authorization/404 handling. These branches were not all independently forced through a browser. The visual route matrix includes populated login, auditor, A/C company detail, HR overview/detail, worker home/contract/contributions/report, operator access form and 404.

## Visual review and refinements

Baseline screenshots were captured and inspected before changes. Two refinement rounds followed the initial implementation:

1. Corrected company-cell row alignment, named duplicate landmarks, strengthened section hierarchy, explicit list markers and login hierarchy. Mobile table-scroller axe failures eliminated.
2. Reduced HR editor overload through task selectors; corrected single active navigation matching; improved drawer focus behavior, unavailable-score copy, local save feedback and receipt focus.

Final desktop/mobile images reviewed: auditor ranking, company assessment and incomplete company, HR source workspace and contract preview, worker home, login and P5 form/receipt. No further visual refinement needed for agreed scope.

### Screenshot evidence

- **Final route matrix:** `artifacts/ui-review-after/` (24 PNGs, 1440×1000 and 390×844).
- **Persisted journey/screenshots:** `test-results/m5-demo-M5-clean-reset-wal-75d91-uditor-sees-only-aggregates/`, including `hr-contract-preview-1440.png` and `worker-report-receipt-1440.png`.
- **Mobile journey:** `test-results/m5-demo-M5-mobile-worker-n-33727-quire-explicit-confirmation/`.
- **Baseline retention gap:** initial PNGs lived under `test-results/ui-review-before/`; Playwright cleared that output directory on its first test run. Before/after review used the initially inspected baseline images, but standalone baseline PNGs are no longer retained. Visual review output now uses `artifacts/` so regression runs do not erase it.

Observed improvement: mobile worker task content starts after a ~64px app bar rather than the previous ~400px header/sidebar block. Worker home replaces three identity/source cards with immediate contract/contribution answers. Auditor explanations move from dense ranking paragraphs into a dedicated drill-down; HR exposes task selection ahead of historical records.

## Acceptance mapping

| Criteria | Evidence / status |
|---|---|
| AC01–02 | Dedicated database seed assertions and golden fixture regression PASS |
| AC03–04 | Immutable publish/history and role/self/company isolation PASS in DB/API/browser tests |
| AC05–06 | Unit/domain and integration checks PASS, including clean fixture and four P3 states |
| AC07 | Incomplete company label, unavailable delta and separate queue PASS; no LOW substitution |
| AC08 | P5 identity rejection/storage/API suppression checks PASS; retries retain only allowed request fields |
| AC09–11 | Golden scores, six indicators, category-once contributions, snapshots and changed persisted ranking PASS |
| AC13 | Primary keyboard/state/browser checks PASS; remaining uncommon empty/SSR-error branches source-reviewed rather than exhaustively browser-tested |
| AC14 | Synthetic/mock labels source-reviewed and visible in route matrix; explicit mock-BPJS provenance retained |
| AC12 | NOT VERIFIED: automated clean-reset walkthrough is not a timed 3–5-minute human demo |

These checks establish behavior on synthetic fixtures, not real-world fraud detection or comprehensive accessibility certification.

## Unresolved issues / decisions

- No standalone lint setup; configuring one requires a separate engineering decision.
- Retained pre-redesign PNGs unavailable after Playwright output cleanup; final screenshot evidence retained.
- Preferred Plus Jakarta Sans remains an unloaded preferred font name; installed Arial fallback used without remote fetch/dependency.
- Navigation uses small decorative text glyphs rather than the proposed SVG/Lucide icons; accessible text labels remain authoritative.
- Timed human rehearsal, deployment verification and two M6 clean-reset rehearsals remain release sign-off work.

## Demo-visible result / next recommended task

Auditor can scan priorities and open a coherent evidence explanation; HR can select a focused source task or inspect/publish a new contract; worker can reach contract/iuran/report actions from a compact hub. Real source edits still change persisted risk after protected recalculation.

Next: stakeholder visual review, then timed PLAN §8 rehearsal in target deployment environment. Stop at this redesign/validation boundary.
