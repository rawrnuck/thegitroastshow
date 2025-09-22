import { useState, useEffect, useCallback, useRef } from "react";

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export interface TextToSpeechState {
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  options: TextToSpeechOptions;
}

export interface TextToSpeechControls {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

/**
 * Custom hook for text-to-speech functionality using Web Speech API only
 */
export const useTextToSpeech = (
  defaultOptions?: TextToSpeechOptions
): [TextToSpeechState, TextToSpeechControls] => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [options, setOptions] = useState<TextToSpeechOptions>({
    rate: defaultOptions?.rate || 1,
    pitch: defaultOptions?.pitch || 1,
    volume: defaultOptions?.volume || 1,
    voice: defaultOptions?.voice || null,
  });

  // Reference for controlling Web Speech API utterance
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize voices for Web Speech API
  useEffect(() => {
    const getVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(availableVoices);

      // Set default voice if available and not already set
      if (availableVoices.length > 0 && !options.voice) {
        // Prefer a human-sounding English voice if available
        const preferredVoice =
          availableVoices.find(
            (voice) =>
              voice.lang.startsWith("en") && !voice.name.includes("Google")
          ) || availableVoices[0];

        setOptions((prev) => ({ ...prev, voice: preferredVoice }));
      }
    };

    // Get voices immediately in case they're already loaded
    getVoices();

    // Also listen for voiceschanged event
    window.speechSynthesis?.addEventListener("voiceschanged", getVoices);

    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", getVoices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up any speaking on unmount
  useEffect(() => {
    return () => {
      if (speaking) {
        window.speechSynthesis?.cancel();
      }
    };
  }, [speaking]);

  // Clean text for speech (remove sound cues)
  const cleanTextForSpeech = useCallback((text: string): string => {
    if (!text) return "";

    return (
      text
        // Remove sound cues in asterisks
        .replace(/\*[^*]*\*/g, "")
        // Remove parenthetical sound cues
        .replace(/\([^)]*\)/g, "")
        // Remove brackets sound cues
        .replace(/\[[^\]]*\]/g, "")
        // Remove emoji sequences
        .replace(
          /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
          ""
        )
        // Clean up multiple spaces and newlines
        .replace(/\s+/g, " ")
        // Remove leading/trailing whitespace
        .trim()
    );
  }, []);

  // Custom event dispatcher for speech events
  const dispatchSpeechEvent = useCallback((eventName: string) => {
    document.dispatchEvent(new CustomEvent(eventName));
  }, []);

  // Web Speech API function with improved reliability
  const speakWithWebAPI = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) {
        console.error("Web Speech API not supported");
        return;
      }

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      console.log(
        "Using Web Speech API for:",
        cleanText.substring(0, 50) + "..."
      );

      // Cancel any ongoing speech and reset state
      window.speechSynthesis.cancel();

      // Firefox sometimes keeps the speaking flag stuck after cancel
      setTimeout(() => {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Find an appropriate voice - prioritize natural sounding English voices
        if (!options.voice || !options.voice.lang.startsWith("en")) {
          const availableVoices = window.speechSynthesis.getVoices();
          const preferredVoice = availableVoices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Natural") || !v.name.includes("Google"))
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        } else {
          utterance.voice = options.voice;
        }

        // Apply options with sensible defaults for roasting
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.1;
        utterance.volume = options.volume ?? 1.0;

        // Use robust event handling
        const setupUtterance = () => {
          utterance.onstart = () => {
            setSpeaking(true);
            setPaused(false);
            dispatchSpeechEvent("tts-started");
          };
          utterance.onpause = () => setPaused(true);
          utterance.onresume = () => setPaused(false);
          utterance.onend = () => {
            setSpeaking(false);
            setPaused(false);
            utteranceRef.current = null;
            dispatchSpeechEvent("tts-ended");
          };
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setSpeaking(false);
            setPaused(false);
            utteranceRef.current = null;
            dispatchSpeechEvent("tts-error");

            // Retry with a simpler approach if we get an interrupted error
            if (event.error === "interrupted" || event.error === "canceled") {
              console.log("Attempting speech recovery after interruption");
              setTimeout(() => {
                try {
                  window.speechSynthesis.cancel();
                  const simpleUtterance = new SpeechSynthesisUtterance(
                    cleanText
                  );
                  window.speechSynthesis.speak(simpleUtterance);
                } catch (e) {
                  console.error("Recovery attempt failed", e);
                }
              }, 500);
            }
          };
        };

        setupUtterance();

        // Save reference
        utteranceRef.current = utterance;

        // Chrome/Edge bug workaround - sometimes utterances are cut short
        const maxSpeechLength = 140; // Characters
        if (cleanText.length > maxSpeechLength) {
          // Split into chunks with pauses between
          const chunks: string[] = [];
          let start = 0;

          // Find natural break points (sentences)
          const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];

          if (sentences.length > 1) {
            // Use sentence boundaries
            sentences.forEach((sentence) => {
              chunks.push(sentence.trim());
            });
          } else {
            // No clear sentences, split by length with consideration for words
            while (start < cleanText.length) {
              let end = Math.min(start + maxSpeechLength, cleanText.length);

              // Don't break in the middle of a word if not at the end
              if (end < cleanText.length) {
                while (
                  end > start &&
                  cleanText[end] !== " " &&
                  cleanText[end] !== "." &&
                  cleanText[end] !== "!" &&
                  cleanText[end] !== "?"
                ) {
                  end--;
                }
              }

              chunks.push(cleanText.substring(start, end).trim());
              start = end;
            }
          }

          // Speak the first chunk
          utterance.text = chunks[0];
          window.speechSynthesis.speak(utterance);

          // Queue the rest with slight delays between
          if (chunks.length > 1) {
            let chunkIndex = 1;

            utterance.onend = () => {
              if (chunkIndex < chunks.length) {
                const nextUtterance = new SpeechSynthesisUtterance(
                  chunks[chunkIndex]
                );
                // Copy voice and rate settings
                nextUtterance.voice = utterance.voice;
                nextUtterance.rate = utterance.rate;
                nextUtterance.pitch = utterance.pitch;
                nextUtterance.volume = utterance.volume;

                // For all chunks except the last
                if (chunkIndex < chunks.length - 1) {
                  nextUtterance.onend = utterance.onend;
                } else {
                  // Last chunk gets the final onend handler
                  nextUtterance.onend = () => {
                    setSpeaking(false);
                    setPaused(false);
                    utteranceRef.current = null;
                    dispatchSpeechEvent("tts-ended");
                  };
                }

                // Update for next iteration
                utteranceRef.current = nextUtterance;
                chunkIndex++;

                // Small pause between chunks
                setTimeout(() => {
                  window.speechSynthesis.speak(nextUtterance);
                }, 150);
              } else {
                // All chunks spoken
                setSpeaking(false);
                setPaused(false);
                utteranceRef.current = null;
                dispatchSpeechEvent("tts-ended");
              }
            };
          }
        } else {
          // Short text, speak directly
          window.speechSynthesis.speak(utterance);
        }

        // Chrome/Edge bug workaround to prevent cutting off
        const intervalId = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(intervalId);
          } else {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);
      }, 100); // Small delay to ensure cancel takes effect
    },
    [options, cleanTextForSpeech, dispatchSpeechEvent]
  );

  // Main speak function using Web Speech API only
  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      // Always cancel any ongoing speech to prevent overlaps
      cancel();

      // Dispatch event to notify that speech is starting
      dispatchSpeechEvent("tts-starting");

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) {
        dispatchSpeechEvent("tts-error");
        return;
      }

      console.log(
        "Using Web Speech API for:",
        cleanText.substring(0, 50) + "..."
      );
      speakWithWebAPI(cleanText);
    },
    [speakWithWebAPI, cleanTextForSpeech, dispatchSpeechEvent]
  );

  // Pause function
  const pause = useCallback(() => {
    if (speaking && !paused && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [speaking, paused]);

  // Resume function
  const resume = useCallback(() => {
    if (speaking && paused && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [speaking, paused]);

  // Cancel function
  const cancel = useCallback(() => {
    const wasSpeaking = speaking;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setPaused(false);
    utteranceRef.current = null;

    // If we were speaking and now cancelling, dispatch the ended event
    if (wasSpeaking) {
      dispatchSpeechEvent("tts-ended");
    }
  }, [speaking, dispatchSpeechEvent]);

  // Option setter functions
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setOptions((prev) => ({ ...prev, voice }));
  }, []);

  const setRate = useCallback((rate: number) => {
    setOptions((prev) => ({ ...prev, rate }));
  }, []);

  const setPitch = useCallback((pitch: number) => {
    setOptions((prev) => ({ ...prev, pitch }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setOptions((prev) => ({ ...prev, volume }));
  }, []);

  const state: TextToSpeechState = {
    speaking,
    paused,
    voices,
    options,
  };

  const controls: TextToSpeechControls = {
    speak,
    pause,
    resume,
    cancel,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  };

  return [state, controls];
};
