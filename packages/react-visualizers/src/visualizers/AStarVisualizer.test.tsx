import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AStarVisualizer } from './AStarVisualizer';

describe('AStarVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the visualizer with title', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText('A* Pathfinding')).toBeInTheDocument();
    });

    it('renders complexity badges', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText('Time: O(E log V)')).toBeInTheDocument();
      expect(screen.getByText('Optimal Path')).toBeInTheDocument();
    });

    it('renders info box with algorithm description', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText(/f\(n\) = g\(n\) \+ h\(n\)/)).toBeInTheDocument();
      expect(screen.getByText(/Manhattan/)).toBeInTheDocument();
    });

    it('renders start and end markers', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('renders open and closed set counters', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText(/Open:/)).toBeInTheDocument();
      expect(screen.getByText(/Closed:/)).toBeInTheDocument();
    });
  });

  describe('props', () => {
    it('hides controls when showControls is false', () => {
      render(<AStarVisualizer showControls={false} />);

      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('shows controls by default', () => {
      render(<AStarVisualizer />);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('hides code panel when showCode is false', () => {
      render(<AStarVisualizer showCode={false} />);

      expect(screen.queryByText('function A*(start, goal):')).not.toBeInTheDocument();
    });

    it('shows code panel by default', () => {
      render(<AStarVisualizer />);

      expect(screen.getByText('function A*(start, goal):')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<AStarVisualizer className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('controls', () => {
    it('renders playback controls', () => {
      render(<AStarVisualizer />);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step forward' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });

    it('renders speed slider', () => {
      render(<AStarVisualizer />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('steps forward when clicking step button', () => {
      render(<AStarVisualizer />);

      const stepButton = screen.getByRole('button', { name: 'Step forward' });
      fireEvent.click(stepButton);

      // After step, step counter changes
      expect(screen.getByText(/2 \//)).toBeInTheDocument();
    });
  });

  describe('legend', () => {
    it('renders legend items', () => {
      render(<AStarVisualizer />);

      // Each label appears in both sr-only and visible span
      expect(screen.getAllByText('Start').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('End').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Wall').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Open set').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Closed set').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Current').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Path').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('grid', () => {
    it('renders grid cells', () => {
      const { container } = render(<AStarVisualizer />);

      // Grid should have cells with border styling
      const cells = container.querySelectorAll('[class*="border-gray-200"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('share functionality', () => {
    it('renders share button', () => {
      render(<AStarVisualizer />);

      expect(screen.getByRole('button', { name: /share|copy/i })).toBeInTheDocument();
    });
  });

  describe('status panel', () => {
    it('displays status description', () => {
      render(<AStarVisualizer />);

      // Initial status message - check for text that contains "Initialize"
      expect(screen.getAllByText(/Initialize/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows step counter', () => {
      render(<AStarVisualizer />);

      // Step counter format: "X / Y" (no "Step" prefix after StatusPanel update)
      expect(screen.getByText(/1 \//)).toBeInTheDocument();
    });
  });
});
