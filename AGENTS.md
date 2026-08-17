# Repository instructions

- The canonical repository for this site is `polmonta/polmonta.github.io`.
- Treat `source/` as the sole editable marketing-site application.
- Run site commands from `source/`; the required verification command is `npm run verify`.
- Preserve `CNAME` and `.nojekyll` at the repository root.
- Do not restore the previous Vite app or edit generated root artifacts.
- Do not add a Git submodule.
- Do not commit `source/dist/`, `source/node_modules/`, `.astro/`, or `.lighthouseci/`.
- The deployed canonical site is `https://managestate.app`.