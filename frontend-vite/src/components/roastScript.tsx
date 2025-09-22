import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { roastAPI } from "../services/api";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import type { RoastItem, SoundItem, SpeechItem } from "../types/api";

interface RoastScriptProps {
  onComplete: () => void;
  username?: string;
  soundEnabled?: boolean;
  ttsEnabled?: boolean; // New prop to control TTS specifically
  prefetchedRoastData?: RoastItem[] | null; // Optional prefetched data
}

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

const RoastScript = ({
  onComplete,
  username = "user",
  soundEnabled = true,
  ttsEnabled = true,
  prefetchedRoastData = null,
}: RoastScriptProps) => {
  const [roastData, setRoastData] = useState<RoastItem[]>(loadingRoastData);
  const [currentItemIndex, setCurrentItemIndex] = useState(-1); // Start at -1 for initial state
  const [currentItem, setCurrentItem] = useState<RoastItem | null>(null);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [currentCue, setCurrentCue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Add a ref to control whether typing animation should be protected from cleanup
  const protectTypingRef = useRef<boolean>(false);

  // Initialize TTS with Web Speech API only
  const [, ttsControls] = useTextToSpeech({
    rate: 1.1,
    pitch: 1.1, // Slightly higher pitch for better clarity
    volume: 1,
  });

  // Load roast data from API
  useEffect(() => {
    const fetchRoastData = async () => {
      setIsLoading(true);

      // Web Speech API is ready by default, no need to reset
      console.log("Starting new roast session with Web Speech API");

      // If we have prefetched data, use it instead of fetching again
      if (prefetchedRoastData && prefetchedRoastData.length > 0) {
        console.log("Using prefetched roast data:", prefetchedRoastData);
        setRoastData(prefetchedRoastData);
        setIsLoading(false);
        return;
      }

      if (!username || username.trim() === "") {
        console.warn(
          "No username provided to RoastScript component, using demo data"
        );
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
        ]);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`Fetching roast data for username: ${username}`);
        let items;
        try {
          const isAvailable = await roastAPI.isBackendAvailable();
          console.log("Backend available:", isAvailable);

          if (isAvailable) {
            items = await roastAPI.getRoastItems(username, { language: "en" });
            console.log("Successfully fetched roast items from API:", items);
          } else {
            throw new Error("Backend not available");
          }
        } catch {
          console.warn("Could not connect to backend, using sample data");
          const sampleResponse = await roastAPI.getSampleRoast();
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
          ];
        }

        if (items && items.length > 0) {
          console.log("Setting roast data and starting sequence:", items);
          setRoastData(items);
          // Don't set currentItemIndex here - let the sequence logic handle it
        } else {
          throw new Error("No roast data received");
        }
      } catch (error) {
        console.error("Error fetching roast data:", error);
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
            type: "speech" as const,
            text: `Hmm, it seems like my writers have gone on strike! I couldn't get any dirt on ${username}'s GitHub profile.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoastData();
  }, [username, prefetchedRoastData]);

  // Cleanup function with improved handling to prevent interruptions
  const cleanup = useCallback(() => {
    // Only clear typing interval if we're not protecting the typing animation
    if (!protectTypingRef.current && typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (cueTimeoutRef.current) {
      clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = null;
    }

    // Only cancel TTS if we're not in the middle of a typing animation or if TTS is disabled
    if (!protectTypingRef.current || !ttsEnabled) {
      ttsControls.cancel();
    }
  }, [ttsControls, ttsEnabled]);

  // Function to play sound with proper cleanup
  const playSound = useCallback(
    (filename: string, duringText: boolean = false): Promise<void> => {
      return new Promise((resolve) => {
        if (!audioRef.current) {
          console.error("Audio element not available");
          resolve();
          return;
        }

        try {
          const soundPath = filename.startsWith("/")
            ? filename
            : `/media/${filename}`;
          console.log(
            `Playing sound: ${soundPath}${
              duringText ? " (during text display)" : ""
            }`
          );

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
            console.log(`Sound completed: ${filename}`);

            // If playing during text, keep the cue visible a bit longer
            if (!duringText) {
              setCurrentCue("");
            }

            resolve();
          };

          audioRef.current.onerror = (e) => {
            console.error("Sound error:", e);
            if (!duringText) {
              setCurrentCue("");
            }
            resolve();
          };

          // Set volume based on whether we're playing during text display
          audioRef.current.volume = duringText ? 0.85 : 1.0;

          // Set source and play
          audioRef.current.src = soundPath;
          audioRef.current.load();

          audioRef.current.oncanplaythrough = () => {
            // If playing during text display, add a small delay for better timing
            if (duringText) {
              setTimeout(() => {
                audioRef.current?.play().catch((error) => {
                  console.error("Error playing sound:", error, filename);
                  resolve();
                });
              }, 200);
            } else {
              audioRef.current?.play().catch((error) => {
                console.error("Error playing sound:", error, filename);
                resolve();
              });
            }
          };
        } catch (error) {
          console.error("Error setting up sound:", error);
          if (!duringText) {
            setCurrentCue("");
          }
          resolve();
        }
      });
    },
    []
  );

  // Improved typing animation with dynamic speeds
  const startTypingAnimation = useCallback(
    (text: string, duration: number): Promise<void> => {
      return new Promise((resolve) => {
        // Remove cleanup() call here to avoid canceling speech

        console.log("startTypingAnimation called with:", { text, duration });
        setTypedText("");

        if (!text) {
          console.log("No text provided to typing animation");
          resolve();
          return;
        }

        const totalChars = text.length;

        // For simultaneous TTS and typing, adjust the speeds
        // Make the typing a bit faster so it generally completes before or with the TTS
        const baseDelay = Math.max(30, duration / (totalChars * 1.2));

        console.log("Typing animation settings:", {
          totalChars,
          baseDelay,
          duration,
        });

        let currentIndex = 0;

        const typeChar = () => {
          if (currentIndex <= totalChars) {
            const currentText = text.substring(0, currentIndex);
            setTypedText(currentText);
            currentIndex++;

            if (currentIndex <= totalChars) {
              // Calculate dynamic delay based on character
              let charDelay = baseDelay;

              // Special punctuation timing - shorter pauses for simultaneous TTS
              const nextChar = text[currentIndex - 1];
              if ([".", "!", "?"].includes(nextChar)) {
                charDelay = baseDelay * 2; // Slightly longer pause at sentence endings
              } else if ([",", ";", ":"].includes(nextChar)) {
                charDelay = baseDelay * 1.5; // Slight pause at punctuation
              } else if (nextChar === " ") {
                charDelay = baseDelay * 1.2; // Very slight pause at spaces
              } else {
                // Add some natural variation (+/- 20%)
                const variation = baseDelay * 0.4 * (Math.random() - 0.5);
                charDelay = baseDelay + variation;
              }

              typingIntervalRef.current = setTimeout(typeChar, charDelay);
            } else {
              console.log("Typing animation complete");
              setTimeout(resolve, 200); // Short delay after completion
            }
          }
        };

        // Start typing immediately
        typeChar();
      });
    },
    []
  );

  // Function to play TTS speech with improved event handling
  const playTTS = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!ttsEnabled) {
          // If TTS is disabled, resolve immediately
          console.log("TTS is disabled, skipping speech");
          resolve();
          return;
        }

        const personalizedText = text.replace(/\[username\]/g, username);

        let speechEnded = false;

        const onSpeechEnd = () => {
          if (speechEnded) return;
          speechEnded = true;

          // Clean up event listeners
          document.removeEventListener("tts-ended", speechEndListener);
          document.removeEventListener("tts-error", speechEndListener);

          // No artificial delay when running simultaneously with typing
          resolve();
        };

        const speechEndListener = () => onSpeechEnd();

        // Setup speech event listeners
        document.addEventListener("tts-ended", speechEndListener);
        document.addEventListener("tts-error", speechEndListener);

        // Start TTS immediately for simultaneous operation with typing
        console.log(
          "Starting TTS for:",
          personalizedText.substring(0, 50) + "..."
        );
        ttsControls.speak(personalizedText);

        // Fallback timeout in case TTS doesn't fire events properly
        // Adjust based on text length with a longer duration to ensure it completes
        const estimatedDuration = Math.max(
          6000,
          (personalizedText.length / 8) * 1000
        );
        setTimeout(() => {
          if (!speechEnded) {
            console.warn(
              "TTS fallback timeout triggered after",
              estimatedDuration + 2000,
              "ms"
            );
            onSpeechEnd();
          }
        }, estimatedDuration + 2000);
      });
    },
    [username, ttsControls, ttsEnabled]
  );

  // Main sequence controller
  const runSequence = useCallback(async () => {
    console.log("runSequence called:", {
      roastData: !!roastData,
      isProcessing,
      isLoading,
      currentItemIndex,
    });
    if (!roastData || isLoading) {
      console.log("runSequence early return - no data or loading");
      return;
    }

    if (isProcessing) {
      console.log("runSequence early return - already processing");
      return;
    }

    setIsProcessing(true);

    try {
      // Check if we've completed all items
      if (currentItemIndex >= roastData.length) {
        console.log("All roast items complete");
        setTimeout(() => onComplete(), 1000); // Delay completion
        setIsProcessing(false);
        return;
      }

      // Start from first item if at -1
      if (currentItemIndex === -1) {
        setCurrentItemIndex(0);
        setIsProcessing(false);
        return;
      }

      const currentItem = roastData[currentItemIndex];
      setCurrentItem(currentItem);

      console.log(
        `Processing item ${currentItemIndex + 1}: ${currentItem.type}`,
        currentItem
      );

      if (currentItem.type === "sound") {
        const soundItem = currentItem as SoundItem;

        // Show cue briefly
        setCurrentCue(soundItem.cue);

        if (soundEnabled) {
          try {
            // Play sound with timeout fallback
            await Promise.race([
              playSound(soundItem.file, false),
              new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second fallback
            ]);
          } catch (error) {
            console.warn("Sound playback failed:", error);
            // Ensure cue is cleared even if sound fails
            setCurrentCue("");
          }
        } else {
          // Skip sound but wait a bit for pacing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          // Clear cue manually since we're not playing the sound
          setCurrentCue("");
        }
      } else if (currentItem.type === "speech") {
        const speechItem = currentItem as SpeechItem;

        console.log("Starting speech item:", speechItem.text);

        // Show text immediately
        console.log("Setting showText to true and resetting typedText");
        setShowText(true);
        setTypedText(""); // Reset typed text

        // Force a small delay to ensure state updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Prepare the text to show
        const textToShow = speechItem.text.replace(/\[username\]/g, username);
        // Adjust typing duration based on text length
        const typingDuration = Math.max(
          3000,
          Math.min(8000, textToShow.length * 60)
        );

        console.log(
          "Starting typing animation and TTS simultaneously for:",
          textToShow
        );

        // Enable protection for typing animation
        protectTypingRef.current = true;

        try {
          // Start TTS a bit earlier if enabled
          let ttsPromise = Promise.resolve();
          if (soundEnabled && ttsEnabled) {
            console.log("Starting TTS alongside typing animation");
            // Small delay to let typing begin first, but still feel synchronized
            setTimeout(() => {
              ttsPromise = playTTS(speechItem.text).catch((error) => {
                console.warn("TTS failed during typing:", error);
                return Promise.resolve(); // Continue even if TTS fails
              });
            }, 300);
          }

          // Start typing animation - don't await, just get the promise
          const typingPromise = startTypingAnimation(
            textToShow,
            typingDuration
          );

          // Wait for both to complete
          await Promise.all([
            typingPromise,
            // Additional promise to ensure minimum display time even if TTS ends early
            new Promise((resolve) =>
              setTimeout(resolve, Math.max(2000, typingDuration * 0.7))
            ),
          ]);

          // If TTS is still ongoing, give it some time to finish
          await Promise.race([
            ttsPromise,
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);

          // Get the next sound item if available, to play before text disappears
          let nextSoundItem: SoundItem | null = null;

          if (
            currentItemIndex + 1 < roastData.length &&
            roastData[currentItemIndex + 1].type === "sound"
          ) {
            nextSoundItem = roastData[currentItemIndex + 1] as SoundItem;

            // Show cue for next sound before text disappears
            if (nextSoundItem.cue) {
              console.log(
                "Showing sound cue before text disappears:",
                nextSoundItem.cue
              );
              setCurrentCue(nextSoundItem.cue);
            }

            // Play the sound if enabled
            if (soundEnabled && nextSoundItem.file) {
              try {
                // Play sound but don't wait for it to complete - let it overlap with text fade
                // Use duringText=true to indicate this sound is playing during text display
                playSound(nextSoundItem.file, true).catch((error) => {
                  console.warn(
                    "Sound playback failed during transition:",
                    error
                  );
                });
              } catch (error) {
                console.warn("Error starting sound during transition:", error);
              }
            }

            // Keep text visible during sound effect
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.warn("Error during typing or TTS:", error);
        } finally {
          // Always ensure protection is disabled when we're done
          protectTypingRef.current = false;
        }

        // Keep text visible for a moment based on text length
        const visibilityDuration = Math.max(
          1000,
          Math.min(2000, textToShow.length * 15)
        );
        await new Promise((resolve) => setTimeout(resolve, visibilityDuration));

        // Hide text
        setShowText(false);

        // If we played a sound cue for the next item, skip that item
        const skipNextItem =
          currentItemIndex + 1 < roastData.length &&
          roastData[currentItemIndex + 1].type === "sound";

        // Wait before moving to next item
        setTimeout(() => {
          console.log(
            "Moving to next item from",
            currentItemIndex,
            "to",
            skipNextItem ? currentItemIndex + 2 : currentItemIndex + 1
          );

          // Skip the next item if it was a sound we already played
          if (skipNextItem) {
            setCurrentItemIndex((prev) => prev + 2);
          } else {
            setCurrentItemIndex((prev) => prev + 1);
          }

          // Clear any lingering cues
          setCurrentCue("");
          setIsProcessing(false);
        }, 500);

        // Return early since we've handled the next item logic already
        return;
      }

      // Wait before moving to next item
      setTimeout(() => {
        console.log(
          "Moving to next item from",
          currentItemIndex,
          "to",
          currentItemIndex + 1
        );
        setCurrentItemIndex((prev) => prev + 1);
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error("Error in roast sequence:", error);
      setIsProcessing(false);
      // Continue anyway
      setTimeout(() => {
        console.log(
          "Error recovery: Moving to next item from",
          currentItemIndex,
          "to",
          currentItemIndex + 1
        );
        setCurrentItemIndex((prev) => prev + 1);
      }, 1000);
    }
  }, [
    roastData,
    currentItemIndex,
    isProcessing,
    isLoading,
    playSound,
    startTypingAnimation,
    playTTS,
    onComplete,
    username,
    soundEnabled,
    ttsEnabled,
  ]);

  // Trigger sequence when item index changes
  useEffect(() => {
    console.log("Sequence trigger useEffect:", {
      isLoading,
      currentItemIndex,
      roastDataLength: roastData?.length,
    });
    if (!isLoading) {
      console.log("Calling runSequence...");
      runSequence();

      // Safety timeout to unblock processing if it gets stuck
      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          console.log("Safety timeout: Forcing processing to continue");
          setIsProcessing(false);
        }
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [currentItemIndex, roastData, isLoading, runSequence, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
      <audio
        ref={audioRef}
        preload="none"
        onError={(e) => console.error("Audio error:", e)}
      />

      {/* TTS Status Indicator
      {(ttsState.speaking || !ttsEnabled) && (
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
            color: !ttsEnabled
              ? "#ff4444"
              : ttsState.speaking
              ? "#00ff00"
              : "#ffaa00",
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
              backgroundColor: !ttsEnabled
                ? "#ff4444"
                : ttsState.speaking
                ? "#00ff00"
                : "#ffaa00",
              marginRight: "0.5rem",
              animation: !ttsEnabled ? "none" : "pulse 1s infinite",
            }} */}
      {/* /> */}
      {/* {!ttsEnabled
            ? "🔇 TTS Disabled"
            : ttsState.speaking
            ? "🔊 Web Speech Active"
            : "🔊 Web Speech Ready"} */}
      {/* </motion.div> */}
      {/* )} */}

      {/* Sound cue display */}
      <AnimatePresence mode="wait">
        {currentCue && (
          <motion.div
            key={currentCue}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              top: "15%",
              fontSize: "1.4rem",
              color: "#00a0a0",
              fontFamily: '"Barriecito", cursive',
              textAlign: "center",

              padding: "0.5rem 1rem",
              borderRadius: "8px",
            }}
          >
            {currentCue}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text display */}
      <AnimatePresence mode="wait">
        {(() => {
          console.log("Text display render:", {
            showText,
            currentItem: currentItem?.type,
            typedText,
            currentItemIndex,
          });
          return showText && currentItem && currentItem.type === "speech";
        })() && (
          <motion.div
            key={`text-${currentItemIndex}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              maxWidth: "80%",
              textAlign: "center",
              padding: "2rem",
              color: "white",
              fontSize: "2rem",
              fontFamily: '"Barriecito", cursive',
              lineHeight: "1.4",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            <span style={{ display: "inline-block", minHeight: "1.4em" }}>
              {typedText}
              {typedText &&
                currentItem &&
                typedText.length < (currentItem as SpeechItem).text.length && (
                  <span
                    style={{
                      opacity: 0.7,
                      animation: "blink 1s infinite",
                      marginLeft: "2px",
                    }}
                  >
                    |
                  </span>
                )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 50% { opacity: 0.7; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RoastScript;
