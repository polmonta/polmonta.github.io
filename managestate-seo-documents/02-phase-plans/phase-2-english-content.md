# SEO Phase 2: English Acquisition Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Publish fifteen distinct, internally linked English acquisition pages, each owning exactly one primary query, that satisfy commercial landlord search intents and drive measurable App Store visits.

**Architecture:** Astro content collections hold validated page metadata, primary queries, summaries, FAQs, related links, and editorial status. Shared static route templates render features, audiences, comparisons, guides, and tools in the existing visual language; only the ROI calculator hydrates as a React island.

**Tech Stack:** Astro content collections, Markdown/MDX, React 19.2.0, Vitest 4.1.10, Node.js 22.13.0, static CSV assets, Search Console.

## Global Constraints

- Phase 1b exit gate must pass before starting.
- Publish exactly the fifteen routes in design §8.3, in addition to `/`.
- **One page owns one primary query.** `primaryQuery` uniqueness across published entries is release-blocking, and a guide's primary query must begin with `how to`, `what`, `which`, `when`, `do`, or `does`.
- Every page answers its primary query in the opening paragraph and shows a three-to-five-sentence quotable summary.
- Every page has distinct intent, body copy, title, description, H1, examples, and internal-link purpose.
- Acquisition pages use **only validator-approved evidence**. The design §15.3 homepage retention exception does not extend here: no invented testimonials, no "trusted by" phrasing, no "free to start" or card-requirement claims, no adoption numbers.
- No `FAQPage` structured data anywhere (design A9). Visible FAQs are still required where source questions exist.
- No `Review` or `aggregateRating` markup on any page.
- No city or country pages, no fake comparisons, no keyword-swapped templates.
- Every page ends with a working `Download ManageState for iPhone` CTA emitting `app_store_click`.
- New pages reuse the existing Tailwind tokens, type scale, `Button` component, and section rhythm. They do not introduce a new visual language, and they do not modify the homepage.
- Editorial review is mandatory before `status: published`.

---

### Task 1: Create the acquisition content schema and route templates

**Files:**
- Create: `source/src/content.config.js`
- Create: `source/src/layouts/AcquisitionLayout.astro`
- Create: `source/src/components/content/SummaryBlock.astro`
- Create: `source/src/components/content/Breadcrumbs.astro`
- Create: `source/src/components/content/RelatedContent.astro`
- Create: `source/src/components/content/VisibleFaq.astro`
- Create: `source/src/components/AppStoreLink.astro`
- Create: `source/src/pages/features/[slug].astro`
- Create: `source/src/pages/for/[slug].astro`
- Create: `source/src/pages/compare/[slug].astro`
- Create: `source/src/pages/guides/[slug].astro`
- Create: `source/src/pages/tools/[slug].astro`
- Create: `source/tests/content/content-contract.test.mjs`

**Interfaces:**
- Consumes: collection entries with `{ title, description, h1, primaryQuery, queryType, summary, openingAnswer, intent, cluster, campaign, status, updatedAt, translationKey, related, faqs }`.
- Produces: static routes and `getAcquisitionPaths(collectionName)`. Only `status: published` entries enter production routes or the sitemap.

- [ ] **Step 1: Write a failing content-contract test**

Assert that: allowed collections are `features`, `audiences`, `comparisons`, `guides`, `tools`;
language is `en`; summary length is 3–5; status is `draft|review|published`; related links are
absolute site paths; campaign matches `/^website-(features|audiences|comparisons|guides|tools)$/`
and matches the entry's cluster; `primaryQuery` is unique across every entry; a `guides` entry's
`primaryQuery` matches `/^(how to|what|which|when|do|does)\b/i`; and every published entry has at
least one related link plus a non-empty opening answer.

- [ ] **Step 2: Run the test and verify failure**

Run: `cd source && npx vitest run tests/content/content-contract.test.mjs`
Expected: FAIL — the content configuration does not exist.

- [ ] **Step 3: Implement the collection schema**

Use `defineCollection`, `z`, and the Astro `glob` loader, with one directory per collection under
`src/content/`. Include `translationKey` now, equal to a stable English slug, so Phase 4 can add
localizations without changing identifiers.

```js
const base = z.object({
  title: z.string().min(30).max(70),
  description: z.string().min(110).max(165),
  h1: z.string().min(10).max(90),
  primaryQuery: z.string().min(10).max(80),
  queryType: z.enum(['commercial-investigation', 'informational', 'transactional']),
  summary: z.array(z.string().min(20)).min(3).max(5),
  openingAnswer: z.string().min(80),
  intent: z.string().min(10),
  cluster: z.enum(['features', 'audiences', 'comparisons', 'guides', 'tools']),
  campaign: z.enum(['website-features', 'website-audiences', 'website-comparisons', 'website-guides', 'website-tools']),
  lang: z.literal('en'),
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'review', 'published']),
  updatedAt: z.coerce.date(),
  related: z.array(z.string().startsWith('/')).min(1),
  faqs: z.array(z.object({ question: z.string(), answer: z.string(), sourceRecord: z.string() })).default([])
});
```

`faqs[].sourceRecord` is mandatory: a visible FAQ must cite the verified query, review, or support
question it came from. Fewer FAQs is correct when fewer sources exist.

- [ ] **Step 4: Implement shared static rendering**

`AcquisitionLayout` renders, inside `BaseLayout`: the existing React `Navbar` island, breadcrumbs,
H1, opening answer, `SummaryBlock`, the body slot, visible FAQs, `RelatedContent`, an
`AppStoreLink`, and the existing React `Footer` island. Reusing the homepage navbar and footer is
what keeps content pages visually consistent without re-authoring chrome.

`AppStoreLink.astro` calls `buildAppStoreUrl(campaign)` from Phase 1a and renders a normal
external anchor with the same `data-*` attributes, using the existing `Button` styling. Its default
copy is `Download ManageState for iPhone`.

Route templates call `getCollection`, filter `status === 'published'`, and use `render(entry)`. No
route performs client-side data fetching.

- [ ] **Step 5: Run schema tests and an empty build**

Run: `cd source && npx vitest run tests/content/content-contract.test.mjs && npm run build`
Expected: PASS with no acquisition entries yet and no malformed routes. The homepage visual diff
must still pass — `npm run check:visual`.

- [ ] **Step 6: Commit the content platform**

```bash
git add source/src/content.config.js source/src/layouts/AcquisitionLayout.astro source/src/components/content source/src/components/AppStoreLink.astro source/src/pages/features source/src/pages/for source/src/pages/compare source/src/pages/guides source/src/pages/tools source/tests/content/content-contract.test.mjs
git commit -m "feat(seo): add the validated acquisition content platform"
```

### Task 2: Publish the feature, audience, and comparison pages

**Files:**
- Create: `source/src/content/features/{financial-control,document-management,property-performance,tax-export}.md`
- Create: `source/src/content/audiences/{small-landlords,first-time-landlords,growing-property-investors}.md`
- Create: `source/src/content/comparisons/landlord-app-vs-spreadsheets.md`
- Create: `source/tests/content/core-pages.test.mjs`

**Interfaces:**
- Consumes: validator-approved Phase 0 product claims and, if any exist, approved screenshots.
- Produces: eight published static routes across campaigns `website-features`, `website-audiences`, `website-comparisons`.

- [ ] **Step 1: Add a failing eight-route inventory test**

Assert the exact canonical paths, unique metadata, unique primary queries, the absence of
`trusted by`, `thousands`, `bank-grade`, `free trial` and `no credit card` on these routes, no
competitor claim without a cited source and date, and at least two cross-cluster internal links
per page.

- [ ] **Step 2: Create the four feature pages**

| Route | Primary query | Title | H1 | Required sections |
| --- | --- | --- | --- | --- |
| `/features/financial-control/` | rental income and expense tracking app | `Rental Income and Expense Tracking App \| ManageState` | `Keep rental income and expenses under control` | entry workflow; categorization; portfolio view; spreadsheet pain; CTA |
| `/features/document-management/` | rental property document storage app | `Rental Property Document Storage App \| ManageState` | `Keep documents with the property they belong to` | document types; retrieval workflow; privacy link; CTA |
| `/features/property-performance/` | rental property performance tracking app | `Rental Property Performance Tracking \| ManageState` | `See how each rental property performs each month` | what the app calculates; per-property comparison; link to the ROI calculator; what it does not do; CTA |
| `/features/tax-export/` | landlord tax record app | `Landlord Tax Record App for Rental Data \| ManageState` | `Organize rental records before tax time` | recorded data; verified export format; accountant handoff; non-advice disclaimer; CTA |

Evidence boundaries, from the Phase 0 register:

- `/features/property-performance/` may state only that ManageState calculates monthly income, expenses, and net income per property. It must **not** claim in-app ROI, gross or net yield, or appreciation. It links to `/tools/rental-property-roi-calculator/` for that math and says plainly that the calculator is a website tool. This route replaces revision 1's `/features/profitability-roi/` for exactly this reason (design A6).
- `/features/tax-export/` must name the **verified** export format. The register verifies an XLSX workbook export; do not write "CSV" or "PDF" unless a claim record verifies it. State that ManageState does not provide tax advice.
- `/features/document-management/` may state upload and document-metadata storage. It must **not** claim security levels, encryption, tenant records, or maintenance logs unless a verified claim covers them.
- Use screenshots only where an approved `screenshots.json` record exists. Where none does, use a worked example, a labelled table, or a short numbered workflow instead. Do not reuse homepage marketing imagery as evidence.

Each file includes a distinct 3–5 sentence summary and one concrete workflow example.

- [ ] **Step 3: Create the three audience pages**

| Route | Primary query | Title | H1 | Required sections |
| --- | --- | --- | --- | --- |
| `/for/small-landlords/` | property management app for 1-5 properties | `Property Management App for 1-5 Properties \| ManageState` | `Property management for landlords with 1–5 properties` | audience problems; monthly workflow; feature fit; when enterprise software is excessive; CTA |
| `/for/first-time-landlords/` | property management app for first-time landlords | `Property Management App for First-Time Landlords` | `Start your first rental with organized records` | setup checklist; recording habit; documents; performance; CTA |
| `/for/growing-property-investors/` | rental portfolio app for multiple properties | `Rental Portfolio App for Multiple Properties` | `Move beyond one spreadsheet as your portfolio grows` | 5–25 property context; consistent records; per-property performance; honest limits; CTA |

`/for/small-landlords/` targets the property-count qualifier, not the head term. The head term
`property management app for landlords` belongs to `/`. Do not reuse the homepage title.

Do not claim ManageState replaces accountants, banks, legal advisers, or enterprise property
managers.

- [ ] **Step 4: Create the comparison page**

`/compare/landlord-app-vs-spreadsheets/`, primary query `landlord app instead of Excel`, title
`Landlord App Instead of Excel: An Honest Comparison`. Compare setup, mobile entry, document
association, calculations, exports, and maintenance. Include a section titled
`When a spreadsheet may still be enough`. Do not declare ManageState universally superior. Any
factual statement about spreadsheet software records its date.

- [ ] **Step 5: Build and test the first batch**

Run: `cd source && npm run build && npx vitest run tests/content/core-pages.test.mjs && npm run check:dist && npm run check:visual`
Expected: eight routes exist, metadata and primary queries are unique, internal links resolve, and
the homepage is unchanged.

- [ ] **Step 6: Commit the first content batch**

```bash
git add source/src/content/features source/src/content/audiences source/src/content/comparisons source/tests/content/core-pages.test.mjs
git commit -m "feat(seo): publish core landlord acquisition pages"
```

### Task 3: Publish five informational guides

**Files:**
- Create: `source/src/content/guides/choosing-a-property-management-app.md`
- Create: `source/src/content/guides/tracking-landlord-expenses.md`
- Create: `source/src/content/guides/monthly-rental-finance-routine.md`
- Create: `source/src/content/guides/organizing-rental-property-documents.md`
- Create: `source/src/content/guides/landlord-tax-records.md`
- Create: `source/tests/content/guides.test.mjs`

**Interfaces:**
- Consumes: verified Search Console questions when available; otherwise factual App Store or support questions recorded in the evidence register.
- Produces: five `Article`-eligible guides with visible source-grounded FAQs and deep links to their matching features and tools.

- [ ] **Step 1: Write a failing guide-quality test**

For each guide assert: `queryType === 'informational'`; the primary query begins with a question
word or `how to`; the opening answer is at least 80 characters; 3–5 summary sentences; a visible
updated date; at least three meaningful H2 sections; at least two related links; exactly one App
Store CTA; every FAQ carries a `sourceRecord`; and **no two body files exceed 35 % normalized
similarity using 3-word shingles**.

The revision 1 threshold of 70 % on 5-word shingles was unreachable in practice and would never
have fired. 35 % on 3-word shingles is the level that actually catches templated prose.

- [ ] **Step 2: Write the five guide briefs**

| Route | Primary query | Title | Mandatory sections |
| --- | --- | --- | --- |
| `/guides/choosing-a-property-management-app/` | how to choose a property management app | `How to Choose a Property Management App for Landlords` | selection criteria; small-landlord workflow; essential vs enterprise features; iPhone considerations; decision checklist |
| `/guides/tracking-landlord-expenses/` | how to track landlord expenses | `How to Track Landlord Expenses Without a Spreadsheet` | what to record; a repeatable entry habit; categories without tax advice; receipt association; monthly review |
| `/guides/monthly-rental-finance-routine/` | how to track rental income and expenses monthly | `How to Track Rental Income and Expenses Monthly` | the monthly routine; income reconciliation; per-property records; cash-flow review; common spreadsheet errors |
| `/guides/organizing-rental-property-documents/` | how to organize rental property documents | `How to Organize Rental Property Documents` | document inventory; naming and retrieval; renewal workflow only if verified; privacy practices; maintenance schedule |
| `/guides/landlord-tax-records/` | what records do landlords need for taxes | `What Records Do Landlords Need for Taxes?` | year-round organization; record completeness; accountant handoff as verified; jurisdiction warning; questions for an accountant |

Slugs are informational, not commercial. A guide slug must never repeat a feature or audience
page's primary query — that is how revision 1's inventory ended up cannibalizing itself.

Each guide deep-links to its matching feature page and at least one tool, and each feature page
links back to its guide.

- [ ] **Step 3: Write query-first copy and visible FAQs**

The first paragraph directly answers the primary query. FAQ questions are copied from a verified
source record and cited in `sourceRecord`. If fewer verified questions exist, publish fewer FAQs
rather than inventing them.

Tax and legal content stays organizational, never advisory. Cite authoritative sources, date every
date-sensitive claim, and state that ManageState does not provide tax advice.

- [ ] **Step 4: Add Article schema only**

Emit `Article` with a visible updated date and an organization author. Emit `BreadcrumbList`.
**Do not emit `FAQPage`** — visible FAQs remain, the markup does not (design A9).

- [ ] **Step 5: Build and run guide-quality checks**

Run: `cd source && npm run build && npx vitest run tests/content/guides.test.mjs && npm run check:dist`
Expected: all five routes pass uniqueness, similarity, link, and schema checks.

- [ ] **Step 6: Commit the guide batch**

```bash
git add source/src/content/guides source/tests/content/guides.test.mjs source/src/lib/schema.js source/src/layouts/AcquisitionLayout.astro
git commit -m "feat(seo): publish landlord workflow guides"
```

### Task 4: Build the ROI calculator and the expense template

**Files:**
- Create: `source/src/lib/roi.js`
- Create: `source/src/components/tools/RoiCalculator.jsx`
- Create: `source/src/content/tools/rental-property-roi-calculator.mdx`
- Create: `source/src/content/tools/rental-income-expense-template.md`
- Create: `source/public/downloads/rental-income-expense-template.csv`
- Create: `source/tests/tools/roi.test.mjs`
- Create: `source/tests/tools/template.test.mjs`

**Interfaces:**
- Consumes: annual rent, annual operating expenses, purchase price, and cash invested as non-negative numbers.
- Produces: `calculatePropertyRoi(input): { netIncome, grossYieldPct, netYieldPct, cashOnCashPct }` and a static CSV template.

- [ ] **Step 1: Write failing ROI calculation tests**

```js
import { expect, it } from 'vitest';
import { calculatePropertyRoi } from '../../src/lib/roi.js';

it('calculates standard rental metrics', () => {
  expect(calculatePropertyRoi({ annualRent: 24000, annualExpenses: 6000, purchasePrice: 300000, cashInvested: 90000 })).toEqual({
    netIncome: 18000,
    grossYieldPct: 8,
    netYieldPct: 6,
    cashOnCashPct: 20
  });
});

it('rejects zero denominators and negative inputs', () => {
  expect(() => calculatePropertyRoi({ annualRent: 1, annualExpenses: -1, purchasePrice: 0, cashInvested: 0 })).toThrow();
});
```

- [ ] **Step 2: Implement pure calculations and the React island**

Round percentages to two decimals. Label results as estimates. Exclude financing, taxes,
appreciation, vacancy, and jurisdiction-specific assumptions unless the user enters them as
operating expenses. Hydrate only the calculator, with `client:visible`. Build the form from the
existing `Button` component and Tailwind tokens.

State on the page that the calculator is a website tool and that the iPhone app does not calculate
ROI. This keeps the tool page and `/features/property-performance/` mutually consistent.

- [ ] **Step 3: Create the exact CSV template**

```csv
property,date,type,category,description,amount,currency,document_reference
Example Apartment,2026-01-05,expense,maintenance,Example plumbing repair,125.00,USD,receipt-001
```

Explain each field, tell users to delete the example row, and state that categories are
organizational rather than tax advice. The download is a static asset; GitHub Pages serves it
directly.

- [ ] **Step 4: Add tool metadata and internal links**

The calculator links to `/features/property-performance/` and `/for/small-landlords/`. The template
links to `/features/financial-control/`, `/guides/tracking-landlord-expenses/`, and
`/guides/landlord-tax-records/`. Both use campaign `website-tools` and cluster `tools`, with
`queryType: 'transactional'`.

- [ ] **Step 5: Test, build, and keyboard-check the tools**

Run: `cd source && npx vitest run tests/tools && npm run build && npm run check:dist`
Expected: calculations and the CSV contract PASS; every calculator input has a label, is reachable
by keyboard, and announces its result.

- [ ] **Step 6: Commit the tools**

```bash
git add source/src/lib/roi.js source/src/components/tools/RoiCalculator.jsx source/src/content/tools source/public/downloads/rental-income-expense-template.csv source/tests/tools
git commit -m "feat(seo): add landlord ROI and expense tools"
```

### Task 5: Enforce the inventory and launch in batches

**Files:**
- Create: `source/scripts/seo/validate-content.mjs`
- Create: `source/tests/content/inventory.test.mjs`
- Create: `managestate-seo-documents/04-releases/content-inventory.md`
- Create: `managestate-seo-documents/04-releases/phase-2-launch-log.md`
- Modify: `source/package.json`, `source/scripts/seo/validate-dist.mjs`

**Interfaces:**
- Consumes: all content collections and built routes.
- Produces: release-blocking content validation and an indexing log for three launch batches.

- [ ] **Step 1: Define the exact expected route set in a failing test**

Hard-code the fifteen approved paths from design §8.3 and assert exact set equality against
published acquisition routes. Also assert: no route contains a city or country slug; every page
has at least one inbound link from another acquisition page; every primary query is unique; and no
guide slug equals another page's primary query in slug form.

- [ ] **Step 2: Implement content validation**

`validate-content.mjs` validates frontmatter, duplicate primary queries, duplicate intent,
duplicate metadata, prohibited unsupported phrases, orphan pages, broken related links, missing
CTA data attributes, summary length, and FAQ source records. Add `check:content` and place it
before the build in `verify`.

- [ ] **Step 3: Document inventory ownership**

For each of the fifteen routes record owner, primary query, query type, cluster, intent, evidence
sources, status, publication batch, and review date. Values must match committed content. Do not
enter projected rankings or traffic.

- [ ] **Step 4: Release three controlled batches**

- **Batch A** — four feature pages plus `/for/small-landlords/`.
- **Batch B** — the two remaining audience pages, the comparison, and the five guides.
- **Batch C** — the two tools.

After each deployment confirm HTTP 200, the self-canonical, sitemap presence, internal links, one
`app_store_click` event with the correct cluster and campaign, and Search Console URL Inspection.
Record actual deployment and index-request dates. Leave at least seven days between batches so
indexing behaviour is attributable to a batch.

- [ ] **Step 5: Run final Phase 2 verification**

Run: `cd source && npm run verify && npm run check:visual`
Expected: exactly fifteen acquisition routes, no orphans, no duplicate metadata, no duplicate
primary queries, all static checks PASS, and the homepage still pixel-matches its baseline.

- [ ] **Step 6: Commit inventory and release tooling**

```bash
git add source/scripts/seo/validate-content.mjs source/scripts/seo/validate-dist.mjs source/tests/content/inventory.test.mjs source/package.json managestate-seo-documents/04-releases/content-inventory.md managestate-seo-documents/04-releases/phase-2-launch-log.md
git commit -m "test(seo): enforce the English acquisition inventory"
```

## Phase 2 Exit Gate

Proceed only when all fifteen routes are live, canonical, in the sitemap, internally linked,
content-validated, editorially reviewed, and submitted in Search Console. Verify the ROI
calculator and the CSV download, inspect every CTA and event payload, confirm no page carries
`FAQPage`, `Review`, or `aggregateRating` markup, confirm the homepage visual diff still passes,
and record deployment and indexing status without claiming rankings that have not occurred.
