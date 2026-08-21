# ManageState SEO document pack

**Revision:** 2 — 2026-08-21
**Repository:** `polmonta/polmonta.github.io` · **Site:** https://managestate.app

The SEO strategy, phase plans, and operational records for `managestate.app`. Revision 2 rewrites the
pack so it can be implemented from scratch **in this repository**, and records the design amendments
agreed on 2026-08-21.

## What changed in revision 2

Revision 1 was written for a different repository (`ManageState/landing-page`) and an older, dark-themed
generation of the landing page. It was implemented here on 2026-08-17 and fully reverted on 2026-08-20
because the Astro migration did not preserve the existing visual design.

| Change | Detail |
| --- | --- |
| Correct paths throughout | The site application is `source/`, not `landing-page/`. Operational records live in this pack, not in `docs/superpowers/` or `docs/seo/`. |
| **The visual design is frozen** | The current homepage is the approved design. Preservation is enforced by a committed screenshot baseline and a release-blocking pixel diff, not by reviewer judgement. |
| Phase 1 split into 1a and 1b | 1a ships all technical SEO on the existing Vite app with no framework change. 1b introduces Astro and mounts the existing React homepage verbatim as islands. |
| GitHub Pages treated as a real constraint | No server redirects and no custom headers. Replaced URLs use `noindex` HTML redirect stubs. `CNAME` and `.nojekyll` are asserted in the build. |
| One page, one query | The full fifteen-page inventory is retained, but every route now owns a distinct primary query, enforced at build time. Five guide slugs were renamed so they no longer duplicate a commercial page's query. |
| `/features/profitability-roi/` rescoped | Becomes `/features/property-performance/`, because in-app ROI is recorded as unimplemented. The ROI *calculator tool* is unaffected. |
| No silent measurement failure | The App Store URL and the Plausible domain are build-time constants. An unapproved campaign fails the build instead of emitting an unattributed link. |
| Retained homepage proof, bounded | Existing social proof and starting-price copy stays by owner decision, with explicit boundaries and a recorded residual risk. |
| Localization needs data, not just time | A minimum-data floor gates Phase 4 so the deterministic selector is never run on data too sparse to be meaningful. |
| Image and performance budgets | Explicit limits and an enforcement script, because the homepage currently ships a 1.03 MB PNG under a 2,500 ms LCP gate. |

Full amendment list: [`01-strategy/seo-growth-design.md`](01-strategy/seo-growth-design.md) §0.

## Pack structure

```
01-strategy/     approved design and the program roadmap
02-phase-plans/  seven executable phase plans
03-operations/   owner runbooks, the baseline, the evidence register
04-releases/     launch logs and the content inventory (written during execution)
05-reviews/      review, experiment, and decision records (written during execution)
```

### 01 — Strategy

- [**SEO growth design**](01-strategy/seo-growth-design.md) — the approved strategy and the single source of truth every plan cites: audiences, English-first rollout, route model, visual preservation contract, host constraints, technical requirements, the fifteen-page inventory with primary queries, conversion and measurement contracts, release gates, risks, and approval decisions.
- [**SEO program**](01-strategy/seo-program.md) — the seven-phase roadmap, repository layout, dependency map, and global constraints.

### 02 — Phase plans

| Phase | Plan | Outcome |
| --- | --- | --- |
| 0 | [Baseline and evidence](02-phase-plans/phase-0-baseline-evidence.md) | Site and evidence data contract, validators, private-export boundary, recorded baseline. Re-executed from scratch. |
| 1a | [Technical SEO baseline](02-phase-plans/phase-1a-technical-seo-baseline.md) | Metadata, structured data, crawl assets, attributed App Store URLs, analytics, image budgets, one publish path. **No framework change, no visual change.** |
| 1b | [Astro shell](02-phase-plans/phase-1b-astro-shell.md) | Astro static output with the existing homepage mounted verbatim as islands, plus `/privacy/`, `/contact/`, `404.html`, and redirect stubs. |
| 2 | [English content](02-phase-plans/phase-2-english-content.md) | Fifteen acquisition pages, one primary query each, in three batches. |
| 3 | [External distribution](02-phase-plans/phase-3-external-distribution.md) | Ledger-controlled Medium, Substack, and YouTube pilots at one to two per week. |
| 4 | [Optimization and localization](02-phase-plans/phase-4-optimization-localization.md) | 90-day review, evidence-based English changes, then Spanish and Catalan once the data floor is met. |
| 5 | [Controlled automation](02-phase-plans/phase-5-controlled-automation.md) | Evidence-gated, draft-only, human-reviewed pull requests. Optional and disabled by default. |

### 03 — Operations

- [**Measurement setup**](03-operations/measurement-setup.md) — owner runbooks and status for Search Console, Plausible, and App Store campaign attribution.
- [**Baseline**](03-operations/baseline-2026-08-05.md) — public technical observations, account status, campaign inventory, evidence counts, the revert record, and known gaps.
- [**Evidence register**](03-operations/evidence-register.md) — provenance and publication rules, the exact retained homepage strings, and the recorded residual risk.
- [**Operations runbook**](03-operations/seo-operations-runbook.md) — the privacy boundary, directory map, and reporting rules.

## Current status

| Item | State |
| --- | --- |
| External accounts | Search Console property and Plausible site owner-confirmed; nine App Store campaign links verified. |
| Committed artifacts | **None.** Every Phase 0 artifact was removed by the 2026-08-20 revert. |
| Analytics | Never deployed. No historical data exists to recover. |
| Crawl assets | `robots.txt` and a sitemap do not exist; both currently return 404 in production. |
| Site conversion links | Three App Store links exist but are locale-locked and unattributed. |
| Publish paths | Two exist and must be collapsed to one. |
| Next step | **Phase 0**, then **Phase 1a**. Phase 0's external account work is re-confirmation; its committed artifacts are new. |

## Reading order for an implementer

1. [`01-strategy/seo-growth-design.md`](01-strategy/seo-growth-design.md) — §0 amendments, §6.1 visual contract, §8.3 inventory, §10.1 URL contract.
2. [`01-strategy/seo-program.md`](01-strategy/seo-program.md) — repository layout and phase order.
3. [`03-operations/evidence-register.md`](03-operations/evidence-register.md) — what may and may not be claimed.
4. The phase plan you are executing, in order. Do not start a phase before the previous exit gate passes.

## Non-negotiables

- The existing homepage visual design does not change. `npm run check:visual` is a mandatory exit condition for phases 1a and 1b, and a failure means the change is wrong, never that the tolerance is too tight.
- No fabricated evidence on any new surface. The homepage retention exception is bounded, dated, and never extends to acquisition pages, structured data, external publications, or automation prompts.
- One page owns one primary query.
- Nothing publishes autonomously.
- Every committed number is traceable to an observation, an export, or a validator output.
