# Session Context

> Pamięć sesji Claude Code dla tomaszjarosz-ui.

## Ostatnia sesja

- **Data**: 2026-01-04
- **Co zrobiono**: Initial Claude Code setup

## Claude Code Setup

### Skills (2)
- `react-components` - React component patterns
- `monorepo` - Turborepo + Changesets workflow

### Agents (5)
- `pre-publish` - checklist przed publikacją npm
- `post-publish` - weryfikacja po publikacji
- `test-runner` - uruchamianie testów
- `storybook-checker` - sprawdzenie Storybook
- `convention-check` - zgodność z konwencjami

### Commands (5)
- `/start` - rozpocznij sesję
- `/publish` - publikuj pakiety na npm
- `/test` - uruchom testy
- `/storybook` - uruchom Storybook
- `/koniec` - zakończ sesję

### Memory (2)
- `publish-log.md` - historia publikacji npm
- `patterns.md` - lessons learned

## Projekt

**tomaszjarosz-ui** - biblioteka komponentów React
- NPM: @tomaszjarosz/*
- Status: PUBLISHED

## Packages

| Package | Size | Opis |
|---------|------|------|
| `@tomaszjarosz/react-ui` | 7kB | UI components, hooks, animations |
| `@tomaszjarosz/react-visualizers` | 55kB | Algorithm visualizations |
| `@tomaszjarosz/react-markdown` | 374kB | Markdown components |
| `@tomaszjarosz/react-article` | 4kB | Article components (TOC, progress) |

## Stack

- React 17+/18+/19 (peer dependency)
- TypeScript 5.7+
- Tailwind CSS (peer dependency)
- Turborepo (monorepo)
- Changesets (versioning)
- Storybook (visualizers)
- Bun 1.3.3 (package manager)

## Notatki

### Workflow publikacji
1. `changeset` - dodaj changeset
2. `changeset version` - bump versions
3. `bun run build` - build wszystkich packages
4. `changeset publish` - publikuj na npm

### Ważne
- Każdy package ma osobne wersjonowanie
- Storybook tylko dla react-visualizers
- GitHub Actions dla Chromatic
