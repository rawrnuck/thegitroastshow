import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface OutroProps {
  onComplete: (navigateTo?: string) => void;
}

const Outro = ({ onComplete }: OutroProps) => {
  const [typedExitText, setTypedExitText] = useState('');
  const [exitClicked, setExitClicked] = useState(false);
  
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Text to display when exit is clicked
  const exitText = "you've humilated yourself by throwing yourself out from this show, but atleast you got the chance to get roasted, consider yourself lucky";

  // Clean up function
  const cleanup = useCallback(() => {
    if (typingRef.current) {
      clearTimeout(typingRef.current);
      typingRef.current = null;
    }
  }, []);

  // Function to start typing animation when exit is clicked
  const startTypingAnimation = useCallback(() => {
    console.log("Exit button clicked, starting typing animation");
    setExitClicked(true);
    
    let index = 0;
    const typeNextCharacter = () => {
      if (index < exitText.length) {
        setTypedExitText(prev => prev + exitText.charAt(index));
        index++;
        typingRef.current = setTimeout(typeNextCharacter, 30); // typing speed
      } else {
        // When typing animation is complete, wait a bit and navigate to enter button
        console.log("Typing animation complete, will redirect to ENTER_BUTTON in 2 seconds");
        setTimeout(() => {
          console.log("Outro complete, redirecting to ENTER_BUTTON");
          onComplete('ENTER_BUTTON');
        }, 2000);
      }
    };
    
    // Start typing
    typeNextCharacter();
  }, [exitText, onComplete]);

  // Clean up on component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#111319",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        {/* Title */}
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
          THE END
        </motion.h1>

        {/* Exit button */}
        {!exitClicked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              marginTop: "3rem",
            }}
          >
            <button
              onClick={startTypingAnimation}
              className="barriecito-regular"
              style={{
                backgroundColor: '#00a0a0',
                color: 'white',
                border: 'none',
                borderRadius: '0px',
                padding: '0.75em 2em',
                fontSize: '1.1em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              Exit
            </button>
          </motion.div>
        )}

        {/* Typing animation after exit clicked */}
        {exitClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: '#00a0a0',
              fontFamily: '"Barriecito", cursive',
              fontSize: '1.5rem',
              maxWidth: '800px',
              marginTop: '2rem',
              lineHeight: '1.4',
              textAlign: 'center',
            }}
          >
            {typedExitText}
            {typedExitText.length < exitText.length && (
              <span style={{ 
                opacity: 0.7, 
                animation: 'blink 1s infinite',
                marginLeft: '2px'
              }}>
                |
              </span>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 0.7; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Outro;
