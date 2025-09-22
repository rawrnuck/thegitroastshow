import { useState, useEffect, useRef, useCallback } from 'react';

interface RoastSoundOption {
  filename: string;
  content: string;
}

interface RoastSoundStage {
  order: number;
  stage_name: string;
  options: RoastSoundOption[];
  sfx_transition?: string;
}

interface RoastSoundCollection {
  title: string;
  description: string;
  sfx_intro: string;
  sfx_outro: string;
  roast_sequence: RoastSoundStage[];
}

interface RoastSoundData {
  audio_roast_collection: RoastSoundCollection;
}

interface RoastSoundProps {
  onComplete: () => void;
  username?: string;
}

const RoastSound = ({ onComplete, username = "user" }: RoastSoundProps) => {
  const [roastData, setRoastData] = useState<RoastSoundData | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [currentOption, setCurrentOption] = useState<RoastSoundOption | null>(null);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentCue, setCurrentCue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load roast data - this would be fetched from API based on username
  useEffect(() => {
    const loadRoastData = async () => {
      try {
        // For now, using a mock structure similar to fillers
        // In real implementation, this would fetch user-specific roast data
        const mockData: RoastSoundData = {
          audio_roast_collection: {
            title: `Roasting ${username}`,
            description: `A personalized roast for ${username}`,
            sfx_intro: "micmoving.mp3",
            sfx_outro: "applause.mp3",
            roast_sequence: [
              {
                order: 1,
                stage_name: "Opening",
                options: [
                  {
                    filename: `${username}_intro_01.mp3`,
                    content: `Ladies and gentlemen, please welcome ${username} to tonight's roast!`
                  }
                ],
                sfx_transition: "applause.mp3"
              },
              {
                order: 2,
                stage_name: "GitHub Analysis",
                options: [
                  {
                    filename: `${username}_github_01.mp3`,
                    content: `I took a look at ${username}'s GitHub profile, and wow... I've seen more activity in abandoned repositories!`
                  }
                ],
                sfx_transition: "crowdboos.mp3"
              },
              {
                order: 3,
                stage_name: "Code Quality",
                options: [
                  {
                    filename: `${username}_code_01.mp3`,
                    content: `${username}'s code is so clean, it makes Marie Kondo jealous. Too bad clean doesn't mean functional!`
                  }
                ],
                sfx_transition: "rimshot.mp3"
              },
              {
                order: 4,
                stage_name: "Closing",
                options: [
                  {
                    filename: `${username}_closing_01.mp3`,
                    content: `That's all for tonight, folks! Let's give it up one more time for ${username}!`
                  }
                ]
              }
            ]
          }
        };
        
        // In real implementation, you would fetch this data:
        // const response = await roastAPI.getRoastAudioCollection(username);
        // const data: RoastSoundData = await response.json();
        
        setRoastData(mockData);
        console.log("Loaded roast sound data for:", username);
      } catch (error) {
        console.error("Error loading roast sound data:", error);
        // Fallback data
        setRoastData({
          audio_roast_collection: {
            title: "Default Roast",
            description: "A generic roast",
            sfx_intro: "micmoving.mp3",
            sfx_outro: "applause.mp3",
            roast_sequence: [
              {
                order: 1,
                stage_name: "Generic",
                options: [
                  {
                    filename: "generic_roast_01.mp3",
                    content: "Welcome to tonight's roast! Unfortunately, we couldn't find enough material to roast properly."
                  }
                ]
              }
            ]
          }
        });
      }
    };
    
    loadRoastData();
  }, [username]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
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
    cleanup();
    
    setTypedText('');
    
    if (!text) return;
    
    const totalChars = text.length;
    const charDelay = Math.max(50, duration * 1000 / totalChars);
    
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

  // Function to play roast audio (pre-recorded, user-specific)
  const playRoastAudio = useCallback((option: RoastSoundOption): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioRef.current) {
        console.error("Roast audio element not available");
        // Fallback: show text for a reasonable duration
        setTypedText(option.content);
        setTimeout(resolve, Math.max(3000, option.content.length * 80));
        return;
      }
      
      try {
        // In real implementation, these would be pre-generated audio files
        // stored in a user-specific directory or CDN path
        const audioPath = `/media/roasts/users/${username}/${option.filename}`;
        console.log(`Playing roast audio: ${audioPath}`);
        
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
          console.log("Falling back to text display");
          // Fallback: show full text and wait
          setTypedText(option.content);
          setTimeout(resolve, Math.max(3000, option.content.length * 80));
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
            console.log("Falling back to text display");
            // Fallback: show full text and wait
            setTypedText(option.content);
            setTimeout(resolve, Math.max(3000, option.content.length * 80));
          });
        };
        
      } catch (error) {
        console.error("Error setting up roast audio:", error);
        setTypedText(option.content);
        setTimeout(resolve, 3000);
      }
    });
  }, [startTypingAnimation, username]);

  // Main sequence controller
  const runSequence = useCallback(async () => {
    if (!roastData || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const roastSequence = roastData.audio_roast_collection.roast_sequence;
      
      // Step -1: Play intro SFX
      if (currentStageIndex === -1) {
        console.log("Playing intro SFX");
        await playSfx(roastData.audio_roast_collection.sfx_intro);
        setCurrentStageIndex(0);
        setIsProcessing(false);
        return;
      }
      
      // Check if we've completed all stages
      if (currentStageIndex >= roastSequence.length) {
        console.log("All stages complete, playing outro");
        await playSfx(roastData.audio_roast_collection.sfx_outro);
        onComplete();
        setIsProcessing(false);
        return;
      }
      
      // Play current stage roast
      const currentStage = roastSequence[currentStageIndex];
      
      console.log(`Playing stage ${currentStageIndex + 1}: ${currentStage.stage_name}`);
      
      // Select random option from current stage
      const options = currentStage.options;
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedOption = options[randomIndex];
      
      setCurrentOption(selectedOption);
      setShowText(true);
      
      console.log(`Selected option: ${selectedOption.content}`);
      
      // Play the roast audio and wait for completion
      await playRoastAudio(selectedOption);
      
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
      console.error("Error in roast sequence:", error);
      setIsProcessing(false);
    }
  }, [roastData, currentStageIndex, isProcessing, playSfx, playRoastAudio, onComplete]);

  // Trigger sequence when stage changes
  useEffect(() => {
    runSequence();
  }, [currentStageIndex, roastData, runSequence]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="roast-sound-container" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Don't interfere with other components
      zIndex: 1 // Lower z-index than RoastScript
    }}>
      {/* Main audio for roast recordings */}
      <audio 
        ref={audioRef}
        preload="none"
      />
      
      {/* SFX audio for transitions, intro and outro */}
      <audio 
        ref={sfxRef}
        preload="none"
      />
      
      {/* RoastSound runs in background - visual elements hidden but variables used */}
      <div style={{ display: 'none' }}>
        {currentOption?.content} {typedText} {currentCue} {showText ? 'shown' : 'hidden'}
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

export default RoastSound;