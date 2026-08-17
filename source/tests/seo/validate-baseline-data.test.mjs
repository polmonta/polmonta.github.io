import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBaselineData } from '../../scripts/seo/validate-baseline-data.mjs';

const site = {
  siteUrl: 'https://managestate.app',
  appStoreId: '6751497970',
  appStoreBaseUrl: 'https://apps.apple.com/app/managestate/id6751497970',
  bundleId: 'com.managestate.app',
  primaryLanguage: 'en',
  supportedLanguages: ['en', 'es', 'ca'],
  plausibleDomain: 'managestate.app',
  privacyUrl: 'https://managestate.app/privacy/',
  termsUrl: 'https://managestate.app/terms/'
};

function validBaseline() {
  return {
    site,
    reviews: [],
    testimonials: [],
    claims: [],
    screenshots: []
  };
}

test('accepts the approved site contract and empty evidence lists', () => {
  assert.deepEqual(validateBaselineData({ site, reviews: [], testimonials: [], claims: [], screenshots: [] }), []);
});

test('rejects missing, non-HTTPS, and off-domain legal URLs', () => {
  for (const [key, value] of [
    ['privacyUrl', undefined],
    ['termsUrl', 'http://managestate.app/terms/'],
    ['privacyUrl', 'https://example.com/privacy/']
  ]) {
    const invalidSite = { ...site, [key]: value };
    const errors = validateBaselineData({ ...validBaseline(), site: invalidSite });
    assert.match(errors.join('\\n'), new RegExp(`site ${key} must be a non-empty HTTPS URL`));
  }
});

test('rejects unverified evidence and unsupported claims', () => {
  const errors = validateBaselineData({
    site,
    reviews: [{ id: 'r1', quote: 'Great', verified: false, sourceUrl: '' }],
    testimonials: [],
    claims: [{ id: 'c1', text: 'Trusted by thousands', status: 'unsupported' }],
    screenshots: []
  });
  assert.match(errors.join('\n'), /review r1 must be verified/);
  assert.match(errors.join('\n'), /claim c1 must have status verified/);
});

test('rejects every omitted baseline collection instead of defaulting it to an empty list', () => {
  for (const collectionName of ['site', 'reviews', 'testimonials', 'claims', 'screenshots']) {
    const input = validBaseline();
    delete input[collectionName];

    const errors = validateBaselineData(input);
    assert.match(errors.join('\n'), new RegExp(`${collectionName} must be explicitly provided`));
  }
});

test('requires HTTPS App Store review sources for the ManageState App Store listing', () => {
  for (const sourceUrl of [
    'http://apps.apple.com/us/app/managestate/id6751497970',
    'https://example.com/app/managestate/id6751497970',
    'https://apps.apple.com/us/app/other-app/id123',
    'https://apps.apple.com/id6751497970'
  ]) {
    const errors = validateBaselineData({
      ...validBaseline(),
      reviews: [{ id: 'r1', quote: 'Great', verified: true, sourceUrl }]
    });

    assert.match(
      errors.join('\n'),
      /review r1 sourceUrl must be an HTTPS Apple App Store URL for app 6751497970/
    );
  }
});

test('requires complete testimonial provenance before accepting a record', () => {
  const complete = {
    id: 't1',
    quote: 'A precise customer quote.',
    displayName: 'Approved Initials',
    sourceRecord: 'owner-records/testimonial-t1.json',
    consentStatus: 'approved',
    approvalDate: '2026-08-05',
    allowedLanguages: ['en'],
    verified: true
  };
  assert.deepEqual(validateBaselineData({
    ...validBaseline(),
    testimonials: [complete]
  }), []);

  for (const field of [
    'quote',
    'displayName',
    'sourceRecord',
    'consentStatus',
    'approvalDate',
    'allowedLanguages',
    'verified'
  ]) {
    const testimonial = structuredClone(complete);
    if (field === 'verified') {
      testimonial[field] = false;
    } else if (field === 'allowedLanguages') {
      testimonial[field] = [];
    } else {
      testimonial[field] = '';
    }

    const errors = validateBaselineData({
      ...validBaseline(),
      testimonials: [testimonial]
    });
    assert.ok(errors.some((error) => error.startsWith('testimonial t1')),
      `expected a testimonial provenance error for ${field}`);
  }
});

test('requires complete verified product claim provenance', () => {
  const complete = {
    id: 'c1',
    text: 'A verified product behavior.',
    source: 'src/services/example.js:1-2',
    verificationDate: '2026-08-05',
    status: 'verified',
    verified: true
  };
  assert.deepEqual(validateBaselineData({
    ...validBaseline(),
    claims: [complete]
  }), []);

  for (const field of ['text', 'source', 'verificationDate', 'status']) {
    const claim = structuredClone(complete);
    claim[field] = field === 'status' ? 'pending' : '';

    const errors = validateBaselineData({
      ...validBaseline(),
      claims: [claim]
    });
    assert.ok(errors.some((error) => error.startsWith('claim c1')),
      `expected a claim provenance error for ${field}`);
  }
});

test('requires existing public assets and supported claim IDs for screenshots', () => {
  const complete = {
    id: 's1',
    assetPath: 'source/public/hero-tilted.png',
    altText: 'ManageState property dashboard showing monthly financial totals',
    capturedAppVersion: '1.0.0',
    approvalDate: '2026-08-05',
    supportedClaimIds: ['claim-monthly-financial-summary'],
    verified: true
  };

  const errors = validateBaselineData({
    ...validBaseline(),
    claims: [{
      id: 'claim-monthly-financial-summary',
      text: 'Monthly totals',
      source: 'src/services/propertyService.js:1-2',
      verificationDate: '2026-08-05',
      status: 'verified',
      verified: true
    }],
    screenshots: [complete]
  });
  assert.deepEqual(errors, []);

  for (const [field, value] of [
    ['assetPath', 'source/public/not-present.png'],
    ['altText', 'image'],
    ['capturedAppVersion', ''],
    ['approvalDate', 'not-a-date'],
    ['supportedClaimIds', []],
    ['verified', false]
  ]) {
    const screenshot = structuredClone(complete);
    screenshot[field] = value;
    const screenshotErrors = validateBaselineData({
      ...validBaseline(),
      claims: [{
        id: 'claim-monthly-financial-summary',
        text: 'Monthly totals',
        source: 'src/services/propertyService.js:1-2',
        verificationDate: '2026-08-05',
        status: 'verified',
        verified: true
      }],
      screenshots: [screenshot]
    });
    assert.ok(screenshotErrors.some((error) => error.startsWith('screenshot s1')),
      `expected a screenshot provenance error for ${field}`);
  }
});
