import { describe, it, expect } from 'vitest';
import {
  ALGORITHM_NAMES,
  ALGORITHM_COMPLEXITIES,
  ALGORITHM_CODE,
  type SortingAlgorithm,
} from './constants';

describe('constants', () => {
  const algorithms: SortingAlgorithm[] = ['bubble', 'selection', 'insertion', 'quick', 'merge'];

  describe('ALGORITHM_NAMES', () => {
    it('should have names for all algorithms', () => {
      algorithms.forEach((alg) => {
        expect(ALGORITHM_NAMES[alg]).toBeDefined();
        expect(typeof ALGORITHM_NAMES[alg]).toBe('string');
        expect(ALGORITHM_NAMES[alg].length).toBeGreaterThan(0);
      });
    });

    it('should have correct display names', () => {
      expect(ALGORITHM_NAMES.bubble).toBe('Bubble Sort');
      expect(ALGORITHM_NAMES.quick).toBe('QuickSort');
      expect(ALGORITHM_NAMES.merge).toBe('MergeSort');
    });
  });

  describe('ALGORITHM_COMPLEXITIES', () => {
    it('should have complexity data for all algorithms', () => {
      algorithms.forEach((alg) => {
        const complexity = ALGORITHM_COMPLEXITIES[alg];
        expect(complexity).toBeDefined();
        expect(complexity.time).toBeDefined();
        expect(complexity.best).toBeDefined();
        expect(complexity.average).toBeDefined();
        expect(complexity.worst).toBeDefined();
        expect(complexity.space).toBeDefined();
        expect(typeof complexity.stable).toBe('boolean');
      });
    });

    it('should have correct O(n²) algorithms', () => {
      const quadraticAlgorithms: SortingAlgorithm[] = ['bubble', 'selection', 'insertion'];
      quadraticAlgorithms.forEach((alg) => {
        expect(ALGORITHM_COMPLEXITIES[alg].average).toBe('O(n²)');
      });
    });

    it('should have correct O(n log n) algorithms', () => {
      const efficientAlgorithms: SortingAlgorithm[] = ['quick', 'merge'];
      efficientAlgorithms.forEach((alg) => {
        expect(ALGORITHM_COMPLEXITIES[alg].average).toBe('O(n log n)');
      });
    });

    it('should correctly mark stable algorithms', () => {
      expect(ALGORITHM_COMPLEXITIES.bubble.stable).toBe(true);
      expect(ALGORITHM_COMPLEXITIES.insertion.stable).toBe(true);
      expect(ALGORITHM_COMPLEXITIES.merge.stable).toBe(true);
      expect(ALGORITHM_COMPLEXITIES.selection.stable).toBe(false);
      expect(ALGORITHM_COMPLEXITIES.quick.stable).toBe(false);
    });

    it('should have correct space complexity', () => {
      // In-place algorithms
      expect(ALGORITHM_COMPLEXITIES.bubble.space).toBe('O(1)');
      expect(ALGORITHM_COMPLEXITIES.selection.space).toBe('O(1)');
      expect(ALGORITHM_COMPLEXITIES.insertion.space).toBe('O(1)');
      // Non in-place
      expect(ALGORITHM_COMPLEXITIES.merge.space).toBe('O(n)');
      expect(ALGORITHM_COMPLEXITIES.quick.space).toBe('O(log n)');
    });

    it('should have valid Big-O notation format', () => {
      const validBigO = /^O\([n²\d\s\w()]+\)$/;
      algorithms.forEach((alg) => {
        const complexity = ALGORITHM_COMPLEXITIES[alg];
        expect(complexity.best).toMatch(validBigO);
        expect(complexity.average).toMatch(validBigO);
        expect(complexity.worst).toMatch(validBigO);
        expect(complexity.space).toMatch(validBigO);
      });
    });
  });

  describe('ALGORITHM_CODE', () => {
    it('should have code for all algorithms', () => {
      algorithms.forEach((alg) => {
        expect(ALGORITHM_CODE[alg]).toBeDefined();
        expect(Array.isArray(ALGORITHM_CODE[alg])).toBe(true);
        expect(ALGORITHM_CODE[alg].length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty code lines', () => {
      algorithms.forEach((alg) => {
        const code = ALGORITHM_CODE[alg];
        // At least some lines should have content
        const nonEmptyLines = code.filter((line) => line.trim().length > 0);
        expect(nonEmptyLines.length).toBeGreaterThan(2);
      });
    });
  });
});
