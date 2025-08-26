import React, { useState, useEffect } from 'react';

const LoadingAnimation = ({ type = 'initial', onComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  // Different loading messages for different states
  const initialMessages = [
    'Initializing roast protocol',
    'Loading sass modules',
    'Calibrating sarcasm levels',
    'Ready to roast'
  ];

  const processingMessages = [
    'Scanning repositories',
    'Analyzing commit history',
    'Detecting code smells',
    'Calculating cringe factor',
    'Generating savage commentary',
    'Preparing devastating critique'
  ];

  const messages = type === 'initial' ? initialMessages : processingMessages;
  const duration = type === 'initial' ? 3000 : 6000;
  const messageDelay = duration / messages.length;

  useEffect(() => {
    // Dots animation
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          if (onComplete) {
            setTimeout(onComplete, 500); // Small delay before completing
          }
          return 100;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    // Message cycling
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        if (prev >= messages.length - 1) {
          clearInterval(messageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, messageDelay);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [duration, messages.length, onComplete, messageDelay]);

  // Create floating particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-dark bg-opacity-95 z-50">
      {/* Matrix background */}
      <div className="matrix-bg" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles}
      </div>

      <div className="text-center space-y-8 p-8 relative z-10">
        {/* ASCII Art Logo */}
        <div className="text-primary-teal text-glow-strong font-mono text-xs sm:text-sm leading-tight">
          <pre className="whitespace-pre">
{`
██████╗  ██████╗  █████╗ ███████╗████████╗    ██████╗ ███████╗██████╗  ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝    ██╔══██╗██╔════╝██╔══██╗██╔═══██╗
██████╔╝██║   ██║███████║███████╗   ██║       ██████╔╝█████╗  ██████╔╝██║   ██║
██╔══██╗██║   ██║██╔══██║╚════██║   ██║       ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║
██║  ██║╚██████╔╝██║  ██║███████║   ██║       ██║  ██║███████╗██║     ╚██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ 
`}
          </pre>
        </div>

        {/* Loading message */}
        <div className="text-accent-light text-lg font-mono">
          <span className="text-glow">{messages[currentMessage]}</span>
          <span className="text-primary-teal loading-dots">{dots}</span>
        </div>

        {/* Progress bar */}
        <div className="w-80 max-w-full mx-auto">
          <div className="bg-bg-darker rounded-full h-2 border border-primary-teal border-opacity-30">
            <div 
              className="bg-gradient-to-r from-primary-teal to-primary-green h-full rounded-full transition-all duration-300 ease-out border-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center mt-2 text-primary-teal font-mono text-sm">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Additional terminal-style info */}
        <div className="text-xs font-mono text-primary-dark space-y-1">
          <div>[████████████████████████████████] {progress >= 100 ? 'COMPLETE' : 'LOADING'}</div>
          <div className="text-accent-cyan">
            {type === 'initial' ? 'System Status: ONLINE' : 'Roast Engine: ENGAGED'}
          </div>
        </div>

        {/* Blinking cursor */}
        <div className="flex justify-center">
          <span className="cursor"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
