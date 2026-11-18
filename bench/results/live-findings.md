# Injected-Trace Audit: Guardrail Stress-Test Findings

> [!IMPORTANT]
> **Test Scope & Provenance Disclosure**:
> This report evaluates how the factory's Response Registry and State Guard handle **injected failure scenarios**. The traces replayed below are synthetic test cases specifically constructed to verify that invalid AI behaviors (jargon leakage, multi-barreled questioning, scope creep accommodation, paraphrased quotes, and unauthorized approvals) are intercepted and rejected at the system boundary before display or persistence.
> **These are NOT observed outputs from a live model.** Actual live agent evaluation requires active agent CLI authentication and will be executed separately once session auth is available.

## 1. Five Injected Failure Scenarios Tested Against Guardrails

1. **Injected Technical Jargon in Non-Technical Context**
   - *Injected Scenario*: In the Non-Technical Founder persona, the test trace injected: *"an SQLite local database schema with an asynchronous persistence layer and CRUD operations"*.
   - *Guardrail Response*: Caught by the jargon detector (exact word-boundary match on `\bSQLite\b` and `\bCRUD\b`) and flagged for conversation-quality deduction.
   - *Implicated Contract*: `skill/SKILL.md` §6 and `references/02-discovery.md` §5 ("Speak the user's language; avoid architectural jargon before requirements are established").

2. **Injected Question Density & Multi-Barreled Interrogation**
   - *Injected Scenario*: In the Vague Visionary persona, the test trace injected a 3-question bundle into Turn 1 (feed scope, roast variables, photo filters).
   - *Guardrail Response*: Flagged by `factory-v1/response-registry.mjs` against the 1–2 question limit.
   - *Implicated Contract*: `QUESTION` response envelope schema.

3. **Injected Scope Creep Accommodation**
   - *Injected Scenario*: In the Feature Creeper persona, the client requested live GPS tracking, in-app crypto tipping, video streaming, and background checks.
   - *Guardrail Response*: Tested whether the agent stops and gates scope via `product.excluded` or allows runaway expansion.
   - *Implicated Rule*: `skill/SKILL.md` §6 (`product.excluded` recording).

4. **Injected Design Pivot (Residual State Invalidation)**
   - *Injected Scenario*: In the Changing-Mind Client persona, the client pivoted mid-interview from dark minimal to bright luxury editorial.
   - *Guardrail Response*: Tested whether `planner.mjs` invalidation cleanly purges subordinate design tokens without leaving contradictory residue.
   - *Implicated Engine*: `factory-v1/planner.mjs` invalidation rules.

5. **Injected Paraphrased / Manufactured Quote**
   - *Injected Scenario*: Injected a `CONFIRM` envelope containing a paraphrased quote not present in the user transcript.
   - *Guardrail Response*: `factory-v1/state-guard.mjs` `verifyQuoteProvenance()` rejected the quote with exact substring checking, preventing state mutation.
   - *Implicated Guard*: `factory-v1/state-guard.mjs`.

---

## 2. Does the Response Registry Improve Behavior or Merely Reject Bad Output?

**Dual Value Demonstrated**:
1. **At the Boundary**: The Response Registry acts as a strict firewall. When an injected response attempts to ask 3 questions or proposes a design without authentic user aesthetic evidence, the response envelope is rejected before client display or persistence.
2. **Structural Guiding**: By enforcing discriminated schemas (`QUESTION`, `CONFIRM`, `CONFLICT`, `DESIGN`, `PROGRESS`, `APPROVAL`), the agent's internal reasoning is anchored to concrete state transitions rather than free-form conversational drift.
3. **Internal vs External Separation**: Crucially, keeping the JSON envelope internal while displaying the natural language `message` provides the business client with calm, human conversation without leaking JSON syntax.

---

## 3. Surgical Instruction & Harness Enhancements Needed

1. **Jargon Linter in Response Registry**:
   - Add a lightweight check in `response-registry.mjs` for forbidden technical keywords when `profile.mode === 'lite'` or when technical literacy is marked as low.
2. **Explicit Scope Gating Template**:
   - Update `references/02-discovery.md` with an explicit template for handling runaway feature requests: *"Acknowledge vision → explain pilot risk → record excluded in product.excluded → propose v1 focus"*.
3. **Automated State Purge on Pivot**:
   - Ensure `planner.mjs` automatically purges all subordinate design tokens (`design.palette`, `design.colorMode`, `experience.pacing`) whenever `design.preset` is updated.
