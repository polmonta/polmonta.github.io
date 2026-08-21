import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBaselineData } from '../../scripts/seo/validate-baseline-data.mjs';

const site = {
  siteUrl: 'https://managestate.app',
  appStoreId: '6751497970',
  bundleId: 'com.managestate.app',
  appStoreProviderToken: '128092033',
  appStoreCampaigns: [
    'website-home', 'website-features', 'website-audiences', 'website-comparisons',
    'website-guides', 'website-tools', 'medium', 'substack', 'youtube'
  ],
  plausibleDomain: 'managestate.app',
  primaryLanguage: 'en',
  supportedLanguages: ['en', 'es', 'ca'],
  privacyUrl: 'https://managestate.app/privacy/',
  contactUrl: 'https://managestate.app/contact/',
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
};

test('accepts the approved site contract and empty evidence lists', () => {
  assert.deepEqual(
    validateBaselineData({ site, reviews: [], testimonials: [], claims: [], screenshots: [] }),
    []
  );
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

test('rejects a claim without a repository commit SHA', () => {
  const errors = validateBaselineData({
    site, reviews: [], testimonials: [], screenshots: [],
    claims: [{
      id: 'c2', text: 'ManageState calculates monthly net income.', status: 'verified',
      verified: true, verificationDate: '2026-08-21',
      source: { repo: 'ManageState/app', path: 'src/services/propertyService.js', lines: '38-45' }
    }]
  });
  assert.match(errors.join('\n'), /claim c2 source must include commit/);
});

test('rejects an unknown App Store campaign name', () => {
  const errors = validateBaselineData({
    site: { ...site, appStoreCampaigns: [...site.appStoreCampaigns, 'Website_Home'] },
    reviews: [], testimonials: [], claims: [], screenshots: []
  });
  assert.match(errors.join('\n'), /campaign Website_Home/);
});
