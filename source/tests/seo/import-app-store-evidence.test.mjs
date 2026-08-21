import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLookup, parseReviews } from '../../scripts/seo/import-app-store-evidence.mjs';
import lookup from '../fixtures/apple-lookup.json' with { type: 'json' };
import reviews from '../fixtures/apple-reviews.json' with { type: 'json' };

test('accepts only the ManageState listing', () => {
  assert.equal(parseLookup(lookup).trackId, 6751497970);
});

test('rejects a mismatched track ID', () => {
  assert.throws(() => parseLookup({ resultCount: 1, results: [{ trackId: 1 }] }));
});

test('normalizes Apple reviews as verified evidence', () => {
  const [review] = parseReviews(reviews, 'us');
  assert.equal(review.verified, true);
  assert.match(review.sourceUrl, /^https:\/\/apps\.apple\.com\//);
  assert.ok(review.rating >= 1 && review.rating <= 5);
  assert.equal(review.id, 'review-123');
  assert.equal(review.locale, 'en-US');
});

test('rejects a mismatched bundle ID', () => {
  assert.throws(() => parseLookup({
    resultCount: 1,
    results: [{ trackId: 6751497970, bundleId: 'com.example.other' }]
  }));
});
