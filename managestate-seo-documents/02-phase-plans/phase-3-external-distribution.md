# SEO Phase 3: External Authority Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Establish a controlled, measurable external publication workflow that amplifies validated ManageState content without duplicate spam or automated account posting.

**Architecture:** A versioned publication ledger is the operational source of truth. Validators enforce unique topics, valid state transitions, deep links, and public-URL verification. Platform-specific content packs are reviewed in Git, then published manually to Medium, Substack, and YouTube at one to two items per week.

**Tech Stack:** Node.js 22.13.0, Vitest and `node:test`, JSON, Markdown, Plausible, App Store Connect campaigns, Medium, Substack, YouTube.

## Global Constraints

- Phase 2 exit gate must pass and the source page must be live before an external adaptation is queued.
- `managestate.app` remains the canonical source and the long-term SEO asset.
- Initial cadence is one to two external publications per week.
- No browser automation, account networks, auto-posting, automated community promotion, or copied article blasts.
- Every external item must stand alone, be original or meaningfully adapted, and deep-link to the most relevant ManageState page.
- Medium uses a canonical source link for true republications where supported.
- GitHub is excluded until a genuinely useful public asset exists.
- A publication is `published` only after its public URL resolves and is manually inspected.
- Failed attempts return to a retryable state and do not consume the topic.
- **External content may only use validator-approved evidence.** The design §15.3 homepage retention exception does not extend to any external platform.
- Credentials and platform cookies never enter the repository.

---

### Task 1: Create the publication ledger and state machine

**Files:**
- Create: `source/seo-ops/publications.json`
- Create: `source/seo-ops/publication-schema.json`
- Create: `source/scripts/seo/publication-ledger.mjs`
- Create: `source/tests/seo/publication-ledger.test.mjs`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: records `{ id, topicId, platform, sourcePath, destinationUrl, campaign, status, attempts, publicUrl, publishedAt, lastError }`.
- Produces: `validateLedger(records): string[]` and `transitionPublication(record, nextStatus, detail)`.

- [ ] **Step 1: Write failing transition tests**

```js
import { expect, it } from 'vitest';
import { transitionPublication, validateLedger } from '../../scripts/seo/publication-ledger.mjs';

const queued = {
  id: 'medium-spreadsheets-001', topicId: 'landlord-app-vs-spreadsheets',
  platform: 'medium', sourcePath: '/compare/landlord-app-vs-spreadsheets/',
  destinationUrl: 'https://managestate.app/compare/landlord-app-vs-spreadsheets/',
  campaign: 'medium', status: 'queued', attempts: 0, publicUrl: null,
  publishedAt: null, lastError: null
};

it('requires public verification before published', () => {
  expect(() => transitionPublication(queued, 'published', {})).toThrow(/publicUrl/);
});

it('returns failed work to retry without burning the topic', () => {
  const failed = transitionPublication(queued, 'failed', { error: 'login expired' });
  const retry = transitionPublication(failed, 'queued', {});
  expect(retry.attempts).toBe(1);
  expect(retry.lastError).toBe('login expired');
});

it('rejects a duplicate platform and topic pair', () => {
  expect(validateLedger([queued, { ...queued, id: 'medium-spreadsheets-002' }]).join('\n'))
    .toMatch(/duplicate/);
});
```

- [ ] **Step 2: Implement explicit states and invariants**

Allowed states: `queued`, `drafting`, `review`, `ready`, `published`, `failed`, `retired`. Enforce
unique `id`; unique `platform + topicId` for non-retired records; source and destination on
`managestate.app`; platform in `medium|substack|youtube`; campaign matching the platform and
present in `site.json` `appStoreCampaigns`; and `publicUrl` plus an ISO `publishedAt` for published
records.

- [ ] **Step 3: Add ledger CLI commands**

Support `validate`, `transition <id> <state>`, and `list <state>`. Every write uses a temporary
file plus an atomic rename. Store no credentials and no platform cookies.

- [ ] **Step 4: Add the package script and run the tests**

```json
"check:publications": "node scripts/seo/publication-ledger.mjs validate"
```

Run: `cd source && npx vitest run tests/seo/publication-ledger.test.mjs && npm run check:publications`
Expected: PASS with an initially empty ledger.

- [ ] **Step 5: Commit the ledger**

```bash
git add source/seo-ops/publications.json source/seo-ops/publication-schema.json source/scripts/seo/publication-ledger.mjs source/tests/seo/publication-ledger.test.mjs source/package.json
git commit -m "feat(seo): add the controlled external publication ledger"
```

### Task 2: Build deterministic deep links and publication verification

**Files:**
- Create: `source/scripts/seo/build-external-link.mjs`
- Create: `source/scripts/seo/verify-publication.mjs`
- Create: `source/tests/seo/external-links.test.mjs`
- Create: `source/tests/fixtures/publication-page.html`

**Interfaces:**
- Consumes: source path, platform campaign, public URL, expected destination.
- Produces: external destination links and `{ reachable, public, destinationFound, canonicalMatches }`.

- [ ] **Step 1: Write failing link tests**

Assert that the Medium comparison destination is
`https://managestate.app/compare/landlord-app-vs-spreadsheets/?ref=medium`; that off-domain
destinations and unknown campaigns are rejected; that a path not present in the built sitemap is
rejected; and that verification rejects editor, draft, login, preview, and non-200 URLs.

- [ ] **Step 2: Implement external destination URLs**

Use `ref=medium|substack|youtube` for web analytics attribution only. App Store campaign links stay
inside the destination page, where the cluster campaign already applies. Canonical URL generation
must ignore the `ref` query — `canonicalUrl` from Phase 1a already strips query strings, and a test
must assert that a `?ref=` visit still reports the clean canonical.

Validate the source path against the built sitemap so a deep link can never point at a route that
does not exist.

- [ ] **Step 3: Implement public-page verification**

Use native `fetch` with redirect following, a 10-second timeout, and a browser-like user agent.
Require a final status of 200, no editor/draft/login/preview path markers, and the expected
ManageState destination in the returned HTML when the platform exposes body or description HTML.
For YouTube, require public status and confirm the destination link manually when the page HTML does
not expose the description.

- [ ] **Step 4: Test without calling live platforms**

Run: `cd source && npx vitest run tests/seo/external-links.test.mjs`
Expected: PASS against fixtures with the network mocked.

- [ ] **Step 5: Commit link and verification tooling**

```bash
git add source/scripts/seo/build-external-link.mjs source/scripts/seo/verify-publication.mjs source/tests/seo/external-links.test.mjs source/tests/fixtures/publication-page.html
git commit -m "feat(seo): verify external publication destinations"
```

### Task 3: Create three platform-specific pilot content packs

**Files:**
- Create: `source/seo-ops/external/medium/landlord-app-vs-spreadsheets.md`
- Create: `source/seo-ops/external/substack/monthly-rental-finance-routine.md`
- Create: `source/seo-ops/external/youtube/roi-calculator-walkthrough.md`
- Create: `source/tests/seo/external-content.test.mjs`
- Modify: `source/seo-ops/publications.json`

**Interfaces:**
- Consumes: three live source pages and only the claims and evidence already approved on those pages.
- Produces: one ready-to-review adaptation per platform, each with a distinct angle and deep link.

- [ ] **Step 1: Write a failing adaptation-quality test**

Assert every pack declares `topicId`, `platform`, `sourcePath`, `destinationUrl`, `primaryQuestion`,
`summary`, and `reviewStatus`; contains the destination link; contains none of `trusted by`,
`thousands`, `free trial`, or `no credit card`; and copies **no more than 30 %** of normalized
sentences from its source-page Markdown.

- [ ] **Step 2: Write the Medium adaptation**

Title: `When a Landlord App Beats a Spreadsheet—and When It Doesn't`. Structure: standalone answer;
signs a spreadsheet is enough; signs it is becoming fragile; mobile, document and calculation
trade-offs; a migration checklist; a transparent ManageState mention; a deep link to
`/compare/landlord-app-vs-spreadsheets/`. If published verbatim, set Medium's canonical to the
source page; otherwise keep it an original adaptation.

- [ ] **Step 3: Write the Substack adaptation**

Title: `A 20-Minute Monthly Rental Finance Routine`. Structure: the monthly checklist; income
reconciliation; the expense and document pass; property-level review; questions for an accountant;
a short ManageState workflow; a deep link to `/guides/monthly-rental-finance-routine/`. Do not frame
organizational categories as tax advice.

- [ ] **Step 4: Write the YouTube production pack**

Title: `How to Calculate Rental Property ROI Without Fooling Yourself`. Include a 5–7 minute script,
shot list, calculator inputs, a worked example using the exact values from `roi.test.mjs`, the
estimate disclaimer, chapters, thumbnail text, the description, and a deep link to
`/tools/rental-property-roi-calculator/`. Do not claim the calculator predicts future returns, and
state that ROI is calculated by the website tool rather than inside the app.

- [ ] **Step 5: Add queued ledger records and test**

Run: `cd source && npx vitest run tests/seo/external-content.test.mjs && npm run check:publications`
Expected: three unique queued records and all content checks PASS.

- [ ] **Step 6: Commit the pilot packs**

```bash
git add source/seo-ops/external source/seo-ops/publications.json source/tests/seo/external-content.test.mjs
git commit -m "docs(seo): prepare external authority pilot content"
```

### Task 4: Publish manually and record verified public URLs

**Files:**
- Modify: `source/seo-ops/publications.json`
- Create: `managestate-seo-documents/04-releases/phase-3-publication-log.md`

**Interfaces:**
- Consumes: reviewed content packs and authenticated human-controlled platform accounts.
- Produces: verified public URLs and publication dates. No credentials enter the repository.

- [ ] **Step 1: Move one record at a time through review**

Use CLI transitions `queued → drafting → review → ready`. A human compares claims, links, title,
images, and the platform preview against the committed pack before publishing.

- [ ] **Step 2: Publish at the approved cadence**

Publish no more than two items in any seven-day period. Native platform scheduling is allowed only
when it still requires an approved final draft. No browser automation.

- [ ] **Step 3: Verify each public URL**

Run: `cd source && node scripts/seo/verify-publication.mjs <record-id> <public-url>`
Expected: status 200, a public final URL, and a confirmed destination where inspectable. Manually
confirm the canonical configuration, the visible destination link, the thumbnail or image, and the
transcript or description.

- [ ] **Step 4: Mark success or retryable failure**

On success, transition to `published` with the exact URL and date. On login, moderation, draft, or
link failure, transition to `failed`, record the factual reason, fix it, and return to `queued`.
Never create a new topic ID to work around a failure.

- [ ] **Step 5: Commit publication state separately**

```bash
git add source/seo-ops/publications.json managestate-seo-documents/04-releases/phase-3-publication-log.md
git commit -m "docs(seo): record verified external publications"
```

### Task 5: Measure the pilot and choose the next topics

**Files:**
- Create: `managestate-seo-documents/05-reviews/phase-3-30-day-review.md`
- Create: `source/seo-ops/external/topic-queue.json`
- Create: `source/scripts/seo/validate-topic-queue.mjs`
- Create: `source/tests/seo/topic-queue.test.mjs`

**Interfaces:**
- Consumes: the publication ledger, Plausible referrals, Search Console link and query data, and App Store campaign outcomes.
- Produces: a scored queue whose topics always map to live ManageState destinations.

- [ ] **Step 1: Define the queue scoring contract**

Score each candidate 0–5 for commercial intent, audience fit, source-page evidence, source-page
search signal, external-format fit, and editorial effort (reverse-scored). Store the component
scores and the total. Never store invented volume or CPC values.

- [ ] **Step 2: Write validator tests**

Reject duplicate topic and platform pairs, missing live source paths, unknown platforms, totals that
do not equal the component sum, and a queue exceeding one-to-two-per-week capacity for the next four
weeks.

- [ ] **Step 3: Record actual 30-day outcomes**

For each publication record public and indexed status, referral visits, engaged visits, App Store
clicks, attributed product-page views and downloads where available, and any qualitative discovery.
Use zero when zero is observed and `not available` only when the system cannot provide the metric.

- [ ] **Step 4: Build the next four-week queue**

Select at most eight records, prioritizing formats that produced qualified discovery or conversion.
Retire a format only with a written reason. Do not scale from impressions alone.

- [ ] **Step 5: Verify and commit**

Run: `cd source && npx vitest run tests/seo/topic-queue.test.mjs && node scripts/seo/validate-topic-queue.mjs && npm run check:publications`
Expected: PASS.

```bash
git add managestate-seo-documents/05-reviews/phase-3-30-day-review.md source/seo-ops/external/topic-queue.json source/scripts/seo/validate-topic-queue.mjs source/tests/seo/topic-queue.test.mjs
git commit -m "docs(seo): review the external distribution pilot"
```

## Phase 3 Exit Gate

Complete at least one verified publication on each selected platform, or record a platform-specific
blocker. Confirm cadence compliance, unique content, working deep links, public URL verification,
ledger consistency, that no external item reused unverified homepage proof, and a 30-day evidence
review. Do not proceed to automation merely because publishing succeeded — Phase 5 has its own
eligibility gate.
