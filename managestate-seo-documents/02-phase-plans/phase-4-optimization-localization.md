# SEO Phase 4: Optimization and Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Use the first 90 days of observed English performance to improve intent alignment, then localize one evidence-selected five-page cohort into Spanish and afterwards Catalan — but only once the data floor is met.

**Architecture:** A committed aggregate metrics file drives deterministic page decisions without exposing raw analytics. A translation manifest maps stable `translationKey` values across languages. Astro generates prefixed localized routes with reciprocal canonical and `hreflang` annotations, while human review controls linguistic and factual quality.

**Tech Stack:** Astro content collections, Node.js 22.13.0, Vitest 4.1.10, `@playwright/test`, Search Console, Plausible, App Store Connect, Markdown/MDX.

## Global Constraints

- **The design §11.4 data floor is evaluated before anything else in this phase.** Elapsed time alone does not authorize localization.
- Optimization uses observed Search Console, Plausible, and App Store data. It must never invent traffic, ranking, or download estimates.
- English remains canonical for English pages. Spanish uses `/es/`; Catalan uses `/ca/`.
- Localize the homepage plus exactly four acquisition pages in the first cohort.
- Select the four deterministically by attributed App Store clicks, then organic clicks, then impressions, with canonical path as the tie-breaker.
- Spanish receives human editorial review before Catalan work begins; Catalan receives its own independent review.
- Localize meaning, terminology, screenshots, examples, and CTAs. Never ship raw machine translation.
- No country, legal, or tax claims unless authoritative sources and review dates are recorded.
- Each localized page must have reciprocal `hreflang`, a self-canonical URL, and matching visible content.
- **The English homepage must remain pixel-identical throughout this phase.** Any refactor needed for localization is behaviour-preserving, proven by the existing visual gate.

---

### Task 1: Evaluate the data floor, then aggregate the scorecard

**Files:**
- Create: `source/seo-ops/metrics/english-90-day.json`
- Create: `source/seo-ops/localization/translation-set.json`
- Create: `source/scripts/seo/select-localization-set.mjs`
- Create: `source/tests/seo/select-localization-set.test.mjs`
- Create: `managestate-seo-documents/05-reviews/english-90-day-review.md`

**Interfaces:**
- Consumes: aggregate records `{ path, impressions, organicClicks, appStoreClicks, engagedVisits, indexed }` for the fifteen English routes.
- Produces: `{ generatedAt, sourceWindow, routes: ['/', …four paths] }` with deterministic ordering, or an explicit deferral.

- [ ] **Step 1: Write failing floor and selection tests**

```js
import { expect, it } from 'vitest';
import { evaluateDataFloor, selectLocalizationSet } from '../../scripts/seo/select-localization-set.mjs';

it('defers localization when the data floor is not met', () => {
  const rows = Array.from({ length: 15 }, (_, i) => ({
    path: `/guides/g${i}/`, impressions: 40, organicClicks: 1, appStoreClicks: 0, indexed: true
  }));
  const floor = evaluateDataFloor(rows, { daysElapsed: 95 });
  expect(floor.met).toBe(false);
  expect(floor.failed).toContain('organicClicks');
});

it('always selects home plus four conversion-first pages', () => {
  const rows = [
    { path: '/guides/a/', appStoreClicks: 2, organicClicks: 3, impressions: 40, indexed: true },
    { path: '/guides/b/', appStoreClicks: 0, organicClicks: 30, impressions: 300, indexed: true },
    { path: '/guides/c/', appStoreClicks: 1, organicClicks: 1, impressions: 20, indexed: true },
    { path: '/guides/d/', appStoreClicks: 0, organicClicks: 20, impressions: 200, indexed: true },
    { path: '/guides/e/', appStoreClicks: 0, organicClicks: 10, impressions: 100, indexed: true }
  ];
  expect(selectLocalizationSet(rows).routes).toEqual(['/', '/guides/a/', '/guides/c/', '/guides/b/', '/guides/d/']);
});

it('refuses to select from unindexed pages', () => {
  const rows = [{ path: '/guides/a/', appStoreClicks: 5, organicClicks: 5, impressions: 50, indexed: false }];
  expect(() => selectLocalizationSet(rows)).toThrow(/indexed/);
});
```

- [ ] **Step 2: Implement the data floor**

`evaluateDataFloor` returns `{ met, checks, failed }` and requires **all** of:

1. At least 90 days since the final Phase 2 batch.
2. At least four acquisition pages confirmed indexed.
3. At least **50 organic clicks** in aggregate across acquisition pages in the window.
4. At least one attributed App Store click, or a written owner override recorded in the review.

If the floor is not met, stop this phase after Task 2. Record the deferral, re-check after 30 days,
and do not run the selector. A deterministic selector fed near-zero data resolves on its
alphabetical tie-breaker and produces arbitrary, not evidence-based, choices.

- [ ] **Step 3: Export and aggregate actual metrics**

Keep raw exports in `source/seo-ops/private/`. Commit only path-level totals for the common 90-day
window. Use integer zero for an observed zero; add `dataAvailable: false` only when a named system
lacked access. Include no visitor identifiers and no query rows that could reveal customer data.

- [ ] **Step 4: Implement deterministic selection**

Filter to indexed acquisition pages, sort descending by `appStoreClicks`, then `organicClicks`, then
`impressions`, then ascending canonical path, take four, and prepend `/`. Throw when fewer than four
indexed acquisition pages exist. Never fill the cohort with unindexed pages.

- [ ] **Step 5: Write the English review**

Classify every page as `expand`, `snippet-test`, `maintain`, `consolidation-review`, or
`technical-fix`. Pages with conversion signals are never consolidated solely for low impressions.
Pages with zero impressions require an indexability and intent review before any content decision.
Record the data-floor result explicitly, met or not.

- [ ] **Step 6: Test and commit**

Run: `cd source && npx vitest run tests/seo/select-localization-set.test.mjs && node scripts/seo/select-localization-set.mjs`
Expected: either exactly five unique routes beginning with `/`, or a clear deferral message and a
non-zero exit.

```bash
git add source/seo-ops/metrics/english-90-day.json source/seo-ops/localization/translation-set.json source/scripts/seo/select-localization-set.mjs source/tests/seo/select-localization-set.test.mjs managestate-seo-documents/05-reviews/english-90-day-review.md
git commit -m "docs(seo): evaluate the data floor and select the localization cohort"
```

### Task 2: Apply evidence-based English optimizations

**Files:**
- Modify: English content files classified in the 90-day review
- Create: `managestate-seo-documents/05-reviews/english-snippet-tests.md`
- Modify: `managestate-seo-documents/04-releases/content-inventory.md`
- Modify: `source/tests/content/inventory.test.mjs`

**Interfaces:**
- Consumes: explicit classifications and Search Console queries from the 90-day review.
- Produces: versioned title, description, copy, and internal-link changes with a measurable rationale.

This task runs whether or not the data floor was met. Optimization needs far less data than
localization.

- [ ] **Step 1: Add tests for preserved intent and route identity**

Keep the exact fifteen-route set, translation keys, primary queries, clusters, and campaign names
unchanged. Assert that title and description changes remain unique and inside the existing length
contracts.

- [ ] **Step 2: Fix technical and indexing issues first**

For every `technical-fix`, reproduce the canonical, sitemap, robots, response, orphan-link, or
rendering failure; add a regression assertion to `validate-dist.mjs`; then make the minimum fix.
Never rewrite content to solve a crawl defect.

- [ ] **Step 3: Run controlled snippet tests**

For each `snippet-test` record the old title and description, the observed query pattern, the new
title and description, the change date, and an evaluation date at least 28 days later. Change title
and description only — do not simultaneously rewrite the body.

- [ ] **Step 4: Expand pages with conversion or strong query evidence**

Add only sections that answer observed queries or remove conversion friction. Cite authoritative
sources for date-sensitive claims. Preserve the opening-answer and summary contract.

- [ ] **Step 5: Review overlap before any consolidation**

A `consolidation-review` needs a written intent comparison, a selected survivor, an internal-link
update list, and a redirect-stub mapping. Do not remove a page in this task unless the review proves
overlapping intent and the stub test is added. Remember that GitHub Pages cannot issue a 301; a
removed page gets a `noindex` stub, not a deletion.

- [ ] **Step 6: Verify and commit each experiment independently**

Run: `cd source && npm run verify && npm run check:visual`
Expected: PASS. Use one commit per snippet test, technical fix, expansion, or approved
consolidation so results stay attributable.

### Task 3: Confirm localization prerequisites

**Files:**
- Create: `managestate-seo-documents/05-reviews/localization-readiness.md`

- [ ] **Step 1: Check the product side before the site side**

Record whether the iPhone app UI and the App Store listing are localized into Spanish. Sending
Spanish organic traffic to an English-only listing converts poorly no matter how good the page is.
If neither is localized, record it as the dominant conversion risk and recommend localizing the App
Store listing before or alongside the site.

- [ ] **Step 2: Decide the homepage localization approach**

Localizing `/` requires the frozen homepage components to render non-English copy. Two options,
recorded with an owner decision:

- **Default — extract and parameterize.** Move the English strings out of the six components into `source/src/data/i18n/en.json`, and have each component accept a `copy` prop defaulting to the English dictionary. This is a behaviour-preserving refactor whose acceptance criterion is that the English homepage visual diff still passes at ≤ 0.5 % and that `component-integrity.manifest.json` is updated deliberately in the same commit.
- **Fallback — defer the homepage.** Localize five acquisition pages instead of the homepage plus four, and leave `/` English-only. Choose this if the owner prefers the homepage components untouched.

- [ ] **Step 3: Add localized visual baselines**

Whichever option is chosen, `/es/` and `/ca/` homepages get their own committed screenshot
baselines. They cannot be compared against the English baseline, because the copy differs by
design. The English baselines are never regenerated in this phase.

- [ ] **Step 4: Commit the readiness record**

```bash
git add managestate-seo-documents/05-reviews/localization-readiness.md
git commit -m "docs(seo): record localization readiness and homepage decision"
```

### Task 4: Add multilingual routing and reciprocal `hreflang`

**Files:**
- Modify: `source/src/content.config.js`, `source/src/lib/seo.js`
- Create: `source/src/lib/i18n.js`
- Create: `source/src/pages/[lang]/index.astro`
- Create: `source/src/pages/[lang]/features/[slug].astro`
- Create: `source/src/pages/[lang]/for/[slug].astro`
- Create: `source/src/pages/[lang]/compare/[slug].astro`
- Create: `source/src/pages/[lang]/guides/[slug].astro`
- Create: `source/src/pages/[lang]/tools/[slug].astro`
- Create: `source/tests/seo/i18n.test.mjs`

**Interfaces:**
- Consumes: entries with `lang: en|es|ca` and a stable `translationKey`.
- Produces: `localizedPath(entry)`, `buildAlternates(entries)`, self-canonical localized routes, reciprocal alternates, and `x-default` English links.

- [ ] **Step 1: Write failing path and alternate tests**

```js
import { expect, it } from 'vitest';
import { localizedPath, buildAlternates } from '../../src/lib/i18n.js';

it('keeps English at root and prefixes Spanish and Catalan', () => {
  expect(localizedPath({ lang: 'en', cluster: 'guides', slug: 'tracking-landlord-expenses' }))
    .toBe('/guides/tracking-landlord-expenses/');
  expect(localizedPath({ lang: 'es', cluster: 'guides', slug: 'control-gastos-alquiler' }))
    .toBe('/es/guides/control-gastos-alquiler/');
});

it('returns only reciprocal available translations plus x-default', () => {
  const values = buildAlternates([
    { lang: 'en', path: '/guides/tracking-landlord-expenses/' },
    { lang: 'es', path: '/es/guides/control-gastos-alquiler/' }
  ]);
  expect(values.map(x => x.lang)).toEqual(['en', 'es', 'x-default']);
});
```

- [ ] **Step 2: Generalize the content schema**

Change the shared `lang` field to `z.enum(['en','es','ca'])`. Add a `localized` collection loaded
with `glob({ pattern: '**/*.{md,mdx}', base: './src/content/localized' })`, whose schema includes a
localized `slug`, the original `cluster`, and the stable `translationKey`. Enforce unique
`lang + translationKey`, one English source per translation key, and no localized `published` entry
without a published English source.

- [ ] **Step 3: Implement localized static paths**

Every `[lang]` route queries the `localized` collection, filters by matching `cluster` and `lang`,
and generates only `es` and `ca` paths. English continues through the existing root templates. Reuse
`AcquisitionLayout` with localized breadcrumb labels, CTA copy, and related links that resolve
within the same language where a translation exists, otherwise to English with an explicit language
label.

- [ ] **Step 4: Implement canonical and alternate rules**

Every localized page self-canonicalizes. Emit alternates only for published equivalents. Include
English as `x-default`. Require reciprocity in `validate-dist.mjs`. Never canonicalize a Spanish or
Catalan page to English when its content is a reviewed localization.

- [ ] **Step 5: Test and commit routing before content**

Run: `cd source && npx vitest run tests/seo/i18n.test.mjs && npm run build`
Expected: the English build is unchanged and no localized routes are generated without content.

```bash
git add source/src/content.config.js source/src/lib/seo.js source/src/lib/i18n.js "source/src/pages/[lang]" source/tests/seo/i18n.test.mjs
git commit -m "feat(seo): add evidence-gated multilingual routing"
```

### Task 5: Localize the cohort into Spanish

**Files:**
- Create: `source/src/content/localized/es/` entries for the selected routes
- Create: `source/src/data/i18n/es.json`
- Modify: `source/src/pages/[lang]/index.astro`
- Create: `source/tests/content/spanish.test.mjs`
- Create: `managestate-seo-documents/05-reviews/spanish-review.md`

**Interfaces:**
- Consumes: the exact approved English source revision and the translation set.
- Produces: human-reviewed Spanish routes with App Store campaign and analytics language `es`.

- [ ] **Step 1: Define the shared Spanish UI copy**

```json
{
  "download": "Descargar ManageState para iPhone",
  "summary": "Resumen",
  "related": "Contenido relacionado",
  "faq": "Preguntas frecuentes",
  "home": "Inicio",
  "lastUpdated": "Última actualización"
}
```

- [ ] **Step 2: Write a failing cohort parity test**

Assert that published Spanish translation keys exactly equal the selected keys; every entry records
`sourceRevision`; all related links resolve; CTA language is `es`; summaries have 3–5 sentences; and
no English paragraph longer than 80 characters remains.

- [ ] **Step 3: Produce human-reviewed Spanish localizations**

Translate meaning and examples, not words. Use `propietario`, `alquiler`, and regional terminology
consistently. Preserve every non-advice disclaimer. Date every factual source. Avoid Spain-specific
legal or tax claims unless the page cites an authoritative Spanish source.

- [ ] **Step 4: Perform editorial and product review**

A fluent reviewer checks accuracy, naturalness, CTA wording, screenshots, metadata, slugs, visible
FAQs, links, and claim parity. Record reviewer, date, source revision, and corrections in
`spanish-review.md`.

- [ ] **Step 5: Build and verify Spanish routes**

Run: `cd source && npx vitest run tests/content/spanish.test.mjs && npm run verify && npm run check:visual`
Expected: the Spanish routes build, alternates are reciprocal, sitemap entries are valid, no
untranslated long-form fragments remain, and **the English homepage baseline still passes**.

- [ ] **Step 6: Commit Spanish localization**

```bash
git add source/src/content/localized/es source/src/data/i18n/es.json "source/src/pages/[lang]/index.astro" source/tests/content/spanish.test.mjs managestate-seo-documents/05-reviews/spanish-review.md
git commit -m "feat(seo): publish the reviewed Spanish acquisition cohort"
```

### Task 6: Localize the same cohort into Catalan

**Files:**
- Create: `source/src/content/localized/ca/` entries for the selected routes
- Create: `source/src/data/i18n/ca.json`
- Create: `source/tests/content/catalan.test.mjs`
- Create: `managestate-seo-documents/05-reviews/catalan-review.md`

**Interfaces:**
- Consumes: English source revisions and the completed Spanish QA lessons. Spanish is **not** the translation source.
- Produces: human-reviewed Catalan routes with analytics language `ca`.

- [ ] **Step 1: Define the shared Catalan UI copy**

```json
{
  "download": "Descarrega ManageState per a l'iPhone",
  "summary": "Resum",
  "related": "Contingut relacionat",
  "faq": "Preguntes freqüents",
  "home": "Inici",
  "lastUpdated": "Última actualització"
}
```

- [ ] **Step 2: Adapt the parity tests for Catalan**

Require the selected translation keys, `sourceRevision`, valid links, language `ca`, 3–5 sentence
summaries, and reciprocal English, Spanish, and Catalan alternates.

- [ ] **Step 3: Produce direct English-to-Catalan localizations**

Use consistent Catalan landlord and property terminology, preserve claim scope and disclaimers, and
introduce no Catalonia-specific legal or tax advice without authoritative sources.

- [ ] **Step 4: Complete an independent Catalan review**

Record reviewer, date, source revision, terminology decisions, and corrections. Do not reuse the
Spanish reviewer's approval as Catalan approval.

- [ ] **Step 5: Verify and commit Catalan routes**

Run: `cd source && npx vitest run tests/content/catalan.test.mjs && npm run verify && npm run check:visual`
Expected: Catalan routes build with complete three-language reciprocal alternates.

```bash
git add source/src/content/localized/ca source/src/data/i18n/ca.json source/tests/content/catalan.test.mjs managestate-seo-documents/05-reviews/catalan-review.md
git commit -m "feat(seo): publish the reviewed Catalan acquisition cohort"
```

### Task 7: Deploy, submit, and establish multilingual monitoring

**Files:**
- Create: `managestate-seo-documents/04-releases/phase-4-localization-launch.md`
- Modify: `managestate-seo-documents/04-releases/content-inventory.md`
- Modify: `source/scripts/seo/validate-dist.mjs`

- [ ] **Step 1: Extend dist validation**

Require self-canonicals, reciprocal alternates, a correct `html lang`, localized CTA labels, unique
localized metadata, and sitemap presence. Reject alternates pointing at draft or missing pages.

- [ ] **Step 2: Deploy Spanish first**

Verify live routes, source HTML, links, events, and Search Console URL Inspection. Observe at least
one clean deployment cycle before enabling Catalan routes.

- [ ] **Step 3: Deploy Catalan after Spanish validation**

Repeat the same checks and record the actual submission and indexing dates.

- [ ] **Step 4: Configure language-segment reporting**

Create Plausible segments for `/es/**` and `/ca/**`, monitor Search Console by page prefix, and
preserve `language` in the `app_store_click` props.

- [ ] **Step 5: Commit the launch record**

```bash
git add managestate-seo-documents/04-releases/phase-4-localization-launch.md managestate-seo-documents/04-releases/content-inventory.md source/scripts/seo/validate-dist.mjs
git commit -m "docs(seo): record the multilingual acquisition launch"
```

## Phase 4 Exit Gate

If the data floor was not met, the phase ends after Task 2 with a recorded deferral and a scheduled
30-day re-check. That is a successful outcome, not a failure.

If localization proceeded: every selected English change must have an experiment or review record;
the Spanish and Catalan cohorts must be live, human-reviewed, self-canonical, reciprocal through
`hreflang`, present in the sitemap, and measurable by language; the English homepage must still match
its Phase 1a baseline; and any translation with unresolved legal, factual, or linguistic concerns
must remain `review` and out of production.
