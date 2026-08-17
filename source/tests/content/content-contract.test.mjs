import { describe, expect, it } from 'vitest';
import {
  ACQUISITION_COLLECTIONS,
  ACQUISITION_ROUTES,
  COLLECTION_LABELS,
  acquisitionEntrySchema,
  getAcquisitionPaths
} from '../../src/lib/acquisition.js';

const VALID_ENTRY = {
  title: 'Track Rental Income and Expenses in One App',
  description: 'See how ManageState helps independent landlords track rental income, expenses, documents, and property performance from one straightforward iPhone app.',
  h1: 'Track Rental Income and Expenses in One Place',
  summary: [
    'Record rent payments and late fees from a single screen.',
    'Categorize expenses for tax time without spreadsheets.',
    'Keep leases, receipts, and inspections in one place.'
  ],
  openingAnswer: 'ManageState is a property management app for independent landlords who want to track rental income, expenses, documents, and property performance on their iPhone.',
  intent: 'Compare ManageState with spreadsheet-based tracking.',
  cluster: 'features',
  campaign: 'website-features',
  lang: 'en',
  translationKey: 'track-rental-income-and-expenses',
  status: 'published',
  updatedAt: '2026-08-01',
  related: ['/features/manage-documents/'],
  faqs: [
    { question: 'Does ManageState track late fees?', answer: 'Yes, you can record late fees alongside rent payments.' }
  ]
};

function parse(entry) {
  return acquisitionEntrySchema.safeParse(entry);
}

function expectInvalid(overrides) {
  const result = parse({ ...VALID_ENTRY, ...overrides });
  expect(result.success).toBe(false);
}

describe('acquisition collection and route contract', () => {
  it('allows exactly the five acquisition collections', () => {
    expect(ACQUISITION_COLLECTIONS).toEqual([
      'features',
      'audiences',
      'comparisons',
      'guides',
      'tools'
    ]);
  });

  it('labels every allowed collection for breadcrumbs and navigation', () => {
    expect(Object.keys(COLLECTION_LABELS).sort()).toEqual([...ACQUISITION_COLLECTIONS].sort());
  });

  it('maps every collection to a unique, site-rooted static path prefix', () => {
    expect(ACQUISITION_ROUTES).toEqual({
      features: '/features',
      audiences: '/for',
      comparisons: '/compare',
      guides: '/guides',
      tools: '/tools'
    });

    const prefixes = Object.values(ACQUISITION_ROUTES);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    for (const prefix of prefixes) {
      expect(prefix.startsWith('/')).toBe(true);
    }
  });

  it('returns the static path prefix for every collection', () => {
    for (const collection of ACQUISITION_COLLECTIONS) {
      expect(getAcquisitionPaths(collection)).toBe(ACQUISITION_ROUTES[collection]);
    }
  });

  it('rejects unknown or missing collection names', () => {
    expect(() => getAcquisitionPaths('home')).toThrow();
    expect(() => getAcquisitionPaths()).toThrow();
  });
});

describe('acquisition entry schema contract', () => {
  it('accepts a fully valid published entry', () => {
    const result = parse(VALID_ENTRY);
    expect(result.success).toBe(true);
  });

  it('requires the language to be en', () => {
    expectInvalid({ lang: 'es' });
    expectInvalid({ lang: 'en-US' });
  });

  it('requires a summary of 3 to 5 points', () => {
    expectInvalid({ summary: VALID_ENTRY.summary.slice(0, 2) });
    expectInvalid({
      summary: [
        ...VALID_ENTRY.summary,
        'A fourth summary point that is long enough.',
        'A fifth summary point that is long enough.',
        'A sixth summary point that is long enough.'
      ]
    });
  });

  it('requires every summary point to be substantive', () => {
    expectInvalid({ summary: ['Too short.'] });
  });

  it('accepts only draft, review, and published statuses', () => {
    for (const status of ['draft', 'review', 'published']) {
      expect(parse({ ...VALID_ENTRY, status }).success).toBe(true);
    }
    expectInvalid({ status: 'live' });
    expectInvalid({ status: '' });
  });

  it('requires related links to be absolute site paths', () => {
    expectInvalid({ related: ['features/manage-documents/'] });
    expectInvalid({ related: ['https://example.com/features/manage-documents/'] });
    expectInvalid({ related: [''] });
    expect(parse({ ...VALID_ENTRY, related: ['/features/manage-documents/'] }).success).toBe(true);
  });

  it('requires at least one related link', () => {
    expectInvalid({ related: [] });
  });

  it('enforces the website-* campaign pattern for every collection', () => {
    const campaigns = [
      'website-features',
      'website-audiences',
      'website-comparisons',
      'website-guides',
      'website-tools'
    ];
    for (const campaign of campaigns) {
      expect(parse({ ...VALID_ENTRY, campaign }).success).toBe(true);
    }
    expectInvalid({ campaign: 'website-home' });
    expectInvalid({ campaign: 'features' });
  });

  it('requires published entries to include related links and an opening answer', () => {
    expectInvalid({ status: 'published', related: [] });
    expectInvalid({ status: 'published', openingAnswer: '' });
  });

  it('enforces the cluster enum', () => {
    expectInvalid({ cluster: 'home' });
    expectInvalid({ cluster: 'audience' });
  });

  it('enforces the translation key slug pattern', () => {
    expectInvalid({ translationKey: 'Bad Slug!' });
    expectInvalid({ translationKey: '' });
    expect(parse({ ...VALID_ENTRY, translationKey: 'manage-rental-income' }).success).toBe(true);
  });

  it('enforces the title, description, h1, and intent length bounds', () => {
    expectInvalid({ title: 'This title is too short.' });
    expectInvalid({ description: 'This description is far too short.' });
    expectInvalid({ h1: 'Too short' });
    expectInvalid({ intent: 'Short.' });
  });

  it('coerces updatedAt into a Date', () => {
    const result = parse(VALID_ENTRY);
    expect(result.success).toBe(true);
    expect(result.data.updatedAt).toBeInstanceOf(Date);
    expect(result.data.updatedAt.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('defaults faqs to an empty array', () => {
    const withoutFaqs = { ...VALID_ENTRY };
    delete withoutFaqs.faqs;
    const result = parse(withoutFaqs);
    expect(result.success).toBe(true);
    expect(result.data.faqs).toEqual([]);
  });
});
