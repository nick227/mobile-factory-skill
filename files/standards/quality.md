# Release evidence

`pnpm check` enforces source paths, exports, showcase/test presence, taxonomy boundaries, and Node governance tests. This is **not** an Expo compile or device test.

**Preview** may ship in a skill only when clearly marked preview. **Stable** requires:
1. Executable React Native component interaction tests (not placeholders).
2. iOS and Android native-device or simulator smoke evidence with platform/SDK and date.
3. Light/dark, accessibility roles/labels, dynamic text, touch area, and keyboard review.
4. Stress/journey scenario where applicable.
5. Skill ZIP install verification from a clean extracted environment.

Store test evidence outside bundled source in a version-controlled verification report. A failed/missing check cannot be represented as passed.
