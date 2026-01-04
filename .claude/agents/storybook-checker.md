# Storybook Checker Agent

> Sprawdza Storybook dla react-visualizers.

## Trigger

```
/storybook check
```

## Checklist

### 1. Build Storybook

```bash
cd packages/react-visualizers
npm run build-storybook
```

- [ ] Build zakończony sukcesem
- [ ] Brak błędów

### 2. Run Storybook Locally

```bash
cd packages/react-visualizers
npm run storybook
# Opens on http://localhost:6006
```

- [ ] Storybook uruchamia się
- [ ] Wszystkie stories ładują się

### 3. Check Stories

Sprawdź czy wszystkie komponenty mają stories:

```bash
ls packages/react-visualizers/src/**/*.stories.tsx 2>/dev/null
```

- [ ] Każdy komponent ma story

### 4. Chromatic (CI)

```bash
# Requires CHROMATIC_TOKEN
npx chromatic --project-token=$CHROMATIC_TOKEN
```

- [ ] Visual tests passing
- [ ] No unexpected changes

## Output

```markdown
## Storybook Report

### Build
- Status: PASS/FAIL
- Time: Xs

### Stories
| Component | Story | Status |
|-----------|-------|--------|
| Visualizer1 | ✓ | Working |
| Visualizer2 | ✓ | Working |

### Chromatic
- Visual tests: X passed
- Changes detected: X

### Storybook Status: PASS/FAIL
```
