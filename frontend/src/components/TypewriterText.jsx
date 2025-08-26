import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, speed = 50, onComplete, canRestart = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Split text into words for variable speed
  const words = text.split(' ');
  const fullText = text;

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const currentChar = fullText[currentIndex];
      
      // Variable typing speed based on character type
      let delay = speed;
      
      // Slower for punctuation and emphasis
      if ('.,!?;:'.includes(currentChar)) {
        delay = speed * 3;
      }
      // Faster for common words
      else if (currentChar === ' ') {
        delay = speed * 0.5;
      }
      // Normal speed for letters
      else {
        delay = speed + Math.random() * 20; // Add slight randomness
      }

      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + currentChar);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, fullText, speed, onComplete, isComplete]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  const handleRestart = () => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
    setShowCursor(true);
  };

  // Format text with proper line breaks and styling
  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="mb-2">
        {line}
      </div>
    ));
  };

  return (
    <div className="font-mono text-accent-light leading-relaxed">
      <div className="relative">
        {/* Main text content */}
        <div className="text-lg md:text-xl whitespace-pre-wrap">
          {formatText(displayedText)}
          {/* Cursor */}
          <span className={`
            inline-block w-0.5 h-6 bg-primary-teal ml-1
            ${showCursor ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-100
          `}>
          </span>
        </div>

        {/* Restart button */}
        {isComplete && canRestart && (
          <div className="mt-6 text-center">
            <button
              onClick={handleRestart}
              className="
                px-4 py-2 bg-transparent border border-primary-teal border-opacity-50
                text-primary-teal font-mono text-sm rounded-lg
                hover:border-opacity-100 hover:bg-primary-teal hover:bg-opacity-10
                transition-all duration-300 hover:border-glow
              "
            >
              ▶ REPLAY ROAST
            </button>
          </div>
        )}
      </div>

      {/* Terminal-style info */}
      <div className="mt-8 pt-4 border-t border-primary-teal border-opacity-20">
        <div className="text-xs font-mono text-primary-dark space-y-1">
          <div className="flex justify-between">
            <span>Characters: {displayedText.length}/{fullText.length}</span>
            <span>Status: {isComplete ? 'COMPLETE' : 'TYPING'}</span>
          </div>
          <div className="text-accent-cyan">
            [ROAST ENGINE] {isComplete ? 'Destruction complete' : 'Generating savagery...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypewriterText;
