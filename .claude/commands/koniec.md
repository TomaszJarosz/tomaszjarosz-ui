---
description: Zakończ sesję, zapisz kontekst
allowed-tools: Read, Edit, Write
---

# Koniec sesji

## 1. Podsumuj

Co zostało zrobione w tej sesji?

## 2. Zaktualizuj context.md

Edytuj `.claude/context.md`:
- Dodaj datę i opis sesji
- Zaktualizuj wersje jeśli publikowano

## 3. Sprawdź czy trzeba zaktualizować infrastrukturę Claude

Zastanów się czy zmiany w tej sesji wymagają aktualizacji:

| Co sprawdzić | Kiedy aktualizować |
|--------------|-------------------|
| **Agenty** (`.claude/agents/`) | Nowe wzorce pracy, nowe typy zadań |
| **Skille** (`.claude/commands/`, `~/.claude/skills/`) | Nowe powtarzalne procesy |
| **Memory** (`.claude/memory/`) | Nowe lekcje, wzorce, statystyki |
| **CLAUDE.md** | Nowe konwencje, ważne info o projekcie |
| **Konwencje solopreneur** (`~/repo/solopreneur/docs/`) | Zmiany cross-project |

Jeśli coś wymaga aktualizacji - zrób to teraz lub zanotuj w context.md.

## 4. Git commit

```bash
git status
```

Jeśli są zmiany:
```bash
git add .
git commit -m "..."
```
