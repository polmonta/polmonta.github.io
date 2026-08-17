# SEO measurement operations

This directory contains the versioned, non-sensitive inputs for the ManageState
acquisition measurement process. The baseline date is **2026-08-05**. Account
systems remain the source of truth; this repository records only observed public
checks and sanitized aggregate values.

## Directory map

- `keywords/search-console-questions.json` contains only aggregate question-query
  records with the shape `{ query, clicks, impressions, position, sourceWindow }`.
  It is `[]` until an authenticated Search Console export is available.
- `private/` is the boundary for account-dependent material. Its `.gitignore`
  ignores every file except the ignore file itself.
- `../../docs/seo/measurement-setup.md` describes the owner runbooks.
- `../../docs/seo/baselines/2026-08-05-baseline.md` records the current public
  checks, account states, evidence counts, and known gaps.

## Private-export boundary

Search Console CSV exports (Pages and Queries), Plausible exports, App Store
Connect exports, provider tokens, and screenshots containing account details
must stay under `private/` and must never be committed. Do not copy raw exports,
credentials, PII, customer property data, or account screenshots into tracked
files. Commit only the aggregate question records and the Markdown baseline
after removing private values.

The boundary is intentionally enforced by `private/.gitignore`:

```gitignore
*
!.gitignore
```

Before adding any operational file, verify the boundary with `git check-ignore`.
A private export should be reported as ignored; only the `.gitignore` itself is
allowed to remain visible to Git.

## Search Console question export

The owner must export the last available 90 days of Pages and Queries for the
`managestate.app` domain property. Keep the export in `private/`, then retain
only aggregate records whose query matches:

```text
^(who|what|where|when|why|how|which|can|do|does|is|are|should|will)\b
```

The committed file must contain no users, URLs containing customer data, raw
rows, credentials, or other dimensions. When no export is available, `[]` is
correct and the baseline must say that zero days are available in this checkout;
that is not an estimate of Search Console performance.

## Account status at baseline

No authenticated Google Search Console, Plausible, or App Store Connect access
was available for this baseline. Ownership, analytics configuration, campaign
creation, account metrics, and attributed downloads are therefore explicitly
blocked or pending owner access rather than inferred. See the measurement setup
runbook and baseline for the exact actions required to unblock them.

## Safe update checklist

1. Keep account exports and tokens in `private/`; never stage them.
2. Sanitize Search Console data to the approved aggregate question shape.
3. Record observed values only; write `unavailable` or `blocked` when an
   authenticated source was not accessible.
4. Run JSON parsing, baseline validation, whitespace, ignore-boundary, public
   URL, lint, and build checks before committing the exact intended files.
