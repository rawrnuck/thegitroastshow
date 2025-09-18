import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { roastAPI } from "../services/api";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import type { RoastItem, SoundItem, SpeechItem } from "../types/api";

// Define props for the Roast component
interface RoastProps {
  onComplete: () => void;
  username?: string;
}

// Default roast data used while loading
const loadingRoastData: RoastItem[] = [
  {
    type: "sound",
    effect: "mic_drop",
    cue: "*adjusts mic*",
    emoji: "🎤",
    file: "sounds/micdrop.mp3",
  },
  {
    type: "speech",
    text: "Ladies and gentlemen, welcome to tonight's roast! Please wait while we dig up some dirt on our special guest...",
  },
  {
    type: "sound",
    effect: "crowd_laugh",
    cue: "*crowd laughs*",
    emoji: "😂",
    file: "sounds/applause.mp3",
  },
];

const Roast = ({ onComplete, username = "user" }: RoastProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showText, setShowText] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize TTS with ElevenLabs preference
  const [ttsState, ttsControls] = useTextToSpeech({
    preferElevenLabs: true,
    rate: 1.1,
    pitch: 1,
    volume: 1,
  });

  // Initialize with loading state, then fetch from API
  const [roastData, setRoastData] = useState<RoastItem[]>(loadingRoastData);

  // Load roast data from API
  useEffect(() => {
    const fetchRoastData = async () => {
      setIsLoading(true);

      // Check if we have a valid username
      if (!username || username.trim() === "") {
        console.warn(
          "No username provided to Roast component, using demo data"
        );
        // Use demo data if no username is provided
        setRoastData([
          {
            type: "sound" as const,
            effect: "mic_drop",
            cue: "*adjusts mic*",
            emoji: "🎤",
            file: "sounds/micdrop.mp3",
          },
          {
            type: "speech" as const,
            text: `Ladies and gentlemen, welcome to tonight's roast! We seem to be missing our guest of honor!`,
          },
          {
            type: "sound" as const,
            effect: "crickets",
            cue: "*crickets*",
            emoji: "🦗",
            file: "sounds/crickets.mp3",
          },
          {
            type: "speech" as const,
            text: `Well, this is awkward. I prepared all these jokes and nobody to roast. Let me tell you about my weekend instead...`,
          },
          {
            type: "sound" as const,
            effect: "crowd_laugh",
            cue: "*crowd laughs*",
            emoji: "😂",
            file: "sounds/applause.mp3",
          },
          {
            type: "speech" as const,
            text: `Just kidding! Let's try again with a valid GitHub username, shall we?`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`Fetching roast data for username: ${username}`);
        // Use demo endpoint for testing if backend is not available
        let items;
        try {
          // First try to get a sample roast to test connection
          const isAvailable = await roastAPI.isBackendAvailable();
          console.log("Backend available:", isAvailable);

          if (isAvailable) {
            // Use full roast (not quick) for better GitHub data analysis
            items = await roastAPI.getRoastItems(username, { language: "en" });
            console.log("Successfully fetched roast items from API:", items);
          } else {
            throw new Error("Backend not available");
          }
        } catch (connectionError) {
          console.warn("Could not connect to backend, using sample data");
          // If backend isn't available, use sample roast
          const sampleResponse = await roastAPI.getSampleRoast();
          // Convert sample response to roast items
          items = [
            {
              type: "sound" as const,
              effect: "mic_drop",
              cue: "*adjusts mic*",
              emoji: "🎤",
              file: "sounds/micdrop.mp3",
            },
            {
              type: "speech" as const,
              text: `Ladies and gentlemen, welcome to tonight's roast of ${username}!`,
            },
            {
              type: "sound" as const,
              effect: "applause",
              cue: "*applause*",
              emoji: "👏",
              file: "sounds/applause.mp3",
            },
            {
              type: "speech" as const,
              text: sampleResponse.roast.replace(
                "your GitHub",
                `${username}'s GitHub`
              ),
            },
            {
              type: "sound" as const,
              effect: "crowd_laugh",
              cue: "*crowd laughs*",
              emoji: "😂",
              file: "sounds/applause.mp3",
            },
            {
              type: "speech" as const,
              text: `That's all for tonight, folks! Give it up one more time for ${username}!`,
            },
            {
              type: "sound" as const,
              effect: "applause",
              cue: "*applause*",
              emoji: "👏",
              file: "sounds/applause.mp3",
            },
          ];
        }

        console.log("Received roast items:", items);

        if (items && items.length > 0) {
          setRoastData(items);
          // Reset to start when new data is loaded
          setCurrentItemIndex(0);
        } else {
          throw new Error("No roast data received");
        }
      } catch (error) {
        console.error("Error fetching roast data:", error);
        // Set a fallback roast if API fails
        setRoastData([
          {
            type: "sound" as const,
            effect: "mic_drop",
            cue: "*adjusts mic*",
            emoji: "🎤",
            file: "sounds/micdrop.mp3",
          },
          {
            type: "speech" as const,
            text: `Ladies and gentlemen, welcome to tonight's roast of ${username}!`,
          },
          {
            type: "sound" as const,
            effect: "applause",
            cue: "*applause*",
            emoji: "👏",
            file: "sounds/applause.mp3",
          },
          {
            type: "speech" as const,
            text: `Hmm, it seems like my writers have gone on strike! I couldn't get any dirt on ${username}'s GitHub profile. Either they're too clean or our systems are on vacation.`,
          },
          {
            type: "sound" as const,
            effect: "crickets",
            cue: "*crickets*",
            emoji: "🦗",
            file: "sounds/crickets.mp3",
          },
          {
            type: "speech" as const,
            text: `But remember, no roast means you're doing something right... or very, very wrong!`,
          },
          {
            type: "sound" as const,
            effect: "crowd_laugh",
            cue: "*crowd laughs*",
            emoji: "😂",
            file: "sounds/applause.mp3",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoastData();
  }, [username]);

  // Cleanup TTS when component unmounts
  useEffect(() => {
    return () => {
      ttsControls.cancel();
    };
  }, [ttsControls]);

  // Effect to process the roast sequence
  useEffect(() => {
    if (isLoading) return; // Don't start until data is loaded

    if (currentItemIndex >= roastData.length) {
      // Roast is complete
      setTimeout(() => {
        onComplete();
      }, 3000); // Added longer delay before completion
      return;
    }

    const currentItem = roastData[currentItemIndex];

    const processNextItem = () => {
      if (currentItem.type === "sound") {
        // Play sound effect with a delay
        setTimeout(() => {
          setShowCue(true);
          setCurrentEmoji(currentItem.emoji);
          playSound(currentItem.file, () => {
            setShowCue(false);
            setTimeout(() => {
              setCurrentItemIndex((prev) => prev + 1);
            }, 700); // Longer pause after sound
          });
        }, 500); // Delay before playing sound
      } else if (currentItem.type === "speech") {
        // Reset and prepare for new text
        setTypedText("");
        setShowText(true);

        // Personalize the text with the username
        const personalizedText = personalizeText(currentItem.text);

        // Keep track of speech state and typing state
        let isSpeechStarted = false;
        let typingComplete = false;
        let typingIntervalId: number | null = null;

        // We'll use a ref to track if this specific speech item is active
        const activeSpeechRef = { current: true };

        // Function to handle speech start
        const onSpeechStart = () => {
          if (!activeSpeechRef.current) return; // Safety check
          isSpeechStarted = true;

          // If typing is falling behind speech, speed it up
          if (!typingComplete && typingIntervalId) {
            const remainingText = personalizedText.length - typedText.length;
            if (remainingText > 20) {
              // If we have more than 20 chars left to type
              clearInterval(typingIntervalId);
              startTyping(Math.max(30, typingDuration / 2)); // Faster typing
            }
          }
        };

        // Function to handle speech end
        const onSpeechEnd = () => {
          if (!activeSpeechRef.current) return; // Safety check

          // If typing isn't complete, finish it immediately
          if (!typingComplete) {
            setTypedText(personalizedText);
            typingComplete = true;
            if (typingIntervalId) {
              clearInterval(typingIntervalId);
              typingIntervalId = null;
            }
          }

          // Wait a moment before proceeding to next item
          setTimeout(() => {
            if (activeSpeechRef.current) {
              // Make sure we're still active
              setShowText(false);
              setTimeout(() => {
                if (activeSpeechRef.current) {
                  // Double check still active
                  activeSpeechRef.current = false; // Mark as inactive
                  setCurrentItemIndex((prev) => prev + 1);
                }
              }, 800);
            }
          }, 1000);
        };

        // Calculate typing duration based on text length with reasonable bounds
        const textLength = personalizedText.length;
        const baseDuration = 60; // ms per character
        // Longer texts get faster typing (but never faster than 30ms per char)
        const charDuration =
          textLength > 100
            ? Math.max(30, baseDuration - textLength / 10)
            : baseDuration;
        const typingDuration = Math.max(2000, textLength * charDuration); // At least 2 seconds

        // Function to start the typing animation
        const startTyping = (duration = typingDuration) => {
          let currentTextIndex = typedText.length;

          // Create a new interval with the given duration
          typingIntervalId = window.setInterval(() => {
            if (!activeSpeechRef.current) {
              // This speech item is no longer active, cleanup
              if (typingIntervalId) clearInterval(typingIntervalId);
              return;
            }

            if (currentTextIndex <= textLength) {
              setTypedText(personalizedText.substring(0, currentTextIndex));
              currentTextIndex++;
            } else {
              // Typing is complete
              typingComplete = true;
              if (typingIntervalId) {
                clearInterval(typingIntervalId);
                typingIntervalId = null;
              }

              // If speech has already finished, move to next item
              if (!ttsState.speaking) {
                onSpeechEnd();
              }
            }
          }, duration / textLength);
        };

        // Start typing immediately
        startTyping();

        // Setup speech event listeners
        const speechStartListener = () => onSpeechStart();
        const speechEndListener = () => onSpeechEnd();

        // Custom event system for speech events
        document.addEventListener("tts-started", speechStartListener);
        document.addEventListener("tts-ended", speechEndListener);

        // Start TTS with a small delay to allow typing to begin first
        setTimeout(() => {
          if (activeSpeechRef.current) {
            ttsControls.speak(personalizedText);

            // Fallback - if speech doesn't start or end properly
            setTimeout(() => {
              if (activeSpeechRef.current && !isSpeechStarted) {
                console.warn("Speech failed to start, using fallback timing");
                onSpeechStart();

                // Estimate speech duration based on text length and speaking rate
                // Average speaking rate is ~150 words per minute = ~2.5 words per second
                // Average word is ~5 characters, so ~12.5 chars per second
                const speechDuration = Math.max(
                  3000,
                  (textLength / 12.5) * 1000
                );

                setTimeout(() => {
                  if (activeSpeechRef.current && ttsState.speaking) {
                    console.warn("Speech failed to end, using fallback timing");
                    // Cancel any ongoing speech and trigger end
                    ttsControls.cancel();
                    onSpeechEnd();
                  }
                }, speechDuration + 1000);
              }
            }, 2000);
          }
        }, 300);

        // Cleanup function
        return () => {
          // Mark this speech item as inactive
          activeSpeechRef.current = false;

          // Clean up typing interval
          if (typingIntervalId) {
            clearInterval(typingIntervalId);
          }

          // Clean up event listeners
          document.removeEventListener("tts-started", speechStartListener);
          document.removeEventListener("tts-ended", speechEndListener);

          // Cancel TTS if component unmounts or moves to next item
          ttsControls.cancel();
        };

        // Cleanup function was moved above with the rest of the speech implementation
      }
    };

    processNextItem();
  }, [currentItemIndex, roastData, onComplete, isLoading]);

  // Function to play sound
  const playSound = (filename: string, onEnd: () => void): void => {
    if (!audioRef.current) {
      console.error("Audio element not available");
      onEnd();
      return;
    }

    try {
      // Correct path for sound effects
      const soundPath = filename.startsWith("/")
        ? filename
        : `/media/${filename}`;
      console.log(`Playing sound: ${soundPath}`);

      const audio = audioRef.current;
      audio.src = soundPath;

      const onEnded = () => {
        console.log(`Sound completed: ${filename}`);
        audio.removeEventListener("ended", onEnded);
        onEnd();
      };

      audio.addEventListener("ended", onEnded);

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing sound:", error, filename);
          onEnd();
        });
      }
    } catch (error) {
      console.error("Error setting up sound:", error);
      onEnd();
    }
  };

  // Replace instances of the username in the text
  const personalizeText = (text: string): string => {
    return text
      .replace(/rawrnuck/g, username)
      .replace(/\[username\]/g, username);
  };

  return (
    <div
      className="roast-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111319",
        zIndex: 200,
      }}
    >
      {/* Audio element for sounds */}
      <audio ref={audioRef} onError={(e) => console.error("Audio error:", e)} />

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            top: "40%",
            textAlign: "center",
            color: "#00a0a0",
          }}
        >
          <div
            className="loading-spinner"
            style={{
              width: "4rem",
              height: "4rem",
              border: "4px solid rgba(0, 160, 160, 0.3)",
              borderRadius: "50%",
              borderTop: "4px solid #00a0a0",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem auto",
            }}
          />
          <p
            style={{ fontFamily: '"Barriecito", cursive', fontSize: "1.2rem" }}
          >
            Gathering roast material...
          </p>
        </motion.div>
      )}

      {/* TTS Status Indicator */}
      {ttsState.speaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            display: "flex",
            alignItems: "center",
            color: ttsState.usingElevenLabs ? "#00ff00" : "#ffaa00",
            fontSize: "0.9rem",
            fontFamily: '"Barriecito", cursive',
            background: "rgba(0,0,0,0.7)",
            padding: "0.5rem 1rem",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: ttsState.usingElevenLabs ? "#00ff00" : "#ffaa00",
              marginRight: "0.5rem",
              animation: "pulse 1s infinite",
            }}
          />
          {ttsState.usingElevenLabs ? "🎙️ ElevenLabs" : "🔊 Browser TTS"}
        </motion.div>
      )}

      {/* Sound cue display */}
      <AnimatePresence mode="wait">
        {showCue &&
          currentItemIndex < roastData.length &&
          "cue" in roastData[currentItemIndex] && (
            <motion.div
              key={`cue-${currentItemIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                top: "20%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#00a0a0",
                fontFamily: '"Barriecito", cursive',
              }}
            >
              <span style={{ fontSize: "3rem" }}>{currentEmoji}</span>
              <span style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
                {(roastData[currentItemIndex] as SoundItem).cue}
              </span>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Text display */}
      <AnimatePresence mode="wait">
        {showText &&
          currentItemIndex < roastData.length &&
          "text" in roastData[currentItemIndex] && (
            <motion.div
              key={`text-${currentItemIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{
                maxWidth: "80%",
                textAlign: "center",
                padding: "2rem",
                color: "white",
                fontSize: "2rem",
                fontFamily: '"Barriecito", cursive',
              }}
            >
              {typedText}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Keyframe animation for spinner and pulse */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Roast;
