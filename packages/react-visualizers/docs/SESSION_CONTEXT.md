# Session Context - Interview Mode Visualizers

## Prompt do kontynuacji pracy

```
Kontynuuję pracę nad biblioteką react-visualizers.

## Kontekst projektu

Repozytoria:
- tomaszjarosz-ui: /home/tomasz/repo/tomaszjarosz-ui (monorepo z pakietami npm)
- tomaszjarosz-blog: /home/tomasz/repo/tomaszjarosz-blog (blog używający tych pakietów)

Pakiet: @tomaszjarosz/react-visualizers (aktualnie v0.2.12)
Lokalizacja: /home/tomasz/repo/tomaszjarosz-ui/packages/react-visualizers

## Co zostało zrobione

### Interview Mode System
Dodano system Interview Mode do wizualizatorów - pozwala użytkownikom testować wiedzę podczas oglądania animacji algorytmów. Każdy Interview Visualizer ma przełącznik Visualize/Interview i 10 pytań wielokrotnego wyboru.

### Utworzone Interview Visualizers (10 sztuk):
1. HashMapInterviewVisualizer - hash tables, collisions, load factor
2. TreeSetInterviewVisualizer - BST, Red-Black trees, traversals
3. SortingInterviewVisualizer - QuickSort, MergeSort, stability
4. GraphInterviewVisualizer - BFS, DFS, cycle detection
5. BloomFilterInterviewVisualizer - probabilistic data structures
6. BTreeInterviewVisualizer - database indexes
7. DijkstraInterviewVisualizer - shortest path, priority queue
8. DPInterviewVisualizer - dynamic programming, Knapsack
9. ConsistentHashingInterviewVisualizer - distributed systems
10. RaftInterviewVisualizer - consensus algorithm

### Kluczowe pliki:
- src/shared/useInterviewMode.ts - hook zarządzający stanem quizu
- src/shared/InterviewModePanel.tsx - komponent UI z pytaniami
- src/visualizers/*InterviewVisualizer.tsx - poszczególne wizualizatory
- src/visualizers/stories/InterviewModeVisualizers.stories.tsx - Storybook stories
- docs/INTERVIEW_MODE.md - dokumentacja

### Struktura pytania:
```typescript
{
  id: 'unique-id',
  question: 'What is the time complexity?',
  options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
  correctAnswer: 2, // 0-indexed
  explanation: 'Detailed explanation...',
  hint: 'Optional hint...',
  difficulty: 'easy' | 'medium' | 'hard',
  topic: 'Topic name',
}
```

## Potencjalne następne kroki

1. Więcej Interview Visualizers:
   - BinarySearchInterviewVisualizer
   - LinkedListInterviewVisualizer
   - HeapInterviewVisualizer

2. Ulepszenia Interview Mode:
   - Persystencja wyników w localStorage
   - Tryb egzaminu z limitem czasu
   - Statystyki per topic
   - Export wyników

3. Artykuły do bloga:
   - DSA Cheatsheet articles używające Interview Mode
   - Dokumentacja dla użytkowników

4. Testy:
   - Unit testy dla useInterviewMode hook
   - Testy komponentów

## Komendy

```bash
# Storybook
cd /home/tomasz/repo/tomaszjarosz-ui/packages/react-visualizers
npm run storybook

# Build
npm run build

# Typecheck
npm run typecheck

# Publish
npm version patch && npm publish --access public

# Update w blogu
cd /home/tomasz/repo/tomaszjarosz-blog/frontend
# edytuj package.json z nową wersją
bun pm cache rm && bun install
```
```

## Status

- [x] Interview Mode system (hook + panel)
- [x] 10 Interview Visualizers
- [x] Storybook stories
- [x] Dokumentacja (docs/INTERVIEW_MODE.md)
- [x] Opublikowano v0.2.12
- [x] Zaktualizowano w blogu
- [ ] Testy jednostkowe
- [ ] Więcej wizualizatorów
