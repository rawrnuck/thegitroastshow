import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Define types for roast content
interface RoastSoundItem {
  type: 'sound';
  effect: string;
  cue: string;
  emoji: string;
  file: string;
}

interface RoastSpeechItem {
  type: 'speech';
  text: string;
}

type RoastItem = RoastSoundItem | RoastSpeechItem;

// Define props for the Roast component
interface RoastProps {
  onComplete: () => void;
  username?: string;
}

// Mock roast data (will be replaced with API data in the future)
const mockRoastData: RoastItem[] = [
  {type: 'sound', effect: 'mic_drop', cue: '*adjusts mic*', emoji: '🎤', file: 'sounds/micdrop.mp3'},
  {type: 'speech', text: "Ladies and gentlemen, welcome to tonight's roast of our special guest - a coding legend and a shining star in the galaxy of obscurity!"},
  {type: 'sound', effect: 'crowd_laugh', cue: '*crowd laughs*', emoji: '😂', file: 'sounds/applause.mp3'},
  {type: 'speech', text: "Now, let's dive into the bio of this enigmatic figure. Is it poetic? Profound? Or just a placeholder where they've forgotten the meaning of code in an infinite loop of despair?"},
  {type: 'sound', effect: 'crowd_laugh', cue: '*crowd laughs*', emoji: '😂', file: 'sounds/applause.mp3'},
  {type: 'speech', text: `It's like the intro to a choose-your-own-adventure book, except instead of "choose your own adventure," it's "choose your own commit message."`},
  {type: 'sound', effect: 'rimshot', cue: '*rimshot*', emoji: '🥁', file: 'sounds/rimshot.mp3'},
  {type: 'speech', text: "But seriously, folks, with a bio that's shorter than their attention span, one has to wonder: are they a minimalist? A modern artist? A poet of code?"},
  {type: 'sound', effect: 'crickets', cue: '*crickets*', emoji: '🦗', file: 'sounds/crickets.mp3'},
  {type: 'speech', text: 'Or are they just too scared to write their own bio?'},
  {type: 'sound', effect: 'crowd_laugh', cue: '*crowd laughs*', emoji: '😂', file: 'sounds/applause.mp3'},
  {type: 'speech', text: "Let's talk about their impressive collection of 16 repositories. That's more repositories than you've eaten leftovers from the fridge this week."},
  {type: 'sound', effect: 'crowd_laugh', cue: '*crowd laughs*', emoji: '😂', file: 'sounds/applause.mp3'},
  {type: 'speech', text: "And the best part? Zero stars. That's right; their GitHub presence is so far off the radar, it's like a abandoned puppy on a deserted island."},
  {type: 'sound', effect: 'crowd_gasp', cue: '*crowd gasps*', emoji: '😱', file: 'sounds/crowdgasp.mp3'},
  {type: 'speech', text: `But hey, at least they're consistent. Their commit history is so bland, it should win some sort of award for "Most Creative Use of Defaults."`},
  {type: 'sound', effect: 'air_horn', cue: '*air horn*', emoji: '📯', file: 'sounds/airhorn.mp3'},
  {type: 'speech', text: "Now, let's talk about their top languages: Jupyter Notebook, Python, and JavaScript. Is this a developer or a tower of Babel of programming languages held together with duct tape and prayers?"},
  {type: 'sound', effect: 'crowd_laugh', cue: '*crowd laughs*', emoji: '😂', file: 'sounds/applause.mp3'},
  {type: 'speech', text: 'But in all seriousness, rawrnuck, I have to give you credit for putting yourself out there. That takes real courage, folks.'},
  {type: 'sound', effect: 'applause', cue: '*applause*', emoji: '👏', file: 'sounds/applause.mp3'},
  {type: 'speech', text: 'I mean, who needs validation when you can have 16 repositories and 0 stars?'},
  {type: 'sound', effect: 'boo', cue: '*crowd boos*', emoji: '👎', file: 'sounds/crowdboos.mp3'},
  {type: 'speech', text: "And finally, let's talk about their follower count. It's so impressively low, it's not even enough to be displayed on their GitHub profile."},
  {type: 'sound', effect: 'crickets', cue: '*crickets*', emoji: '🦗', file: 'sounds/crickets.mp3'},
  {type: 'speech', text: "In conclusion, rawrnuck, you're a true original. A coding maverick who's forgotten the meaning of code in an infinite loop of despair."},
  {type: 'sound', effect: 'mic_drop', cue: '*drops mic*', emoji: '🎤', file: 'sounds/micdrop.mp3'}
];

const Roast = ({ onComplete, username = 'user' }: RoastProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showText, setShowText] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // In the future, replace this with actual API call
  const [roastData] = useState<RoastItem[]>(mockRoastData);
  
  // Effect to process the roast sequence
  useEffect(() => {
    if (currentItemIndex >= roastData.length) {
      // Roast is complete
      setTimeout(() => {
        onComplete();
      }, 1000);
      return;
    }
    
    const currentItem = roastData[currentItemIndex];
    
    const processNextItem = () => {
      if (currentItem.type === 'sound') {
        // Play sound effect
        setShowCue(true);
        setCurrentEmoji(currentItem.emoji);
        playSound(currentItem.file, () => {
          setShowCue(false);
          setTimeout(() => {
            setCurrentItemIndex(prev => prev + 1);
          }, 500);
        });
      } else if (currentItem.type === 'speech') {
        // Display speech text
        setTypedText('');
        setShowText(true);
        
        // Type out the text
        const textLength = currentItem.text.length;
        const typingDuration = Math.max(5000, textLength * 50); // At least 5 seconds, or longer for longer text
        
        let currentTextIndex = 0;
        const typingInterval = setInterval(() => {
          if (currentTextIndex <= textLength) {
            setTypedText(currentItem.text.substring(0, currentTextIndex));
            currentTextIndex++;
          } else {
            clearInterval(typingInterval);
            
            // Move to next item after a delay
            setTimeout(() => {
              setShowText(false);
              setTimeout(() => {
                setCurrentItemIndex(prev => prev + 1);
              }, 500);
            }, 1000);
          }
        }, typingDuration / textLength);
        
        return () => clearInterval(typingInterval);
      }
    };
    
    processNextItem();
  }, [currentItemIndex, roastData, onComplete]);
  
  // Function to play sound
  const playSound = (filename: string, onEnd: () => void): void => {
    if (!audioRef.current) {
      console.error("Audio element not available");
      onEnd();
      return;
    }
    
    try {
      // Correct path for sound effects
      const soundPath = `/media/${filename}`;
      console.log(`Playing sound: ${soundPath}`);
      
      audioRef.current.src = soundPath;
      audioRef.current.onended = () => {
        console.log(`Sound completed: ${filename}`);
        onEnd();
      };
      
      audioRef.current.play().catch(error => {
        console.error("Error playing sound:", error, filename);
        onEnd();
      });
    } catch (error) {
      console.error("Error setting up sound:", error);
      onEnd();
    }
  };
  
  // Replace instances of the username in the text
  const personalizeText = (text: string): string => {
    return text.replace(/rawrnuck/g, username);
  };
  
  return (
    <div className="roast-container" style={{
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
      {/* Audio element for sounds */}
      <audio 
        ref={audioRef}
        onError={(e) => console.error("Audio error:", e)}
      />
      
      {/* Sound cue display */}
      <AnimatePresence mode="wait">
        {showCue && currentItemIndex < roastData.length && 'cue' in roastData[currentItemIndex] && (
          <motion.div
            key={`cue-${currentItemIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '20%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#00a0a0',
              fontFamily: '"Barriecito", cursive'
            }}
          >
            <span style={{ fontSize: '3rem' }}>{currentEmoji}</span>
            <span style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
              {(roastData[currentItemIndex] as RoastSoundItem).cue}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Text display */}
      <AnimatePresence mode="wait">
        {showText && currentItemIndex < roastData.length && 'text' in roastData[currentItemIndex] && (
          <motion.div
            key={`text-${currentItemIndex}`}
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
            {personalizeText(typedText)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roast;
