# Strict taxonomy

- `foundation`: tokens/theme with no internal UI dependencies.
- `primitives`: minimal layout or typography; may import foundation and primitives.
- `controls`: interactive controls or compact content UI; may import foundation, primitives, controls.
- `composites`: component compositions; may import any lower layer and composites.
- `patterns`: reusable screen sections; may import any lower layer and patterns.

Components remain platform-native, typed, accessible, and independent from business logic. Catalog records point to canonical source and tests. The validator enforces file presence and import boundaries; native runtime behavior requires separate device validation.
