import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { acquisitionEntrySchema } from './lib/acquisition.js';

function acquisitionCollection(name) {
  return defineCollection({
    loader: glob({
      pattern: '**/*.{md,mdx}',
      base: `./src/content/${name}`
    }),
    schema: acquisitionEntrySchema
  });
}

export const collections = {
  features: acquisitionCollection('features'),
  audiences: acquisitionCollection('audiences'),
  comparisons: acquisitionCollection('comparisons'),
  guides: acquisitionCollection('guides'),
  tools: acquisitionCollection('tools')
};
