import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';

describe('ControlPanel', () => {
  const defaultProps = {
    isPlaying: false,
    currentStep: 0,
    totalSteps: 10,
    speed: 50,
    onPlayPause: vi.fn(),
    onStep: vi.fn(),
    onStepBack: vi.fn(),
    onReset: vi.fn(),
    onSpeedChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all control buttons', () => {
      render(<ControlPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Step forward' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });

    it('renders speed slider', () => {
      render(<ControlPanel {...defaultProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('50');
    });

    it('shows Playing indicator when playing', () => {
      render(<ControlPanel {...defaultProps} isPlaying={true} />);

      expect(screen.getByText('Playing')).toBeInTheDocument();
    });

    it('does not show Playing indicator when paused', () => {
      render(<ControlPanel {...defaultProps} isPlaying={false} />);

      expect(screen.queryByText('Playing')).not.toBeInTheDocument();
    });

    it('renders shuffle button when showShuffle is true', () => {
      const onShuffle = vi.fn();
      render(
        <ControlPanel {...defaultProps} showShuffle={true} onShuffle={onShuffle} />
      );

      expect(screen.getByRole('button', { name: 'Shuffle' })).toBeInTheDocument();
    });

    it('renders shuffle button with custom label', () => {
      const onShuffle = vi.fn();
      render(
        <ControlPanel
          {...defaultProps}
          showShuffle={true}
          onShuffle={onShuffle}
          shuffleLabel="New Array"
        />
      );

      expect(screen.getByText('New Array')).toBeInTheDocument();
    });

    it('renders extra controls when provided', () => {
      render(
        <ControlPanel
          {...defaultProps}
          extraControls={<button>Custom Button</button>}
        />
      );

      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onPlayPause when play button clicked', () => {
      render(<ControlPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      expect(defaultProps.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('calls onStep when step forward clicked', () => {
      render(<ControlPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
      expect(defaultProps.onStep).toHaveBeenCalledTimes(1);
    });

    it('calls onStepBack when step back clicked', () => {
      render(<ControlPanel {...defaultProps} currentStep={5} />);

      fireEvent.click(screen.getByRole('button', { name: 'Step back' }));
      expect(defaultProps.onStepBack).toHaveBeenCalledTimes(1);
    });

    it('calls onReset when reset clicked', () => {
      render(<ControlPanel {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('calls onSpeedChange when speed slider changed', () => {
      render(<ControlPanel {...defaultProps} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '75' } });

      expect(defaultProps.onSpeedChange).toHaveBeenCalledWith(75);
    });

    it('calls onShuffle when shuffle button clicked', () => {
      const onShuffle = vi.fn();
      render(
        <ControlPanel {...defaultProps} showShuffle={true} onShuffle={onShuffle} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Shuffle' }));
      expect(onShuffle).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled states', () => {
    it('disables step back at first step', () => {
      render(<ControlPanel {...defaultProps} currentStep={0} />);

      expect(screen.getByRole('button', { name: 'Step back' })).toBeDisabled();
    });

    it('enables step back when not at first step', () => {
      render(<ControlPanel {...defaultProps} currentStep={5} />);

      expect(screen.getByRole('button', { name: 'Step back' })).not.toBeDisabled();
    });

    it('disables step forward at last step', () => {
      render(<ControlPanel {...defaultProps} currentStep={9} totalSteps={10} />);

      expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
    });

    it('enables step forward when not at last step', () => {
      render(<ControlPanel {...defaultProps} currentStep={5} totalSteps={10} />);

      expect(screen.getByRole('button', { name: 'Step forward' })).not.toBeDisabled();
    });

    it('disables step buttons when playing', () => {
      render(<ControlPanel {...defaultProps} isPlaying={true} currentStep={5} />);

      expect(screen.getByRole('button', { name: 'Step back' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
    });

    it('disables shuffle when playing', () => {
      const onShuffle = vi.fn();
      render(
        <ControlPanel
          {...defaultProps}
          isPlaying={true}
          showShuffle={true}
          onShuffle={onShuffle}
        />
      );

      expect(screen.getByRole('button', { name: 'Shuffle' })).toBeDisabled();
    });
  });

  describe('accent colors', () => {
    const colors = [
      'indigo',
      'orange',
      'green',
      'purple',
      'blue',
      'cyan',
      'red',
      'lime',
      'teal',
      'violet',
    ] as const;

    colors.forEach((color) => {
      it(`applies ${color} accent color`, () => {
        render(<ControlPanel {...defaultProps} accentColor={color} />);

        const playButton = screen.getByRole('button', { name: 'Play' });
        expect(playButton.className).toContain(color);
      });
    });
  });

  describe('accessibility', () => {
    it('has toolbar role with label', () => {
      render(<ControlPanel {...defaultProps} />);

      expect(screen.getByRole('toolbar', { name: 'Playback controls' })).toBeInTheDocument();
    });

    it('has aria-pressed on play/pause button', () => {
      const { rerender } = render(<ControlPanel {...defaultProps} isPlaying={false} />);

      expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-pressed', 'false');

      rerender(<ControlPanel {...defaultProps} isPlaying={true} />);

      expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('has aria-labelledby on speed slider', () => {
      render(<ControlPanel {...defaultProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-labelledby');
    });
  });
});
