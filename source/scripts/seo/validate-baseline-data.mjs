import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_SITE = {
  siteUrl: 'https://managestate.app',
  appStoreId: '6751497970',
  appStoreBaseUrl: 'https://apps.apple.com/app/managestate/id6751497970',
  bundleId: 'com.managestate.app',
  primaryLanguage: 'en',
  supportedLanguages: ['en', 'es', 'ca'],
  plausibleDomain: 'managestate.app'
};
const LEGAL_URL_KEYS = ['privacyUrl', 'termsUrl'];

const COLLECTIONS = [
  ['reviews', 'review'],
  ['testimonials', 'testimonial'],
  ['claims', 'claim'],
  ['screenshots', 'screenshot']
];
const REQUIRED_INPUTS = ['site', ...COLLECTIONS.map(([collectionName]) => collectionName)];
const APP_STORE_HOST = 'apps.apple.com';
const APP_STORE_ID = '6751497970';
const APPROVED_CONSENT_STATUSES = new Set(['approved', 'consented', 'granted']);

const scriptPath = fileURLToPath(import.meta.url);
const landingPageRoot = path.resolve(path.dirname(scriptPath), '../..');
const repositoryRoot = path.resolve(landingPageRoot, '..');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyValue(value) {
  if (isNonEmptyString(value)) {
    return true;
  }

  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length > 0;
}

function valuesEqual(actual, expected) {
  if (Array.isArray(expected)) {
    return Array.isArray(actual)
      && actual.length === expected.length
      && actual.every((value, index) => value === expected[index]);
  }

  return actual === expected;
}

function firstDefined(record, keys) {
  return keys.map((key) => record[key]).find((value) => value !== undefined);
}

function isValidDate(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function recordName(type, record, index) {
  return isNonEmptyString(record?.id) ? `${type} ${record.id}` : `${type} at index ${index}`;
}

function validateLegalUrl(site, key, errors) {
  const value = site[key];
  if (!isNonEmptyString(value)) {
    errors.push(`site ${key} must be a non-empty HTTPS URL on managestate.app`);
    return;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'managestate.app') {
      errors.push(`site ${key} must be a non-empty HTTPS URL on managestate.app`);
    }
  } catch {
    errors.push(`site ${key} must be a non-empty HTTPS URL on managestate.app`);
  }
}

function validateSite(site, errors) {
  if (site === null || typeof site !== 'object' || Array.isArray(site)) {
    errors.push('site must be an object');
    return;
  }

  for (const [key, expected] of Object.entries(EXPECTED_SITE)) {
    if (!valuesEqual(site[key], expected)) {
      errors.push(`site ${key} must equal ${JSON.stringify(expected)}`);
    }
  }

  for (const key of LEGAL_URL_KEYS) {
    validateLegalUrl(site, key, errors);
  }
}

function validateCollectionShape(collection, collectionName, errors) {
  if (!Array.isArray(collection)) {
    errors.push(`${collectionName} must be an array`);
    return false;
  }

  return true;
}

function validateEvidenceIds(collections, errors) {
  const seen = new Map();

  for (const [collectionName, type] of COLLECTIONS) {
    const collection = collections[collectionName];
    if (!Array.isArray(collection)) {
      continue;
    }

    collection.forEach((record, index) => {
      const name = recordName(type, record, index);
      if (!isNonEmptyString(record?.id)) {
        errors.push(`${name} must have a non-empty id`);
        return;
      }

      const previous = seen.get(record.id);
      if (previous) {
        errors.push(`duplicate evidence id ${record.id}; IDs must be unique (already used by ${previous})`);
      } else {
        seen.set(record.id, name);
      }
    });
  }
}

function validateQuotedEvidence(collection, type, errors) {
  collection.forEach((record, index) => {
    const name = recordName(type, record, index);
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${name} must be an object`);
      return;
    }

    if (!isNonEmptyString(record.quote)) {
      errors.push(`${name} quote must be non-empty`);
    }

    if (record.verified !== true) {
      errors.push(`${name} must be verified`);
    }
  });
}

function isManageStateAppStoreUrl(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const pathSegments = parsed.pathname.split('/');
    return parsed.protocol === 'https:'
      && parsed.hostname === APP_STORE_HOST
      && pathSegments.includes('app')
      && pathSegments.includes(`id${APP_STORE_ID}`);
  } catch {
    return false;
  }
}

function validateReviews(reviews, errors) {
  reviews.forEach((record, index) => {
    const name = recordName('review', record, index);
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${name} must be an object`);
      return;
    }

    if (!isNonEmptyString(record.quote)) {
      errors.push(`${name} quote must be non-empty`);
    }

    if (record.verified !== true) {
      errors.push(`${name} must be verified`);
    }

    if (!isNonEmptyString(record.sourceUrl)) {
      errors.push(`${name} must have a non-empty sourceUrl`);
    } else if (!isManageStateAppStoreUrl(record.sourceUrl)) {
      errors.push(`${name} sourceUrl must be an HTTPS Apple App Store URL for app ${APP_STORE_ID}`);
    }
  });
}

function validateTestimonials(testimonials, errors) {
  validateQuotedEvidence(testimonials, 'testimonial', errors);

  testimonials.forEach((record, index) => {
    const name = recordName('testimonial', record, index);
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      return;
    }

    const displayIdentity = firstDefined(record, [
      'displayName',
      'displayIdentity',
      'approvedName',
      'approvedInitials'
    ]);
    if (!isNonEmptyString(displayIdentity)) {
      errors.push(`${name} must have an exact display identity`);
    }

    if (!isNonEmptyValue(record.sourceRecord)) {
      errors.push(`${name} must have a sourceRecord`);
    }

    const consentStatus = firstDefined(record, ['consentStatus', 'publicationConsentStatus']);
    if (!isNonEmptyString(consentStatus)
      || !APPROVED_CONSENT_STATUSES.has(consentStatus.trim().toLowerCase())) {
      errors.push(`${name} must have approved publication consent status`);
    }

    const approvalDate = firstDefined(record, ['approvalDate', 'approvedAt']);
    if (!isValidDate(approvalDate)) {
      errors.push(`${name} must have a valid approval date`);
    }

    if (!Array.isArray(record.allowedLanguages)
      || record.allowedLanguages.length === 0
      || record.allowedLanguages.some((language) => !isNonEmptyString(language))) {
      errors.push(`${name} must have allowed languages`);
    }
  });
}

function validateClaims(claims, errors) {
  claims.forEach((record, index) => {
    const name = recordName('claim', record, index);
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${name} must be an object`);
      return;
    }

    if (!isNonEmptyString(record.text)) {
      errors.push(`${name} text must be non-empty`);
    }

    if (!isNonEmptyValue(record.source)) {
      errors.push(`${name} must have a source`);
    }

    if (!isValidDate(record.verificationDate)) {
      errors.push(`${name} must have a valid verification date`);
    }

    if (record.status !== 'verified') {
      errors.push(`${name} must have status verified`);
    }
  });
}

function isDescriptiveAltText(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return !['image', 'photo', 'screenshot', 'screen shot', 'image of app'].includes(normalized);
}

function validateScreenshots(screenshots, claims, errors) {
  const claimIds = new Set(
    (Array.isArray(claims) ? claims : [])
      .filter((claim) => claim !== null && typeof claim === 'object' && !Array.isArray(claim))
      .map((claim) => claim.id)
  );

  screenshots.forEach((record, index) => {
    const name = recordName('screenshot', record, index);
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${name} must be an object`);
      return;
    }

    const assetPath = firstDefined(record, ['assetPath', 'publicAssetPath', 'path']);
    const resolvedAssetPath = isNonEmptyString(assetPath)
      ? path.resolve(repositoryRoot, assetPath)
      : '';
    const hasPublicAssetPath = isNonEmptyString(assetPath)
      && !assetPath.startsWith('/')
      && !assetPath.startsWith('./')
      && !assetPath.includes('..')
      && assetPath.startsWith('landing-page/public/')
      && resolvedAssetPath.startsWith(`${path.join(repositoryRoot, 'landing-page/public')}${path.sep}`)
      && fs.existsSync(resolvedAssetPath)
      && fs.statSync(resolvedAssetPath).isFile();
    if (!hasPublicAssetPath) {
      errors.push(`${name} must have a repository-relative public asset path that exists`);
    }

    const altText = firstDefined(record, ['altText', 'alt']);
    if (!isDescriptiveAltText(altText)) {
      errors.push(`${name} must have descriptive alt text`);
    }

    const appVersion = firstDefined(record, ['capturedAppVersion', 'appVersion']);
    if (!isNonEmptyString(appVersion)) {
      errors.push(`${name} must have a captured app version`);
    }

    const approvalDate = firstDefined(record, ['approvalDate', 'approvedAt']);
    if (!isValidDate(approvalDate)) {
      errors.push(`${name} must have a valid approval date`);
    }

    if (!Array.isArray(record.supportedClaimIds)
      || record.supportedClaimIds.length === 0
      || record.supportedClaimIds.some((claimId) => !isNonEmptyString(claimId))) {
      errors.push(`${name} must have supported claim IDs`);
    } else {
      for (const claimId of record.supportedClaimIds) {
        if (!claimIds.has(claimId)) {
          errors.push(`${name} references unknown claim ${claimId}`);
        }
      }
    }

    if (record.verified !== true) {
      errors.push(`${name} must be verified`);
    }
  });
}

export function validateBaselineData(input = {}) {
  const errors = [];
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return ['baseline data must be an object'];
  }

  for (const key of REQUIRED_INPUTS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) {
      errors.push(`${key} must be explicitly provided`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'site')) {
    validateSite(input.site, errors);
  }

  const collections = Object.fromEntries(
    COLLECTIONS.map(([collectionName]) => [collectionName, input[collectionName]])
  );
  const validCollections = COLLECTIONS.filter(([collectionName]) => (
    Object.prototype.hasOwnProperty.call(input, collectionName)
      && validateCollectionShape(collections[collectionName], collectionName, errors)
  ));

  validateEvidenceIds(collections, errors);

  for (const [collectionName, type] of validCollections) {
    const collection = collections[collectionName];
    if (type === 'review') {
      validateReviews(collection, errors);
    } else if (type === 'testimonial') {
      validateTestimonials(collection, errors);
    } else if (type === 'claim') {
      validateClaims(collection, errors);
    } else if (type === 'screenshot') {
      validateScreenshots(collection, collections.claims, errors);
    }
  }

  return errors;
}


function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(landingPageRoot, relativePath), 'utf8'));
}

function runCli() {
  try {
    const errors = validateBaselineData({
      site: readJson('src/data/site.json'),
      reviews: readJson('src/data/evidence/app-store-reviews.json'),
      testimonials: readJson('src/data/evidence/customer-testimonials.json'),
      claims: readJson('src/data/evidence/product-claims.json'),
      screenshots: readJson('src/data/evidence/screenshots.json')
    });

    if (errors.length > 0) {
      errors.forEach((error) => console.error(error));
      process.exitCode = 1;
      return;
    }

    console.log('Baseline data valid');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  runCli();
}
