import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
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
