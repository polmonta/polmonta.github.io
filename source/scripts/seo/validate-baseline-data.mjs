import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const APPROVED_CAMPAIGNS = [
  'website-home',
  'website-features',
  'website-audiences',
  'website-comparisons',
  'website-guides',
  'website-tools',
  'medium',
  'substack',
  'youtube'
];
const EXPECTED_SITE = {
  siteUrl: 'https://managestate.app',
  appStoreId: '6751497970',
  bundleId: 'com.managestate.app',
  appStoreProviderToken: '128092033',
  plausibleDomain: 'managestate.app',
  primaryLanguage: 'en',
  supportedLanguages: ['en', 'es', 'ca']
};

const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;

function addExpectedValueError(errors, subject, actual, expected) {
  if (actual !== expected) {
    errors.push(`${subject} must equal ${expected}`);
  }
}

function validateHttpsUrl(errors, subject, value, { hostname, trailingSlash = false } = {}) {
  if (!isNonEmptyString(value)) {
    errors.push(`${subject} must be an HTTPS URL`);
    return;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      errors.push(`${subject} must be an HTTPS URL`);
    }
    if (hostname && url.hostname !== hostname) {
      errors.push(`${subject} must be on ${hostname}`);
    }
    if (trailingSlash && !url.pathname.endsWith('/')) {
      errors.push(`${subject} must have a trailing slash`);
    }
  } catch {
    errors.push(`${subject} must be an HTTPS URL`);
  }
}

function validateSite(site, errors) {
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    errors.push('site must be an object');
    return;
  }

  for (const [key, expected] of Object.entries(EXPECTED_SITE)) {
    if (Array.isArray(expected)) {
      if (JSON.stringify(site[key]) !== JSON.stringify(expected)) {
        errors.push(`site ${key} must equal ${JSON.stringify(expected)}`);
      }
    } else {
      addExpectedValueError(errors, `site ${key}`, site[key], expected);
    }
  }

  validateHttpsUrl(errors, 'site privacyUrl', site.privacyUrl, {
    hostname: 'managestate.app',
    trailingSlash: true
  });
  validateHttpsUrl(errors, 'site contactUrl', site.contactUrl, {
    hostname: 'managestate.app',
    trailingSlash: true
  });
  validateHttpsUrl(errors, 'site termsUrl', site.termsUrl);

  if (!Array.isArray(site.appStoreCampaigns)) {
    errors.push('site appStoreCampaigns must be an array');
    return;
  }

  const campaigns = new Set(site.appStoreCampaigns);
  for (const campaign of site.appStoreCampaigns) {
    if (typeof campaign !== 'string' || !/^[a-z0-9-]+$/.test(campaign)) {
      errors.push(`campaign ${campaign} must contain only lowercase letters, numbers, and hyphens`);
    }
  }

  for (const campaign of site.appStoreCampaigns) {
    if (!APPROVED_CAMPAIGNS.includes(campaign)) {
      errors.push(`campaign ${campaign} is not approved`);
    }
  }
  for (const campaign of APPROVED_CAMPAIGNS) {
    if (!campaigns.has(campaign)) {
      errors.push(`campaign ${campaign} is missing`);
    }
  }
  if (campaigns.size !== APPROVED_CAMPAIGNS.length || site.appStoreCampaigns.length !== APPROVED_CAMPAIGNS.length) {
    errors.push('site appStoreCampaigns must contain exactly the nine approved campaigns');
  }
}

function validateEvidenceCollection(records, category, errors, validateRecord) {
  if (!Array.isArray(records)) {
    errors.push(`${category} must be an array`);
    return new Set();
  }

  const ids = new Set();
  records.forEach((record, index) => {
    const id = record && typeof record === 'object' ? record.id : undefined;
    const label = isNonEmptyString(id) ? id : `index ${index}`;
    if (!isNonEmptyString(id)) {
      errors.push(`${category} ${label} must have a non-empty id`);
    } else if (ids.has(id)) {
      errors.push(`${category} ${id} must have a unique id`);
    } else {
      ids.add(id);
    }

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${category} ${label} must be an object`);
      return;
    }
    if (record.verified !== true) {
      errors.push(`${category.slice(0, -1)} ${label} must be verified`);
    }
    validateRecord(record, label, errors);
  });
  return ids;
}

function validateReviews(reviews, errors) {
  validateEvidenceCollection(reviews, 'reviews', errors, (review, id, collectionErrors) => {
    if (!isNonEmptyString(review.quote)) {
      collectionErrors.push(`review ${id} must have a non-empty quote`);
    }
    if (!isNonEmptyString(review.sourceUrl) || !review.sourceUrl.startsWith('https://apps.apple.com/')) {
      collectionErrors.push(`review ${id} sourceUrl must be on https://apps.apple.com/`);
    }
    if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
      collectionErrors.push(`review ${id} rating must be an integer from 1 to 5`);
    }
  });
}

function validateTestimonials(testimonials, errors) {
  validateEvidenceCollection(testimonials, 'testimonials', errors, (testimonial, id, collectionErrors) => {
    if (!isNonEmptyString(testimonial.sourceRecord)) {
      collectionErrors.push(`testimonial ${id} must include sourceRecord`);
    }
    if (testimonial.consentStatus !== 'granted') {
      collectionErrors.push(`testimonial ${id} must have consentStatus granted`);
    }
    if (!isNonEmptyString(testimonial.approvalDate)) {
      collectionErrors.push(`testimonial ${id} must include approvalDate`);
    }
    if (!Array.isArray(testimonial.allowedLanguages) || testimonial.allowedLanguages.length === 0) {
      collectionErrors.push(`testimonial ${id} must include allowedLanguages`);
    }
  });
}

function validateClaims(claims, errors) {
  const claimIds = validateEvidenceCollection(claims, 'claims', errors, (claim, id, collectionErrors) => {
    if (claim.status !== 'verified') {
      collectionErrors.push(`claim ${id} must have status verified`);
    }
    if (!isNonEmptyString(claim.verificationDate)) {
      collectionErrors.push(`claim ${id} must include verificationDate`);
    }
    if (!claim.source || typeof claim.source !== 'object' || Array.isArray(claim.source)) {
      collectionErrors.push(`claim ${id} must include a source object`);
      return;
    }
    for (const field of ['repo', 'path', 'lines']) {
      if (!isNonEmptyString(claim.source[field])) {
        collectionErrors.push(`claim ${id} source must include ${field}`);
      }
    }
    if (!/^[0-9a-f]{40}$/i.test(claim.source.commit || '')) {
      collectionErrors.push(`claim ${id} source must include commit`);
    }
  });
  return claimIds;
}

function isPublicAssetPath(assetPath) {
  if (!isNonEmptyString(assetPath) || isAbsolute(assetPath)) {
    return false;
  }
  const relativePath = assetPath.startsWith('source/') ? assetPath.slice('source/'.length) : assetPath;
  const normalizedPath = normalize(relativePath);
  return normalizedPath === relativePath && normalizedPath.startsWith('public/');
}

function publicAssetExists(assetPath) {
  if (!isPublicAssetPath(assetPath)) {
    return false;
  }
  const relativePath = assetPath.startsWith('source/') ? assetPath.slice('source/'.length) : assetPath;
  const absolutePath = resolve(SOURCE_ROOT, relativePath);
  try {
    return existsSync(absolutePath) && statSync(absolutePath).isFile();
  } catch {
    return false;
  }
}

function validateScreenshots(screenshots, claims, errors) {
  const claimIds = new Set(claims);
  validateEvidenceCollection(screenshots, 'screenshots', errors, (screenshot, id, collectionErrors) => {
    if (!isPublicAssetPath(screenshot.path) || !publicAssetExists(screenshot.path)) {
      collectionErrors.push(`screenshot ${id} path must be an existing repository-relative public asset`);
    }
    if (!isNonEmptyString(screenshot.alt)) {
      collectionErrors.push(`screenshot ${id} must include descriptive alt`);
    }
    if (!isNonEmptyString(screenshot.capturedAppVersion)) {
      collectionErrors.push(`screenshot ${id} must include capturedAppVersion`);
    }
    if (!isNonEmptyString(screenshot.approvalDate)) {
      collectionErrors.push(`screenshot ${id} must include approvalDate`);
    }
    if (!Array.isArray(screenshot.supportsClaims)) {
      collectionErrors.push(`screenshot ${id} must include supportsClaims`);
      return;
    }
    for (const claimId of screenshot.supportsClaims) {
      if (!claimIds.has(claimId)) {
        collectionErrors.push(`screenshot ${id} references unknown claim ${claimId}`);
      }
    }
  });
}

export function validateBaselineData({ site, reviews, testimonials, claims, screenshots }) {
  const errors = [];
  validateSite(site, errors);
  validateReviews(reviews, errors);
  validateTestimonials(testimonials, errors);
  const claimIds = validateClaims(claims, errors);
  validateScreenshots(screenshots, claimIds, errors);
  return errors;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(SOURCE_ROOT, relativePath), 'utf8'));
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedFile && pathToFileURL(invokedFile).href === pathToFileURL(currentFile).href) {
  try {
    const errors = validateBaselineData({
      site: readJson('src/data/site.json'),
      reviews: readJson('src/data/evidence/app-store-reviews.json'),
      testimonials: readJson('src/data/evidence/customer-testimonials.json'),
      claims: readJson('src/data/evidence/product-claims.json'),
      screenshots: readJson('src/data/evidence/screenshots.json')
    });
    if (errors.length > 0) {
      errors.forEach(error => console.error(error));
      process.exitCode = 1;
    } else {
      console.log('Baseline data valid');
    }
  } catch (error) {
    console.error(`Unable to read baseline data: ${error.message}`);
    process.exitCode = 1;
  }
}
