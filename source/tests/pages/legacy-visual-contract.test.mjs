import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const homepagePath = path.join(projectRoot, 'dist/index.html');
const articlePath = path.join(projectRoot, 'dist/features/financial-control/index.html');

function read(pathname) {
  return readFileSync(pathname, 'utf8');
}

describe('built legacy visual contract', () => {
  it('uses the light legacy shell and screenshot-led landmarks on the homepage', () => {
    const html = read(homepagePath);
    const styles = read(path.join(projectRoot, 'src/styles/global.css'));

    expect(styles).toContain('--primary: #2563eb');
    expect(styles).toContain('background: #ffffff');
    expect(styles).toContain('background: #111827');
    expect(styles).toContain('overflow-x: hidden');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(html).toMatch(/class="site-header[^"]*site-header--legacy/);
    expect(html).toMatch(/<img[^>]+src="\/img\/managestate-logo\.png"[^>]+alt="ManageState logo"/);
    expect(html).toMatch(/class="hero[^"]*hero--legacy/);
    expect(html).toMatch(/class="hero__visual[^"]*hero__visual--screenshot/);
    expect(html).toMatch(/src="\/img\/legacy-app-mockup\.jpg"/);
    expect(html).toMatch(/class="section section--features[^"]*section--legacy/);
    expect(html).toMatch(/class="site-footer[^"]*site-footer--legacy/);
    expect(html).toContain('Download ManageState for iPhone');
    expect(html).toContain('href="/privacy/"');
    expect(html).toContain('href="/terms/"');
    expect(existsSync(path.join(projectRoot, 'public/img/managestate-logo.png'))).toBe(true);
    expect(existsSync(path.join(projectRoot, 'public/img/legacy-app-mockup.jpg'))).toBe(true);
  });

  it('applies the same visual shell to a representative acquisition article', () => {
    const html = read(articlePath);

    expect(html).toMatch(/class="site-header[^"]*site-header--legacy/);
    expect(html).toMatch(/class="acquisition-article[^"]*acquisition-article--legacy/);
    expect(html).toMatch(/class="breadcrumbs[^"]*breadcrumbs--legacy/);
    expect(html).toContain('At a glance');
    expect(html).toContain('Frequently asked questions');
    expect(html).toContain('Related reading');
    expect(html).toContain('Download ManageState for iPhone');
    expect(html).toMatch(/class="site-footer[^"]*site-footer--legacy/);
  });
});
