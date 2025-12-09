import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterviewModePanel } from './InterviewModePanel';
import type { InterviewQuestion } from './useInterviewMode';

describe('InterviewModePanel', () => {
  const mockQuestion: InterviewQuestion = {
    id: 'q1',
    question: 'What is the average time complexity of HashMap get()?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'HashMap provides O(1) average case due to hash function.',
    difficulty: 'medium',
    topic: 'time-complexity',
    hint: 'Think about how hash functions work.',
  };

  const defaultProps = {
    currentQuestion: mockQuestion,
    currentQuestionIndex: 0,
    totalQuestions: 5,
    selectedAnswer: null,
    showExplanation: false,
    showHint: false,
    isAnswered: false,
    isComplete: false,
    score: { correct: 0, total: 0, percentage: 0 },
    onSelectAnswer: vi.fn(),
    onNextQuestion: vi.fn(),
    onPreviousQuestion: vi.fn(),
    onUseHint: vi.fn(),
    onRestart: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('question display', () => {
    it('renders question text', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText(/What is the average time complexity/)).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('O(1)')).toBeInTheDocument();
      expect(screen.getByText('O(n)')).toBeInTheDocument();
      expect(screen.getByText('O(log n)')).toBeInTheDocument();
      expect(screen.getByText('O(n²)')).toBeInTheDocument();
    });

    it('renders option labels (A, B, C, D)', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('displays question number and total', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('Question 1 / 5')).toBeInTheDocument();
    });

    it('displays difficulty badge', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('displays topic badge', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('time-complexity')).toBeInTheDocument();
    });

    it('displays score', () => {
      render(<InterviewModePanel {...defaultProps} score={{ correct: 3, total: 4, percentage: 75 }} />);

      expect(screen.getByText('Score: 3/4')).toBeInTheDocument();
    });
  });

  describe('answer selection', () => {
    it('calls onSelectAnswer when option clicked', () => {
      render(<InterviewModePanel {...defaultProps} />);

      fireEvent.click(screen.getByText('O(n)'));
      expect(defaultProps.onSelectAnswer).toHaveBeenCalledWith(1);
    });

    it('does not call onSelectAnswer when already answered', () => {
      render(<InterviewModePanel {...defaultProps} isAnswered={true} />);

      fireEvent.click(screen.getByText('O(n)'));
      expect(defaultProps.onSelectAnswer).not.toHaveBeenCalled();
    });
  });

  describe('explanation display', () => {
    it('shows explanation after answering correctly', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          selectedAnswer={0}
          showExplanation={true}
          isAnswered={true}
        />
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText(/HashMap provides O\(1\) average case/)).toBeInTheDocument();
    });

    it('shows explanation after answering incorrectly', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          selectedAnswer={1}
          showExplanation={true}
          isAnswered={true}
        />
      );

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText(/HashMap provides O\(1\) average case/)).toBeInTheDocument();
    });
  });

  describe('hint functionality', () => {
    it('shows hint button when hint available and not showing', () => {
      render(<InterviewModePanel {...defaultProps} />);

      expect(screen.getByText('Show hint')).toBeInTheDocument();
    });

    it('calls onUseHint when hint button clicked', () => {
      render(<InterviewModePanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Show hint'));
      expect(defaultProps.onUseHint).toHaveBeenCalledTimes(1);
    });

    it('shows hint text when showHint is true', () => {
      render(<InterviewModePanel {...defaultProps} showHint={true} />);

      expect(screen.getByText('Hint')).toBeInTheDocument();
      expect(screen.getByText('Think about how hash functions work.')).toBeInTheDocument();
    });

    it('hides hint button when explanation is shown', () => {
      render(<InterviewModePanel {...defaultProps} showExplanation={true} />);

      expect(screen.queryByText('Show hint')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('calls onNextQuestion when Next clicked', () => {
      render(<InterviewModePanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Next'));
      expect(defaultProps.onNextQuestion).toHaveBeenCalledTimes(1);
    });

    it('calls onPreviousQuestion when Previous clicked', () => {
      render(<InterviewModePanel {...defaultProps} currentQuestionIndex={1} />);

      fireEvent.click(screen.getByText('Previous'));
      expect(defaultProps.onPreviousQuestion).toHaveBeenCalledTimes(1);
    });

    it('disables Previous on first question', () => {
      render(<InterviewModePanel {...defaultProps} currentQuestionIndex={0} />);

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toHaveClass('cursor-not-allowed');
    });

    it('shows Finish on last question', () => {
      render(<InterviewModePanel {...defaultProps} currentQuestionIndex={4} totalQuestions={5} />);

      expect(screen.getByText('Finish')).toBeInTheDocument();
    });
  });

  describe('completion screen', () => {
    it('shows completion screen when isComplete', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          isComplete={true}
          score={{ correct: 4, total: 5, percentage: 80 }}
        />
      );

      expect(screen.getByText('Interview Complete!')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('4 / 5 correct')).toBeInTheDocument();
    });

    it('shows excellent message for high score', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          isComplete={true}
          score={{ correct: 5, total: 5, percentage: 100 }}
        />
      );

      expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    });

    it('shows good message for medium score', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          isComplete={true}
          score={{ correct: 3, total: 5, percentage: 60 }}
        />
      );

      expect(screen.getByText(/Good job/)).toBeInTheDocument();
    });

    it('shows review message for low score', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          isComplete={true}
          score={{ correct: 2, total: 5, percentage: 40 }}
        />
      );

      expect(screen.getByText(/Review the concepts/)).toBeInTheDocument();
    });

    it('calls onRestart when Try Again clicked', () => {
      render(
        <InterviewModePanel
          {...defaultProps}
          isComplete={true}
          score={{ correct: 3, total: 5, percentage: 60 }}
        />
      );

      fireEvent.click(screen.getByText('Try Again'));
      expect(defaultProps.onRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('no questions state', () => {
    it('shows message when no question available', () => {
      render(<InterviewModePanel {...defaultProps} currentQuestion={null} />);

      expect(screen.getByText('No questions available')).toBeInTheDocument();
    });
  });

  describe('difficulty colors', () => {
    it('shows green for easy difficulty', () => {
      const easyQuestion = { ...mockQuestion, difficulty: 'easy' as const };
      const { container } = render(
        <InterviewModePanel {...defaultProps} currentQuestion={easyQuestion} />
      );

      const badge = container.querySelector('.bg-green-100');
      expect(badge).toBeInTheDocument();
    });

    it('shows yellow for medium difficulty', () => {
      const { container } = render(<InterviewModePanel {...defaultProps} />);

      const badge = container.querySelector('.bg-yellow-100');
      expect(badge).toBeInTheDocument();
    });

    it('shows red for hard difficulty', () => {
      const hardQuestion = { ...mockQuestion, difficulty: 'hard' as const };
      const { container } = render(
        <InterviewModePanel {...defaultProps} currentQuestion={hardQuestion} />
      );

      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('accent colors', () => {
    const colors = ['indigo', 'green', 'purple', 'orange', 'blue', 'cyan'] as const;

    colors.forEach((color) => {
      it(`applies ${color} accent color to progress bar`, () => {
        const { container } = render(
          <InterviewModePanel {...defaultProps} accentColor={color} />
        );

        const progressBar = container.querySelector(`.bg-${color}-500`);
        expect(progressBar).toBeInTheDocument();
      });
    });
  });
});
