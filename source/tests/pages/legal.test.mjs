import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const legalPages = {
  privacy: path.join(projectRoot, 'dist/privacy/index.html'),
  terms: path.join(projectRoot, 'dist/terms/index.html')
};

function readLegalPage(page) {
  const pagePath = legalPages[page];
  expect(existsSync(pagePath)).toBe(true);
  return readFileSync(pagePath, 'utf8');
}

function getPrimaryNavigation(html) {
  return html.match(
    /<nav\b[^>]*aria-label=["']Primary navigation["'][^>]*>([\s\S]*?)<\/nav>/i
  )?.[1] ?? '';
}

function getHrefValues(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(([, href]) => href);
}

describe('built legal page contract', () => {
  it('preserves the approved privacy effective date and source-identifying phrases', () => {
    const html = readLegalPage('privacy');

    expect(html).toContain('Effective Date: November 13, 2025');
    expect(html).toContain('default marketing-site pageview measurement');
    expect(html).toContain('When you create an account or use ManageState');
    expect(html).toContain('Your data is securely stored using Supabase');
  });

  it('preserves source-identifying phrases from the approved terms', () => {
    const html = readLegalPage('terms');

    expect(html).toContain('LICENSED APPLICATION END USER LICENSE AGREEMENT');
    expect(html).toContain('a. Scope of License: Licensor grants to you a nontransferable license');
    expect(html).toContain('b. Consent to Use of Data: You agree that Licensor may collect and use technical data');
  });

  it('routes legal-page section navigation to homepage fragments', () => {
    for (const page of Object.values(legalPages)) {
      const html = readFileSync(page, 'utf8');
      const navigationHrefs = getHrefValues(getPrimaryNavigation(html));

      expect(navigationHrefs).toContain('/#features');
      expect(navigationHrefs).toContain('/#faq');
      expect(navigationHrefs).not.toContain('#features');
      expect(navigationHrefs).not.toContain('#faq');
    }
  });
});
