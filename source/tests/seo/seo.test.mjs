import { describe, expect, it } from 'vitest';
import { buildPageMeta, canonicalUrl } from '../../src/lib/seo.js';

describe('SEO metadata', () => {
  it('normalizes canonical paths', () => {
    expect(canonicalUrl('/features/financial-control')).toBe('https://managestate.app/features/financial-control/');
    expect(canonicalUrl('features/financial-control?source=nav')).toBe('https://managestate.app/features/financial-control/');
  });

  it('returns complete English metadata', () => {
    const meta = buildPageMeta({
      title: 'Property Management App for Small Landlords | ManageState',
      description: 'Track rental finances, documents, and portfolio performance from one iPhone app.',
      path: '/'
    });
    expect(meta.lang).toBe('en');
    expect(meta.canonical).toBe('https://managestate.app/');
    expect(meta.og.type).toBe('website');
    expect(meta.og.image).toBe('https://managestate.app/social/managestate-og.png');
    expect(meta.twitter.card).toBe('summary_large_image');
    expect(meta.robots).toBe('index, follow');
  });

  it('rejects empty title and description', () => {
    expect(() => buildPageMeta({ title: '', description: 'A description', path: '/' })).toThrow(/title/);
    expect(() => buildPageMeta({ title: 'A title', description: '  ', path: '/' })).toThrow(/description/);
  });

  it('rejects array alternates without explicit language values', () => {
    expect(() => buildPageMeta({
      title: 'ManageState',
      description: 'Manage your properties.',
      path: '/',
      alternates: ['/es/']
    })).toThrow(/language and path/);
  });

  it('supports alternate languages, schemas, and noindex pages', () => {
    const meta = buildPageMeta({
      title: 'ManageState',
      description: 'Manage your properties.',
      path: '/es/',
      lang: 'es',
      alternates: { en: '/', ca: '/ca/' },
      schemas: [{ '@context': 'https://schema.org', '@type': 'WebPage' }],
      noindex: true
    });
    expect(meta.lang).toBe('es');
    expect(meta.robots).toBe('noindex, nofollow');
    expect(meta.alternates).toEqual([
      { lang: 'en', href: 'https://managestate.app/' },
      { lang: 'ca', href: 'https://managestate.app/ca/' }
    ]);
    expect(meta.schemas).toHaveLength(1);
  });
});
