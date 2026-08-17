import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateDist } from '../../scripts/seo/validate-dist.mjs';

const temporaryDirectories = [];

function validPage({
  title = 'ManageState home',
  description = 'A focused property management app.',
  canonical = 'https://managestate.app/',
  h1 = 'Manage your rentals.',
  body = '',
  bodyAttributes = '',
  footer = '<footer><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></footer>'
} = {}) {
  return `<!doctype html>
<html><head>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow">
</head><body${bodyAttributes ? ` ${bodyAttributes}` : ''}>
<h1>${h1}</h1>
<img src="/hero.png" alt="ManageState dashboard">
<a href="/">Home</a>${body}
${footer}
</body></html>`;
}

function legalPages({ footer, privacyBody, privacyBodyAttributes, termsBody } = {}) {
  const footerOption = footer === undefined ? {} : { footer };
  return {
    'privacy/index.html': validPage({
      title: 'ManageState Privacy Policy',
      description: 'ManageState privacy policy and marketing-site analytics disclosure.',
      canonical: 'https://managestate.app/privacy/',
      h1: 'ManageState Privacy Policy',
      body: privacyBody ?? '<p>Before analytics is enabled, this site may conditionally use Plausible Analytics. When enabled, Plausible Analytics provides its default marketing-site pageview measurement. The non-identifying app_store_click event includes page path, content cluster, CTA placement, language, and campaign.</p>',
      bodyAttributes: privacyBodyAttributes,
      ...footerOption
    }),
    'terms/index.html': validPage({
      title: 'ManageState Terms of Use',
      description: 'Apple Standard EULA governing use of the ManageState app.',
      canonical: 'https://managestate.app/terms/',
      h1: 'LICENSED APPLICATION END USER LICENSE AGREEMENT',
      body: termsBody ?? '<p>Apps made available through the App Store are licensed, not sold, to you.</p>',
      ...footerOption
    })
  };
}

async function createDist({ pages, sitemapUrls = [] }) {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'managestate-dist-'));
  temporaryDirectories.push(distDir);

  for (const [relativePath, html] of Object.entries(pages)) {
    const filePath = path.join(distDir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, html);
  }

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://managestate.app/sitemap-0.xml</loc></sitemap>
</sitemapindex>`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
  await writeFile(path.join(distDir, 'sitemap-index.xml'), sitemapIndex);
  await writeFile(path.join(distDir, 'sitemap-0.xml'), sitemap);

  return distDir;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('built dist validation', () => {
  it('accepts complete pages whose canonical URLs are in the sitemap once', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage(),
        ...legalPages()
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    expect(validateDist({ distDir })).toEqual([]);
  });

  it('reports file-specific metadata, image, and placeholder-link failures', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': `<!doctype html><html><head></head><body>
          <img src="/hero.png">
          <a href="#">Placeholder</a>
        </body></html>`
      },
      sitemapUrls: []
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /index\.html:.*title/i.test(error))).toBe(true);
    expect(errors.some((error) => /index\.html:.*description/i.test(error))).toBe(true);
    expect(errors.some((error) => /index\.html:.*canonical/i.test(error))).toBe(true);
    expect(errors.some((error) => /index\.html:.*h1/i.test(error))).toBe(true);
    expect(errors.some((error) => /index\.html:.*alt/i.test(error))).toBe(true);
    expect(errors.some((error) => /index\.html:.*placeholder/i.test(error))).toBe(true);
  });

  it('rejects duplicate metadata, path-mismatched canonicals, Vite branding, and sitemap omissions', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage({ body: '<p>Vite starter</p>' }),
        ...legalPages(),
        'about/index.html': validPage({ canonical: 'https://managestate.app/', body: '<p>About</p>' }),
        'contact/index.html': validPage({
          title: 'Contact ManageState',
          description: 'Contact the ManageState team.',
          canonical: 'https://managestate.app/contact/',
          h1: 'Contact ManageState',
          body: '<p>Contact</p>'
        })
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /duplicate title/i.test(error))).toBe(true);
    expect(errors.some((error) => /duplicate description/i.test(error))).toBe(true);
    expect(errors.some((error) => /duplicate canonical/i.test(error))).toBe(true);
    expect(errors.some((error) => /duplicate h1/i.test(error))).toBe(true);
    expect(errors.some((error) => /about\/index\.html:.*canonical.*path/i.test(error))).toBe(true);
    expect(errors.some((error) => /Vite branding/i.test(error))).toBe(true);
    expect(errors.some((error) => /contact\/index\.html:.*sitemap/i.test(error))).toBe(true);
  });

  it('requires crawlable legal routes with self-canonicals', async () => {
    const distDir = await createDist({
      pages: { 'index.html': validPage() },
      sitemapUrls: ['https://managestate.app/']
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /privacy.*built html/i.test(error))).toBe(true);
    expect(errors.some((error) => /terms.*built html/i.test(error))).toBe(true);
  });

  it('requires footer legal links and the privacy analytics disclosure', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage({ footer: '<footer><a href="/">Home</a></footer>' }),
        ...legalPages({
          footer: '<footer><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></footer>',
          privacyBody: '<p>Policy text without the analytics disclosure.</p>'
        })
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /footer.*privacy/i.test(error))).toBe(true);
    expect(errors.some((error) => /footer.*terms/i.test(error))).toBe(true);
    expect(errors.some((error) => /privacy.*disclosure/i.test(error))).toBe(true);
  });

  it('requires the default marketing-site pageview disclosure', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage(),
        ...legalPages({
          privacyBody: '<p>Before analytics is enabled, this site may conditionally use Plausible Analytics. The non-identifying app_store_click event includes page path, content cluster, CTA placement, language, and campaign.</p>'
        })
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /default marketing-site pageview measurement/i.test(error))).toBe(true);
  });

  it('reports malformed percent-encoded sitemap paths with the sitemap file context', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage(),
        ...legalPages()
      },
      sitemapUrls: [
        'https://managestate.app/%E0%A4%A',
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /sitemap-0\.xml location 1:.*malformed percent-encoding/i.test(error))).toBe(true);
  });

  it('does not count analytics code as visible privacy disclosure', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage(),
        ...legalPages({
          privacyBody: '<p>Before analytics is enabled, this text is non-identifying.</p><script>window.plausible(\'app_store_click\')</script>'
        })
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /privacy.*disclosure/i.test(error))).toBe(true);
  });

  it('does not count hidden or aria-hidden text as visible privacy disclosure', async () => {
    for (const attribute of ['hidden', 'aria-hidden="true"']) {
      const distDir = await createDist({
        pages: {
          'index.html': validPage(),
          ...legalPages({
            privacyBody: `<p>Before analytics is enabled, this text is non-identifying.</p><p ${attribute}>Plausible Analytics app_store_click</p>`
          })
        },
        sitemapUrls: [
          'https://managestate.app/',
          'https://managestate.app/privacy/',
          'https://managestate.app/terms/'
        ]
      });

      const errors = validateDist({ distDir });
      expect(errors.some((error) => /privacy.*disclosure/i.test(error))).toBe(true);
    }
  });

  it('does not count disclosure text when the root body is hidden or aria-hidden', async () => {
    for (const attribute of ['hidden', 'aria-hidden="true"']) {
      const distDir = await createDist({
        pages: {
          'index.html': validPage(),
          ...legalPages({ privacyBodyAttributes: attribute })
        },
        sitemapUrls: [
          'https://managestate.app/',
          'https://managestate.app/privacy/',
          'https://managestate.app/terms/'
        ]
      });

      const errors = validateDist({ distDir });
      expect(errors.some((error) => /privacy.*disclosure/i.test(error))).toBe(true);
    }
  });

  it('requires the local legal files to keep absolute self-canonical URLs', async () => {
    const distDir = await createDist({
      pages: {
        'index.html': validPage(),
        'privacy/index.html': validPage({
          title: 'ManageState Privacy Policy',
          description: 'ManageState privacy policy and marketing-site analytics disclosure.',
          canonical: 'https://managestate.app/other/',
          h1: 'ManageState Privacy Policy',
          body: '<p>Before analytics is enabled, this site may conditionally use Plausible Analytics. The non-identifying app_store_click event includes page path, content cluster, CTA placement, language, and campaign.</p>'
        }),
        'terms/index.html': legalPages()['terms/index.html']
      },
      sitemapUrls: [
        'https://managestate.app/',
        'https://managestate.app/privacy/',
        'https://managestate.app/terms/'
      ]
    });

    const errors = validateDist({ distDir });
    expect(errors.some((error) => /privacy\/index\.html:.*canonical.*path/i.test(error))).toBe(true);
    expect(errors.some((error) => /privacy\/index\.html: expected self-canonical/i.test(error))).toBe(true);
  });
});
