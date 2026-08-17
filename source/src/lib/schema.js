import site from '../data/site.json';

const APPLICATION_NAME = 'ManageState';
const APPLICATION_CATEGORY = 'BusinessApplication';
const OPERATING_SYSTEM = 'iOS';
const MINIMUM_AGGREGATE_REVIEW_COUNT = 2;
const APP_STORE_LISTING_PATH = new URL(site.appStoreBaseUrl).pathname;
const APP_STORE_LOCALE_LISTING_PATH = new RegExp(
  `^/[a-z]{2}(?:-[a-z]{2})?${APP_STORE_LISTING_PATH.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`,
  'i'
);

function absoluteUrl(value) {
  return new URL(value, `${site.siteUrl}/`).toString();
}

function isManageStateAppStoreUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'apps.apple.com'
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && (url.pathname === APP_STORE_LISTING_PATH
        || APP_STORE_LOCALE_LISTING_PATH.test(url.pathname));
  } catch {
    return false;
  }
}

function verifiedReviewRatings(input) {
  const reviews = Array.isArray(input)
    ? input
    : input !== null && typeof input === 'object' && Array.isArray(input?.reviews)
      ? input.reviews
      : [];

  if (reviews.length < MINIMUM_AGGREGATE_REVIEW_COUNT) {
    return [];
  }

  const ratings = reviews.map((review) => {
    if (review === null || typeof review !== 'object' || Array.isArray(review)) {
      return null;
    }

    const rating = review.rating;
    if (review.verified !== true
      || !Number.isFinite(rating)
      || rating < 1
      || rating > 5
      || !isManageStateAppStoreUrl(review.sourceUrl)) {
      return null;
    }

    return rating;
  });

  return ratings.every((rating) => rating !== null) ? ratings : [];
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APPLICATION_NAME,
    url: site.siteUrl
  };
}

// BreadcrumbList for nested routes (design §7). Mirrors the visible breadcrumb
// in Breadcrumbs.astro: Home, the collection section label, and the current
// page title. Home and the current page carry canonical absolute item URLs.
// The section crumb has no dedicated page (no collection index routes exist),
// so it renders as a plain label with no `item` URL rather than fabricating a
// link to a non-existent page. No organization or other fabricated data is
// added.
export function buildBreadcrumbListSchema(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('breadcrumb schema input must be an object');
  }

  const path = typeof input.path === 'string' && input.path.trim() ? input.path.trim() : '';
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : '';
  const section = typeof input.section === 'string' && input.section.trim() ? input.section.trim() : '';

  if (!path) {
    throw new Error('breadcrumb url path is required');
  }
  if (!title) {
    throw new Error('breadcrumb title is required');
  }

  const items = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') }
  ];
  if (section) {
    items.push({ '@type': 'ListItem', position: 2, name: section });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: title,
    item: absoluteUrl(path)
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

export function buildArticleSchema(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('article schema input must be an object');
  }

  const headline = typeof input.headline === 'string' ? input.headline.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const date = input.date instanceof Date && !Number.isNaN(input.date.getTime()) ? input.date : null;
  const path = typeof input.path === 'string' && input.path.trim() ? input.path.trim() : '';
  const image = typeof input.image === 'string' && input.image.trim() ? input.image.trim() : '';

  if (!headline) {
    throw new Error('article headline is required');
  }
  if (!date) {
    throw new Error('article date is required');
  }
  if (!path) {
    throw new Error('article url path is required');
  }

  const articleUrl = absoluteUrl(path);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    datePublished: date.toISOString(),
    dateModified: date.toISOString(),
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    image: image.startsWith('http://') || image.startsWith('https://')
      ? image
      : absoluteUrl(image),
    author: {
      '@type': 'Organization',
      name: APPLICATION_NAME,
      url: site.siteUrl
    },
    publisher: {
      '@type': 'Organization',
      name: APPLICATION_NAME,
      url: site.siteUrl
    }
  };

  if (description) {
    schema.description = description;
  }

  return schema;
}

export function buildSoftwareApplicationSchema(input = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APPLICATION_NAME,
    operatingSystem: OPERATING_SYSTEM,
    applicationCategory: APPLICATION_CATEGORY,
    downloadUrl: site.appStoreBaseUrl
  };

  const ratings = verifiedReviewRatings(input);
  if (ratings.length > 0) {
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(average.toFixed(2)),
      ratingCount: ratings.length,
      bestRating: 5,
      worstRating: 1
    };
  }

  return schema;
}
