import { useState, useEffect, useRef } from 'react';
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
  sfx_outro: string;
  roast_sequence: FillerStage[];
}

interface FillerData {
  audio_roast_collection: AudioRoastCollection;
}

interface FillersProps {
  onComplete: () => void;
}

const Fillers = ({ onComplete }: FillersProps) => {
  const [fillerData, setFillerData] = useState<FillerData | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1); // Start at -1 for intro
  const [currentOption, setCurrentOption] = useState<FillerOption | null>(null);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [stageName, setStageName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

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

  // Handle the flow of the presentation
  useEffect(() => {
    if (!fillerData) return;
    
    const playNextStep = async () => {
      const roastSequence = fillerData.audio_roast_collection.roast_sequence;
      
      // Step -1: Play intro SFX
      if (currentStageIndex === -1) {
        console.log("Playing intro SFX");
        await playSfx(fillerData.audio_roast_collection.sfx_intro, () => {
          setCurrentStageIndex(0);
        });
        return;
      }
      
      // Check if we've completed all stages
      if (currentStageIndex >= roastSequence.length) {
        console.log("All stages complete, playing outro");
        await playSfx(fillerData.audio_roast_collection.sfx_outro, () => {
          onComplete();
        });
        return;
      }
      
      // Play current stage roast
      const currentStage = roastSequence[currentStageIndex];
      setStageName(currentStage.stage_name);
      console.log(`Playing stage ${currentStageIndex + 1}: ${currentStage.stage_name}`);
      
      // Select random option from current stage
      const options = currentStage.options;
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedOption = options[randomIndex];
      
      setCurrentOption(selectedOption);
      setTypedText('');
      setShowText(true);
      
      console.log(`Selected option: ${selectedOption.content}`);
      
      // Play the roast audio
      await playRoast(selectedOption);
      
      // Play transition SFX and move to next stage
      if (currentStage.sfx_transition) {
        await playSfx(currentStage.sfx_transition, () => {
          setShowText(false);
          setTimeout(() => {
            setCurrentStageIndex(prev => prev + 1);
          }, 500);
        });
      } else {
        // No transition SFX, just move to the next stage
        setShowText(false);
        setTimeout(() => {
          setCurrentStageIndex(prev => prev + 1);
        }, 1000);
      }
    };
    
    playNextStep();
  }, [currentStageIndex, fillerData, onComplete]);

  // Function to play SFX with proper path
  const playSfx = (filename: string, onComplete: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (!sfxRef.current) {
        console.error("SFX audio element not available");
        onComplete();
        resolve();
        return;
      }
      
      try {
        // Correct path for sound effects
        const sfxPath = `/media/sounds/${filename}`;
        console.log(`Playing SFX: ${sfxPath}`);
        
        sfxRef.current.src = sfxPath;
        sfxRef.current.onended = () => {
          console.log(`SFX completed: ${filename}`);
          onComplete();
          resolve();
        };
        
        sfxRef.current.play().catch(error => {
          console.error("Error playing SFX:", error, filename);
          onComplete();
          resolve();
        });
      } catch (error) {
        console.error("Error setting up SFX:", error);
        onComplete();
        resolve();
      }
    });
  };

  // Function to play roast audio with proper path
  const playRoast = (option: FillerOption): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current) {
        console.error("Roast audio element not available");
        resolve();
        return;
      }
      
      try {
        // Correct path for roast audio
        const audioPath = `/media/roasts/${option.filename}`;
        console.log(`Playing roast: ${audioPath}`);
        
        audioRef.current.src = audioPath;
        
        // Type out text while audio plays
        const startTyping = () => {
          const textLength = option.content.length;
          const audioDuration = audioRef.current?.duration || 3;
          
          if (isFinite(audioDuration)) {
            const charInterval = audioDuration * 1000 / (textLength + 5);
            
            let currentIndex = 0;
            const typingInterval = setInterval(() => {
              if (currentIndex <= textLength) {
                setTypedText(option.content.substring(0, currentIndex));
                currentIndex++;
              } else {
                clearInterval(typingInterval);
              }
            }, charInterval);
            
            return () => clearInterval(typingInterval);
          } else {
            // Fallback typing animation
            setTypedText(option.content);
          }
        };
        
        // Handle audio load
        audioRef.current.onloadedmetadata = startTyping;
        
        // Handle audio end
        audioRef.current.onended = () => {
          console.log("Roast audio ended");
          resolve();
        };
        
        audioRef.current.play().catch(error => {
          console.error("Error playing roast audio:", error);
          setTypedText(option.content); // Show full text immediately if audio fails
          setTimeout(resolve, 3000); // Reasonable delay before moving on
        });
      } catch (error) {
        console.error("Error setting up roast audio:", error);
        setTypedText(option.content);
        setTimeout(resolve, 3000);
      }
    });
  };

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
        onError={(e) => console.error("Roast audio error:", e)}
      />
      
      {/* SFX audio for transitions, intro and outro */}
      <audio 
        ref={sfxRef}
        onError={(e) => console.error("SFX error:", e)}
      />
      
      {/* Stage name display */}
      {stageName && currentStageIndex >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 0.7, y: 0 }}
          style={{
            position: 'absolute',
            top: '10%',
            fontSize: '1.2rem',
            color: '#00a0a0',
            fontFamily: '"Barriecito", cursive'
          }}
        >
          {stageName}
        </motion.div>
      )}
      
      {/* Text display */}
      <AnimatePresence mode="wait">
        {showText && currentOption && (
          <motion.div
            key={currentOption.filename}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: '80%',
              textAlign: 'center',
              padding: '2rem',
              color: 'white',
              fontSize: '2rem',
              fontFamily: '"Barriecito", cursive'
            }}
          >
            {typedText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fillers;
