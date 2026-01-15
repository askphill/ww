import {useEffect, useState, useCallback} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {CrossIcon} from '@wakey/ui';
import {WakeyLogo} from './WakeyLogo';

interface AiOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Story sequence messages
type StoryStep =
  | {type: 'text'; content: string; duration: number; className?: string}
  | {type: 'images'; content: string; duration: number}
  | {type: 'logo'; duration: number};

const storySteps: StoryStep[] = [
  {type: 'text', content: 'Hi there!', duration: 1500},
  {type: 'text', content: 'First time here?', duration: 1500},
  {type: 'text', content: 'Let me show you around.', duration: 2000},
  {type: 'images', content: '', duration: 3000},
  {type: 'text', content: 'Our mission is to make the world a better place.', duration: 2500},
  {type: 'text', content: 'One morning at a time.', duration: 2000},
  {type: 'text', content: 'But enough about me, let me get to know you!', duration: 2500},
];

// Questionnaire data
type Question =
  | {type: 'choice'; question: string; options: string[]}
  | {type: 'text'; question: string; placeholder: string};

const questions: Question[] = [
  {
    type: 'choice',
    question: 'How would you rate your morning routine?',
    options: ['Love it', "It's okay", 'Needs work', 'What routine?'],
  },
  {
    type: 'choice',
    question: 'How much time do you have in the morning?',
    options: ['5 minutes max', '10-15 minutes', '20+ minutes', 'It varies'],
  },
  {
    type: 'choice',
    question: 'How active is your typical day?',
    options: ['Desk warrior', 'Moderately active', 'Always moving', 'Gym is life'],
  },
  {
    type: 'choice',
    question: 'What matters most to you?',
    options: ['Natural ingredients', 'Long-lasting', 'Gentle on skin', 'Eco-friendly'],
  },
  {
    type: 'choice',
    question: "Biggest frustration with products you've tried?",
    options: ["Don't last long enough", 'Irritate my skin', 'Too many chemicals', "Can't find what works"],
  },
  {
    type: 'text',
    question: "Oh and I almost forgot, what's your name?",
    placeholder: 'Type your name...',
  },
];

// Images from the cloud section
const flyingImages = [
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/happy.jpg?v=1709234975',
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/DTS_Daniel_Faro_Travel_Together_007.jpg?v=1709232636',
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/dog_e5f366bf-a2f3-46f6-8c5a-86e0fcf13f1c.jpg?v=1708693743',
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/30_Happy_Alpacas_That_Are_Sweeter_Than_Baby_Yoda.jpg?v=1708759569',
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/Wakey_wakey.jpg?v=1709233631',
  'https://cdn.shopify.com/s/files/1/0609/8747/4152/files/22.jpg?v=1708759924',
];

const wordVariants = {
  hidden: {opacity: 0, y: 40},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
      mass: 0.8,
    },
  }),
  exit: (i: number) => ({
    opacity: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  }),
};

// Card stack positions - each card gets a fixed offset for stacking effect
const cardStackPositions = [
  {x: 0, y: 0, rotate: -3},
  {x: 8, y: -4, rotate: 2},
  {x: -6, y: -8, rotate: -1},
  {x: 12, y: -12, rotate: 4},
  {x: -10, y: -16, rotate: -2},
  {x: 4, y: -20, rotate: 1},
];

const imageVariants = {
  hidden: () => ({
    opacity: 0,
    y: '100vh', // Start from bottom of screen
    scale: 0.8,
    rotate: 15,
  }),
  visible: (i: number) => {
    const pos = cardStackPositions[i] || {x: 0, y: 0, rotate: 0};
    return {
      opacity: 1,
      x: pos.x,
      y: pos.y,
      scale: 1,
      rotate: pos.rotate,
      transition: {
        delay: i * 0.12,
        type: 'spring' as const,
        stiffness: 120,
        damping: 14,
        mass: 0.8,
      },
    };
  },
  exit: (i: number) => ({
    opacity: 0,
    y: '-100vh',
    scale: 0.8,
    rotate: -5,
    transition: {
      delay: (flyingImages.length - 1 - i) * 0.05,
      duration: 0.5,
      ease: 'easeIn' as const,
    },
  }),
};

const optionVariants = {
  hidden: {opacity: 0, y: 20},
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  }),
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const questionVariants = {
  hidden: {opacity: 0, y: 30},
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Full-page AI interface overlay with animated story sequence and questionnaire
 */
export function AiOverlay({isOpen, onClose}: AiOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [uiStep, setUiStep] = useState(0);
  // UI steps: 0=nothing, 1=blur, 2=gradient, 3=close button, 4=story starts
  const [storyIndex, setStoryIndex] = useState(0);
  const [showStoryContent, setShowStoryContent] = useState(false);

  // Questionnaire state
  const [phase, setPhase] = useState<'story' | 'questionnaire' | 'complete'>('story');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [nameInput, setNameInput] = useState('');

  const currentStory = storySteps[storyIndex];
  const currentQuestion = questions[questionIndex];

  // Advance to next story step
  const advanceStory = useCallback(() => {
    if (storyIndex < storySteps.length - 1) {
      setShowStoryContent(false);
      setTimeout(() => {
        setStoryIndex((prev) => prev + 1);
        setShowStoryContent(true);
      }, 400);
    } else {
      // Story complete, transition to questionnaire
      setShowStoryContent(false);
      setTimeout(() => {
        setPhase('questionnaire');
        setShowQuestion(true);
      }, 400);
    }
  }, [storyIndex]);

  // Handle answer selection
  const selectAnswer = useCallback((answer: string) => {
    setAnswers((prev) => ({...prev, [questionIndex]: answer}));
    setShowQuestion(false);

    setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((prev) => prev + 1);
        setShowQuestion(true);
      } else {
        setPhase('complete');
      }
    }, 400);
  }, [questionIndex]);

  // Handle name submission
  const submitName = useCallback(() => {
    if (nameInput.trim()) {
      selectAnswer(nameInput.trim());
    }
  }, [nameInput, selectAnswer]);

  // Initial UI animation sequence
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.classList.add('overflow-hidden');
      setStoryIndex(0);
      setShowStoryContent(false);
      setPhase('story');
      setQuestionIndex(0);
      setShowQuestion(false);
      setAnswers({});
      setNameInput('');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setUiStep(1); // Blur backdrop
          setTimeout(() => setUiStep(2), 400); // Gradient
          setTimeout(() => setUiStep(3), 700); // Close button
          setTimeout(() => {
            setUiStep(4); // Story starts
            setShowStoryContent(true);
          }, 1000);
        });
      });
    } else {
      setUiStep(0);
      setShowStoryContent(false);
      setShowQuestion(false);
      document.body.classList.remove('overflow-hidden');

      const timer = setTimeout(() => {
        setShouldRender(false);
        setStoryIndex(0);
        setPhase('story');
        setQuestionIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-advance story
  useEffect(() => {
    if (phase !== 'story' || !showStoryContent || uiStep < 4) return;

    const timer = setTimeout(() => {
      advanceStory();
    }, currentStory.duration);

    return () => clearTimeout(timer);
  }, [phase, showStoryContent, uiStep, currentStory.duration, advanceStory]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="AI assistant"
    >
      {/* Blur backdrop with sand tint */}
      <div
        className={`
          absolute inset-0 bg-sand/80 backdrop-blur-2xl
          transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
          ${uiStep >= 1 ? 'opacity-100' : 'opacity-0 backdrop-blur-0'}
        `}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close AI assistant"
        className={`
          absolute top-4 right-4 md:top-8 md:right-8
          text-black hover:opacity-70
          transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]
          cursor-pointer z-20
          ${uiStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}
      >
        <CrossIcon className="w-10 h-10 md:w-12 md:h-12" />
      </button>

      {/* Story content */}
      <div className="flex items-center justify-center h-full relative z-10 px-6">
        <AnimatePresence mode="wait">
          {showStoryContent && currentStory.type === 'text' && (
            <motion.p
              key={storyIndex}
              className={`${'className' in currentStory && currentStory.className ? currentStory.className : 'text-h1'} font-display text-black flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-4xl text-center`}
              aria-label={currentStory.content}
            >
              {currentStory.content.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {word}
                </motion.span>
              ))}
            </motion.p>
          )}

          {showStoryContent && currentStory.type === 'images' && (
            <motion.div
              key="images"
              className="relative w-64 h-64 md:w-80 md:h-80"
            >
              {flyingImages.map((src, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 rounded-card overflow-hidden shadow-2xl"
                  style={{zIndex: i}}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {showStoryContent && currentStory.type === 'logo' && (
            <motion.div
              key="logo"
              initial={{opacity: 0, y: 40}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0}}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                mass: 0.8,
              }}
            >
              <WakeyLogo className="w-64 md:w-96 h-auto" color="#1A1A1A" />
            </motion.div>
          )}

          {/* Questionnaire */}
          {phase === 'questionnaire' && showQuestion && currentQuestion && (
            <motion.div
              key={`question-${questionIndex}`}
              className="flex flex-col items-center gap-8 max-w-xl w-full"
              variants={questionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Question text */}
              <h2 className="text-h2 font-display text-black text-center">
                {currentQuestion.question}
              </h2>

              {/* Options or text input */}
              {currentQuestion.type === 'choice' && (
                <div className="flex flex-col gap-3 w-full">
                  {currentQuestion.options.map((option, i) => (
                    <motion.button
                      key={option}
                      custom={i}
                      variants={optionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      type="button"
                      onClick={() => selectAnswer(option)}
                      className="w-full py-4 px-6 bg-white rounded-card text-paragraph font-body text-black text-left hover:bg-black hover:text-white transition-colors cursor-pointer shadow-sm"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <motion.div
                  className="w-full flex flex-col gap-4"
                  variants={optionVariants}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitName()}
                    placeholder={currentQuestion.placeholder}
                    className="w-full py-4 px-6 bg-white rounded-card text-paragraph font-body text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-softorange shadow-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitName}
                    disabled={!nameInput.trim()}
                    className="w-full py-4 px-6 bg-black text-white rounded-card text-paragraph font-body hover:bg-black/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Completion message */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              className="flex flex-col items-center gap-6 text-center"
              initial={{opacity: 0, y: 40}}
              animate={{opacity: 1, y: 0}}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <h2 className="text-h1 font-display text-black">
                Nice to meet you{answers[5] ? `, ${answers[5]}` : ''}!
              </h2>
              <p className="text-paragraph font-body text-black/70 max-w-md">
                We've got just the right products for you. Let's start your journey to better mornings.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 py-4 px-8 bg-black text-white rounded-card text-paragraph font-body hover:bg-black/80 transition-colors cursor-pointer"
              >
                Let's go
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button */}
      {phase === 'story' && uiStep >= 4 && storyIndex < storySteps.length - 1 && (
        <button
          type="button"
          onClick={advanceStory}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-black/40 hover:text-black/60 transition-colors font-body text-small z-20"
        >
          tap to skip
        </button>
      )}

      {/* Animated gradient glow - bottom half of screen */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none
          transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]
          ${uiStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}
        `}
      >
        {/* Primary glow layer */}
        <div
          className="absolute inset-0 blur-3xl opacity-70"
          style={{
            background: `linear-gradient(
              180deg,
              transparent 0%,
              transparent 30%,
              rgba(153, 189, 255, 0.3) 50%,
              rgba(250, 209, 3, 0.5) 70%,
              rgba(227, 176, 18, 0.6) 85%,
              rgba(250, 209, 3, 0.7) 100%
            )`,
          }}
        />
        {/* Horizontal flowing gradient */}
        <div
          className="absolute inset-0 blur-3xl opacity-60"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              #99BDFF 15%,
              #FAD103 35%,
              #E3B012 50%,
              #FAD103 65%,
              #99BDFF 85%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'ai-gradient-flow 4s ease-in-out infinite',
            maskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
          }}
        />
        {/* Secondary glow layer - offset animation */}
        <div
          className="absolute inset-0 blur-2xl opacity-40"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              #FAD103 20%,
              #99BDFF 50%,
              #FAD103 80%,
              transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'ai-gradient-flow 3s ease-in-out infinite reverse',
            maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 80%)',
          }}
        />
        {/* Bright center glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 blur-3xl opacity-50"
          style={{
            background: `radial-gradient(
              ellipse 80% 100% at 50% 100%,
              #FAD103 0%,
              rgba(250, 209, 3, 0.5) 30%,
              transparent 70%
            )`,
            animation: 'ai-glow-pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Keyframes for gradient animation */}
      <style>{`
        @keyframes ai-gradient-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes ai-glow-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.8;
            transform: scaleX(1.1);
          }
        }
      `}</style>
    </div>
  );
}
