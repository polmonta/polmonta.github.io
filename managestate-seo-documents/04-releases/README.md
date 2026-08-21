# Releases

Launch logs and the content inventory. These files are written **during** execution, not in advance.

## Expected contents

| File | Written by | Contents |
| --- | --- | --- |
| `phase-1a-launch-log.md` | Phase 1a Task 8 | Deployment date and run URL, before/after image weights, measured LCP/CLS/TBT, visual diff result per viewport, sitemap submission date, URL Inspection result, analytics verification, residual risks. |
| `phase-1b-launch-log.md` | Phase 1b Task 6 | Deployment date and run URL, visual diff result, hydration directive per component, Lighthouse numbers, every route verified in production, sitemap resubmission, URL Inspection results, residual risks. |
| `content-inventory.md` | Phase 2 Task 5 | For each of the fifteen routes: owner, primary query, query type, cluster, intent, evidence sources, status, publication batch, review date. |
| `phase-2-launch-log.md` | Phase 2 Task 5 | Per batch: deployment date, HTTP status, canonical, sitemap presence, internal links, `app_store_click` verification, index-request date. |
| `phase-3-publication-log.md` | Phase 3 Task 4 | Per external publication: platform, topic, public URL, publication date, verification result, cadence compliance. |
| `phase-4-localization-launch.md` | Phase 4 Task 7 | Spanish and Catalan deployment dates, route verification, `hreflang` reciprocity, submission and indexing dates, language-segment reporting setup. |

## Rules

- Record observed values only. Zero is valid; `unavailable` is valid; blank is not.
- State plainly what was **not** done, and why.
- Never record a ranking, traffic figure, or download count that has not been observed in Search Console, Plausible, or App Store Connect.
- Never restate an earlier window's value as current — append a new dated section.
