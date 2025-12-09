import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseVisualizerLayout } from './BaseVisualizerLayout';

describe('BaseVisualizerLayout', () => {
  const defaultProps = {
    id: 'test-visualizer',
    title: 'Test Visualizer',
    children: <div data-testid="visualization">Visualization Content</div>,
  };

  describe('rendering', () => {
    it('renders with required props', () => {
      render(<BaseVisualizerLayout {...defaultProps} />);

      expect(screen.getByText('Test Visualizer')).toBeInTheDocument();
      expect(screen.getByTestId('visualization')).toBeInTheDocument();
    });

    it('renders badges', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          badges={[
            { label: 'O(1)', variant: 'green' },
            { label: 'Stable', variant: 'blue' },
          ]}
        />
      );

      expect(screen.getByText('O(1)')).toBeInTheDocument();
      expect(screen.getByText('Stable')).toBeInTheDocument();
    });

    it('renders info box when provided', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          infoBox={<div data-testid="info-box">Algorithm Info</div>}
        />
      );

      expect(screen.getByTestId('info-box')).toBeInTheDocument();
    });

    it('renders status panel when status prop provided', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          status={{
            description: 'Processing step 1',
            currentStep: 0,
            totalSteps: 10,
          }}
        />
      );

      expect(screen.getByText('Processing step 1')).toBeInTheDocument();
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });

    it('renders legend items', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          legendItems={[
            { color: 'bg-green-500', label: 'Current' },
            { color: 'bg-blue-500', label: 'Visited' },
          ]}
        />
      );

      expect(screen.getAllByText('Current').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Visited').length).toBeGreaterThanOrEqual(1);
    });

    it('renders code panel when code provided', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          code={['function test() {', '  return true;', '}']}
          currentCodeLine={1}
          showCode={true}
        />
      );

      expect(screen.getByText('function test() {')).toBeInTheDocument();
    });

    it('hides code panel when showCode is false', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          code={['function test() {']}
          showCode={false}
        />
      );

      expect(screen.queryByText('function test() {')).not.toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('renders control panel when controls prop provided', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          controls={{
            isPlaying: false,
            currentStep: 0,
            totalSteps: 10,
            speed: 50,
            onPlayPause: vi.fn(),
            onStep: vi.fn(),
            onStepBack: vi.fn(),
            onReset: vi.fn(),
            onSpeedChange: vi.fn(),
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('hides controls when showControls is false', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          showControls={false}
          controls={{
            isPlaying: false,
            currentStep: 0,
            totalSteps: 10,
            speed: 50,
            onPlayPause: vi.fn(),
            onStep: vi.fn(),
            onStepBack: vi.fn(),
            onReset: vi.fn(),
            onSpeedChange: vi.fn(),
          }}
        />
      );

      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });
  });

  describe('side panel', () => {
    it('renders custom side panel', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          sidePanel={<div data-testid="side-panel">Side Content</div>}
        />
      );

      expect(screen.getByTestId('side-panel')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has region role', () => {
      render(<BaseVisualizerLayout {...defaultProps} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('has aria-label matching title', () => {
      render(<BaseVisualizerLayout {...defaultProps} />);

      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Test Visualizer');
    });

    it('has correct id', () => {
      const { container } = render(<BaseVisualizerLayout {...defaultProps} />);

      expect(container.querySelector('#test-visualizer')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <BaseVisualizerLayout {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies gradient based on prop', () => {
      const { container } = render(
        <BaseVisualizerLayout {...defaultProps} gradient="orange" />
      );

      // Header should have orange gradient
      const header = container.querySelector('.from-orange-50');
      expect(header).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('renders footer content', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          footer={<div data-testid="footer">Footer Content</div>}
        />
      );

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('header extra', () => {
    it('renders headerExtra content', () => {
      render(
        <BaseVisualizerLayout
          {...defaultProps}
          headerExtra={<button>Mode Toggle</button>}
        />
      );

      expect(screen.getByRole('button', { name: 'Mode Toggle' })).toBeInTheDocument();
    });
  });
});
