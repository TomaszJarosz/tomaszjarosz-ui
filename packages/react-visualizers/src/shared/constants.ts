/**
 * Shared constants for sorting algorithm visualizers.
 * Centralizes algorithm metadata to avoid duplication.
 */

export type SortingAlgorithm =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'quick'
  | 'merge';

export const ALGORITHM_NAMES: Record<SortingAlgorithm, string> = {
  bubble: 'Bubble Sort',
  selection: 'Selection Sort',
  insertion: 'Insertion Sort',
  quick: 'QuickSort',
  merge: 'MergeSort',
};

export interface AlgorithmComplexity {
  time: string; // Average/typical
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean;
}

export const ALGORITHM_COMPLEXITIES: Record<SortingAlgorithm, AlgorithmComplexity> = {
  bubble: {
    time: 'O(n²)',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
  },
  selection: {
    time: 'O(n²)',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
  },
  insertion: {
    time: 'O(n²)',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
  },
  quick: {
    time: 'O(n log n)',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
  },
  merge: {
    time: 'O(n log n)',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
  },
};

export const ALGORITHM_CODE: Record<SortingAlgorithm, string[]> = {
  bubble: [
    'for (i = 0; i < n-1; i++)',
    '  for (j = 0; j < n-i-1; j++)',
    '    if (arr[j] > arr[j+1])',
    '      swap(arr[j], arr[j+1])',
  ],
  selection: [
    'for (i = 0; i < n-1; i++)',
    '  minIdx = i',
    '  for (j = i+1; j < n; j++)',
    '    if (arr[j] < arr[minIdx])',
    '      minIdx = j',
    '  swap(arr[i], arr[minIdx])',
  ],
  insertion: [
    'for (i = 1; i < n; i++)',
    '  key = arr[i]',
    '  j = i - 1',
    '  while (j >= 0 && arr[j] > key)',
    '    arr[j+1] = arr[j]',
    '    j--',
    '  arr[j+1] = key',
  ],
  quick: [
    'quickSort(arr, low, high)',
    '  if (low < high)',
    '    pi = partition(arr, low, high)',
    '    quickSort(arr, low, pi-1)',
    '    quickSort(arr, pi+1, high)',
  ],
  merge: [
    'mergeSort(arr, l, r)',
    '  if (l < r)',
    '    m = (l + r) / 2',
    '    mergeSort(arr, l, m)',
    '    mergeSort(arr, m+1, r)',
    '    merge(arr, l, m, r)',
  ],
};
