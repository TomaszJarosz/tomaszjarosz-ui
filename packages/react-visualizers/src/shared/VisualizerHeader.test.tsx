import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualizerHeader } from './VisualizerHeader';

describe('VisualizerHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(<VisualizerHeader title="Test Visualizer" />);

      expect(screen.getByText('Test Visualizer')).toBeInTheDocument();
    });

    it('renders badges when provided', () => {
      render(
        <VisualizerHeader
          title="Test"
          badges={[
            { label: 'O(1)', variant: 'green' },
            { label: 'O(n)', variant: 'orange' },
          ]}
        />
      );

      expect(screen.getByText('O(1)')).toBeInTheDocument();
      expect(screen.getByText('O(n)')).toBeInTheDocument();
    });

    it('renders share button when onShare provided', () => {
      const onShare = vi.fn().mockResolvedValue(true);
      render(<VisualizerHeader title="Test" onShare={onShare} />);

      expect(screen.getByRole('button', { name: /share|copy/i })).toBeInTheDocument();
    });

    it('hides share button when showShare is false', () => {
      const onShare = vi.fn().mockResolvedValue(true);
      render(<VisualizerHeader title="Test" onShare={onShare} showShare={false} />);

      expect(screen.queryByRole('button', { name: /share|copy/i })).not.toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <VisualizerHeader title="Test">
          <button>Custom Button</button>
        </VisualizerHeader>
      );

      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument();
    });
  });

  describe('gradients', () => {
    const gradients = [
      { gradient: 'orange', expected: 'from-orange-50' },
      { gradient: 'green', expected: 'from-green-50' },
      { gradient: 'indigo', expected: 'from-indigo-50' },
      { gradient: 'blue', expected: 'from-blue-50' },
      { gradient: 'purple', expected: 'from-purple-50' },
    ] as const;

    it.each(gradients)('applies $gradient gradient correctly', ({ gradient, expected }) => {
      const { container } = render(<VisualizerHeader title="Test" gradient={gradient} />);

      const header = container.firstChild;
      expect(header).toHaveClass(expected);
    });

    it('uses indigo gradient by default', () => {
      const { container } = render(<VisualizerHeader title="Test" />);

      expect(container.firstChild).toHaveClass('from-indigo-50');
    });
  });

  describe('share functionality', () => {
    it('calls onShare when share button clicked', async () => {
      const onShare = vi.fn().mockResolvedValue(true);
      render(<VisualizerHeader title="Test" onShare={onShare} />);

      const shareButton = screen.getByRole('button', { name: /share|copy/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(onShare).toHaveBeenCalledTimes(1);
      });
    });
  });
});
