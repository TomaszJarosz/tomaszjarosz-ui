import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'article_bookmarks_';

/**
 * Hook for managing section bookmarks within an article
 * Bookmarks are stored in localStorage per article slug
 */
export const useBookmarks = (articleSlug: string | undefined) => {
  const loadBookmarks = (slug: string): Set<string> => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  };

  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (!articleSlug) return new Set();
    return loadBookmarks(articleSlug);
  });

  const currentSlugRef = useRef(articleSlug);
  const isInitializedRef = useRef(false);
  const justLoadedRef = useRef(true);

  // Reload bookmarks when article changes
  useEffect(() => {
    if (articleSlug !== currentSlugRef.current) {
      currentSlugRef.current = articleSlug;
      isInitializedRef.current = false;
      justLoadedRef.current = true;
      if (articleSlug) {
        setBookmarks(loadBookmarks(articleSlug));
      } else {
        setBookmarks(new Set());
      }
    }
    isInitializedRef.current = true;
  }, [articleSlug]);

  // Save bookmarks to localStorage
  useEffect(() => {
    if (!articleSlug || !isInitializedRef.current) return;

    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }

    try {
      const array = Array.from(bookmarks);
      if (array.length > 0) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${articleSlug}`, JSON.stringify(array));
      } else {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${articleSlug}`);
      }
    } catch {
      // Ignore storage errors
    }
  }, [articleSlug, bookmarks]);

  const toggleBookmark = useCallback((sectionId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (sectionId: string) => bookmarks.has(sectionId),
    [bookmarks]
  );

  const clearAllBookmarks = useCallback(() => {
    setBookmarks(new Set());
  }, []);

  const addBookmark = useCallback((sectionId: string) => {
    setBookmarks((prev) => new Set([...prev, sectionId]));
  }, []);

  const removeBookmark = useCallback((sectionId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  return {
    bookmarks: Array.from(bookmarks),
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
    addBookmark,
    removeBookmark,
    bookmarkCount: bookmarks.size,
  };
};
