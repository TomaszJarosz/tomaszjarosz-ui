import React from 'react';

/**
 * Extract text content from React children recursively
 */
const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';

  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }

  if (React.isValidElement(children)) {
    return extractTextFromChildren(children.props.children);
  }

  return '';
};

/**
 * Create a URL-safe slug from text
 */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Creates a heading ID generator that tracks seen IDs to ensure uniqueness
 * This is important because the same heading text might appear multiple times
 *
 * @example
 * const generateId = createHeadingIdGenerator();
 * generateId('Introduction'); // 'introduction'
 * generateId('Introduction'); // 'introduction-1'
 * generateId('Introduction'); // 'introduction-2'
 */
export const createHeadingIdGenerator = () => {
  const seenIds = new Map<string, number>();

  return (children: React.ReactNode): string => {
    const text = extractTextFromChildren(children);
    const baseId = slugify(text) || 'heading';

    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);

    return count === 0 ? baseId : `${baseId}-${count}`;
  };
};

/**
 * Simple one-off heading ID generation (without uniqueness tracking)
 * Use this when you don't need to worry about duplicate headings
 */
export const generateHeadingId = (children: React.ReactNode): string => {
  const text = extractTextFromChildren(children);
  return slugify(text) || 'heading';
};
