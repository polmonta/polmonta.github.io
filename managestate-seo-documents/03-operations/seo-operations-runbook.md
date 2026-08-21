# SEO measurement operations runbook

**Revision:** 2 — 2026-08-21
**Applies to:** `source/seo-ops/`

`source/seo-ops/` holds the versioned, non-sensitive inputs for the ManageState acquisition
measurement process. Account systems remain the source of truth; this repository records only observed
public checks and sanitized aggregate values.

This directory and its private boundary were removed by the 2026-08-20 revert and are re-created by
Phase 0 Task 3. Verify the boundary before adding any operational file.

## Directory map

| Path | Contents |
| --- | --- |
| `source/seo-ops/keywords/search-console-questions.json` | Aggregate question-query records shaped `{ query, clicks, impressions, position, sourceWindow }`. `[]` until an authenticated Search Console export exists. |
| `source/seo-ops/private/` | The boundary for account-dependent material. Its `.gitignore` ignores every file except itself. |
| `source/seo-ops/metrics/` | Committed path-level aggregates for review windows (Phase 4). |
| `source/seo-ops/localization/` | The translation set and localization manifests (Phase 4). |
| `source/seo-ops/external/` | Platform content packs and the external topic queue (Phase 3). |
| `source/seo-ops/publications.json` | The external publication ledger (Phase 3). |
| `source/seo-ops/automation/` | The topic queue and run records (Phase 5). |
| `source/seo-ops/generated/` | Non-production generated drafts (Phase 5). Never a content collection. |
| `managestate-seo-documents/03-operations/` | Owner runbooks, the baseline, and the evidence register. |
| `managestate-seo-documents/04-releases/` | Release and launch logs, and the content inventory. |
| `managestate-seo-documents/05-reviews/` | Review records, experiments, and decision documents. |

## Private-export boundary

Search Console CSV exports (Pages and Queries), Plausible exports, App Store Connect exports, provider
credentials, and any screenshot containing account details must stay under `private/` and must never be
committed. Do not copy raw exports, credentials, personally identifiable information, customer property
data, or account screenshots into tracked files. Commit only sanitized aggregates and the Markdown
records.

The boundary is enforced by `source/seo-ops/private/.gitignore`:

```gitignore
*
!.gitignore
```

Before adding any operational file, verify the boundary:

```bash
git check-ignore -v source/seo-ops/private/example.csv
```

A private export must report as ignored. Only the `.gitignore` itself stays visible to Git.

**What is not a credential:** the Apple campaign parameters `pt=128092033` and `ct=<campaign>` are
public attribution identifiers that appear in public App Store URLs. They belong in tracked files and
in `site.json`. Treating them as secrets is what caused revision 1's measurement chain to fail
silently.

## Search Console question export

Export the last available 90 days of Pages and Queries for the `managestate.app` domain property. Keep
the export in `private/`, then retain only aggregate records whose query matches:

```text
^(who|what|where|when|why|how|which|can|do|does|is|are|should|will)\b
```

The committed file must contain no users, no URLs containing customer data, no raw rows, no credentials,
and no other dimensions. When no export is available, `[]` is correct, and the baseline must state that
zero days are available in this checkout — that is not an estimate of Search Console performance.

## Safe update checklist

1. Keep account exports and tokens in `private/`; never stage them.
2. Sanitize Search Console data to the approved aggregate question shape.
3. Record observed values only. Write `unavailable` or `blocked` when an authenticated source could not be reached, and record the date of the next planned observation.
4. Run the full verification before committing: `cd source && npm run verify`.
5. Run `git check-ignore` and `git diff --check` on the operational paths before staging.
6. Name exact files in every `git add`. The repository contains untracked working material that must never be staged accidentally.

## Reporting rules

- A number in a committed document must be traceable to an observation, an export, or a validator output.
- Zero is a valid observed value; `unavailable` is a valid unobserved value. A blank cell is neither, and is not acceptable.
- Never restate a value from an earlier window as current. Append a new dated section instead.
- Never describe the retained homepage social proof as evidence. It is a recorded content-retention exception with a documented residual risk.
