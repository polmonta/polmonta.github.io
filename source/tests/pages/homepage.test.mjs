import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const homepagePath = path.join(projectRoot, 'dist/index.html');

function readHomepage() {
  return readFileSync(homepagePath, 'utf8');
}

const expectedTitle = 'Property Management App for Small Landlords | ManageState';
const expectedDescription = 'Track rental income, expenses, documents, and property performance in one straightforward iPhone app for independent landlords.';
const expectedAppStoreId = '6751497970';
const expectedPrimaryCta = 'Download ManageState for iPhone';

function normalizeText(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function getAttribute(tag, attributeName) {
  return tag.match(new RegExp(`\\b${attributeName}=["']([^"']*)["']`, 'i'))?.[1];
}

function parseJsonLd(html) {
  return [...html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )].map(([, content]) => JSON.parse(content));
}

function parseAppStoreUrl(href) {
  const url = new URL(href.replaceAll('&amp;', '&'));
  expect(url.protocol).toBe('https:');
  expect(url.hostname).toBe('apps.apple.com');
  expect(url.pathname).toBe(`/app/managestate/id${expectedAppStoreId}`);

  const queryKeys = [...url.searchParams.keys()];
  if (queryKeys.length === 0) {
    return url;
  }

  expect(queryKeys.length).toBe(3);
  expect([...new Set(queryKeys)].sort()).toEqual(['ct', 'mt', 'pt']);
  expect(url.searchParams.get('pt')).toBeTruthy();
  expect(url.searchParams.get('ct')).toBe('website-home');
  expect(url.searchParams.get('mt')).toBe('8');
  return url;
}

describe('built homepage contract', () => {
  it('renders the approved metadata and substantive, crawlable static content', () => {
    const html = readHomepage();
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1];
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1];
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    const heroImage = html.match(/<img\b[^>]*src=["']\/hero-tilted\.png["'][^>]*>/i)?.[0];
    const primaryCtas = [...html.matchAll(
      /<a\b[^>]*\bclass=["'][^"']*\bbutton--primary\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi
    )].map(([tag]) => ({
      tag,
      href: getAttribute(tag, 'href'),
      content: tag.match(/>([\s\S]*)<\/a>\s*$/i)?.[1] ?? ''
    }));

    const structuredData = parseJsonLd(html);
    const organizationSchema = structuredData.find((schema) => schema['@type'] === 'Organization');
    const applicationSchema = structuredData.find((schema) => schema['@type'] === 'SoftwareApplication');

    expect(title).toBe(expectedTitle);
    expect(description).toBe(expectedDescription);
    expect(canonical).toBe('https://managestate.app/');
    expect(structuredData).toHaveLength(2);
    expect(organizationSchema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ManageState',
      url: 'https://managestate.app'
    });
    expect(applicationSchema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ManageState',
      operatingSystem: 'iOS',
      applicationCategory: 'BusinessApplication',
      downloadUrl: 'https://apps.apple.com/app/managestate/id6751497970'
    });
    expect(applicationSchema).not.toHaveProperty('aggregateRating');
    expect(headings).toHaveLength(1);
    expect(normalizeText(headings[0][1])).toBe('Rental property management, without spreadsheet chaos.');
    expect(primaryCtas).toHaveLength(4);
    expect(primaryCtas.map(({ content }) => normalizeText(content))).toEqual([
      expectedPrimaryCta,
      expectedPrimaryCta,
      expectedPrimaryCta,
      expectedPrimaryCta
    ]);
    primaryCtas.forEach(({ href }) => {
      expect(href).toBeTruthy();
      parseAppStoreUrl(href);
    });
    expect([...html.matchAll(/data-cta-placement="([^"]+)"/gi)].map(([, placement]) => placement)).toEqual([
      'nav',
      'hero',
      'evidence',
      'final'
    ]);
    expect(primaryCtas.every(({ tag }) => (
      tag.includes('data-app-store-click')
      && tag.includes('data-page-path="/"')
      && tag.includes('data-content-cluster="home"')
      && tag.includes('data-language="en"')
      && tag.includes('data-campaign="website-home"')
    ))).toBe(true);
    expect(html).not.toContain('avatar.vercel.sh');
    expect(html).not.toContain('Join thousands');
    expect(html).not.toMatch(/href=["']#["']/i);
    expect(heroImage).toBeTruthy();
    expect(heroImage).toMatch(/alt=["']ManageState dashboard showing rental property finances and portfolio performance["']/i);
    expect(html).toMatch(/<section\s+id=["']features["']/i);
    expect(html).toMatch(/<section\s+id=["']faq["']/i);
    expect(html).toContain('Verified workflows include ManageState calculates monthly income');
    expect(html).not.toContain('Detailed workflow information is not included until the relevant product evidence has been validated.');
    expect(html).toMatch(/href=["']#features["']/i);
    expect(html).toMatch(/href=["']#faq["']/i);
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain('href="/terms/"');
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)?.[1] ?? '';
    expect(footer).not.toContain('App Store');
    expect(html).toMatch(/App Store listing<\/a>\s*\(informational, not a measured CTA\)/i);
    expect(existsSync(path.join(projectRoot, 'dist/vite.svg'))).toBe(false);
  });
});
