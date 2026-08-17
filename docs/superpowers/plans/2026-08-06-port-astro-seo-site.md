# Port Astro SEO Site to GitHub Pages Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `polmonta/polmonta.github.io/source/` the canonical, deployable Astro source for `https://managestate.app`, replacing the unrelated Vite application that currently produces the live site.

**Architecture:** Preserve the GitHub Pages repository and its root deployment metadata (`CNAME` and `.nojekyll`), replace only the `source/` application with the reviewed static Astro site from ManageState commit `7e13d6c`, and keep GitHub Actions building `source/dist`. Add a repository contract test, deployment verification gates, and root-level agent instructions so future edits target this repository and directory.

**Tech Stack:** Astro 7, React islands, Markdown/MDX content collections, Node.js 22.13.0, npm, GitHub Pages Actions, Vitest, Lighthouse CI.

**Spec:** Approved migration decision from the 2026-08-06 conversation; source implementation is the reviewed `ManageState/landing-page` tree at commit `7e13d6c`.

## Global Constraints

- `polmonta/polmonta.github.io` is the canonical repository for the marketing site after this migration.
- `source/` is the only editable application source; GitHub Pages publishes the generated `source/dist/` artifact.
- Preserve the root `CNAME` and `.nojekyll` files.
- Preserve the canonical site URL `https://managestate.app` and the 15 approved acquisition routes.
- Use Node.js `22.13.0` and `npm ci` for reproducible local and CI builds.
- Keep `PUBLIC_PLAUSIBLE_DOMAIN` and support optional `PUBLIC_APPLE_PROVIDER_TOKEN` as build-time public variables.
- Do not add a Git submodule and do not push changes to `main` directly from this migration branch.
- Do not copy generated output, dependencies, ignored files, or untracked working files from ManageState.

---

### Task 1: Replace the Vite source with the reviewed Astro site

**Files:**
- Create: `source/tests/migration/source-contract.test.mjs`
- Replace: all tracked files under `source/` with the tracked `landing-page/` tree from ManageState commit `7e13d6c`
- Preserve: `source/tests/migration/source-contract.test.mjs` while replacing the source tree

**Interfaces:**
- Consumes: the committed source tree at `/Users/polmontanera/Desktop/CasaConnect_v1`, commit `7e13d6c`, path `landing-page/`.
- Produces: an Astro application rooted at `source/` with `npm run build`, `npm test`, and `npm run verify` scripts; routes for `/`, `/features/[slug]/`, `/for/[slug]/`, `/compare/[slug]/`, `/guides/[slug]/`, and `/tools/[slug]/`.

- [ ] **Step 1: Write the failing repository contract test before replacing production source**

Create `source/tests/migration/source-contract.test.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const sourceRoot = resolve(import.meta.dirname, '../..');
const packageJson = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));

function readSourceFile(relativePath) {
  return readFileSync(resolve(sourceRoot, relativePath), 'utf8');
}

test('GitHub Pages source is the canonical Astro SEO application', () => {
  const config = readSourceFile('astro.config.mjs');

  assert.equal(packageJson.scripts.build, 'astro build');
  assert.equal(packageJson.scripts.verify, 'npm run lint && npm run check:baseline && npm run test:baseline && npm run test:app-store && npm run check:content && npm run build && npm test && npm run check:dist && npm run check:lighthouse');
  assert.ok(packageJson.dependencies.astro);
  assert.ok(packageJson.dependencies['@astrojs/sitemap']);
  assert.ok(packageJson.dependencies['@astrojs/mdx']);
  assert.match(config, /https:\/\/managestate\.app/);
  assert.ok(existsSync(resolve(sourceRoot, 'src/pages/features/[slug].astro')));
  assert.ok(existsSync(resolve(sourceRoot, 'src/pages/tools/[slug].astro')));
  assert.ok(existsSync(resolve(sourceRoot, 'src/content/features/financial-control.md')));
});
```

Add the missing `assert` import at the top of the file:

```js
import assert from 'node:assert/strict';
```

- [ ] **Step 2: Run the contract test and verify it fails for the current Vite source**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration
node --test source/tests/migration/source-contract.test.mjs
```

Expected: FAIL because the current `source/package.json` has `vite build`, does not depend on Astro, and has no Astro route/content files.

- [ ] **Step 3: Copy only the tracked Astro source from ManageState**

Use a temporary directory and Git archive so ignored and untracked files are excluded. Preserve the contract test while deleting the old Vite files:

```bash
set -eu
repo=/Users/polmontanera/Desktop/CasaConnect_v1
worktree=/Users/polmontanera/Desktop/polmonta-github-pages-astro-migration
archive_dir=$(mktemp -d)
trap 'rm -rf "$archive_dir"' EXIT
mkdir -p "$archive_dir/source"
git -C "$repo" archive 7e13d6c landing-page \
  | tar -x --strip-components=1 -C "$archive_dir/source"
rsync -a --delete --exclude 'tests/migration/source-contract.test.mjs' \
  "$archive_dir/source/" "$worktree/source/"
```

This must leave the root `CNAME` and `.nojekyll` untouched and must not copy `node_modules`, `dist`, `.astro`, `.lighthouseci`, `pdf_content.txt`, or `read_pdf.cjs`.

- [ ] **Step 4: Run the contract test and the migrated source tests**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration/source
npm ci
node --test tests/migration/source-contract.test.mjs
npm test
```

Expected: the contract test passes and all migrated tests pass.

- [ ] **Step 5: Commit the source migration**

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration
git add -A source
git commit -m "feat(site): port Astro SEO site to Pages source"
```

### Task 2: Make GitHub Actions verify and deploy the Astro output

**Files:**
- Modify: `.github/workflows/workflow_dispatch.yml`
- Test: `source/tests/migration/source-contract.test.mjs`

**Interfaces:**
- Consumes: `source/package.json` scripts from Task 1 and root `CNAME`/`.nojekyll`.
- Produces: a Pages workflow that installs Node.js `22.13.0`, runs the complete `npm run verify` gate from `source/`, preserves Pages metadata, and uploads `source/dist/`.

- [ ] **Step 1: Extend the failing contract test to cover deployment metadata and workflow requirements**

Add this test to `source/tests/migration/source-contract.test.mjs` before changing the workflow:

```js
test('Pages workflow builds and verifies source/dist', () => {
  const workflow = readFileSync(resolve(sourceRoot, '../.github/workflows/workflow_dispatch.yml'), 'utf8');

  assert.match(workflow, /node-version:\s*22\.13\.0/);
  assert.match(workflow, /PUBLIC_PLAUSIBLE_DOMAIN:\s*\$\{\{ vars\.PUBLIC_PLAUSIBLE_DOMAIN \}\}/);
  assert.match(workflow, /PUBLIC_APPLE_PROVIDER_TOKEN:\s*\$\{\{ vars\.PUBLIC_APPLE_PROVIDER_TOKEN \}\}/);
  assert.match(workflow, /working-directory:\s*\.\/source[\s\S]*run:\s*npm run verify/);
  assert.match(workflow, /path:\s*\.\/source\/dist/);
  assert.ok(existsSync(resolve(sourceRoot, '../CNAME')));
  assert.ok(existsSync(resolve(sourceRoot, '../.nojekyll')));
});
```

- [ ] **Step 2: Run the workflow contract test and verify it fails**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration/source
node --test tests/migration/source-contract.test.mjs
```

Expected: the source contract passes, but the workflow test fails because the workflow still uses Node `22`, does not expose the optional Apple provider variable, and runs only `npm run build`.

- [ ] **Step 3: Update the workflow with the exact deployment gates**

In `.github/workflows/workflow_dispatch.yml`:

1. Change `node-version: 22` to `node-version: 22.13.0`.
2. Add `PUBLIC_APPLE_PROVIDER_TOKEN: ${{ vars.PUBLIC_APPLE_PROVIDER_TOKEN }}` beside the existing Plausible variable.
3. Replace the `Build` step's command with `npm run verify` and rename the step to `Verify and build`.
4. Leave the `Preserve GitHub Pages metadata` step copying root `CNAME` and `.nojekyll` into `source/dist/`.
5. Leave the Pages artifact path as `./source/dist`.

- [ ] **Step 4: Run the workflow contract test**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration/source
node --test tests/migration/source-contract.test.mjs
```

Expected: both repository and workflow contract tests pass.

- [ ] **Step 5: Commit the deployment workflow**

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration
git add .github/workflows/workflow_dispatch.yml source/tests/migration/source-contract.test.mjs
git commit -m "ci(site): verify Astro output before Pages deploy"
```

### Task 3: Document the canonical repository and source directory

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Modify: `source/README.md`

**Interfaces:**
- Consumes: the Astro commands and public variables in `source/package.json` and `source/README.md`.
- Produces: explicit instructions that future contributors and AI agents edit this repository's `source/` directory, run the source verification suite, and do not restore the Vite application or add a submodule.

- [ ] **Step 1: Write a documentation contract test before replacing the source README**

Add this test to `source/tests/migration/source-contract.test.mjs`:

```js
test('repository guidance names source as the only editable site directory', () => {
  const rootReadme = readFileSync(resolve(sourceRoot, '../README.md'), 'utf8');
  const agentGuide = readFileSync(resolve(sourceRoot, '../AGENTS.md'), 'utf8');
  const sourceReadme = readSourceFile('README.md');

  for (const document of [rootReadme, agentGuide, sourceReadme]) {
    assert.match(document, /polmonta\/polmonta\.github\.io/);
    assert.match(document, /source\//);
    assert.match(document, /npm run verify/);
  }
  assert.match(agentGuide, /Do not add a Git submodule/);
});
```

- [ ] **Step 2: Run the documentation contract test and verify it fails**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration/source
node --test tests/migration/source-contract.test.mjs
```

Expected: the repository and workflow tests pass, but the documentation test fails because the target repository has no root README or agent guide and the copied source README still describes a generic `landing-page/` deployment.

- [ ] **Step 3: Add root repository guidance**

Create `README.md` with these exact sections and requirements:

```markdown
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
```

Create `AGENTS.md` with these exact rules:

```markdown
# Repository instructions

- Treat `source/` as the sole editable marketing-site application.
- Run site commands from `source/`; the required verification command is `npm run verify`.
- Preserve `CNAME` and `.nojekyll` at the repository root.
- Do not restore the previous Vite app, edit generated root artifacts, or add a Git submodule.
- Do not commit `source/dist/`, `source/node_modules/`, `.astro/`, or `.lighthouseci/`.
- The deployed canonical site is `https://managestate.app`.
```

- [ ] **Step 4: Update `source/README.md` for the new repository layout**

Rewrite it so it identifies `polmonta/polmonta.github.io` as the canonical repository, says the Astro site is under `source/`, uses commands from `source/`, documents Node.js `22.13.0`, the two public variables, the Pages workflow's `source/dist/` artifact, and the 15 acquisition routes. Keep the existing approved campaign names and verification command.

- [ ] **Step 5: Run the documentation contract and diff checks**

Run:

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration/source
node --test tests/migration/source-contract.test.mjs
cd ..
git diff --check
```

Expected: all contract tests pass and `git diff --check` produces no output.

- [ ] **Step 6: Commit the repository guidance**

```bash
cd /Users/polmontanera/Desktop/polmonta-github-pages-astro-migration
git add README.md AGENTS.md source/README.md source/tests/migration/source-contract.test.mjs
git commit -m "docs(site): document canonical Pages source"
```

## Final verification

From `source/`, run:

```bash
npm ci
npm run verify
```

Then confirm the generated artifact contains the previously missing route:

```bash
test -f dist/features/financial-control/index.html
node -e "const fs=require('node:fs'); const html=fs.readFileSync('dist/features/financial-control/index.html','utf8'); if (!html.includes('canonical')) process.exit(1); console.log('financial-control artifact present')"
```

Before opening a pull request, inspect `git status --short`, `git diff --check`, the root metadata, and the workflow diff. Do not merge or push to `main` as part of the migration without explicit approval.
