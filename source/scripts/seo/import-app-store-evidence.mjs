import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const APP_ID = 6751497970;
const BUNDLE_ID = 'com.managestate.app';
const APP_NAME = 'ManageState';
const REVIEW_LOCALES = ['us', 'es'];
const APPLE_HOSTS = new Set(['apps.apple.com', 'itunes.apple.com']);
const REQUIRED_FEED_FIELDS = ['author', 'updated', 'rights', 'title', 'icon', 'link', 'id'];

const scriptPath = fileURLToPath(import.meta.url);
const landingPageRoot = path.resolve(path.dirname(scriptPath), '../..');
const outputPath = path.join(landingPageRoot, 'src/data/evidence/app-store-reviews.json');

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fieldLabel(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (isRecord(value) && typeof value.label === 'string') {
    return value.label;
  }

  return undefined;
}

function requiredString(value, fieldName) {
  const result = fieldLabel(value);
  if (typeof result !== 'string' || result.trim().length === 0) {
    throw new Error(`Apple review ${fieldName} must be a non-empty string`);
  }

  return result;
}

function isFeedFieldValueValid(field, value) {
  return field === 'link' ? Array.isArray(value) : isRecord(value);
}

function reviewEntries(payload) {
  if (!isRecord(payload) || !isRecord(payload.feed)) {
    throw new Error('Apple reviews payload must contain a feed object');
  }

  const { feed } = payload;
  for (const field of REQUIRED_FEED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(feed, field)) {
      throw new Error(`Apple reviews feed is missing required field ${field}`);
    }

    if (!isFeedFieldValueValid(field, feed[field])) {
      throw new Error(`Apple reviews feed ${field} has an invalid structural type`);
    }
  }

  const hasEntries = Object.prototype.hasOwnProperty.call(feed, 'entry');
  if (!hasEntries) {
    return [];
  }

  const { entry: entries } = feed;
  if (entries === undefined) {
    throw new Error('Apple reviews payload feed.entry must be an array or object when present');
  }

  if (Array.isArray(entries)) {
    return entries;
  }

  if (isRecord(entries)) {
    return [entries];
  }

  throw new Error('Apple reviews payload feed.entry must be an array or object');
}

function reviewLink(entry) {
  const links = Array.isArray(entry?.link) ? entry.link : [entry?.link];
  const candidate = links
    .map((link) => ({
      rel: fieldLabel(link?.attributes?.rel) ?? fieldLabel(link?.rel),
      href: fieldLabel(link?.attributes?.href) ?? fieldLabel(link?.href)
    }))
    .filter(({ href }) => typeof href === 'string' && href.trim().length > 0)
    .sort((left, right) => Number(right.rel === 'related') - Number(left.rel === 'related'))[0];

  return candidate?.href;
}

function normalizeSourceUrl(value, locale) {
  const sourceUrl = requiredString(value, 'sourceUrl');
  let parsed;

  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error(`Apple review sourceUrl must be a valid URL: ${sourceUrl}`);
  }

  if (parsed.protocol !== 'https:' || !APPLE_HOSTS.has(parsed.hostname)) {
    throw new Error(`Apple review sourceUrl must use a public Apple HTTPS URL: ${sourceUrl}`);
  }

  const appIdInPath = parsed.pathname.split('/').includes(`id${APP_ID}`);
  const appIdInQuery = parsed.searchParams.get('id') === String(APP_ID);
  if (!appIdInPath && !appIdInQuery) {
    throw new Error(`Apple review sourceUrl must identify app ${APP_ID}: ${sourceUrl}`);
  }

  parsed.hostname = 'apps.apple.com';
  if (parsed.pathname === '/review' || parsed.pathname.endsWith('/review')) {
    parsed.pathname = `/${locale}/app/managestate/id${APP_ID}`;
    parsed.search = '?see-all=reviews';
  }

  return parsed.toString();
}

function parseRating(value) {
  const rawRating = requiredString(value, 'rating');
  const rating = Number(rawRating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error(`Apple review rating must be an integer from 1 to 5: ${rawRating}`);
  }

  return rating;
}

export function parseLookup(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new Error('Apple lookup payload must contain a results array');
  }

  const listing = payload.results.find((result) => (
    isRecord(result)
      && result.trackId === APP_ID
      && result.trackName === APP_NAME
      && result.bundleId === BUNDLE_ID
  ));

  if (!listing) {
    throw new Error(`Apple lookup did not contain the ManageState listing (track ID ${APP_ID}, bundle ID ${BUNDLE_ID})`);
  }

  return listing;
}

export function parseReviews(payload, locale) {
  if (typeof locale !== 'string' || locale.trim().length === 0) {
    throw new Error('Apple review locale must be a non-empty string');
  }

  const normalizedLocale = locale.trim().toLowerCase();
  return reviewEntries(payload).map((entry) => {
    if (!isRecord(entry)) {
      throw new Error('Apple review entry must be an object');
    }

    const id = requiredString(entry.id, 'id');
    const quote = requiredString(entry.content, 'content');
    const author = requiredString(entry.author?.name, 'author');
    const sourceUrl = normalizeSourceUrl(reviewLink(entry), normalizedLocale);

    return {
      id,
      quote,
      author,
      rating: parseRating(entry['im:rating']),
      locale: normalizedLocale,
      sourceUrl,
      verified: true
    };
  });
}

export async function fetchJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (response.status !== 200) {
    throw new Error(`Apple request failed (${response.status} ${response.statusText}): ${url}`);
  }

  return response.json();
}

function lookupUrl() {
  return `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(BUNDLE_ID)}`;
}

function reviewsUrl(locale) {
  return `https://itunes.apple.com/${locale}/rss/customerreviews/id=${APP_ID}/sortBy=mostRecent/json`;
}

export function dedupeAndSort(reviews) {
  const unique = new Map();
  for (const review of reviews) {
    if (!unique.has(review.id)) {
      unique.set(review.id, review);
    }
  }

  return [...unique.values()].sort((left, right) => {
    const leftKey = `${left.locale}\u0000${left.id}`;
    const rightKey = `${right.locale}\u0000${right.id}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
}

async function syncDirectory(directory, fsApi) {
  let directoryHandle;
  try {
    directoryHandle = await fsApi.open(directory, 'r');
    await directoryHandle.sync();
  } catch (error) {
    if (!['EINVAL', 'ENOTSUP', 'EBADF'].includes(error?.code)) {
      throw error;
    }
  } finally {
    await directoryHandle?.close().catch(() => {});
  }
}

export async function writeEvidenceAtomically(filePath, contents, { fsApi = fs } = {}) {
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`
  );
  let fileHandle;

  try {
    fileHandle = await fsApi.open(temporaryPath, 'wx', 0o600);
    await fileHandle.writeFile(contents, 'utf8');
    await fileHandle.sync();
    await fileHandle.close();
    fileHandle = undefined;
    await fsApi.rename(temporaryPath, filePath);
  } catch (error) {
    await fileHandle?.close().catch(() => {});
    await fsApi.unlink(temporaryPath).catch(() => {});
    throw error;
  }

  await syncDirectory(directory, fsApi);
}

async function importEvidence() {
  const listing = parseLookup(await fetchJson(lookupUrl()));
  if (listing.trackId !== APP_ID || listing.bundleId !== BUNDLE_ID) {
    throw new Error(`Apple lookup returned an unexpected ManageState listing for app ${APP_ID}`);
  }

  const storefrontReviews = await Promise.all(
    REVIEW_LOCALES.map(async (locale) => parseReviews(await fetchJson(reviewsUrl(locale)), locale))
  );
  const reviews = dedupeAndSort(storefrontReviews.flat());

  await writeEvidenceAtomically(outputPath, `${JSON.stringify(reviews, null, 2)}\n`);
  console.log(`${reviews.length} verified reviews imported`);
}

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  importEvidence().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
