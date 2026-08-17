# ManageState landing site

The marketing site is an Astro static site. Node.js `22.13.0` and npm are used in local development and CI.

The pinned Astro 7 and `@astrojs/tailwind` 6 packages have a pre-existing peer-range mismatch: the integration currently declares Astro 3–5 support. The tracked `landing-page/.npmrc` enables npm's legacy peer-dependency resolution so the required `npm ci` command remains unchanged while these reviewed versions stay pinned. The landing test suite pins `jsdom` to `29.0.0`, the smallest compatible release for the required Node `22.13.0` runtime; `jsdom` `30.0.1` and its newer transitive dependencies require a later Node release.

## Local development

From the repository root:

```bash
cd landing-page
npm ci
npm run dev
```

Astro serves the site at `http://localhost:4321`. To preview the production build locally:

```bash
cd landing-page
npm run build
npm run preview
```

## Public environment variables

Set these public variables in the local environment and the deployment environment:

```dotenv
PUBLIC_APPLE_PROVIDER_TOKEN=<approved Apple provider token>
PUBLIC_PLAUSIBLE_DOMAIN=managestate.app
```

`PUBLIC_APPLE_PROVIDER_TOKEN` adds the approved App Store campaign attribution parameters. `PUBLIC_PLAUSIBLE_DOMAIN` must be `managestate.app` for the failure-tolerant Plausible script to load; another value leaves analytics disabled.

## Deployment

Build the static site and publish the generated `dist/` directory with any static hosting provider:

```bash
cd landing-page
npm ci
npm run build
```

The build output is `landing-page/dist/`. No server runtime is required. Configure the deployment's build command as `npm ci && npm run build` and its publish directory as `landing-page/dist` when the repository root is the deployment context, or `dist` when the deployment root is `landing-page`.

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

## Phase 1 verification

Run the complete Phase 1 verification from the landing-site directory:

```bash
cd landing-page
npm ci
npm run verify
```

This runs linting, baseline validation, both preserved Node suites, Vitest, the static build, dist validation, and the release-blocking Lighthouse check.
