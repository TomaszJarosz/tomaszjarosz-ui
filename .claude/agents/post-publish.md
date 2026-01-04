# Post-Publish Agent

> Weryfikacja po publikacji pakietów npm.

## Trigger

Po każdym `changeset publish`.

## Checklist

### 1. Verify on NPM

```bash
for pkg in react-ui react-visualizers react-markdown react-article; do
  echo "=== @tomaszjarosz/$pkg ==="
  npm view @tomaszjarosz/$pkg version 2>/dev/null || echo "NOT FOUND"
done
```

- [ ] Wszystkie pakiety dostępne na npm
- [ ] Wersje zgadzają się

### 2. Check npm Page

Otwórz w przeglądarce:
- https://www.npmjs.com/package/@tomaszjarosz/react-ui
- https://www.npmjs.com/package/@tomaszjarosz/react-visualizers
- https://www.npmjs.com/package/@tomaszjarosz/react-markdown
- https://www.npmjs.com/package/@tomaszjarosz/react-article

### 3. Test Installation

```bash
# W nowym projekcie
npm install @tomaszjarosz/react-ui@latest
```

- [ ] Instaluje się bez błędów

### 4. Git Tag

```bash
git tag
```

- [ ] Tag dla nowej wersji utworzony

### 5. Push Tags

```bash
git push --tags
```

- [ ] Tagi wypchnięte do remote

## Memory

**PO**: Dodaj wpis do `.claude/memory/publish-log.md`

## Output

```markdown
## Post-Publish Verification

### Published Packages

| Package | Version | NPM Status |
|---------|---------|------------|
| @tomaszjarosz/react-ui | X.X.X | ✓ Available |
| @tomaszjarosz/react-visualizers | X.X.X | ✓ Available |
| @tomaszjarosz/react-markdown | X.X.X | ✓ Available |
| @tomaszjarosz/react-article | X.X.X | ✓ Available |

### Verification
- [x] NPM pages accessible
- [x] Installation works
- [x] Git tags pushed

### Publish Status: SUCCESS
```
