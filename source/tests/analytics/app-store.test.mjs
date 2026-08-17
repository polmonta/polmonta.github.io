// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAppStoreUrl } from '../../src/lib/app-store.js';
import { isApprovedPlausibleDomain } from '../../src/lib/analytics-config.js';
import { initializeAnalytics } from '../../src/scripts/analytics.js';

it('builds a working unattributed fallback', () => {
  expect(buildAppStoreUrl('website-home', '')).toBe('https://apps.apple.com/app/managestate/id6751497970');
});

it('adds Apple campaign attribution when provider token exists', () => {
  expect(buildAppStoreUrl('website-home', '123456')).toContain('pt=123456&ct=website-home&mt=8');
});

describe('App Store campaign validation', () => {
  it('rejects campaign names outside the approved format', () => {
    expect(() => buildAppStoreUrl('Website Home', '')).toThrow(/campaign names/i);
    expect(() => buildAppStoreUrl('website_home', '')).toThrow(/campaign names/i);
  });
});

describe('Plausible script domain gate', () => {
  it('accepts only the exact approved domain', () => {
    expect(isApprovedPlausibleDomain('managestate.app')).toBe(true);
    expect(isApprovedPlausibleDomain('')).toBe(false);
    expect(isApprovedPlausibleDomain('www.managestate.app')).toBe(false);
    expect(isApprovedPlausibleDomain('managestate.app.evil.example')).toBe(false);
    expect(isApprovedPlausibleDomain('MANAGESTATE.APP')).toBe(false);
  });
});

describe('App Store click analytics', () => {
  beforeEach(() => {
    delete window.plausible;
    initializeAnalytics();
  });

  afterEach(() => {
    delete window.plausible;
    document.body.replaceChildren();
  });

  it('forwards click props without preventing navigation', () => {
    const plausible = vi.fn();
    window.plausible = plausible;

    const link = document.createElement('a');
    link.href = 'https://apps.apple.com/app/managestate/id6751497970';
    link.target = '_blank';
    link.dataset.appStoreClick = '';
    link.dataset.pagePath = '/';
    link.dataset.contentCluster = 'home';
    link.dataset.ctaPlacement = 'hero';
    link.dataset.language = 'en';
    link.dataset.campaign = 'website-home';
    document.body.append(link);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(link.dispatchEvent(click)).toBe(true);
    expect(click.defaultPrevented).toBe(false);
    expect(plausible).toHaveBeenCalledWith('app_store_click', {
      props: {
        page_path: '/',
        content_cluster: 'home',
        cta_placement: 'hero',
        language: 'en',
        campaign: 'website-home'
      }
    });
  });

  it('does not block a CTA when Plausible is unavailable or throws', () => {
    const link = document.createElement('a');
    link.href = 'https://apps.apple.com/app/managestate/id6751497970';
    link.target = '_blank';
    link.dataset.appStoreClick = '';
    document.body.append(link);

    const withoutPlausible = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(() => link.dispatchEvent(withoutPlausible)).not.toThrow();
    expect(withoutPlausible.defaultPrevented).toBe(false);

    window.plausible = () => {
      throw new Error('blocked analytics');
    };
    const throwingPlausible = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(() => link.dispatchEvent(throwingPlausible)).not.toThrow();
    expect(throwingPlausible.defaultPrevented).toBe(false);
  });
});
