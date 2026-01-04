# Convention Check Agent

> Sprawdza zgodność z konwencjami komponentów.

## Trigger

```
/check conventions
```

## Checklist

### 1. Component Structure

Każdy komponent powinien mieć:

```
ComponentName/
├── ComponentName.tsx      # Implementacja
├── ComponentName.test.tsx # Testy (opcjonalnie)
├── index.ts               # Re-export
└── ComponentName.stories.tsx # Story (dla visualizers)
```

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg ==="
  ls packages/$pkg/src/components/*/index.ts 2>/dev/null | wc -l
done
```

### 2. Named Exports

Nie używaj default exports:

```bash
# Szukaj default exports
grep -r "export default" packages/*/src/**/*.tsx 2>/dev/null | grep -v stories
```

- [ ] Brak default exports

### 3. TypeScript Types

Wszystkie props mają typy:

```bash
# Szukaj any
grep -r ": any" packages/*/src/**/*.tsx 2>/dev/null
```

- [ ] Brak `any` types

### 4. forwardRef Pattern

Komponenty używają forwardRef:

```bash
grep -r "forwardRef" packages/*/src/**/*.tsx 2>/dev/null | wc -l
```

- [ ] Komponenty interactive używają forwardRef

### 5. Package.json Fields

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg ==="
  cat packages/$pkg/package.json | jq '{main, module, types, exports}'
done
```

- [ ] `main`, `module`, `types` ustawione
- [ ] `exports` field present

### 6. Peer Dependencies

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== $pkg peerDependencies ==="
  cat packages/$pkg/package.json | jq '.peerDependencies'
done
```

- [ ] React jako peer dependency
- [ ] Tailwind jako peer dependency (gdzie używany)

## Output

```markdown
## Convention Check Report

### Structure
| Package | Components | Stories |
|---------|------------|---------|
| react-ui | X | N/A |
| react-visualizers | X | X |

### Code Quality
- Default exports: 0
- Any types: 0
- forwardRef usage: X components

### Package Config
- [x] All packages have correct exports
- [x] Peer dependencies set

### Issues
- [jeśli są]

### Convention Score: X/10
```
