// Release-blocking content validation for the Phase 2 English acquisition
// inventory (Task 5). Consumes the committed content collections and enforces:
//
//   - the exact fifteen approved acquisition routes (design §8), no more, no less
//   - the frontmatter/content contract (title, description, h1, summary length,
//     opening answer, intent, cluster/campaign pairing, language, status, dates)
//   - unique target intents and metadata (title, description, h1, translation key)
//   - no prohibited or unsupported claim phrases (evidence register discipline)
//   - no orphan pages: every route receives an inbound link from another
//     acquisition page
//   - no broken related or internal links
//   - content-level CTA/event data readiness (campaign, cluster, language, path)
//
// Run via `npm run check:content` (placed before the build in `verify`). Any
// error sets a non-zero exit code, so a release cannot proceed with an
// invalid inventory. Built-output checks (rendered CTA payloads, canonical,
// sitemap) live in scripts/seo/validate-dist.mjs, which consumes the same
// acquisition contract exported here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const landingPageRoot = path.resolve(path.dirname(scriptPath), '../..');
const contentRoot = path.join(landingPageRoot, 'src/content');
const publicRoot = path.join(landingPageRoot, 'public');

export const ACQUISITION_COLLECTIONS = Object.freeze([
  'features',
  'audiences',
  'comparisons',
  'guides',
  'tools'
]);

export const ROUTE_PREFIX = Object.freeze({
  features: '/features',
  audiences: '/for',
  comparisons: '/compare',
  guides: '/guides',
  tools: '/tools'
});

export const CAMPAIGN_BY_CLUSTER = Object.freeze({
  features: 'website-features',
  audiences: 'website-audiences',
  comparisons: 'website-comparisons',
  guides: 'website-guides',
  tools: 'website-tools'
});

export const SITE_ROUTES = Object.freeze(['/', '/privacy/', '/terms/']);

// The fifteen approved English acquisition routes from the design
// (docs/superpowers/specs/2026-08-05-managestate-seo-growth-design.md §8).
// Sorted by pathname; the inventory test asserts exact equality against the
// routes that actually derive from the committed content files.
export const EXPECTED_ROUTES = Object.freeze([
  '/compare/landlord-app-vs-spreadsheets/',
  '/features/document-management/',
  '/features/financial-control/',
  '/features/profitability-roi/',
  '/features/tax-export/',
  '/for/first-time-landlords/',
  '/for/growing-property-investors/',
  '/for/small-landlords/',
  '/guides/landlord-expense-tracker/',
  '/guides/landlord-tax-record-app/',
  '/guides/property-management-app-for-small-landlords/',
  '/guides/rental-income-expense-tracker/',
  '/guides/rental-property-document-organizer/',
  '/tools/rental-income-expense-template/',
  '/tools/rental-property-roi-calculator/'
]);

// Curated location slugs (countries, US states, major cities). The approved
// routes contain none; the guard blocks location-page creep before it builds.
export const LOCATION_SLUGS = Object.freeze(new Set([
  'usa', 'us', 'united-states', 'united-kingdom', 'uk', 'england', 'scotland',
  'wales', 'northern-ireland', 'spain', 'espana', 'catalonia', 'cataluna',
  'catalunya', 'germany', 'france', 'italy', 'portugal', 'mexico', 'canada',
  'australia', 'ireland', 'netherlands', 'belgium', 'switzerland', 'austria',
  'sweden', 'norway', 'denmark', 'finland', 'poland', 'greece', 'turkey',
  'japan', 'china', 'india', 'brazil', 'argentina', 'chile', 'colombia',
  'peru', 'uruguay', 'panama', 'costa-rica', 'puerto-rico', 'singapore',
  'hong-kong', 'south-korea', 'thailand', 'new-zealand', 'russia', 'ukraine',
  'czech-republic', 'hungary', 'romania', 'israel', 'united-arab-emirates',
  'saudi-arabia', 'qatar', 'egypt', 'south-africa', 'nigeria', 'morocco',
  'philippines', 'vietnam', 'indonesia', 'malaysia', 'iceland', 'luxembourg',
  'malta', 'cyprus', 'croatia', 'serbia', 'bulgaria', 'slovakia', 'slovenia',
  'lithuania', 'latvia', 'estonia', 'kazakhstan', 'pakistan', 'bangladesh',
  'taiwan',
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi',
  'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey',
  'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina',
  'south-dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'west-virginia', 'wisconsin', 'wyoming',
  'london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'edinburgh',
  'glasgow', 'dublin', 'los-angeles', 'chicago', 'houston', 'phoenix',
  'philadelphia', 'san-antonio', 'san-diego', 'dallas', 'san-jose', 'austin',
  'jacksonville', 'fort-worth', 'columbus', 'charlotte', 'san-francisco',
  'seattle', 'denver', 'washington-dc', 'boston', 'nashville', 'detroit',
  'portland', 'las-vegas', 'miami', 'atlanta', 'seville', 'zaragoza',
  'malaga', 'bilbao', 'palma', 'granada', 'paris', 'marseille', 'lyon',
  'toulouse', 'nice', 'berlin', 'hamburg', 'munich', 'cologne', 'frankfurt',
  'stuttgart', 'dusseldorf', 'rome', 'milan', 'naples', 'turin', 'florence',
  'venice', 'bologna', 'lisbon', 'porto', 'amsterdam', 'rotterdam',
  'brussels', 'antwerp', 'geneva', 'zurich', 'basel', 'vienna', 'salzburg',
  'stockholm', 'gothenburg', 'oslo', 'bergen', 'copenhagen', 'helsinki',
  'warsaw', 'krakow', 'prague', 'budapest', 'athens', 'thessaloniki',
  'istanbul', 'tokyo', 'osaka', 'kyoto', 'beijing', 'shanghai', 'shenzhen',
  'guangzhou', 'bangkok', 'seoul', 'sydney', 'melbourne', 'brisbane',
  'perth', 'auckland', 'wellington', 'toronto', 'vancouver', 'montreal',
  'calgary', 'ottawa', 'mexico-city', 'guadalajara', 'monterrey', 'bogota',
  'medellin', 'lima', 'santiago', 'buenos-aires', 'montevideo',
  'rio-de-janeiro', 'sao-paulo', 'brasilia', 'dubai', 'abu-dhabi',
  'tel-aviv', 'minneapolis', 'kansas-city', 'pittsburgh', 'baltimore',
  'orlando', 'tampa', 'st-louis', 'memphis', 'new-orleans', 'oklahoma-city',
  'albuquerque', 'omaha', 'salt-lake-city', 'sacramento', 'oakland',
  'honolulu'
]));

// Unsupported or unverified claim phrases from the Phase 0 evidence register
// (product-claims.json and docs/seo/evidence-register.md), applied to every
// acquisition page. This is the release gate version of the per-task lists in
// the core-pages, guides, and tools tests, plus the tax/export wording
// rejected in the register.
export const PROHIBITED_PHRASES = Object.freeze([
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
  // product behavior is verified, but no evidence source verifies how long
  // any workflow takes. Speed claims are rejected until a source record
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
]);

export const SECURITY_WORD_PATTERN = /\b(secure|security|encryption|encrypted|backup|cloud|sync|ios|android|ipad)\b/i;

// Named third-party products: no competitor brand may appear without a cited
// source (none are cited anywhere in the fifteen pages).
export const COMPETITOR_BRANDS = Object.freeze([
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
]);

export const APPROVED_ROUTES = Object.freeze([...EXPECTED_ROUTES, ...SITE_ROUTES]);

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

export function readEntry(relativePath) {
  const filePath = path.join(contentRoot, relativePath);
  const raw = fs.readFileSync(filePath, 'utf8');
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

export function loadContentEntries() {
  const entries = [];
  for (const collection of ACQUISITION_COLLECTIONS) {
    const dir = path.join(contentRoot, collection);
    if (!fs.existsSync(dir)) {
      continue;
    }
    for (const file of fs.readdirSync(dir)) {
      if (/\.(md|mdx)$/.test(file)) {
        entries.push(readEntry(`${collection}/${file}`));
      }
    }
  }
  return entries.sort((left, right) => left.file.localeCompare(right.file));
}

export function routeFor(entry) {
  if (typeof entry.cluster !== 'string' || !Object.hasOwn(ROUTE_PREFIX, entry.cluster)) {
    return '';
  }
  return `${ROUTE_PREFIX[entry.cluster]}/${entry.translationKey}/`;
}

export function publishedRoutes(entries) {
  return entries
    .filter((entry) => entry.status === 'published')
    .map(routeFor)
    .filter(Boolean)
    .sort();
}

function bodyLinks(body) {
  return [...body.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)].map((match) => match[1]);
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLink(href) {
  if (!href.startsWith('/')) {
    return href;
  }
  return href.endsWith('/') ? href : `${href}/`;
}

// Counts inbound links each published route receives from OTHER acquisition
// pages (related list + body links). A route with zero inbound links is an
// orphan and fails the release gate.
function computeInbound(entries) {
  const published = entries.filter((entry) => entry.status === 'published');
  const routes = new Set(published.map(routeFor).filter(Boolean));
  const inbound = new Map([...routes].map((route) => [route, 0]));
  for (const entry of published) {
    const sourceRoute = routeFor(entry);
    if (!sourceRoute) {
      continue;
    }
    for (const href of [...entry.related, ...bodyLinks(entry.body)]) {
      if (!href.startsWith('/') || href.startsWith('/downloads/')) {
        continue;
      }
      const normalized = normalizeLink(href);
      if (normalized !== sourceRoute && routes.has(normalized)) {
        inbound.set(normalized, inbound.get(normalized) + 1);
      }
    }
  }
  return inbound;
}

function validateEntryContract(entry, errors) {
  const label = entry.file;

  const lengthChecks = [
    ['title', entry.title, 30, 70],
    ['description', entry.description, 110, 165],
    ['h1', entry.h1, 10, 90],
    ['intent', entry.intent, 10, null],
    ['openingAnswer', entry.openingAnswer, 80, null]
  ];
  for (const [field, value, min, max] of lengthChecks) {
    if (!isNonEmptyString(value)) {
      errors.push(`${label}: ${field} must be a non-empty string`);
    } else if (value.trim().length < min || (max !== null && value.trim().length > max)) {
      errors.push(
        `${label}: ${field} length ${value.trim().length} is outside the approved range ${min}${max === null ? '+' : `-${max}`}`
      );
    }
  }

  if (!Array.isArray(entry.summary) || entry.summary.length < 3 || entry.summary.length > 5) {
    errors.push(`${label}: summary must contain 3-5 points, found ${Array.isArray(entry.summary) ? entry.summary.length : 'none'}`);
  } else {
    entry.summary.forEach((point, index) => {
      if (!isNonEmptyString(point) || point.trim().length < 20) {
        errors.push(`${label}: summary point ${index + 1} must be at least 20 characters`);
      }
    });
  }

  const collection = entry.file.split('/')[0];
  if (!ACQUISITION_COLLECTIONS.includes(entry.cluster)) {
    errors.push(`${label}: cluster "${entry.cluster}" is not one of ${ACQUISITION_COLLECTIONS.join(', ')}`);
  } else if (entry.cluster !== collection) {
    errors.push(`${label}: cluster "${entry.cluster}" does not match the collection directory "${collection}"`);
  }

  if (entry.campaign !== CAMPAIGN_BY_CLUSTER[entry.cluster]) {
    errors.push(
      `${label}: campaign "${entry.campaign}" does not match cluster "${entry.cluster}" (expected ${CAMPAIGN_BY_CLUSTER[entry.cluster]}) — content-level CTA data is incomplete`
    );
  }

  if (entry.lang !== 'en') {
    errors.push(`${label}: lang must be "en" for the English acquisition inventory, found "${entry.lang}"`);
  }

  if (!isNonEmptyString(entry.translationKey) || !/^[a-z0-9-]+$/.test(entry.translationKey)) {
    errors.push(`${label}: translationKey must be a lowercase slug, found "${entry.translationKey}"`);
  }

  if (entry.status !== 'published') {
    errors.push(`${label}: status must be "published" for the Phase 2 gate, found "${entry.status}"`);
  }

  if (!isNonEmptyString(entry.updatedAt) || Number.isNaN(Date.parse(entry.updatedAt))) {
    errors.push(`${label}: updatedAt must be a valid date, found "${entry.updatedAt}"`);
  } else if (Date.parse(entry.updatedAt) > Date.now()) {
    errors.push(`${label}: updatedAt must not be in the future, found "${entry.updatedAt}"`);
  }

  if (!Array.isArray(entry.related) || entry.related.length === 0) {
    errors.push(`${label}: related must contain at least one absolute site path`);
  } else {
    entry.related.forEach((href) => {
      if (!isNonEmptyString(href) || !href.startsWith('/')) {
        errors.push(`${label}: related link "${href}" must be an absolute site path`);
      }
    });
  }
}

function validateRouteInventory(entries, errors) {
  const routes = publishedRoutes(entries);
  const routeSet = new Set(routes);

  if (routes.length !== EXPECTED_ROUTES.length || !routes.every((route, index) => route === EXPECTED_ROUTES[index])) {
    for (const expected of EXPECTED_ROUTES) {
      if (!routeSet.has(expected)) {
        errors.push(`inventory: missing approved route ${expected}`);
      }
    }
    for (const actual of routes) {
      if (!EXPECTED_ROUTES.includes(actual)) {
        errors.push(`inventory: unexpected acquisition route ${actual} is outside the approved fifteen`);
      }
    }
    if (new Set(routes).size !== routes.length) {
      errors.push('inventory: duplicate acquisition route derived from published entries');
    }
  }
}

function validateUniqueness(entries, errors) {
  const fields = [
    ['intent', (entry) => entry.intent],
    ['title', (entry) => entry.title],
    ['description', (entry) => entry.description],
    ['h1', (entry) => entry.h1],
    ['translationKey', (entry) => entry.translationKey]
  ];
  for (const [label, pick] of fields) {
    const seen = new Map();
    for (const entry of entries) {
      if (entry.status !== 'published') {
        continue;
      }
      const value = pick(entry);
      const key = normalizeText(value ?? '').toLowerCase();
      if (!key) {
        continue;
      }
      const previous = seen.get(key);
      if (previous) {
        errors.push(`duplicate ${label}: "${value}" is used by both ${previous} and ${entry.file}`);
      } else {
        seen.set(key, entry.file);
      }
    }
  }
}

function validateProhibitedPhrases(entries, errors) {
  for (const entry of entries) {
    if (entry.status !== 'published') {
      continue;
    }
    const haystack = entry.raw.toLowerCase();
    for (const phrase of PROHIBITED_PHRASES) {
      if (haystack.includes(phrase)) {
        errors.push(`${entry.file}: prohibited unsupported phrase "${phrase}"`);
      }
    }
    const match = entry.raw.match(SECURITY_WORD_PATTERN);
    if (match) {
      errors.push(`${entry.file}: prohibited unsupported security/device/sync wording "${match[0]}"`);
    }
    for (const brand of COMPETITOR_BRANDS) {
      if (new RegExp(`\\b${brand}\\b`, 'i').test(entry.raw)) {
        errors.push(`${entry.file}: competitor brand "${brand}" appears without a cited source`);
      }
    }
  }
}

function validateLinksAndOrphans(entries, errors) {
  const routes = publishedRoutes(entries);
  const routeSet = new Set(routes);
  const approved = new Set([...routeSet, ...SITE_ROUTES]);
  const inbound = computeInbound(entries);

  for (const route of routes) {
    if ((inbound.get(route) ?? 0) === 0) {
      errors.push(`orphan: ${route} receives no inbound link from another acquisition page`);
    }
  }

  for (const entry of entries) {
    if (entry.status !== 'published') {
      continue;
    }
    const label = entry.file;

    for (const href of entry.related) {
      if (!isNonEmptyString(href) || !href.startsWith('/')) {
        continue;
      }
      const normalized = normalizeLink(href);
      if (!approved.has(normalized)) {
        errors.push(`${label}: broken related link ${href} does not resolve to an approved route`);
      }
    }

    for (const href of bodyLinks(entry.body)) {
      if (/^https?:\/\//.test(href)) {
        if (!href.startsWith('https://apps.apple.com')) {
          errors.push(`${label}: external link ${href} must point to the Apple App Store`);
        }
        continue;
      }
      if (href.startsWith('/downloads/')) {
        const assetPath = path.join(publicRoot, href);
        if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
          errors.push(`${label}: download link ${href} does not resolve to a shipped public asset`);
        }
        continue;
      }
      if (!href.startsWith('/')) {
        continue;
      }
      const normalized = normalizeLink(href);
      if (!approved.has(normalized)) {
        errors.push(`${label}: broken internal link ${href} does not resolve to an approved route`);
      }
    }
  }
}

function validateLocationSlugs(entries, errors) {
  for (const route of publishedRoutes(entries)) {
    for (const segment of route.split('/').filter(Boolean)) {
      if (LOCATION_SLUGS.has(segment)) {
        errors.push(`inventory: ${route} contains location slug "${segment}" — city/country pages are not approved`);
      }
    }
  }
}

export function validateContent({ entries = null } = {}) {
  const errors = [];
  const resolvedEntries = entries ?? loadContentEntries();

  if (!Array.isArray(resolvedEntries) || resolvedEntries.length === 0) {
    return { errors: ['inventory: no acquisition content entries found'], entries: resolvedEntries, publishedRoutes: [] };
  }

  for (const entry of resolvedEntries) {
    validateEntryContract(entry, errors);
  }

  validateRouteInventory(resolvedEntries, errors);
  validateUniqueness(resolvedEntries, errors);
  validateProhibitedPhrases(resolvedEntries, errors);
  validateLinksAndOrphans(resolvedEntries, errors);
  validateLocationSlugs(resolvedEntries, errors);

  return {
    errors,
    entries: resolvedEntries,
    publishedRoutes: publishedRoutes(resolvedEntries)
  };
}

// The acquisition contract consumed by scripts/seo/validate-dist.mjs so the
// built-output gate validates the same routes, campaigns, and clusters that
// the content gate approves.
export function loadAcquisitionContract() {
  return loadContentEntries()
    .filter((entry) => entry.status === 'published')
    .map((entry) => ({
      route: routeFor(entry),
      file: entry.file,
      campaign: entry.campaign,
      cluster: entry.cluster
    }))
    .filter(({ route }) => route)
    .sort((left, right) => left.route.localeCompare(right.route));
}

function runCli() {
  const { errors } = validateContent();
  if (errors.length > 0) {
    console.error(`Content validation failed with ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Content validation passed: 15 approved acquisition routes, no orphans, no duplicate intents or metadata');
}

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  runCli();
}
