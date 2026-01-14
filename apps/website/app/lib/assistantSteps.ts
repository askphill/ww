import type {StepId} from '~/hooks/useAssistantFlow';

/**
 * Step types define the UI rendering mode for each step.
 */
export type StepType =
  | 'text' // Simple text with action button
  | 'choice' // Single-select card options
  | 'multi-choice' // Multi-select card options
  | 'input' // Form input fields
  | 'recommendation' // Product recommendation display
  | 'summary'; // Final summary view

/**
 * Option for choice and multi-choice steps.
 */
export interface StepOption {
  /** Unique identifier for this option */
  value: string;
  /** Display label for the option card */
  label: string;
  /** Optional description shown below the label */
  description?: string;
}

/**
 * Input field configuration for input steps.
 */
export interface StepInputField {
  /** Unique key for this field */
  name: string;
  /** Input type (text, email, etc.) */
  type: 'text' | 'email';
  /** Label shown for the input */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether this field is required */
  required: boolean;
}

/**
 * Base step definition shared by all step types.
 */
interface BaseStep {
  /** Unique identifier matching StepId */
  id: StepId;
  /** Step type determines rendering */
  type: StepType;
  /** Message shown to the user */
  message: string;
}

/**
 * Text step - simple message with action button.
 */
export interface TextStep extends BaseStep {
  type: 'text';
  /** Label for the action button */
  actionLabel: string;
}

/**
 * Choice step - single-select options.
 */
export interface ChoiceStep extends BaseStep {
  type: 'choice';
  /** Options to choose from */
  options: StepOption[];
}

/**
 * Multi-choice step - multi-select options.
 */
export interface MultiChoiceStep extends BaseStep {
  type: 'multi-choice';
  /** Options to choose from (multiple can be selected) */
  options: StepOption[];
  /** Label for the continue button */
  actionLabel: string;
}

/**
 * Input step - form fields.
 */
export interface InputStep extends BaseStep {
  type: 'input';
  /** Input fields to display */
  fields: StepInputField[];
  /** Label for the submit button */
  actionLabel: string;
}

/**
 * Recommendation step - shows personalized product.
 */
export interface RecommendationStep extends BaseStep {
  type: 'recommendation';
}

/**
 * Summary step - final routine overview.
 */
export interface SummaryStep extends BaseStep {
  type: 'summary';
}

/**
 * Union type of all step configurations.
 */
export type Step =
  | TextStep
  | ChoiceStep
  | MultiChoiceStep
  | InputStep
  | RecommendationStep
  | SummaryStep;

/**
 * All step definitions for the assistant conversation flow.
 * Steps are ordered by their position in the conversation.
 */
export const ASSISTANT_STEPS: Step[] = [
  {
    id: 'welcome',
    type: 'text',
    message:
      "Hey there, welcome to Wakey! I'm here to help you discover your perfect morning routine. Ready to find products that match your lifestyle?",
    actionLabel: "Let's go",
  },
  {
    id: 'interest-area',
    type: 'choice',
    message: 'What brings you to Wakey today?',
    options: [
      {
        value: 'deodorant',
        label: 'Deodorant that actually works',
        description: 'Natural protection that keeps up with your day',
      },
      {
        value: 'routine',
        label: 'Building a morning routine',
        description: 'Create habits that set you up for success',
      },
      {
        value: 'exploring',
        label: 'Just exploring',
        description: 'Curious to see what Wakey is all about',
      },
    ],
  },
  {
    id: 'lifestyle',
    type: 'multi-choice',
    message: 'Tell me a bit about your daily life',
    options: [
      {
        value: 'active',
        label: 'Active & athletic',
        description: 'Regular workouts and physical activities',
      },
      {
        value: 'professional',
        label: 'Busy professional',
        description: 'Long days and packed schedules',
      },
      {
        value: 'parent',
        label: 'Parent life',
        description: 'Juggling kids and everything else',
      },
      {
        value: 'student',
        label: 'Student vibes',
        description: 'Classes, studying, and campus life',
      },
    ],
    actionLabel: 'Next',
  },
  {
    id: 'age-range',
    type: 'choice',
    message: 'What age range are you in?',
    options: [
      {value: '18-25', label: '18-25'},
      {value: '26-35', label: '26-35'},
      {value: '36-50', label: '36-50'},
      {value: '50+', label: '50+'},
    ],
  },
  {
    id: 'name-email',
    type: 'input',
    message: 'Almost there! What should I call you?',
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Your name',
        placeholder: 'Enter your name',
        required: true,
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email address',
        placeholder: 'Enter your email',
        required: true,
      },
    ],
    actionLabel: 'See my routine',
  },
  {
    id: 'recommendation',
    type: 'recommendation',
    message: "Based on your answers, here's what I recommend for you:",
  },
  {
    id: 'summary',
    type: 'summary',
    message: "Here's your personalized morning routine:",
  },
];

/**
 * Get a step configuration by its ID.
 *
 * @param stepId - The step ID to look up
 * @returns The step configuration or undefined if not found
 */
export function getStepById(stepId: StepId): Step | undefined {
  return ASSISTANT_STEPS.find((step) => step.id === stepId);
}

/**
 * Get the index of a step in the conversation flow.
 *
 * @param stepId - The step ID to look up
 * @returns The step index or -1 if not found
 */
export function getStepIndex(stepId: StepId): number {
  return ASSISTANT_STEPS.findIndex((step) => step.id === stepId);
}

/**
 * Get the total number of steps in the conversation.
 */
export const TOTAL_STEPS = ASSISTANT_STEPS.length;
