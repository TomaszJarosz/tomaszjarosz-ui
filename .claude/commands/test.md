---
description: Uruchom testy
allowed-tools: Bash
---

# Test tomaszjarosz-ui

## Wykonanie

Uruchom agenta: `.claude/agents/test-runner.md`

## Quick Test

```bash
# All tests
bun test

# Single package
bun run test --filter=@tomaszjarosz/react-ui

# Type check
bun run typecheck

# Lint
bun run lint
```

## Output

Raport testów z podsumowaniem per package.
