# SEO Phase 0: Baseline and Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Establish verified SEO, analytics, App Store, and evidence inputs in this repository before changing the site.

**Architecture:** Operational SEO inputs live in versioned JSON validated by dependency-free Node scripts. Raw exports and credentials stay outside Git. Google Search Console, Plausible, and App Store Connect remain systems of record; concise baselines and verified public evidence are committed for later phases.

**Tech Stack:** Node.js 22.13.0, the built-in `node:test` runner, Google Search Console, Plausible Analytics, App Store Connect, Apple iTunes Lookup and customer-review RSS endpoints, JSON, Markdown. **No new npm dependencies.**

## Why this phase is re-run

Phase 0 was implemented on 2026-08-17 and removed by the 2026-08-20 revert of the Astro port.
What survives: the Search Console domain property, the Plausible site, and the nine verified
App Store campaign links. What does not survive: `site.json`, every evidence JSON file, the
validators, the `seo-ops/` boundary, and the committed baseline. All of it is re-created here.
The external account work in Task 3 is re-confirmation, not re-creation.

## Global Constraints

- Source of truth: [`../01-strategy/seo-growth-design.md`](../01-strategy/seo-growth-design.md).
- The site application is `source/`. Operational records live in `managestate-seo-documents/`.
- Primary audience: self-managing landlords with one to five properties; growing investors secondary.
- English launches first; Spanish follows proven English pages; Catalan follows Spanish.
- Primary conversion is an Apple App Store download for app ID `6751497970`, bundle ID `com.managestate.app`, provider token `128092033`.
- Store only verified App Store reviews, customer testimonials, screenshots, and product claims.
- Do not commit credentials, private analytics exports, customer property data, or personally identifiable data.
- Do not add validator-approved records for the retained homepage social proof. It is recorded as a dated exception in the evidence register and counted nowhere.
- Product claims must cite the ManageState app repository **and a commit SHA**; a bare file path is not provenance.
- This phase changes no rendered page. It adds data, validators, and documentation only.
- Existing untracked project files must not be staged accidentally; every commit command names exact files.

---

### Task 1: Add the validated site and evidence data contract

**Files:**
- Create: `source/src/data/site.json`
- Create: `source/src/data/evidence/app-store-reviews.json`
- Create: `source/src/data/evidence/customer-testimonials.json`
- Create: `source/src/data/evidence/product-claims.json`
- Create: `source/src/data/evidence/screenshots.json`
- Create: `source/scripts/seo/validate-baseline-data.mjs`
- Create: `source/tests/seo/validate-baseline-data.test.mjs`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: app ID `6751497970`, bundle ID `com.managestate.app`, provider token `128092033`, canonical site URL `https://managestate.app`.
- Produces: `validateBaselineData({ site, reviews, testimonials, claims, screenshots }): string[]`. Later phases may render evidence only when this returns an empty array.

- [ ] **Step 1: Write the failing contract test**

```js
// source/tests/seo/validate-baseline-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBaselineData } from '../../scripts/seo/validate-baseline-data.mjs';

const site = {
  siteUrl: 'https://managestate.app',
  appStoreId: '6751497970',
  bundleId: 'com.managestate.app',
  appStoreProviderToken: '128092033',
  appStoreCampaigns: [
    'website-home', 'website-features', 'website-audiences', 'website-comparisons',
    'website-guides', 'website-tools', 'medium', 'substack', 'youtube'
  ],
  plausibleDomain: 'managestate.app',
  primaryLanguage: 'en',
  supportedLanguages: ['en', 'es', 'ca'],
  privacyUrl: 'https://managestate.app/privacy/',
  contactUrl: 'https://managestate.app/contact/',
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
};

test('accepts the approved site contract and empty evidence lists', () => {
  assert.deepEqual(
    validateBaselineData({ site, reviews: [], testimonials: [], claims: [], screenshots: [] }),
    []
  );
});

test('rejects unverified evidence and unsupported claims', () => {
  const errors = validateBaselineData({
    site,
    reviews: [{ id: 'r1', quote: 'Great', verified: false, sourceUrl: '' }],
    testimonials: [],
    claims: [{ id: 'c1', text: 'Trusted by thousands', status: 'unsupported' }],
    screenshots: []
  });
  assert.match(errors.join('\n'), /review r1 must be verified/);
  assert.match(errors.join('\n'), /claim c1 must have status verified/);
});

test('rejects a claim without a repository commit SHA', () => {
  const errors = validateBaselineData({
    site,
    reviews: [], testimonials: [], screenshots: [],
    claims: [{
      id: 'c2', text: 'ManageState calculates monthly net income.', status: 'verified',
      verified: true, verificationDate: '2026-08-21',
      source: { repo: 'ManageState/app', path: 'src/services/propertyService.js', lines: '38-45' }
    }]
  });
  assert.match(errors.join('\n'), /claim c2 source must include commit/);
});

test('rejects an unknown App Store campaign name', () => {
  const errors = validateBaselineData({
    site: { ...site, appStoreCampaigns: [...site.appStoreCampaigns, 'Website_Home'] },
    reviews: [], testimonials: [], claims: [], screenshots: []
  });
  assert.match(errors.join('\n'), /campaign Website_Home/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd source && node --test tests/seo/validate-baseline-data.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `validate-baseline-data.mjs`.

- [ ] **Step 3: Create the data files and the validator**

```json
// source/src/data/site.json
{
  "siteUrl": "https://managestate.app",
  "appStoreId": "6751497970",
  "bundleId": "com.managestate.app",
  "appStoreProviderToken": "128092033",
  "appStoreCampaigns": [
    "website-home",
    "website-features",
    "website-audiences",
    "website-comparisons",
    "website-guides",
    "website-tools",
    "medium",
    "substack",
    "youtube"
  ],
  "plausibleDomain": "managestate.app",
  "primaryLanguage": "en",
  "supportedLanguages": ["en", "es", "ca"],
  "privacyUrl": "https://managestate.app/privacy/",
  "contactUrl": "https://managestate.app/contact/",
  "termsUrl": "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
}
```

Create each evidence JSON file as `[]`. Implement the validator with these rules:

| Subject | Rules |
| --- | --- |
| Site | Exact `siteUrl`, `appStoreId`, `bundleId`, `appStoreProviderToken`. `plausibleDomain` equals `managestate.app`. `privacyUrl` and `contactUrl` are HTTPS URLs on `managestate.app` with a trailing slash. `termsUrl` is HTTPS. Every campaign matches `/^[a-z0-9-]+$/` and the set equals the nine approved names. |
| All evidence | Unique IDs within a category; non-empty `id`; `verified === true`. |
| Reviews | Non-empty `quote`; `sourceUrl` on `https://apps.apple.com/`; integer `rating` 1–5. |
| Testimonials | `sourceRecord`, `consentStatus === "granted"`, `approvalDate`, non-empty `allowedLanguages`. |
| Claims | `status === "verified"`; `verificationDate`; `source` object with `repo`, `path`, `lines`, **and a 40-character `commit` SHA**. |
| Screenshots | Repository-relative public asset path that exists on disk; descriptive `alt`; `capturedAppVersion`; `approvalDate`; `supportsClaims` referencing existing claim IDs. |

Export `validateBaselineData`. Add a CLI branch that reads `site.json` and all four evidence
files, prints every error with its record ID, exits `1` on any error, and prints
`Baseline data valid` otherwise.

> `privacyUrl` and `contactUrl` are the **Phase 1b** target routes. The validator checks their shape,
> not that they resolve — during Phase 1a the live legal page is still `/privacy-policy.html`. Phase 1b
> creates the routes and the redirect stubs, and `check:dist` starts asserting they exist from then on.

- [ ] **Step 4: Add and run the package scripts**

Add to `source/package.json`:

```json
"test:baseline": "node --test tests/seo/validate-baseline-data.test.mjs",
"check:baseline": "node scripts/seo/validate-baseline-data.mjs"
```

Run: `cd source && npm run test:baseline && npm run check:baseline`
Expected: both PASS; the validator prints `Baseline data valid`.

- [ ] **Step 5: Commit the data contract**

```bash
git add source/package.json source/src/data/site.json source/src/data/evidence source/scripts/seo/validate-baseline-data.mjs source/tests/seo/validate-baseline-data.test.mjs
git commit -m "feat(seo): define verified baseline data contract"
```

### Task 2: Import verifiable App Store metadata and reviews

**Files:**
- Create: `source/scripts/seo/import-app-store-evidence.mjs`
- Create: `source/tests/seo/import-app-store-evidence.test.mjs`
- Create: `source/tests/fixtures/apple-lookup.json`
- Create: `source/tests/fixtures/apple-reviews.json`
- Modify: `source/package.json`
- Modify: `source/src/data/evidence/app-store-reviews.json`

**Interfaces:**
- Consumes: Apple Lookup for bundle ID `com.managestate.app`; Apple customer-review RSS for app ID `6751497970`.
- Produces: `parseLookup(payload)`, `parseReviews(payload, storefront)`, and normalized records `{ id, quote, title, author, rating, locale, sourceUrl, verified }`.

- [ ] **Step 1: Save deterministic fixtures and write parser tests**

Use one lookup result with `trackId: 6751497970` and `trackName: "ManageState"`, and one review
entry with an ID, author, rating, title, content, and link.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLookup, parseReviews } from '../../scripts/seo/import-app-store-evidence.mjs';
import lookup from '../fixtures/apple-lookup.json' with { type: 'json' };
import reviews from '../fixtures/apple-reviews.json' with { type: 'json' };

test('accepts only the ManageState listing', () => {
  assert.equal(parseLookup(lookup).trackId, 6751497970);
});

test('rejects a mismatched track ID', () => {
  assert.throws(() => parseLookup({ resultCount: 1, results: [{ trackId: 1 }] }));
});

test('normalizes Apple reviews as verified evidence', () => {
  const [review] = parseReviews(reviews, 'us');
  assert.equal(review.verified, true);
  assert.match(review.sourceUrl, /^https:\/\/apps\.apple\.com\//);
  assert.ok(review.rating >= 1 && review.rating <= 5);
});
```

- [ ] **Step 2: Run the parser tests and verify failure**

Run: `cd source && node --test tests/seo/import-app-store-evidence.test.mjs`
Expected: FAIL because the importer does not exist.

- [ ] **Step 3: Implement the importer**

Use native `fetch` with a 10-second timeout. Reject non-200 responses. Validate app ID and
bundle ID against `site.json`. Deduplicate by Apple entry ID. Write sorted JSON. Fetch the US
and Spain storefronts because English and Spanish are the first two rollout languages. Never
infer customer counts, never rewrite review wording, and never synthesize a missing rating.

- [ ] **Step 4: Run the importer and the validators**

Run: `cd source && node scripts/seo/import-app-store-evidence.mjs && npm run test:baseline && npm run check:baseline`
Expected: PASS. If Apple returns no reviews, the file stays a valid `[]` and the importer prints
`0 verified reviews imported`. Record the observed count in the baseline in Task 3 — do not
carry forward the count from the 2026-08-05 baseline without re-observing it.

- [ ] **Step 5: Commit imported public evidence**

```bash
git add source/package.json source/scripts/seo/import-app-store-evidence.mjs source/tests/seo/import-app-store-evidence.test.mjs source/tests/fixtures/apple-lookup.json source/tests/fixtures/apple-reviews.json source/src/data/evidence/app-store-reviews.json
git commit -m "feat(seo): import verified App Store evidence"
```

### Task 3: Re-confirm measurement accounts and record the baseline

**Files:**
- Create: `source/seo-ops/README.md`
- Create: `source/seo-ops/keywords/search-console-questions.json`
- Create: `source/seo-ops/private/.gitignore`
- Modify: `managestate-seo-documents/03-operations/measurement-setup.md`
- Modify: `managestate-seo-documents/03-operations/baseline-2026-08-05.md`

**Interfaces:**
- Consumes: Search Console property access, Plausible site access, App Store Connect campaign access, and the live site.
- Produces: an auditable baseline of observed values and account status, with no credentials and no raw customer data.

- [ ] **Step 1: Create the private-export boundary**

`source/seo-ops/private/.gitignore` must contain exactly:

```gitignore
*
!.gitignore
```

Verify with `git check-ignore -v source/seo-ops/private/example.csv`. Document in
`source/seo-ops/README.md` that Search Console CSVs, Plausible exports, App Store Connect
exports, provider credentials, and any screenshot containing account details stay in this
directory and are never committed. The public Apple `pt`/`ct` parameters are not credentials.

- [ ] **Step 2: Re-confirm the Search Console domain property**

The domain property `sc-domain:managestate.app` was owner-confirmed created and DNS-verified on
2026-08-05. Re-open it, record the current indexing status, indexed and excluded URL counts, and
any coverage issues. Export the last available 90 days of Pages and Queries into
`source/seo-ops/private/`. Filter question queries with:

```text
^(who|what|where|when|why|how|which|can|do|does|is|are|should|will)\b
```

Commit only aggregate `{ query, clicks, impressions, position, sourceWindow }` records to
`search-console-questions.json`. If no data exists, commit `[]` and record zero available days
rather than estimating. Sitemap submission waits for Phase 1a, which publishes the first
`sitemap.xml`.

- [ ] **Step 3: Re-confirm Plausible and the nine campaigns**

Confirm the Plausible site `managestate.app` still exists and note whether any data has been
collected (expected: none, because no script has ever been deployed). Re-verify that each of the
nine campaign links still resolves to app ID `6751497970`, and re-verify the provider token
`128092033` embedded in them. Record the observation date. Keep any account token in
`private/`; the campaign URLs themselves are public.

- [ ] **Step 4: Update the baseline using observed values**

The baseline must state, with a fresh observation timestamp: Search Console ownership status and
available date range; indexed and excluded URL counts; impressions, clicks, CTR, and top
non-branded queries; live homepage title and indexability signal; `robots.txt` and `sitemap.xml`
status; Plausible setup status; App Store listing URL; the nine campaign names and URLs; counts
of verified reviews, testimonials, claims and screenshots; and every known data gap. Use actual
values, including zero when zero is observed, and `unavailable` when a system could not be read.

Add a section recording that the 2026-08-17 implementation was reverted on 2026-08-20 and that
all committed Phase 0 artifacts were re-created on the date of this run.

- [ ] **Step 5: Review for sensitive data and commit**

Run:

```bash
git check-ignore -v source/seo-ops/private/example.csv
git diff --check -- source/seo-ops managestate-seo-documents/03-operations
```

Expected: the private path reports as ignored; no whitespace errors; no credentials in the diff.

```bash
git add source/seo-ops/README.md source/seo-ops/keywords/search-console-questions.json source/seo-ops/private/.gitignore managestate-seo-documents/03-operations/measurement-setup.md managestate-seo-documents/03-operations/baseline-2026-08-05.md
git commit -m "docs(seo): record acquisition measurement baseline"
```

### Task 4: Record verified customer evidence and the retention exception

**Files:**
- Modify: `source/src/data/evidence/customer-testimonials.json`
- Modify: `source/src/data/evidence/product-claims.json`
- Modify: `source/src/data/evidence/screenshots.json`
- Modify: `managestate-seo-documents/03-operations/evidence-register.md`

**Interfaces:**
- Consumes: owner-supplied customer records and product behavior confirmed against the shipping app at a known commit.
- Produces: render-safe verified evidence. Empty arrays remain the correct result when provenance is unavailable.

- [ ] **Step 1: Re-verify the three product claims against a pinned commit**

The 2026-08-05 register verified three claims against `src/services/propertyService.js` and
`src/services/exportService.js` in the **ManageState application repository** — files that do not
exist in this repository, at an unrecorded revision. Re-verify each claim against the app
repository at a specific commit and record `{ repo, commit, path, lines }` for each. A claim
whose source cannot be re-verified is removed, not carried forward.

- [ ] **Step 2: Add only records with provenance**

For each accepted testimonial record a stable ID, the exact approved quote, display name or
approved initials, source-record location, consent status, approval date, allowed languages, and
`verified: true`. For each screenshot record the public asset path, descriptive alt text,
captured app version, approval date, and the claim IDs the image visibly supports. Leave any
category with no acceptable evidence as `[]`.

Do not migrate the six testimonial identities currently in
`source/src/components/Testimonials.jsx` into `customer-testimonials.json`. They have no source
record or consent and are governed by Step 4.

- [ ] **Step 3: Cross-check shipping product claims against current homepage copy**

Check each homepage feature claim against the app at the pinned commit and classify it as
`verified`, `retained-unverified`, or `correctable`. Record every result in the register. In
particular, resolve the "CSV Exports" bullet: the verified export behavior is an XLSX workbook.
A one-word text correction is a permitted change under design §6.1 because it alters no layout;
apply it only with owner approval and record the decision either way.

Remove wording that cannot be confirmed from any *new* surface. Do not soften an unsupported
claim into a different unsupported claim.

- [ ] **Step 4: Record the A8 retention exception with explicit boundaries**

Record in the evidence register, dated 2026-08-21: the six retained testimonial identities and
quotes, the "trusted by investors around the world" line, and the "Free to start" and
"No credit card required" hero badges, each with its exact current file location. State
explicitly that these records are excluded from all evidence counts, must never be emitted as
`Review` or `aggregateRating` structured data, and must never be reused on acquisition pages, in
external publications, or in automation prompts. Record the residual risk from design §15.3
verbatim so the decision remains auditable.

- [ ] **Step 5: Run the validator and commit the inventory**

Run: `cd source && npm run check:baseline`
Expected: PASS. Any record missing source, consent, or a commit SHA fails with a record-specific
error. The retained homepage copy does not appear in any evidence file, so it cannot pass or fail
the validator — that is the intended outcome.

```bash
git add source/src/data/evidence/customer-testimonials.json source/src/data/evidence/product-claims.json source/src/data/evidence/screenshots.json managestate-seo-documents/03-operations/evidence-register.md
git commit -m "docs(seo): inventory verified marketing evidence"
```

## Phase 0 Exit Gate

Run:

```bash
cd source && npm run test:baseline && npm run check:baseline && node --test tests/seo/
cd .. && git status --short
```

Proceed to Phase 1a only when:

- Both validators pass and the full `tests/seo/` suite passes.
- `site.json` carries the exact site, App Store, provider-token, campaign, and analytics contract.
- Every committed review, testimonial, claim, and screenshot passes provenance validation, including a commit SHA on each claim.
- `source/seo-ops/private/` is confirmed git-ignored.
- The baseline records observed values with a fresh timestamp and lists every residual gap.
- The evidence register records the A8 retention exception with its boundaries and residual risk.
- `git status --short` shows no unintended staged or modified files.

Residual account-access blockers must be listed in the baseline rather than concealed.
