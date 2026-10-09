# JagaJKN UI/UX audit

Date: 9 October 2026 · Scope: M5 frontend redesign · Sources: SPEC, PLAN, AGENTS, DESIGN.

## Method and baseline

Inspected every page, loading/error boundary and all nine shared frontend components, root layout, redirect and 404. APIs/services inspected through their existing page contracts; domain behavior remains authoritative. Ran Next.js locally through `scripts/ui-review.mjs` using seeded demo sessions. Captured 12 screens at 1440×1000 and 390×844 in `test-results/ui-review-before/` and reviewed baseline images before editing. Used Playwright Chromium and axe on all 24 views. No source-data changes during audit. Playwright later cleared its output directory, including these baseline files; final captures now use `artifacts/` to prevent repeat loss. Before/after comparison was performed against the initially reviewed images; retained baseline image files are a deliverable gap.

Baseline: no page-wide overflow; desktop axe checks pass. Mobile company A/C detail, HR worker detail and worker contract fail `scrollable-region-focusable`. These results do not establish comprehensive accessibility.

## Primary journeys

1. Auditor: sign in → select period → identify priority company → understand triggered evidence, coverage and score → inspect preserved assessment history.
2. HR: own workforce → select worker/period → compare persisted source evidence → update payroll/presensi/deduction or publish immutable contract → operator recomputes P4.
3. Worker: own summary → contract/history/linked feedback → company-period contribution explanation → separate protected categorical report → receipt.
4. Operator: authenticated control → calculate selected period → inspect saved result → return to auditor; reset requires explicit confirmation.

## Prioritized findings

| Priority | Finding / evidence | Impact | Recommended response |
|---|---|---|---|
| P0 | Mobile scroll containers lack focusability on four views (axe) | Keyboard users cannot reliably inspect all evidence/history columns | Name and focus all retained scroll regions; replace primary mobile ranking with stacked rows |
| P1 | Auditor ranking rows devote most width/height to full explanations, tiny scores and narrow company names | First review decision requires reading paragraphs; four complete companies consume ~550px | Rank/name/score as anchors, concise category summaries, explicit detail action; full explanations in drill-down |
| P1 | Company detail treats score, coverage, rule version and timestamp as four equally weighted cards, then one long evidence table | Triggered reasons not prioritized; same labels repeated for distinct granular rules | One assessment summary, coverage rail, triggered-first evidence articles with distinct rule names; metadata/history secondary |
| P1 | HR detail puts source editing after full evidence and contract history (~900px before first editor) | Demo action hard to discover; long scrolling between read and write | Add in-page task links; source workspace before history, form groups with local feedback and contract change preview |
| P1 | Mobile header/sidebar occupy ~400px before worker heading | Actual task begins near bottom of initial screen | Compact sticky app bar, drawer nav, account context inside drawer, persistent concise demo marker |
| P1 | Worker home leads with code/company/source cards, then contract/status | Redundant identity blocks displace answers and next action | Task-first contract and latest contribution tiles; small identity context; separate reporting CTA |
| P1 | Login renders all 11 accounts below brand copy; mobile role/account choice requires extensive scrolling | HR/worker sign-in slow, role hierarchy unclear | Auditor-first role tabs; show only selected role's account options, preserve server-created seeded sessions |
| P1 | Contract publish feedback is rendered in later source panel; success label uses computed default date instead of submitted date | User may miss result or see misleading effective date | Feedback next to active workspace; derive success copy from actual selected effective date |
| P1 | Logout lacks busy/failure handling; sign-in failure lacks alert styling | Network failure can appear to complete or go unnoticed | Explicit busy/error feedback and safe retry |
| P2 | Typography relies on browser-reset defaults for many headings; preferred font is named but not loaded | Section hierarchy weak; repetitive inline styles drift | Explicit heading/reset rules, semantic tokens and small shared UI primitives; use existing Arial fallback honestly |
| P2 | Loading views are generic 180px text blocks | Abrupt layout shift, little preview of incoming structure | Geometry-based skeleton with accessible status and reduced-motion support |
| P2 | Empty HR list is an empty table; no contract/history guidance; error pages visually understructured | Missing evidence difficult to recover from | Specific empty-state title/context/next action and consistent recovery layout |
| P2 | Nav active matching fails when href includes period query, and overview not marked on detail | Orientation lost on detail routes | Normalize href path; parent-section active matching and contextual back link |
| P2 | P5 form mixes privacy, form and receipt into one undifferentiated card | Completion is not a clear phase; important privacy distinction competes with controls | Form + explanatory side rail, prominent receipt and next actions without identity fields |

## Screen and component inventory

| Route | Current issues / redesign scope |
|---|---|
| `/` | Redirect-only; preserve |
| `/login` | Restructure role/account selection, shorten mobile brand preamble; loading, empty and sign-in failure |
| `/auditor` | Restructure decision ranking and visible incomplete queue; period context, mobile rows, explicit review links |
| `/auditor/companies/[companyId]` | Complete restructure: assessment hero + coverage/provenance rail + prioritized evidence + history |
| `/hr` | Workforce task workspace; small source-process guide and empty handling |
| `/hr/workers/[workerId]` | Complete reorder: period/evidence → editing → history; accessible source task controls and publish comparison |
| `/worker` | Complete restructure: current answers before identity; reporting next action |
| `/worker/contract` | Readable contract fields, feedback before secondary history; mobile-safe version history |
| `/worker/contributions` | Timeline with period/deduction/status alignment; explanation near results, provenance secondary |
| `/worker/report` | Purpose/form + privacy side rail; receipt and retry phase |
| `/demo` | Calculation-first workspace and clearly separated destructive reset; preserve key/session controls |
| 404 and error boundaries | Recovery hierarchy, simulation label and return action |
| Four loading routes | Shared skeleton, status label, final-layout geometry |

Shared components audited: PortalShell, PortalNavigation, LogoutButton, HrEvidenceEditor, ContributionTimeline, ContractFeedbackForm, ProtectedReportForm, OperatorRecalculatePanel, evidence-copy. Existing role guards, source labels, status text, P5 suppression and form input retention are valuable patterns to retain.

## Functional and ethical constraints

Do not reinterpret LOW versus incomplete, confirmed discrepancy versus waiting/unverified, individual deduction versus company-period status, or linked P1 feedback versus de-identified P5. No auditor worker identity, no small report counts, no invented score/timestamp, no automatic finding. Recalculation remains an operator-only action. All UI uses real server-authorized results.

## Verification gaps at audit stage

No lint script/tool configured. Functional regression suites and post-redesign visual checks belong to Phase 4. Initial captures cover populated routes, incomplete company and 404; injected failures, empty selections, loading and keyboard drawer behavior need targeted follow-up. Infrastructure privacy, legal accuracy and production accessibility are not established by these UI checks.
