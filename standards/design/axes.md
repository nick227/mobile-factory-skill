# Multi-Axis Design System — Standards & Configuration

Factory mobile applications do not rely on ad-hoc, hand-written styling JSX. Instead, design is a deterministic configuration composed across 7 orthogonal axes, with 6 prefabbed archetype presets.

## 1. The 7 Independent Design Axes

| Axis | Choices | Focus / Purpose |
| :--- | :--- | :--- |
| **Palette** | `default`, `kyoto`, `midnight`, `emerald`, `crimson`, `amber` | Brand color harmonies with full light and dark mode mappings. |
| **Radius** (Geometry) | `sharp` (2–4pt), `smooth` (8–12pt), `curved` (16–24pt) | Corner curvature for controls, cards, modals, and sheets. |
| **Density** (Spacing) | `compact` (12pt), `comfortable` (16pt), `spacious` (24pt) | Screen padding, layout gaps, and breathing room between items. |
| **Typography** | `compact` (14/18/24), `default` (16/20/28), `editorial` (17/24/36) | Font sizes and hierarchy scale for body, heading, and display. |
| **Surface** | `flat`, `outlined`, `elevated` | Container styling: border-driven vs shadow/elevation vs flat. |
| **Layout** | `standard`, `editorial`, `immersive` | Overall page composition: standard gutter, generous editorial, or full-bleed immersive. |
| **Media Treatment** | `contained`, `edge-to-edge`, `mosaic` | Photography and frame presentation: boxed, bleed-to-edge, or asymmetric. |

## 2. Prefabbed Archetypes

Presets provide proven starting configurations:

1. **`minimal-pro`**: Clean modern utility. Default palette, smooth radius, comfortable density, outlined surfaces.
2. **`kyoto-craft`**: Warm, earthy, artisanal luxury. Kyoto earthy tones, sharp geometric corners, spacious padding, editorial typography.
3. **`fintech-midnight`**: High-contrast, precise dark-native financial feel. Midnight palette, smooth corners, compact density, elevated glass cards.
4. **`wellness-botanical`**: Organic, serene, restorative flow. Emerald palette, curved organic corners, spacious density, contained media.
5. **`editorial-luxury`**: Bold fashion/lifestyle magazine aesthetic. Crimson palette, sharp corners, editorial typography, edge-to-edge full-bleed imagery.
6. **`playful-consumer`**: Friendly, approachable consumer experience. Amber warm palette, curved corners, comfortable density, elevated surfaces.

## 3. Factory Design Artifact (`factory-design.json`)

To configure an application, Claude or the AI agent selects an archetype and adds any specific axis overrides into a single `factory-design.json` artifact at the root of the app:

```json
{
  "$schema": "./standards/design/factory-design.schema.json",
  "preset": "kyoto-craft",
  "radius": "sharp",
  "density": "spacious",
  "media": "edge-to-edge",
  "mode": "system"
}
```

The application's root `_layout.tsx` wraps the app with `<ThemeProvider designConfig={designConfig}>`, instantly propagating all design dimensions across every catalog component without requiring custom per-screen styles.
