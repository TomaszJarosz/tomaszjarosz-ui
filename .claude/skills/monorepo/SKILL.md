# Monorepo Skill

> Wiedza o zarządzaniu monorepo z Turborepo i Changesets.

## Stack

- **Turborepo** - monorepo build system
- **Changesets** - versioning i changelog
- **Bun** - package manager

## Struktura

```
tomaszjarosz-ui/
├── packages/
│   ├── react-ui/
│   ├── react-visualizers/
│   ├── react-markdown/
│   └── react-article/
├── .changeset/
│   └── config.json
├── turbo.json
├── package.json
└── bun.lockb
```

## Turborepo

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

### Komendy

```bash
# Build wszystko
bun run build
# lub
turbo run build

# Build jeden package
bun run build --filter=@tomaszjarosz/react-ui

# Parallel builds
turbo run build test lint
```

## Changesets

### Workflow

1. **Dodaj changeset** po zmianach:
```bash
bunx changeset
# Wybierz packages
# Wybierz bump type (patch/minor/major)
# Napisz opis zmiany
```

2. **Version bump** (przed release):
```bash
bunx changeset version
# Automatycznie:
# - Bump versions w package.json
# - Generuje CHANGELOG.md
```

3. **Publish** na npm:
```bash
bunx changeset publish
# Publikuje wszystkie packages z nowymi wersjami
```

### config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main"
}
```

## NPM Publishing

### Wymagania

1. npm account z 2FA
2. `npm login`
3. `NPM_TOKEN` w GitHub secrets (dla CI)

### Manual publish

```bash
# Build first
bun run build

# Publish
cd packages/react-ui
npm publish --access public
```

### CI/CD publish

GitHub Actions z Changesets Action:

```yaml
- uses: changesets/action@v1
  with:
    publish: bunx changeset publish
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Storybook

Tylko dla react-visualizers:

```bash
cd packages/react-visualizers
npm run storybook
```

Chromatic dla visual testing:

```bash
npx chromatic --project-token=$CHROMATIC_TOKEN
```

## Best Practices

1. **Niezależne wersje**: Każdy package ma własną wersję
2. **Changesets**: Zawsze dodawaj changeset przed PR
3. **Build order**: Turborepo automatycznie resolve dependencies
4. **Caching**: Turborepo cache przyspiesza buildy
5. **CI/CD**: Użyj Changesets Action dla automatycznej publikacji
