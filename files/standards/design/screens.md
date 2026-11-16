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
