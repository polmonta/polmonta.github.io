# SEO Phase 5: Controlled Draft Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision:** 2 — 2026-08-21
**Goal:** Automate evidence-bound draft preparation and pull-request creation while preserving human editorial approval and prohibiting direct site or platform publication.

**Architecture:** A repository-backed topic queue and append-only run records provide unique topic ownership and retryable state. A scheduled GitHub Action invokes the Anthropic SDK, validates generated drafts against evidence and duplication rules deterministically, and opens a pull request. Merging and all external publication remain human actions.

**Tech Stack:** Node.js 22.13.0, `@anthropic-ai/sdk`, Vitest 4.1.10, GitHub Actions, JSON, Markdown/MDX.

## Global Constraints

- This phase is ineligible until the Task 1 gate passes with recorded evidence.
- Automation may generate drafts and platform adaptations. It may **not** deploy the site, merge pull requests, drive a browser, or publish to Medium, Substack, YouTube, GitHub, social networks, or communities.
- Every generated draft stays `status: draft` and outside production routes until a human changes it.
- Topic IDs are unique; a failed run leaves the topic queued and eligible for retry.
- Only validator-approved evidence files and approved content briefs may enter a prompt. **The design §15.3 retained homepage copy is explicitly excluded from every prompt** — it is unverified content and must never become a generation input.
- No raw Search Console exports, private analytics, customer property data, credentials, or personally identifiable data may enter prompts or run artifacts.
- Generated statistics, testimonials, legal claims, tax advice, and unsupported competitor claims are release-blocking failures.
- One scheduled draft attempt per week is the initial maximum.
- `SEO_AUTOMATION_ENABLED` defaults to `false`; absence of the variable disables generation.

---

### Task 1: Implement and record the automation eligibility gate

**Files:**
- Create: `source/scripts/seo/check-automation-eligibility.mjs`
- Create: `source/tests/seo/automation-eligibility.test.mjs`
- Create: `managestate-seo-documents/05-reviews/automation-eligibility.md`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: the publication ledger, the Phase 3 review, content validation history, and the incident record.
- Produces: `{ eligible, checks }` and a non-zero CLI exit when automation must stay disabled.

- [ ] **Step 1: Write failing gate tests**

```js
import { expect, it } from 'vitest';
import { evaluateEligibility } from '../../scripts/seo/check-automation-eligibility.mjs';

it('rejects automation without repeated verified manual runs', () => {
  const result = evaluateEligibility({ published: 3, verified: 3, editorialPasses: 3, criticalIncidents: 0, qualifiedResults: 1 });
  expect(result.eligible).toBe(false);
});

it('accepts a clean repeated workflow', () => {
  const result = evaluateEligibility({ published: 8, verified: 8, editorialPasses: 8, criticalIncidents: 0, qualifiedResults: 2 });
  expect(result.eligible).toBe(true);
});
```

- [ ] **Step 2: Implement five mandatory checks**

Require at least eight completed manual publications; all eight public URLs verified; all eight
editorial reviews passed; zero unresolved critical factual or privacy incidents; and at least two
publications with a qualified referral visit or App Store click. These are safety and readiness
checks, not traffic promises.

- [ ] **Step 3: Generate the eligibility review from actual records**

Document each check, its evidence source, the observed value, pass or fail, the reviewer, and the
date. If any check fails, keep automation disabled and stop this plan after committing the review.

- [ ] **Step 4: Add and run the gate command**

```json
"check:automation-eligibility": "node scripts/seo/check-automation-eligibility.mjs"
```

Run: `cd source && npx vitest run tests/seo/automation-eligibility.test.mjs && npm run check:automation-eligibility`
Expected: PASS only when the real ledger meets all five conditions.

- [ ] **Step 5: Commit the gate**

```bash
git add source/scripts/seo/check-automation-eligibility.mjs source/tests/seo/automation-eligibility.test.mjs source/package.json managestate-seo-documents/05-reviews/automation-eligibility.md
git commit -m "feat(seo): gate content draft automation on evidence"
```

### Task 2: Create the unique topic queue and retryable run state

**Files:**
- Create: `source/seo-ops/automation/topics.json`
- Create: `source/seo-ops/automation/runs/.gitkeep`
- Create: `source/scripts/seo/automation-state.mjs`
- Create: `source/tests/seo/automation-state.test.mjs`

**Interfaces:**
- Consumes: topics `{ topicId, primaryQuery, intent, cluster, sourcePaths, evidenceIds, status, attempts }`.
- Produces: `claimNextTopic`, `completeRun`, `failRun`; states `queued|claimed|drafted|retired`.

- [ ] **Step 1: Write failing uniqueness and retry tests**

Assert that a duplicate `topicId` fails; `claimNextTopic` selects one queued topic by approved score
and order; `failRun` increments attempts but returns status to `queued`; `completeRun` sets
`drafted`; and no second claim succeeds while a claim is active.

Also assert that a `primaryQuery` already owned by a published page is rejected — the design §8.2
one-page-one-query rule applies to generated drafts too.

- [ ] **Step 2: Implement atomic state updates**

Write a temporary JSON file and rename atomically. Include `runId`, ISO timestamps, and factual
error codes. A stale claim older than 24 hours returns to `queued` only through an explicit
`recover-stale <runId>` command that records the recovery.

- [ ] **Step 3: Seed only approved topics**

Populate the initial queue from the validated Phase 3 topic queue. Every record must reference live
ManageState paths and validator-approved evidence IDs. Do not add a city or location multiplier.

- [ ] **Step 4: Run the state tests**

Run: `cd source && npx vitest run tests/seo/automation-state.test.mjs`
Expected: PASS, including simulated crash and retry behaviour.

- [ ] **Step 5: Commit the queue state**

```bash
git add source/seo-ops/automation/topics.json source/seo-ops/automation/runs/.gitkeep source/scripts/seo/automation-state.mjs source/tests/seo/automation-state.test.mjs
git commit -m "feat(seo): add a retryable unique topic queue"
```

### Task 3: Implement an evidence-bound draft generator

**Files:**
- Create: `source/scripts/seo/anthropic-client.mjs`
- Create: `source/scripts/seo/build-draft-prompt.mjs`
- Create: `source/scripts/seo/generate-draft.mjs`
- Create: `source/tests/seo/draft-generator.test.mjs`
- Create: `source/tests/fixtures/anthropic-draft-response.json`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: a claimed topic, approved brief and source-page excerpts, validator-approved evidence records, `ANTHROPIC_API_KEY`, and `SEO_CLAUDE_MODEL`.
- Produces: one structured draft plus run metadata, via `generateDraft({ model, prompt, client })`.

- [ ] **Step 1: Install the official SDK**

```bash
cd source && npm install -D @anthropic-ai/sdk@latest
```

Use the official SDK, not raw `fetch`. It supplies typed errors, automatic retries for 429 and 5xx,
and streaming helpers that hand-rolled HTTP would have to reimplement.

- [ ] **Step 2: Write failing prompt-boundary tests**

Assert that a prompt contains the topic ID, primary query, intent, allowed evidence IDs, the exact
evidence text, the required section contract, and the explicit prohibitions. Assert that a prompt
contains **nothing** from `seo-ops/private/`, no raw analytics, no evidence record the topic does not
reference, and none of the retained homepage strings listed in the evidence register.

- [ ] **Step 3: Write a mocked SDK test**

Inject a fake client so no network call occurs. Assert the request uses the configured model,
requests structured output, and that the code handles a rate-limit error, a connection error, a
timeout, a malformed response, an empty content array, and `stop_reason: 'refusal'` as **retryable
failures that leave the topic queued**.

Catch errors most-specific-first — `NotFoundError`, then `RateLimitError`, then `APIStatusError`,
then `APIConnectionError` — so a 404 model-name typo is never retried as though it were throttling.

- [ ] **Step 4: Implement the prompt builder with structured output**

Do not ask the model to author frontmatter as text and then parse it. Request a structured object
and render the Markdown deterministically in our own code:

```js
const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'h1', 'openingAnswer', 'summary', 'sections', 'faqs', 'evidenceIdsUsed'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    h1: { type: 'string' },
    openingAnswer: { type: 'string' },
    summary: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
    sections: {
      type: 'array', minItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: ['heading', 'body'],
        properties: { heading: { type: 'string' }, body: { type: 'string' } }
      }
    },
    faqs: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['question', 'answer', 'sourceRecord'],
        properties: { question: { type: 'string' }, answer: { type: 'string' }, sourceRecord: { type: 'string' } }
      }
    },
    evidenceIdsUsed: { type: 'array', items: { type: 'string' } }
  }
};
```

The prompt states that the model must omit a claim rather than infer it, must not invent statistics,
testimonials, competitor facts, tax or legal advice, must use only the supplied evidence IDs, and
must return a FAQ only when a `sourceRecord` is supplied for it.

- [ ] **Step 5: Implement the client and generator**

```js
// source/scripts/seo/anthropic-client.mjs
import Anthropic from '@anthropic-ai/sdk';

export function createClient() {
  return new Anthropic({ timeout: 120_000, maxRetries: 2 }); // TypeScript SDK timeouts are milliseconds
}

export async function generateDraft({ client, model, system, prompt, schema }) {
  const stream = client.messages.stream({
    model,
    max_tokens: 16_000,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema } },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [{ role: 'user', content: prompt }]
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') {
    throw new RetryableGenerationError('refusal', message.stop_details);
  }
  return message;
}
```

Notes that keep this current rather than dated:

- Default `SEO_CLAUDE_MODEL` to `claude-opus-5`. Use the exact model ID with no date suffix.
- Use adaptive thinking. `budget_tokens` is rejected on this model family.
- Stream and use `finalMessage()` — a long draft at a high `max_tokens` risks an HTTP timeout otherwise.
- Server-side fallbacks are enabled so a safety refusal routes to a fallback model instead of failing the run outright; a refusal that still comes back is treated as retryable.
- Assistant prefill is not available on this model family; the structured output schema is what constrains the shape.
- Never log the API key or the full prompt.

`generate-draft.mjs` fails closed when `SEO_AUTOMATION_ENABLED !== 'true'`, when eligibility fails,
when the model or key is absent, or when no topic is queued. It writes output to
`source/seo-ops/generated/<runId>/<topicId>.md`, never into a production content collection.

- [ ] **Step 6: Run the mocked tests and commit**

Run: `cd source && npx vitest run tests/seo/draft-generator.test.mjs`
Expected: PASS with no real API call.

```bash
git add source/scripts/seo/anthropic-client.mjs source/scripts/seo/build-draft-prompt.mjs source/scripts/seo/generate-draft.mjs source/tests/seo/draft-generator.test.mjs source/tests/fixtures/anthropic-draft-response.json source/package.json source/package-lock.json
git commit -m "feat(seo): generate evidence-bound content drafts"
```

### Task 4: Add release-blocking generated-draft quality checks

**Files:**
- Create: `source/scripts/seo/validate-generated-draft.mjs`
- Create: `source/tests/seo/generated-draft-quality.test.mjs`
- Modify: `source/scripts/seo/generate-draft.mjs`

**Interfaces:**
- Consumes: the generated draft, approved evidence, the existing English content corpus, and the topic record.
- Produces: `{ valid, errors }`. Only a valid draft may enter a pull request.

- [ ] **Step 1: Write failing quality fixtures**

Cover: a fabricated percentage or statistic; an unknown testimonial; an unsupported `bank-grade` or
`guaranteed`; city-swapped thin copy; a missing opening answer; a summary outside 3–5 sentences; an
invalid internal link; a duplicate primary query; body similarity above 35 % on 3-word shingles; a
missing evidence citation; a FAQ without a `sourceRecord`; any of the retained homepage strings; and
`status: published`.

- [ ] **Step 2: Implement deterministic checks**

Validate frontmatter identity, allowed claims and evidence IDs, prohibited absolutes, numeric claims
against exact evidence text, internal links against the built route inventory, body shingle
similarity, the section contract, primary-query uniqueness, and `status: draft`.

**Do not use another model to approve the first model's output.** Every check is deterministic code.

- [ ] **Step 3: Integrate fail and retry behaviour**

A quality failure writes a compact run record with error codes, deletes no previous artifact, and
returns the topic to `queued`. It never marks the topic used and never opens a pull request.

- [ ] **Step 4: Run quality tests**

Run: `cd source && npx vitest run tests/seo/generated-draft-quality.test.mjs`
Expected: every unsafe fixture fails for its expected reason and the clean fixture passes.

- [ ] **Step 5: Commit the quality gates**

```bash
git add source/scripts/seo/validate-generated-draft.mjs source/scripts/seo/generate-draft.mjs source/tests/seo/generated-draft-quality.test.mjs source/tests/fixtures
git commit -m "test(seo): block unsafe generated drafts"
```

### Task 5: Open a human-review pull request on a weekly schedule

**Files:**
- Create: `.github/workflows/seo-draft.yml`
- Create: `source/scripts/seo/prepare-draft-pr.mjs`
- Create: `managestate-seo-documents/05-reviews/automation-runbook.md`
- Modify: `source/package.json`

**Interfaces:**
- Consumes: repository variables `SEO_AUTOMATION_ENABLED`, `SEO_CLAUDE_MODEL`; secret `ANTHROPIC_API_KEY`; the eligible queue.
- Produces: one branch and pull request containing a draft artifact, a state transition, a validation report, and a reviewer checklist.

- [ ] **Step 1: Implement dry-run PR preparation**

`prepare-draft-pr.mjs` runs eligibility, claims one topic, generates and validates one draft, writes
a run JSON record, marks the topic `drafted`, and prints a PR title and body. `--dry-run` must make
no API call and no state change.

- [ ] **Step 2: Add the disabled-by-default workflow**

Configure `workflow_dispatch` plus a weekly cron, `concurrency: seo-draft-generator`,
`contents: write`, and `pull-requests: write`. Check out `main`, use Node `22.13.0`, run `npm ci` in
`source`, assert the repository variable equals `true`, run eligibility and the test suite, generate
one draft, create branch `automation/seo-draft-${GITHUB_RUN_ID}`, commit the exact generated, state
and run files, push, and call `gh pr create` with `GITHUB_TOKEN`.

This workflow must never touch the deploy workflow, and it must never run `check:visual` or publish.

- [ ] **Step 3: Add the PR review checklist**

A human verifies query intent, factual claims, evidence IDs, duplicated passages, links, screenshots
and examples, legal and tax language, metadata, and conversion relevance. Approval does not publish
the draft: a separate human change converts it into the appropriate content collection and reruns
the normal Phase 2 gates.

- [ ] **Step 4: Document kill and recovery procedures**

The runbook shows how to set `SEO_AUTOMATION_ENABLED=false`, rotate the API key, recover a stale
claim, retry a failed topic, close or reject a PR, and inspect run records without exposing prompts
or secrets.

- [ ] **Step 5: Test locally and commit**

```bash
cd source
node scripts/seo/prepare-draft-pr.mjs --dry-run
npm test
npm run check:automation-eligibility
```

Expected: the dry run identifies the next eligible topic but changes no files; tests and gate PASS.

```bash
git add .github/workflows/seo-draft.yml source/scripts/seo/prepare-draft-pr.mjs source/package.json managestate-seo-documents/05-reviews/automation-runbook.md
git commit -m "ci(seo): open weekly human-reviewed draft PRs"
```

### Task 6: Observe four runs and decide whether to continue

**Files:**
- Create: `managestate-seo-documents/05-reviews/automation-four-run-review.md`
- Modify: `managestate-seo-documents/05-reviews/automation-runbook.md`
- Modify: `source/seo-ops/automation/topics.json`

**Interfaces:**
- Consumes: four scheduled or manual workflow run records and reviewer outcomes.
- Produces: an explicit `continue`, `revise`, or `disable` decision. Direct publishing stays prohibited in all outcomes.

- [ ] **Step 1: Keep the weekly cap for four runs**

Do not increase frequency during observation. Record generation success, validation errors, retries,
review corrections, time saved, accepted or rejected status, and any factual or privacy incident.

- [ ] **Step 2: Review correction patterns**

Group corrections by prompt defect, missing evidence, intent mismatch, duplication, tone, links, and
factual accuracy. Fix deterministic validators before changing the prompt whenever possible.

- [ ] **Step 3: Apply the safety decision**

- `continue` — all accepted drafts passed evidence and privacy checks, and reviewer effort decreased.
- `revise` — no critical incident, but repeated correctable validation or editorial defects remain.
- `disable` — any sensitive-data leak, fabricated evidence reaching review, repeated duplicate content, or unresolved state corruption occurred.

- [ ] **Step 4: Keep external publishing manual**

Even a `continue` decision does not authorize platform APIs or browser automation. That requires a
new design amendment and separate approval.

- [ ] **Step 5: Commit the review and configuration decision**

```bash
git add managestate-seo-documents/05-reviews/automation-four-run-review.md managestate-seo-documents/05-reviews/automation-runbook.md source/seo-ops/automation/topics.json
git commit -m "docs(seo): review controlled draft automation"
```

## Phase 5 Exit Gate

The phase is complete only after eligibility evidence, queue uniqueness, retry behaviour, mocked SDK
tests, deterministic quality gates, the disabled-by-default workflow, human PR review, and four-run
observation are all documented. Completion does not grant permission for autonomous publishing or
merging.
