# Dependency Audit Agent

> Audytuje zależności wszystkich pakietów.

## Trigger

```
/audit dependencies
```

## Cel

Zapewnienie minimalnych, bezpiecznych zależności w bibliotece.

## Checklist

### 1. Security Audit

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg security audit ==="
  cd packages/$pkg
  npm audit 2>/dev/null || echo "No vulnerabilities or not applicable"
  cd ../..
done
```

- [ ] Brak critical vulnerabilities
- [ ] Brak high vulnerabilities

### 2. Check Peer Dependencies

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg peerDependencies ==="
  cat packages/$pkg/package.json | jq '.peerDependencies // {}'
done
```

- [ ] React jest peer dep (nie dependency)
- [ ] Tailwind jest peer dep (jeśli używany)
- [ ] Brak duplikatów w dependencies i peerDependencies

### 3. Check Production Dependencies

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg dependencies ==="
  cat packages/$pkg/package.json | jq '.dependencies // {} | keys | length'
  cat packages/$pkg/package.json | jq '.dependencies // {}'
done
```

- [ ] Minimalna liczba dependencies
- [ ] Brak zbędnych deps

### 4. Check DevDependencies

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg devDependencies count ==="
  cat packages/$pkg/package.json | jq '.devDependencies // {} | keys | length'
done
```

### 5. Check for Duplicates

```bash
# W root monorepo
npm ls 2>/dev/null | grep -E "deduped|UNMET" | head -20
```

- [ ] Brak duplicate packages
- [ ] Brak UNMET peer deps

### 6. Outdated Packages

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg outdated ==="
  cd packages/$pkg
  npm outdated 2>/dev/null | head -10
  cd ../..
done
```

- [ ] Brak critically outdated packages
- [ ] Major updates zaplanowane

### 7. Bundle Impact

```bash
# Sprawdź które deps są największe
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg bundle impact ==="
  cat packages/$pkg/package.json | jq -r '.dependencies // {} | keys[]' | while read dep; do
    SIZE=$(npm view $dep dist.unpackedSize 2>/dev/null || echo "unknown")
    echo "$dep: $SIZE"
  done
done
```

## Best Practices

1. **Peer deps**: React, ReactDOM, Tailwind
2. **Bundle deps**: Only if absolutely needed
3. **Dev deps**: Types, build tools, testing

## Output Format

```markdown
## Dependency Audit Report

### Security

| Package | Critical | High | Medium | Low |
|---------|----------|------|--------|-----|
| react-ui | 0 | 0 | 0 | 0 |
| react-visualizers | 0 | 0 | 1 | 2 |
| ... | ... | ... | ... | ... |

### Peer Dependencies
| Package | react | tailwindcss | Other |
|---------|-------|-------------|-------|
| react-ui | >=17 | >=3 | - |
| ... | ... | ... | ... |

### Production Dependencies
| Package | Count | Largest |
|---------|-------|---------|
| react-ui | 2 | clsx (1kB) |
| ... | ... | ... |

### Outdated
| Package | Dependency | Current | Latest | Type |
|---------|------------|---------|--------|------|
| react-ui | typescript | 5.6 | 5.7 | dev |

### Issues
1. [CRITICAL] [Issue]
2. [HIGH] [Issue]

### Recommendations
1. [Action]

### Dependency Health: X/10
```

## Memory

### PRZED
Przeczytaj `.claude/memory/dependency-audit.md`

### PO
Dodaj wpis do `.claude/memory/dependency-audit.md`:

```markdown
## [DATA]

### Security Issues
- [package]: [CVE] - [status]

### Changes
- Added: [dep]
- Removed: [dep]
- Updated: [dep] X → Y

### Notes
- [observations]
```
