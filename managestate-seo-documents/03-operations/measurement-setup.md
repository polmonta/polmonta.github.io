# Measurement setup and owner runbook

**Original baseline date:** 2026-08-05
**Revision:** 2 — 2026-08-21
**Status:** Search Console and Plausible re-confirmed on 2026-08-21; tracking integration pending Phase 1a; nine App Store campaign links re-verified; sanitized repository artifacts recreated
**Canonical site:** `https://managestate.app`

This runbook establishes measurement operations without inventing historical data. Repository
artifacts contain only public observations and sanitized aggregates; they never contain credentials,
raw private exports, personally identifiable information, or customer property data.

## Revision 2 notes

On 2026-08-05 the owner confirmed that Google Search Console and web analytics had never been
configured for this site, then confirmed that the Search Console domain property was created and
DNS-verified and that the Plausible site was created, and supplied nine public App Store campaign
links which were verified the same day.

What changed since:

- The 2026-08-17 implementation that would have deployed the tracking script was reverted on 2026-08-20. **No Plausible script has ever been live**, so there is still no analytics history to recover.
- Every committed measurement artifact was removed by that revert. `source/seo-ops/`, its private boundary, and the question-query file must be re-created by Phase 0 Task 3.
- All repository paths moved from `landing-page/seo-ops/` to `source/seo-ops/`.
- Analytics configuration is no longer environment-driven. The Plausible domain is a constant in `source/src/data/site.json`, the script ships in every production build, and `check:dist` asserts its presence. There is no enabling repository variable to forget.

## Account status

| System | Required target | Current status | What is needed from the owner |
| --- | --- | --- | --- |
| Google Search Console | Domain property `sc-domain:managestate.app` | **Authenticated and accessible** on 2026-08-21 with `siteOwner` permission. The 90-day performance window is recorded below; indexed/excluded totals are unavailable from the connected MCP. | Submit the Phase 1a sitemap after it is published, then record coverage totals when the interface or export provides them. |
| Plausible | Site `managestate.app` | **Authenticated query succeeded** on 2026-08-21. The 90-day timeseries and `app_store_click` conversion query returned empty results; no metrics or events have been collected. | Measurement begins with the Phase 1a deployment; verify the first page view and event after release. |
| App Store Connect | App `6751497970` / bundle `com.managestate.app` | **Nine public campaign links re-verified** on 2026-08-21. Each returned HTTP 200 and retained the app ID and provider token after redirect. | Retain future aggregate campaign results; no credential is stored in this repository. |

## Fresh Phase 0 re-confirmation — 2026-08-21

The following observations were collected from authenticated Search Console and Plausible MCPs,
public HTTP checks, and the public App Store campaign URLs. No credentials, raw exports, or account
screenshots were copied into the repository.

### Google Search Console

- Property: `sc-domain:managestate.app` (`siteOwner` permission).
- Performance window: `2026-05-23` through `2026-08-21`.
- Performance totals: 1 click, 14 impressions, CTR `0.0714` (7.14%), average position `14.4`.
- Advanced query result: `mindestate`, 0 clicks, 2 impressions, position `32`.
- Question-query filter: no matching rows; the committed sanitized file is `[]`.
- Homepage inspection: `PASS`, `Submitted and indexed`, last crawled `2026-08-05 21:09`, fetch
  `SUCCESSFUL`, robots `ALLOWED`, indexing `INDEXING_ALLOWED`, Google canonical
  `https://managestate.app/`, user canonical `null`.
- Indexed and excluded URL totals: `unavailable`; the connected MCP exposes URL inspection but not
  aggregate coverage totals.
- Sitemaps: none reported. Submission remains deferred until Phase 1a publishes `sitemap.xml`.

### Plausible

The authenticated query for site `managestate.app` succeeded for `2026-05-23` through `2026-08-21`.
The timeseries returned no results, and the `app_store_click` conversion query returned no results.
This records no collected metrics or events; it is not an estimate of traffic.

### Public site and campaign checks

The homepage returned HTTP 200 with `text/html; charset=utf-8`, title `ManageState`, and no
robots/googlebot meta tag, canonical, Open Graph, or JSON-LD. `robots.txt`, `sitemap.xml`, and
`sitemap-index.xml` each returned HTTP 404 from GitHub Pages.

All nine campaign URLs in the inventory below returned HTTP 200 and redirected to the US App Store
listing while retaining app ID `6751497970`, campaign parameter `ct`, and public provider token
`pt=128092033`. The campaign parameters are public attribution identifiers, not credentials.

## Search Console procedure

1. The domain property `managestate.app` (`sc-domain:managestate.app`) is owner-confirmed as created and DNS-verified. Keep account owner and DNS details in the private operational record, not in this repository.
2. Inspect the homepage and record indexing status, coverage issues, indexed URL count, and excluded URL count from the authenticated interface.
3. After Phase 1a deploys, submit `https://managestate.app/sitemap.xml`. After Phase 1b deploys, submit `https://managestate.app/sitemap-index.xml` **and remove the superseded `sitemap.xml` submission** so it does not accumulate fetch errors. Record a submission as successful only when the owner observes it.
4. Export the last available 90 days of **Pages** and **Queries** into `source/seo-ops/private/`. Keep the raw CSV files ignored and never commit them.
5. Filter query rows with this exact expression:

   ```text
   ^(who|what|where|when|why|how|which|can|do|does|is|are|should|will)\b
   ```

6. Store only aggregate records in `source/seo-ops/keywords/search-console-questions.json`, shaped as:

   ```text
   { query, clicks, impressions, position, sourceWindow }
   ```

   Populate every numeric field from the observed export. Do not add a record when a source value is
   unavailable. Remove all other dimensions and any sensitive values.
7. The authenticated 90-day query result contained no rows matching the question filter, so the committed question file remains `[]`. The observed performance totals and available date range are recorded in the 2026-08-21 baseline; do not assume future windows will be zero or backfilled.

## Plausible procedure

1. Confirm the site domain `managestate.app` still exists in the owner-controlled Plausible account.
2. The privacy-conscious Plausible script is added during Phase 1a Task 5, **after or with** the privacy-policy disclosure, never before it. Confirm a page view arrives without collecting personally identifiable information or customer property data.
3. Configure the outbound event `app_store_click` with page path, content cluster, CTA placement, language, and campaign identifier. Verify one test event per CTA placement — `nav`, `hero`, `footer` on the homepage — and verify that blocking Plausible does not prevent App Store navigation.
4. Grant the operator read access or provide an aggregate export for each review window. Record observed page views, event counts, and referral dimensions in the relevant review; keep raw exports and tokens in `source/seo-ops/private/`.
5. There is no historical Plausible baseline to recover. Measurement begins when the Phase 1a script and events are deployed and verified.

## App Store Connect campaign inventory

The owner supplied these public campaign links. An anonymous check on 2026-08-05 followed each URL to
HTTP `200` for app ID `6751497970`. Provider token `128092033` is a **public attribution parameter**,
not a credential, and is hardcoded as a constant in `source/src/data/site.json`.

| Campaign | Verified public URL |
| --- | --- |
| `website-home` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-home&mt=8` |
| `website-features` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-features&mt=8` |
| `website-audiences` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-audiences&mt=8` |
| `website-comparisons` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-comparisons&mt=8` |
| `website-guides` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-guides&mt=8` |
| `website-tools` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=website-tools&mt=8` |
| `medium` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=medium&mt=8` |
| `substack` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=substack&mt=8` |
| `youtube` | `https://apps.apple.com/app/apple-store/id6751497970?pt=128092033&ct=youtube&mt=8` |

Phase 1a maps `website-home` to the three homepage CTAs. Phase 2 maps the five cluster campaigns to
their content clusters. Phase 3 uses the three channel campaigns. Future aggregate product-page views,
downloads, and attribution are exported privately and recorded only as approved aggregates.

**Attribution has no silent fallback.** `buildAppStoreUrl` throws on an unapproved campaign name
rather than emitting an unattributed link, so a broken campaign fails the build instead of quietly
severing the measurement chain.

## Evidence inventory handoff

Phase 0 re-imports public App Store review evidence and re-verifies the three code-verified product
claims at a pinned commit. Customer testimonials and screenshots remain empty until the owner supplies
provenance and approval. The owner-directed retention exception for the existing homepage social proof,
adoption framing, hero performance wording, and starting-price copy is documented in
[`evidence-register.md`](evidence-register.md) and is excluded from every validator-approved count.
Never fill an evidence count with a guess, and never publish a generated identity, adoption number, or
unsupported claim on a new surface.

## Access and privacy requirements

The owner provides private access through the normal account invitation or an approved secret and
deployment mechanism. Do not send passwords, API keys, private provider credentials, raw CSV exports,
customer property records, or account screenshots into Git, issue comments, prompts, or public
documentation. Apple campaign `pt` and `ct` query parameters are public attribution identifiers and may
be recorded as part of their public URLs. Replace inaccessible values with explicit `not configured`,
`blocked`, or `unavailable` wording, and preserve the date of the next planned observation.
