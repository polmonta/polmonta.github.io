# SEO Phase 1a: Technical SEO Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21 (new phase, introduced by design amendment A3)
**Goal:** Make the existing site crawlable, indexable, measurable, and attributable without changing the framework and without changing a single rendered pixel beyond the design §6.1 allowances.

**Architecture:** The Vite React SPA stays exactly as it is. All metadata, structured data, and crawl assets are authored statically in `source/index.html` and `source/public/`, so they exist in the served HTML with no JavaScript execution. App Store URL generation and analytics become small pure modules consumed by the existing components, which are modified only at their `href` and attribute boundaries.

**Tech Stack:** Vite (rolldown) 7, React 19, Node.js 22.13.0, `node:test`, `@playwright/test` (visual gate only), Lighthouse CI, Plausible Analytics, `sharp` or `oxipng`/`cwebp` for image re-encoding.

## Global Constraints

- Phase 0 exit gate must pass before starting.
- **Zero visual change.** Permitted: `<head>` content, structured data, crawl assets, `href` values, `alt`, `width`/`height`, `loading`/`decoding`, data attributes, and visually lossless image re-encoding. Prohibited: colors, typography, spacing, layout, section order, component structure, animation behavior, and copy — including the retained social proof.
- No framework change, no Astro, no routing change. The SPA remains a single page.
- The App Store URL is a build-time constant with a mandatory campaign. No environment variable, no unattributed fallback.
- Plausible's domain is a constant. No enabling environment variable.
- The privacy disclosure must ship **in the same release as or before** the analytics script.
- Exactly one publish path may exist when this phase ends.
- Analytics failure must never block rendering or App Store navigation.

---

### Task 1: Establish the visual preservation gate before touching anything

**Files:**
- Create: `source/playwright.config.js`
- Create: `source/tests/visual/homepage.spec.js`
- Create: `source/tests/visual/homepage.spec.js-snapshots/` (generated baselines, committed)
- Modify: `source/package.json`
- Modify: `source/.gitignore`

**Interfaces:**
- Consumes: the current `main` build, served by `vite preview`.
- Produces: `npm run check:visual`, failing when `/` differs from its committed baseline by more than the phase tolerance.

- [ ] **Step 1: Install the gate and capture baselines from unmodified `main`**

Do this before any other change in this phase, so the baselines record the current design.

```bash
cd source
npm install -D @playwright/test@latest
npx playwright install chromium
```

```js
// source/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  reporter: 'list',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.005, animations: 'disabled' } },
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4173', reuseExistingServer: true }
});
```

```js
// source/tests/visual/homepage.spec.js
import { test, expect } from '@playwright/test';

const widths = [390, 768, 1440];

for (const width of widths) {
  test(`homepage is visually unchanged at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`homepage-${width}.png`, { fullPage: true });
  });
}
```

Add to `source/package.json`:

```json
"check:visual": "playwright test",
"check:visual:update": "playwright test --update-snapshots"
```

Add `test-results/` and `playwright-report/` to `source/.gitignore`.

- [ ] **Step 2: Generate and commit the reference screenshots**

Run:

```bash
cd source && npm run build && npm run check:visual:update
```

Expected: three PNG baselines written under `tests/visual/homepage.spec.js-snapshots/`. Open each
one and confirm it shows the current design at that width, fully rendered, before committing.

- [ ] **Step 3: Prove the gate detects a change**

Temporarily change one visible value (for example a heading's text colour), run
`npm run check:visual`, and confirm it FAILS with a diff artifact. Revert the change and confirm
it PASSES. A gate that has never failed has not been tested.

- [ ] **Step 4: Commit the gate**

```bash
git add source/playwright.config.js source/tests/visual source/package.json source/package-lock.json source/.gitignore
git commit -m "test(site): gate homepage visual design against baselines"
```

> `check:visual` is deliberately **excluded** from `verify` and from CI. Browser and font
> rasterization differ between machines and would produce false failures. It is run locally and
> is a mandatory exit condition for phases 1a and 1b.

### Task 2: Add complete static metadata and structured data

**Files:**
- Modify: `source/index.html`
- Create: `source/src/lib/seo.js`
- Create: `source/src/lib/schema.js`
- Create: `source/tests/seo/schema.test.mjs`
- Create: `source/public/social/managestate-og.png`

**Interfaces:**
- Consumes: `source/src/data/site.json`.
- Produces: `canonicalUrl(path)`, `buildOrganizationSchema()`, `buildSoftwareApplicationSchema()`, and a complete static `<head>`.

- [ ] **Step 1: Write failing schema tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl } from '../../src/lib/seo.js';
import { buildOrganizationSchema, buildSoftwareApplicationSchema } from '../../src/lib/schema.js';

test('canonical URLs are absolute and trailing-slashed', () => {
  assert.equal(canonicalUrl('/'), 'https://managestate.app/');
  assert.equal(canonicalUrl('/features/tax-export'), 'https://managestate.app/features/tax-export/');
  assert.equal(canonicalUrl('/features/tax-export/?utm_source=x'), 'https://managestate.app/features/tax-export/');
});

test('SoftwareApplication omits ratings entirely without real review data', () => {
  const schema = buildSoftwareApplicationSchema({ reviewCount: 0, averageRating: null });
  assert.equal(schema['@type'], 'SoftwareApplication');
  assert.equal(schema.operatingSystem, 'iOS');
  assert.ok(!('aggregateRating' in schema));
});

test('SoftwareApplication never derives ratings from unverified testimonials', () => {
  const schema = buildSoftwareApplicationSchema({ reviewCount: 6, averageRating: 5, verified: false });
  assert.ok(!('aggregateRating' in schema));
});

test('Organization carries only verified fields', () => {
  const schema = buildOrganizationSchema();
  assert.deepEqual(Object.keys(schema).sort(), ['@context', '@type', 'name', 'url']);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd source && node --test tests/seo/schema.test.mjs`
Expected: FAIL — neither module exists.

- [ ] **Step 3: Implement the modules**

`canonicalUrl` strips query strings and fragments, enforces a leading and trailing slash, and
resolves against `site.siteUrl`. `buildSoftwareApplicationSchema` emits `@type`, `name`,
`operatingSystem: 'iOS'`, `applicationCategory: 'FinanceApplication'`, `url`, and
`installUrl` pointing at the App Store contract URL for campaign `website-home`. It includes
`aggregateRating` **only** when `verified === true` and both a real integer `reviewCount` above
zero and a real `averageRating` derived from imported Apple review data are supplied; otherwise
the property is omitted. `buildOrganizationSchema` emits only `name` and `url`.

Design §15.3 boundary: the retained homepage testimonials are not a data source for any schema.

- [ ] **Step 4: Author the static `<head>`**

Replace the `<head>` of `source/index.html` with the complete set. Keep the existing favicon and
Apple touch icon exactly as they are.

```html
<title>Property Management App for Landlords | ManageState</title>
<meta name="description" content="Track rental income, expenses, documents, and property performance in one straightforward iPhone app built for independent landlords." />
<link rel="canonical" href="https://managestate.app/" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="ManageState" />
<meta property="og:title" content="Property Management App for Landlords | ManageState" />
<meta property="og:description" content="Track rental income, expenses, documents, and property performance in one straightforward iPhone app built for independent landlords." />
<meta property="og:url" content="https://managestate.app/" />
<meta property="og:image" content="https://managestate.app/social/managestate-og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Property Management App for Landlords | ManageState" />
<meta name="twitter:description" content="Track rental income, expenses, documents, and property performance in one straightforward iPhone app built for independent landlords." />
<meta name="twitter:image" content="https://managestate.app/social/managestate-og.png" />
```

Emit `Organization` and `SoftwareApplication` JSON-LD as two `<script type="application/ld+json">`
blocks in the same `<head>`. Because `index.html` is a static template, generate the JSON once
with `node scripts/seo/print-schema.mjs` and paste the output, or add a tiny Vite
`transformIndexHtml` plugin — either is acceptable as long as the JSON-LD is present in the
served HTML without executing application JavaScript.

Create the 1200 × 630 social image from approved brand assets. No Vite or React default assets.

- [ ] **Step 5: Verify the served HTML and the unchanged design**

Run: `cd source && npm run build && node --test tests/seo/schema.test.mjs && npm run check:visual`
Expected: schema tests PASS; `dist/index.html` contains every tag above; **visual diff PASSES** —
`<head>` changes are invisible.

- [ ] **Step 6: Commit metadata**

```bash
git add source/index.html source/src/lib/seo.js source/src/lib/schema.js source/tests/seo/schema.test.mjs source/public/social/managestate-og.png
git commit -m "feat(site): add static metadata and structured data"
```

### Task 3: Publish crawl assets

**Files:**
- Create: `source/public/robots.txt`
- Create: `source/public/sitemap.xml`
- Create: `source/scripts/seo/validate-dist.mjs`
- Create: `source/tests/seo/validate-dist.test.mjs`
- Modify: `source/package.json`
- Delete: `source/public/vite.svg`

**Interfaces:**
- Consumes: the built `dist/` directory.
- Produces: `check:dist`, a release-blocking static-output validator.

- [ ] **Step 1: Write the failing dist contract test**

Assert that the validator rejects: a missing or duplicate `<title>`, a missing meta description,
a missing or non-self-referencing canonical, a missing `<h1>`, a missing `robots.txt` or
`sitemap.xml`, a sitemap URL absent from the build, an `href="#"`, any reference to `vite.svg`,
any `apps.apple.com` link that does not match the App Store contract, and a missing Plausible
script tag. Use small HTML fixtures under `source/tests/fixtures/dist/`.

- [ ] **Step 2: Author the crawl assets**

```text
# source/public/robots.txt
User-agent: *
Allow: /

Sitemap: https://managestate.app/sitemap.xml
```

`sitemap.xml` lists exactly the currently reachable canonical URLs — at this point
`https://managestate.app/`, `/privacy-policy.html`, and `/contact.html`. This hand-written file
is temporary: Phase 1b replaces it with generated output and updates `robots.txt` to
`sitemap-index.xml`.

- [ ] **Step 3: Implement `validate-dist.mjs`**

Walk every HTML file in `dist/`. Enforce unique titles, descriptions, canonicals and H1s; exactly
one canonical per page whose value matches the file's path; no `href="#"`; no `vite.svg` or React
default assets; every `apps.apple.com` href matching the Task 4 contract exactly; the Plausible
script present with the correct domain; `robots.txt` and `sitemap.xml` present; and every sitemap
URL resolving to a built file. Print file-specific errors and exit non-zero.

- [ ] **Step 4: Wire the verification command**

```json
"verify": "npm run lint && npm run test:baseline && npm run check:baseline && node --test tests/seo/ && npm run build && npm run check:dist && npm run check:images"
```

Run: `cd source && npm run verify`
Expected: PASS. `check:images` arrives in Task 6 — add it there and leave the script name in place
only once it exists.

- [ ] **Step 5: Commit crawl assets**

```bash
git add source/public/robots.txt source/public/sitemap.xml source/scripts/seo/validate-dist.mjs source/tests/seo/validate-dist.test.mjs source/tests/fixtures/dist source/package.json
git rm source/public/vite.svg
git commit -m "feat(site): publish robots, sitemap, and dist validation"
```

### Task 4: Replace App Store links with the attributed URL contract

**Files:**
- Create: `source/src/lib/app-store.js`
- Create: `source/tests/seo/app-store.test.mjs`
- Modify: `source/src/components/Navbar.jsx`
- Modify: `source/src/components/Hero.jsx`
- Modify: `source/src/components/Footer.jsx`

**Interfaces:**
- Consumes: `site.json` and a campaign name.
- Produces: `buildAppStoreUrl(campaign)` and the data attributes consumed by analytics.

- [ ] **Step 1: Write failing URL tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppStoreUrl } from '../../src/lib/app-store.js';

test('builds the verified attributed campaign URL', () => {
  assert.equal(
    buildAppStoreUrl('website-home'),
    'https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-home&mt=8'
  );
});

test('throws on an unapproved campaign rather than emitting an unattributed link', () => {
  assert.throws(() => buildAppStoreUrl('website_home'), /campaign/);
  assert.throws(() => buildAppStoreUrl(''), /campaign/);
  assert.throws(() => buildAppStoreUrl('newsletter'), /campaign/);
});

test('never emits a locale-locked storefront path', () => {
  assert.ok(!buildAppStoreUrl('website-home').includes('/us/'));
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd source && node --test tests/seo/app-store.test.mjs`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Implement the contract**

Read `appStoreId`, `appStoreProviderToken`, and `appStoreCampaigns` from `site.json`. Validate the
campaign against `/^[a-z0-9-]+$/` **and** membership in the approved list. Throw on anything else.
There is no fallback branch: an unapproved campaign is a build-time failure, never a silently
unattributed link.

- [ ] **Step 4: Swap the three existing links**

Replace the hardcoded `https://apps.apple.com/us/app/managestate/id6751497970` in
`Navbar.jsx` (desktop and mobile), `Hero.jsx`, and `Footer.jsx` with
`buildAppStoreUrl('website-home')`. On each anchor add `data-app-store-click`,
`data-page-path`, `data-content-cluster="home"`, `data-cta-placement` (`nav`, `hero`, `footer`),
`data-language="en"`, and `data-campaign="website-home"`.

**Change nothing else in these files.** Keep `target`, `rel`, every className, the `Button`
component, the wrapping markup, the CTA text (`Download for iOS`), and the animation props
byte-for-byte identical. The mobile navbar anchor and the footer `Download` list item keep their
existing position and styling.

- [ ] **Step 5: Verify links, attribution, and the unchanged design**

Run: `cd source && node --test tests/seo/app-store.test.mjs && npm run build && npm run check:dist && npm run check:visual`
Expected: tests PASS, `check:dist` confirms every `apps.apple.com` href matches the contract, and
the **visual diff PASSES** because only `href` and data attributes changed. Manually follow one
built link and confirm it lands on the ManageState listing.

- [ ] **Step 6: Commit the conversion contract**

```bash
git add source/src/lib/app-store.js source/tests/seo/app-store.test.mjs source/src/components/Navbar.jsx source/src/components/Hero.jsx source/src/components/Footer.jsx
git commit -m "feat(site): attribute App Store links to verified campaigns"
```

### Task 5: Disclose and install analytics

**Files:**
- Modify: `source/public/privacy-policy.html`
- Modify: `source/index.html`
- Create: `source/src/lib/analytics.js`
- Modify: `source/src/main.jsx`
- Create: `source/tests/seo/analytics.test.mjs`

**Interfaces:**
- Consumes: `site.json` `plausibleDomain`, and the `data-app-store-click` attributes from Task 4.
- Produces: page views and the `app_store_click` event with `{ page_path, content_cluster, cta_placement, language, campaign }`.

- [ ] **Step 1: Ship the disclosure first**

Add a factual analytics section to `source/public/privacy-policy.html`: Plausible Analytics is
used; it is cookieless and collects no personally identifiable information; an outbound event
named `app_store_click` records the page path, content cluster, CTA placement, language, and
campaign identifier when an App Store link is clicked. State the effective date. Do not draft
retention, encryption, warranty, or compliance language.

This step must be committed and deployed **before or with** Step 3, never after.

- [ ] **Step 2: Write failing event-payload tests**

Test `buildClickPayload(dataset, pathname)` in isolation: it returns the five required props from
the data attributes; it defaults `language` to `en`; and it returns `null` for an element without
`data-app-store-click`. Test that `trackAppStoreClick` never throws when `window.plausible` is
undefined and never calls `preventDefault`.

- [ ] **Step 3: Add the script and the listener**

In `source/index.html`, add the Plausible script with `defer`, `data-domain="managestate.app"`,
and the `script.outbound-links.js` variant if outbound tracking is wanted. The domain is a
literal, matching `site.json`; there is no environment variable and no conditional.

In `source/src/lib/analytics.js`, register one `document`-level `click` listener that finds the
closest `[data-app-store-click]`, builds the payload, and calls `window.plausible?.('app_store_click', { props })`.
It must not call `preventDefault`, must not await anything, and must not throw when Plausible is
blocked. Register it once from `source/src/main.jsx`.

- [ ] **Step 4: Verify behaviour including the failure path**

Run: `cd source && node --test tests/seo/analytics.test.mjs && npm run build && npm run check:dist && npm run check:visual`

Then in `npm run preview`, with a network block on `plausible.io`, click every CTA — the App Store
page must still open every time. With the block removed, confirm one `app_store_click` event per
placement arrives in Plausible with all five props.

- [ ] **Step 5: Commit analytics**

```bash
git add source/public/privacy-policy.html source/index.html source/src/lib/analytics.js source/src/main.jsx source/tests/seo/analytics.test.mjs
git commit -m "feat(site): measure App Store conversion with Plausible"
```

### Task 6: Bring images inside budget without changing appearance

**Files:**
- Modify: `source/public/img/*`, `source/public/screens/*`, `source/public/app-mockup.png`
- Modify: `source/src/components/Features.jsx`, `source/src/components/HeroScrollDemo.jsx`, `source/src/components/Navbar.jsx`
- Create: `source/scripts/seo/check-images.mjs`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: the built `dist/` asset tree.
- Produces: `check:images`, enforcing the design §7.1 budgets.

- [ ] **Step 1: Record the current weights**

Observed on 2026-08-21: `img/centralize.PNG` 1,030 KB, `img/yourpropertyfinances.PNG` 646 KB,
`app-mockup.png` 397 KB, `img/global.jpeg` 266 KB, `img/trackeverydollar.PNG` 217 KB,
`img/makedatadriven.PNG` 210 KB, each `screens/*.png` roughly 250 KB, `img/logo.png` 68 KB.
Write the observed table into the phase release log before changing anything.

- [ ] **Step 2: Implement the budget check**

`check-images.mjs` walks `dist/`, fails when any single image exceeds 250 KB, and fails when the
total weight of images referenced by `dist/index.html` exceeds 1.2 MB. Print each offender with
its size. Add `"check:images": "node scripts/seo/check-images.mjs"` and confirm it is in `verify`.

- [ ] **Step 3: Re-encode without changing rendered output**

For each raster asset: resize to at most twice its maximum rendered CSS width, then re-encode
(`oxipng -o4 --strip safe` for PNG, quality 82 for JPEG). Keep the same filenames, the same
formats, and the same aspect ratios so no markup or styling changes. Do not introduce
`<picture>`, `srcset`, or format switching in this phase — those change markup, and the budget is
reachable without them.

- [ ] **Step 4: Add dimensions, lazy loading, and alt text**

On each `<img>` add explicit `width` and `height` matching the intrinsic size, `decoding="async"`,
and `loading="lazy"` for every image below the fold — the four `Features` images and the
`screens/*` assets. The hero image stays eager. Replace any empty or generic `alt` with a
descriptive one, for example `ManageState dashboard showing monthly rental income and expenses`.

Explicit dimensions can only *reduce* layout shift; they must not alter final layout. If the
visual diff fails after this step, the declared dimensions are wrong — fix the numbers, do not
raise the tolerance.

- [ ] **Step 5: Verify budgets, vitals, and appearance**

Run: `cd source && npm run build && npm run check:images && npm run check:visual`
Expected: every image ≤ 250 KB, homepage image payload ≤ 1.2 MB, and the **visual diff PASSES**.
Then run Lighthouse against `npm run preview` and record LCP, CLS and TBT against the §7.1
budgets in the release log.

- [ ] **Step 6: Commit image work**

```bash
git add source/public source/src/components/Features.jsx source/src/components/HeroScrollDemo.jsx source/src/components/Navbar.jsx source/scripts/seo/check-images.mjs source/package.json
git commit -m "perf(site): bring image payload inside budget"
```

### Task 7: Collapse the publish path and gate deployment

**Files:**
- Modify: `.github/workflows/workflow_dispatch.yml`
- Create: `.github/workflows/verify.yml`
- Create: `AGENTS.md`
- Modify: `README.md` (repository root)
- Modify: `source/package.json`
- Delete: stale root build artifacts

**Interfaces:**
- Consumes: `source/dist` and the repository-root Pages metadata.
- Produces: one verified publish path.

- [ ] **Step 1: Prove which path actually serves the site**

Confirm in repository settings that Pages deploys from GitHub Actions, and confirm the most recent
successful run of `workflow_dispatch.yml` produced the live site. Record the run URL. Do not
delete anything until this is confirmed.

- [ ] **Step 2: Reconcile root artifacts against `source/public`**

Diff the root duplicates against `source/public` before deleting. `img/ManageState logo.png`
exists at the root but not in `source/public/img/` — move any such unique asset into
`source/public/` first, then delete the root copies:

```bash
git rm -r --cached assets img screens app-mockup.png contact.html privacy-policy.html index.html vite.svg
rm -r assets img screens app-mockup.png contact.html privacy-policy.html index.html vite.svg
```

Keep `CNAME`, `.nojekyll`, `.github/`, `README.md`, `AGENTS.md`, `managestate-seo-documents/`, and
`source/` at the root. Remove the `"deploy": "vite build && cp -R dist/* ../"` script from
`source/package.json` so the second publish path cannot be re-triggered.

- [ ] **Step 3: Gate the deploy on verification**

In `workflow_dispatch.yml`, add `npm run verify` in `./source` before the build step, keep Node
`22.13.0`, and keep the step that copies `CNAME` and `.nojekyll` into `source/dist`. Remove the
now-unused `PUBLIC_PLAUSIBLE_DOMAIN` environment variable — the domain is a constant. Add
`.github/workflows/verify.yml` running the same `npm ci && npm run verify` on pull requests.
Neither workflow runs `check:visual`.

- [ ] **Step 4: Document the repository contract**

Create `AGENTS.md` at the root:

```markdown
# Repository instructions

- The canonical repository for this site is `polmonta/polmonta.github.io`; the deployed site is `https://managestate.app`.
- `source/` is the only editable site application. Run all site commands from `source/`.
- The required verification command is `npm run verify`. The homepage visual gate is `npm run check:visual`, run locally.
- The existing homepage visual design is frozen. See `managestate-seo-documents/01-strategy/seo-growth-design.md` §6.1.
- Preserve `CNAME` and `.nojekyll` at the repository root.
- Do not re-add generated build output to the repository root and do not add a `deploy` script.
- Do not commit `source/dist/`, `source/node_modules/`, `.lighthouseci/`, `test-results/`, or anything under `source/seo-ops/private/`.
```

Update the root `README.md` to describe the single publish path and the verification commands.

- [ ] **Step 5: Deploy and verify production**

Run `cd source && npm run verify && npm run check:visual`, merge, and let the workflow deploy.
Then confirm on the live site: `https://managestate.app/robots.txt` returns 200,
`https://managestate.app/sitemap.xml` returns 200, the homepage source contains the title,
description, canonical, Open Graph tags and both JSON-LD blocks, and the page renders identically
to before.

- [ ] **Step 6: Commit the publish path**

```bash
git add .github/workflows/workflow_dispatch.yml .github/workflows/verify.yml AGENTS.md README.md source/package.json
git commit -m "ci(site): verify before deploy and remove the stale publish path"
```

### Task 8: Submit for indexing and record the release

**Files:**
- Create: `managestate-seo-documents/04-releases/phase-1a-launch-log.md`

- [ ] **Step 1: Submit the sitemap**

In Search Console, submit `https://managestate.app/sitemap.xml`. Record the submission date and
the reported status. Do not record success until it is observed.

- [ ] **Step 2: Inspect the homepage**

Run URL Inspection on `https://managestate.app/`. Record indexing status, the canonical Google
selected, mobile usability, and any structured-data findings. Request indexing once.

- [ ] **Step 3: Confirm measurement is live**

Confirm a page view in Plausible from a real visit, and one `app_store_click` event per placement
with all five props. Confirm the App Store Connect campaign `website-home` shows attributed
product-page views once traffic exists; record `not yet available` if it does not.

- [ ] **Step 4: Write the release log**

Record: deployment date and run URL; before/after image weights; measured LCP, CLS, TBT; visual
diff result per viewport; sitemap submission date; URL Inspection result; analytics verification;
and every residual risk. State plainly what was not done.

- [ ] **Step 5: Commit the log**

```bash
git add managestate-seo-documents/04-releases/phase-1a-launch-log.md
git commit -m "docs(seo): record phase 1a technical baseline release"
```

## Phase 1a Exit Gate

Run:

```bash
cd source
npm ci
npm run verify
npm run check:visual
npm run preview
```

Proceed to Phase 1b only when:

- `verify` passes end to end and `check:visual` reports **zero** failing viewports.
- The served `dist/index.html` contains title, description, canonical, Open Graph, Twitter, and both JSON-LD blocks, with no application JavaScript executed.
- `robots.txt` and `sitemap.xml` are live and return 200 in production.
- Every App Store link in the build matches the attributed contract, and no `/us/` storefront path or unattributed link remains.
- The privacy disclosure is live and predates or accompanies the analytics script.
- Clicking every CTA with Plausible blocked still opens the App Store.
- No image exceeds 250 KB, the homepage image payload is under 1.2 MB, and Core Web Vitals are inside §7.1 budgets.
- Exactly one publish path exists: no root build artifacts, no `deploy` script, `CNAME` and `.nojekyll` preserved by the workflow.
- The sitemap is submitted and the homepage has been inspected in Search Console.
- The release log records observed values and residual risks.
