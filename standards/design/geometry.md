# Geometry decisions

React Native layout units. Initial values subject to Lab tuning, not agent reinterpretation.

- Spacing: 0 / 4 / 8 / 12 / 16 / 24 / 32.
- Screen gutter: 20. Section gap: 24; component gap: 8–12.
- Default action height: 52; compact: 44 visual with minimum Android 48 touch region.
- Inputs: 52 minimum; list row: 60 minimum; icon button target: 48 × 48.
- Icons: 16 / 20 / 24. Neutral control radius: 12; media radius: 16.
- Horizontal alignment follows the screen gutter; full-bleed media is an explicit exception.
- Use `StyleSheet.hairlineWidth` for fine separators where appropriate.
- Keyboard, safe areas, and increased font size must not cover actions.
- Apple target baseline 44pt; Android baseline 48dp. Test touch regions, not only visible geometry.
