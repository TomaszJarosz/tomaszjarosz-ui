import { useState, useCallback, useMemo } from 'react';

export interface InterviewQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  relatedStep?: number; // Step in visualizer to show for this question
}

export interface InterviewResult {
  questionId: string;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  usedHint: boolean;
}

export interface InterviewSession {
  questions: InterviewQuestion[];
  results: InterviewResult[];
  currentQuestionIndex: number;
  isComplete: boolean;
  startTime: number;
  totalTime: number;
}

export interface UseInterviewModeOptions {
  questions: InterviewQuestion[];
  timeLimit?: number; // in seconds, 0 = no limit
  shuffleQuestions?: boolean;
  onComplete?: (session: InterviewSession) => void;
}

export interface UseInterviewModeReturn {
  // State
  session: InterviewSession;
  currentQuestion: InterviewQuestion | null;
  isComplete: boolean;
  score: { correct: number; total: number; percentage: number };
  timeRemaining: number | null;

  // Actions
  selectAnswer: (answerIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  useHint: () => void;
  restartSession: () => void;

  // Current question state
  selectedAnswer: number | null;
  showExplanation: boolean;
  showHint: boolean;
  isAnswered: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useInterviewMode(options: UseInterviewModeOptions): UseInterviewModeReturn {
  const { questions, timeLimit = 0, shuffleQuestions = false, onComplete } = options;

  const initialQuestions = useMemo(() => {
    return shuffleQuestions ? shuffleArray(questions) : questions;
  }, [questions, shuffleQuestions]);

  const [session, setSession] = useState<InterviewSession>(() => ({
    questions: initialQuestions,
    results: [],
    currentQuestionIndex: 0,
    isComplete: false,
    startTime: Date.now(),
    totalTime: 0,
  }));

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const currentQuestion = session.questions[session.currentQuestionIndex] || null;

  const currentResult = session.results.find(
    (r) => r.questionId === currentQuestion?.id
  );

  const isAnswered = currentResult !== undefined;

  const score = useMemo(() => {
    const correct = session.results.filter((r) => r.isCorrect).length;
    const total = session.results.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  }, [session.results]);

  const selectAnswer = useCallback((answerIndex: number) => {
    if (!currentQuestion || isAnswered) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const result: InterviewResult = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      isCorrect,
      timeSpent,
      usedHint: showHint,
    };

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    setSession((prev) => {
      const newResults = [...prev.results, result];
      const isComplete = newResults.length === prev.questions.length;

      if (isComplete && onComplete) {
        const finalSession = {
          ...prev,
          results: newResults,
          isComplete: true,
          totalTime: Math.round((Date.now() - prev.startTime) / 1000),
        };
        setTimeout(() => onComplete(finalSession), 0);
      }

      return {
        ...prev,
        results: newResults,
        isComplete,
        totalTime: Math.round((Date.now() - prev.startTime) / 1000),
      };
    });
  }, [currentQuestion, isAnswered, questionStartTime, showHint, onComplete]);

  const nextQuestion = useCallback(() => {
    if (session.currentQuestionIndex >= session.questions.length - 1) return;

    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
    }));
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setShowExplanation(false);
    setSelectedAnswer(null);
  }, [session.currentQuestionIndex, session.questions.length]);

  const previousQuestion = useCallback(() => {
    if (session.currentQuestionIndex <= 0) return;

    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex - 1,
    }));

    // Restore state for previous question
    const prevQuestion = session.questions[session.currentQuestionIndex - 1];
    const prevResult = session.results.find((r) => r.questionId === prevQuestion?.id);

    setSelectedAnswer(prevResult?.selectedAnswer ?? null);
    setShowExplanation(prevResult !== undefined);
    setShowHint(prevResult?.usedHint ?? false);
  }, [session.currentQuestionIndex, session.questions, session.results]);

  const useHint = useCallback(() => {
    setShowHint(true);
  }, []);

  const restartSession = useCallback(() => {
    const newQuestions = shuffleQuestions ? shuffleArray(questions) : questions;

    setSession({
      questions: newQuestions,
      results: [],
      currentQuestionIndex: 0,
      isComplete: false,
      startTime: Date.now(),
      totalTime: 0,
    });
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setShowExplanation(false);
    setSelectedAnswer(null);
  }, [questions, shuffleQuestions]);

  // Restore state when navigating to already-answered question
  const effectiveSelectedAnswer = currentResult?.selectedAnswer ?? selectedAnswer;
  const effectiveShowExplanation = currentResult !== undefined ? true : showExplanation;

  return {
    session,
    currentQuestion,
    isComplete: session.isComplete,
    score,
    timeRemaining: timeLimit > 0 ? Math.max(0, timeLimit - session.totalTime) : null,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    useHint,
    restartSession,
    selectedAnswer: effectiveSelectedAnswer,
    showExplanation: effectiveShowExplanation,
    showHint,
    isAnswered,
  };
}

export default useInterviewMode;
