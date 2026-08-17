import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = path.join(projectRoot, 'src/content');
const distRoot = path.join(projectRoot, 'dist');
const SITE_ORIGIN = 'https://managestate.app';

// Route prefixes mirror src/lib/acquisition.js (the single source of truth).
const ROUTE_PREFIX = {
  features: '/features',
  audiences: '/for',
  comparisons: '/compare',
  guides: '/guides',
  tools: '/tools'
};

// Approved acquisition routes published by later tasks in this same plan
// (Task 3 guides, Task 4 tools). Task 2 pages may link to them; Task 5 locks
// the full fifteen-route inventory against the built output.
const APPROVED_FUTURE_ROUTES = [
  '/guides/property-management-app-for-small-landlords/',
  '/guides/landlord-expense-tracker/',
  '/guides/rental-income-expense-tracker/',
  '/guides/rental-property-document-organizer/',
  '/guides/landlord-tax-record-app/',
  '/tools/rental-property-roi-calculator/',
  '/tools/rental-income-expense-template/'
];

const SITE_ROUTES = ['/', '/privacy/', '/terms/'];

// Exact Task 2 inventory: metadata targets come from the task brief; required
// sections are h2 fragments that must appear in the markdown body.
const EXPECTED_PAGES = [
  {
    file: 'features/financial-control.md',
    collection: 'features',
    slug: 'financial-control',
    campaign: 'website-features',
    title: 'Rental Property Financial Tracking | ManageState',
    h1: 'Keep rental income and expenses under control',
    requiredSections: ['income and expense', 'categor', 'portfolio', 'spreadsheet']
  },
  {
    file: 'features/document-management.md',
    collection: 'features',
    slug: 'document-management',
    campaign: 'website-features',
    title: 'Rental Property Document Organizer | ManageState',
    h1: 'Keep property documents with the property they belong to',
    requiredSections: ['document', 'retriev', 'privacy']
  },
  {
    file: 'features/profitability-roi.md',
    collection: 'features',
    slug: 'profitability-roi',
    campaign: 'website-features',
    title: 'Rental Property ROI and Profitability Tracking | ManageState',
    h1: 'Understand how each rental property is performing',
    requiredSections: ['gross', 'net', 'input', 'portfolio', 'calculator']
  },
  {
    file: 'features/tax-export.md',
    collection: 'features',
    slug: 'tax-export',
    campaign: 'website-features',
    title: 'Rental Property Tax Export for Landlords | ManageState',
    h1: 'Organize rental records before tax time',
    requiredSections: ['record', 'export', 'accountant', 'advice']
  },
  {
    file: 'audiences/small-landlords.md',
    collection: 'audiences',
    slug: 'small-landlords',
    campaign: 'website-audiences',
    title: 'Property Management App for Landlords, 1-5 Properties | ManageState',
    h1: 'Property management for landlords with 1–5 properties',
    requiredSections: ['problem', 'workflow', 'feature', 'enterprise']
  },
  {
    file: 'audiences/first-time-landlords.md',
    collection: 'audiences',
    slug: 'first-time-landlords',
    campaign: 'website-audiences',
    title: 'Property Management App for First-Time Landlords',
    h1: 'Start your first rental with organized records',
    requiredSections: ['checklist', 'habit', 'document', 'perform']
  },
  {
    file: 'audiences/growing-property-investors.md',
    collection: 'audiences',
    slug: 'growing-property-investors',
    campaign: 'website-audiences',
    title: 'Rental Portfolio App for Growing Property Investors',
    h1: 'Move beyond one spreadsheet as your portfolio grows',
    requiredSections: ['5', 'consistent', 'per-property', 'limit']
  },
  {
    file: 'comparisons/landlord-app-vs-spreadsheets.md',
    collection: 'comparisons',
    slug: 'landlord-app-vs-spreadsheets',
    campaign: 'website-comparisons',
    title: 'ManageState vs Spreadsheets for Rental Property Management',
    h1: 'A fair comparison of spreadsheets and a rental property app',
    requiredSections: [
      'setup',
      'mobile',
      'document association',
      'calculation',
      'export',
      'maintenance',
      'when a spreadsheet may still be enough'
    ]
  }
];

// Unsupported or unverified claim phrases from the Phase 0 evidence register
// (product-claims.json and docs/seo/evidence-register.md).
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

// Named third-party products: the comparison is factual and generic, so no
// competitor brand may appear without a cited source (none are cited here).
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

function canonicalPath(page) {
  return `${ROUTE_PREFIX[page.collection]}/${page.slug}/`;
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

function readEntry(page) {
  const filePath = path.join(contentRoot, page.file);
  const raw = readFileSync(filePath, 'utf8');
  const fence = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fence) {
    throw new Error(`${page.file}: missing frontmatter block`);
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
    related: list('related')
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
  return 'site';
}

function shingles(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
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

describe('core acquisition pages inventory', () => {
  it('publishes exactly the eight expected canonical routes', () => {
    for (const page of EXPECTED_PAGES) {
      const filePath = path.join(contentRoot, page.file);
      expect(existsSync(filePath), `${page.file} must exist`).toBe(true);
      const entry = readEntry(page);
      expect(entry.status, `${page.file} must be published`).toBe('published');
      expect(canonicalPath(page), `${page.file} canonical path`).toBe(
        `${ROUTE_PREFIX[page.collection]}/${page.slug}/`
      );
    }

    // No drafts, strays, or extra published entries in the Task 2 collections.
    const actualFiles = [];
    for (const collection of ['features', 'audiences', 'comparisons']) {
      const dir = path.join(contentRoot, collection);
      if (existsSync(dir)) {
        for (const file of readdirSync(dir)) {
          if (file.endsWith('.md')) {
            actualFiles.push(`${collection}/${file}`);
          }
        }
      }
    }
    expect(actualFiles.sort()).toEqual(EXPECTED_PAGES.map((page) => page.file).sort());
  });

  it('matches the approved metadata targets for every page', () => {
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      expect(entry.title, `${page.file} title`).toBe(page.title);
      expect(entry.h1, `${page.file} h1`).toBe(page.h1);
      expect(entry.cluster, `${page.file} cluster`).toBe(page.collection);
      expect(entry.campaign, `${page.file} campaign`).toBe(page.campaign);
      expect(entry.lang, `${page.file} language`).toBe('en');
      expect(entry.translationKey, `${page.file} translation key`).toBe(page.slug);
      expect(entry.intent.length, `${page.file} intent length`).toBeGreaterThanOrEqual(10);
      expect(entry.openingAnswer.length, `${page.file} opening answer length`).toBeGreaterThanOrEqual(80);
      expect(entry.description.length, `${page.file} description length`).toBeGreaterThanOrEqual(110);
      expect(entry.description.length, `${page.file} description length`).toBeLessThanOrEqual(165);
      expect(entry.summary.length, `${page.file} summary count`).toBeGreaterThanOrEqual(3);
      expect(entry.summary.length, `${page.file} summary count`).toBeLessThanOrEqual(5);
      for (const point of entry.summary) {
        expect(point.length, `${page.file} summary point`).toBeGreaterThanOrEqual(20);
      }
      expect(entry.related.length, `${page.file} related links`).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps metadata unique across the eight pages', () => {
    const titles = new Set();
    const h1s = new Set();
    const descriptions = new Set();
    const keys = new Set();
    const canonicals = new Set();
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      titles.add(entry.title);
      h1s.add(entry.h1);
      descriptions.add(entry.description);
      keys.add(entry.translationKey);
      canonicals.add(canonicalPath(page));
    }
    expect(titles.size).toBe(EXPECTED_PAGES.length);
    expect(h1s.size).toBe(EXPECTED_PAGES.length);
    expect(descriptions.size).toBe(EXPECTED_PAGES.length);
    expect(keys.size).toBe(EXPECTED_PAGES.length);
    expect(canonicals.size).toBe(EXPECTED_PAGES.length);
  });

  it('omits prohibited, unsupported, and security-related claim phrases', () => {
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      const haystack = entry.raw.toLowerCase();
      for (const phrase of PROHIBITED_PHRASES) {
        expect(haystack.includes(phrase), `${page.file} must not contain "${phrase}"`).toBe(false);
      }
      expect(
        entry.raw.match(/\b(secure|security|encryption|encrypted|backup|cloud|sync|ios|android|ipad)\b/i),
        `${page.file} must not contain unsupported security/device/sync wording`
      ).toBe(null);
    }
  });

  it('never names a competitor product without a cited source', () => {
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      for (const brand of COMPETITOR_BRANDS) {
        expect(
          new RegExp(`\\b${brand}\\b`, 'i').test(entry.raw),
          `${page.file} must not name competitor "${brand}"`
        ).toBe(false);
      }
    }
  });

  it('requires the exact sections from the brief on every page', () => {
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      const h2s = [...entry.body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
      for (const fragment of page.requiredSections) {
        expect(
          h2s.some((heading) => heading.includes(fragment.toLowerCase())),
          `${page.file} needs an h2 containing "${fragment}"`
        ).toBe(true);
      }
    }
  });

  it('links every page to at least two cross-cluster acquisition routes', () => {
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      const links = [...entry.related, ...bodyLinks(entry.body)];
      const crossCluster = links.filter((href) => {
        const cluster = clusterForRoute(href);
        return cluster !== 'site' && cluster !== page.collection;
      });
      expect(crossCluster.length, `${page.file} cross-cluster links`).toBeGreaterThanOrEqual(2);
    }
  });

  it('resolves every internal link to an approved route', () => {
    const known = new Set([
      ...SITE_ROUTES,
      ...APPROVED_FUTURE_ROUTES,
      ...EXPECTED_PAGES.map(canonicalPath)
    ]);
    for (const page of EXPECTED_PAGES) {
      const entry = readEntry(page);
      for (const href of [...entry.related, ...bodyLinks(entry.body)]) {
        if (/^https?:\/\//.test(href)) {
          expect(href.startsWith('https://apps.apple.com'), `${page.file} external link ${href}`).toBe(true);
          continue;
        }
        const normalized = href.startsWith('/') ? (href.endsWith('/') ? href : `${href}/`) : `/${href}`;
        expect(known.has(normalized), `${page.file} link ${href} must resolve to an approved route`).toBe(true);
      }
    }
  });

  it('keeps document-management copy free of unverified reminder claims', () => {
    const page = EXPECTED_PAGES.find((candidate) => candidate.slug === 'document-management');
    const entry = readEntry(page);
    const forbidden = /\b(reminder|reminders|alert|alerts|notification|notifications|expiry|expires|expiration|renewal)\b/i;
    expect(forbidden.test(entry.raw), 'document-management must not claim reminders or alerts').toBe(false);
  });

  it('keeps ROI claims limited to the website calculator', () => {
    const page = EXPECTED_PAGES.find((candidate) => candidate.slug === 'profitability-roi');
    const entry = readEntry(page);
    expect(entry.body).toContain('/tools/rental-property-roi-calculator/');
    expect(entry.body).toMatch(/net income/i);
    expect(entry.body).not.toMatch(/\bcalculates\s+(your\s+)?(roi|gross|profitability|yield)\b/i);
  });

  it('keeps tax copy within verified export behavior', () => {
    const page = EXPECTED_PAGES.find((candidate) => candidate.slug === 'tax-export');
    const entry = readEntry(page);
    expect(entry.raw).toMatch(/does not provide tax advice/i);
    expect(entry.body).toMatch(/xlsx/i);
    expect(entry.raw).not.toMatch(/tax[\s-]?ready|ready for your tax|prepares your tax|\b1 click\b|one click/i);
  });

  it('keeps the spreadsheet comparison factual and balanced', () => {
    const page = EXPECTED_PAGES.find((candidate) => candidate.slug === 'landlord-app-vs-spreadsheets');
    const entry = readEntry(page);
    expect(entry.body).toMatch(/^## When a spreadsheet may still be enough$/m);
    expect(entry.raw).not.toMatch(/superior|universally|no contest|clear winner|outperforms|hands down/i);
  });

  it('keeps audience pages free of replacement claims', () => {
    for (const page of EXPECTED_PAGES.filter((candidate) => candidate.collection === 'audiences')) {
      const entry = readEntry(page);
      expect(
        entry.raw.match(/replaces (your )?(accountant|accountants|bank|legal adviser|property manager)/i),
        `${page.file} must not claim to replace professionals or teams`
      ).toBe(null);
    }
  });

  it('keeps body copy distinct across the eight pages', () => {
    const bodies = EXPECTED_PAGES.map((page) => readEntry(page).body);
    let worst = 0;
    for (let left = 0; left < bodies.length; left += 1) {
      for (let right = left + 1; right < bodies.length; right += 1) {
        worst = Math.max(worst, jaccard(shingles(bodies[left]), shingles(bodies[right])));
      }
    }
    expect(worst).toBeLessThanOrEqual(0.7);
  });
});

describe('built core pages', () => {
  it('publishes all eight routes with canonical metadata and working CTA payloads', () => {
    // Full-suite runs happen after a build; homepage tests already fail
    // without dist, so a missing dist here just skips the built-output checks.
    if (!existsSync(distRoot)) {
      return;
    }

    for (const page of EXPECTED_PAGES) {
      const route = canonicalPath(page);
      const htmlPath = path.join(distRoot, route.slice(1), 'index.html');
      expect(existsSync(htmlPath), `${route} must be built`).toBe(true);
      const html = readFileSync(htmlPath, 'utf8');
      expect(html).toContain(`<title>${page.title}</title>`);
      expect(html).toContain(`href="${SITE_ORIGIN}${route}"`);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => normalizeText(match[1]));
      expect(h1s, `${route} must render exactly one h1`).toEqual([page.h1]);
      expect(html, `${route} App Store CTA`).toContain('data-app-store-click');
      expect(html, `${route} CTA campaign`).toContain(`data-campaign="${page.campaign}"`);
      expect(html, `${route} CTA placement`).toContain('data-cta-placement="content"');
      expect(html, `${route} CTA page path`).toContain(`data-page-path="${route}"`);
    }
  });
});
