import {useState, useCallback} from 'react';
import {Button} from '@wakey/ui';
import type {StepInputField} from '~/lib/assistantSteps';

interface AssistantInputProps {
  /** Input field configurations */
  fields: StepInputField[];
  /** Label for the submit button */
  submitLabel: string;
  /** Callback when form is submitted with valid data */
  onSubmit: (values: Record<string, string>) => void;
  /** Animation delay index for staggered entrance */
  animationIndex?: number;
  /** Initial values for pre-populating fields (e.g., when navigating back) */
  initialValues?: Record<string, string>;
}

/**
 * Validates email format using a simple regex pattern.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Input form component for assistant data collection steps.
 * Features floating labels, email validation, and disabled state handling.
 */
export function AssistantInput({
  fields,
  submitLabel,
  onSubmit,
  animationIndex = 0,
  initialValues,
}: AssistantInputProps) {
  // Track values for all fields
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      initial[field.name] = initialValues?.[field.name] ?? '';
    });
    return initial;
  });

  // Track which fields are currently focused
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  // Track which fields have been touched (for validation display)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle input value changes
  const handleChange = useCallback((fieldName: string, value: string) => {
    setValues((prev) => ({...prev, [fieldName]: value}));
  }, []);

  // Handle focus
  const handleFocus = useCallback((fieldName: string) => {
    setFocused((prev) => ({...prev, [fieldName]: true}));
  }, []);

  // Handle blur
  const handleBlur = useCallback((fieldName: string) => {
    setFocused((prev) => ({...prev, [fieldName]: false}));
    setTouched((prev) => ({...prev, [fieldName]: true}));
  }, []);

  // Validate a single field
  const validateField = useCallback(
    (field: StepInputField): string | null => {
      const value = values[field.name]?.trim() || '';

      if (field.required && !value) {
        return `${field.label} is required`;
      }

      if (field.type === 'email' && value && !isValidEmail(value)) {
        return 'Please enter a valid email address';
      }

      return null;
    },
    [values],
  );

  // Check if form is valid
  const isFormValid = fields.every((field) => validateField(field) === null);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      fields.forEach((field) => {
        allTouched[field.name] = true;
      });
      setTouched(allTouched);

      if (isFormValid) {
        onSubmit(values);
      }
    },
    [fields, isFormValid, onSubmit, values],
  );

  // Calculate staggered animation delay (100ms per index)
  const animationDelay = `${animationIndex * 100}ms`;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md opacity-0"
      style={{
        animation: 'fade-in 300ms ease-out forwards',
        animationDelay,
      }}
    >
      <div className="flex flex-col gap-4">
        {fields.map((field, index) => {
          const value = values[field.name] || '';
          const isFocused = focused[field.name] || false;
          const isTouched = touched[field.name] || false;
          const error = validateField(field);
          const showError = isTouched && error;
          const isFloating = isFocused || value.length > 0;

          return (
            <div
              key={field.name}
              className="relative opacity-0"
              style={{
                animation: 'fade-in 300ms ease-out forwards',
                animationDelay: `${(animationIndex + index) * 100 + 100}ms`,
              }}
            >
              {/* Floating label */}
              <label
                htmlFor={field.name}
                className={`
                  absolute left-4 transition-all duration-200 pointer-events-none
                  ${
                    isFloating
                      ? 'top-2 text-small text-black/60'
                      : 'top-1/2 -translate-y-1/2 text-label text-black/50'
                  }
                `}
              >
                {field.label}
                {field.required && <span className="text-softorange ml-1">*</span>}
              </label>

              {/* Input field */}
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onFocus={() => handleFocus(field.name)}
                onBlur={() => handleBlur(field.name)}
                placeholder={isFloating ? field.placeholder : undefined}
                className={`
                  w-full bg-sand text-black rounded-card
                  px-4 pt-6 pb-3
                  font-body text-paragraph
                  border-2 transition-colors duration-200
                  outline-none
                  ${showError ? 'border-red-500' : isFocused ? 'border-softorange' : 'border-transparent'}
                `}
                aria-invalid={showError ? 'true' : 'false'}
                aria-describedby={showError ? `${field.name}-error` : undefined}
              />

              {/* Error message */}
              {showError && (
                <p
                  id={`${field.name}-error`}
                  className="mt-2 text-small text-red-400 font-body"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="mt-6">
        <Button
          type="submit"
          variant="secondary"
          disabled={!isFormValid}
          className="w-full"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
