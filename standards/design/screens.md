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

## The Dependable Fallback: HeroPrompt

When in doubt, simplify. The factory's canonical fallback is **huge simple font (36–48pt), a calm legible subtitle (16–18pt), and one or two thumb-docked buttons** (`HeroPrompt`).

Use this composition instead of inventing complex multi-card dashboards or web-like form fields whenever presenting:
- Onboarding & welcome moments
- Permission requests & device access
- Milestone achievements & celebration
- Decision gates & high-stakes confirmations
- Empty / initial states & calm error recovery

A single dominant message with serene negative space and an effortless thumb-first CTA establishes instant trust and native polish.
