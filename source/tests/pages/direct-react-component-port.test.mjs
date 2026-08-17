import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(projectRoot, 'dist');

function readBuilt(relativePath) {
  const filePath = path.join(distRoot, relativePath);
  expect(existsSync(filePath), `${relativePath} must be built`).toBe(true);
  return readFileSync(filePath, 'utf8');
}

function expectReactIsland(html, name) {
  const island = [...html.matchAll(/<astro-island\b[^>]*>/g)]
    .map(([tag]) => tag)
    .find((tag) => tag.includes(`&quot;name&quot;:&quot;${name}&quot;`)) ?? '';
  expect(island, `expected hydrated ${name} island`).not.toBe('');
  expect(island, `expected a hydration directive for ${name}`).toMatch(/\bclient="(?:load|idle|visible|media|only)"/);
}

describe('built direct React component port contract', () => {
  it('emits the old component boundaries, hydration landmarks, and screenshot-led assets', () => {
    const html = readBuilt('index.html');

    for (const component of ['Navbar', 'Hero', 'Features', 'Testimonials', 'Footer']) {
      expectReactIsland(html, component);
    }

    expect(html).toMatch(/<nav[^>]+class="[^"]*fixed[^"]*z-50/);
    expect(html).toMatch(/<section[^>]+class="[^"]*pt-32[^"]*overflow-hidden/);
    expect(html).toContain('v1.0 is now available');
    expect(html).toContain('Property management');
    expect(html).toMatch(/<section[^>]+id="features"[^>]+class="[^"]*pt-8[^"]*bg-white/);
    expect(html).toContain('Your Property');
    expect(html).toMatch(/<footer[^>]+class="[^"]*bg-gray-900/);
    expect(html).toContain('src="/hero-tilted.png"');
    expect(html).toContain('src="/img/legacy-app-mockup.jpg"');
    expect(html).toContain('src="/img/feature-financial-summary.png"');
    expect(html).toContain('data-campaign="website-home"');
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain('href="/terms/"');
  });

  it('uses the same hydrated shell on acquisition pages while keeping article SEO/content', () => {
    const html = readBuilt('guides/landlord-expense-tracker/index.html');

    expectReactIsland(html, 'Navbar');
    expectReactIsland(html, 'Footer');
    expect(html).toContain('class="acquisition-article acquisition-article--legacy"');
    expect(html).toContain('At a glance');
    expect(html).toContain('Related reading');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('data-campaign="website-guides"');
    expect(html).toContain('data-page-path="/guides/landlord-expense-tracker/"');
  });
});
