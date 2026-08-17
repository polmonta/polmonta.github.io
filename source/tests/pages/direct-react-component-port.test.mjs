import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Testimonials from '../../src/components/Testimonials.jsx';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(projectRoot, 'dist');

function readSource(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

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

    for (const component of ['Navbar', 'Hero', 'Features', 'Testimonials']) {
      expectReactIsland(html, component);
    }

    expect(html).toMatch(/<nav[^>]+class="[^"]*fixed[^"]*z-50/);
    expect(html).toMatch(/<section[^>]+class="[^"]*pt-32[^"]*overflow-hidden/);
    expect(html).toContain('v1.0 is now available');
    expect(html).toContain('Property management');
    expect(html).toMatch(/<section[^>]+id="features"[^>]+class="[^"]*pt-8[^"]*bg-white/);
    expect(html).toContain('Monthly financial summaries');
    expect(html).toMatch(/<footer[^>]+class="[^"]*bg-gray-900/);
    expect(html).not.toMatch(/<astro-island\b[^>]*Footer/);
    expect((html.match(/<footer\b/g) ?? [])).toHaveLength(1);
    expect(html).toContain('src="/hero-tilted.png"');
    expect(html).toContain('src="/img/legacy-app-mockup.jpg"');
    expect(html).toContain('src="/img/feature-financial-summary.png"');

    const heroImage = html.match(/<img\b[^>]*src="\/hero-tilted\.png"[^>]*>/i)?.[0] ?? '';
    expect(heroImage).toContain('loading="eager"');
    expect(heroImage).toMatch(/fetchpriority="high"/i);

    const featureSection = html.match(/<section id="features"[\s\S]*?<\/section>/i)?.[0] ?? '';
    const benefitLists = [...featureSection.matchAll(/<ul class="space-y-4">([\s\S]*?)<\/ul>/g)];
    expect(benefitLists).toHaveLength(3);
    benefitLists.forEach(([, list]) => expect(list.match(/<li\b/g) ?? []).toHaveLength(3));
    for (const benefit of [
      'Monthly income',
      'Monthly expenses',
      'Net income from property transactions',
      'Upload documents for a property',
      'Save document metadata',
      'Property and transaction data as XLSX',
      'Recurring-item data as XLSX',
      'Monthly-summary data as XLSX'
    ]) {
      expect(featureSection).toContain(benefit);
    }

    expect(html).toContain('data-campaign="website-home"');
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain('href="/terms/"');
  });

  it('uses the same hydrated shell on acquisition pages while keeping article SEO/content', () => {
    const html = readBuilt('guides/landlord-expense-tracker/index.html');

    expectReactIsland(html, 'Navbar');
    expect(html).not.toMatch(/<astro-island\b[^>]*Footer/);
    expect((html.match(/<footer\b/g) ?? [])).toHaveLength(1);
    expect(html).toContain('class="acquisition-article acquisition-article--legacy"');
    expect(html).toContain('At a glance');
    expect(html).toContain('Related reading');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('data-campaign="website-guides"');
    expect(html).toContain('data-page-path="/guides/landlord-expense-tracker/"');
  });

  it('keeps reduced-motion, eager-image, static-footer, evidence, and conditional-section behavior concrete', () => {
    const heroSource = readSource('src/components/Hero.jsx');
    const navbarSource = readSource('src/components/Navbar.jsx');
    const footerSource = readSource('src/components/Footer.jsx');
    const featuresSource = readSource('src/components/Features.jsx');
    const heroScrollSource = readSource('src/components/HeroScrollDemo.jsx');
    const indexSource = readSource('src/pages/index.astro');
    const acquisitionSource = readSource('src/layouts/AcquisitionLayout.astro');

    expect(heroSource).toContain('titleNumber === index');
    expect(heroSource).toContain('titleNumber > index && !(titleNumber === titles.length - 1 && index === 0)');
    expect(heroSource).toContain('titleNumber === 0 && index === titles.length - 1');
    expect(heroSource).toContain('transition={shouldReduceMotion ? { duration: 0 }');
    expect(navbarSource).toContain('useReducedMotion');
    expect(navbarSource).toContain('transition={shouldReduceMotion ? { duration: 0 }');
    expect(navbarSource).toContain('showTestimonials &&');
    expect(footerSource).not.toMatch(/use(State|Effect)/);
    expect(indexSource).toContain('const hasTestimonials = verifiedEvidence.reviews.length > 0;');
    expect(indexSource).not.toMatch(/<Footer[^>]+client:load/);
    expect(acquisitionSource).not.toMatch(/<Footer[^>]+client:load/);
    expect(heroScrollSource).toContain('loading="eager"');
    expect(heroScrollSource).toContain('fetchPriority="high"');
    expect(heroScrollSource).toContain('src="/img/legacy-app-mockup.jpg"');
    expect(heroScrollSource).toContain('loading="lazy"');
    expect(featuresSource).toContain("title: 'Monthly financial summaries'");
    expect(featuresSource).toContain("title: 'Property document storage'");
    expect(featuresSource).toContain("title: 'XLSX data exports'");
    expect(renderToStaticMarkup(createElement(Testimonials, { reviews: [] }))).toBe('');
  });
});
