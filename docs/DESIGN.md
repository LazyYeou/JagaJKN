# DESIGN.md — JagaJKN Web Design System & Screen Blueprint

> **Status:** Proposed design specification, ready for MVP UI implementation. No application code is defined here.  
> **Product:** JagaJKN — *Dari Upah hingga Setoran, Kepatuhan Iuran JKN yang Transparan dan Dapat Diverifikasi.*  
> **Visual source:** `Sambak - Healthkaton(1).pdf` (especially slides 2–4, 6, 8, and 10).  
> **Product sources:** `docs/SPEC.md`, `docs/PLAN.md`, and `AGENTS.md` in this repository.  
> **Goal:** A professional, trustworthy, and instantly understandable **3–5 minute hackathon demo**, not a pixel-identical reproduction of the pitch deck.

## 0. Authority, scope, and design decisions

- **Product and domain rules:** `docs/SPEC.md` is authoritative. Do not override its risk weights, role scopes, reporting privacy, or contribution semantics in the UI.
- **Delivery sequence:** `docs/PLAN.md` M0–M6 is authoritative.
- **Agent behavior and guardrails:** `AGENTS.md` is authoritative.
- **Visual and interaction behavior:** this `DESIGN.md` is the reference for styling, reusable components, page composition, accessible copy, and visual QA. Where visual guidance conflicts with a domain/security constraint, **domain/security wins**.
- Implement **one responsive web application** with three role-based portals: **HR**, **Worker**, **Auditor**. Do **not** turn P1–P5 into five separate products.
- Prioritize the auditor dashboard and company risk drill-down for demo impact; make HR and Worker flows complete but smaller.
- UX must differentiate: **a proven record mismatch**, **missing evidence**, **a reported concern**, and **a confirmed legal violation**. This MVP can represent the first three, **never** the fourth.

### Source-to-web translation

The deck establishes a visual identity, not a full product UI design. These are the intentional mappings:

| Pitch deck element | Web implementation |
|---|---|
| Dark navy headings and navigation strips | Primary text, sidebar, app header, and primary buttons |
| Teal table headings and horizontal gradient bands | Active states, accents, KPI details, icons, and restrained hero/banner treatment |
| Bright cyan in the JagaJKN wordmark and corner strips | Small brand highlights, focus decoration, sparing chart contrast |
| Pale mint emphasis panels | Informational and successful evidence backgrounds |
| White presentation backgrounds | Off-white web canvas with crisp white content surfaces |
| Very dense presentation tables | Responsive, readable, sortable data tables with hierarchy and progressive disclosure |

**Do not:** copy the slide navigation footer, present every component in a gradient box, recreate the slide's drop-shadow-heavy borders, or use official BPJS/Healthkathon marks unless usage rights are confirmed.

---

## 1. Brand character and visual direction

**Attributes:** trustworthy · institutional without being bureaucratic · transparent · evidence-based · calm · efficient · human-centered.

- **Product personality:** a reliable civic/compliance dashboard, not a marketing landing page and not a speculative AI detective.
- **Hierarchy:** clear page purpose → critical KPI/answer → evidence and reasoning → context/history → secondary actions.
- **Visual density:** medium on HR/Worker, medium-to-high on Auditor. Favor data legibility over decorative whitespace.
- **Design priorities:** information correctness, labeled state, source provenance, visible next action, accessible controls, good demo ergonomics.
- **Language:** Indonesian for end-user labels and help text. Technical identifiers and enum strings may remain English in code and specifications.

### Wordmark usage

- Display `JagaJKN` as a simple text wordmark if no authorized artwork is provided.
- Render `Jaga` in **brand navy** and `JKN` in **brand teal**. A subtle blue → cyan → teal accent is optional on a large marketing-style title only.
- Do not use tiny multicolor gradient text in application navigation; solid colors render more reliably and read better.
- Avoid implying JagaJKN is an official BPJS product. Use a visible **“Prototype / Data Simulasi”** identifier.

---

## 2. Color system

### 2.1 Presentation-derived brand palette

The first column is the color's **source role**; the web-use column is a design decision. Flat source colors come from the vector fills of the PDF where possible. Cyan/gradient values are representative visual samples, **not a claim that the original design has a single exact gradient stop**.

| Token | HEX | Presentation reference | Web usage |
|---|---|---|---|
| `brand.navyDeep` | `#041954` | Deep navy gradient bands, slides 4 and 8 | Premium/hero gradient start; rare dark surfaces |
| `brand.navy` | `#173A70` | Section/tab blue on slides 2–4 | Primary action, sidebar, major headings |
| `brand.teal` | `#3BB195` | Teal comparison cells on slides 3–4 | Brand accent, decorative fill, chart series |
| `brand.tealStrong` | `#108177` | Darker teal panels and callouts, slides 2 and 8 | Accessible white-text accent buttons or section elements |
| `brand.tealDeep` | `#004C4C` | Dark green-teal in slide 4 | Strong brand emphasis on pale mint |
| `brand.cyan` | `#0BB4DE` | Representative bright cyan gradient in left-edge strips and wordmark | Small highlight, chart-series differentiation only |
| `brand.mint` | `#C9F3E8` | Pale mint panels, slide 2 | Soft information surfaces |
| `brand.mintBright` | `#CAFFF2` | Very light mint callout fill, slides 2 and 10 | Informative highlights, never sole status signal |
| `brand.canvas` | `#FAFBFF` | Off-white slide canvas | Global app background |
| `brand.white` | `#FFFFFF` | Slide content surfaces | Cards, tables, forms, dialogs |

#### Brand palette preview

```text
Navy Deep   #041954  ████████████
Navy        #173A70  ████████████
Teal Strong #108177  ████████████
Teal        #3BB195  ████████████
Cyan        #0BB4DE  ████████████
Mint        #C9F3E8  ████████████
Canvas      #FAFBFF  ████████████
```

The color values, not the terminal rendering of the blocks, are authoritative.

### 2.2 Web surface and text tokens (adapted for readability)

| Token | HEX | Usage |
|---|---|---|
| `surface.canvas` | `#FAFBFF` | Page background |
| `surface.card` | `#FFFFFF` | Main content containers, sheets and overlays |
| `surface.subtle` | `#F1F6F8` | Table alternate region, filter strips, inactive soft controls |
| `surface.brandSoft` | `#E8F7F2` | Low-emphasis teal surface |
| `text.primary` | `#14243B` | Paragraphs, data, form values |
| `text.secondary` | `#4B5F73` | Supporting copy, labels, descriptions |
| `text.inverse` | `#FFFFFF` | Text on navy / tealStrong dark fills |
| `text.link` | `#173A70` | Interactive text links |
| `text.accent` | `#006D64` | Teal text on white/mint (accessibility-adapted) |
| `border.default` | `#D4E1E8` | Cards, inputs, tables, separators |
| `border.strong` | `#A9BDC9` | Active/form structure when needed |
| `focus.ring` | `#108177` | Focus outline/ring on light surfaces |

**Important accessibility rule:** the deck's vivid `#3BB195` and cyan `#0BB4DE` should **not** be used for normal-sized white text or as normal-sized text on white. They have insufficient contrast for WCAG AA normal text. Use `#108177` for white text on teal, or `#006D64` for teal text on white. Brand teal remains suitable for accents and larger non-text graphics with sufficient contrast to adjacent surfaces.

### 2.3 Semantic colors are not brand colors

Risk and data verification states must have their **own** consistent palette; teal is not automatically “safe,” and cyan is not automatically “pending.”

| Meaning | Text/icon HEX | Background HEX | Visible label |
|---|---|---|---|
| `risk.high` / material mismatch | `#B42318` | `#FEF3F2` | **Risiko Tinggi** / **Terdapat Selisih** |
| `risk.medium` / attention | `#975B07` | `#FFF7E6` | **Risiko Sedang** |
| `risk.low` / clean checked evidence | `#116B54` | `#EAF7F2` | **Risiko Rendah** / **Cocok** |
| `state.incomplete` / no sufficient evidence | `#52637A` | `#F1F5F9` | **Data Belum Lengkap** |
| `state.pending` / waiting in documented window | `#975B07` | `#FFF7E6` | **Menunggu Konfirmasi** |
| `state.info` / informational | `#173A70` | `#EAF2FC` | **Informasi** |
| `state.error` / invalid or server failure | `#B42318` | `#FEF3F2` | **Gagal / Tidak Valid** |

Rule: **a numerical score and a risk label are never displayed by color alone**. Pair them with explicit text, explanation and, where available, a category icon.

### 2.4 Recommended restrained gradients

Use one brand gradient for a **login illustration, top accent line, or header banner** only:

`linear-gradient(105deg, #041954 0%, #173A70 38%, #108177 76%, #3BB195 100%)`

Do not use gradients inside a risk table, score badges, form controls, audit evidence, or data charts. High-fidelity data work needs flat, predictable surfaces.

### 2.5 Color accessibility checks

Calculated against white (`#FFFFFF`), approximately:

- `#173A70` → **11.20:1** (passes WCAG AA normal text).
- `#108177` → **4.74:1** (passes WCAG AA normal text).
- `#006D64` → **6.23:1** (passes WCAG AA normal text).
- `#3BB195` → **2.66:1** (**fails** AA normal text).
- `#0BB4DE` → **2.44:1** (**fails** AA normal text).
- `#4B5F73` → **6.60:1** (passes AA normal text).

Re-check actual foreground/background pairings, including chart labels, disabled states, focus outlines and selected rows, during UI QA. Target **4.5:1** for normal text and **3:1** for large text and essential non-text UI indicators. Do not claim comprehensive accessibility solely from token-level contrast checks.

---

## 3. Typography, spacing, and visual primitives

### 3.1 Type system

- **Preferred UI font:** `Plus Jakarta Sans`, fallback `Inter`, `Arial`, `sans-serif`. Use a single font if delivery time is limited.
- **Numbers, amounts, dates:** use tabular figures (`font-variant-numeric: tabular-nums` or equivalent) in KPI cards, score values and financial tables.
- **Language:** Indonesian interface; preserve terms like `HR`, `BPJS`, `JKN`, and `Audit` only when context requires them.
- **Titles:** sentence case; reserve ALL CAPS for small overlines, not main headings.

| Style | Desktop | Mobile | Weight / line-height | Usage |
|---|---|---|---|---|
| Display | 32px | 26px | 700 / 1.2 | Important page headings only |
| Page heading | 26px | 22px | 700 / 1.3 | All primary portal screens |
| Section heading | 20px | 18px | 700 / 1.35 | Major content section |
| Card heading | 16px | 16px | 650 / 1.4 | Cards and side panels |
| Body | 14–16px | 14–16px | 400 / 1.5 | Primary interface copy |
| Table body | 14px | 14px | 400–600 / 1.45 | Tabular content |
| Helper/caption | 12–13px | 12–13px | 400–500 / 1.4 | Sources, timestamps, hints |
| KPI metric | 28–36px | 24–30px | 700 / 1.1 | Scores and important amounts |

Avoid using 11px text in core workflows. Preserve enough line height for long Indonesian status copy.

### 3.2 Layout dimensions and spacing

- **Base spacing unit:** 4px. Use 4 / 8 / 12 / 16 / 24 / 32 / 48px intentionally.
- **Desktop sidebar:** 248px fixed width; collapsed state optional after P0.
- **Top app bar:** approximately 64px height.
- **Desktop content area:** max 1280px inside available app body; 24–32px padding, 24px default section gap.
- **Mobile:** 16px horizontal padding and 16–20px section gaps; use drawer navigation.
- **Cards:** 12px radius, 1px soft border, 20–24px inner padding.
- **Buttons / inputs:** 8px radius and minimum 40px height; 44px or more for touch-first actions.
- **Badges/chips:** pill radius, 12–13px label, compact but never color-only.
- **Shadows:** subtle (`0 2px 8px rgba(4,25,84,0.05)`); use elevation sparingly, not slide-style hard shadows.
- **Dividers:** neutral light border, not saturated navy.

### 3.3 Iconography and illustration

- Consistent outline icon set, preferably **Lucide**, stroke ~1.75–2px.
- Icons identify action or domain: `building`, `file-clock`, `wallet`, `receipt`, `shield-check`, `chart-no-axes-combined`, `bell`, `flag`, `info`, `alert-triangle`.
- Decorative illustration is optional for login/empty states. Never distract from risk evidence.
- No 3D globe, animated background, floating cards, glassmorphism or ornamental audit “AI” imagery.

---

## 4. Information architecture and application shell

### 4.1 Global shell

Desktop structure:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Top bar: JagaJKN / page breadcrumbs       Demo Data badge   Role   Account │
├────────────────┬───────────────────────────────────────────────────────────┤
│ Sidebar (248)  │ Page heading                        Primary action         │
│                │ Explanation / last updated                                 │
│ Role navigation│ ┌───────────────────────────────────────────────────────┐ │
│                │ │ KPI / status summary (where useful)                   │ │
│                │ └───────────────────────────────────────────────────────┘ │
│                │ ┌───────────────────────────────────────────────────────┐ │
│                │ │ Search + filters / main table / detail content        │ │
│                │ └───────────────────────────────────────────────────────┘ │
└────────────────┴───────────────────────────────────────────────────────────┘
```

- Sidebar: solid `brand.navy` or white with navy active styling; choose **one** treatment consistently. **Recommended:** navy sidebar, white content area, teal active marker.
- Active item: visible text/weight + contrasting surface/left border; not only a teal icon.
- Role indicator stays visible to prevent demo confusion; role is authorized server-side, **not** toggled arbitrarily in the app.
- Show a persistent, nonintrusive **“DATA SIMULASI · BUKAN SISTEM RESMI BPJS”** badge on app-level header or page header.
- Use breadcrumbs when a detail page is reached from a list; provide an actual Back action.

### 4.2 Navigation per portal

| Portal | Navigation (P0) | Primary action |
|---|---|---|
| **HR** | Ringkasan → Pekerja → Kontrak → Presensi & Upah → Potongan & Setoran | Tambah/ubah data sumber |
| **Worker** | Ringkasan → Kontrak Saya → Iuran Saya → Laporkan Masalah | Lihat status dan kirim laporan |
| **Auditor** | Ringkasan Risiko → Perusahaan → Detail Risiko (contextual) | Tinjau indikator / prioritas |

Avoid inactive links for unbuilt features. Optional `Riwayat Audit`, export, or notification inbox should not occupy primary navigation before functionality exists.

### 4.3 Responsive behavior

- **≥ 1200px:** full desktop layout with sidebar and 3–4 KPI cards in a row.
- **768–1199px:** sidebar may collapse or remain slim; KPI cards wrap 2 columns; tables remain readable.
- **< 768px:** drawer nav; cards stack; worker task views are first-class; auditor table can become a compact prioritized company card list (or horizontally scroll with a clear affordance).
- Never clip numeric amounts or risk labels; keep actions reachable by keyboard and touch.
- Avoid horizontal overflow of the entire page. A scoped horizontal scroll is acceptable **inside** a wide data table.

---

## 5. Component system and interaction contracts

| Component | Required appearance / behavior | Important states |
|---|---|---|
| `AppShell` | Sidebar, topbar, role context, demo marker | Responsive drawer, active route |
| `PageHeader` | Title, 1-line context, as-of timestamp, relevant main CTA | With/without CTA |
| `MetricCard` | Short label, large tabular number, period/denominator, tooltip when ambiguous | Populated, unavailable |
| `RiskBadge` | Colored background + readable text; score separate or paired | LOW, MEDIUM, HIGH, INSUFFICIENT_DATA |
| `EvidenceCoverage` | COMPLETE/INCOMPLETE label + P1/P2/P3 per-process completeness | Complete, missing source(s) |
| `IndicatorList` | Rule name, trigger state, explanation, evidence source and period | Triggered, clear, not evaluated |
| `DataTable` | Column headings, consistent numeric alignment, row action, sorting/filtering where useful | Loading, empty, error, filtered-empty |
| `StatusBadge` | Semantic label and optional icon | MATCHED, MISMATCH, PENDING, UNVERIFIED |
| `Timeline` | Current/past contract versions or contribution history | Active, past, no history |
| `FormField` | Visible label, optional helper, adjacent error feedback | Default, focus, invalid, disabled |
| `ConfirmationDialog` | Clear consequences, confirm/cancel | Publish contract, reset demo |
| `InlineAlert` | Calm contextual message, clear issue and recovery action | Info, warning, error, success |
| `LoadingSkeleton` | Approximate real content geometry, no jumping layout | Loading |
| `EmptyState` | What is missing + direct next step | No records, no filtered results |
| `PrivacyNotice` | Restriction / report handling in plain language | P1 linked feedback vs P5 anonymous report |

### 5.1 Button hierarchy

1. **Primary:** solid `#173A70`, white text, for one decisive action per screen (e.g. `Terbitkan Versi Kontrak`, `Hitung Ulang Risiko`).
2. **Secondary:** white with navy border/text for navigation or less central action (`Lihat Riwayat`).
3. **Accent:** `#108177` with white text only when a task genuinely benefits from accent separation; avoid multiple primary-looking buttons in one viewport.
4. **Ghost/text:** non-destructive secondary actions.
5. **Destructive:** red only for meaningful destructive operations; do not make ordinary audit actions red.

For every button: hover, active, focus-visible, disabled, processing/loading, and error feedback must be designed. Prevent accidental repeat submissions.

### 5.2 Tables and data displays

- Left-align names/categories, right-align IDR amounts, scores, and numeric differences; align dates/periods consistently.
- Formatting: Indonesian locale (`Rp1.250.000`, `Oktober 2026`, `2026-10` when technical context needs it).
- Show **company name**, **period**, **score & label**, **coverage**, **trigger count**, and **last assessment** in auditor table.
- Do not show raw worker names, contract content, payslips, or P5 report content in auditor views.
- Use sticky table headers only if helpful; subtle row hover; no zebra styling that creates false status grouping.
- Every risk ranking must be a real stored/computed result, not a hard-coded visual sequence.
- On the risk leaderboard, place **complete** assessments in the risk-ranked section and **incomplete evidence** in a separate, visibly labeled queue.

### 5.3 Charts

MVP cap: **one useful chart on the auditor overview, optionally one compact per-company trend**. Charts must answer a real question.

Recommended:
- Auditor overview: stacked company count by **LOW / MEDIUM / HIGH**, with a **separate incomplete category**.
- Company detail (optional): per-period assessment score, with missing-coverage points marked as provisional or segmented, not interpolated as trusted low risk.

- Use flat colors and consistent axes, legends, units and accessible data summaries.
- Chart colors must follow **semantic risk palette**; navy/teal/cyan are for non-risk categorical comparisons.
- Never use a gauge whose color implies a certified probability of fraud.

---

## 6. Page blueprints and screen-specific states

### 6.1 `/login` — Demonstration sign-in

**Purpose:** let judges immediately enter a known role, without pretending to offer production identity verification.

- Two-column desktop hero: narrow brand panel with restrained navy–teal gradient; white sign-in panel.
- App name, 1-line value proposition, prominent `Data Simulasi` notice.
- Seeded HR / Worker / Auditor sign-in options or valid demo credentials supplied by approved demo flow.
- States: ready, authenticating, invalid credentials, unavailable server.
- **Do not** let arbitrary UI role selection bypass server-side authorization.

### 6.2 `/hr` — Company overview

- Heading: `Ringkasan Perusahaan` + synthetic company name.
- Cards: worker count, current contract coverage, payroll periods available, last import/reconciliation state.
- Concise “Next task” section linking to source-record maintenance.
- States: populated, partial import, no workers, request failure.

### 6.3 HR workers and contract versions (P1)

- Worker list with search and scope-safe detail link.
- Detail: current contract card, **version timeline**, effective dates, classification, monetary components, and worker feedback summary if HR is authorized.
- Primary action: `Buat Versi Baru` → editor with visible **effective-from date** → review summary → `Terbitkan Versi`.
- Show **v1, v2, ...** as history; past version is always readable and cannot be silently overwritten.
- Display a change comparison between previous vs proposed contract (changed fields clearly labeled).
- States: draft, validation error, published, date conflict, no contract, history loading.
- **Copy:** `Perubahan akan membuat versi baru. Versi sebelumnya tetap tersimpan.`

### 6.4 HR attendance, payroll, and contributions (P2/P3)

- Period selector is mandatory and remains visible above evidence tables.
- Tabs or sections: `Presensi`, `Komponen Upah`, `Potongan Iuran`, `Konfirmasi Setoran (Simulasi)`.
- Simple form/import panel with row-level errors and a preview before save.
- Wage comparison surface: effective-contract component vs reported payroll component, source/period and reason for review.
- Reconciliation surface: company-period sum of worker **1%** deductions vs **comparable employee-share** mock confirmation; show delta **only when comparable**.
- States: source missing, awaiting confirmation, non-comparable/unverified, matched, mismatch, invalid row/import.
- Never present the company's 5% total deposit as directly comparable to employee 1% deductions.

### 6.5 `/worker` and `/worker/contract` — Worker self-service (P1)

- Worker home: personal contract link, most recent deduction period, honest **company-period** status summary.
- Contract page: active contract, effective date, read-only history, `Ajukan Feedback Kontrak` action.
- P1 feedback form must explicitly say it is a **linked contract clarification**, not the P5 anonymous report channel.
- States: active contract, version history, no contract, draft feedback, submitted, duplicate/validation error.
- No access to other workers' contracts.

### 6.6 `/worker/contributions` — Contribution timeline (P3)

- Chronological period rows/cards, 1% payroll deduction amount, the source of confirmation, and company-period reconciliation status.
- Status vocabulary **must map exactly**:

| Code | Indonesian UI label | Required explanation |
|---|---|---|
| `MATCHED` | `Cocok` | `Potongan dan konfirmasi komponen iuran pekerja cocok pada tingkat perusahaan untuk periode ini.` |
| `MISMATCH` | `Terdapat Selisih` | `Data potongan dan data konfirmasi pembanding tidak sama; memerlukan pemeriksaan lebih lanjut.` |
| `PENDING` | `Menunggu Konfirmasi` | `Konfirmasi belum jatuh pada waktu yang diharapkan untuk skenario ini.` |
| `UNVERIFIED` | `Belum Dapat Diverifikasi` | `Data konfirmasi tidak tersedia atau basis data tidak sebanding.` |

- Every mock confirmation is explicitly tagged `Sumber: Simulasi BPJS` or equivalent.
- **Required disclaimer near result:** `Status ini merupakan pencocokan data pada tingkat perusahaan dan periode; bukan bukti pembayaran individual.`
- Do not display a numeric delta in PENDING/UNVERIFIED.

### 6.7 `/worker/report` — Protected P5 report

- One screen containing purpose, privacy notice, period selector, **controlled category selector**, optional clear contextual description **only if SPEC changes to permit it**; P0 does not use free text or attachments.
- Explain simply: `Laporan disimpan tanpa identitas pelapor dalam data laporan. Informasi agregat digunakan sebagai sinyal awal untuk peninjauan.`
- Do **not** claim absolute anonymity if infrastructure/access logs could still reveal identity.
- Receipt view after submission; no worker identity, raw report text or source token visible to auditor.
- States: ready, invalid, sending, successfully submitted, server error/retry.

### 6.8 `/auditor` — Primary demo screen (P4)

**This is the flagship screen.** First-time judges should understand it within ~10 seconds.

Desktop structure:

```text
Ringkasan Risiko Perusahaan           Periode [2026-XX]   [Hitung Ulang Risiko]
Data Simulasi · Skor = prioritas pemeriksaan, bukan bukti pelanggaran

[Perusahaan Dinilai] [Risiko Tinggi] [Risiko Sedang] [Data Belum Lengkap]

[optional compact distribution chart]

Prioritas Audit                Cari perusahaan...     [Risk] [Period]
Company | Score + label | Coverage | Triggered reasons | As-of | Detail
-----------------------------------------------------------------------
 ... real seeded company records, sorted by policy ...

Antrian Kelengkapan Data
Company | Evidence missing (P1 / P2 / P3) | Provisional observed score | Detail
```

- KPI cards should contain denominator/period and explain what counts as complete.
- Table sorts by **documented** P4 ranking policy, not alphabetically by default.
- The primary visual insight is **“which company requires review and why”**.
- Use clear, stable loading feedback while scoring recomputes; show updated timestamp and outcome or error.
- States: loading, scored, empty, filtered empty, recomputing, recompute failed, incomplete data.
- Never put the incomplete queue under a green LOW heading.

### 6.9 `/auditor/companies/[id]` — Company risk detail

**Header:** company name + period + numerical score + readable risk label + completeness + timestamp + rule version.

**Above fold:** a compact explanation panel naming triggered P1/P2/P3/P5 categories and *why* each affects priority.

**Below fold:** sections for:
- `Ringkasan Indikator`: evidence category, triggered/clear/not evaluated, explanation.
- `Cakupan Data`: P1/P2/P3 completeness, with gaps called out.
- `Riwayat Penilaian`: previous snapshots / recalculation timestamps when available.
- `Tindak Lanjut Auditor`: human review annotation only if implemented (never auto-penalty).

Provide only **aggregate and redacted summaries**. No raw individual worker payslips, detailed contracts, report submitter metadata, or narrative P5 content.

For a company with `INCOMPLETE` coverage:
- Display `Skor indikator yang teramati: N` only as a **provisional** metric.
- Dominant label must be `Data Belum Lengkap`, not `Risiko Rendah`.
- Indicate exactly which source evidence is missing.

---

## 7. Domain-critical copy and visual rules

| UI situation | Do write | Do not write |
|---|---|---|
| Risk interpretation | `Indikasi risiko untuk prioritas pemeriksaan` | `Perusahaan terbukti fraud` |
| Worker feedback (P1) | `Feedback terkait status kontrak` | `Keputusan bahwa kontrak ilegal` |
| Missing BPJS data | `Belum dapat diverifikasi` | `Tidak disetor` |
| Mock confirmation | `Konfirmasi setoran (data simulasi)` | `Terverifikasi resmi BPJS` |
| P3 mismatched amounts | `Ditemukan selisih data yang sebanding` | `Dana digelapkan` |
| Company-period result | `Pencocokan tingkat perusahaan, periode 2026-XX` | `Iuran individu Anda pasti sudah masuk` |
| P5 aggregate below threshold | `Belum memenuhi ambang agregasi` or suppress count | `1 pekerja melapor` |
| Data coverage missing | `Data belum lengkap` + missing fields | `Risiko rendah` |

- Use real timestamps from persisted data or fixtures; do not invent `just updated` behavior.
- Tooltip definitions must avoid legal conclusions.
- The worker's P1 linked feedback and P5 de-identified report use separate navigation labels and privacy notices.
- Avoid unqualified words such as `terbukti`, `fraud`, `aman`, `pasti disetor`, and `resmi terverifikasi` in computed outcomes.

---

## 8. Empty, loading, error, and feedback states

Every critical page must handle:

1. **Initial loading:** skeleton shaped like the final content (especially auditor rankings and contract detail).
2. **Empty dataset:** informative message + an authorized, useful next action.
3. **Filtered empty:** `Tidak ada hasil untuk filter ini`, plus reset filter.
4. **Missing evidence:** explicit `UNVERIFIED` or `INSUFFICIENT_DATA`; never empty-as-zero.
5. **Validation error:** field-specific message next to the source, preserve user input.
6. **Request failed:** what failed and `Coba Lagi` action if retry is safe.
7. **403 forbidden:** `Anda tidak memiliki akses ke halaman ini` + role-appropriate route.
8. **404 not found:** clear missing record + safe return link.
9. **Saved/submitted:** confirmation referencing the completed operation, not a generic successful toast only.
10. **Risk recalculation:** prevent duplicate action, show in-progress status; after completion display the new assessment timestamp / changed indicators.

Badges and notifications are **not** a substitute for visible inline explanation when a risk or reconciliation result is consequential.

---

## 9. Demo storytelling and page choreography

Align to `docs/SPEC.md` §2.3 and `docs/PLAN.md` §8:

| Demo moment | UI emphasis | What a judge should learn |
|---|---|---|
| 1. Auditor overview | Ranked risk list, data completeness, reasons | Which companies deserve verification first |
| 2. HR publishes v2 | Side-by-side changed fields, intact version history | Source history cannot be overwritten silently |
| 3. Wage/reconciliation evidence | Relevant period, documented source basis, status | Indicators come from a real comparison, not a static chart |
| 4. Recompute P4 | Loading → new timestamp → transparent score/rank update | Records and scores are connected end-to-end |
| 5. Worker portal | Personal contract and contribution timeline | Worker can understand their own records |
| 6. P5 report | Protected categorical form → receipt; auditor aggregate only | Worker contribution without exposing reporter identity |

**Golden synthetic examples from existing docs:** Company A `60/HIGH`, B `30/MEDIUM`, C `INSUFFICIENT_DATA` with provisional score only, D `0/LOW`, E a P5 thresholded count of 3 contributing 10 points when coverage is complete. The UI must render these results correctly; do not hardcode them outside seed/demo fixture policy.

If time is short, spend polish effort in this order: **auditor risk overview → company explanation → HR changed-contract path → worker contribution states → P5 receipt → optional charts/motion**.

---

## 10. Accessibility and quality gates

### Must-pass interaction checks

- [ ] All text-based status labels are readable **without relying on color**.
- [ ] Critical foreground/background pairings meet WCAG AA text contrast (normal 4.5:1; large 3:1).
- [ ] Focus is visible; keyboard users can navigate sidebar, tables, buttons, forms, dialogs, and any menu.
- [ ] Forms use persistent visible labels, clear errors, sensible `required` indicators, and validation feedback.
- [ ] Touch targets are approximately 44×44px where touch interaction is expected.
- [ ] Loading states do not silently mask errors; every API failure can be understood.
- [ ] Numeric values have units/periods and IDR formatting; missing is not shown as Rp0 or risk 0.
- [ ] Risk figures include labels and rationale, not just numbers and charts.
- [ ] The auditor sees **no worker-level sensitive raw data**; P5 reporting is not deanonymized in UI.
- [ ] All mock-BPJS content is visibly identified as simulated.
- [ ] Primary routes are usable on 1440px and ~390px viewports without page-wide horizontal overflow.
- [ ] Every major screen has a polished loading, empty, success, and failure path.
- [ ] The 3–5-minute scripted demo can be performed from a clean seed/reset without devtools or manual DB edits.

### Visual QA checklist

- [ ] Palette tokens are used consistently; no arbitrary new blue/green hex values sprinkled throughout pages.
- [ ] A clear typographic hierarchy and consistent spacing scale exist across all roles.
- [ ] Data tables are readable and align currency, percentages and period values consistently.
- [ ] The same status has the same label and color in every portal.
- [ ] Company detail visibly traces score to evidence source and assessment date.
- [ ] Auditor's incomplete-data cases cannot be visually mistaken for clean low-risk companies.
- [ ] Important actions have disabled/loading/validation states and meaningful confirmation copy.
- [ ] Gradients are limited to brand/display surfaces and never harm data readability.
- [ ] No unimplemented navigation item appears active or actionable.

---

## 11. UI implementation guidance for coding agents (without adding app code)

1. Read `docs/SPEC.md`, `docs/PLAN.md`, `AGENTS.md`, then `DESIGN.md` before working on UI; use domain/security requirements if there is conflict.
2. Start with semantic **design tokens** and reusable `AppShell`, `Button`, `Badge`, `Card`, `DataTable`, `FormField`, `StatusAlert` and `PageHeader` primitives. **Do not** create a large design-system package or add unnecessary component libraries.
3. Implement the auditor overview + risk detail early using the **actual typed API contracts**, even when synthetic fixtures are initially returned by a safe mock adapter.
4. Make all domain states first-class display variants (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT_DATA`, `MATCHED`, `MISMATCH`, `PENDING`, `UNVERIFIED`). No status inference in UI from null amounts or arbitrary styling heuristics.
5. Reuse the same tokens and components in HR/Worker layouts, while optimizing their information density for their jobs to be done.
6. Avoid skeleton features such as dead export menus, nonfunctional search boxes, mock charts detached from stored data, fake "AI predictions", and unfinished modals.
7. Include screenshot-based review at desktop and mobile widths and a keyboard/contrast pass in milestone M5. If unavailable, report the gap rather than claiming the checks were performed.
8. Document deliberate deviations from `DESIGN.md` and justify them in terms of accessibility, requirements, or demo effectiveness.

### Out of scope for this design specification

Production BPJS branding/endorsement, actual health/worker data, legal fraud determinations, multilingual UX, complex visualization suites, native mobile applications, bespoke animation systems, and full enterprise design-system governance.

---

## 12. Source notes and change policy

- The **visual inspiration** comes from the uploaded 12-page Sambak/Healthkaton PDF, especially: slide 2 (blue headings, mint highlights, risk/problem panels), slide 3 (JagaJKN navy–cyan–teal wordmark, teal tables, navy bars), slide 4 (navy/teal pipeline), slide 8 (navy–teal roadmap), and slide 10 (trust, privacy, human review positioning).
- The slide deck does **not** provide an official web UI component library, exact font family declaration, responsive grid specification, interaction-state taxonomy, or WCAG design standard. These sections are implementation-oriented recommendations, not quotations from the deck.
- **Visual changes** can be made by editing `DESIGN.md`; **domain/functional changes** require explicit synchronization with `docs/SPEC.md` and the affected tests in `docs/PLAN.md`.
- Before treating the design as final, obtain team confirmation of the logo/brand asset usage, preferred font, and whether the stakeholder expects a dark sidebar versus a white institutional sidebar.
