---
description: Uruchom Storybook
allowed-tools: Bash
---

# Storybook

## Run

```bash
cd packages/react-visualizers
npm run storybook
```

Otwórz: http://localhost:6006

## Build

```bash
cd packages/react-visualizers
npm run build-storybook
```

## Chromatic

```bash
# Wymaga CHROMATIC_TOKEN
npx chromatic --project-token=$CHROMATIC_TOKEN
```

## Check

Uruchom agenta: `.claude/agents/storybook-checker.md`
