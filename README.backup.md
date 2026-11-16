# v0.6 Copy-Safe Update

Upgrades a clean v0.1 or v0.2 factory checkout without deleting existing files.

1. Extract this archive **outside** your factory checkout.
2. Run `node apply.mjs /absolute/path/to/mobile-software-factory --dry-run`.
3. If there are no conflicts, run the same command without `--dry-run`.
4. Run `corepack enable && pnpm install && pnpm check && pnpm skill:build && pnpm skill:verify`.
5. Run `pnpm lab` and device tests on configured machines.

If you edited `skill/SKILL.md` or another baseline file, the installer will refuse to overwrite it. Merge local changes manually, then re-run. Never use force-copy over changes. No source files are deleted.

Native compile/device tests and actual interaction test suites are not yet certified.
