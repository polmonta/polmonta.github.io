# SEO measurement operations

`source/seo-ops/` contains versioned, non-sensitive inputs for ManageState acquisition measurement.
The account systems remain the source of truth; this directory stores only sanitized aggregates and
observation records.

## Directory policy

- `keywords/` contains aggregate Search Console question-query records only.
- `private/` is the boundary for raw account exports and account-dependent material.
- Future phase directories may contain approved metrics, localization, external distribution, and
  automation records as defined by the operations runbook.

Search Console Pages and Queries CSVs, Plausible exports, App Store Connect exports, provider
credentials, and any screenshot containing account details must stay under `private/` and must never
be committed. Raw exports, personally identifiable information, customer property data, and account
screenshots do not belong in tracked files. Commit only sanitized aggregates and dated Markdown
observations.

The Apple campaign parameters `pt=128092033` and `ct=<campaign>` are public attribution identifiers,
not credentials. They may appear in tracked campaign URLs and in the site contract.

## Search Console question records

`keywords/search-console-questions.json` contains only records shaped as:

```json
{"query":"...","clicks":0,"impressions":0,"position":0,"sourceWindow":"YYYY-MM-DD/YYYY-MM-DD"}
```

Question queries are filtered with:

```text
^(who|what|where|when|why|how|which|can|do|does|is|are|should|will)\b
```

When no authenticated export provides matching rows, `[]` is correct. Do not estimate missing values
or copy raw Search Console dimensions into the committed file.

## Safe update checklist

1. Keep exports, credentials, and account screenshots in `private/`.
2. Sanitize exports to the approved aggregate shape before committing.
3. Record `unavailable`, `blocked`, or `not configured` when an authenticated value cannot be read;
   never replace it with a guess.
4. Run `git check-ignore -v source/seo-ops/private/example.csv` before staging operational files.
5. Run `git diff --check -- source/seo-ops managestate-seo-documents/03-operations` before committing.
6. Name every file explicitly in `git add`; do not stage unrelated working files.
