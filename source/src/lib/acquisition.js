import { z } from 'astro/zod';

export const ACQUISITION_COLLECTIONS = Object.freeze([
  'features',
  'audiences',
  'comparisons',
  'guides',
  'tools'
]);

export const ACQUISITION_ROUTES = Object.freeze({
  features: '/features',
  audiences: '/for',
  comparisons: '/compare',
  guides: '/guides',
  tools: '/tools'
});

export const COLLECTION_LABELS = Object.freeze({
  features: 'Features',
  audiences: 'For Landlords',
  comparisons: 'Compare',
  guides: 'Guides',
  tools: 'Tools'
});

export const acquisitionEntrySchema = z.object({
  title: z.string().min(30).max(70),
  description: z.string().min(110).max(165),
  h1: z.string().min(10).max(90),
  summary: z.array(z.string().min(20)).min(3).max(5),
  openingAnswer: z.string().min(80),
  intent: z.string().min(10),
  cluster: z.enum(['features', 'audiences', 'comparisons', 'guides', 'tools']),
  campaign: z.enum([
    'website-features',
    'website-audiences',
    'website-comparisons',
    'website-guides',
    'website-tools'
  ]),
  lang: z.literal('en'),
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'review', 'published']),
  updatedAt: z.coerce.date(),
  related: z.array(z.string().startsWith('/')).min(1),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([])
});

export function getAcquisitionPaths(collectionName) {
  if (typeof collectionName !== 'string' || !Object.hasOwn(ACQUISITION_ROUTES, collectionName)) {
    throw new TypeError(`unknown acquisition collection: ${collectionName}`);
  }
  return ACQUISITION_ROUTES[collectionName];
}
