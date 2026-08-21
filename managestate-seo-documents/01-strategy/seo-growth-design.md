# ManageState SEO Growth Design

**Original design date:** 2026-08-05
**Revision:** 2 — 2026-08-21
**Status:** Approved (revision 2 supersedes revision 1)
**Repository:** `polmonta/polmonta.github.io`
**Site:** https://managestate.app
**Primary conversion:** Apple App Store download

---

## 0. Revision 2 amendments

Revision 1 was written against a different repository (`ManageState/landing-page`) and an
older, dark-themed generation of the landing page. It was implemented once in this
repository on 2026-08-17 and fully reverted on 2026-08-20 because the Astro migration did
not preserve the existing visual design. Revision 2 records the following approved
amendments.

| # | Amendment | Reason |
| --- | --- | --- |
| A1 | The site application lives at `source/`, not `landing-page/`. All strategy, plan, and operational documents live under `managestate-seo-documents/`. | Actual repository layout. |
| A2 | **The existing visual design is frozen.** No restyling, no re-theming, no re-layout, no component redesign of the current homepage. Visual preservation is enforced by a release-blocking screenshot gate, not by reviewer judgement. | The single cause of the 2026-08-20 revert. Owner has confirmed the current design is the intended design. |
| A3 | Phase 1 is split. **Phase 1a** delivers technical SEO on the existing Vite React app with zero framework change. **Phase 1b** introduces Astro as a shell and mounts the existing React homepage components verbatim as islands. | The highest-value technical SEO work carries no framework risk and should not be blocked behind a migration. |
| A4 | GitHub Pages is the confirmed host and its limits are now first-class design constraints: no server-side redirects, no custom headers. Replaced URLs use HTML redirect stubs. | Revision 1 required redirects the host cannot serve. |
| A5 | One page owns one primary query. The fifteen-page inventory is retained in full, with every route assigned a distinct primary query and query type. | Revision 1's inventory had four feature pages shadowed by guides on the same query, plus a homepage shadowed by both an audience page and a guide. |
| A6 | `/features/profitability-roi/` becomes `/features/property-performance/`, scoped to verified monthly per-property performance. An ROI capability page returns to the roadmap when in-app ROI ships. | The evidence register records in-app ROI calculation as unimplemented. The site's ROI *calculator tool* is unaffected. |
| A7 | The App Store destination is a single build-time constant using the verified provider token. No environment variable, no unattributed fallback. Plausible's domain is likewise a constant. | Revision 1 made the entire measurement chain fail silently when a repository variable was unset. |
| A8 | Existing homepage social proof, adoption framing, hero performance wording, and starting-price copy is **retained by owner decision** and recorded as a dated retention exception. It is never promoted to structured data, content pages, or external publications. | Owner decision, 2026-08-21. See §15.3 for the exact strings and the recorded residual risk. |
| A9 | FAQPage structured data is dropped. Visible FAQs are retained. | FAQ rich results have been restricted to government and health sites since 2023; the eligibility judgement is cost without benefit. |
| A10 | Localization requires a minimum-data floor, not only a 90-day wait. | Revision 1's deterministic selector degrades to alphabetical ordering at low data volumes. |
| A11 | Image weight budgets and an image pipeline are explicit requirements. | Revision 1 set a 2,500 ms LCP release gate while the homepage shipped a 1.03 MB PNG. |
| A12 | `/contact/` is a first-class route. No `/terms/` page is authored. | The current footer links `/contact.html`, which revision 1 dropped. The current Terms link is Apple's standard EULA; there is no ManageState terms text to migrate, and none will be drafted. |
| A13 | Guide slugs are informational, not commercial. Five guide URLs are renamed accordingly. | In revision 1 four guide slugs were verbatim copies of a feature or audience page's commercial query, which is how the inventory came to cannibalize itself. A guide slug may never equal another page's primary query. |

---

## 1. Context

ManageState serves self-managing landlords and property investors. Its primary SEO
audience is an individual landlord managing one to five properties; investors with
roughly five to twenty-five properties are the secondary audience.

### Verified current state of the site (observed 2026-08-21)

| Area | Observed state |
| --- | --- |
| Application | Client-rendered Vite + React 19 SPA in `source/`. Light theme (`bg-white`), Tailwind 3, framer-motion animations, Embla carousel. |
| Deployment | GitHub Pages via `.github/workflows/workflow_dispatch.yml`. The workflow builds `source/` and uploads `source/dist`, copying root `CNAME` and `.nojekyll` into the artifact. |
| Stale publish path | Root `index.html`, `assets/`, `img/`, `screens/`, `app-mockup.png`, `contact.html`, `privacy-policy.html` are committed build output from an older manual deploy. `source/package.json` still contains `"deploy": "vite build && cp -R dist/* ../"`, a second, conflicting publish path. |
| Metadata | `<title>ManageState</title>` and a branded favicon are present. No meta description, no canonical, no Open Graph or Twitter tags, no structured data. |
| Crawl assets | `robots.txt` and `sitemap.xml` both return HTTP 404. |
| Conversion | Real App Store links already exist in the navbar, hero and footer, all hardcoded to the locale-locked `https://apps.apple.com/us/app/managestate/id6751497970` with no campaign attribution. No analytics of any kind is installed. |
| Content routes | None. The site is a single page plus two standalone HTML files (`/contact.html`, `/privacy-policy.html`). |
| Social proof | Six fabricated testimonials with invented names and roles, and the line "trusted by investors around the world". Hero badges read "Free to start" and "No credit card required". Retained under A8. |
| Images | `img/centralize.PNG` is 1.03 MB, `img/yourpropertyfinances.PNG` 646 KB, `app-mockup.png` 397 KB, each app screenshot ~250 KB. No optimization, no explicit dimensions, no lazy loading. |
| Headings | One `<h1>` whose trailing clause animates through five variants, all present in the served HTML. |

The referenced seven-step buy-intent pSEO guide recommends finding real buyer questions,
combining parent keywords with audiences and locations, borrowing authority from
established publishing platforms, formatting content for search and generative answers,
and automating publication. ManageState adopts the useful parts of that model and rejects
thin location pages, duplicate articles, fabricated statistics, and automated promotional
spam.

## 2. Goals

1. Make `managestate.app` technically crawlable, indexable, fast, and understandable to search engines and answer engines.
2. Acquire English-speaking landlords actively looking for a property-management app or a replacement for spreadsheets.
3. Convert qualified organic visitors into measurable App Store visits and downloads.
4. Establish a repeatable content system that can later expand into Spanish and Catalan.
5. Use selected external platforms to amplify proven content while keeping `managestate.app` canonical.

## 3. Non-goals

- **Redesigning, restyling, re-theming, or re-laying-out the existing landing page.** See §6.1.
- Generating hundreds of city pages whose content is substantially identical.
- Publishing nightly across automated account networks during the initial rollout.
- Migrating or changing the React Native mobile application.
- Building website account creation, checkout, or lead-nurture flows.
- Authoring terms-of-service, warranty, retention, encryption, or compliance language.
- Claiming download counts, customer counts, savings, security guarantees, or performance statistics without verifiable evidence **on any page other than the retained homepage sections listed in A8**.
- Translating every English page before its topic demonstrates demand.

## 4. Audience and positioning

**Primary audience.** Self-managing landlords with one to five rental properties who want a
simple iPhone app for finances, documents, profitability, tax preparation, and reminders.

**Secondary audience.** Growing property investors with approximately five to twenty-five
properties who need more control than a spreadsheet provides but do not need enterprise
property-management software.

**Positioning.** ManageState is the straightforward property-management app for independent
landlords who want their rental finances, documents, and portfolio performance in one place
without spreadsheet chaos or enterprise complexity.

**Language rollout.** English is canonical and receives the first complete content set.
Spanish follows once English pages clear the §11.4 data floor. Catalan follows Spanish using
the same evidence-based selection. Translations are localized and editorially reviewed, never
raw machine translation.

## 5. Strategic approach

1. Ship technical SEO on the existing application with no framework change (Phase 1a).
2. Introduce Astro as a routing and rendering shell, mounting the existing homepage verbatim (Phase 1b).
3. Publish a controlled wave of fifteen English acquisition pages, one primary query each (Phase 2).
4. Measure indexing, visibility, engagement, App Store clicks, and attributed downloads.
5. Repurpose validated topics onto selected high-authority platforms (Phase 3).
6. Expand winners and localize proven pages once the data floor is met (Phase 4).
7. Introduce draft-only automation after the manual workflow repeatedly produces valid, indexed, converting content (Phase 5).

Sequencing rule: **cheap and reversible before expensive and risky.** Metadata, crawl assets,
attribution, and analytics precede any framework work. The framework precedes content. Content
precedes distribution. Distribution precedes automation.

## 6. Site architecture

### 6.1 Visual preservation contract

The current homepage design is the approved design. It is frozen.

**Prohibited without a new design amendment:** changing colors, typography, spacing, layout,
section order, component structure, animation behavior, copy tone, or any rendered pixel of
`/` beyond what the allowances below permit.

**Permitted changes:** anything invisible to the rendered page — `<head>` metadata, structured
data, `robots.txt`, `sitemap.xml`, link `href` values, `alt` attributes, explicit `width`/
`height`, `loading`/`decoding` attributes, analytics attributes, and image re-encoding that
preserves rendered appearance.

**Enforcement.** `source/tests/visual/` holds committed reference screenshots of `/` at 390 px,
768 px, and 1440 px widths. `npm run check:visual` re-renders and pixel-diffs against them.
Phase 1a tolerance is **≤ 0.5 %** changed pixels; Phase 1b tolerance is **≤ 1.0 %**. The gate
runs locally and is a mandatory phase exit condition. It is excluded from CI to avoid
renderer and font-rasterization flake.

New acquisition pages introduced in Phase 2 reuse the existing Tailwind tokens, type scale,
button component, and section rhythm. They are new pages in the established visual language,
not a new visual language.

### 6.2 Rendering architecture

Phase 1a keeps the Vite SPA and adds static `<head>` content, crawl assets, and structured
data to `source/index.html` and the build output.

Phase 1b introduces Astro as a static shell. Astro owns routing, `<head>`, structured data,
and the sitemap. The existing `Navbar`, `Hero`, `HeroScrollDemo`, `Features`, `Testimonials`,
and `Footer` React components are mounted **as-is** into `src/pages/index.astro` as islands —
`client:load` for the stateful navbar and hero, `client:visible` for the rest. Their JSX is
not rewritten, restyled, or re-authored. Acquisition pages from Phase 2 are pure server-rendered
Astro with no hydration except the ROI calculator.

Output remains a static `dist/` directory published by GitHub Pages.

### 6.3 Host constraints (GitHub Pages)

| Constraint | Consequence for this design |
| --- | --- |
| No server-side redirects | Replaced URLs use an HTML redirect stub: a minimal page carrying `<link rel="canonical">` to the successor plus `<meta http-equiv="refresh" content="0; url=…">` and a visible link. Stubs are `noindex`. |
| No custom headers | No HSTS, CSP, or cache-control tuning from the repository. Not required by this design. |
| `.nojekyll` and `CNAME` must survive every build | The deploy workflow copies both into the artifact. Any workflow change must preserve this step, asserted by `check:dist`. |
| Trailing-slash directory output | Astro uses `build.format: 'directory'`, producing `/path/index.html`. All canonical URLs carry a trailing slash. |
| Custom 404 | `404.html` at the artifact root. |

### 6.4 Route model

| Route | Purpose |
| --- | --- |
| `/` | English conversion homepage (visually frozen) |
| `/features/<feature>/` | Product capability pages |
| `/for/<audience>/` | Audience-specific landing pages |
| `/compare/<alternative>/` | Accurate comparison pages |
| `/tools/<tool>/` | Calculators and templates |
| `/guides/<topic>/` | Informational supporting content |
| `/privacy/` | Privacy policy, including the analytics disclosure |
| `/contact/` | Contact page (successor to `/contact.html`) |
| `/404.html` | Custom not-found page |
| `/es/…`, `/ca/…` | Approved localizations (Phase 4) |

Terms of Service continues to link to Apple's standard EULA externally. No local `/terms/`
route is created.

Redirect stubs required in Phase 1b: `/privacy-policy.html` → `/privacy/`, `/contact.html` → `/contact/`.

### 6.5 Core site components

1. **SEO layout** — titles, descriptions, canonicals, Open Graph, social cards, language annotations, per-page structured data.
2. **Content collections** — validated frontmatter and body content per cluster.
3. **App Store CTA** — one URL contract (§10.1), accessible copy, campaign identifier, outbound click event.
4. **Evidence component** — renders only validator-approved evidence; renders nothing when the evidence array is empty.
5. **Related-content component** — intentional internal links within and across clusters.
6. **Breadcrumb component** — visible navigation plus matching `BreadcrumbList`.
7. **Localized navigation** — keeps users and crawlers inside the matching language tree.

## 7. Technical SEO requirements

Every public page must include:

- One unique, intent-matched title and meta description.
- One self-referencing canonical URL with a trailing slash.
- Correct Open Graph and Twitter metadata, and a 1200 × 630 social image.
- One `<h1>` and a logical heading hierarchy.
- Descriptive image filenames, explicit `width`/`height`, and alt text.
- Crawlable contextual links rather than JavaScript-only navigation.
- Structured data that accurately describes visible page content.
- An accessible, measurable App Store CTA.

Site-wide:

- XML sitemap containing only canonical, indexable URLs.
- `robots.txt` referencing the sitemap and blocking no required asset.
- `SoftwareApplication` on the homepage and product pages; `aggregateRating` **only** from a real Apple review count and average, otherwise omitted entirely.
- `BreadcrumbList` on nested routes; `Article` on qualifying guides; `Organization` with verified details only.
- **No `FAQPage` schema** (A9). **No `Review` or `aggregateRating` derived from the retained homepage testimonials** (A8).
- Redirect stubs for replaced public URLs.
- Branded favicon and social sharing image; no Vite or React default assets.
- Content pages must not depend on JavaScript for primary copy, links, or metadata. The homepage keeps its existing hydration behavior but serves complete metadata and structured data statically.

### 7.1 Image and performance budgets

| Budget | Limit |
| --- | --- |
| Any single image in the artifact | ≤ 250 KB |
| Total homepage image payload | ≤ 1.2 MB |
| Lab Largest Contentful Paint | ≤ 2,500 ms |
| Cumulative Layout Shift | ≤ 0.10 |
| Total Blocking Time | ≤ 200 ms |

Image work must be visually lossless: re-encode and resize to the maximum rendered dimensions,
preserve appearance, and add explicit dimensions plus `loading="lazy"` below the fold. Budgets
are enforced by `check:images` and Lighthouse CI. Field INP is monitored in Search Console
because Lighthouse cannot reproduce field interaction data.

## 8. Initial English content system

### 8.1 Keyword selection

Prioritize commercial intent and audience fit over search volume. Parent concepts: property
management app for small landlords, landlord expense tracker, rental income and expense
tracker, rental property document organizer, rental property ROI calculator, landlord tax
record app, landlord app instead of Excel, property management app for iPhone.

Modifiers: `best`, `app`, `tracker`, `for small landlords`, `for 1–5 properties`,
`for individual landlords`, `iPhone`, `alternative`, `instead of spreadsheets`.

Location modifiers are excluded. A country or region page becomes eligible only when tax rules,
terminology, legal responsibilities, product availability, or landlord workflows make it
materially different.

### 8.2 One page, one query

Every acquisition route declares a `primaryQuery` and a `queryType`. Uniqueness of
`primaryQuery` across all published entries is release-blocking. Cluster determines query type:

| Cluster | Query type | Query shape |
| --- | --- | --- |
| `features` | commercial-investigation | product-capability phrasing (`… app`, `… tracking app`) |
| `audiences` | commercial-investigation | audience-qualified phrasing (`for small landlords`, `for 1–5 properties`) |
| `comparisons` | commercial-investigation | alternative phrasing (`instead of`, `vs`) |
| `tools` | transactional | tool phrasing (`calculator`, `template`) |
| `guides` | informational | must begin with `how to`, `what`, `which`, `when`, or `do/does` |

The guide-prefix rule is what mechanically prevents a guide from shadowing the feature page in
its own cluster.

### 8.3 First-wave inventory (fifteen pages plus the homepage)

| # | Route | Primary query | Cluster |
| --- | --- | --- | --- |
| — | `/` | property management app for landlords | home |
| 1 | `/features/financial-control/` | rental income and expense tracking app | features |
| 2 | `/features/document-management/` | rental property document storage app | features |
| 3 | `/features/property-performance/` | rental property performance tracking app | features |
| 4 | `/features/tax-export/` | landlord tax record app | features |
| 5 | `/for/small-landlords/` | property management app for 1–5 properties | audiences |
| 6 | `/for/first-time-landlords/` | property management app for first-time landlords | audiences |
| 7 | `/for/growing-property-investors/` | rental portfolio app for multiple properties | audiences |
| 8 | `/compare/landlord-app-vs-spreadsheets/` | landlord app instead of Excel | comparisons |
| 9 | `/guides/choosing-a-property-management-app/` | how to choose a property management app | guides |
| 10 | `/guides/tracking-landlord-expenses/` | how to track landlord expenses | guides |
| 11 | `/guides/monthly-rental-finance-routine/` | how to track rental income and expenses monthly | guides |
| 12 | `/guides/organizing-rental-property-documents/` | how to organize rental property documents | guides |
| 13 | `/guides/landlord-tax-records/` | what records do landlords need for taxes | guides |
| 14 | `/tools/rental-property-roi-calculator/` | rental property ROI calculator | tools |
| 15 | `/tools/rental-income-expense-template/` | rental income and expense spreadsheet template | tools |

Route 3 replaces revision 1's `/features/profitability-roi/` per A6. Route 4 takes the
`landlord tax record app` query previously duplicated between a feature page and a guide;
guide 13 takes the informational counterpart.

Exact primary keywords must be validated against live search results and Search Console data
before copy is finalized. Validation may refine wording but must not change the approved
audience, intent cluster, or fifteen-page rollout size without a design amendment.

### 8.4 Page quality contract

Every acquisition page must:

- Answer its primary query in the opening paragraph.
- Include a three-to-five-sentence summary that stays useful when quoted independently.
- Address one distinct intent, not a keyword swap into a shared template.
- Include original screenshots, calculations, examples, or downloadable utility where appropriate.
- Derive FAQs from verified Search Console queries, support questions, reviews, or interviews.
- Link to relevant feature, audience, tool, comparison, and guide pages.
- Use only validator-approved evidence and verified product claims. **The A8 retention exception does not extend to acquisition pages, structured data, or external publications.**
- End with a relevant App Store CTA.
- Receive editorial review before publication.

## 9. External authority and discovery

**Channel roles.** Medium — original articles, or true republications carrying a canonical link
where supported. Substack — practical landlord newsletters with standalone value and a deep
link. YouTube — product walkthroughs and tutorials with useful descriptions, transcripts, and
destination links. GitHub — public assets only when a genuinely useful template, methodology,
sample dataset, or tool exists. Social and communities — human, context-appropriate answers;
automated promotional posting is prohibited. Instagram is not an initial priority.

**Publication workflow.** Publish canonically on `managestate.app`; confirm live, indexable,
internally linked and in the sitemap; collect indexing and engagement signals; select topics
for adaptation; create platform-specific content rather than copies; deep-link to the most
relevant page; record platform, account, topic, destination, status, public URL, publication
date and campaign identifier; verify the public URL resolves before marking success; return
failures to a retryable state; refresh winners and discontinue formats producing no qualified
signal.

Initial cadence is one to two external publications per week. Nightly automation is prohibited
during the first rollout.

## 10. Conversion design

Primary action across the site is `Download ManageState for iPhone` or intent-specific
equivalent copy. No account creation, email gate, or demo requirement precedes the App Store
destination.

### 10.1 App Store URL contract

One build-time function produces every App Store URL:

```
https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=<campaign>&mt=8
```

- `pt=128092033` is the verified public Apple provider token recorded in the Phase 0 baseline. It is a public attribution parameter, hardcoded as a constant — **not** an environment variable and **not** optional.
- `<campaign>` must be one of the nine verified campaign names. An unknown campaign fails the build.
- The locale-locked `/us/` form currently in the components is replaced by the locale-neutral form. There is no unattributed fallback: a missing or invalid campaign is a build error, never a silently unattributed link.
- Existing hero, navbar and footer CTAs keep their exact appearance and position; only the `href` and data attributes change.

### 10.2 Measurement of conversion

A consistent outbound event `app_store_click` carries `page_path`, `content_cluster`,
`cta_placement`, `language`, and `campaign`. Placements on the homepage are `nav`, `hero`,
and `footer`, all with campaign `website-home`. Analytics must never intercept navigation,
call `preventDefault`, await a network request, or throw when Plausible is unavailable.

`Start free trial` wording is prohibited unless it accurately matches the App Store product
and onboarding flow. The retained hero badges are covered by A8 and §15.3.

## 11. Analytics and decision flow

### 11.1 Tooling

- **Google Search Console** — ownership, sitemap submission, query data, indexing, crawl diagnostics.
- **Plausible Analytics** — privacy-conscious page and custom-event measurement. Domain `managestate.app` is a constant in `site.json`; the script ships in every production build and its presence is asserted by `check:dist`. There is no enabling environment variable.
- **App Store Connect** — product-page and campaign-attributed download reporting.

The privacy policy must disclose the analytics implementation before tracking is enabled. No
personally identifiable customer data or property data may enter SEO analytics or
content-generation workflows.

### 11.2 Data flow

Search Console query patterns enter a controlled keyword backlog → scored for intent,
audience fit, product fit, evidence availability, differentiation and editorial effort →
approved topics become briefs, then content entries → the static build validates and
publishes HTML, metadata, links and sitemap entries → successful topics enter the external
queue → Plausible, Search Console and App Store Connect results feed the monthly review →
the review expands, refreshes, translates, consolidates or retires pages.

### 11.3 Scorecard

- **Technical** — indexed and excluded URLs, crawl errors, structured-data validity, broken links, Core Web Vitals.
- **Visibility** — non-branded impressions, ranking queries, average position, CTR by cluster.
- **Engagement** — engaged visits and navigation into related content.
- **Conversion** — App Store CTA clicks, outbound CTR, campaign product-page views, attributed downloads.
- **Content** — pages gaining impressions, pages with no traction, external URLs indexed, external sources producing qualified visits.

### 11.4 Localization data floor

Localization requires **all** of the following, not merely elapsed time:

1. At least 90 days since the final Phase 2 batch.
2. At least four acquisition pages confirmed indexed.
3. At least **50 organic clicks** in aggregate across acquisition pages in the 90-day window.
4. Either at least one attributed App Store click, or a written owner override recorded in the review.

If the floor is not met, localization is deferred and re-reviewed after a further 30 days.
Deterministic selection is never run on data too sparse to rank meaningfully — that produces
alphabetical, not evidence-based, choices.

The first ninety days establish a baseline. Traffic and ranking numbers are not guaranteed.
Expansion decisions use observed results.

## 12. Error handling and operational safeguards

### Site publication

- A failed build, metadata validation, route check, link check, image budget, or visual diff blocks deployment.
- Sitemap entries are generated only from published, canonical, indexable content.
- Missing required frontmatter fails the build rather than producing incomplete metadata.
- Replaced pages get redirect stubs; they do not silently become soft 404s.
- Analytics failures must never block page rendering or the App Store link.
- The stale root publish path and the `deploy` script are removed so exactly one publish path exists.

### Content operations

- Each keyword/topic has one canonical record; `primaryQuery` uniqueness is enforced.
- A topic is marked published only after its public URL returns success and contains the expected canonical URL.
- External publication failures record a reason and return the topic to the queue.
- Unsupported claims are removed or held until evidence exists.
- Comparisons record the date and source of factual competitor claims and are reviewed periodically.
- Overlapping pages are consolidated or repositioned before publication.

## 13. Testing and release gates

Before each production release:

1. Run the production build and all automated tests.
2. Validate required frontmatter and uniqueness of titles, descriptions, canonicals, H1s, and primary queries.
3. Crawl the built site for broken internal links, redirect-stub integrity, orphaned pages, and non-success responses.
4. Validate the sitemap and robots directives against the production URL policy.
5. Validate JSON-LD syntax and confirm structured data matches visible content.
6. Test canonical and `hreflang` reciprocity when localized pages exist.
7. Verify every App Store CTA destination and `app_store_click` payload, and assert the Plausible script is present.
8. Run accessibility checks for navigation, headings, image alternatives, keyboard access, and contrast.
9. Enforce image budgets and Lighthouse Core Web Vitals budgets.
10. **Run the visual diff gate against the committed homepage baselines.**
11. Manually review new content for accuracy, intent match, duplication, evidence, and unsupported claims.

No page enters the sitemap merely because a file exists.

## 14. Phased rollout

| Phase | Outcome |
| --- | --- |
| **0 — Baseline and evidence** | Committed site/evidence data contract, validators, private-export boundary, recorded baseline. |
| **1a — Technical SEO baseline** | Metadata, Open Graph, structured data, `robots.txt`, `sitemap.xml`, attributed App Store URLs, Plausible and `app_store_click`, image budgets, single publish path, visual baselines. No framework change. |
| **1b — Astro shell** | Astro static output, existing homepage mounted verbatim as islands, `/privacy/`, `/contact/`, `404.html`, redirect stubs, generated sitemap, CI verification. |
| **2 — English acquisition content** | Fifteen pages, one primary query each, published in three internally linked batches. |
| **3 — External distribution** | Ledger-controlled Medium, Substack and YouTube pilots at one to two per week. |
| **4 — Optimization and localization** | 90-day review, evidence-based English changes, Spanish then Catalan once the §11.4 floor is met. |
| **5 — Controlled draft automation** | Evidence-gated, draft-only, human-reviewed pull requests. Optional; disabled by default. |

## 15. Primary risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Visual regression causing another revert | §6.1 preservation contract, verbatim island mounting, committed screenshot baselines with a release-blocking diff. |
| Thin or doorway content | Fifteen-page cap, one primary query per page, guide-prefix rule, distinct-intent requirement, no city multiplication. |
| Keyword cannibalization | `primaryQuery` uniqueness enforced at build time; §8.2 cluster/query-type mapping. |
| Duplicate external content | Platform-specific adaptations, canonicals for true republications, 30 % sentence-copy cap. |
| Inaccurate tax or legal content | Guidance stays organizational, not advisory; authoritative sources cited; date-sensitive claims dated; disclaimers required. |
| Premature localization | §11.4 data floor plus human review. |
| Unmeasurable traffic | Constant-based attribution and analytics with no silent fallback; presence asserted in `check:dist`. |
| Automation errors | Public URL verification, explicit states, retryable failures, human editorial approval, draft-only output. |
| Traffic without downloads | Deep-link each query to the most relevant capability; measure App Store CTR by cluster. |
| Stale documentation | Every operational document records its observation date and is re-verified at each phase gate. |

### 15.3 Recorded residual risk — retained homepage social proof (A8)

The owner has decided on 2026-08-21 to retain the following existing homepage copy unchanged:
the six testimonials with invented names and roles; the section framing "Loved by property
owners." and "…trusted by investors around the world"; the hero H1 rotating clause "that
maximizes returns."; and the hero badges "Free to start" and "No credit card required". The
owner reaffirmed this after the risk was raised. The exact strings and their file locations are
recorded in [`../03-operations/evidence-register.md`](../03-operations/evidence-register.md).

Boundaries that still apply:

1. The retained strings are **not** validator-approved evidence and are excluded from every evidence count.
2. They must **never** be emitted as `Review`, `aggregateRating`, or any other structured data. Fabricated review markup is a search-policy violation with manual-action exposure.
3. They must **never** be reused on acquisition pages, in external publications, or in automation prompts.
4. The exception is scoped to the current homepage sections and expires if those sections are rewritten for any other reason.

Residual risk, recorded and accepted: presenting invented consumer testimonials as genuine is
prohibited under the EU Unfair Commercial Practices Directive as amended by the Omnibus
Directive, which applies to a Spain-based operator, and inaccurate pricing or trial copy can
also conflict with App Store metadata expectations. Replacing the six quotes with the one
verified App Store review, keeping the section markup and styling untouched, would clear both
concerns at negligible cost and remains available at any time.

## 16. Approval decisions

Approved in revision 1 (2026-08-05):

- English-first acquisition, then Spanish, then Catalan.
- Primary focus on self-managing landlords with one to five properties; growing investors secondary.
- Apple App Store download as the primary conversion.
- Use of the available small set of real App Store reviews.
- Hybrid owned-site and selective external-authority strategy.
- Astro migration while preserving the existing visual design.
- A fifteen-page English first wave, then evidence-based expansion.
- Controlled external publication rather than nightly automation.

Approved in revision 2 (2026-08-21):

- Amendments A1–A12 in §0.
- The visual preservation contract in §6.1, including the release-blocking diff gate.
- Retention of the existing homepage social proof and starting-price copy, with the boundaries and recorded residual risk in §15.3.
- The full fifteen-page inventory with de-duplicated primary queries in §8.3, including the `/features/property-performance/` rescope.
