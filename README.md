# ManageState marketing site

This repository (`polmonta/polmonta.github.io`) is the canonical source and deployment repository for `https://managestate.app`.

## Edit the site

The only editable site application is [`source/`](source/). Do not edit generated root artifacts, restore the old Vite app, or add a submodule for the ManageState repository.

```bash
cd source
npm ci
npm run verify
```

GitHub Pages builds `source/dist/` with `.github/workflows/workflow_dispatch.yml`. The workflow preserves the root `CNAME` and `.nojekyll` files.

## Build variables

Configure these GitHub Pages environment variables when available:

- `PUBLIC_PLAUSIBLE_DOMAIN=managestate.app`
- `PUBLIC_APPLE_PROVIDER_TOKEN=<approved public App Store provider token>`