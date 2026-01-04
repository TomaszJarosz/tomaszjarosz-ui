# Bundle Size Analyzer Agent

> Analizuje rozmiar bundli wszystkich pakietów.

## Trigger

```
/analyze bundle-size
```

## Cel

Śledzenie rozmiaru bundli NPM - krytyczne dla biblioteki komponentów.

## Checklist

### 1. Build All Packages

```bash
bun run build
```

### 2. Measure Bundle Sizes

```bash
echo "=== Bundle Sizes ==="
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo ""
  echo "--- @tomaszjarosz/$pkg ---"

  # Total dist size
  TOTAL=$(du -sh packages/$pkg/dist 2>/dev/null | cut -f1)
  echo "Total: $TOTAL"

  # Individual files
  ls -lh packages/$pkg/dist/*.js 2>/dev/null | awk '{print $5, $9}'

  # Gzipped size
  for f in packages/$pkg/dist/*.js; do
    GZ=$(gzip -c "$f" 2>/dev/null | wc -c)
    echo "$(basename $f) gzipped: $((GZ/1024))kB"
  done
done
```

### 3. Compare with Baseline

Sprawdź `.claude/memory/bundle-sizes.md` i porównaj:
- [ ] Żaden pakiet nie przekroczył threshold
- [ ] Brak nieoczekiwanego wzrostu

### 4. Check for Large Dependencies

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg dependencies ==="
  cat packages/$pkg/package.json | jq '.dependencies // {} | keys[]' 2>/dev/null
done
```

- [ ] Brak zbędnych dependencies
- [ ] Heavy deps są peer deps

### 5. Tree Shaking Test

```bash
# Sprawdź czy są default exports (blokują tree-shaking)
grep -r "export default" packages/*/src/**/*.tsx 2>/dev/null | grep -v stories | grep -v test
```

- [ ] Brak default exports
- [ ] Wszystkie exports są named

## Thresholds

| Package | Max Size | Max Gzipped |
|---------|----------|-------------|
| react-ui | 20kB | 7kB |
| react-visualizers | 100kB | 35kB |
| react-markdown | 500kB | 150kB |
| react-article | 15kB | 5kB |

## Output Format

```markdown
## Bundle Size Report

### Summary

| Package | Size | Gzipped | Δ vs Baseline | Status |
|---------|------|---------|---------------|--------|
| react-ui | XkB | XkB | +X% | GREEN |
| react-visualizers | XkB | XkB | +X% | GREEN |
| react-markdown | XkB | XkB | +X% | YELLOW |
| react-article | XkB | XkB | -X% | GREEN |

### File Breakdown

#### react-ui
| File | Size | Gzipped |
|------|------|---------|
| index.js | XkB | XkB |

### Large Dependencies
- [package]: XkB

### Tree Shaking
- Default exports: 0
- Named exports: X

### Issues
- [jeśli są]

### Bundle Score: X/10
```

## Memory

### PRZED
Przeczytaj `.claude/memory/bundle-sizes.md`

### PO
Dodaj wpis do `.claude/memory/bundle-sizes.md`:

```markdown
## [DATA]

### Sizes
| Package | Size | Gzipped |
|---------|------|---------|
| react-ui | XkB | XkB |
| ... | ... | ... |

### Changes
- [what changed]

### Notes
- [observations]
```
