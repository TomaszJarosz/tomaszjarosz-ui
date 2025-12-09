# TODO - react-visualizers

## Priority 1 - Quick Wins

### [x] ~~Publish v0.2.12~~ → Published v0.2.13

### [x] SortingVisualizer - Complexity Comparison Table ✅
Added collapsible table showing Best/Average/Worst time complexity + Space + Stability for all algorithms.
Includes color-coded badges and highlights current algorithm.

### [x] SQLJoinVisualizer - Venn Diagrams ✅
Added interactive SVG Venn diagrams that dynamically highlight included regions based on JOIN type.
Green = intersection (matched), Cyan = included table regions, Gray = excluded.

---

## Priority 2 - Architecture

### [ ] Migrate SortingVisualizer to useVisualizerPlayback
Complex due to:
- URL state integration
- Custom array input
- Step history feature

Requires extending the hook or creating a wrapper.

### [ ] Migrate SortingComparisonVisualizer to shared ControlPanel
Currently uses custom controls. Needs adaptation for "racing" mode.

### [ ] Standardize Educational Sections
Create shared component for gradient educational boxes:
```tsx
// src/shared/EducationalSection.tsx
interface EducationalSectionProps {
  title: string;
  accentColor: 'indigo' | 'teal' | 'orange' | 'purple' | 'cyan';
  children: React.ReactNode;
}
```

---

## Priority 3 - Features

### [ ] Add URL Sharing to All Visualizers
Visualizers without ShareButton:
- HashTableVisualizer
- DPVisualizer
- DijkstraVisualizer
- GCVisualizer
- BlockingQueueVisualizer
- ConcurrentHashMapVisualizer
- CopyOnWriteVisualizer
- ImmutableCollectionsVisualizer

### [ ] Add Dark Mode Support
- Add `darkMode` prop to all visualizers
- Use Tailwind dark: variants
- Update Storybook with dark mode toggle

### [ ] Add Tests
- Unit tests for step generators (sorting, graph algorithms)
- Component tests with Vitest + Playwright
- Visual regression with Chromatic (already configured)

---

## Priority 4 - New Visualizers

### [ ] Red-Black Tree Visualizer
- Show rotations and recoloring
- Insert/delete operations
- Balance visualization

### [ ] A* Pathfinding Visualizer
- Grid-based visualization
- Show open/closed sets
- Compare with Dijkstra

### [ ] Trie Visualizer
- Word insertion/search
- Prefix matching
- Autocomplete demo

### [ ] B-Tree Visualizer
- Node splitting
- Key insertion/deletion
- Disk-based storage explanation

---

## Completed

- [x] Setup Storybook
- [x] Deploy to Chromatic
- [x] Fix SortingComparisonVisualizer props
- [x] Migrate HashTableVisualizer to hook
- [x] Migrate DPVisualizer to hook
- [x] Migrate DijkstraVisualizer to hook
- [x] Create PUBLISHING.md documentation
- [x] Create VISUALIZER_REVIEW.md audit
- [x] Update README.md with all 36 visualizers (Dec 2024)
- [x] Add complexity comparison table to SortingVisualizer (Dec 2024)
- [x] Add Venn diagrams to SQLJoinVisualizer (Dec 2024)
- [x] Export Tailwind CSS as `styles.css` (v0.2.13)

---

## Commands Reference

```bash
# Development
pnpm run storybook      # Run Storybook locally
pnpm run build          # Build library
pnpm run typecheck      # TypeScript check

# Publishing
npm version patch       # Bump version
pnpm publish --access public  # Publish to npm
git push origin main    # Trigger Chromatic

# Testing
pnpm run test           # Run tests (when added)
```

---

## Links

- **npm:** https://www.npmjs.com/package/@tomaszjarosz/react-visualizers
- **Storybook:** https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/
- **GitHub:** https://github.com/TomaszJarosz/tomaszjarosz-ui
