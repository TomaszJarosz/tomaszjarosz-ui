# Test Runner Agent

> Uruchamia testy dla wszystkich pakietów.

## Trigger

```
/test
```

## Checklist

### 1. Run All Tests

```bash
bun test
```

### 2. Per-Package Tests

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== Testing $pkg ==="
  cd packages/$pkg
  bun test 2>/dev/null || echo "No tests or tests failed"
  cd ../..
done
```

### 3. Type Check

```bash
bun run typecheck
# lub
turbo run typecheck
```

### 4. Lint

```bash
bun run lint
```

### 5. Coverage (opcjonalnie)

```bash
bun test --coverage
```

## Memory

**PO**: Dodaj wpis do `.claude/memory/patterns.md` jeśli były failures

## Output

```markdown
## Test Report

### Summary

| Package | Tests | Passed | Failed |
|---------|-------|--------|--------|
| react-ui | X | X | 0 |
| react-visualizers | X | X | 0 |
| react-markdown | X | X | 0 |
| react-article | X | X | 0 |

### Type Check
- Status: PASS/FAIL

### Lint
- Errors: 0
- Warnings: X

### Test Status: PASS/FAIL
```
