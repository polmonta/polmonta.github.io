import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbListSchema,
  buildOrganizationSchema,
  buildSoftwareApplicationSchema
} from '../../src/lib/schema.js';

describe('structured data builders', () => {
  it('emits a home-to-current BreadcrumbList with canonical absolute item URLs', () => {
    expect(buildBreadcrumbListSchema({
      path: '/features/financial-control/',
      title: 'Keep rental income and expenses under control',
      section: 'Features'
    })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://managestate.app/' },
        { '@type': 'ListItem', position: 2, name: 'Features' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Keep rental income and expenses under control',
          item: 'https://managestate.app/features/financial-control/'
        }
      ]
    });
  });

  it('does not fabricate an item URL for a section crumb without a page', () => {
    const schema = buildBreadcrumbListSchema({
      path: '/guides/landlord-expense-tracker/',
      title: 'A guide title',
      section: 'Guides'
    });
    expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(schema.itemListElement[0].item).toBe('https://managestate.app/');
    expect(schema.itemListElement[1]).not.toHaveProperty('item');
    expect(schema.itemListElement[2].item).toBe('https://managestate.app/guides/landlord-expense-tracker/');
  });

  it('requires a path and a title for the breadcrumb schema', () => {
    expect(() => buildBreadcrumbListSchema({ path: '/x/', title: '' })).toThrow(/title/);
    expect(() => buildBreadcrumbListSchema({ path: '', title: 'A title' })).toThrow(/path/);
    expect(() => buildBreadcrumbListSchema(null)).toThrow(TypeError);
  });

  it('emits only the verified organization identity', () => {
    expect(buildOrganizationSchema()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ManageState',
      url: 'https://managestate.app'
    });
  });

  it('emits the verified iOS application identity and App Store URL', () => {
    expect(buildSoftwareApplicationSchema()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ManageState',
      operatingSystem: 'iOS',
      applicationCategory: 'BusinessApplication',
      downloadUrl: 'https://apps.apple.com/app/managestate/id6751497970'
    });
  });

  it('does not invent an aggregate rating from incomplete review evidence', () => {
    const schema = buildSoftwareApplicationSchema({
      reviews: [{
        id: 'review-1',
        rating: 5,
        verified: true,
        sourceUrl: 'https://apps.apple.com/es/app/managestate/id6751497970?see-all=reviews'
      }]
    });

    expect(schema).not.toHaveProperty('aggregateRating');
  });

  it('rejects App Store URLs without the verified ManageState listing path', () => {
    const schema = buildSoftwareApplicationSchema({
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          verified: true,
          sourceUrl: 'https://apps.apple.com/es/app/managestate/id6751497970?see-all=reviews'
        },
        {
          id: 'review-2',
          rating: 4,
          verified: true,
          sourceUrl: 'https://apps.apple.com/id6751497970'
        }
      ]
    });

    expect(schema).not.toHaveProperty('aggregateRating');
  });

  it('calculates an aggregate only from complete verified review values', () => {
    const schema = buildSoftwareApplicationSchema({
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          verified: true,
          sourceUrl: 'https://apps.apple.com/es/app/managestate/id6751497970?see-all=reviews'
        },
        {
          id: 'review-2',
          rating: 4,
          verified: true,
          sourceUrl: 'https://apps.apple.com/us/app/managestate/id6751497970?see-all=reviews'
        }
      ]
    });

    expect(schema.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      ratingCount: 2,
      bestRating: 5,
      worstRating: 1
    });
  });
});
