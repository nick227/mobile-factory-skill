# Screen anatomy

The five content families are **overview**, **collection**, **detail**, **editor**, **focus**. These describe intent, not five mutually exclusive component trees.

Three layout shells:

| Shell | Structure | Use |
|---|---|---|
| FocusScreen | dismiss/back → progress optional → one current prompt → bottom action | wizard / task |
| CanvasScreen (future) | immersive content → overlay controls with safe-area insets | media |
| ContentScreen | header → scrolling content → optional stable action dock | collection/detail |

- One primary task per focus view, one dominant CTA per task.
- Header back/close always remains discoverable, even with swipe navigation.
- Detail pushes; short selection may use native sheet; multi-field edit gets a full editor.
- Save returns to updated detail, cancel discards, collection scroll/filter survive the trip.
- Reserve action-dock dimensions before keyboard/async operations change state.
- Empty, loading, retry, success are defined at the feature boundary, not invented inside a button.

## Factory-Owned Monad Page Archetypes

Rather than authoring arbitrary custom screen JSX or web-like page layouts, the AI agent selects a factory-owned Monad page archetype per screen. Every archetype preserves the shared `ScreenHeader`, the Monad single-subject rule, native safe-area insets, and full responsiveness to the global design axes.

| Archetype | Best Use | Compatible Subjects | Factory Composition |
|---|---|---|---|
| `hero-decision` | Focused single-action decisions, welcome prompts, milestone choices | `detail`, `message`, `form` | Huge simple font (36–48pt), calm subtitle, 1 or 2 thumb-docked actions (`HeroPrompt`). |
| `glance-dashboard` | Today views, metrics, progress trackers, daily telemetry | `detail`, `collection` | Monumental hero metric, radial progress ring, status aura micro-sentences (`GlanceHero`, `RadialProgress`). |
| `focus-wizard` | Multi-field forms, guided step entry, onboarding questionnaires | `form` | Step-by-step sequential progression with auto-advance, step indicator, and bottom dock (`FocusWizard`, `StepProgress`). |
| `bento-overview` | Hub pages, category overviews, collection launchpads, control cards | `collection`, `detail` | 2-column squircle bento grid with icons, badges, and quick toggles (`ControlTile`). |
| `content-canvas` | Media-led stories, recipe details, product profiles, visual showcases | `detail`, `collection` | High-ratio media frames (16:9), editorial typography, generous reading rhythm (`MediaFrame`, `Surface`). |
| `system-settings` | Grouped preferences, account settings, toggle switches, links | `settings` | Grouped rows with clean dividers, platform toggles, and navigation links (`SettingsGroup`, `Toggle`). |

In `app.spec.json`, an agent simply declares:
```json
{
  "route": "/today",
  "title": "Today",
  "archetype": "glance-dashboard",
  "subject": {
    "kind": "detail",
    "source": "progress"
  }
}
```

The factory assembler deterministically constructs the route, binds data actions, and applies the global design configuration with zero hand-written screen code.

## The Dependable Fallback: HeroPrompt

When in doubt, simplify. The factory's canonical fallback is **huge simple font (36–48pt), a calm legible subtitle (16–18pt), and one or two thumb-docked buttons** (`HeroPrompt`).

Use this composition instead of inventing complex multi-card dashboards or web-like form fields whenever presenting:
- Onboarding & welcome moments
- Permission requests & device access
- Milestone achievements & celebration
- Decision gates & high-stakes confirmations
- Empty / initial states & calm error recovery

A single dominant message with serene negative space and an effortless thumb-first CTA establishes instant trust and native polish.
