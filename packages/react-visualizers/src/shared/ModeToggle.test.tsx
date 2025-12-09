import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  const defaultProps = {
    mode: 'visualize' as const,
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders both mode buttons', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /visualize/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /interview/i })).toBeInTheDocument();
    });

    it('shows visualize as selected when mode is visualize', () => {
      render(<ModeToggle {...defaultProps} mode="visualize" />);

      expect(screen.getByRole('tab', { name: /visualize/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /interview/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('shows interview as selected when mode is interview', () => {
      render(<ModeToggle {...defaultProps} mode="interview" />);

      expect(screen.getByRole('tab', { name: /visualize/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /interview/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('applies custom className', () => {
      const { container } = render(<ModeToggle {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('interactions', () => {
    it('calls onModeChange with visualize when clicking visualize', () => {
      const onModeChange = vi.fn();
      render(<ModeToggle {...defaultProps} mode="interview" onModeChange={onModeChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /visualize/i }));

      expect(onModeChange).toHaveBeenCalledWith('visualize');
    });

    it('calls onModeChange with interview when clicking interview', () => {
      const onModeChange = vi.fn();
      render(<ModeToggle {...defaultProps} onModeChange={onModeChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /interview/i }));

      expect(onModeChange).toHaveBeenCalledWith('interview');
    });

    it('does not call onModeChange when disabled', () => {
      const onModeChange = vi.fn();
      render(<ModeToggle {...defaultProps} onModeChange={onModeChange} disabled />);

      fireEvent.click(screen.getByRole('tab', { name: /interview/i }));

      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has tablist role', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('has aria-label for tablist', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Visualization mode');
    });

    it('buttons have tab role', () => {
      render(<ModeToggle {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('buttons have aria-controls', () => {
      render(<ModeToggle {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /visualize/i })).toHaveAttribute('aria-controls', 'visualize-panel');
      expect(screen.getByRole('tab', { name: /interview/i })).toHaveAttribute('aria-controls', 'interview-panel');
    });
  });

  describe('disabled state', () => {
    it('disables both buttons when disabled prop is true', () => {
      render(<ModeToggle {...defaultProps} disabled />);

      expect(screen.getByRole('tab', { name: /visualize/i })).toBeDisabled();
      expect(screen.getByRole('tab', { name: /interview/i })).toBeDisabled();
    });

    it('applies opacity styling when disabled', () => {
      render(<ModeToggle {...defaultProps} disabled />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('opacity-50');
      });
    });
  });
});
