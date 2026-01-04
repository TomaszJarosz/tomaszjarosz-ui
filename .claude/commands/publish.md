---
description: Publikuj pakiety na npm
allowed-tools: Read, Bash
---

# Publish tomaszjarosz-ui

## 1. Pre-Publish

Uruchom agenta: `.claude/agents/pre-publish.md`

- [ ] Git clean
- [ ] Build passes
- [ ] Tests pass
- [ ] Changesets ready
- [ ] NPM logged in

## 2. Changeset Workflow

### Jeśli nie ma changesets:

```bash
bunx changeset
```

### Jeśli są changesets:

```bash
# Bump versions
bunx changeset version

# Build all
bun run build

# Publish
bunx changeset publish
```

## 3. Post-Publish

Uruchom agenta: `.claude/agents/post-publish.md`

- [ ] Packages on npm
- [ ] Tags pushed

## 4. Memory

Zaktualizuj `.claude/memory/publish-log.md`
