# SEO Phase 1b: Astro Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21 (replaces revision 1's "Phase 1: Astro and Technical Foundation")
**Goal:** Move the build to Astro static output so that Phase 2 can add crawlable content routes, while mounting the existing React homepage **verbatim** as islands so the rendered design does not change.

**Architecture:** Astro owns routing, `<head>`, structured data, the sitemap, and all new routes. `src/pages/index.astro` imports the existing `Navbar`, `Hero`, `Features`, `Testimonials`, and `Footer` components unchanged and hydrates them as islands. Legal and contact routes are server-rendered Astro. Everything Phase 1a built in `src/lib/` and `scripts/seo/` is reused, not rewritten.

**Tech Stack:** Astro 7.1.6, React 19.2.0, `@astrojs/react` 6.0.2, `@astrojs/sitemap` 3.7.3, `@astrojs/tailwind` 6.0.2, `@astrojs/mdx` 7.0.5, Tailwind CSS 3.4.19, Vitest 4.1.10, jsdom 29, `@playwright/test`, Lighthouse CI 0.15.1, Node.js 22.13.0.

> These exact pins were installed and built successfully in this repository on 2026-08-17 (18 static pages, full verification green) before the revert. They are known-good, not guesses.

## Global Constraints

- Phase 1a exit gate must pass first. Its metadata, crawl assets, App Store contract, analytics, and image budgets are inputs to this phase, not things to redo.
- **The homepage React components are mounted, not ported.** Their JSX, className strings, animation props, copy, and structure are not edited in this phase. If a component needs a change to mount, wrap it — do not rewrite it.
- The visual diff gate runs at a **≤ 1.0 %** tolerance and is a mandatory exit condition. A failure means the mounting is wrong, never that the tolerance is too tight.
- English remains the root language. No `/es/` or `/ca/` routes in this phase.
- Static `dist/` output only. `CNAME` and `.nojekyll` continue to be copied into the artifact.
- No `/terms/` page is authored. Terms continues to link Apple's standard EULA.
- Primary copy, metadata, links, and structured data must exist in HTML without client JavaScript on every route except the homepage's already-hydrated interactive sections.

---

### Task 1: Migrate the build to Astro with a test harness

**Files:**
- Modify: `source/package.json`, `source/package-lock.json`
- Create: `source/astro.config.mjs`
- Create: `source/vitest.config.mjs`
- Modify: `source/eslint.config.js`
- Modify: `source/tailwind.config.js`
- Modify: `source/playwright.config.js`
- Delete: `source/vite.config.js`, `source/index.html`, `source/src/main.jsx`, `source/src/App.jsx`, `source/src/App.css`, `source/src/assets/react.svg`

**Interfaces:**
- Consumes: the canonical site URL and the existing Tailwind configuration.
- Produces: `npm run dev`, `build`, `preview`, `test`, `lint`, and `verify` for the Astro site.

- [ ] **Step 1: Add a failing configuration test**

```js
// source/tests/config/astro-config.test.mjs
import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('Astro configuration', () => {
  it('builds the canonical static site with directory URLs', () => {
    expect(config.site).toBe('https://managestate.app');
    expect(config.output).toBe('static');
    expect(config.build.format).toBe('directory');
  });
});
```

- [ ] **Step 2: Install the pinned dependencies and remove the rolldown override**

```bash
cd source
npm install astro@7.1.6 @astrojs/react@6.0.2 @astrojs/sitemap@3.7.3 @astrojs/tailwind@6.0.2 @astrojs/mdx@7.0.5 tailwindcss@3.4.19
npm install -D vitest@4.1.10 jsdom@29.0.0 @lhci/cli@0.15.1
npm uninstall vite @vitejs/plugin-react eslint-plugin-react-refresh
```

**Then delete the `"overrides": { "vite": "npm:rolldown-vite@7.2.5" }` block and the
`"vite": "npm:rolldown-vite@7.2.5"` devDependency from `package.json`, and reinstall.** Astro
ships its own Vite; leaving the rolldown alias in place forces Astro onto an unsupported Vite
build and is the most likely cause of an unexplained migration failure.

Expected: the lockfile updates with no peer-dependency errors, and `npx astro --version` reports
7.1.6.

- [ ] **Step 3: Create the Astro and Vitest configuration**

```js
// source/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://managestate.app',
  output: 'static',
  build: { format: 'directory' },
  integrations: [react(), mdx(), sitemap(), tailwind({ applyBaseStyles: false })]
});
```

```js
// source/vitest.config.mjs
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.mjs'], exclude: ['tests/visual/**'] }
});
```

Update `tailwind.config.js` `content` to `['./src/**/*.{astro,js,jsx,md,mdx}']` so both Astro and
JSX files are scanned. **Do not change the theme, colors, fonts, spacing, or plugins** — the
existing CSS-variable palette in `src/index.css` is the frozen design.

Update scripts:

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "test": "vitest run",
  "lint": "eslint .",
  "check:baseline": "node scripts/seo/validate-baseline-data.mjs",
  "check:dist": "node scripts/seo/validate-dist.mjs",
  "check:images": "node scripts/seo/check-images.mjs",
  "check:lighthouse": "lhci autorun --config=lighthouserc.cjs",
  "check:visual": "playwright test",
  "check:visual:update": "playwright test --update-snapshots",
  "test:baseline": "node --test tests/seo/validate-baseline-data.test.mjs",
  "verify": "npm run lint && npm run test:baseline && npm run check:baseline && npm test && npm run build && npm run check:dist && npm run check:images && npm run check:lighthouse"
}
```

Update ESLint to lint `js`, `jsx`, `mjs` and `astro`, ignore `dist`, `.astro`, `test-results`, and
drop the Vite-only React Refresh preset.

In `playwright.config.js`, change `baseURL` and `webServer.url` to `http://localhost:4321`
(Astro's preview port). **Do not regenerate the screenshot baselines** — they are the Phase 1a
reference and are what this phase is measured against.

- [ ] **Step 4: Remove the Vite entry points and run the config test**

Delete `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, and
`src/assets/react.svg`. Their responsibilities move to `index.astro` and `BaseLayout.astro`.
Keep `src/index.css`, `src/components/`, and `src/lib/` untouched.

Run: `cd source && npx vitest run tests/config/astro-config.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit the build migration**

```bash
git add source/package.json source/package-lock.json source/astro.config.mjs source/vitest.config.mjs source/eslint.config.js source/tailwind.config.js source/playwright.config.js source/tests/config/astro-config.test.mjs
git rm source/vite.config.js source/index.html source/src/main.jsx source/src/App.jsx source/src/App.css source/src/assets/react.svg
git commit -m "build(site): migrate the build from Vite to Astro"
```

### Task 2: Implement the SEO layout on top of the Phase 1a modules

**Files:**
- Create: `source/src/layouts/BaseLayout.astro`
- Create: `source/src/components/SeoHead.astro`
- Modify: `source/src/lib/seo.js`
- Create: `source/tests/seo/page-meta.test.mjs`

**Interfaces:**
- Consumes: `site.json` and page props `{ title, description, path, lang, image, alternates, schemas, noindex }`.
- Produces: `buildPageMeta(input)` and a complete static `<head>` for every route.

- [ ] **Step 1: Write failing metadata tests**

```js
import { describe, expect, it } from 'vitest';
import { buildPageMeta, canonicalUrl } from '../../src/lib/seo.js';

it('returns complete English metadata', () => {
  const meta = buildPageMeta({
    title: 'Property Management App for Landlords | ManageState',
    description: 'Track rental income, expenses, documents, and property performance in one straightforward iPhone app built for independent landlords.',
    path: '/'
  });
  expect(meta.lang).toBe('en');
  expect(meta.canonical).toBe('https://managestate.app/');
  expect(meta.og.type).toBe('website');
  expect(meta.og.image).toBe('https://managestate.app/social/managestate-og.png');
  expect(meta.robots).toBe('index, follow, max-image-preview:large');
});

it('rejects an empty title or description', () => {
  expect(() => buildPageMeta({ title: '', description: 'x'.repeat(120), path: '/' })).toThrow();
  expect(() => buildPageMeta({ title: 'Valid title here', description: '', path: '/' })).toThrow();
});

it('supports an explicit noindex for redirect stubs', () => {
  const meta = buildPageMeta({ title: 'Moved', description: 'x'.repeat(120), path: '/old/', noindex: true });
  expect(meta.robots).toBe('noindex, follow');
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd source && npx vitest run tests/seo/page-meta.test.mjs`
Expected: FAIL — `buildPageMeta` does not exist yet.

- [ ] **Step 3: Extend `seo.js` and implement `SeoHead`**

Keep `canonicalUrl` from Phase 1a unchanged. Add `buildPageMeta`, which throws on an empty title
or description, defaults `lang` to `en`, defaults the image to `/social/managestate-og.png`, and
returns canonical, robots, Open Graph, and Twitter values. `SeoHead.astro` renders canonical,
robots, description, Open Graph, Twitter card, alternate language links, and each JSON-LD object
passed in `schemas`.

- [ ] **Step 4: Create `BaseLayout.astro`**

The layout renders `<html lang>`, `<SeoHead>`, the existing favicon and Apple touch icon links, a
skip link, `<slot />`, and the Plausible script with the literal domain from `site.json`. It
imports `../index.css` once. It registers the `app_store_click` listener from
`src/lib/analytics.js` in a single `<script>` tag, replacing the deleted `main.jsx` registration.

The layout adds **no visual chrome of its own** — no header, no footer, no wrapper padding. On the
homepage those come from the existing React components; on content pages they come from Phase 2's
`AcquisitionLayout`.

- [ ] **Step 5: Run the tests**

Run: `cd source && npx vitest run tests/seo/page-meta.test.mjs`
Expected: PASS. The build has no routes yet; that is expected until Task 3.

- [ ] **Step 6: Commit the SEO layout**

```bash
git add source/src/layouts/BaseLayout.astro source/src/components/SeoHead.astro source/src/lib/seo.js source/tests/seo/page-meta.test.mjs
git commit -m "feat(site): add the canonical Astro SEO layout"
```

### Task 3: Mount the existing homepage verbatim

**Files:**
- Create: `source/src/pages/index.astro`
- Create: `source/tests/pages/homepage.test.mjs`
- Create: `source/tests/pages/component-integrity.test.mjs`

**Interfaces:**
- Consumes: the unmodified `Navbar`, `Hero`, `HeroScrollDemo`, `Features`, `Testimonials`, and `Footer` components, plus `Button` and `container-scroll-animation`.
- Produces: statically rendered `/` whose visible output matches the Phase 1a baselines.

- [ ] **Step 1: Write the failing homepage and integrity contracts**

`homepage.test.mjs` reads `dist/index.html` after a build and asserts: exactly one `<h1>`; the
title, description, canonical, Open Graph tags and both JSON-LD blocks are present; no `href="#"`;
no `vite.svg`; the Plausible script is present; and every `apps.apple.com` href matches the
Phase 1a contract with `data-cta-placement` values `nav`, `hero`, and `footer`.

`component-integrity.test.mjs` asserts that the six homepage component files are **byte-identical**
to their Phase 1a versions, by comparing a SHA-256 of each file against a committed manifest:

```js
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './component-integrity.manifest.json' with { type: 'json' };

describe('frozen homepage components', () => {
  for (const [file, expected] of Object.entries(manifest)) {
    it(`${file} is unchanged`, () => {
      const actual = createHash('sha256').update(readFileSync(new URL(`../../${file}`, import.meta.url))).digest('hex');
      expect(actual).toBe(expected);
    });
  }
});
```

Generate the manifest from the Phase 1a commit. Changing a frozen component now requires
deliberately updating the manifest, which makes the change visible in review instead of silent.

- [ ] **Step 2: Run the contracts and verify failure**

Run: `cd source && npm run build && npx vitest run tests/pages/`
Expected: FAIL — `/` does not exist yet.

- [ ] **Step 3: Mount the components as islands**

```astro
---
// source/src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Footer from '../components/Footer.jsx';
import { buildOrganizationSchema, buildSoftwareApplicationSchema } from '../lib/schema.js';
import reviews from '../data/evidence/app-store-reviews.json';

const meta = {
  title: 'Property Management App for Landlords | ManageState',
  description: 'Track rental income, expenses, documents, and property performance in one straightforward iPhone app built for independent landlords.',
  path: '/'
};
const schemas = [buildOrganizationSchema(), buildSoftwareApplicationSchema({ reviews })];
---
<BaseLayout {...meta} schemas={schemas}>
  <div class="min-h-screen bg-white font-sans antialiased selection:bg-primary/20 selection:text-primary">
    <Navbar client:load />
    <main>
      <Hero client:load />
      <Features client:visible />
      <Testimonials client:visible />
    </main>
    <Footer client:load />
  </div>
</BaseLayout>
```

The wrapper `div` reproduces the deleted `App.jsx` root element exactly, including its class list.
`HeroScrollDemo` is not imported here — it is already rendered inside `Hero`, exactly as before.
`Navbar` and `Footer` use `client:load` because they own scroll state, the mobile menu, and
tracked links; `Features` and `Testimonials` use `client:visible`.

Do not touch any of the six component files.

- [ ] **Step 4: Build and compare against the frozen baselines**

Run: `cd source && npm run build && npx vitest run tests/pages/ && npm run check:visual`

Expected: contracts PASS and the **visual diff PASSES at ≤ 1.0 %**. If it fails, the cause is in
`index.astro`, `BaseLayout.astro`, the Tailwind content globs, or a missing global stylesheet
import — fix the mounting. Do not edit a component, do not restyle, and do not raise the
tolerance.

Common causes, in order of likelihood: `index.css` not imported by the layout; Tailwind `content`
missing `.astro`; the `App.jsx` wrapper classes omitted; an island hydrated with `client:visible`
that needs `client:load` for above-the-fold animation.

- [ ] **Step 5: Confirm interactive behaviour by hand**

In `npm run preview`: the mobile menu opens and closes; the hero headline still cycles through its
five variants; the testimonial carousel still scrolls; the feature animations still trigger on
scroll; every CTA still opens the App Store. Check at 390 px and 1440 px.

- [ ] **Step 6: Commit the homepage**

```bash
git add source/src/pages/index.astro source/tests/pages
git commit -m "feat(site): render the existing homepage through Astro islands"
```

### Task 4: Add legal, contact, 404, and redirect-stub routes

**Files:**
- Create: `source/src/pages/privacy.astro`
- Create: `source/src/pages/contact.astro`
- Create: `source/src/pages/404.astro`
- Create: `source/src/components/site/RedirectStub.astro`
- Create: `source/src/pages/privacy-policy.html.astro`
- Create: `source/src/pages/contact.html.astro`
- Delete: `source/public/privacy-policy.html`, `source/public/contact.html`
- Modify: `source/src/components/Footer.jsx`
- Create: `source/tests/pages/routes.test.mjs`

**Interfaces:**
- Consumes: the existing approved privacy and contact copy from the Phase 1a HTML files.
- Produces: `/privacy/`, `/contact/`, `/404.html`, and two `noindex` redirect stubs.

- [ ] **Step 1: Write the failing route contract**

Assert that `/privacy/`, `/contact/` and `404.html` are built; that each content route
self-canonicalizes; that `/privacy/` contains the Plausible and `app_store_click` disclosure;
that both stubs carry `noindex`, a canonical pointing at the successor URL, a `meta refresh`, and
a visible link; and that no stub appears in the sitemap.

- [ ] **Step 2: Migrate the existing copy without inventing legal language**

Move the body content of `source/public/privacy-policy.html` into `privacy.astro` and
`source/public/contact.html` into `contact.astro`, preserving the wording, the effective date, and
the Phase 1a analytics disclosure. Style them with the existing Tailwind tokens.

**Do not author warranty, retention, encryption, compliance, or terms-of-service language.** No
`/terms/` route is created; the footer's Terms link continues to point at Apple's standard EULA.

- [ ] **Step 3: Implement the redirect stubs**

`RedirectStub.astro` takes a `to` path and renders a minimal `noindex` page with
`<link rel="canonical" href={canonicalUrl(to)}>`, `<meta http-equiv="refresh" content={'0; url=' + to}>`,
and a visible "This page has moved" link. GitHub Pages cannot issue a 301, so this is the
strongest available signal. Use it for `/privacy-policy.html` → `/privacy/` and
`/contact.html` → `/contact/`, which are the two URLs currently linked from the live footer.

- [ ] **Step 4: Repoint the footer links**

In `Footer.jsx`, change the privacy `href` to `/privacy/` and the contact `href` to `/contact/`,
and drop `target="_blank"` on both since they are now internal routes. Leave the Terms link, the
LinkedIn link, the App Store link, and every className untouched.

This is the one permitted edit to a frozen component in this phase. Update the
`component-integrity.manifest.json` hash for `Footer.jsx` in the same commit so the change is
explicit, and re-run `check:visual` — removing `target="_blank"` changes no pixels.

- [ ] **Step 5: Verify routes and appearance**

Run: `cd source && npm run build && npx vitest run tests/pages/ && npm run check:visual`
Expected: all routes built, contracts PASS, visual diff PASSES.

- [ ] **Step 6: Commit the routes**

```bash
git add source/src/pages/privacy.astro source/src/pages/contact.astro source/src/pages/404.astro source/src/pages/privacy-policy.html.astro source/src/pages/contact.html.astro source/src/components/site/RedirectStub.astro source/src/components/Footer.jsx source/tests/pages/routes.test.mjs source/tests/pages/component-integrity.manifest.json
git rm source/public/privacy-policy.html source/public/contact.html
git commit -m "feat(site): add legal, contact, 404, and redirect-stub routes"
```

### Task 5: Switch to the generated sitemap and extend validation

**Files:**
- Modify: `source/public/robots.txt`
- Delete: `source/public/sitemap.xml`
- Modify: `source/scripts/seo/validate-dist.mjs`
- Create: `source/lighthouserc.cjs`
- Modify: `source/tests/seo/validate-dist.test.mjs`

- [ ] **Step 1: Extend the dist validator first**

Add release-blocking assertions: `sitemap-index.xml` and its child sitemap exist and parse; every
canonical indexable route appears exactly once; no `noindex` page and no redirect stub appears at
all; `CNAME` and `.nojekyll` are present in the artifact; `404.html` exists; each JSON-LD block
parses as valid JSON; and no `Review` or `aggregateRating` node appears anywhere in the output.

That last assertion is the mechanical guard for design §15.3 — it makes it impossible to promote
the retained homepage testimonials into structured data by accident.

- [ ] **Step 2: Point robots at the generated sitemap**

Replace the `Sitemap:` line with `https://managestate.app/sitemap-index.xml` and delete the
hand-written `public/sitemap.xml`, which `@astrojs/sitemap` now supersedes.

- [ ] **Step 3: Add Lighthouse budgets**

`lighthouserc.cjs` with `staticDistDir: './dist'`, one local run, filesystem reports under an
ignored `.lighthouseci/`, and release-blocking maximums of 2,500 ms LCP, 0.10 CLS, and 200 ms TBT
across `/`, `/privacy/`, and `/contact/`. Field INP is monitored later in Search Console.

- [ ] **Step 4: Run full verification**

Run: `cd source && npm run verify && npm run check:visual`
Expected: lint, baseline validation, unit tests, build, dist validation, image budgets, and
Lighthouse all PASS, and the visual diff PASSES.

- [ ] **Step 5: Commit the release gates**

```bash
git add source/public/robots.txt source/scripts/seo/validate-dist.mjs source/tests/seo/validate-dist.test.mjs source/lighthouserc.cjs source/.gitignore
git rm source/public/sitemap.xml
git commit -m "feat(site): enforce Astro technical SEO release gates"
```

### Task 6: Deploy, re-submit the sitemap, and record the release

**Files:**
- Modify: `.github/workflows/workflow_dispatch.yml`, `.github/workflows/verify.yml`
- Modify: `source/README.md`, `AGENTS.md`
- Create: `managestate-seo-documents/04-releases/phase-1b-launch-log.md`

- [ ] **Step 1: Confirm CI still gates the deploy**

`verify` now includes the Astro build and Lighthouse. Confirm both workflows still run
`npm ci && npm run verify` in `./source` on Node `22.13.0`, that the deploy still copies `CNAME`
and `.nojekyll` into `source/dist`, and that neither workflow runs `check:visual`. If Lighthouse
proves unstable on the runner, move `check:lighthouse` out of CI into a separate local gate rather
than lowering its budgets.

- [ ] **Step 2: Replace the Vite README**

Rewrite `source/README.md` with the Astro commands, the required verification command, the visual
gate and its tolerances, the static `dist/` output, the App Store campaign contract, and an
explicit statement that the homepage components are frozen. Update `AGENTS.md` to name Astro.

- [ ] **Step 3: Deploy and verify production**

After merge, confirm on the live site: `/` renders identically to before; `/privacy/`, `/contact/`
and a deliberately bad URL (serving `404.html`) all work; `/privacy-policy.html` and
`/contact.html` still resolve and forward; `robots.txt` points at `sitemap-index.xml`; and
`sitemap-index.xml` returns 200 with every expected URL. View source with JavaScript disabled and
confirm metadata and structured data are present.

- [ ] **Step 4: Update Search Console**

Submit `https://managestate.app/sitemap-index.xml`. **Remove the now-deleted `sitemap.xml`
submission** so it does not accumulate fetch errors. Run URL Inspection on `/`, `/privacy/`, and
`/contact/`, and record each result. Confirm the Rich Results test reports valid `Organization`
and `SoftwareApplication` and no review markup.

- [ ] **Step 5: Write and commit the release log**

Record: deployment date and run URL; the visual diff result per viewport; hydration directives
used per component; Lighthouse numbers; every route verified in production; sitemap resubmission;
URL Inspection results; and residual risks.

```bash
git add .github/workflows source/README.md AGENTS.md managestate-seo-documents/04-releases/phase-1b-launch-log.md
git commit -m "docs(seo): record the Astro shell release"
```

## Phase 1b Exit Gate

Run:

```bash
cd source
npm ci
npm run verify
npm run check:visual
npm run preview
```

Proceed to Phase 2 only when:

- `verify` passes end to end and `check:visual` reports **zero** failing viewports at ≤ 1.0 %.
- `component-integrity.test.mjs` passes, with `Footer.jsx` as the only manifest change in this phase.
- `/`, `/privacy/`, `/contact/`, `404.html`, and both redirect stubs are live and correct.
- The mobile menu, hero headline cycle, carousel, and scroll animations all still work at 390 px and 1440 px.
- `sitemap-index.xml` contains only canonical indexable routes; no stub and no `noindex` page appears in it.
- No `Review` or `aggregateRating` markup exists anywhere in the build.
- `CNAME` and `.nojekyll` survive the deploy and the site is reachable at `https://managestate.app`.
- The sitemap has been resubmitted and the stale submission removed in Search Console.
- The release log records observed values and residual risks.
