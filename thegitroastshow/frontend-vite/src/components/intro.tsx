import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroProps {
  onComplete: (navigateTo?: string) => void;
}

const Intro = ({ onComplete }: IntroProps) => {
  const [typedWelcomeText, setTypedWelcomeText] = useState('');
  const [typedTitleText, setTypedTitleText] = useState('');
  const [typedTaglineText, setTypedTaglineText] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const welcomeTypingRef = useRef<NodeJS.Timeout | null>(null);
  const titleTypingRef = useRef<NodeJS.Timeout | null>(null);
  const taglineTypingRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Texts to display
  const welcomeText = "";
  const titleText = "THE GIT ROAST SHOW";
  const taglineText = "we don't fork around here";

  // Clean up function
  const cleanup = useCallback(() => {
    if (welcomeTypingRef.current) {
      clearTimeout(welcomeTypingRef.current);
      welcomeTypingRef.current = null;
    }
    if (titleTypingRef.current) {
      clearTimeout(titleTypingRef.current);
      titleTypingRef.current = null;
    }
    if (taglineTypingRef.current) {
      clearTimeout(taglineTypingRef.current);
      taglineTypingRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Function to start typing animation
  const startTypingAnimation = useCallback(() => {
    // Welcome text animation
    const typeWelcomeChar = (index: number) => {
      if (index <= welcomeText.length) {
        setTypedWelcomeText(welcomeText.substring(0, index));
        if (index < welcomeText.length) {
          welcomeTypingRef.current = setTimeout(() => typeWelcomeChar(index + 1), 80);
        } else {
          // Start title text animation after welcome text is complete
          setTimeout(() => {
            titleTypingRef.current = setTimeout(() => typeTitle(0), 100);
          }, 300);
        }
      }
    };

    // Title text animation
    const typeTitle = (index: number) => {
      if (index <= titleText.length) {
        setTypedTitleText(titleText.substring(0, index));
        if (index < titleText.length) {
          titleTypingRef.current = setTimeout(() => typeTitle(index + 1), 60);
        } else {
          // Start tagline text animation after title text is complete
          setTimeout(() => {
            taglineTypingRef.current = setTimeout(() => typeTagline(0), 100);
          }, 300);
        }
      }
    };

    // Tagline text animation
    const typeTagline = (index: number) => {
      if (index <= taglineText.length) {
        setTypedTaglineText(taglineText.substring(0, index));
        if (index < taglineText.length) {
          taglineTypingRef.current = setTimeout(() => typeTagline(index + 1), 70);
        } else {
          // All animations complete, but don't automatically proceed
          // Wait for user to click a button
          setAnimationComplete(true);
        }
      }
    };

    // Start the typing animation sequence
    typeWelcomeChar(0);
  }, [welcomeText, titleText, taglineText]);

  // Function to play welcome audio
  const playWelcomeAudio = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current) {
        console.error("Audio element not available");
        resolve();
        return;
      }
      
      try {
        const audioPath = `/media/welcomintro.mp3`;
        console.log(`Playing welcome audio: ${audioPath}`);
        
        // Clean up previous event handlers
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.oncanplaythrough = null;
        
        // Set up new event handlers
        audioRef.current.onended = () => {
          console.log("Welcome audio ended");
          resolve();
        };
        
        audioRef.current.onerror = (e) => {
          console.error("Welcome audio error:", e);
          resolve();
        };
        
        // Set source and play
        audioRef.current.src = audioPath;
        audioRef.current.load();
        
        audioRef.current.oncanplaythrough = () => {
          audioRef.current?.play().catch(error => {
            console.error("Error playing welcome audio:", error);
            resolve();
          });
        };
        
      } catch (error) {
        console.error("Error setting up welcome audio:", error);
        resolve();
      }
    });
  }, []);

  // Start animation and audio when component mounts
  useEffect(() => {
    console.log("Starting intro animation and audio");
    startTypingAnimation();
    playWelcomeAudio();
    
    return cleanup;
  }, [startTypingAnimation, playWelcomeAudio, cleanup]);

  return (
    <div 
      className="intro-container" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111319',
        zIndex: 200,
        overflow: 'hidden'
      }}
    >
      {/* Audio element for welcome message */}
      <audio 
        ref={audioRef}
        preload="auto"
      />
      
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        {/* Welcome text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: '#00a0a0',
            fontFamily: '"Barriecito", cursive',
            fontSize: '1.5rem',
            textAlign: 'center',
            marginBottom: '0.5rem'
          }}
        >
          {typedWelcomeText}
          {typedWelcomeText && typedWelcomeText.length < welcomeText.length && (
            <span style={{ 
              opacity: 0.7, 
              animation: 'blink 1s infinite',
              marginLeft: '2px'
            }}>
              |
            </span>
          )}
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: 'white',
            fontFamily: '"Barriecito", cursive',
            fontSize: '4rem',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0',
            letterSpacing: '2px'
          }}
        >
          {typedTitleText}
          {typedTitleText && typedTitleText.length < titleText.length && (
            <span style={{ 
              opacity: 0.7, 
              animation: 'blink 1s infinite',
              marginLeft: '2px'
            }}>
              |
            </span>
          )}
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: '#00a0a0',
            fontFamily: '"Barriecito", cursive',
            fontSize: '1.8rem',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}
        >
          {typedTaglineText}
          {typedTaglineText && typedTaglineText.length < taglineText.length && (
            <span style={{ 
              opacity: 0.7, 
              animation: 'blink 1s infinite',
              marginLeft: '2px'
            }}>
              |
            </span>
          )}
        </motion.div>
      </div>

      {/* Two buttons that appear after animation is complete */}
      <AnimatePresence>
        {animationComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              bottom: '20%',
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              gap: '2rem'
            }}
          >
            <button
              onClick={() => onComplete('ENTER_BUTTON')}
              className="barriecito-regular"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid #00a0a0',
                borderRadius: '0px',
                padding: '0.75em 2em',
                fontSize: '1.1em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              yeah got it
            </button>
            <button
              onClick={() => onComplete('GIT_INPUT')}
              className="barriecito-regular"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid #00a0a0',
                borderRadius: '0px',
                padding: '0.75em 2em',
                fontSize: '1.1em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              i don't care
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 0.7; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Intro;
