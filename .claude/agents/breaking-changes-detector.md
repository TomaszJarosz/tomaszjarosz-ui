# Breaking Changes Detector Agent

> Wykrywa breaking changes przed publikacją.

## Trigger

```
/check breaking-changes
```

## Cel

Identyfikacja breaking changes dla poprawnego wersjonowania (semver).

## Checklist

### 1. Compare Exports

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg exports ==="

  # Current exports
  grep -E "^export " packages/$pkg/src/index.ts 2>/dev/null

  # Compare with last version
  git show HEAD~1:packages/$pkg/src/index.ts 2>/dev/null | grep -E "^export " > /tmp/old_exports.txt
  grep -E "^export " packages/$pkg/src/index.ts > /tmp/new_exports.txt

  echo "--- Removed exports (BREAKING) ---"
  comm -23 /tmp/old_exports.txt /tmp/new_exports.txt

  echo "--- Added exports ---"
  comm -13 /tmp/old_exports.txt /tmp/new_exports.txt
done
```

### 2. Check Type Changes

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg type changes ==="

  # Compare .d.ts if exists
  git diff HEAD~1 packages/$pkg/src/**/*.ts 2>/dev/null | grep -E "^[-+].*interface|^[-+].*type " | head -20
done
```

- [ ] Brak usunięcia pól z interfejsów
- [ ] Brak zmiany wymaganych props na opcjonalne

### 3. Check Props Changes

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg props changes ==="

  # Find component props changes
  git diff HEAD~1 packages/$pkg/src/**/*.tsx 2>/dev/null | grep -E "Props\s*=" | head -10
done
```

- [ ] Nowe wymagane props = BREAKING
- [ ] Usunięcie props = BREAKING
- [ ] Zmiana typu props = BREAKING

### 4. Check Function Signatures

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg function changes ==="

  # Hooks and utilities
  git diff HEAD~1 packages/$pkg/src/**/*.ts 2>/dev/null | grep -E "^[-+]export (const|function)" | head -10
done
```

### 5. Changeset Status

```bash
# Check if changeset exists for breaking changes
ls .changeset/*.md 2>/dev/null | grep -v README
cat .changeset/*.md 2>/dev/null | grep -i "major"
```

- [ ] Major changes mają changeset z "major"

## Breaking Change Categories

| Change | Severity | Semver |
|--------|----------|--------|
| Removed export | BREAKING | major |
| Removed prop | BREAKING | major |
| Changed required prop | BREAKING | major |
| Changed return type | BREAKING | major |
| Added required prop | BREAKING | major |
| Changed prop type | BREAKING | major |
| Added optional prop | MINOR | minor |
| Added new export | MINOR | minor |
| Bug fix | PATCH | patch |

## Output Format

```markdown
## Breaking Changes Report

### Detected Changes

#### BREAKING (require major bump)
| Package | Change | Details |
|---------|--------|---------|
| react-ui | Removed export | `useOldHook` |
| react-article | Changed prop type | `TOC.items: string[] → Item[]` |

#### MINOR (new features)
| Package | Change | Details |
|---------|--------|---------|
| react-ui | Added export | `useNewHook` |

#### PATCH (fixes)
| Package | Change |
|---------|--------|
| react-markdown | Fixed rendering bug |

### Changeset Status
- [x] All breaking changes have major changeset
- [ ] Missing: react-ui needs major changeset

### Recommendations
1. [action]

### Breaking Changes: X found
```

## Memory

### PRZED
Przeczytaj `.claude/memory/breaking-changes.md`

### PO
Dodaj wpis do `.claude/memory/breaking-changes.md`:

```markdown
## [DATA] - [version]

### Breaking Changes
- [package]: [change]

### Migration Guide
- [how to migrate]

### Notes
- [observations]
```
