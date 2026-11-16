# Mobile Software Factory v1.0 — Copy-safe foundation update

**Apply to the existing v0.6 factory root**, for example `~/web/claude-mobile-factory`. Do not extract this over the factory.

```bash
unzip mobile-software-factory-v1.0-safe-update.zip -d /tmp/factory-v1-update
cd /tmp/factory-v1-update/mobile-software-factory-v1.0-update
node apply.mjs ~/web/claude-mobile-factory --dry-run
node apply.mjs ~/web/claude-mobile-factory
cd ~/web/claude-mobile-factory
pnpm check
pnpm factory help
pnpm skill:build
pnpm skill:verify
```

The updater checks every payload file's SHA256, refuses preexisting conflicting files, preserves existing root scripts including the current TypeScript check, changes root version + two new package scripts, adds a guarded skill-builder integration, and appends a short entry point to `skill/SKILL.md` pointing to the new skill workflow reference. No source components are replaced or deleted. Each edited original file is backed up alongside the factory.

What's in the update: catalog-backed CLI, conditional discovery, canonical structured blueprint data, screen contract audit, explicit approval gate, dependency-aware roadmap/tasks, small agent task packages, generated readable plans, and six new tests. The skill ZIP includes the v1 planning CLI, engine, curated catalog, and workflow reference so it works even when distributed separately.

**Limitations:** This is the first v1.0 foundation, not a complete app-generation engine. Auth modules, mock data executors, JSX auto-generation, visual certification, and automated releases are not implemented. AI should compose JSX from curated components, after explicit plan approval.

The included full v0.6 source ZIP was used to design this overlay. Your local v0.6 checkout may differ; the installer intentionally preserves those changes.
