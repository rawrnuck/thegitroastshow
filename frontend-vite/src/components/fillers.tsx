import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FillerOption {
  filename: string;
  content: string;
}

interface FillerStage {
  order: number;
  stage_name: string;
  options: FillerOption[];
  sfx_transition?: string;
}

interface AudioRoastCollection {
  title: string;
  description: string;
  sfx_intro: string;
  roast_sequence: FillerStage[];
}

interface FillerData {
  audio_roast_collection: AudioRoastCollection;
}

interface FillersProps {
  onComplete: () => void;
  username?: string; // Add username prop to show personalized loading message
}

const Fillers = ({ onComplete, username }: FillersProps) => {
  const [fillerData, setFillerData] = useState<FillerData | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [currentOption, setCurrentOption] = useState<FillerOption | null>(null);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCue, setCurrentCue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false); // Prevent overlapping executions
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load filler data
  useEffect(() => {
    const loadFillerData = async () => {
      try {
        const response = await fetch('/media/fillerswithsfx.json');
        const data: FillerData = await response.json();
        setFillerData(data);
        console.log("Loaded filler data with SFX");
      } catch (error) {
        console.error("Error loading filler data:", error);
      }
    };
    
    loadFillerData();
  }, []);

  // Clean up function
  const cleanup = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (cueTimeoutRef.current) {
      clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = null;
    }
  }, []);

  // Function to play SFX with proper cleanup
  const playSfx = useCallback((filename: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!sfxRef.current) {
        console.error("SFX audio element not available");
        resolve();
        return;
      }
      
      try {
        const sfxPath = `/media/sounds/${filename}`;
        console.log(`Playing SFX: ${sfxPath}`);
        
        // Display cue for sound effect
        const cueText = filename === 'applause.mp3' ? '*applause*' :
                        filename === 'airhorn.mp3' ? '*air horn*' :
                        filename === 'crowdboos.mp3' ? '*crowd boos*' :
                        filename === 'crowdgasp.mp3' ? '*crowd gasps*' :
                        filename === 'crickets.mp3' ? '*crickets*' :
                        filename === 'rimshot.mp3' ? '*rimshot*' :
                        filename === 'micdrop.mp3' ? '*mic drop*' :
                        filename === 'micmoving.mp3' ? '*adjusts mic*' : 
                        `*${filename.replace('.mp3', '')}*`;
        
        setCurrentCue(cueText);
        
        // Stop any currently playing SFX
        sfxRef.current.pause();
        sfxRef.current.currentTime = 0;
        
        // Clean up previous event handlers
        sfxRef.current.onended = null;
        sfxRef.current.onerror = null;
        sfxRef.current.oncanplaythrough = null;
        sfxRef.current.onloadedmetadata = null;
        
        // Set up new event handlers
        sfxRef.current.onended = () => {
          console.log(`SFX completed: ${filename}`);
          setCurrentCue('');
          resolve();
        };
        
        sfxRef.current.onerror = (e) => {
          console.error("SFX error:", e);
          setCurrentCue('');
          resolve();
        };
        
        // Set source and play
        sfxRef.current.src = sfxPath;
        sfxRef.current.load();
        
        sfxRef.current.oncanplaythrough = () => {
          sfxRef.current?.play().catch(error => {
            console.error("Error playing SFX:", error, filename);
            setCurrentCue('');
            resolve();
          });
        };
        
      } catch (error) {
        console.error("Error setting up SFX:", error);
        setCurrentCue('');
        resolve();
      }
    });
  }, []);

  // Improved typing animation
  const startTypingAnimation = useCallback((text: string, duration: number) => {
    cleanup(); // Clean up any existing animation
    
    setTypedText('');
    
    if (!text) return;
    
    const totalChars = text.length;
    const charDelay = Math.max(50, duration * 1000 / totalChars); // Minimum 50ms per char
    
    let currentIndex = 0;
    
    const typeChar = () => {
      if (currentIndex <= totalChars) {
        setTypedText(text.substring(0, currentIndex));
        currentIndex++;
        
        if (currentIndex <= totalChars) {
          typingIntervalRef.current = setTimeout(typeChar, charDelay);
        }
      }
    };
    
    typeChar();
  }, [cleanup]);

  // Function to play roast audio
  const playRoast = useCallback((option: FillerOption): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current) {
        console.error("Roast audio element not available");
        resolve();
        return;
      }
      
      try {
        const audioPath = `/media/roasts/${option.filename}`;
        console.log(`Playing roast: ${audioPath}`);
        
        // Stop any currently playing audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Clean up previous event handlers
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.oncanplaythrough = null;
        audioRef.current.onloadedmetadata = null;
        
        // Set up new event handlers
        audioRef.current.onended = () => {
          console.log("Roast audio ended");
          resolve();
        };
        
        audioRef.current.onerror = (e) => {
          console.error("Roast audio error:", e);
          setTypedText(option.content);
          setTimeout(resolve, 2000);
        };
        
        audioRef.current.onloadedmetadata = () => {
          const duration = audioRef.current?.duration || 3;
          startTypingAnimation(option.content, duration);
        };
        
        // Set source and play
        audioRef.current.src = audioPath;
        audioRef.current.load();
        
        audioRef.current.oncanplaythrough = () => {
          audioRef.current?.play().catch(error => {
            console.error("Error playing roast audio:", error);
            setTypedText(option.content);
            setTimeout(resolve, 2000);
          });
        };
        
      } catch (error) {
        console.error("Error setting up roast audio:", error);
        setTypedText(option.content);
        setTimeout(resolve, 2000);
      }
    });
  }, [startTypingAnimation]);

  // Main sequence controller - only runs when not processing and data is available
  const runSequence = useCallback(async () => {
    if (!fillerData || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const roastSequence = fillerData.audio_roast_collection.roast_sequence;
      
      // Step -1: Play intro SFX
      if (currentStageIndex === -1) {
        console.log("Playing intro SFX");
        await playSfx(fillerData.audio_roast_collection.sfx_intro);
        setCurrentStageIndex(0);
        setIsProcessing(false);
        return;
      }
      
      // Check if we've completed all stages
      if (currentStageIndex >= roastSequence.length) {
        console.log("All stages complete, calling onComplete");
        onComplete();
        setIsProcessing(false);
        return;
      }
      
      // Play current stage roast
      const currentStage = roastSequence[currentStageIndex];
      console.log(`Playing stage ${currentStageIndex + 1}/${roastSequence.length}: ${currentStage.stage_name}`);
      
      // Select random option from current stage
      const options = currentStage.options;
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedOption = options[randomIndex];
      
      setCurrentOption(selectedOption);
      setShowText(true);
      
      console.log(`Selected option: ${selectedOption.content}`);
      
      // Play the roast audio and wait for completion
      await playRoast(selectedOption);
      
      // Play transition SFX if available
      if (currentStage.sfx_transition) {
        await playSfx(currentStage.sfx_transition);
      }
      
      // Hide text and move to next stage
      setShowText(false);
      
      // Wait a bit before moving to next stage to allow text fade out
      setTimeout(() => {
        setCurrentStageIndex(prev => prev + 1);
        setIsProcessing(false);
      }, 500);
      
    } catch (error) {
      console.error("Error in sequence:", error);
      setIsProcessing(false);
    }
  }, [fillerData, currentStageIndex, isProcessing, playSfx, playRoast, onComplete]);

  // Trigger sequence when stage changes and not processing
  useEffect(() => {
    runSequence();
}, [currentStageIndex, fillerData, runSequence]); // Removed runSequence from deps to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="fillers-container" style={{
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
      zIndex: 200
    }}>
      {/* Main audio for roasts */}
      <audio 
        ref={audioRef}
        preload="none"
      />
      
      {/* SFX audio for transitions, intro and outro */}
      <audio 
        ref={sfxRef}
        preload="none"
      />
      
      {/* Cue display */}
      <AnimatePresence mode="wait">
        {currentCue && (
          <motion.div
            key={currentCue}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '15%',
              fontSize: '1.4rem',
              color: '#00a0a0',
              fontFamily: '"Barriecito", cursive',
              textAlign: 'center',
              
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)'
            }}
          >
            {currentCue}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Text display */}
      <AnimatePresence mode="wait">
        {showText && currentOption && (
          <motion.div
            key={currentOption.filename}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              maxWidth: '80%',
              textAlign: 'center',
              padding: '2rem',
              color: 'white',
              fontSize: '2rem',
              fontFamily: '"Barriecito", cursive',
              lineHeight: '1.4',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            <span style={{ display: 'inline-block', minHeight: '1.4em' }}>
              {typedText}
              {typedText && typedText.length < currentOption.content.length && (
                <span style={{ 
                  opacity: 0.7, 
                  animation: 'blink 1s infinite',
                  marginLeft: '2px'
                }}>
                  |
                </span>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading message for roast preparation */}
      {username && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          style={{
            position: 'absolute',
            bottom: '10%',
            fontSize: '1rem',
            color: '#aaaaaa',
            fontFamily: '"Barriecito", cursive',
            textAlign: 'center',
          }}
        >
          
        </motion.div>
      )}
      
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 0.7; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Fillers;