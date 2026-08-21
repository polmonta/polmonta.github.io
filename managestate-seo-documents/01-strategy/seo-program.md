# ManageState SEO Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Execute the approved ManageState SEO design through seven independently gated phases, from measurement baseline to controlled draft automation.

**Architecture:** Each phase has its own detailed plan and produces a deployable or operationally verifiable outcome. Phases run sequentially; later phases consume explicit artifacts and exit-gate evidence from earlier phases rather than relying on assumptions.

**Repository layout:**

| Path | Contents |
| --- | --- |
| `source/` | The only editable site application |
| `source/src/data/` | Site contract and validator-approved evidence |
| `source/scripts/seo/` | Dependency-free Node validators and operational scripts |
| `source/seo-ops/` | Versioned non-sensitive SEO operations data; `private/` is git-ignored |
| `source/tests/` | Vitest and `node:test` suites, including visual baselines |
| `managestate-seo-documents/` | Strategy, phase plans, operational records, release logs, reviews |
| Repository root | `CNAME`, `.nojekyll`, `.github/workflows/`, and nothing else that is published |

**Tech Stack:** Vite/React 19 (phase 1a), Astro + React islands (phase 1b onward), Node.js 22.13.0, Vitest, `node:test`, Tailwind CSS 3, Lighthouse CI, Playwright (visual gate only), Google Search Console, Plausible Analytics, App Store Connect, Medium, Substack, YouTube, Anthropic Messages API, GitHub Actions.

## Global Constraints

- Approved design: [`01-strategy/seo-growth-design.md`](../01-strategy/seo-growth-design.md). Every plan cites it as its source of truth.
- **The existing homepage visual design is frozen.** See design §6.1. The visual diff gate is a mandatory exit condition for phases 1a and 1b.
- English first; Spanish second; Catalan third.
- Primary audience: self-managing landlords with one to five properties.
- Primary conversion: Apple App Store download, app ID `6751497970`, provider token `128092033`.
- `managestate.app` owns canonical acquisition content; GitHub Pages is the host and its limits are design constraints.
- One page owns one primary query. `primaryQuery` uniqueness is release-blocking.
- No thin location pages, fabricated evidence on acquisition pages, invented statistics, duplicate external blasts, or autonomous publishing.
- The retained homepage social proof (design §15.3) never enters structured data, acquisition pages, external publications, or automation prompts.
- Every phase stops at its exit gate until failures and residual risks are recorded and resolved.

---

### Task 1: Complete Phase 0 — Baseline and evidence

**Plan:** [`phase-0-baseline-evidence.md`](../02-phase-plans/phase-0-baseline-evidence.md)

Phase 0 was implemented once and lost in the 2026-08-20 revert. Its external accounts survive; none of its committed artifacts do. It is re-executed from scratch.

- [ ] Establish the validated site and evidence data contract in `source/src/data/`.
- [ ] Import verifiable App Store evidence from Apple's public endpoints.
- [ ] Re-confirm Search Console, Plausible, and the nine App Store campaigns.
- [ ] Record the observed baseline, evidence provenance, and the A8 retention exception.
- [ ] Pass the Phase 0 exit gate before any site change.

### Task 2: Complete Phase 1a — Technical SEO baseline on the existing app

**Plan:** [`phase-1a-technical-seo-baseline.md`](../02-phase-plans/phase-1a-technical-seo-baseline.md)

No framework change. No rendered pixel changes beyond the §6.1 allowances.

- [ ] Capture and commit the homepage visual baselines and the diff gate.
- [ ] Add complete static `<head>` metadata, Open Graph, and structured data.
- [ ] Publish `robots.txt`, `sitemap.xml`, and the social image.
- [ ] Replace every App Store `href` with the attributed URL contract.
- [ ] Install Plausible and the `app_store_click` event.
- [ ] Bring images inside budget without changing rendered appearance.
- [ ] Collapse the two publish paths into one and gate deploys on verification.
- [ ] Pass the Phase 1a exit gate, including the visual diff.

### Task 3: Complete Phase 1b — Astro shell with the homepage mounted verbatim

**Plan:** [`phase-1b-astro-shell.md`](../02-phase-plans/phase-1b-astro-shell.md)

- [ ] Migrate the build to Astro static output with a test harness.
- [ ] Implement the canonical SEO model, base layout, and schema builders.
- [ ] Mount the existing React homepage components as islands without editing their JSX.
- [ ] Add `/privacy/`, `/contact/`, `404.html`, and the two redirect stubs.
- [ ] Replace the hand-written sitemap with generated output and add `check:dist`.
- [ ] Pass the Phase 1b exit gate, including the visual diff at ≤ 1.0 %.

### Task 4: Complete Phase 2 — English acquisition content

**Plan:** [`phase-2-english-content.md`](../02-phase-plans/phase-2-english-content.md)

- [ ] Build validated content collections and static route templates.
- [ ] Publish four feature, three audience, and one comparison page.
- [ ] Publish five informational guides that do not shadow their clusters.
- [ ] Publish the ROI calculator and the rental finance template.
- [ ] Enforce the fifteen-page inventory, primary-query uniqueness, and a three-batch launch.

### Task 5: Complete Phase 3 — External authority distribution

**Plan:** [`phase-3-external-distribution.md`](../02-phase-plans/phase-3-external-distribution.md)

- [ ] Establish a unique, retryable publication ledger.
- [ ] Add deep-link and public-URL verification.
- [ ] Prepare one original pilot each for Medium, Substack, and YouTube.
- [ ] Publish manually at one to two items per week.
- [ ] Measure the 30-day pilot and select the next queue.

### Task 6: Complete Phase 4 — Optimization and localization

**Plan:** [`phase-4-optimization-localization.md`](../02-phase-plans/phase-4-optimization-localization.md)

- [ ] Aggregate the first 90 days of English results.
- [ ] Evaluate the localization data floor before selecting anything.
- [ ] Apply isolated technical, snippet, content, or consolidation decisions.
- [ ] Select the homepage plus four acquisition winners deterministically.
- [ ] Publish human-reviewed Spanish, then independently reviewed Catalan localizations.
- [ ] Verify reciprocal canonicals, `hreflang`, sitemaps, and language analytics.

### Task 7: Complete Phase 5 — Controlled draft automation

**Plan:** [`phase-5-controlled-automation.md`](../02-phase-plans/phase-5-controlled-automation.md)

- [ ] Pass the explicit eight-publication automation eligibility gate.
- [ ] Implement a unique topic queue and retryable run state.
- [ ] Generate only evidence-bound, non-production drafts.
- [ ] Block unsafe or duplicate drafts deterministically.
- [ ] Open disabled-by-default weekly human-review pull requests.
- [ ] Observe four runs and keep all publishing and merging manual.

## Dependency map

```
Phase 0 ──> Phase 1a ──> Phase 1b ──> Phase 2 ──> Phase 3 ──> Phase 4
                                          │                      │
                                          └──────────> Phase 5 <─┘
                                                   (eligibility gated)
```

Phase 1a is the only phase that delivers measurable technical value without depending on the
framework migration. If Phase 1b is deferred for any reason, Phase 1a remains deployed and
correct on its own.

## Program Completion Check

Run the verification commands defined by every phase plan and preserve each phase's review,
baseline, release log, and residual-risk record. The program is complete when the multilingual
site and manual distribution system are operating measurably. Phase 5 automation is optional
and remains disabled unless its eligibility gate passes.
