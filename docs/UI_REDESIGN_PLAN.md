# JagaJKN UI redesign plan

Established before implementation: 9 October 2026. User authorizes substantial frontend restructuring across primary journeys. This plan executes that scope as M5 redesign; product/domain decisions remain those in SPEC. No new domain approval needed.

## Direction: an evidence workspace

Calm institutional navy navigation, white decision surfaces, teal task accents. First visual question: **who needs review, why, and what evidence is missing?** HR is a source-maintenance workspace. Worker is a compact personal task hub. Use DESIGN palette, semantic status colors, 4px scale, 12px surfaces, 8px controls, 44px targets, 248px desktop sidebar, ~64px header, 1280px content ceiling. Arial remains the installed fallback; no remote-font or icon dependency required.

## Composition and navigation

### Auditor overview (complete restructure)
Page purpose + period control → compact metrics → ranked complete-company workspace → separately labeled missing-evidence queue. Desktop semantic table: rank/company, score/label, concise evidence categories, coverage/as-of, review action. Mobile transforms same rows into company summaries with explicit column labels, no 920px ranking scroll. Reasons use actual triggered category data; full explanations live in detail. Incomplete queue stays prominent and uses provisional copy. Operator control link remains secondary and access-controlled.

### Company detail (complete restructure)
Back/context → one assessment summary containing score, risk label and period → two-column evidence workspace. Main column: triggered evidence first, clear/unevaluated evidence thereafter, six distinct granular rule names, contributions and explanations. Right rail: P1/P2/P3 coverage, missing processes, rule version, evaluation and saved timestamps, P5 privacy/suppression notice. History remains readable and locally scrollable/focusable. On mobile summary and rail stack before evidence; missing-source explanation never requires horizontal scanning.

### HR
Overview: own company + workforce count + compact P1/P2/P3 maintenance guide → worker list. Detail: contextual back, period control, persisted comparison → in-page source/contract/history links → editing workspace → immutable history. Source forms arranged by task, with headings, units, two-column fields where useful. Contract editor shows prior versus proposed field values before publishing; keep original submit behavior and server validation. Notice near editor, not below distant unrelated forms. Preserve date and money inputs, endpoints, payloads and version immutability.

### Worker
Home: identity in subtitle, contract answer + latest company-period contribution answer, strong links to each task, separate report strip. Contract: period/context, read-only field grid, linked feedback in its own clearly titled surface, then version history. Contributions: period/deduction column + status/explanation column, source/timestamps secondary; company-period disclaimer above timeline. Report: concise categorical form beside privacy/process explanation; prominent receipt plus contract/contribution next actions. No report text/attachments or reporter identifiers.

### Login / operator / recovery
Login: restrained brand column; auditor-first accessible role tabs and selected group's seeded accounts. Mobile choice near top. Login failure is an alert; disabled selected account shows processing. Operator: calculation and results first, reset secondary with existing explicit confirmation. Shared recovery surfaces and skeletons establish clear state hierarchy.

## Shared patterns and files

- `app/globals.css`: semantic surface/text/status/spacing tokens, explicit heading rules, responsive decision-table rows, workspace layouts and drawer styles.
- `src/components/portal-shell.tsx`, `portal-navigation.tsx`: compact responsive shell, role/account context, normalized active paths, keyboard-accessible modal drawer with focus return/Escape, skip-to-content.
- Small `ui.tsx` primitives: PageHeader, SectionHeader, RiskBadge, MetricCard, EmptyState, LoadingSkeleton. Shared evidence labels for six granular indicators; no design-system package.
- Portal pages and existing forms: task-led layout, local operation feedback, publish comparison and clear receipts; preserve API payloads and persisted state.
- `scripts/ui-review.mjs` and focused Playwright coverage: screenshots, axe, widths, drawer/feedback/error checks.

No changes planned to services, repositories, auth policies, Prisma/schema, scoring or API contracts. Only fix misleading client success copy where necessary.

## Interaction and state contract

Keyboard: visible focus, skip link, modal drawer focus management, true active navigation, Escape/close, focusable named table scrollers. Native form constraints remain; input survives failed requests. Busy controls prevent duplicate actions; inline alerts identify failed operation and permit safe retry. Receipt distinct from form. Loading uses non-animated skeleton geometry. Empty states explain missing record/period and recovery action. Server failures and 404 have explicit recovery; role redirects/server 403 behavior preserved.

## Sequence and validation gate

1. Establish audit and plan (this document).
2. Shared shell/tokens/primitives, auditor overview/detail.
3. HR workspace and worker task screens, login/forms/recovery.
4. Run `npm run typecheck`, `npm run build`, `npm test`, database/API checks where environment permits and `npm run test:e2e`. Lint has no configured command; report gap.
5. Capture same routes at 1440px and 390px, inspect images, run axe and page-overflow checks; test keyboard navigation, empty period, API failure, loading and report receipt. Up to three visual refinement rounds, record actual outcomes.

Acceptance focus: AC03/04 working version/self/company flows preserved; AC07 incomplete data remains honest; AC08 auditor/report privacy unchanged; AC09–11 persisted score/drill-down/recompute regression; AC13 UI states/keyboard; AC14 synthetic/mock labels. AC12 timed rehearsal and deployment are separate sign-off evidence; do not infer from screenshots.

## Deliberate DESIGN adaptations

- Mobile auditor uses stacked semantic table rows instead of horizontal scrolling for primary ranking. History tables retain local scrolling.
- Small hand-authored outline SVGs replace uninstalled Lucide dependency.
- Role/account context moves into mobile drawer to reclaim first-screen space; authorized role remains in app bar.
- No decorative overview chart: ranking and evidence deliver clearer review value.

## Completion evidence

Deliver `UI_VALIDATION_REPORT.md` with changed scope, exact commands/results, screenshot locations, refinements, acceptance mapping and remaining blockers. Preserve baseline images for comparison.
