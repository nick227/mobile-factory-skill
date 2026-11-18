# Live-Agent Interview Simulation: Findings & Audit Report

## 1. Five Most Serious Discovery-Quality Problems Identified in Live Testing

1. **Premature Solutioning & Technical Jargon Exposure**
   - *Observed*: In the Non-Technical Founder persona, the unconstrained AI opened by suggesting *"an SQLite local database schema with an asynchronous persistence layer and CRUD operations"*.
   - *Impact*: Confuses non-technical founders, breaks psychological safety, and contradicts Focus-First Native design principles.
   - *Implicated Rule*: `skill/SKILL.md` §6 and `references/02-discovery.md` §5 ("Speak the user's language; avoid architectural jargon before requirements are established").

2. **Question Density & Multi-Barreled Prompting**
   - *Observed*: In the Vague Visionary persona, the agent bundled 3 distinct inquiries into turn 1 (discovery feed vs private log, roast variables, photo filters).
   - *Impact*: Overwhelms non-technical clients and causes selective answering where crucial constraints get skipped.
   - *Implicated Contract*: `factory-v1/response-registry.mjs` strictly flags question arrays $> 2$. The skill instruction must reinforce the 1–2 question hard limit.

3. **Agreeable Assistant Syndrome (Feature Creep Accommodation)**
   - *Observed*: When the Feature Creeper requested live GPS tracking, in-app crypto tipping, video streaming, and background checks, the live model's initial impulse was to enthusiastically accommodate all four into the roadmap.
   - *Impact*: Scope explosion and project abandonment.
   - *Implicated Rule*: `skill/SKILL.md` §6 ("The decision changes scope, data ownership, accounts, money, privacy... Stop that task, ask the one question, record boundaries in product.excluded").

4. **Residual Preference Bleed During Design Pivots**
   - *Observed*: During aesthetic pivots (Changing-Mind Client), unconstrained models occasionally retain dark-mode variables or compact padding tokens in downstream facts when the user explicitly switched to spacious luxury white.
   - *Impact*: Frankenstein UI where typography and colors contradict each other.
   - *Implicated Engine*: `factory-v1/planner.mjs` invalidation rules cleanly invalidate stale design tasks, but the agent must explicitly emit a fresh `DESIGN` envelope clearing previous preset tokens.

5. **Lack of Quote Provenance in Unenforced LLM Outputs**
   - *Observed*: Without the State Guard and Response Registry, the live model regularly paraphrased user statements into pseudo-quotes rather than extracting exact verbatim substrings.
   - *Impact*: Provenance gap where hallucinated requirements could be marked as "user confirmed".
   - *Implicated Guard*: `factory-v1/state-guard.mjs` `verifyQuoteProvenance()` prevents manufactured evidence from contaminating `.factory/project.json`.

---

## 2. Does the Response Registry Improve Behavior or Merely Reject Bad Output?

**Dual Value Demonstrated**:
1. **At the Boundary**: The Response Registry acts as a strict firewall. When the agent attempts to ask 3 questions or proposes a design without authentic user aesthetic evidence, the response envelope is rejected before client display or persistence.
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
