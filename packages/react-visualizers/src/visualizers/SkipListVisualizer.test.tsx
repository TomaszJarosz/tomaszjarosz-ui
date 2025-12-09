import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipListVisualizer } from './SkipListVisualizer';

describe('SkipListVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the visualizer with title', () => {
      render(<SkipListVisualizer />);

      // Title appears in both header and info box
      expect(screen.getAllByText('Skip List').length).toBeGreaterThan(0);
    });

    it('renders complexity badges', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByText('O(log n) avg')).toBeInTheDocument();
      expect(screen.getByText('Probabilistic')).toBeInTheDocument();
    });

    it('renders info box with algorithm description', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByText(/Probabilistic data structure/)).toBeInTheDocument();
      expect(screen.getByText(/Multiple layers/)).toBeInTheDocument();
      // "Higher levels skip" appears in both info box and status - use getAllBy
      expect(screen.getAllByText(/Higher levels skip/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Expected O\(log n\)/)).toBeInTheDocument();
    });

    it('renders header node with H label', () => {
      const { container } = render(<SkipListVisualizer />);

      // Header node is rendered as SVG text element
      const svgTexts = container.querySelectorAll('text');
      const headerTexts = Array.from(svgTexts).filter((t) => t.textContent === 'H');
      expect(headerTexts.length).toBeGreaterThan(0);
    });

    it('renders level labels', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByText('L0')).toBeInTheDocument();
      expect(screen.getByText('L1')).toBeInTheDocument();
      expect(screen.getByText('L2')).toBeInTheDocument();
      expect(screen.getByText('L3')).toBeInTheDocument();
    });
  });

  describe('props', () => {
    it('hides controls when showControls is false', () => {
      render(<SkipListVisualizer showControls={false} />);

      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('shows controls by default', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('hides code panel when showCode is false', () => {
      render(<SkipListVisualizer showCode={false} />);

      expect(screen.queryByText('class SkipList:')).not.toBeInTheDocument();
    });

    it('shows code panel by default', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByText('class SkipList:')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<SkipListVisualizer className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('controls', () => {
    it('renders playback controls', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step forward' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });

    it('renders speed slider', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('steps forward when clicking step button', () => {
      render(<SkipListVisualizer />);

      const stepButton = screen.getByRole('button', { name: 'Step forward' });
      fireEvent.click(stepButton);

      // After step, step counter changes (format: "X / Y")
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });
  });

  describe('legend', () => {
    it('renders legend items', () => {
      render(<SkipListVisualizer />);

      // Each label appears in both sr-only and visible span
      expect(screen.getAllByText('Default node').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Current').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Found/Inserted').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Search path').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Update pointers').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('skip list structure', () => {
    it('renders SVG for skip list visualization', () => {
      const { container } = render(<SkipListVisualizer />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders initial nodes with correct values', () => {
      const { container } = render(<SkipListVisualizer />);

      // Initial skip list has nodes: H (header), 3, 6, 7, 9, 12
      // These are SVG text elements, need to query them properly
      const svgTexts = container.querySelectorAll('svg text');
      const textValues = Array.from(svgTexts).map((t) => t.textContent);

      expect(textValues).toContain('3');
      expect(textValues).toContain('6');
      expect(textValues).toContain('7');
      expect(textValues).toContain('9');
      expect(textValues).toContain('12');
    });
  });

  describe('share functionality', () => {
    it('renders share button', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByRole('button', { name: /share|copy/i })).toBeInTheDocument();
    });
  });

  describe('code panel', () => {
    it('displays skip list pseudocode', () => {
      render(<SkipListVisualizer />);

      expect(screen.getByText('class SkipList:')).toBeInTheDocument();
      expect(screen.getByText(/def search\(key\):/)).toBeInTheDocument();
      expect(screen.getByText(/def insert\(key\):/)).toBeInTheDocument();
    });
  });

  describe('status panel', () => {
    it('displays status description', () => {
      render(<SkipListVisualizer />);

      // Initial status message about skip list (appears in both status panel and SVG desc)
      expect(screen.getAllByText(/Skip List with 6 nodes/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows step counter', () => {
      render(<SkipListVisualizer />);

      // Step counter format: "X / Y" (no "Step" prefix after StatusPanel update)
      expect(screen.getByText(/1 \//)).toBeInTheDocument();
    });
  });

  describe('help panel', () => {
    it('renders help panel with code panel', () => {
      render(<SkipListVisualizer showCode={true} />);

      // HelpPanel should be rendered alongside CodePanel
      expect(screen.getByText(/Keyboard shortcuts/i)).toBeInTheDocument();
    });
  });
});
