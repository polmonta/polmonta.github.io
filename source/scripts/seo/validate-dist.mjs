import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAcquisitionContract, ROUTE_PREFIX } from './validate-content.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const landingPageRoot = path.resolve(path.dirname(scriptPath), '../..');
const defaultDistDir = path.join(landingPageRoot, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(landingPageRoot, 'src/data/site.json'), 'utf8'));

const HTML_FILE_PATTERN = /\.html$/i;
const XML_LOCATION_PATTERN = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
const SITE_ORIGIN = new URL(site.siteUrl).origin;

const HTML_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"'
};

function decodeEntities(value) {
  return value
    .replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, valuePart) => {
      const normalized = valuePart.toLowerCase();
      if (normalized.startsWith('#x')) {
        const codePoint = Number.parseInt(normalized.slice(2), 16);
        return Number.isNaN(codePoint) || codePoint > 0x10ffff ? entity : String.fromCodePoint(codePoint);
      }
      if (normalized.startsWith('#')) {
        const codePoint = Number.parseInt(normalized.slice(1), 10);
        return Number.isNaN(codePoint) || codePoint > 0x10ffff ? entity : String.fromCodePoint(codePoint);
      }
      return HTML_ENTITIES[normalized] ?? entity;
    });
}

function normalizeText(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

function getTagName(tag) {
  return tag.match(/^<\/?([a-z][\w:-]*)\b/i)?.[1]?.toLowerCase() ?? '';
}

function hasBooleanAttribute(tag, attributeName) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?:^|\\s)${escapedName}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?(?=\\s|/?>)`,
    'i'
  ).test(tag);
}

function isInvisibleOpeningTag(tag) {
  const tagName = getTagName(tag);
  const ariaHidden = getAttribute(tag, 'aria-hidden')?.trim().toLowerCase();
  return tagName === 'script'
    || tagName === 'style'
    || hasBooleanAttribute(tag, 'hidden')
    || ariaHidden === 'true';
}

function normalizeVisibleText(value) {
  const tagPattern = /<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi;
  const visibleText = [];
  const hiddenElements = [];
  let cursor = 0;

  for (const match of value.matchAll(tagPattern)) {
    const tag = match[0];
    const index = match.index ?? 0;
    if (hiddenElements.length === 0) {
      visibleText.push(value.slice(cursor, index));
    }

    if (/^<\//.test(tag)) {
      const tagName = getTagName(tag);
      if (tagName && hiddenElements.length > 0) {
        const stackIndex = hiddenElements.lastIndexOf(tagName);
        if (stackIndex >= 0) {
          hiddenElements.splice(stackIndex);
        }
      }
    } else if (!/^<!--/.test(tag)) {
      const tagName = getTagName(tag);
      if (tagName && !VOID_ELEMENTS.has(tagName)
        && (hiddenElements.length > 0 || isInvisibleOpeningTag(tag))) {
        hiddenElements.push(tagName);
      }
    }

    cursor = index + tag.length;
  }

  if (hiddenElements.length === 0) {
    visibleText.push(value.slice(cursor));
  }

  return normalizeText(visibleText.join(' '));
}

function getAttribute(tag, attributeName) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(
    `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  ));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function getTags(html, elementName) {
  const escapedName = elementName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(`<${escapedName}\\b[^>]*>`, 'gi'))].map(([tag]) => tag);
}

function getElements(html, elementName) {
  const escapedName = elementName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(
    `<${escapedName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedName}>`,
    'gi'
  ))].map(([, content]) => content);
}

function getElementMarkup(html, elementName) {
  const escapedName = elementName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(
    `<${escapedName}\\b[^>]*>[\\s\\S]*?<\\/${escapedName}>`,
    'i'
  ))?.[0] ?? '';
}

function getJsonLdSchemas(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    })
    .filter((schema) => schema !== null && typeof schema === 'object');
}

function getMetaValues(html, name) {
  return getTags(html, 'meta')
    .filter((tag) => getAttribute(tag, 'name')?.trim().toLowerCase() === name)
    .map((tag) => decodeEntities(getAttribute(tag, 'content') ?? ''));
}

function getCanonicalValues(html) {
  return getTags(html, 'link')
    .filter((tag) => (getAttribute(tag, 'rel') ?? '').split(/\s+/).some((value) => value.toLowerCase() === 'canonical'))
    .map((tag) => decodeEntities(getAttribute(tag, 'href') ?? ''));
}

function getHrefValues(html) {
  return getTags(html, 'a')
    .map((tag) => ({ href: decodeEntities(getAttribute(tag, 'href') ?? ''), tag }));
}

function filePathForCanonical(relativePath, siteOrigin = SITE_ORIGIN) {
  const normalized = relativePath.split(path.sep).join('/').replace(/^\/+/, '');
  let pathname;

  if (normalized === 'index.html') {
    pathname = '/';
  } else if (normalized.endsWith('/index.html')) {
    pathname = `/${normalized.slice(0, -'index.html'.length)}`;
  } else if (normalized.endsWith('.html')) {
    pathname = `/${normalized.slice(0, -'.html'.length)}/`;
  } else {
    pathname = `/${normalized}`;
  }

  return new URL(pathname, `${siteOrigin}/`).href;
}

function collectHtmlFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(absolutePath));
    } else if (entry.isFile() && HTML_FILE_PATTERN.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function relativeDistPath(absolutePath, distDir) {
  return path.relative(distDir, absolutePath).split(path.sep).join('/');
}

function addUniqueMetadata(metadata, value, relativePath, label, errors) {
  if (!value) {
    return;
  }

  const previousPath = metadata.get(value);
  if (previousPath) {
    errors.push(`${relativePath}: duplicate ${label}; already used by ${previousPath}`);
  } else {
    metadata.set(value, relativePath);
  }
}

function canonicalPathname(value) {
  try {
    const parsed = new URL(value);
    return parsed.pathname;
  } catch {
    return '';
  }
}

function validateHtmlFile(absolutePath, distDir, siteOrigin, metadata, pages, errors) {
  const relativePath = relativeDistPath(absolutePath, distDir);
  const html = fs.readFileSync(absolutePath, 'utf8');
  const titles = getElements(html, 'title').map(normalizeText);
  const descriptions = getMetaValues(html, 'description').map((value) => normalizeText(value));
  const canonicals = getCanonicalValues(html).map((value) => value.trim());
  const headings = getElements(html, 'h1').map(normalizeText);
  const footerHrefs = getElements(html, 'footer')
    .flatMap((footer) => getHrefValues(footer).map(({ href }) => href.trim()));
  const pageText = normalizeVisibleText(getElementMarkup(html, 'body') || html);
  const expectedCanonical = filePathForCanonical(relativePath, siteOrigin);

  if (titles.length !== 1 || !titles[0]) {
    errors.push(`${relativePath}: expected exactly one non-empty title, found ${titles.length}`);
  } else {
    addUniqueMetadata(metadata.titles, titles[0], relativePath, 'title', errors);
  }

  if (descriptions.length !== 1 || !descriptions[0]) {
    errors.push(`${relativePath}: expected exactly one non-empty meta description, found ${descriptions.length}`);
  } else {
    addUniqueMetadata(metadata.descriptions, descriptions[0], relativePath, 'description', errors);
  }

  let canonical = '';
  if (canonicals.length !== 1 || !canonicals[0]) {
    errors.push(`${relativePath}: expected exactly one non-empty canonical link, found ${canonicals.length}`);
  } else {
    canonical = canonicals[0];
    addUniqueMetadata(metadata.canonicals, canonical, relativePath, 'canonical', errors);

    try {
      const parsedCanonical = new URL(canonical);
      const expectedPath = canonicalPathname(expectedCanonical);
      if (parsedCanonical.origin !== siteOrigin
        || parsedCanonical.pathname !== expectedPath
        || parsedCanonical.search
        || parsedCanonical.hash) {
        errors.push(`${relativePath}: canonical URL does not match file path; expected ${expectedCanonical}`);
      }
    } catch {
      errors.push(`${relativePath}: canonical URL is invalid`);
    }
  }

  if (headings.length !== 1 || !headings[0]) {
    errors.push(`${relativePath}: expected exactly one non-empty h1, found ${headings.length}`);
  } else {
    addUniqueMetadata(metadata.headings, headings[0], relativePath, 'h1', errors);
  }

  for (const imageTag of getTags(html, 'img')) {
    const alt = getAttribute(imageTag, 'alt');
    if (alt === undefined || normalizeText(alt) === '') {
      errors.push(`${relativePath}: every image must have non-empty alt text`);
    }
  }

  for (const { href } of getHrefValues(html)) {
    const normalizedHref = href.trim().toLowerCase();
    if (normalizedHref === '' || normalizedHref === '#' || normalizedHref.startsWith('javascript:')) {
      errors.push(`${relativePath}: dead placeholder link found (${href || 'empty href'})`);
    }
  }

  if (/\bvite\b/i.test(html)) {
    errors.push(`${relativePath}: Vite branding found in built HTML`);
  }

  const robots = getMetaValues(html, 'robots').join(',').toLowerCase();
  pages.push({
    relativePath,
    canonical,
    footerHrefs,
    pageText,
    indexable: !/(^|[\s,])noindex(?:$|[\s,])/i.test(robots)
  });
}

function validateLegalRoutes(pages, siteOrigin, errors) {
  const requiredRoutes = [
    { label: 'privacy', pathname: '/privacy/', relativePath: 'privacy/index.html' },
    { label: 'terms', pathname: '/terms/', relativePath: 'terms/index.html' }
  ];

  const legalPages = new Map();
  for (const { label, pathname, relativePath } of requiredRoutes) {
    const page = pages.find((candidate) => candidate.relativePath === relativePath);
    if (!page) {
      errors.push(`${label} route ${pathname}: expected built HTML at ${relativePath}`);
      continue;
    }

    if (canonicalPathname(page.canonical) !== pathname) {
      errors.push(`${relativePath}: expected self-canonical ${siteOrigin}${pathname}`);
      continue;
    }

    legalPages.set(label, page);
  }

  const homepage = pages.find(({ relativePath }) => relativePath === 'index.html');
  for (const { label, pathname } of requiredRoutes) {
    if (!homepage?.footerHrefs.includes(pathname)) {
      errors.push(`footer: required local ${label} link ${pathname} not found on index.html`);
    }
  }

  const privacyPage = legalPages.get('privacy');
  if (!privacyPage) {
    return;
  }

  const privacyText = privacyPage.pageText;
  const missingDisclosure = [];
  if (!/plausible\s+analytics/i.test(privacyText)) {
    missingDisclosure.push('Plausible Analytics');
  }
  if (!/default\s+marketing-site\s+pageview\s+measurement/i.test(privacyText)) {
    missingDisclosure.push('default marketing-site pageview measurement');
  }
  if (!/app_store_click/i.test(privacyText)) {
    missingDisclosure.push('app_store_click');
  }
  if (!/before\s+analytics\s+is\s+enabled/i.test(privacyText)) {
    missingDisclosure.push('before analytics is enabled');
  }
  if (!/non-identifying/i.test(privacyText)) {
    missingDisclosure.push('non-identifying event properties');
  }

  if (missingDisclosure.length > 0) {
    errors.push(`privacy/index.html: analytics disclosure is incomplete (${missingDisclosure.join(', ')})`);
  }
}

function parseLocations(xml) {
  return [...xml.matchAll(XML_LOCATION_PATTERN)].map(([, location]) => decodeEntities(location).trim()).filter(Boolean);
}

function sitemapLocationUrl(value, siteOrigin, label, errors) {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== siteOrigin || parsed.search || parsed.hash) {
      errors.push(`${label}: sitemap location must be a same-origin URL without query or hash (${value})`);
      return '';
    }

    try {
      decodeURIComponent(parsed.pathname);
    } catch {
      errors.push(`${label}: sitemap location contains malformed percent-encoding (${value})`);
      return '';
    }

    return parsed.href;
  } catch {
    errors.push(`${label}: sitemap location is invalid (${value})`);
    return '';
  }
}

function localSitemapPath(value, distDir, siteOrigin, label, errors) {
  const normalizedUrl = sitemapLocationUrl(value, siteOrigin, label, errors);
  if (!normalizedUrl) {
    return '';
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(normalizedUrl).pathname).replace(/^\/+/, '');
  } catch {
    errors.push(`${label}: sitemap location contains malformed percent-encoding (${value})`);
    return '';
  }

  if (!pathname || pathname.includes('..')) {
    errors.push(`${label}: sitemap location does not map to a dist file (${value})`);
    return '';
  }

  const absolutePath = path.resolve(distDir, pathname);
  const normalizedDistDir = path.resolve(distDir);
  if (!absolutePath.startsWith(`${normalizedDistDir}${path.sep}`)) {
    errors.push(`${label}: sitemap location escapes the dist directory (${value})`);
    return '';
  }

  return absolutePath;
}

function validateSitemaps(distDir, siteOrigin, pages, errors) {
  const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
  if (!fs.existsSync(sitemapIndexPath)) {
    errors.push('sitemap-index.xml: missing sitemap index');
    return;
  }

  const sitemapIndexLocations = parseLocations(fs.readFileSync(sitemapIndexPath, 'utf8'));
  if (sitemapIndexLocations.length === 0) {
    errors.push('sitemap-index.xml: no child sitemap locations found');
    return;
  }

  const sitemapLocations = [];
  const childSitemaps = new Set();
  sitemapIndexLocations.forEach((location, index) => {
    const label = `sitemap-index.xml child ${index + 1}`;
    const childPath = localSitemapPath(location, distDir, siteOrigin, label, errors);
    if (!childPath) {
      return;
    }

    if (childSitemaps.has(childPath)) {
      errors.push(`${label}: duplicate child sitemap location (${location})`);
      return;
    }
    childSitemaps.add(childPath);

    if (!fs.existsSync(childPath)) {
      errors.push(`${relativeDistPath(childPath, distDir)}: child sitemap file is missing`);
      return;
    }

    const childXml = fs.readFileSync(childPath, 'utf8');
    if (!/<urlset\b/i.test(childXml)) {
      errors.push(`${relativeDistPath(childPath, distDir)}: expected a sitemap urlset`);
    }

    const childLocations = parseLocations(childXml);
    if (childLocations.length === 0) {
      errors.push(`${relativeDistPath(childPath, distDir)}: no page locations found`);
    }
    childLocations.forEach((pageLocation, pageIndex) => {
      const pageLabel = `${relativeDistPath(childPath, distDir)} location ${pageIndex + 1}`;
      const normalizedLocation = sitemapLocationUrl(pageLocation, siteOrigin, pageLabel, errors);
      if (normalizedLocation) {
        sitemapLocations.push({ location: normalizedLocation, label: pageLabel });
      }
    });
  });

  const sitemapCounts = new Map();
  for (const { location, label } of sitemapLocations) {
    const count = sitemapCounts.get(location) ?? 0;
    sitemapCounts.set(location, count + 1);
    if (count > 0) {
      errors.push(`${label}: duplicate sitemap page location (${location})`);
    }
  }

  const indexablePages = pages.filter((page) => page.indexable && page.canonical);
  const indexableCanonicals = new Set(indexablePages.map((page) => page.canonical));
  for (const page of indexablePages) {
    const count = sitemapCounts.get(page.canonical) ?? 0;
    if (count === 0) {
      errors.push(`${page.relativePath}: canonical ${page.canonical} is missing from the sitemap`);
    } else if (count !== 1) {
      errors.push(`${page.relativePath}: canonical ${page.canonical} appears ${count} times in the sitemap`);
    }
  }

  for (const [location] of sitemapCounts) {
    if (!indexableCanonicals.has(location)) {
      errors.push(`sitemap: ${location} does not match an indexable page canonical`);
    }
  }
}

// Built-output gate for the Phase 2 acquisition inventory (Task 5). The
// acquisition contract (approved routes + campaign/cluster per route) comes
// from scripts/seo/validate-content.mjs, so the built-output checks validate
// exactly the routes, campaigns, and clusters the content gate approves.
// The gate runs only when a contract is supplied: the CLI always supplies it,
// while callers that validate a partial or synthetic dist without acquisition
// content (e.g. the validate-dist unit suite) keep the previous behavior.
function validateAcquisitionRoutes(distDir, siteOrigin, pages, contract, errors) {
  if (!Array.isArray(contract) || contract.length === 0) {
    errors.push('dist: acquisition contract is empty; expected the fifteen approved routes');
    return;
  }

  const contractByRoute = new Map(contract.map((item) => [item.route, item]));
  const acquisitionPrefixes = Object.values(ROUTE_PREFIX);

  for (const item of contract) {
    const { route, campaign, cluster } = item;
    if (typeof route !== 'string' || !route.startsWith('/') || !route.endsWith('/')) {
      errors.push(`dist: acquisition contract route is invalid (${route})`);
      continue;
    }
    const relativePath = `${route.replace(/^\/+/, '')}index.html`;
    const page = pages.find((candidate) => candidate.relativePath === relativePath);
    if (!page) {
      errors.push(`${relativePath}: missing approved acquisition route ${route}`);
      continue;
    }
    if (canonicalPathname(page.canonical) !== route) {
      errors.push(`${relativePath}: expected self-canonical ${siteOrigin}${route}`);
      continue;
    }

    const html = fs.readFileSync(path.join(distDir, relativePath), 'utf8');
    const contentCtas = getTags(html, 'a')
      .filter((tag) => hasBooleanAttribute(tag, 'data-app-store-click'))
      .filter((tag) => getAttribute(tag, 'data-cta-placement') === 'content');
    if (contentCtas.length !== 1) {
      errors.push(`${relativePath}: expected exactly one content App Store CTA with app_store_click data, found ${contentCtas.length}`);
      continue;
    }

    const cta = contentCtas[0];
    const expectedAttributes = [
      ['data-page-path', route],
      ['data-content-cluster', cluster],
      ['data-cta-placement', 'content'],
      ['data-language', 'en'],
      ['data-campaign', campaign]
    ];
    for (const [name, expected] of expectedAttributes) {
      const actual = getAttribute(cta, name);
      if (actual !== expected) {
        errors.push(`${relativePath}: CTA ${name} must be "${expected}", found "${actual ?? ''}"`);
      }
    }

    // Design §7: every nested acquisition page emits exactly one BreadcrumbList
    // schema matching the visible breadcrumb — home, the collection section
    // label, and the current page — with canonical absolute item URLs. The
    // section crumb has no dedicated page, so it must not carry a fabricated
    // item URL pointing at a non-existent collection index route.
    const breadcrumbs = getJsonLdSchemas(html)
      .filter((schema) => schema['@type'] === 'BreadcrumbList');
    if (breadcrumbs.length !== 1) {
      errors.push(`${relativePath}: expected exactly one BreadcrumbList schema, found ${breadcrumbs.length}`);
    } else {
      const items = breadcrumbs[0].itemListElement;
      if (!Array.isArray(items) || items.length !== 3) {
        errors.push(`${relativePath}: BreadcrumbList must contain exactly 3 items (home, section, current)`);
      } else {
        const [home, section, current] = items;
        if (home?.name !== 'Home' || home?.item !== `${siteOrigin}/`) {
          errors.push(`${relativePath}: BreadcrumbList home item must be "Home" at ${siteOrigin}/`);
        }
        if (typeof section?.name !== 'string' || section.name.trim() === '') {
          errors.push(`${relativePath}: BreadcrumbList section item must have a non-empty name`);
        }
        if (typeof section === 'object' && section !== null && Object.hasOwn(section, 'item')) {
          errors.push(`${relativePath}: BreadcrumbList section item must not fabricate an item URL (no collection index page exists)`);
        }
        const expectedCurrentUrl = `${siteOrigin}${route}`;
        if (current?.item !== expectedCurrentUrl
          || typeof current?.name !== 'string'
          || current.name.trim() === '') {
          errors.push(`${relativePath}: BreadcrumbList current item must carry the canonical URL ${expectedCurrentUrl}`);
        }
      }
    }
  }

  for (const page of pages) {
    const pathname = canonicalPathname(page.canonical);
    if (pathname && acquisitionPrefixes.some((prefix) => pathname.startsWith(`${prefix}/`))
      && !contractByRoute.has(pathname)) {
      errors.push(`${page.relativePath}: acquisition route ${pathname} is outside the approved fifteen`);
    }
  }
}

export function validateDist({ distDir = defaultDistDir, siteOrigin = SITE_ORIGIN, acquisitionContract = null } = {}) {
  const errors = [];
  const resolvedDistDir = path.resolve(distDir);
  if (!fs.existsSync(resolvedDistDir)) {
    return [`dist: directory is missing (${resolvedDistDir})`];
  }

  let normalizedSiteOrigin;
  try {
    normalizedSiteOrigin = new URL(siteOrigin).origin;
  } catch {
    return [`dist: site origin is invalid (${siteOrigin})`];
  }

  const htmlFiles = collectHtmlFiles(resolvedDistDir);
  if (htmlFiles.length === 0) {
    errors.push('dist: no built HTML files found');
  }

  const metadata = {
    titles: new Map(),
    descriptions: new Map(),
    canonicals: new Map(),
    headings: new Map()
  };
  const pages = [];
  for (const htmlFile of htmlFiles) {
    validateHtmlFile(htmlFile, resolvedDistDir, normalizedSiteOrigin, metadata, pages, errors);
  }

  validateLegalRoutes(pages, normalizedSiteOrigin, errors);
  validateSitemaps(resolvedDistDir, normalizedSiteOrigin, pages, errors);
  if (acquisitionContract) {
    validateAcquisitionRoutes(resolvedDistDir, normalizedSiteOrigin, pages, acquisitionContract, errors);
  }
  return errors;
}

function runCli() {
  const errors = validateDist({ acquisitionContract: loadAcquisitionContract() });
  if (errors.length > 0) {
    console.error(`Dist validation failed with ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Dist validation passed');
}

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  runCli();
}
