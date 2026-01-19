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
  {
    type: 'text',
    content: "Let's find your *morning* *personality.*",
    duration: 1500,
    className: 'text-h1 font-display',
  },
  {type: 'images', content: '', duration: 2500},
  {
    type: 'text',
    content: 'Mornings are *messy,* *chaotic,* and *alive.* Yours too.',
    duration: 2000,
    className: 'text-h2 font-body',
  },
  {
    type: 'text',
    content: 'Ready? Show us your *morning* *face.*',
    duration: 1500,
    className: 'text-h2 font-body italic',
  },
];

// Questionnaire data
type Question =
  | {type: 'choice'; key: string; question: string; options: string[]}
  | {type: 'text'; key: string; question: string; placeholder: string};

// Morning type mapping from first question answer index
const morningTypes = [
  {label: 'The Early Bird'},
  {label: 'The Morning Manager'},
  {label: 'The Revolutionist'},
  {label: 'The Snoozer'},
];

const questions: Question[] = [
  {
    type: 'choice',
    key: 'morningType',
    question: 'How does your alarm usually find you?',
    options: [
      'The Early Bird. Up before the sun, somehow energized.',
      'The Morning Manager. Kids, pets, chaos. You handle it.',
      'The Revolutionist. Coffee first. Everything else second.',
      'The Snoozer. Morning officially starts at 11.',
    ],
  },
  {
    type: 'choice',
    key: 'favoriteActivity',
    question: 'First thing you actually want to do?',
    options: [
      'Move. Sweat. Get the blood going.',
      'Step outside. Feel the air. See the light.',
      'Eat. Coffee. The whole ritual.',
      'Sit still. Journal, meditate, or just be.',
    ],
  },
  {
    type: 'choice',
    key: 'soundtrack',
    question: "What's playing in the background?",
    options: [
      'A playlist I actually made.',
      'Birds. Just birds.',
      'News, podcasts, someone talking.',
      'Nothing. Silence is the point.',
    ],
  },
  {
    type: 'choice',
    key: 'values',
    question: 'When it comes to your skin, what matters most?',
    options: [
      'The planet. No plastic, no waste.',
      'The animals. Vegan and cruelty-free only.',
      "The ingredients. Nothing I can't pronounce.",
      'The results. I just want it to work.',
    ],
  },
  {
    type: 'choice',
    key: 'habitView',
    question: 'How do you feel about your morning routine?',
    options: [
      "It's the basics. Gets me going.",
      "It's my time. I take as long as I want.",
      'I wish I had more of it.',
      "Honestly? I don't think about it.",
    ],
  },
  {
    type: 'text',
    key: 'name',
    question: "Almost forgot. What's your name?",
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
    y: -30,
    transition: {
      delay: i * 0.06,
      duration: 0.25,
      ease: 'easeOut' as const,
    },
  }),
};

// Card stack positions - mobile (compact stack)
const mobileCardPositions = [
  {x: 0, y: 0, rotate: -3},
  {x: 8, y: -4, rotate: 2},
  {x: -6, y: -8, rotate: -1},
  {x: 12, y: -12, rotate: 4},
  {x: -10, y: -16, rotate: -2},
  {x: 4, y: -20, rotate: 1},
];

// Card stack positions - desktop (half-circle fan) - values scale with vw sizing
const desktopCardPositions = [
  {x: '-28vw', y: '8vw', rotate: -18},
  {x: '-16vw', y: '2vw', rotate: -10},
  {x: '-5vw', y: '-2vw', rotate: -3},
  {x: '5vw', y: '-2vw', rotate: 3},
  {x: '16vw', y: '2vw', rotate: 10},
  {x: '28vw', y: '8vw', rotate: 18},
];

// Factory to create image variants with responsive positions
const createImageVariants = (isDesktop: boolean) => ({
  hidden: () => ({
    opacity: 0,
    y: '100vh', // Start from bottom of screen
    scale: 0.8,
    rotate: 15,
  }),
  visible: (i: number) => {
    const positions = isDesktop ? desktopCardPositions : mobileCardPositions;
    const pos = positions[i] || {x: 0, y: 0, rotate: 0};
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
      delay: i * 0.08,
      duration: 0.5,
      ease: 'easeIn' as const,
    },
  }),
});

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
  const [phase, setPhase] = useState<
    'story' | 'questionnaire' | 'images-interstitial' | 'complete'
  >('story');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [morningTypeIndex, setMorningTypeIndex] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [showImagesInterstitial, setShowImagesInterstitial] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(false);

  // Responsive detection for card layout
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const imageVariants = createImageVariants(isDesktop);

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
  const selectAnswer = useCallback(
    (answer: string, answerIndex?: number) => {
      const currentQ = questions[questionIndex];
      setAnswers((prev) => ({...prev, [currentQ.key]: answer}));
      setShowQuestion(false);

      // If this is the first question (morningType), save the index for the card
      if (currentQ.key === 'morningType' && answerIndex !== undefined) {
        setMorningTypeIndex(answerIndex);
      }

      setTimeout(() => {
        // After Q1 (morningType), show images interstitial
        if (currentQ.key === 'morningType') {
          setPhase('images-interstitial');
          setShowImagesInterstitial(true);
        } else if (questionIndex < questions.length - 1) {
          setQuestionIndex((prev) => prev + 1);
          setShowQuestion(true);
        } else {
          setPhase('complete');
        }
      }, 400);
    },
    [questionIndex],
  );

  // Handle name submission
  const submitName = useCallback(() => {
    if (nameInput.trim()) {
      selectAnswer(nameInput.trim());
    }
  }, [nameInput, selectAnswer]);

  // Handle Start button click (after first slide)
  const handleStart = useCallback(() => {
    setWaitingForStart(false);
    advanceStory();
  }, [advanceStory]);

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
      setMorningTypeIndex(null);
      setNameInput('');
      setShowImagesInterstitial(false);
      setWaitingForStart(false);

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

  // Auto-advance story (except for first slide which waits for Start button)
  useEffect(() => {
    if (phase !== 'story' || !showStoryContent || uiStep < 4) return;

    // First slide (storyIndex === 0): wait for Start button instead of auto-advance
    if (storyIndex === 0) {
      const timer = setTimeout(() => {
        setWaitingForStart(true);
      }, currentStory.duration);
      return () => clearTimeout(timer);
    }

    // Other slides: auto-advance as normal
    const timer = setTimeout(() => {
      advanceStory();
    }, currentStory.duration);

    return () => clearTimeout(timer);
  }, [
    phase,
    showStoryContent,
    uiStep,
    currentStory.duration,
    advanceStory,
    storyIndex,
  ]);

  // Auto-advance from images interstitial (2000ms as per flow)
  useEffect(() => {
    if (phase !== 'images-interstitial' || !showImagesInterstitial) return;

    const timer = setTimeout(() => {
      setShowImagesInterstitial(false);
      setTimeout(() => {
        setPhase('questionnaire');
        setQuestionIndex((prev) => prev + 1);
        setShowQuestion(true);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, showImagesInterstitial]);

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
            <motion.div
              key={storyIndex}
              className="flex flex-col items-center gap-8 max-w-4xl"
            >
              <motion.p
                className={`${'className' in currentStory && currentStory.className ? currentStory.className : 'text-h1'} font-display text-black flex flex-wrap justify-center gap-x-4 gap-y-2 text-center`}
                aria-label={currentStory.content}
              >
                {currentStory.content.split(' ').map((word, i) => {
                  const isEmphasized =
                    word.startsWith('*') && word.endsWith('*');
                  const displayWord = isEmphasized ? word.slice(1, -1) : word;
                  return (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={wordVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={isEmphasized ? 'italic' : ''}
                    >
                      {displayWord}
                    </motion.span>
                  );
                })}
              </motion.p>

              {/* Start button - only shown after first slide animation */}
              {storyIndex === 0 && waitingForStart && (
                <motion.button
                  type="button"
                  onClick={handleStart}
                  initial={{opacity: 0, y: 20}}
                  animate={{opacity: 1, y: 0}}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    delay: 0.2,
                  }}
                  className="py-4 px-12 bg-black text-white rounded-card text-paragraph font-body hover:bg-black/80 transition-colors cursor-pointer"
                >
                  Start
                </motion.button>
              )}
            </motion.div>
          )}

          {showStoryContent && currentStory.type === 'images' && (
            <motion.div
              key="images"
              className="relative flex items-center justify-center"
              style={{
                width: isDesktop ? '80vw' : '200px',
                height: isDesktop ? '45vw' : '280px',
              }}
            >
              {flyingImages.map((src, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute rounded-card overflow-hidden shadow-2xl"
                  style={{
                    zIndex: i,
                    width: isDesktop ? '16vw' : '220px',
                    height: isDesktop ? '20vw' : '280px',
                  }}
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

          {/* Images interstitial after Q1 */}
          {phase === 'images-interstitial' && showImagesInterstitial && (
            <motion.div
              key="images-interstitial"
              className="relative flex items-center justify-center"
              style={{
                width: isDesktop ? '80vw' : '200px',
                height: isDesktop ? '45vw' : '280px',
              }}
            >
              {flyingImages.map((src, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute rounded-card overflow-hidden shadow-2xl"
                  style={{
                    zIndex: i,
                    width: isDesktop ? '16vw' : '220px',
                    height: isDesktop ? '20vw' : '280px',
                  }}
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
                      onClick={() => selectAnswer(option, i)}
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

          {/* Completion message with Morning Type card */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              className="flex flex-col items-center gap-8 text-center"
              initial={{opacity: 0, y: 40}}
              animate={{opacity: 1, y: 0}}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              {/* Morning Type Preview Card */}
              <motion.div
                className="bg-white rounded-card p-8 md:p-12 shadow-xl max-w-sm w-full"
                initial={{opacity: 0, scale: 0.9}}
                animate={{opacity: 1, scale: 1}}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                {/* Morning Type Label */}
                {morningTypeIndex !== null &&
                  morningTypes[morningTypeIndex] && (
                    <h3 className="text-h2 font-display text-black mb-6">
                      {morningTypes[morningTypeIndex].label}
                    </h3>
                  )}

                {/* Personalized greeting */}
                <p className="text-s1 font-display text-black mb-2">
                  Hey{answers.name ? ` ${answers.name}` : ''}.
                </p>

                {/* Welcome message */}
                <p className="text-paragraph font-body text-black/70 mb-8">
                  You're in. Welcome to mornings as they actually are.
                </p>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 px-8 bg-black text-white rounded-card text-paragraph font-body hover:bg-black/80 transition-colors cursor-pointer"
                >
                  Let's go
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button - hide on first slide when waiting for Start */}
      {phase === 'story' &&
        uiStep >= 4 &&
        storyIndex < storySteps.length - 1 &&
        !waitingForStart && (
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
            maskImage:
              'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
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
            maskImage:
              'linear-gradient(to top, black 0%, black 30%, transparent 80%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 0%, black 30%, transparent 80%)',
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
