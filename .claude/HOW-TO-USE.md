# Jak używać Claude w tomaszjarosz-ui

## Quick Start

```bash
/start              # Załaduj kontekst
/start quick        # Tylko context.md
```

## Komendy

| Komenda | Opis |
|---------|------|
| `/start` | Rozpocznij sesję |
| `/koniec` | Zakończ sesję |
| `/publish` | Publikuj na npm |

## Memory

```
memory/
├── lessons.md          # Lessons learned
├── publish-log.md      # Historia publikacji
└── README.md           # Dokumentacja
```

## Skills (projektowe)

| Skill | Opis |
|-------|------|
| `react-components` | React component patterns |
| `monorepo` | Turborepo + Changesets |

## Workflow

1. `/start` - załaduj kontekst
2. Pracuj nad komponentem
3. `/publish` - publikuj na npm
4. `/koniec` - zapisz session handoff
