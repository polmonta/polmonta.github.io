import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const APP_STORE_ID = '6751497970';
const BUNDLE_ID = 'com.managestate.app';
const STOREFRONTS = {
  us: 'en-US',
  es: 'es-ES'
};

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(SOURCE_ROOT, relativePath), 'utf8'));
}

function valueLabel(value) {
  if (value && typeof value === 'object' && 'label' in value) {
    return value.label;
  }
  return value;
}

function extractReviewId(value) {
  const text = valueLabel(value);
  if (typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  try {
    return new URL(text).searchParams.get('id') || text;
  } catch {
    return text;
  }
}

function extractLink(entry) {
  const link = entry?.link;
  if (link && typeof link === 'object') {
    return link.attributes?.href || valueLabel(link) || '';
  }
  return typeof link === 'string' ? link : '';
}

export function parseLookup(payload) {
  const result = payload?.results?.[0];
  if (
    payload?.resultCount !== 1
    || !result
    || Number(result.trackId) !== Number(APP_STORE_ID)
    || result.bundleId !== BUNDLE_ID
    || result.trackName !== 'ManageState'
  ) {
    throw new Error('Apple Lookup did not return the approved ManageState listing');
  }
  return result;
}

export function parseReviews(payload, storefront) {
  const locale = STOREFRONTS[storefront];
  if (!locale) {
    throw new Error(`Unsupported Apple storefront: ${storefront}`);
  }

  const entries = Array.isArray(payload?.feed?.entry) ? payload.feed.entry : [];
  return entries.flatMap(entry => {
    const id = extractReviewId(entry?.id);
    const quote = valueLabel(entry?.content);
    const rating = Number(valueLabel(entry?.['im:rating']));
    const sourceUrl = extractLink(entry);

    if (
      !id
      || typeof quote !== 'string'
      || quote.trim().length === 0
      || !Number.isInteger(rating)
      || rating < 1
      || rating > 5
      || !sourceUrl.startsWith('https://apps.apple.com/')
    ) {
      return [];
    }

    return [{
      id,
      quote,
      title: valueLabel(entry?.title) || '',
      author: valueLabel(entry?.author?.name) || '',
      rating,
      locale,
      sourceUrl,
      verified: true
    }];
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) {
    throw new Error(`Apple endpoint ${url} returned HTTP ${response.status}`);
  }
  return response.json();
}

export async function importAppStoreEvidence(site = readJson('src/data/site.json')) {
  if (site.appStoreId !== APP_STORE_ID || site.bundleId !== BUNDLE_ID) {
    throw new Error('site.json App Store ID or bundle ID does not match the approved listing');
  }

  const lookupUrl = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(site.bundleId)}`;
  parseLookup(await fetchJson(lookupUrl));

  const reviews = [];
  for (const storefront of Object.keys(STOREFRONTS)) {
    const reviewsUrl = `https://itunes.apple.com/${storefront}/rss/customerreviews/id=${site.appStoreId}/json`;
    reviews.push(...parseReviews(await fetchJson(reviewsUrl), storefront));
  }

  const uniqueReviews = [...new Map(reviews.map(review => [review.id, review])).values()]
    .sort((left, right) => left.locale.localeCompare(right.locale) || left.id.localeCompare(right.id));
  writeFileSync(
    resolve(SOURCE_ROOT, 'src/data/evidence/app-store-reviews.json'),
    `${JSON.stringify(uniqueReviews, null, 2)}\n`
  );
  return uniqueReviews;
}

const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
const currentFile = fileURLToPath(import.meta.url);
if (invokedFile && pathToFileURL(invokedFile).href === pathToFileURL(currentFile).href) {
  try {
    const reviews = await importAppStoreEvidence();
    console.log(`${reviews.length} verified reviews imported`);
  } catch (error) {
    console.error(`Unable to import App Store evidence: ${error.message}`);
    process.exitCode = 1;
  }
}
