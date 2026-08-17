import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(projectRoot, 'dist');
const homepagePath = path.join(distRoot, 'index.html');
const articlePath = path.join(distRoot, 'features/financial-control/index.html');
const homepageVisualAssets = [
  '/hero-tilted.png',
  '/img/legacy-app-mockup.jpg',
  '/img/managestate-logo.png',
  '/img/feature-financial-summary.png',
  '/img/feature-document-storage.png',
  '/img/feature-data-export.png'
];

function read(pathname) {
  return readFileSync(pathname, 'utf8');
}

function getAttribute(tag, attributeName) {
  return tag.match(new RegExp(`\\b${attributeName}=["']([^"']*)["']`, 'i'))?.[1];
}

function findImage(html, src) {
  const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${escapedSrc}["'])[^>]*>`, 'i'))?.[0];
}

function assertImage(html, { src, alt, width, height }) {
  const tag = findImage(html, src);
  expect(tag, `missing emitted image ${src}`).toBeTruthy();
  expect(getAttribute(tag, 'alt')).toBe(alt);
  expect(getAttribute(tag, 'width')).toBe(String(width));
  expect(getAttribute(tag, 'height')).toBe(String(height));
}

function readEmittedStyles(html) {
  const stylesheetHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)]
    .map(([, href]) => href);

  return stylesheetHrefs
    .map((href) => read(path.join(distRoot, href.replace(/^\/+/, ''))))
    .join('\n');
}

describe('built legacy visual contract', () => {
  it('uses the light legacy shell and visible screenshot-led homepage landmarks', () => {
    const html = read(homepagePath);
    const styles = readEmittedStyles(html);

    expect(html).toMatch(/class="site-header[^"]*site-header--legacy/);
    expect(html).toMatch(/<img[^>]+src="\/img\/managestate-logo\.png"[^>]+alt="ManageState logo"/);
    expect(html).toMatch(/class="hero[^"]*hero--legacy/);
    expect(html).toMatch(/class="hero__visual[^>]*hero__visual--screenshot/);
    expect(styles).toMatch(/hero__visual[^}]*hero__legacy-shot\{[^}]*display:block/);

    assertImage(html, {
      src: '/hero-tilted.png',
      alt: 'ManageState dashboard showing rental property finances and portfolio performance',
      width: 1024,
      height: 540
    });
    assertImage(html, {
      src: '/img/legacy-app-mockup.jpg',
      alt: 'ManageState app screen for tracking rental property finances',
      width: 1024,
      height: 1024
    });
    assertImage(html, {
      src: '/img/feature-financial-summary.png',
      alt: 'ManageState monthly financial summary screen',
      width: 1170,
      height: 2532
    });
    assertImage(html, {
      src: '/img/feature-document-storage.png',
      alt: 'ManageState property document storage screen',
      width: 1170,
      height: 2532
    });
    assertImage(html, {
      src: '/img/feature-data-export.png',
      alt: 'ManageState data export screen',
      width: 1170,
      height: 2532
    });

    expect(html).toMatch(/class="section section--features[^"]*section--legacy/);
    expect(html).toMatch(/class="site-footer[^"]*site-footer--legacy/);
    expect(html).toContain('Download ManageState for iPhone');
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain('href="/terms/"');
    expect(styles).toContain('--primary:#2563eb');
    expect(styles).toContain('background:#fff');
    expect(styles).toContain('background:#111827');
    expect(styles).toContain('overflow-x:hidden');
    expect(styles).toContain('@media (prefers-reduced-motion:reduce)');
    homepageVisualAssets.forEach((assetPath) => {
      const relativeAssetPath = assetPath.replace(/^\/+/, '');
      expect(
        existsSync(path.join(projectRoot, 'public', relativeAssetPath)),
        `missing source visual asset ${assetPath}`
      ).toBe(true);
      expect(
        existsSync(path.join(distRoot, relativeAssetPath)),
        `missing built visual asset ${assetPath}`
      ).toBe(true);
    });
  });

  it('applies the same light visual shell to a representative acquisition article', () => {
    const html = read(articlePath);
    const styles = readEmittedStyles(html);

    expect(html).toMatch(/class="site-header[^"]*site-header--legacy/);
    expect(html).toMatch(/class="acquisition-article[^"]*acquisition-article--legacy/);
    expect(html).toMatch(/class="breadcrumbs[^"]*breadcrumbs--legacy/);
    expect(html).toContain('At a glance');
    expect(html).toContain('Frequently asked questions');
    expect(html).toContain('Related reading');
    expect(html).toContain('Download ManageState for iPhone');
    expect(html).toMatch(/class="site-footer[^"]*site-footer--legacy/);
    expect(styles).toMatch(/acquisition-article[^}]*background:/);
    expect(styles).toMatch(/acquisition-article__title[^}]*color:#172033/);
  });
});
