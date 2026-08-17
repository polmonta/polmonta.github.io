# ManageState landing site

This repository (`polmonta/polmonta.github.io`) is the canonical source and deployment repository for the marketing site at `https://managestate.app`. The Astro site lives in `source/`; all site commands run from `source/`.

The marketing site is an Astro static site. Node.js `22.13.0` and npm are used in local development and CI.

The pinned Astro 7 and `@astrojs/tailwind` 6 packages have a pre-existing peer-range mismatch: the integration currently declares Astro 3–5 support. The tracked `source/.npmrc` enables npm's legacy peer-dependency resolution so the required `npm ci` command remains unchanged while these reviewed versions stay pinned. The test suite pins `jsdom` to `29.0.0`, the smallest compatible release for the required Node `22.13.0` runtime; `jsdom` `30.0.1` and its newer transitive dependencies require a later Node release.

## Local development

From the repository root:

```bash
cd source
npm ci
npm run dev
```

Astro serves the site at `http://localhost:4321`. To preview the production build locally:

```bash
cd source
npm run build
npm run preview
```

## Public environment variables

Set these public variables in the local environment and the GitHub Pages deployment environment:

```dotenv
PUBLIC_APPLE_PROVIDER_TOKEN=<approved Apple provider token>
PUBLIC_PLAUSIBLE_DOMAIN=managestate.app
```

`PUBLIC_APPLE_PROVIDER_TOKEN` adds the approved App Store campaign attribution parameters. `PUBLIC_PLAUSIBLE_DOMAIN` must be `managestate.app` for the failure-tolerant Plausible script to load; another value leaves analytics disabled.

## Deployment

GitHub Pages builds the site with `.github/workflows/workflow_dispatch.yml`: the workflow runs `npm run verify` from `source/` on Node.js `22.13.0`, copies the root `CNAME` and `.nojekyll` files into the build output, and publishes the `source/dist/` artifact. Configure the `PUBLIC_PLAUSIBLE_DOMAIN` and `PUBLIC_APPLE_PROVIDER_TOKEN` repository variables so the workflow passes them to the build.

## Acquisition routes

The site serves exactly fifteen approved acquisition routes:

- Features: `/features/document-management/`, `/features/financial-control/`, `/features/profitability-roi/`, `/features/tax-export/`
- Audiences: `/for/first-time-landlords/`, `/for/growing-property-investors/`, `/for/small-landlords/`
- Comparisons: `/compare/landlord-app-vs-spreadsheets/`
- Guides: `/guides/landlord-expense-tracker/`, `/guides/landlord-tax-record-app/`, `/guides/property-management-app-for-small-landlords/`, `/guides/rental-income-expense-tracker/`, `/guides/rental-property-document-organizer/`
- Tools: `/tools/rental-income-expense-template/`, `/tools/rental-property-roi-calculator/`

Plus the core pages `/`, `/privacy/`, and `/terms/`.

## Approved App Store campaign names

Use only these approved campaign names:

- `website-home`
- `website-features`
- `website-audiences`
- `website-comparisons`
- `website-guides`
- `website-tools`
- `medium`
- `substack`
- `youtube`

The required outbound event is `app_store_click` with the non-identifying properties `page_path`, `content_cluster`, `cta_placement`, `language`, and `campaign`.

## Verification

Run the complete verification suite from the `source/` directory:

```bash
cd source
npm ci
npm run verify
```

This runs linting, baseline validation, both preserved Node suites, Vitest, the static build, dist validation, and the release-blocking Lighthouse check.
