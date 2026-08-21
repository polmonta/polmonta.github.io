# Reviews

Review, experiment, and decision records. These files are written **during** execution, not in advance.

## Expected contents

| File | Written by | Contents |
| --- | --- | --- |
| `phase-3-30-day-review.md` | Phase 3 Task 5 | Per publication: public and indexed status, referral visits, engaged visits, App Store clicks, attributed views and downloads where available, qualitative discovery, and the next four-week queue decision. |
| `english-90-day-review.md` | Phase 4 Task 1 | The data-floor result, per-page classification (`expand`, `snippet-test`, `maintain`, `consolidation-review`, `technical-fix`), and the rationale for each. |
| `english-snippet-tests.md` | Phase 4 Task 2 | Per test: old and new title and description, observed query pattern, change date, evaluation date at least 28 days later, and the outcome. |
| `localization-readiness.md` | Phase 4 Task 3 | Whether the app UI and App Store listing are localized, the homepage localization approach decision, and the recorded conversion risk. |
| `spanish-review.md` / `catalan-review.md` | Phase 4 Tasks 5 and 6 | Reviewer, date, source revision, terminology decisions, and corrections. Catalan approval may never reuse the Spanish reviewer's approval. |
| `automation-eligibility.md` | Phase 5 Task 1 | Each of the five checks with its evidence source, observed value, pass or fail, reviewer, and date. |
| `automation-runbook.md` | Phase 5 Task 5 | How to disable automation, rotate the API key, recover a stale claim, retry a failed topic, reject a PR, and inspect run records without exposing prompts or secrets. |
| `automation-four-run-review.md` | Phase 5 Task 6 | Per run: generation success, validation errors, retries, review corrections, accepted or rejected status, incidents, and the `continue` / `revise` / `disable` decision. |

## Rules

- A decision record names the decider and the date.
- An experiment record fixes its evaluation date before the result is known.
- One variable per experiment. A snippet test changes the title and description only; it does not also rewrite the body.
- A deferral is a valid, successful outcome. Record it and schedule the re-check rather than proceeding on insufficient data.
- Pages with a conversion signal are never consolidated solely for low impressions.
