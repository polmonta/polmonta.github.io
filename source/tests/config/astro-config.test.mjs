import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('Astro configuration', () => {
  it('builds the canonical static site', () => {
    expect(config.site).toBe('https://managestate.app');
    expect(config.output).toBe('static');
  });
});
