# Pre-Publish Agent

> Checklist przed publikacją pakietów npm.

## Trigger

Przed każdym `changeset publish`.

## Checklist

### 1. Git Status

```bash
# Clean working directory?
[ -z "$(git status --porcelain)" ] || echo "WARNING: Uncommitted changes!"

# On main branch?
git branch --show-current
```

### 2. Build All Packages

```bash
bun run build
```

- [ ] Build zakończony sukcesem
- [ ] Brak błędów TypeScript
- [ ] Wszystkie packages mają dist/

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  [ -d "packages/$pkg/dist" ] && echo "✓ $pkg/dist" || echo "✗ $pkg/dist MISSING"
done
```

### 3. Tests Pass

```bash
bun test
```

- [ ] Wszystkie testy przechodzą

### 4. Changesets Ready

```bash
# Check for pending changesets
ls .changeset/*.md 2>/dev/null | grep -v README | head -5
```

- [ ] Changesets zostały dodane
- [ ] Wersje zostały zbumpowane (`changeset version`)

### 5. Package Versions

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "$pkg: $(cat packages/$pkg/package.json | grep '"version"' | cut -d'"' -f4)"
done
```

- [ ] Wersje są poprawne

### 6. NPM Login

```bash
npm whoami
```

- [ ] Zalogowany jako właściciel @tomaszjarosz

## Memory

**PO**: Nie aktualizuj (post-publish to robi)

## Output

```markdown
## Pre-Publish Check

| Check | Status |
|-------|--------|
| Git clean | ✓/✗ |
| Build passes | ✓/✗ |
| Tests pass | ✓/✗ |
| Changesets ready | ✓/✗ |
| NPM logged in | ✓/✗ |

### Packages to publish
| Package | Version |
|---------|---------|
| react-ui | X.X.X |
| ... | ... |

### Ready for Publish: YES/NO
```
