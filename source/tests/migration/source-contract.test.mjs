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
