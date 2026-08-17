import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = path.join(projectRoot, 'src/content');
const distRoot = path.join(projectRoot, 'dist');
const SITE_ORIGIN = 'https://managestate.app';

// Route prefix mirrors src/lib/acquisition.js (the single source of truth).
const ROUTE_PREFIX = { guides: '/guides' };

// Every internal link on a guide must resolve to a route that exists now or is
// an approved route published later in this same plan (Task 4 tools).
const APPROVED_ROUTES = [
  '/',
  '/privacy/',
  '/terms/',
  '/features/financial-control/',
  '/features/document-management/',
  '/features/profitability-roi/',
  '/features/tax-export/',
  '/for/small-landlords/',
  '/for/first-time-landlords/',
  '/for/growing-property-investors/',
  '/compare/landlord-app-vs-spreadsheets/',
  '/guides/property-management-app-for-small-landlords/',
  '/guides/landlord-expense-tracker/',
  '/guides/rental-income-expense-tracker/',
  '/guides/rental-property-document-organizer/',
  '/guides/landlord-tax-record-app/',
  '/tools/rental-property-roi-calculator/',
  '/tools/rental-income-expense-template/'
];

// Exact Task 3 inventory. Metadata targets come from the task brief; required
// sections are h2 fragments that must appear in the markdown body. The
// "renewal/expiry workflow only if verified" section from the brief is NOT in
// the document-organizer list because no verified source record exists for
// reminders or renewals, so the guide must omit it.
const EXPECTED_GUIDES = [
  {
    file: 'guides/property-management-app-for-small-landlords.md',
    slug: 'property-management-app-for-small-landlords',
    title: 'Choosing a Property Management App for Small Landlords | ManageState',
    h1: 'How to choose a property management app for small landlords',
    updatedAt: '2026-08-05',
    requiredSections: ['look for', 'workflow', 'essential', 'iphone', 'checklist']
  },
  {
    file: 'guides/landlord-expense-tracker.md',
    slug: 'landlord-expense-tracker',
    title: 'Landlord Expense Tracker: What to Record and How | ManageState',
    h1: 'What a landlord expense tracker should record and how to keep it current',
    updatedAt: '2026-08-05',
    requiredSections: ['record', 'habit', 'categor', 'receipt', 'monthly']
  },
  {
    file: 'guides/rental-income-expense-tracker.md',
    slug: 'rental-income-expense-tracker',
    title: 'Rental Income and Expense Tracker Guide for Landlords | ManageState',
    h1: 'Track rental income and expenses without the spreadsheet upkeep',
    updatedAt: '2026-08-05',
    requiredSections: ['income and expense model', 'per-property', 'cash flow', 'spreadsheet', 'workflow']
  },
  {
    file: 'guides/rental-property-document-organizer.md',
    slug: 'rental-property-document-organizer',
    title: "Rental Property Document Organizer: A Landlord's Guide | ManageState",
    h1: 'Organize rental property documents so you can find them again',
    updatedAt: '2026-08-05',
    requiredSections: ['inventory', 'naming', 'privacy', 'maintenance']
  },
  {
    file: 'guides/landlord-tax-record-app.md',
    slug: 'landlord-tax-record-app',
    title: 'Landlord Tax Record App: Organize Records Year-Round | ManageState',
    h1: 'How a landlord tax record app keeps records organized all year',
    updatedAt: '2026-08-05',
    requiredSections: ['year-round', 'export', 'completeness', 'jurisdiction', 'accountant']
  }
];

// Unsupported or unverified claim phrases from the Phase 0 evidence register
// (product-claims.json and docs/seo/evidence-register.md). Guides follow the
// same discipline as the Task 2 pages.
const PROHIBITED_PHRASES = [
  'trusted by thousands',
  'join thousands',
  'thousands of landlords',
  'thousands of users',
  'thousands of property owners',
  'thousands of investors',
  'bank-grade',
  'bank grade',
  'bank-level',
  'bank level',
  'military-grade',
  'encryption',
  'encrypted',
  'cloud backup',
  'up to date',
  'automated categor',
  'automatically categor',
  'free plan',
  'pro plan',
  'subscription',
  'ad-supported',
  'pricing',
  'rent collection',
  'collects rent',
  'replaces your accountant',
  'replaces accountants',
  'replaces your bank',
  'replaces your legal adviser',
  'replaces your property manager',
  'replaces property managers',
  'tax-ready',
  'tax ready',
  'ready for your tax',
  'prepares your tax',
  '1 click',
  'one click',
  // Unverified time-bound performance claims (final review finding): no
  // evidence source verifies how long a workflow takes.
  'under a minute',
  'takes seconds',
  'takes minutes',
  'a few minutes',
  'in seconds',
  'in minutes',
  'within seconds',
  'within minutes',
  'just seconds',
  'just minutes'
];

// Named third-party products: no competitor brand may appear without a cited
// source (none are cited here), matching the Task 2 comparison discipline.
const COMPETITOR_BRANDS = [
  'excel',
  'google sheets',
  'quickbooks',
  'buildium',
  'appfolio',
  'yardi',
  'turbotenant',
  'avail',
  'stessa',
  'baselane',
  'hemlane',
  'rentec',
  'doorloop'
];

function canonicalPath(guide) {
  return `${ROUTE_PREFIX.guides}/${guide.slug}/`;
}

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

function parseFaqs(frontmatter) {
  const faqs = [];
  let current = null;
  for (const line of frontmatter.split(/\r?\n/)) {
    const questionMatch = line.match(/^\s*-\s+question:\s*(.+)$/);
    const answerMatch = line.match(/^\s+answer:\s*(.+)$/);
    if (questionMatch) {
      current = { question: questionMatch[1].trim(), answer: '' };
      faqs.push(current);
    } else if (answerMatch && current) {
      current.answer = answerMatch[1].trim();
    }
  }
  return faqs.filter((faq) => faq.question && faq.answer);
}

function readEntry(guide) {
  const filePath = path.join(contentRoot, guide.file);
  const raw = readFileSync(filePath, 'utf8');
  const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fence) {
    throw new Error(`${guide.file}: missing frontmatter block`);
  }
  const fm = parseFrontmatter(fence[1]);
  const scalar = (key) => (fm[key]?.[0] ?? '').replace(/^(['"])(.*)\1$/, '$2');
  const list = (key) => (fm[key] ?? []).map((item) => item.replace(/^(['"])(.*)\1$/, '$2'));
  return {
    raw,
    frontmatter: fence[1],
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
    related: list('related'),
    faqs: parseFaqs(fence[1])
  };
}

function bodyLinks(body) {
  return [...body.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]);
}

function clusterForRoute(href) {
  if (href === '/') {
    return 'site';
  }
  for (const [collection, prefix] of Object.entries(ROUTE_PREFIX)) {
    if (href.startsWith(`${prefix}/`)) {
      return collection;
    }
  }
  if (href.startsWith('/features/')) {
    return 'features';
  }
  if (href.startsWith('/for/')) {
    return 'audiences';
  }
  if (href.startsWith('/compare/')) {
    return 'comparisons';
  }
  if (href.startsWith('/tools/')) {
    return 'tools';
  }
  return 'site';
}

// 5-word shingle sets over the plain-text body. The normalization keeps the
// actual words (lowercased, non-alphanumerics turned into spaces); it must not
// strip the text away, or the similarity check would silently pass on empty
// sets. The size guards below make that failure mode impossible.
function bodyWords(body) {
  return body
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(text) {
  const words = bodyWords(text);
  const set = new Set();
  for (let index = 0; index + 5 <= words.length; index += 1) {
    set.add(words.slice(index, index + 5).join(' '));
  }
  return set;
}

function jaccard(left, right) {
  if (left.size === 0 && right.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const shingle of left) {
    if (right.has(shingle)) {
      intersection += 1;
    }
  }
  return intersection / (left.size + right.size - intersection);
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

describe('query-answering guides inventory', () => {
  it('publishes exactly the five expected guide routes', () => {
    for (const guide of EXPECTED_GUIDES) {
      const filePath = path.join(contentRoot, guide.file);
      expect(existsSync(filePath), `${guide.file} must exist`).toBe(true);
      const entry = readEntry(guide);
      expect(entry.status, `${guide.file} must be published`).toBe('published');
      expect(entry.cluster, `${guide.file} cluster`).toBe('guides');
      expect(entry.campaign, `${guide.file} campaign`).toBe('website-guides');
      expect(entry.lang, `${guide.file} language`).toBe('en');
      expect(entry.translationKey, `${guide.file} translation key`).toBe(guide.slug);
      expect(canonicalPath(guide), `${guide.file} canonical path`).toBe(
        `${ROUTE_PREFIX.guides}/${guide.slug}/`
      );
    }

    const actualFiles = [];
    const dir = path.join(contentRoot, 'guides');
    if (existsSync(dir)) {
      for (const file of readdirSync(dir)) {
        if (file.endsWith('.md')) {
          actualFiles.push(`guides/${file}`);
        }
      }
    }
    expect(actualFiles.sort()).toEqual(EXPECTED_GUIDES.map((guide) => guide.file).sort());
  });

  it('matches the approved metadata targets for every guide', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      expect(entry.title, `${guide.file} title`).toBe(guide.title);
      expect(entry.h1, `${guide.file} h1`).toBe(guide.h1);
      expect(entry.updatedAt, `${guide.file} updated date`).toBe(guide.updatedAt);
      expect(entry.intent.length, `${guide.file} intent length`).toBeGreaterThanOrEqual(10);
      expect(entry.description.length, `${guide.file} description length`).toBeGreaterThanOrEqual(110);
      expect(entry.description.length, `${guide.file} description length`).toBeLessThanOrEqual(165);
    }
  });

  it('keeps metadata unique across the five guides', () => {
    const titles = new Set();
    const h1s = new Set();
    const descriptions = new Set();
    const keys = new Set();
    const canonicals = new Set();
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      titles.add(entry.title);
      h1s.add(entry.h1);
      descriptions.add(entry.description);
      keys.add(entry.translationKey);
      canonicals.add(canonicalPath(guide));
    }
    expect(titles.size).toBe(EXPECTED_GUIDES.length);
    expect(h1s.size).toBe(EXPECTED_GUIDES.length);
    expect(descriptions.size).toBe(EXPECTED_GUIDES.length);
    expect(keys.size).toBe(EXPECTED_GUIDES.length);
    expect(canonicals.size).toBe(EXPECTED_GUIDES.length);
  });

  it('answers the query directly in the opening paragraph', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      expect(entry.openingAnswer.length, `${guide.file} opening answer length`).toBeGreaterThanOrEqual(80);
      // The opening must answer the query with topical language (prefix match,
      // so "records" matches record and "tracker" matches track).
      expect(
        entry.openingAnswer,
        `${guide.file} opening answer must not be a bare product pitch`
      ).toMatch(/\b(choose|choos|select|record|track|organiz|export|document)/i);
    }
  });

  it('provides a 3-5 sentence summary and a valid updated date', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      expect(entry.summary.length, `${guide.file} summary count`).toBeGreaterThanOrEqual(3);
      expect(entry.summary.length, `${guide.file} summary count`).toBeLessThanOrEqual(5);
      for (const point of entry.summary) {
        expect(point.length, `${guide.file} summary point`).toBeGreaterThanOrEqual(20);
        expect(point.trim().endsWith('.'), `${guide.file} summary point must be a sentence`).toBe(true);
      }
      const parsed = new Date(entry.updatedAt);
      expect(Number.isNaN(parsed.getTime()), `${guide.file} updated date must parse`).toBe(false);
      expect(parsed.getTime(), `${guide.file} updated date must not be in the future`).toBeLessThanOrEqual(Date.now());
    }
  });

  it('contains at least three meaningful H2 sections, including the brief sections', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      const h2s = [...entry.body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
      const meaningful = h2s.filter((heading) => heading.split(/\s+/).length >= 3);
      expect(meaningful.length, `${guide.file} must have at least 3 meaningful h2 sections`).toBeGreaterThanOrEqual(3);
      for (const fragment of guide.requiredSections) {
        expect(
          h2s.some((heading) => heading.includes(fragment.toLowerCase())),
          `${guide.file} needs an h2 containing "${fragment}"`
        ).toBe(true);
      }
    }
  });

  it('links every guide to at least two related routes and two cross-cluster routes', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      expect(entry.related.length, `${guide.file} related links`).toBeGreaterThanOrEqual(2);
      const links = [...entry.related, ...bodyLinks(entry.body)];
      const crossCluster = links.filter((href) => {
        const cluster = clusterForRoute(href);
        return cluster !== 'site' && cluster !== 'guides';
      });
      expect(crossCluster.length, `${guide.file} cross-cluster links`).toBeGreaterThanOrEqual(2);
    }
  });

  it('resolves every internal link to an approved route', () => {
    const known = new Set(APPROVED_ROUTES);
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      for (const href of [...entry.related, ...bodyLinks(entry.body)]) {
        if (/^https?:\/\//.test(href)) {
          expect(href.startsWith('https://apps.apple.com'), `${guide.file} external link ${href}`).toBe(true);
          continue;
        }
        const normalized = href.startsWith('/') ? (href.endsWith('/') ? href : `${href}/`) : `/${href}`;
        expect(known.has(normalized), `${guide.file} link ${href} must resolve to an approved route`).toBe(true);
      }
    }
  });

  it('publishes no visible FAQ questions until verified question-source records exist', () => {
    // Brief Step 3 requires FAQ questions copied verbatim from a verified
    // source record. seo-ops/keywords/search-console-questions.json is empty
    // and the evidence register holds no question-shaped records, so publish
    // zero FAQs rather than inventing questions. Re-add FAQs only with
    // verbatim source questions and update this assertion.
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      expect(entry.faqs.length, `${guide.file} must not publish invented FAQ questions`).toBe(0);
    }
  });

  it('omits prohibited, unsupported, and security-related claim phrases', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      const haystack = entry.raw.toLowerCase();
      for (const phrase of PROHIBITED_PHRASES) {
        expect(haystack.includes(phrase), `${guide.file} must not contain "${phrase}"`).toBe(false);
      }
      expect(
        entry.raw.match(/\b(secure|security|encryption|encrypted|backup|cloud|sync|ios|android|ipad)\b/i),
        `${guide.file} must not contain unsupported security/device/sync wording`
      ).toBe(null);
    }
  });

  it('never names a competitor product without a cited source', () => {
    for (const guide of EXPECTED_GUIDES) {
      const entry = readEntry(guide);
      for (const brand of COMPETITOR_BRANDS) {
        expect(
          new RegExp(`\\b${brand}\\b`, 'i').test(entry.raw),
          `${guide.file} must not name competitor "${brand}"`
        ).toBe(false);
      }
    }
  });

  it('keeps the document-organizer guide free of unverified reminder claims', () => {
    const guide = EXPECTED_GUIDES.find((candidate) => candidate.slug === 'rental-property-document-organizer');
    const entry = readEntry(guide);
    const forbidden = /\b(reminder|reminders|alert|alerts|notification|notifications|expiry|expires|expiration|renewal|renewals|renew)\b/i;
    expect(forbidden.test(entry.raw), 'document-organizer guide must not claim reminders or renewals').toBe(false);
  });

  it('keeps guide bodies distinct: meaningful shingle sets and low pairwise similarity', () => {
    const bodies = EXPECTED_GUIDES.map((guide) => readEntry(guide).body);
    const sets = bodies.map((body) => {
      const words = bodyWords(body);
      expect(words.length, 'each guide body must contain real text').toBeGreaterThanOrEqual(200);
      const set = shingles(body);
      // The similarity check must never pass on emptied text: a real body
      // produces hundreds of unique 5-word shingles.
      expect(set.size, 'each guide body must produce a substantial shingle set').toBeGreaterThanOrEqual(50);
      return set;
    });

    let worst = 0;
    for (let left = 0; left < sets.length; left += 1) {
      for (let right = left + 1; right < sets.length; right += 1) {
        worst = Math.max(worst, jaccard(sets[left], sets[right]));
      }
    }
    expect(worst, 'worst pairwise 5-word-shingle similarity').toBeLessThanOrEqual(0.7);
  });
});

describe('built guide pages', () => {
  it('publishes all five routes with Article schema, visible dates, and working CTAs', () => {
    // Full-suite runs happen after a build; skip built-output checks when dist
    // is absent (homepage tests already fail without dist).
    if (!existsSync(distRoot)) {
      return;
    }

    for (const guide of EXPECTED_GUIDES) {
      const route = canonicalPath(guide);
      const htmlPath = path.join(distRoot, route.slice(1), 'index.html');
      expect(existsSync(htmlPath), `${route} must be built`).toBe(true);
      const html = readFileSync(htmlPath, 'utf8');

      expect(html).toContain(`<title>${guide.title.replace(/'/g, '&#39;')}</title>`);
      expect(html).toContain(`href="${SITE_ORIGIN}${route}"`);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => normalizeText(match[1]));
      expect(h1s, `${route} must render exactly one h1`).toEqual([guide.h1]);

      // Visible App Store CTA rendered by AcquisitionLayout (one per page).
      expect(html, `${route} App Store CTA`).toContain('data-app-store-click');
      expect(html, `${route} CTA campaign`).toContain('data-campaign="website-guides"');
      expect(html, `${route} CTA placement`).toContain('data-cta-placement="content"');
      expect(html, `${route} CTA page path`).toContain(`data-page-path="${route}"`);

      // The updated date is visible on the page and matches the schema date.
      expect(html, `${route} visible updated date`).toContain('Last updated');
      expect(html, `${route} visible updated date value`).toContain('August 5, 2026');

      // Exactly one Article schema with a visible-date and Organization author.
      const schemaBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
        .map((match) => match[1]);
      const articleSchemas = schemaBlocks
        .map((block) => JSON.parse(block))
        .filter((schema) => schema['@type'] === 'Article');
      expect(articleSchemas.length, `${route} must emit exactly one Article schema`).toBe(1);
      const article = articleSchemas[0];
      expect(article.headline, `${route} Article headline`).toBe(guide.h1);
      expect(article.dateModified, `${route} Article dateModified`).toBe(`${guide.updatedAt}T00:00:00.000Z`);
      expect(article.datePublished, `${route} Article datePublished`).toBe(`${guide.updatedAt}T00:00:00.000Z`);
      expect(article.author['@type'], `${route} Article author type`).toBe('Organization');
      expect(article.author.name, `${route} Article author name`).toBe('ManageState');
      expect(article.publisher['@type'], `${route} Article publisher type`).toBe('Organization');
      expect(article.url, `${route} Article url`).toBe(`${SITE_ORIGIN}${route}`);

      // FAQ schema is omitted and no visible FAQ is published: no verified
      // question-source records exist and policy eligibility is uncertain.
      const faqSchemas = schemaBlocks
        .map((block) => JSON.parse(block))
        .filter((schema) => schema['@type'] === 'FAQPage');
      expect(faqSchemas.length, `${route} must not emit FAQPage schema`).toBe(0);
    }
  });
});
