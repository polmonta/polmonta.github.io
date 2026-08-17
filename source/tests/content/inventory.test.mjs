// Task 5: locks the exact fifteen-route acquisition inventory, the inbound-link
// graph, prohibited-claim discipline, and the built-output gate.
//
// The release validator (scripts/seo/validate-content.mjs) is the blocking gate;
// these tests re-derive routes, links, metadata, and built behavior from the
// committed content files and the dist directory so the inventory is checked
// against real behavior rather than against a copy of the expected list.
//
// The exact fifteen routes come from the approved design
// (docs/superpowers/specs/2026-08-05-managestate-seo-growth-design.md §8) and are
// hard-coded in EXPECTED_ROUTES in the validator. The tests below compare the
// routes that actually derive from the content collections against that list.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CAMPAIGN_BY_CLUSTER,
  EXPECTED_ROUTES,
  ROUTE_PREFIX,
  SITE_ROUTES,
  loadAcquisitionContract,
  validateContent
} from '../../scripts/seo/validate-content.mjs';
import { validateDist } from '../../scripts/seo/validate-dist.mjs';
import { COLLECTION_LABELS } from '../../src/lib/acquisition.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoot = path.join(projectRoot, 'src/content');
const distRoot = path.join(projectRoot, 'dist');
const SITE_ORIGIN = 'https://managestate.app';

// Curated location slugs (countries, US states, and major cities in English and
// Spanish). The approved fifteen routes contain none of these; the guard exists
// to catch location-page creep before it reaches the built output.
const LOCATION_SLUGS = new Set([
  // Countries and regions
  'usa', 'us', 'united-states', 'united-states-of-america', 'uk', 'united-kingdom',
  'england', 'scotland', 'wales', 'northern-ireland', 'spain', 'espana', 'catalonia',
  'cataluna', 'catalunya', 'madrid', 'barcelona', 'valencia', 'andalucia', 'germany',
  'france', 'italy', 'portugal', 'mexico', 'canada', 'australia', 'ireland', 'netherlands',
  'belgium', 'switzerland', 'austria', 'sweden', 'norway', 'denmark', 'finland', 'poland',
  'greece', 'turkey', 'japan', 'china', 'india', 'brazil', 'argentina', 'chile', 'colombia',
  'peru', 'uruguay', 'panama', 'costa-rica', 'puerto-rico', 'singapore', 'hong-kong',
  'south-korea', 'thailand', 'new-zealand', 'russia', 'ukraine', 'czech-republic',
  'hungary', 'romania', 'israel', 'united-arab-emirates', 'saudi-arabia', 'qatar', 'egypt',
  'south-africa', 'nigeria', 'morocco', 'philippines', 'vietnam', 'indonesia', 'malaysia',
  'iceland', 'luxembourg', 'malta', 'cyprus', 'croatia', 'serbia', 'bulgaria', 'slovakia',
  'slovenia', 'lithuania', 'latvia', 'estonia', 'georgia', 'armenia', 'azerbaijan',
  'kazakhstan', 'pakistan', 'bangladesh', 'sri-lanka', 'nepal', 'taiwan', 'macau',
  // US states
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire',
  'new-jersey', 'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia',
  'wisconsin', 'wyoming',
  // Major cities
  'london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'edinburgh', 'glasgow',
  'dublin', 'los-angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san-antonio',
  'san-diego', 'dallas', 'san-jose', 'austin', 'jacksonville', 'fort-worth', 'columbus',
  'charlotte', 'san-francisco', 'seattle', 'denver', 'washington-dc', 'boston', 'nashville',
  'detroit', 'portland', 'las-vegas', 'miami', 'atlanta', 'seville', 'zaragoza', 'malaga',
  'bilbao', 'palma', 'granada', 'paris', 'marseille', 'lyon', 'toulouse', 'nice', 'berlin',
  'hamburg', 'munich', 'cologne', 'frankfurt', 'stuttgart', 'dusseldorf', 'rome', 'milan',
  'naples', 'turin', 'florence', 'venice', 'bologna', 'lisbon', 'porto', 'amsterdam',
  'rotterdam', 'brussels', 'antwerp', 'geneva', 'zurich', 'basel', 'vienna', 'salzburg',
  'stockholm', 'gothenburg', 'oslo', 'bergen', 'copenhagen', 'helsinki', 'warsaw',
  'krakow', 'prague', 'budapest', 'athens', 'thessaloniki', 'istanbul', 'tokyo', 'osaka',
  'kyoto', 'beijing', 'shanghai', 'shenzhen', 'guangzhou', 'bangkok', 'seoul', 'sydney',
  'melbourne', 'brisbane', 'perth', 'auckland', 'wellington', 'toronto', 'vancouver',
  'montreal', 'calgary', 'ottawa', 'mexico-city', 'guadalajara', 'monterrey', 'bogota',
  'medellin', 'lima', 'santiago', 'buenos-aires', 'montevideo', 'rio-de-janeiro',
  'sao-paulo', 'brasilia', 'lagos', 'nairobi', 'cape-town', 'johannesburg', 'dubai',
  'abu-dhabi', 'tel-aviv', 'jerusalem', 'atlanta', 'minneapolis', 'kansas-city',
  'milwaukee', 'cincinnati', 'cleveland', 'pittsburgh', 'baltimore', 'virginia-beach',
  'raleigh', 'orlando', 'tampa', 'st-louis', 'memphis', 'louisville', 'new-orleans',
  'oklahoma-city', 'tulsa', 'albuquerque', 'omaha', 'salt-lake-city', 'sacramento',
  'fresno', 'long-beach', 'oakland', 'san-jose', 'honolulu', 'anchorage'
]);

// Unsupported or unverified claim phrases from the Phase 0 evidence register
// (product-claims.json and docs/seo/evidence-register.md), applied to all
// fifteen pages at once, matching the per-task lists in the core-pages and
// guides tests plus the tax/export wording rejected in the register.
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
  // Unverified time-bound performance claims (final review finding): the
  // behavior is verified, but no evidence source verifies how long any
  // workflow takes, so speed claims are rejected until a source record
  // exists (same discipline as the evidence register).
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

const SECURITY_WORD_PATTERN = /\b(secure|security|encryption|encrypted|backup|cloud|sync|ios|android|ipad)\b/i;

// Named third-party products: no competitor brand may appear without a cited
// source (none are cited anywhere in the fifteen pages).
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

const APPROVED_ROUTES = new Set([...EXPECTED_ROUTES, ...SITE_ROUTES]);

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
    file: relativePath,
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

function readAllEntries() {
  const entries = [];
  for (const collection of Object.keys(ROUTE_PREFIX)) {
    const dir = path.join(contentRoot, collection);
    if (!existsSync(dir)) {
      continue;
    }
    for (const file of readdirSync(dir)) {
      if (/\.(md|mdx)$/.test(file)) {
        entries.push(readEntry(`${collection}/${file}`));
      }
    }
  }
  return entries;
}

function routeFor(entry) {
  return `${ROUTE_PREFIX[entry.cluster]}/${entry.translationKey}/`;
}

function bodyLinks(body) {
  return [...body.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]);
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

// Independent inbound-link graph over the committed content: a route receives
// an inbound link when another acquisition page links to it from its related
// list or its body.
function computeInboundLinks(entries) {
  const published = entries.filter((entry) => entry.status === 'published');
  const routes = new Set(published.map(routeFor));
  const inbound = new Map([...routes].map((route) => [route, 0]));
  for (const entry of published) {
    const sourceRoute = routeFor(entry);
    for (const href of [...entry.related, ...bodyLinks(entry.body)]) {
      if (!href.startsWith('/') || href.startsWith('/downloads/')) {
        continue;
      }
      const normalized = href.endsWith('/') ? href : `${href}/`;
      if (normalized !== sourceRoute && routes.has(normalized)) {
        inbound.set(normalized, inbound.get(normalized) + 1);
      }
    }
  }
  return inbound;
}

function validPage({
  title = 'ManageState home',
  description = 'A focused property management app.',
  canonical = 'https://managestate.app/',
  h1 = 'Manage your rentals.',
  body = '',
  footer = '<footer><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></footer>'
} = {}) {
  return `<!doctype html>
<html><head>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow">
</head><body>
<h1>${h1}</h1>
<img src="/hero.png" alt="ManageState dashboard">
<a href="/">Home</a>
${body}
${footer}
</body></html>`;
}

function acquisitionPage({ route, campaign, cluster, canonical = `${SITE_ORIGIN}${route}` }) {
  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: COLLECTION_LABELS[cluster] },
      { '@type': 'ListItem', position: 3, name: `Heading for ${route}`, item: canonical }
    ]
  });
  return validPage({
    title: `Acquisition Page ${route} | ManageState`,
    description: `Description for the acquisition page at ${route} with enough words to satisfy the metadata contract.`,
    canonical,
    h1: `Heading for ${route}`,
    body: `<script type="application/ld+json">${breadcrumb}</script>
<a href="https://apps.apple.com/app/managestate/id6751497970"
  data-app-store-click
  data-page-path="${route}"
  data-content-cluster="${cluster}"
  data-cta-placement="content"
  data-language="en"
  data-campaign="${campaign}">Download ManageState for iPhone</a>`
  });
}

function legalPages() {
  const privacyBody = '<p>Before analytics is enabled, this site may conditionally use Plausible Analytics. When enabled, Plausible Analytics provides its default marketing-site pageview measurement. The non-identifying app_store_click event includes page path, content cluster, CTA placement, language, and campaign.</p>';
  return {
    'index.html': validPage(),
    'privacy/index.html': validPage({
      title: 'ManageState Privacy Policy',
      description: 'ManageState privacy policy and marketing-site analytics disclosure.',
      canonical: 'https://managestate.app/privacy/',
      h1: 'ManageState Privacy Policy',
      body: privacyBody
    }),
    'terms/index.html': validPage({
      title: 'ManageState Terms of Use',
      description: 'Apple Standard EULA governing use of the ManageState app.',
      canonical: 'https://managestate.app/terms/',
      h1: 'LICENSED APPLICATION END USER LICENSE AGREEMENT',
      body: '<p>Apps made available through the App Store are licensed, not sold, to you.</p>'
    })
  };
}

async function createDist({ pages, sitemapUrls }) {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'managestate-inventory-'));
  temporaryDirectories.push(distDir);

  for (const [relativePath, html] of Object.entries(pages)) {
    const filePath = path.join(distDir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, html);
  }

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_ORIGIN}/sitemap-0.xml</loc></sitemap>
</sitemapindex>`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
  await writeFile(path.join(distDir, 'sitemap-index.xml'), sitemapIndex);
  await writeFile(path.join(distDir, 'sitemap-0.xml'), sitemap);

  return distDir;
}

function fullSitePages(contract) {
  const pages = legalPages();
  for (const { route, campaign, cluster } of contract) {
    pages[`${route.slice(1)}index.html`] = acquisitionPage({ route, campaign, cluster });
  }
  return pages;
}

function fullSiteSitemap(contract) {
  return [
    'https://managestate.app/',
    'https://managestate.app/privacy/',
    'https://managestate.app/terms/',
    ...contract.map(({ route }) => `${SITE_ORIGIN}${route}`)
  ];
}

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('fifteen-page acquisition inventory (content)', () => {
  it('publishes exactly the fifteen approved routes from the design', () => {
    const { errors, publishedRoutes } = validateContent();
    expect(errors, errors.join('\n')).toEqual([]);

    // Real behavior: routes derived from the committed content files must
    // equal the hard-coded approved list exactly, with no missing or extra
    // routes and no duplicates.
    expect(publishedRoutes).toEqual(EXPECTED_ROUTES);
    expect(publishedRoutes.length).toBe(15);
    expect(new Set(publishedRoutes).size).toBe(15);
  });

  it('keeps every approved route free of city or country slugs', () => {
    const { publishedRoutes } = validateContent();
    for (const route of publishedRoutes) {
      expect(route, `${route} must match the acquisition route pattern`).toMatch(
        /^\/(features|for|compare|guides|tools)\/[a-z0-9-]+\/$/
      );
      for (const segment of route.split('/').filter(Boolean)) {
        expect(LOCATION_SLUGS.has(segment), `${route} must not contain location slug "${segment}"`).toBe(false);
      }
    }
  });

  it('gives every page at least one inbound link from another acquisition page', () => {
    const entries = readAllEntries();
    const inbound = computeInboundLinks(entries);
    for (const route of EXPECTED_ROUTES) {
      expect(inbound.get(route) ?? 0, `${route} must receive an inbound link from another acquisition page`).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps target intents and metadata unique across all fifteen pages', () => {
    const entries = readAllEntries().filter((entry) => entry.status === 'published');
    expect(entries.length).toBe(15);
    const intent = new Map();
    const title = new Map();
    const description = new Map();
    const h1 = new Map();
    const translationKey = new Map();
    const canonical = new Map();
    for (const entry of entries) {
      const route = routeFor(entry);
      for (const [map, value, label] of [
        [intent, entry.intent, 'intent'],
        [title, entry.title, 'title'],
        [description, entry.description, 'description'],
        [h1, entry.h1, 'h1'],
        [translationKey, entry.translationKey, 'translationKey'],
        [canonical, route, 'canonical']
      ]) {
        const key = normalizeKey(value);
        const previous = map.get(key);
        if (previous) {
          expect.fail(`duplicate ${label}: "${value}" shared by ${previous} and ${entry.file}`);
        }
        map.set(key, entry.file);
      }
    }
  });

  it('omits prohibited, unsupported, and security-related claim phrases on every page', () => {
    for (const entry of readAllEntries()) {
      const haystack = entry.raw.toLowerCase();
      for (const phrase of PROHIBITED_PHRASES) {
        expect(haystack.includes(phrase), `${entry.file} must not contain "${phrase}"`).toBe(false);
      }
      expect(
        entry.raw.match(SECURITY_WORD_PATTERN),
        `${entry.file} must not contain unsupported security/device/sync wording`
      ).toBe(null);
      for (const brand of COMPETITOR_BRANDS) {
        expect(
          new RegExp(`\\b${brand}\\b`, 'i').test(entry.raw),
          `${entry.file} must not name competitor "${brand}"`
        ).toBe(false);
      }
    }
  });

  it('resolves every related link and internal body link to an approved route or shipped asset', () => {
    for (const entry of readAllEntries()) {
      for (const href of entry.related) {
        expect(APPROVED_ROUTES.has(href), `${entry.file} related link ${href} must resolve to an approved route`).toBe(true);
      }
      for (const href of bodyLinks(entry.body)) {
        if (/^https?:\/\//.test(href)) {
          expect(href.startsWith('https://apps.apple.com'), `${entry.file} external link ${href}`).toBe(true);
          continue;
        }
        if (href.startsWith('/downloads/')) {
          expect(existsSync(path.join(projectRoot, 'public', href)), `${entry.file} download ${href} must exist`).toBe(true);
          continue;
        }
        const normalized = href.startsWith('/') ? (href.endsWith('/') ? href : `${href}/`) : `/${href}`;
        expect(APPROVED_ROUTES.has(normalized), `${entry.file} body link ${href} must resolve to an approved route`).toBe(true);
      }
    }
  });

  it('satisfies the content-level CTA data contract on every page', () => {
    for (const entry of readAllEntries().filter((candidate) => candidate.status === 'published')) {
      expect(entry.campaign, `${entry.file} campaign`).toBe(CAMPAIGN_BY_CLUSTER[entry.cluster]);
      expect(entry.lang, `${entry.file} language`).toBe('en');
      expect(routeFor(entry), `${entry.file} route`).toBe(`${ROUTE_PREFIX[entry.cluster]}/${entry.translationKey}/`);
      expect(APPROVED_ROUTES.has(routeFor(entry)), `${entry.file} route must be approved`).toBe(true);
    }
  });
});

describe('release validator gate', () => {
  function makeEntry(overrides) {
    const base = readEntry('features/financial-control.md');
    return {
      ...base,
      file: 'features/financial-control.md',
      related: ['/for/small-landlords/', '/for/growing-property-investors/', '/compare/landlord-app-vs-spreadsheets/'],
      ...overrides
    };
  }

  function secondEntry(overrides) {
    const base = readEntry('features/document-management.md');
    return {
      ...base,
      file: 'features/document-management.md',
      related: ['/for/first-time-landlords/', '/compare/landlord-app-vs-spreadsheets/', '/features/tax-export/'],
      ...overrides
    };
  }

  it('blocks a missing approved route', () => {
    const entries = readAllEntries().filter((entry) => routeFor(entry) !== '/features/financial-control/');
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /financial-control/.test(error) && /missing/i.test(error))).toBe(true);
  });

  it('blocks an extra published route outside the approved fifteen', () => {
    const extra = makeEntry({ file: 'features/extra-topic.md', translationKey: 'extra-topic', intent: 'A completely distinct extra topic intent.' });
    const entries = [...readAllEntries(), extra];
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /unexpected/i.test(error) && /extra-topic/.test(error))).toBe(true);
  });

  it('blocks duplicate target intents', () => {
    const entries = readAllEntries();
    entries[1] = { ...entries[1], intent: entries[0].intent };
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /duplicate intent/i.test(error))).toBe(true);
  });

  it('blocks duplicate titles and descriptions', () => {
    const entries = readAllEntries();
    entries[1] = { ...entries[1], title: entries[0].title };
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /duplicate title/i.test(error))).toBe(true);

    const entries2 = readAllEntries();
    entries2[1] = { ...entries2[1], description: entries2[0].description };
    const { errors: errors2 } = validateContent({ entries: entries2 });
    expect(errors2.some((error) => /duplicate description/i.test(error))).toBe(true);
  });

  it('blocks a page with no inbound link from another acquisition page', () => {
    // Two published entries that link only to routes outside the set: neither
    // receives an inbound link from another acquisition page, so both are
    // orphans and the gate must flag them.
    const entries = [
      makeEntry({ related: ['/for/small-landlords/'] }),
      secondEntry({ related: ['/for/small-landlords/'] })
    ];
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /orphan/i.test(error) && /financial-control/.test(error))).toBe(true);
    expect(errors.some((error) => /orphan/i.test(error) && /document-management/.test(error))).toBe(true);
  });

  it('blocks broken related links', () => {
    const entries = readAllEntries();
    entries[0] = { ...entries[0], related: ['/features/does-not-exist/'] };
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /related link/i.test(error) && /does-not-exist/.test(error))).toBe(true);
  });

  it('blocks prohibited phrases, missing summary points, and missing CTA data', () => {
    const entries = readAllEntries();
    entries[0] = { ...entries[0], raw: `${entries[0].raw}\n\nTrusted by thousands of landlords.` };
    const { errors } = validateContent({ entries });
    expect(errors.some((error) => /prohibited/i.test(error) && /trusted by thousands/.test(error))).toBe(true);

    const entriesTimeBound = readAllEntries();
    entriesTimeBound[0] = { ...entriesTimeBound[0], raw: `${entriesTimeBound[0].raw}\n\nRecording a payment takes under a minute.` };
    const { errors: errorsTimeBound } = validateContent({ entries: entriesTimeBound });
    expect(errorsTimeBound.some((error) => /prohibited/i.test(error) && /under a minute/.test(error))).toBe(true);

    const entries2 = readAllEntries();
    entries2[0] = { ...entries2[0], summary: entries2[0].summary.slice(0, 2) };
    const { errors: errors2 } = validateContent({ entries: entries2 });
    expect(errors2.some((error) => /summary/i.test(error))).toBe(true);

    const entries3 = readAllEntries();
    entries3[0] = { ...entries3[0], campaign: 'website-home' };
    const { errors: errors3 } = validateContent({ entries: entries3 });
    expect(errors3.some((error) => /campaign/i.test(error))).toBe(true);
  });

  it('passes on the committed content and exits zero as a blocking script', () => {
    const result = spawnSync(process.execPath, ['scripts/seo/validate-content.mjs'], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it('wires check:content before the build in the verify pipeline', () => {
    const pkg = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    expect(pkg.scripts['check:content'], 'check:content must exist').toBe('node scripts/seo/validate-content.mjs');
    const verify = pkg.scripts.verify;
    const checkContentIndex = verify.indexOf('npm run check:content');
    const buildIndex = verify.indexOf('npm run build');
    expect(checkContentIndex, 'verify must run check:content').toBeGreaterThanOrEqual(0);
    expect(buildIndex, 'verify must run build').toBeGreaterThanOrEqual(0);
    expect(checkContentIndex, 'check:content must run before the build').toBeLessThan(buildIndex);
    expect(verify, 'verify must run the dist gate').toContain('npm run check:dist');
  });
});

describe('built acquisition routes (dist)', () => {
  it('validates the real built output against the fifteen-route contract', () => {
    if (!existsSync(distRoot)) {
      return;
    }

    const contract = loadAcquisitionContract();
    const errors = validateDist({ distDir: distRoot, acquisitionContract: contract });
    expect(errors, errors.join('\n')).toEqual([]);

    // Independent build-behavior assertions on the built HTML and sitemap.
    const sitemap = readFileSync(path.join(distRoot, 'sitemap-0.xml'), 'utf8');
    const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    for (const { route, campaign, cluster } of contract) {
      const htmlPath = path.join(distRoot, route.slice(1), 'index.html');
      expect(existsSync(htmlPath), `${route} must be built`).toBe(true);
      const html = readFileSync(htmlPath, 'utf8');
      const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
        .map((match) => normalizeText(match[1]))
        .at(0) ?? '';

      expect(html, `${route} canonical`).toContain(`href="${SITE_ORIGIN}${route}"`);
      expect(html, `${route} must appear in the sitemap`).toContain(`${SITE_ORIGIN}${route}`);
      expect(sitemapLocs.includes(`${SITE_ORIGIN}${route}`), `${route} must be a sitemap location`).toBe(true);

      // The acquisition layout renders exactly one content-placement CTA with
      // the app_store_click event payload for this route.
      const contentCtas = [...html.matchAll(/<a\b[^>]*data-app-store-click[^>]*>/gi)]
        .map((match) => match[0])
        .filter((tag) => /data-cta-placement="content"/.test(tag));
      expect(contentCtas.length, `${route} must render exactly one content CTA`).toBe(1);
      const cta = contentCtas[0];
      expect(cta, `${route} CTA page path`).toContain(`data-page-path="${route}"`);
      expect(cta, `${route} CTA cluster`).toContain(`data-content-cluster="${cluster}"`);
      expect(cta, `${route} CTA placement`).toContain('data-cta-placement="content"');
      expect(cta, `${route} CTA language`).toContain('data-language="en"');
      expect(cta, `${route} CTA campaign`).toContain(`data-campaign="${campaign}"`);

      // Design §7: every nested acquisition page emits exactly one valid
      // BreadcrumbList schema matching the visible breadcrumb — home, the
      // collection section label, and the current page — with canonical
      // absolute item URLs and no fabricated section URL.
      const schemaBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
        .map((match) => match[1]);
      const breadcrumbs = schemaBlocks
        .map((block) => JSON.parse(block))
        .filter((schema) => schema['@type'] === 'BreadcrumbList');
      expect(breadcrumbs.length, `${route} must emit exactly one BreadcrumbList schema`).toBe(1);
      const breadcrumb = breadcrumbs[0];
      expect(breadcrumb['@context'], `${route} BreadcrumbList context`).toBe('https://schema.org');
      expect(
        breadcrumb.itemListElement.map((item) => item.position),
        `${route} BreadcrumbList positions`
      ).toEqual([1, 2, 3]);
      expect(breadcrumb.itemListElement[0].name, `${route} BreadcrumbList home name`).toBe('Home');
      expect(breadcrumb.itemListElement[0].item, `${route} BreadcrumbList home URL`).toBe(`${SITE_ORIGIN}/`);
      expect(breadcrumb.itemListElement[1].name, `${route} BreadcrumbList section name`)
        .toBe(COLLECTION_LABELS[cluster]);
      expect(breadcrumb.itemListElement[1], `${route} BreadcrumbList section must not fabricate a URL`)
        .not.toHaveProperty('item');
      expect(breadcrumb.itemListElement[2].name, `${route} BreadcrumbList current name`).toBe(h1);
      expect(breadcrumb.itemListElement[2].item, `${route} BreadcrumbList current URL`).toBe(`${SITE_ORIGIN}${route}`);
    }

    // The built site must contain no acquisition routes outside the fifteen.
    const acquisitionPrefixes = Object.values(ROUTE_PREFIX);
    const sitemapAcquisitionRoutes = sitemapLocs
      .map((location) => new URL(location).pathname)
      .filter((pathname) => acquisitionPrefixes.some((prefix) => pathname.startsWith(`${prefix}/`)));
    expect(sitemapAcquisitionRoutes.sort()).toEqual([...EXPECTED_ROUTES].sort());
  });

  it('accepts a complete synthetic site with the fifteen-route contract', async () => {
    const contract = loadAcquisitionContract();
    const distDir = await createDist({
      pages: fullSitePages(contract),
      sitemapUrls: fullSiteSitemap(contract)
    });

    expect(validateDist({ distDir, acquisitionContract: contract })).toEqual([]);
  });

  it('rejects a built site that is missing an approved route', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    const missingRoute = contract[0].route;
    delete pages[`${missingRoute.slice(1)}index.html`];
    const distDir = await createDist({
      pages,
      sitemapUrls: fullSiteSitemap(contract).filter((url) => !url.endsWith(missingRoute))
    });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(
      errors.some((error) => /missing/i.test(error) && error.includes(missingRoute.slice(1))),
      errors.join('\n')
    ).toBe(true);
  });

  it('rejects a built CTA whose campaign does not match the route contract', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    const route = contract[0].route;
    pages[`${route.slice(1)}index.html`] = acquisitionPage({
      route,
      campaign: 'website-home',
      cluster: contract[0].cluster
    });
    const distDir = await createDist({ pages, sitemapUrls: fullSiteSitemap(contract) });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(errors.some((error) => /campaign/i.test(error) && error.includes(route.slice(1))), errors.join('\n')).toBe(true);
  });

  it('rejects a built CTA whose page path does not match the route contract', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    const route = contract[0].route;
    pages[`${route.slice(1)}index.html`] = acquisitionPage({
      route: '/features/other-route/',
      campaign: contract[0].campaign,
      cluster: contract[0].cluster,
      canonical: `${SITE_ORIGIN}${route}`
    });
    const distDir = await createDist({ pages, sitemapUrls: fullSiteSitemap(contract) });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(errors.some((error) => /data-page-path/i.test(error)), errors.join('\n')).toBe(true);
  });

  it('rejects a built acquisition page that omits the BreadcrumbList schema', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    const route = contract[0].route;
    pages[`${route.slice(1)}index.html`] = acquisitionPage({
      route,
      campaign: contract[0].campaign,
      cluster: contract[0].cluster
    }).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
    const distDir = await createDist({ pages, sitemapUrls: fullSiteSitemap(contract) });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(errors.some((error) => /BreadcrumbList/i.test(error)), errors.join('\n')).toBe(true);
  });

  it('rejects a BreadcrumbList that fabricates a section item URL', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    const route = contract[0].route;
    const { campaign, cluster } = contract[0];
    const fabricatedBreadcrumb = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: COLLECTION_LABELS[cluster],
          item: `${SITE_ORIGIN}/features/`
        },
        { '@type': 'ListItem', position: 3, name: `Heading for ${route}`, item: `${SITE_ORIGIN}${route}` }
      ]
    });
    const fabricated = acquisitionPage({ route, campaign, cluster }).replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${fabricatedBreadcrumb}</script>`
    );
    pages[`${route.slice(1)}index.html`] = fabricated;
    const distDir = await createDist({ pages, sitemapUrls: fullSiteSitemap(contract) });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(errors.some((error) => /fabricat|section item/i.test(error)), errors.join('\n')).toBe(true);
  });

  it('rejects an acquisition route outside the approved fifteen', async () => {
    const contract = loadAcquisitionContract();
    const pages = fullSitePages(contract);
    pages['features/extra-topic/index.html'] = acquisitionPage({
      route: '/features/extra-topic/',
      campaign: 'website-features',
      cluster: 'features'
    });
    const distDir = await createDist({
      pages,
      sitemapUrls: [...fullSiteSitemap(contract), `${SITE_ORIGIN}/features/extra-topic/`]
    });

    const errors = validateDist({ distDir, acquisitionContract: contract });
    expect(errors.some((error) => /outside the approved fifteen|unexpected/i.test(error))).toBe(true);
  });
});
