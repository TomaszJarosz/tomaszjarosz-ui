# TODO - react-visualizers

## Priority 1 - Quick Wins

### [ ] Publish v0.2.12
```bash
npm version patch
pnpm publish --access public
```

### [ ] SortingVisualizer - Add Complexity Table
Add educational section comparing algorithm complexities:
```tsx
<div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200">
  <div className="text-sm font-bold text-indigo-800 mb-3">Algorithm Complexity</div>
  <table className="w-full text-xs">
    <thead>
      <tr><th>Algorithm</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th></tr>
    </thead>
    <tbody>
      <tr><td>Bubble</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
      <tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
      <tr><td>Insertion</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td></tr>
      <tr><td>QuickSort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td></tr>
      <tr><td>MergeSort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td></tr>
    </tbody>
  </table>
</div>
```
**File:** `src/visualizers/SortingVisualizer.tsx`

### [ ] SQLJoinVisualizer - Add Venn Diagrams
Add ASCII/SVG Venn diagrams for JOIN types:
```
INNER JOIN:     LEFT JOIN:      RIGHT JOIN:     FULL JOIN:
   ┌───┬───┐      ████┬───┐      ┌───┬████       ████┬████
   │   │███│      ████│███│      │███│████       ████│████
   └───┴───┘      ████┴───┘      └───┴████       ████┴████
```
**File:** `src/visualizers/SQLJoinVisualizer.tsx`

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
