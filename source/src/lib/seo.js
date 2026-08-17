import site from '../data/site.json' with { type: 'json' };

const DEFAULT_IMAGE = '/social/managestate-og.png';

function normalizePath(pathname) {
  if (typeof pathname !== 'string') {
    throw new TypeError('path must be a string');
  }

  const pathWithoutQuery = pathname.trim().split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = pathWithoutQuery.startsWith('/')
    ? pathWithoutQuery
    : `/${pathWithoutQuery}`;

  if (withLeadingSlash === '/') {
    return '/';
  }

  return `/${withLeadingSlash.replace(/^\/+|\/+$/g, '')}/`;
}

function absoluteUrl(value) {
  return new URL(value, `${site.siteUrl}/`).toString();
}

function normalizeAlternate(alternate, language) {
  if (typeof alternate === 'string') {
    if (typeof language !== 'string' || language.trim() === '') {
      throw new TypeError('each alternate must include a language and path');
    }

    return { lang: language, href: absoluteUrl(normalizePath(alternate)) };
  }

  if (alternate === null || typeof alternate !== 'object' || Array.isArray(alternate)) {
    throw new TypeError('alternates must contain language/path objects');
  }

  const lang = alternate.lang ?? alternate.language ?? alternate.hreflang ?? language;
  const path = alternate.path ?? alternate.href ?? alternate.url;
  if (typeof lang !== 'string' || lang.trim() === '' || typeof path !== 'string' || path.trim() === '') {
    throw new TypeError('each alternate must include a language and path');
  }

  return {
    lang,
    href: absoluteUrl(path.startsWith('http://') || path.startsWith('https://')
      ? path
      : normalizePath(path))
  };
}

function normalizeAlternates(alternates) {
  if (alternates === undefined || alternates === null) {
    return [];
  }

  if (Array.isArray(alternates)) {
    return alternates.map((alternate) => normalizeAlternate(alternate));
  }

  if (typeof alternates === 'object') {
    return Object.entries(alternates).map(([language, path]) => normalizeAlternate(path, language));
  }

  throw new TypeError('alternates must be an array or object');
}

export function canonicalUrl(pathname) {
  return new URL(normalizePath(pathname).slice(1), `${site.siteUrl}/`).toString();
}

export function buildPageMeta(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('page metadata must be an object');
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!title) {
    throw new Error('title must be non-empty');
  }
  if (!description) {
    throw new Error('description must be non-empty');
  }

  const lang = typeof input.lang === 'string' && input.lang.trim()
    ? input.lang.trim()
    : site.primaryLanguage;
  const canonical = canonicalUrl(input.path ?? '/');
  const image = absoluteUrl(input.image ?? DEFAULT_IMAGE);
  const robots = input.noindex === true ? 'noindex, nofollow' : 'index, follow';

  return {
    title,
    description,
    lang,
    canonical,
    image,
    robots,
    og: {
      type: 'website',
      url: canonical,
      title,
      description,
      image
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image
    },
    alternates: normalizeAlternates(input.alternates),
    schemas: Array.isArray(input.schemas) ? input.schemas : []
  };
}

export { DEFAULT_IMAGE };
