# Experience Review: Design Evaluation & Scorecards

Architectural decision-making in the factory is evaluated by whether it generates distinctive, polished, intuitive mobile experiences. Code compilation and JSON schema validation ensure correctness, but **Experience Review** ensures beauty, restraint, and purpose.

---

## 1. Separation of Responsibilities

```
┌────────────────────────────────────────────────────────┐
│             Automated, Enforceable (CI/Linter)          │
├────────────────────────────────────────────────────────┤
│ • Missing design directives (hierarchy, motion, pacing)│
│ • Unsupported composition variants                     │
│ • Multiple competing primary CTAs                      │
│ • Reduced-motion accessibility fallback                │
│ • Insufficient touch target geometry (< 44×44pt)       │
│ • Invalid contrast combinations (< 4.5:1 / 3.0:1)      │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Visual Review (Human / AI Art Director)      │
├────────────────────────────────────────────────────────┤
│ • Weak visual hierarchy & lost focal points            │
│ • Generic template appearance                          │
│ • Poor visual rhythm & reading cadence                 │
│ • Unnatural or sluggish motion                         │
│ • Unbalanced negative space or claustrophobia          │
│ • Weak domain-specific art direction                   │
└────────────────────────────────────────────────────────┘
```

The automated linter never punishes intentional asymmetry, deliberate density variation, or unorthodox CTA positioning. It strictly enforces structural health so visual judgment can focus on design excellence.

---

## 2. The 5 Flagship Archetype Compositions

The factory proves design diversity by generating distinct domain-tailored applications that never share identical layouts:

| Application | Domain | Preset & Palette | Experience Direction | Archetypes & Key Compositions |
| :--- | :--- | :--- | :--- | :--- |
| **Pantry Reserve** | Artisanal Culinary & Provisions | `kyoto-craft`<br>`kyoto` | `hierarchy: typography-led`<br>`motion: subtle`<br>`pacing: relaxed` | • `bento-overview` (`asymmetric-hero`)<br>• `content-canvas` (`editorial-feature`)<br>• `focus-wizard` (`stage-stepper`) |
| **Capital Pulse** | Institutional High-Yield Treasury | `fintech-midnight`<br>`midnight` | `hierarchy: data-led`<br>`motion: expressive`<br>`pacing: compact` | • `glance-dashboard` (`metric-split`)<br>• `hero-decision` (`monumental-prompt`)<br>• `system-settings` (`inset-grouped`) |
| **Daily Training** | Athletic Movement & Conditioning | `playful-consumer`<br>`amber` | `hierarchy: task-led`<br>`motion: expressive`<br>`pacing: compact` | • `glance-dashboard` (`radial-hero`)<br>• `bento-overview` (`uniform-grid`)<br>• `focus-wizard` (`stage-stepper`) |
| **Flora Sanctuary** | Rare Botanical Field Archive | `wellness-botanical`<br>`emerald` | `hierarchy: media-led`<br>`motion: subtle`<br>`pacing: monumental` | • `bento-overview` (`priority-feed`)<br>• `content-canvas` (`immersive-bleed`)<br>• `hero-decision` (`action-sheet`) |
| **Civic Dispatch** | Municipal Infrastructure & Alerts | `minimal-pro`<br>`default` | `hierarchy: task-led`<br>`motion: subtle`<br>`pacing: relaxed` | • `glance-dashboard` (`summary-stack`)<br>• `content-canvas` (`card-canvas`)<br>• `focus-wizard` (`stage-stepper`) |

---

## 3. Visual Review Scorecard Rubric

Every candidate application is evaluated across 5 qualitative dimensions (graded 1 to 5; threshold for production release is $\ge 4.0$ across all categories, with no score below 3):

### 1. Visual Hierarchy & Focal Point Prominence (Weight: 25%)
- **Score 1 (Failing):** Competing headers, cluttered badges, unclear next step.
- **Score 3 (Acceptable):** A clear title and prominent button, but sections feel equally weighted.
- **Score 5 (Exemplary):** Immediate focal anchor within 1.5 seconds. Clear visual hierarchy guiding the eye effortlessly from anchor $\to$ supporting context $\to$ action.

### 2. Distinctiveness vs Domain Purpose (Weight: 20%)
- **Score 1 (Failing):** Looks like a generic wireframe or database admin table painted with random colors.
- **Score 3 (Acceptable):** Appropriately colored, but screen compositions feel interchangeable with other apps.
- **Score 5 (Exemplary):** Visibly tailored to its subject. Pacing, typography scale, and media treatment reinforce the application's unique mood and operational rhythm.

### 3. Whitespace Balance & Reading Rhythm (Weight: 20%)
- **Score 1 (Failing):** Claustrophobic padding, erratic margins, or jarring content jumps.
- **Score 3 (Acceptable):** Consistent gutters, but lacks intentional breathing pauses.
- **Score 5 (Exemplary):** Sculpted negative space. Sections breathe naturally; vertical rhythm is proportional to the chosen pacing axis.

### 4. Motion Fluidity & Tactical Feedback (Weight: 15%)
- **Score 1 (Failing):** Jarring instant pops, unresponsive taps, or heavy animations that cause frame drops.
- **Score 3 (Acceptable):** Standard modal transitions; no tactile press states.
- **Score 5 (Exemplary):** Organic spring dampening (`scale: 0.98` on press), fluid sheet entrances, seamless loading skeletons that eliminate layout shift.

### 5. Cross-Screen Identity Coherence (Weight: 20%)
- **Score 1 (Failing):** Every screen looks like it was designed by a different disconnected team.
- **Score 3 (Acceptable):** Same colors and headers, but navigation style and card densities fluctuate.
- **Score 5 (Exemplary):** Unified design persona throughout every route, modal, sheet, and empty state.
