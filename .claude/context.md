# Session Context

> Pamięć sesji Claude Code dla tomaszjarosz-ui.

## Ostatnia sesja

- **Data**: 2026-01-07
- **Co zrobiono**: Uproszczenie .claude/ structure

## Status

**PUBLISHED** - NPM @tomaszjarosz/*

Biblioteka komponentów React.

## Packages

| Package | Size | Opis |
|---------|------|------|
| `@tomaszjarosz/react-ui` | 7kB | UI components, hooks |
| `@tomaszjarosz/react-visualizers` | 55kB | Algorithm visualizations |
| `@tomaszjarosz/react-markdown` | 374kB | Markdown components |
| `@tomaszjarosz/react-article` | 4kB | Article components |

## Stack

| | |
|---|---|
| React | 17+/18+/19 (peer) |
| TypeScript | 5.7+ |
| Monorepo | Turborepo |
| Versioning | Changesets |
| Package manager | Bun 1.3.3 |

## Publish workflow

```bash
changeset                 # Dodaj changeset
changeset version         # Bump versions
bun run build             # Build all
changeset publish         # Publish to npm
```
