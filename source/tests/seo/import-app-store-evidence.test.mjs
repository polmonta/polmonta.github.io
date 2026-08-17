import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  dedupeAndSort,
  fetchJson,
  parseLookup,
  parseReviews,
  writeEvidenceAtomically
} from '../../scripts/seo/import-app-store-evidence.mjs';
import lookup from '../fixtures/apple-lookup.json' with { type: 'json' };
import reviews from '../fixtures/apple-reviews.json' with { type: 'json' };

test('accepts only the ManageState listing', () => {
  assert.equal(parseLookup(lookup).trackId, 6751497970);
});

test('rejects a listing with a mismatched track ID', () => {
  const mismatchedLookup = structuredClone(lookup);
  mismatchedLookup.results[0].trackId = 123;

  assert.throws(() => parseLookup(mismatchedLookup), /track ID/i);
});

test('rejects a listing with a mismatched name or bundle ID', () => {
  for (const field of ['trackName', 'bundleId']) {
    const mismatchedLookup = structuredClone(lookup);
    mismatchedLookup.results[0][field] = 'not-managestate';

    assert.throws(() => parseLookup(mismatchedLookup), /ManageState listing/i);
  }
});

test('normalizes Apple reviews as verified evidence', () => {
  const [review] = parseReviews(reviews, 'us');

  assert.deepEqual(review, {
    id: 'https://itunes.apple.com/us/review?id=6751497970&type=Purple+Software',
    quote: 'ManageState makes our household routines easier to follow.',
    author: 'Public Reviewer',
    rating: 5,
    locale: 'us',
    sourceUrl: 'https://apps.apple.com/us/app/managestate/id6751497970?see-all=reviews',
    verified: true
  });
});

test('rejects null and malformed Apple review feeds', () => {
  assert.throws(() => parseReviews(null, 'us'), /feed/i);
  assert.throws(() => parseReviews({}, 'us'), /feed/i);
  assert.throws(() => parseReviews({ feed: {} }, 'us'), /feed/i);
});

function emptyAppleFeed() {
  return {
    feed: {
      author: {},
      updated: {},
      rights: {},
      title: {},
      icon: {},
      link: [],
      id: {}
    }
  };
}

test('rejects null required Apple feed metadata', () => {
  for (const field of ['author', 'updated', 'rights', 'title', 'icon', 'link', 'id']) {
    const malformedFeed = emptyAppleFeed();
    malformedFeed.feed[field] = null;

    assert.throws(() => parseReviews(malformedFeed, 'us'), new RegExp(`feed ${field}`, 'i'));
  }
});

test('rejects wrong structural types in required Apple feed metadata', () => {
  const malformedValues = {
    author: [],
    updated: 'not-an-object',
    rights: [],
    title: 'not-an-object',
    icon: [],
    link: {},
    id: []
  };

  for (const [field, value] of Object.entries(malformedValues)) {
    const malformedFeed = emptyAppleFeed();
    malformedFeed.feed[field] = value;

    assert.throws(() => parseReviews(malformedFeed, 'us'), new RegExp(`feed ${field}`, 'i'));
  }
});

test('accepts a structurally valid storefront with no reviews', () => {
  assert.deepEqual(parseReviews(emptyAppleFeed(), 'us'), []);
});

test('rejects non-200 Apple responses', async () => {
  await assert.rejects(
    fetchJson('https://itunes.apple.com/lookup', async () => ({
      status: 503,
      statusText: 'Service Unavailable'
    })),
    /503 Service Unavailable/
  );
});

test('deduplicates by review ID and sorts by locale and ID', () => {
  const sorted = dedupeAndSort([
    { id: 'review-z', locale: 'us', quote: 'first' },
    { id: 'review-a', locale: 'us', quote: 'second' },
    { id: 'review-z', locale: 'us', quote: 'duplicate' },
    { id: 'review-b', locale: 'es', quote: 'third' }
  ]);

  assert.deepEqual(sorted.map(({ locale, id, quote }) => `${locale}:${id}:${quote}`), [
    'es:review-b:third',
    'us:review-a:second',
    'us:review-z:first'
  ]);
});

test('preserves existing evidence when an atomic temporary write fails', async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'managestate-atomic-'));
  const evidencePath = path.join(temporaryDirectory, 'app-store-reviews.json');
  await fs.writeFile(evidencePath, 'existing evidence\n', 'utf8');

  const failingFs = {
    open: async (...args) => {
      const handle = await fs.open(...args);
      return {
        writeFile: async () => {
          throw new Error('deterministic temporary write failure');
        },
        sync: handle.sync.bind(handle),
        close: handle.close.bind(handle)
      };
    },
    unlink: (...args) => fs.unlink(...args),
    rename: (...args) => fs.rename(...args)
  };

  await assert.rejects(
    writeEvidenceAtomically(evidencePath, 'replacement evidence\n', { fsApi: failingFs }),
    /deterministic temporary write failure/
  );
  assert.equal(await fs.readFile(evidencePath, 'utf8'), 'existing evidence\n');
  assert.deepEqual(await fs.readdir(temporaryDirectory), ['app-store-reviews.json']);

  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});
