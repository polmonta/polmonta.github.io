import site from '../data/site.json';

const CAMPAIGN_PATTERN = /^[a-z0-9-]+$/;

export function buildAppStoreUrl(campaign, providerToken = '') {
  if (typeof campaign !== 'string' || !CAMPAIGN_PATTERN.test(campaign)) {
    throw new TypeError('App Store campaign names must match /^[a-z0-9-]+$/');
  }

  if (typeof providerToken !== 'string' || providerToken.length === 0) {
    return site.appStoreBaseUrl;
  }

  const url = new URL(site.appStoreBaseUrl);
  url.search = new URLSearchParams({
    pt: providerToken,
    ct: campaign,
    mt: '8'
  }).toString();
  return url.toString();
}
