import { useCallback } from 'react';

/**
 * Hook that provides a function to smoothly scroll to a section by ID
 * @param offset - Offset from top in pixels (default: 80 for navbar height)
 * @returns Function to scroll to a section by ID
 */
export const useScrollToSection = (offset: number = 80) => {
  const scrollToSection = useCallback(
    (sectionId: string, behavior: ScrollBehavior = 'smooth') => {
      const element = document.getElementById(sectionId);
      if (!element) return;

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior,
      });
    },
    [offset]
  );

  return scrollToSection;
};
