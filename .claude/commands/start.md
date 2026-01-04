---
description: Rozpocznij sesję pracy
allowed-tools: Read, Bash(git:*), Bash(bun:*), Bash(npm:*)
---

# Start sesji tomaszjarosz-ui

## 1. Załaduj kontekst

1. `.claude/context.md` - stan projektu
2. `.claude/memory/publish-log.md` - ostatnie publikacje

## 2. Status pakietów

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== @tomaszjarosz/$pkg ==="
  LOCAL=$(cat packages/$pkg/package.json | grep '"version"' | cut -d'"' -f4)
  NPM=$(npm view @tomaszjarosz/$pkg version 2>/dev/null || echo "NOT PUBLISHED")
  echo "Local: $LOCAL | NPM: $NPM"
done
```

## 3. Git status

```bash
git status
git log --oneline -3
```

## 4. Pending changesets

```bash
ls .changeset/*.md 2>/dev/null | grep -v README
```

## 5. Output

Podsumuj:
- Wersje lokalne vs npm
- Pending changesets
- Co do zrobienia
