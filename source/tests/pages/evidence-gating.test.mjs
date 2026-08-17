import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import site from '../../src/data/site.json';
import { buildWorkflowFaqAnswer, selectVerifiedEvidence } from '../../src/lib/evidence.js';
import { validateBaselineData } from '../../scripts/seo/validate-baseline-data.mjs';

const emptyEvidence = {
  reviews: [],
  testimonials: [],
  claims: [],
  screenshots: []
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const homepageSource = readFileSync(path.join(projectRoot, 'src/pages/index.astro'), 'utf8');
const faqSource = readFileSync(path.join(projectRoot, 'src/components/home/Faq.astro'), 'utf8');

describe('homepage evidence gate', () => {
  it('suppresses every evidence collection when validation finds an invalid record', () => {
    const baselineData = {
      site,
      reviews: [],
      testimonials: [],
      claims: [{
        id: 'claim-invalid',
        text: 'An invalid claim.',
        source: 'src/services/example.js:1-2',
        verificationDate: '2026-08-05',
        status: 'pending',
        verified: true
      }],
      screenshots: []
    };
    const validationErrors = validateBaselineData(baselineData);

    expect(validationErrors).toContain('claim claim-invalid must have status verified');
    expect(selectVerifiedEvidence(baselineData, validationErrors)).toEqual(emptyEvidence);
  });

  it('does not let invalid evidence reach the homepage FAQ workflow answer', () => {
    const baselineData = {
      site,
      reviews: [],
      testimonials: [],
      claims: [{
        id: 'claim-monthly-financial-summary',
        text: 'An invalid workflow claim.',
        source: 'src/services/example.js:1-2',
        verificationDate: '2026-08-05',
        status: 'pending',
        verified: true
      }],
      screenshots: []
    };
    const validationErrors = validateBaselineData(baselineData);
    const verifiedEvidence = selectVerifiedEvidence(baselineData, validationErrors);

    expect(validationErrors).toContain('claim claim-monthly-financial-summary must have status verified');
    expect(verifiedEvidence.claims).toEqual([]);
    expect(buildWorkflowFaqAnswer(verifiedEvidence.claims)).toBeNull();
    expect(homepageSource).toContain('<Faq claims={verifiedEvidence.claims} />');
    expect(faqSource).toContain('buildWorkflowFaqAnswer(Astro.props.claims)');
    expect(faqSource).toContain('Detailed workflow information is not included until the relevant product evidence has been validated.');
  });
});
