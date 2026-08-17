import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculatePropertyRoi } from '../../src/lib/roi.js';
import RoiCalculator from '../../src/components/tools/RoiCalculator.jsx';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distRoot = path.join(projectRoot, 'dist');
const SITE_ORIGIN = 'https://managestate.app';
const ROUTE = '/tools/rental-property-roi-calculator/';

describe('calculatePropertyRoi', () => {
  it('calculates standard rental metrics', () => {
    expect(
      calculatePropertyRoi({
        annualRent: 24000,
        annualExpenses: 6000,
        purchasePrice: 300000,
        cashInvested: 90000
      })
    ).toEqual({
      netIncome: 18000,
      grossYieldPct: 8,
      netYieldPct: 6,
      cashOnCashPct: 20
    });
  });

  it('rounds every percentage to two decimals', () => {
    expect(
      calculatePropertyRoi({
        annualRent: 1000,
        annualExpenses: 250,
        purchasePrice: 300000,
        cashInvested: 75000
      })
    ).toEqual({
      netIncome: 750,
      grossYieldPct: 0.33,
      netYieldPct: 0.25,
      cashOnCashPct: 1
    });
  });

  it('rounds a repeating third to two decimals', () => {
    expect(
      calculatePropertyRoi({
        annualRent: 1,
        annualExpenses: 0,
        purchasePrice: 3,
        cashInvested: 3
      })
    ).toEqual({
      netIncome: 1,
      grossYieldPct: 33.33,
      netYieldPct: 33.33,
      cashOnCashPct: 33.33
    });
  });

  it('rejects zero denominators and negative inputs', () => {
    expect(() =>
      calculatePropertyRoi({ annualRent: 1, annualExpenses: -1, purchasePrice: 0, cashInvested: 0 })
    ).toThrow();
  });

  it('rejects a zero purchase price on its own', () => {
    expect(() =>
      calculatePropertyRoi({ annualRent: 1000, annualExpenses: 100, purchasePrice: 0, cashInvested: 500 })
    ).toThrow(/purchase price/i);
  });

  it('rejects zero cash invested on its own', () => {
    expect(() =>
      calculatePropertyRoi({ annualRent: 1000, annualExpenses: 100, purchasePrice: 100000, cashInvested: 0 })
    ).toThrow(/cash invested/i);
  });

  it('rejects any negative input', () => {
    expect(() =>
      calculatePropertyRoi({ annualRent: -1, annualExpenses: 0, purchasePrice: 100000, cashInvested: 50000 })
    ).toThrow(/annual rent/i);
    expect(() =>
      calculatePropertyRoi({ annualRent: 1000, annualExpenses: -1, purchasePrice: 100000, cashInvested: 50000 })
    ).toThrow(/annual expenses/i);
    expect(() =>
      calculatePropertyRoi({ annualRent: 1000, annualExpenses: 100, purchasePrice: -1, cashInvested: 50000 })
    ).toThrow(/purchase price/i);
    expect(() =>
      calculatePropertyRoi({ annualRent: 1000, annualExpenses: 100, purchasePrice: 100000, cashInvested: -1 })
    ).toThrow(/cash invested/i);
  });

  it('rejects non-finite and non-number inputs', () => {
    expect(() =>
      calculatePropertyRoi({ annualRent: NaN, annualExpenses: 0, purchasePrice: 100000, cashInvested: 50000 })
    ).toThrow();
    expect(() =>
      calculatePropertyRoi({ annualRent: Infinity, annualExpenses: 0, purchasePrice: 100000, cashInvested: 50000 })
    ).toThrow();
    expect(() =>
      calculatePropertyRoi({ annualRent: '24000', annualExpenses: 0, purchasePrice: 100000, cashInvested: 50000 })
    ).toThrow();
    expect(() => calculatePropertyRoi(null)).toThrow();
  });

  it('accepts zero rent and expenses with positive denominators', () => {
    expect(
      calculatePropertyRoi({ annualRent: 0, annualExpenses: 0, purchasePrice: 100000, cashInvested: 50000 })
    ).toEqual({
      netIncome: 0,
      grossYieldPct: 0,
      netYieldPct: 0,
      cashOnCashPct: 0
    });
  });

  it('reports a negative net income honestly when expenses exceed rent', () => {
    expect(
      calculatePropertyRoi({
        annualRent: 10000,
        annualExpenses: 12000,
        purchasePrice: 200000,
        cashInvested: 50000
      })
    ).toEqual({
      netIncome: -2000,
      grossYieldPct: 5,
      netYieldPct: -1,
      cashOnCashPct: -4
    });
  });
});

describe('RoiCalculator island', () => {
  it('renders labeled, keyboard-usable inputs for the four fields', () => {
    const html = renderToStaticMarkup(createElement(RoiCalculator));
    for (const id of ['roi-annual-rent', 'roi-annual-expenses', 'roi-purchase-price', 'roi-cash-invested']) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain('type="number"');
      expect(html).toContain('min="0"');
    }
  });

  it('announces results as estimates in a live region', () => {
    const html = renderToStaticMarkup(createElement(RoiCalculator));
    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/results are estimates/i);
  });
});

describe('built ROI calculator page', () => {
  it('publishes the calculator route with tool metadata and a working CTA payload', () => {
    if (!existsSync(distRoot)) {
      return;
    }

    const htmlPath = path.join(distRoot, ROUTE.slice(1), 'index.html');
    expect(existsSync(htmlPath), `${ROUTE} must be built`).toBe(true);
    const html = readFileSync(htmlPath, 'utf8');
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    expect(h1s.length, `${ROUTE} must render exactly one h1`).toBe(1);
    expect(html, `${ROUTE} App Store CTA`).toContain('data-app-store-click');
    expect(html, `${ROUTE} CTA campaign`).toContain('data-campaign="website-tools"');
    expect(html, `${ROUTE} CTA placement`).toContain('data-cta-placement="content"');
    expect(html, `${ROUTE} CTA page path`).toContain(`data-page-path="${ROUTE}"`);
    expect(html, `${ROUTE} canonical`).toContain(`href="${SITE_ORIGIN}${ROUTE}"`);

    // The island is server-rendered into the static HTML, so the labels and
    // live results region are present without JavaScript.
    expect(html, `${ROUTE} calculator input`).toContain('id="roi-annual-rent"');
    expect(html, `${ROUTE} live results region`).toMatch(/role="status"/);
  });
});
