import {useState, useCallback} from 'react';

/**
 * Step IDs for the assistant conversation flow.
 * This type ensures only valid step IDs are used throughout the app.
 */
export type StepId =
  | 'welcome'
  | 'interest-area'
  | 'lifestyle'
  | 'age-range'
  | 'name-email'
  | 'recommendation'
  | 'summary';

/**
 * Answer values can be string, string array (for multi-select), or an object (for forms).
 */
export type AnswerValue = string | string[] | Record<string, string>;

/**
 * Record mapping step IDs to their answer values.
 */
export type Answers = Partial<Record<StepId, AnswerValue>>;

/**
 * State shape for the assistant flow.
 */
export interface AssistantFlowState {
  currentStepId: StepId;
  answers: Answers;
  history: StepId[];
}

/**
 * The default step order for the conversation flow.
 * This defines the linear progression through steps.
 */
const STEP_ORDER: StepId[] = [
  'welcome',
  'interest-area',
  'lifestyle',
  'age-range',
  'name-email',
  'recommendation',
  'summary',
];

/**
 * Initial state for the assistant flow.
 */
const INITIAL_STATE: AssistantFlowState = {
  currentStepId: 'welcome',
  answers: {},
  history: [],
};

/**
 * Hook for managing the AI shopping assistant conversation flow.
 *
 * Provides a simple state machine for navigating through conversation steps,
 * storing answers, and managing navigation history.
 *
 * @returns Object with:
 * - currentStepId: The current step in the conversation
 * - answers: Record of answers keyed by step ID
 * - history: Array of visited step IDs (for back navigation)
 * - next: Function to advance to the next step, optionally storing an answer
 * - back: Function to return to the previous step
 * - reset: Function to restart the conversation from the beginning
 * - isFirstStep: Boolean indicating if on the first step
 * - isLastStep: Boolean indicating if on the last step
 */
export function useAssistantFlow() {
  const [state, setState] = useState<AssistantFlowState>(INITIAL_STATE);

  /**
   * Advance to the next step in the conversation.
   * Optionally stores an answer for the current step before advancing.
   *
   * @param answer - Optional answer to store for the current step
   */
  const next = useCallback((answer?: AnswerValue) => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStepId);

      // Don't advance past the last step
      if (currentIndex >= STEP_ORDER.length - 1) {
        return prev;
      }

      const nextStepId = STEP_ORDER[currentIndex + 1];
      const updatedAnswers = answer !== undefined
        ? {...prev.answers, [prev.currentStepId]: answer}
        : prev.answers;

      return {
        currentStepId: nextStepId,
        answers: updatedAnswers,
        history: [...prev.history, prev.currentStepId],
      };
    });
  }, []);

  /**
   * Return to the previous step in the conversation.
   * Uses history to navigate back, preserving previous answers.
   */
  const back = useCallback(() => {
    setState((prev) => {
      // Can't go back if no history
      if (prev.history.length === 0) {
        return prev;
      }

      const previousStepId = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);

      return {
        ...prev,
        currentStepId: previousStepId,
        history: newHistory,
      };
    });
  }, []);

  /**
   * Reset the conversation to the initial state.
   * Clears all answers and history.
   */
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const currentIndex = STEP_ORDER.indexOf(state.currentStepId);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEP_ORDER.length - 1;

  return {
    currentStepId: state.currentStepId,
    answers: state.answers,
    history: state.history,
    next,
    back,
    reset,
    isFirstStep,
    isLastStep,
  };
}
