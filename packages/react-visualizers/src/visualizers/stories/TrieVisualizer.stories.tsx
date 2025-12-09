import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrieVisualizer } from '../TrieVisualizer';

const meta: Meta<typeof TrieVisualizer> = {
  title: 'Data Structures/Trie',
  component: TrieVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Trie (Prefix Tree)

A tree-like data structure for efficient string operations.

## Use Cases
- Autocomplete suggestions
- Spell checking
- IP routing (longest prefix match)
- Word games (Scrabble, Boggle)

## Complexity
- Insert: O(m) where m = word length
- Search: O(m)
- Prefix search: O(m + k) where k = matches
- Space: O(n * m) worst case

## Features
- Shared prefixes reduce memory
- Fast prefix-based searches
- Supports wildcard matching
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TrieVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const WithoutCode: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
};

export const Minimal: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
};
