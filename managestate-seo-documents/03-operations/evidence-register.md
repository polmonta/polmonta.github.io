# ManageState SEO evidence register

**Original verification date:** 2026-08-05
**Revision:** 2 — 2026-08-21
**Scope:** customer testimonials, product claims, screenshots, and the recorded retention exception
**Policy:** only evidence with a source, an applicable approval or consent record, and wording that matches shipping behaviour may be rendered on new surfaces. Empty collections are intentional when provenance is unavailable.

---

## Revision 2 notes

Revision 1 of this register described a different generation of the landing page in a different
repository (`ManageState/landing-page`, file `src/App.jsx`). That file no longer exists, the copy it
documented is no longer on the site, and the Phase 0 evidence JSON files it referenced were removed
by the 2026-08-20 revert. Revision 2 re-documents the **actual current homepage** in
`polmonta/polmonta.github.io` and re-scopes the retention exception to the copy that is genuinely
live.

Two contract changes:

1. **Product claims now require a commit SHA.** Revision 1 cited app-repository file paths and line
   ranges with no revision. Those files do not exist in this repository and the line ranges cannot be
   re-verified. Every claim record must carry `{ repo, commit, path, lines }`.
2. **Data file locations moved** from `landing-page/src/data/evidence/` to
   `source/src/data/evidence/`.

## Inventory decision

| Evidence category | Accepted records | Data file | Decision |
| --- | ---: | --- | --- |
| App Store reviews | 0 | `source/src/data/evidence/app-store-reviews.json` | The public Apple importer ran on 2026-08-21 and returned 0 verified reviews; `app-store-reviews.json` remains `[]`. The historical one-review count is not carried forward. |
| Customer testimonials | 0 | `source/src/data/evidence/customer-testimonials.json` | Empty: no owner-supplied source record or publication consent has been provided. |
| Product claims | 3, verified at pinned commit `d51f6a208e96ddad3ba39e80aca37dc167182f8d` | `source/src/data/evidence/product-claims.json` | Accepted only for behaviour directly verified in the shipping app; each record carries the repository, commit, path, and lines. |
| Screenshots | 0 | `source/src/data/evidence/screenshots.json` | Empty: no captured app version, provenance record, or approval date has been proven for any marketing image. |

## Accepted evidence

### Product claims

These three claims were re-verified against the ManageState application at commit
`d51f6a208e96ddad3ba39e80aca37dc167182f8d` on 2026-08-21. They describe behaviour, not customer
outcomes, adoption, security levels, tax results, or plan terms. Each record carries its exact
repository path and line range in `product-claims.json`.

| ID | Exact wording | Verification source | Status |
| --- | --- | --- | --- |
| `claim-monthly-financial-summary` | "ManageState calculates monthly income, expenses, and net income from property transactions." | `polmonta/ManageState` `src/services/propertyService.js:65-87` at `d51f6a208e96ddad3ba39e80aca37dc167182f8d` | `verified` |
| `claim-property-document-storage` | "ManageState can upload documents for a property and save their document metadata." | `polmonta/ManageState` `src/services/propertyService.js:225-298` at `d51f6a208e96ddad3ba39e80aca37dc167182f8d` | `verified` |
| `claim-xlsx-data-export` | "ManageState can export property, transaction, recurring-item, and monthly-summary data as an XLSX workbook." | `polmonta/ManageState` `src/services/exportService.js:31-43, 56-67, 169-231, 239-289, 292-393, 395-422` at `d51f6a208e96ddad3ba39e80aca37dc167182f8d` | `verified` |

A claim whose source cannot be re-verified at a specific commit is removed, not carried forward.

### Customer testimonials

None accepted. An accepted testimonial requires a stable ID, the exact approved quote, an approved
display name or initials, the source-record location, explicit publication-consent status, an
approval date, allowed languages, and `verified: true`. No such owner records exist, so
`customer-testimonials.json` remains `[]`.

### Screenshots

None accepted. `source/public/img/*` and `source/public/screens/*` exist, but repository history
records them only as landing-page assets. It provides no captured app version, provenance record, or
approval date, so `screenshots.json` remains `[]`.

Consequence for Phase 2: acquisition pages may not present these images as product evidence. Where a
page would benefit from a screenshot, use a worked example, a labelled table, or a numbered workflow
until the owner supplies provenance.

---

## Owner-directed retention exception

**Decision date:** 2026-08-21
**Decided by:** owner, after the risk was raised and restated
**Scope:** the current homepage only

The owner has decided that the existing homepage copy below remains rendered unchanged. This is a
content-retention decision, not validator approval. None of it appears in any evidence JSON file and
none of it is counted in any evidence total.

### Retained testimonial copy

Currently at `source/src/components/Testimonials.jsx:4-35`. Six identities with no source record and
no consent record:

| Display identity | Stated role | Exact retained quote |
| --- | --- | --- |
| Sarah Johnson | Property Investor | "This app has completely transformed how I manage my rental units. The financial tracking is a lifesaver." |
| Michael Chen | Host | "Simple, clean, and effective. Exactly what I was looking for to keep track of my Airbnb properties." |
| Victor Rocha | Landlord | "The best property management app on iOS. The interface is beautiful and intuitive." |
| Emma Williams | Real Estate Investor | "ManageState has saved me countless hours. Everything I need is right at my fingertips." |
| James Martinez | Owner | "Finally, a property management app that doesn't overwhelm you with features. It's perfect." |
| Jordi Abello | Property Manager | "The reporting features are incredible. Tax season has never been easier!" |

### Retained section and hero copy

| Location | Exact retained copy | Category |
| --- | --- | --- |
| `Testimonials.jsx:69` | "Loved by property owners." | unverified adoption framing |
| `Testimonials.jsx:72` | "Don't take our word for it. See why ManageState is trusted by investors around the world." | unverified adoption and geography |
| `Hero.jsx:53-56` | H1 rotating clause "that maximizes returns." | unverified performance claim |
| `Hero.jsx:112` | "Free to start" | unverified plan terms |
| `Hero.jsx:116` | "No credit card required" | unverified plan terms |

### Boundaries that still apply

1. None of the above is validator-approved evidence, and none of it is counted in any evidence total.
2. None of it may be emitted as `Review`, `aggregateRating`, or any other structured data. `validate-dist.mjs` asserts mechanically that no such markup exists anywhere in the build.
3. None of it may be reused on acquisition pages, in external publications, or in automation prompts. `validate-content.mjs` and `validate-generated-draft.mjs` both reject these strings.
4. The exception is scoped to the current homepage sections. It expires if those sections are rewritten for any other reason.

### Recorded residual risk

Residual risk, recorded and accepted: presenting invented consumer testimonials as genuine is
prohibited under the EU Unfair Commercial Practices Directive as amended by the Omnibus
Directive, which applies to a Spain-based operator, and inaccurate pricing or trial copy can
also conflict with App Store metadata expectations. Replacing the six quotes with the one
verified App Store review, keeping the section markup and styling untouched, would clear both
concerns at negligible cost and remains available at any time.

---

## Rejected or unverified claims

These were assessed on 2026-08-05 against the shipping app and remain unverified. They may not appear
on any new surface. Where they currently appear on the homepage they fall under the retention
exception above.

| Candidate wording or topic | Current location | Decision and reason |
| --- | --- | --- |
| "Get a clear, real-time view of your income and expenses" | `Features.jsx:7` | Rejected as written. Monthly totals are verified; "real-time" is not. |
| "Real-time dashboard" | `Features.jsx:9` | Rejected. Same reason. |
| "CSV Exports" | `Features.jsx:15` | **Corrected on 2026-08-21 to "XLSX Exports" with owner approval.** The verified export is an XLSX workbook; the one-word correction alters no layout. |
| "Smart categorization" | `Features.jsx:23` | Rejected. Upload and storage are verified; automated categorization is not. |
| "Store everything … in one secure place" | `Features.jsx:27` | Rejected. Security level is not proven by any available source. |
| "Tenant details", "Maintenance logs" | `Features.jsx:30` | Rejected. No verified claim covers tenant records or maintenance logs. |
| "Automatic calculations of net and gross profitability" / in-app ROI | historical `App.jsx` copy; no longer on the site | Rejected. Net income is calculated; ROI and gross yield are recorded as unimplemented. This is why design amendment A6 replaced `/features/profitability-roi/` with `/features/property-performance/`. |
| "Bank-grade encryption", "cloud backups", "total access control" | historical `App.jsx` copy; no longer on the site | Rejected. An Apple encryption declaration flag is not a security-level claim. |
| Plan and card terms beyond the retained hero badges | — | Rejected for any new surface. No approved source proves card requirements, trial terms, or advertising. |
| Supported-device marketing claim | — | Unverified. Config declares iOS and Android targets, but no approved App Store listing or release matrix was supplied. |

## Owner-input-needed evidence

1. Source records and publication consent for any customer testimonial, including approval date, allowed languages, and the exact quote and name or initials that may be published.
2. A provenance record for each marketing screenshot: public asset path, captured app version or build, capture date, approval date, and the claims the image visibly supports.
3. An authoritative current App Store listing or release record before adding plan or card terms, supported-device coverage, tax or export outcomes, or security language.

Future claim changes must be re-verified against a pinned app-repository commit and recorded in the
claim source object. The owner-approved "CSV Exports" → "XLSX Exports" correction is recorded above
and applied only to the existing homepage benefit text.

Until the owner supplies the remaining evidence above, new surfaces render only the re-verified
code-verified claims and the separately inventoried public App Store review records.
