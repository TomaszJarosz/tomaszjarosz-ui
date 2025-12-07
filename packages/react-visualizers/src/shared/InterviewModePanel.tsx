import React from 'react';
import { CheckCircle, XCircle, Lightbulb, ChevronLeft, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import type { InterviewQuestion, InterviewSession } from './useInterviewMode';

interface InterviewModePanelProps {
  currentQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  showHint: boolean;
  isAnswered: boolean;
  isComplete: boolean;
  score: { correct: number; total: number; percentage: number };
  onSelectAnswer: (index: number) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onUseHint: () => void;
  onRestart: () => void;
  accentColor?: 'indigo' | 'green' | 'purple' | 'orange' | 'blue' | 'cyan';
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const ACCENT_COLORS = {
  indigo: {
    button: 'bg-indigo-500 hover:bg-indigo-600',
    buttonOutline: 'border-indigo-500 text-indigo-600 hover:bg-indigo-50',
    progress: 'bg-indigo-500',
    ring: 'ring-indigo-500',
  },
  green: {
    button: 'bg-green-500 hover:bg-green-600',
    buttonOutline: 'border-green-500 text-green-600 hover:bg-green-50',
    progress: 'bg-green-500',
    ring: 'ring-green-500',
  },
  purple: {
    button: 'bg-purple-500 hover:bg-purple-600',
    buttonOutline: 'border-purple-500 text-purple-600 hover:bg-purple-50',
    progress: 'bg-purple-500',
    ring: 'ring-purple-500',
  },
  orange: {
    button: 'bg-orange-500 hover:bg-orange-600',
    buttonOutline: 'border-orange-500 text-orange-600 hover:bg-orange-50',
    progress: 'bg-orange-500',
    ring: 'ring-orange-500',
  },
  blue: {
    button: 'bg-blue-500 hover:bg-blue-600',
    buttonOutline: 'border-blue-500 text-blue-600 hover:bg-blue-50',
    progress: 'bg-blue-500',
    ring: 'ring-blue-500',
  },
  cyan: {
    button: 'bg-cyan-500 hover:bg-cyan-600',
    buttonOutline: 'border-cyan-500 text-cyan-600 hover:bg-cyan-50',
    progress: 'bg-cyan-500',
    ring: 'ring-cyan-500',
  },
};

export const InterviewModePanel: React.FC<InterviewModePanelProps> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  showExplanation,
  showHint,
  isAnswered,
  isComplete,
  score,
  onSelectAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onUseHint,
  onRestart,
  accentColor = 'indigo',
}) => {
  const colors = ACCENT_COLORS[accentColor];

  // Completion screen
  if (isComplete) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h3>

          <div className="mb-6">
            <div className="text-5xl font-bold text-gray-900 mb-1">
              {score.percentage}%
            </div>
            <div className="text-gray-500">
              {score.correct} / {score.total} correct
            </div>
          </div>

          {/* Score interpretation */}
          <div className={`
            inline-block px-4 py-2 rounded-full text-sm font-medium mb-6
            ${score.percentage >= 80 ? 'bg-green-100 text-green-700' : ''}
            ${score.percentage >= 60 && score.percentage < 80 ? 'bg-yellow-100 text-yellow-700' : ''}
            ${score.percentage < 60 ? 'bg-red-100 text-red-700' : ''}
          `}>
            {score.percentage >= 80 && '🎉 Excellent! Ready for interviews!'}
            {score.percentage >= 60 && score.percentage < 80 && '👍 Good job! Keep practicing!'}
            {score.percentage < 60 && '📚 Review the concepts and try again!'}
          </div>

          <button
            onClick={onRestart}
            className={`
              flex items-center gap-2 mx-auto px-6 py-3 rounded-lg
              text-white font-medium transition-colors
              ${colors.button}
            `}
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-500">
        No questions available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} / {totalQuestions}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[currentQuestion.difficulty]}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {currentQuestion.topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Score: {score.correct}/{score.total}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colors.progress}`}
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQuestion.question}
        </h4>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showExplanation;

            let optionStyle = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

            if (showResult) {
              if (isCorrect) {
                optionStyle = 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-red-500 bg-red-50';
              }
            } else if (isSelected) {
              optionStyle = `border-2 ${colors.ring} bg-gray-50`;
            }

            return (
              <button
                key={index}
                onClick={() => !isAnswered && onSelectAnswer(index)}
                disabled={isAnswered}
                className={`
                  w-full p-3 rounded-lg border-2 text-left transition-all
                  flex items-center gap-3
                  ${optionStyle}
                  ${isAnswered ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${showResult && isCorrect ? 'bg-green-500 text-white' : ''}
                  ${showResult && isSelected && !isCorrect ? 'bg-red-500 text-white' : ''}
                  ${!showResult ? 'bg-gray-200 text-gray-600' : ''}
                `}>
                  {showResult && isCorrect && <CheckCircle className="w-4 h-4" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                  {!showResult && String.fromCharCode(65 + index)}
                </span>
                <span className={`flex-1 ${showResult && isCorrect ? 'font-medium text-green-700' : ''}`}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {currentQuestion.hint && !showExplanation && (
          <div className="mb-4">
            {showHint ? (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-yellow-800 mb-1">Hint</div>
                    <div className="text-sm text-yellow-700">{currentQuestion.hint}</div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onUseHint}
                className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700"
              >
                <Lightbulb className="w-4 h-4" />
                Show hint
              </button>
            )}
          </div>
        )}

        {/* Explanation */}
        {showExplanation && (
          <div className={`
            p-3 rounded-lg border mb-4
            ${selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }
          `}>
            <div className="flex items-start gap-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  selectedAnswer === currentQuestion.correctAnswer ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                </div>
                <div className={`text-sm ${
                  selectedAnswer === currentQuestion.correctAnswer ? 'text-green-700' : 'text-red-700'
                }`}>
                  {currentQuestion.explanation}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${currentQuestionIndex === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={onNextQuestion}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className={`
            flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors text-white
            ${currentQuestionIndex === totalQuestions - 1
              ? 'bg-gray-300 cursor-not-allowed'
              : colors.button
            }
          `}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InterviewModePanel;
