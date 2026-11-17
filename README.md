# Mobile Software Factory

The **Mobile Software Factory** is an agent-first mobile application construction platform designed to build studio-quality React Native and Expo applications with high precision, minimal token overhead, and zero unnecessary custom code.

Instead of writing bespoke, fragile UI code from scratch, AI agents and engineers use the factory's curated, production-tested catalog of primitives, controls, composites, and high-level patterns adhering to **Focus-First Native** design principles.

---

## Architecture & Workspaces

The factory is organized as a pnpm workspace:

```
├── packages/
│   ├── ui/               # Canonical component library (foundation, primitives, controls, composites, patterns)
│   └── catalog/          # Component registry (registry.json) with source, export, showcase, and test paths
├── apps/
│   └── lab/              # Interactive Expo application demonstrating live component showcases and scenarios
├── factory-v1/           # State engine, interactive discovery, blueprint audits, task packaging, and docs export
├── scripts/              # Governance checks (check.mjs) and dependency-closure selective installer (install-source.mjs)
├── standards/            # Factory design, typography, layout, gesture, and rendering specifications
└── tests/                # Automated engine, installer, and governance regression test suites
```

---

## Component Taxonomy

The factory enforces a strict unidirectional dependency hierarchy. Components may only import from lower layers or peer helpers at the same level:

1. **Foundation (`level 0`):** Semantic tokens (`tokens.ts`) and theme provider (`theme.tsx`). Color palettes, geometry, and spacing logical units.
2. **Primitives (`level 1`):** Structural building blocks (`Text`, `Stack`, `Row`, `Surface`, `Divider`, `Screen`, `Spacer`).
3. **Controls (`level 2`):** Interactive inputs and indicators (`Button`, `TextField`, `IconButton`, `Toggle`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `ProgressBar`, `Spinner`, `StepProgress`, `CalmSkeleton`).
4. **Composites (`level 3`):** Semantic compositions of controls and primitives (`ListItem`, `Avatar`, `SectionHeader`, `EmptyState`, `FormField`, `ScreenHeader`, `InputStage`, `MediaFrame`).
5. **Patterns (`level 4`):** Cohesive, high-value user experience workflows (`ActionFooter`, `ActionDock`, `FocusScreen`, `SwipePager`, `SettingsGroup`, `EditorialMosaic`, `ImmersiveHero`, `ChoiceGallery`, `FocusWizard`).

---

## 4-Tier Component Maturity

Every catalog record carries an explicit maturity level:

| Tier | Definition | Construction Agent Directive |
| :--- | :--- | :--- |
| `candidate` | Design concept or planned capability. | May be discussed in planning; triggers an explicit `implement-<id>` task prior to screen construction. Never imported as existing code. |
| `implemented` | Production source, typed public API, and interactive Lab showcase. | Available for composition. |
| `verified` | Executable behavioral assertions, accessibility checks, and responsive review. | Proven safe for production screen construction. |
| `recommended` | Battle-tested, default solution for common mobile requirements. | Prioritized default recommendation for AI agents. |

---

## CLI & Development Workflows

### 1. Quality & Governance Verification
```bash
corepack pnpm check
```
Runs:
- Catalog taxonomy validation and import boundary check (`scripts/check.mjs`).
- TypeScript compilation across Lab and UI (`tsc --noEmit`).
- State engine, selective installer, and regression tests (`tests/*.test.mjs`).
- Executable UI component behavioral and accessibility tests (`packages/ui/tests/*.test.tsx`).

### 2. Interactive Expo Lab
```bash
corepack pnpm lab          # Start Expo dev server
corepack pnpm lab:web      # Run in web browser
corepack pnpm lab:android  # Run on Android emulator / device
corepack pnpm lab:ios      # Run on iOS simulator / device
```

### 3. Project Discovery & Construction Engine
```bash
# Initialize a new mobile project
pnpm factory project init --project /tmp/events-app --name "Neighborhood Events"

# Answer discovery questions or apply patch
pnpm factory project update --project /tmp/events-app --file factory-v1/examples/neighborhood.patch.json

# Audit blueprint readiness
pnpm factory blueprint audit --project /tmp/events-app

# Record user design confirmation and approve blueprint
pnpm factory blueprint approve --project /tmp/events-app

# Generate construction task dependency graph
pnpm factory plan build --project /tmp/events-app

# Inspect next available task contract
pnpm factory plan next --project /tmp/events-app
pnpm factory plan task screen-discover --project /tmp/events-app

# Export self-contained Markdown documentation
pnpm factory blueprint export --project /tmp/events-app
```

### 4. Selective Source Installation
Install only the exact components needed by a target app with full dependency closure calculation:
```bash
# Dry run simulation (reports adds, noops, collisions, and import reasons)
node scripts/install-source.mjs packages/ui/src packages/catalog/registry.json /path/to/app --components=patterns.editorialmosaic,patterns.immersivehero --dry-run

# Perform installation
node scripts/install-source.mjs packages/ui/src packages/catalog/registry.json /path/to/app --components=patterns.editorialmosaic,patterns.immersivehero
```

---

## Design Principles: Focus-First Native

1. **Single Dominant Task:** Full screen focus for decision points rather than cluttered multi-column web dashboards.
2. **Stable Media Frames:** Fixed aspect ratios prevent cumulative layout shift (CLS) during image loads.
3. **Calm Loading:** Smooth skeleton states that preserve spatial hierarchy.
4. **Accessible Touch Targets:** 48pt minimum on Android, 44pt minimum on iOS.
5. **No Silent State Destruction:** Iterative requirements discovery updates merge cleanly by ID without discarding completed tasks or verification evidence.
