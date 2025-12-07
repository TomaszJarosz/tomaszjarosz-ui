# Publishing Guide

This document describes how to publish new versions of `@tomaszjarosz/react-visualizers` and how the CI/CD pipeline works.

## Quick Reference

```bash
# 1. Make your changes
# 2. Build and test
pnpm run build
pnpm run typecheck

# 3. Bump version
npm version patch   # or minor/major

# 4. Commit and push
git add .
git commit -m "Your changes description"
git push origin main

# 5. Publish to npm
pnpm publish --access public
```

---

## Detailed Workflow

### 1. Development

```bash
# Run Storybook locally
pnpm run storybook

# Build the library
pnpm run build

# Type check
pnpm run typecheck

# Lint
pnpm run lint
```

### 2. Version Bumping

Use semantic versioning (semver):

| Change Type | Command | Example |
|-------------|---------|---------|
| Bug fixes | `npm version patch` | 0.2.10 → 0.2.11 |
| New features (backward compatible) | `npm version minor` | 0.2.10 → 0.3.0 |
| Breaking changes | `npm version major` | 0.2.10 → 1.0.0 |

```bash
# Bump version (updates package.json automatically)
npm version patch
```

### 3. Committing Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### 4. Publishing to npm

```bash
# Ensure you're logged in
npm whoami

# If not logged in
npm login

# Publish (scoped package needs --access public)
pnpm publish --access public
```

**Important:** pnpm requires clean git working tree. Either:
- Commit all changes before publishing
- Use `pnpm publish --no-git-checks` (not recommended)

---

## CI/CD Pipeline

### Chromatic (Storybook Hosting)

**Trigger:** Push to `main`/`master` or PR with changes in `packages/react-visualizers/**`

**What happens:**
1. GitHub Actions workflow `.github/workflows/chromatic.yml` runs
2. Builds Storybook
3. Uploads to Chromatic
4. Creates visual diff snapshots
5. Updates hosted Storybook at: https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/

**Configuration:**
- Project token stored in GitHub Secrets: `CHROMATIC_PROJECT_TOKEN`
- Workflow file: `.github/workflows/chromatic.yml`

### npm Publishing

**Manual process** - not automated in CI/CD.

To automate npm publishing, you could add a workflow:

```yaml
# .github/workflows/publish.yml (example, not implemented)
name: Publish to npm
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Troubleshooting

### npm "Cannot read properties of null" error

npm v11+ has known issues. Use pnpm instead:

```bash
# Instead of npm version patch
# Edit package.json manually, then:
pnpm publish --access public
```

### Unclean working tree error

```bash
# Option 1: Commit changes first
git add .
git commit -m "Changes"
pnpm publish --access public

# Option 2: Skip git checks (not recommended)
pnpm publish --access public --no-git-checks
```

### Chromatic not updating

1. Check GitHub Actions tab for workflow status
2. Verify `CHROMATIC_PROJECT_TOKEN` secret is set
3. Ensure changes are in `packages/react-visualizers/**` path

---

## File Structure

```
packages/react-visualizers/
├── .storybook/           # Storybook configuration
│   ├── main.ts           # Storybook + Tailwind setup
│   ├── preview.ts        # Global decorators
│   └── storybook.css     # Tailwind import
├── src/
│   ├── visualizers/      # Visualizer components
│   │   └── stories/      # Storybook story files
│   ├── shared/           # Shared components & hooks
│   └── index.ts          # Public exports
├── dist/                 # Build output (git-ignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md             # npm package readme
├── PUBLISHING.md         # This file
└── VISUALIZER_REVIEW.md  # Audit document
```

---

## Links

- **npm Package:** https://www.npmjs.com/package/@tomaszjarosz/react-visualizers
- **Storybook (Chromatic):** https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/
- **GitHub Repository:** https://github.com/TomaszJarosz/tomaszjarosz-ui

---

## Checklist for New Release

- [ ] All changes tested locally in Storybook
- [ ] `pnpm run build` passes
- [ ] `pnpm run typecheck` passes
- [ ] Version bumped appropriately (patch/minor/major)
- [ ] Changes committed with descriptive message
- [ ] Pushed to `main` branch
- [ ] Published to npm with `pnpm publish --access public`
- [ ] Verify Chromatic updated (check GitHub Actions)
- [ ] Verify npm package updated: `npm view @tomaszjarosz/react-visualizers version`
