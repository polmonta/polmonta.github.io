import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = path.join(projectRoot, 'src/content');
const distRoot = path.join(projectRoot, 'dist');
const SITE_ORIGIN = 'https://managestate.app';
const CSV_RELATIVE_PATH = 'public/downloads/rental-income-expense-template.csv';
const CSV_ABS_PATH = path.join(projectRoot, CSV_RELATIVE_PATH);
const TEMPLATE_ROUTE = '/tools/rental-income-expense-template/';
const CALCULATOR_ROUTE = '/tools/rental-property-roi-calculator/';

// Exact brief contract: one header row and one clearly-marked example row.
const HEADER_ROW = 'property,date,type,category,description,amount,currency,document_reference';
const EXAMPLE_ROW = 'Example Apartment,2026-01-05,expense,maintenance,Example plumbing repair,125.00,USD,receipt-001';
const FIELDS = [
  'property',
  'date',
  'type',
  'category',
  'description',
  'amount',
  'currency',
  'document_reference'
];

const REQUIRED_TEMPLATE_LINKS = [
  '/features/financial-control/',
  '/guides/landlord-expense-tracker/',
  '/guides/landlord-tax-record-app/'
];

const REQUIRED_CALCULATOR_LINKS = ['/features/profitability-roi/', '/for/small-landlords/'];

function parseFrontmatter(frontmatter) {
  const entries = {};
  let currentKey = null;
  for (const line of frontmatter.split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      entries[currentKey] = value ? [value] : [];
    } else if (currentKey && /^\s*-\s+(.+)$/.test(line)) {
      entries[currentKey].push(line.match(/^\s*-\s+(.+)$/)[1].trim());
    }
  }
  return entries;
}

function readEntry(relativePath) {
  const filePath = path.join(contentRoot, relativePath);
  const raw = readFileSync(filePath, 'utf8');
  const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fence) {
    throw new Error(`${relativePath}: missing frontmatter block`);
  }
  const fm = parseFrontmatter(fence[1]);
  const scalar = (key) => (fm[key]?.[0] ?? '').replace(/^(['"])(.*)\1$/, '$2');
  const list = (key) => (fm[key] ?? []).map((item) => item.replace(/^(['"])(.*)\1$/, '$2'));
  return {
    raw,
    body: raw.slice(fence[0].length),
    title: scalar('title'),
    description: scalar('description'),
    h1: scalar('h1'),
    summary: list('summary'),
    openingAnswer: scalar('openingAnswer'),
    intent: scalar('intent'),
    cluster: scalar('cluster'),
    campaign: scalar('campaign'),
    lang: scalar('lang'),
    translationKey: scalar('translationKey'),
    status: scalar('status'),
    updatedAt: scalar('updatedAt'),
    related: list('related')
  };
}

function bodyLinks(body) {
  return [...body.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]);
}

function normalizeText(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

describe('rental income and expense CSV template contract', () => {
  it('ships the CSV template at the expected public path', () => {
    expect(existsSync(CSV_ABS_PATH), `${CSV_RELATIVE_PATH} must exist`).toBe(true);
  });

  it('contains exactly the brief header row and one example row as data rows', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    const dataRows = csv
      .split(/\r?\n/)
      .filter((line) => line.trim() !== '' && !line.startsWith('#'));
    expect(dataRows).toEqual([HEADER_ROW, EXAMPLE_ROW]);
  });

  it('keeps the CSV bytes clean: LF endings, one trailing newline, no BOM or trailing spaces', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    expect(csv.charCodeAt(0), 'must not start with a BOM').not.toBe(0xfeff);
    expect(csv, 'must use LF line endings').not.toContain('\r');
    expect(csv.endsWith('\n'), 'must end with a single newline').toBe(true);
    expect(csv.slice(0, -1).endsWith('\n'), 'must end with exactly one newline').toBe(false);
    expect(csv, 'must not contain trailing whitespace').not.toMatch(/[ \t]+$/m);
  });

  it('matches the brief header and example rows byte for byte', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    expect(csv).toContain(`${HEADER_ROW}\n${EXAMPLE_ROW}`);
  });

  it('explains every field in the template', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    for (const field of FIELDS) {
      expect(csv, `must explain the ${field} field`).toMatch(new RegExp(`^# ${field}:`, 'm'));
    }
  });

  it('advises users to delete the example row', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    expect(csv, 'must tell users to delete the example row').toMatch(/delete the example row/i);
  });

  it('states that categories are organizational, not tax advice', () => {
    const csv = readFileSync(CSV_ABS_PATH, 'utf8');
    expect(csv, 'must carry a not-tax-advice statement').toMatch(/not tax advice/i);
    expect(csv, 'must call categories organizational').toMatch(/organizational/i);
  });
});

describe('tool entry metadata and internal links', () => {
  it('publishes the template entry with tools metadata and the required links', () => {
    const entry = readEntry('tools/rental-income-expense-template.md');
    expect(entry.status).toBe('published');
    expect(entry.cluster).toBe('tools');
    expect(entry.campaign).toBe('website-tools');
    expect(entry.lang).toBe('en');
    expect(entry.translationKey).toBe('rental-income-expense-template');
    expect(entry.related).toEqual(REQUIRED_TEMPLATE_LINKS);
    expect(entry.description.length).toBeGreaterThanOrEqual(110);
    expect(entry.description.length).toBeLessThanOrEqual(165);
    expect(entry.openingAnswer.length).toBeGreaterThanOrEqual(80);
    expect(entry.summary.length).toBeGreaterThanOrEqual(3);
    expect(entry.summary.length).toBeLessThanOrEqual(5);
  });

  it('links the template page to the CSV download and repeats the usage rules', () => {
    const entry = readEntry('tools/rental-income-expense-template.md');
    expect(entry.body).toContain('/downloads/rental-income-expense-template.csv');
    expect(entry.body).toMatch(/delete the example row/i);
    expect(entry.body).toMatch(/not tax advice/i);
  });

  it('publishes the calculator entry with tools metadata and the required links', () => {
    const entry = readEntry('tools/rental-property-roi-calculator.mdx');
    expect(entry.status).toBe('published');
    expect(entry.cluster).toBe('tools');
    expect(entry.campaign).toBe('website-tools');
    expect(entry.lang).toBe('en');
    expect(entry.translationKey).toBe('rental-property-roi-calculator');
    expect(entry.related).toEqual(REQUIRED_CALCULATOR_LINKS);
    expect(entry.description.length).toBeGreaterThanOrEqual(110);
    expect(entry.description.length).toBeLessThanOrEqual(165);
    expect(entry.openingAnswer.length).toBeGreaterThanOrEqual(80);
    expect(entry.summary.length).toBeGreaterThanOrEqual(3);
    expect(entry.summary.length).toBeLessThanOrEqual(5);
  });

  it('embeds the calculator island with client:visible hydration only', () => {
    const entry = readEntry('tools/rental-property-roi-calculator.mdx');
    expect(entry.body).toContain("import RoiCalculator from '../../components/tools/RoiCalculator.jsx';");
    expect(entry.body).toMatch(/<RoiCalculator\s+client:visible\s*\/>/);
  });

  it('keeps every tool body link on an approved route', () => {
    const known = new Set([
      '/',
      ...REQUIRED_TEMPLATE_LINKS,
      ...REQUIRED_CALCULATOR_LINKS
    ]);
    for (const relativePath of [
      'tools/rental-income-expense-template.md',
      'tools/rental-property-roi-calculator.mdx'
    ]) {
      const entry = readEntry(relativePath);
      for (const href of bodyLinks(entry.body)) {
        if (/^https?:\/\//.test(href)) {
          expect(href.startsWith('https://apps.apple.com'), `${relativePath} external link ${href}`).toBe(true);
          continue;
        }
        if (href.startsWith('/downloads/')) {
          expect(existsSync(path.join(projectRoot, 'public', href)), `${relativePath} download ${href} must exist`).toBe(true);
          continue;
        }
        const normalized = href.startsWith('/') ? (href.endsWith('/') ? href : `${href}/`) : `/${href}`;
        expect(known.has(normalized), `${relativePath} link ${href} must resolve to an approved route`).toBe(true);
      }
    }
  });
});

describe('built tool pages', () => {
  it('publishes both tool routes with tool metadata and working CTA payloads', () => {
    if (!existsSync(distRoot)) {
      return;
    }

    for (const route of [TEMPLATE_ROUTE, CALCULATOR_ROUTE]) {
      const htmlPath = path.join(distRoot, route.slice(1), 'index.html');
      expect(existsSync(htmlPath), `${route} must be built`).toBe(true);
      const html = readFileSync(htmlPath, 'utf8');
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => normalizeText(match[1]));
      expect(h1s.length, `${route} must render exactly one h1`).toBe(1);
      expect(html, `${route} App Store CTA`).toContain('data-app-store-click');
      expect(html, `${route} CTA campaign`).toContain('data-campaign="website-tools"');
      expect(html, `${route} CTA placement`).toContain('data-cta-placement="content"');
      expect(html, `${route} CTA page path`).toContain(`data-page-path="${route}"`);
      expect(html, `${route} canonical`).toContain(`href="${SITE_ORIGIN}${route}"`);
    }

    const templateHtml = readFileSync(path.join(distRoot, TEMPLATE_ROUTE.slice(1), 'index.html'), 'utf8');
    expect(templateHtml, 'template page must link to the shipped CSV').toContain(
      'href="/downloads/rental-income-expense-template.csv"'
    );
  });
});
