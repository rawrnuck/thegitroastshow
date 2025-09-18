import { useState, useEffect, useCallback, useRef } from "react";

interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
  preferElevenLabs?: boolean;
  elevenLabsVoiceId?: string;
}

export interface TextToSpeechState {
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  options: TextToSpeechOptions;
  usingElevenLabs: boolean;
  elevenLabsAvailable: boolean;
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
  setPreferElevenLabs: (prefer: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Custom hook for text-to-speech functionality with ElevenLabs and Web Speech API fallback
 */
export const useTextToSpeech = (
  defaultOptions?: TextToSpeechOptions
): [TextToSpeechState, TextToSpeechControls] => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [usingElevenLabs, setUsingElevenLabs] = useState(false);
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState(false);
  const [options, setOptions] = useState<TextToSpeechOptions>({
    rate: defaultOptions?.rate || 1,
    pitch: defaultOptions?.pitch || 1,
    volume: defaultOptions?.volume || 1,
    voice: defaultOptions?.voice || null,
    preferElevenLabs: defaultOptions?.preferElevenLabs ?? true,
    elevenLabsVoiceId:
      defaultOptions?.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM", // Rachel
  });

  // References for controlling playback
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check ElevenLabs availability on mount
  useEffect(() => {
    const checkElevenLabsStatus = async () => {
      try {
        // Add a timeout to prevent long hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${API_BASE_URL}/api/tts/status`, {
          signal: controller.signal,
        }).catch((err) => {
          console.warn("ElevenLabs fetch aborted or failed:", err.message);
          return null;
        });

        clearTimeout(timeoutId);

        if (!response) {
          console.warn("ElevenLabs status check timed out");
          setElevenLabsAvailable(false);
          return;
        }

        const data = await response.json();
        setElevenLabsAvailable(data.success && data.available);
      } catch (error) {
        console.warn("ElevenLabs TTS service not available:", error);
        setElevenLabsAvailable(false);
      }
    };

    checkElevenLabsStatus();
  }, []);

  // Initialize voices for Web Speech API fallback
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
  }, []);

  // Clean up any speaking on unmount
  useEffect(() => {
    return () => {
      if (speaking) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
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

  // Cache for storing generated audio
  const audioCache = useRef<Map<string, string>>(new Map());

  // ElevenLabs TTS function with improved error handling and caching
  const speakWithElevenLabs = useCallback(
    async (text: string) => {
      try {
        // If text is already empty/cleaned, don't clean again
        const cleanText =
          typeof text === "string" && text.trim()
            ? text.startsWith("*") || text.includes("(")
              ? cleanTextForSpeech(text)
              : text
            : text;

        if (!cleanText) return false;

        // Generate a cache key based on the text and voice
        const cacheKey = `${cleanText}_${options.elevenLabsVoiceId}`;

        // Check if we have this audio cached
        if (audioCache.current.has(cacheKey)) {
          console.log(
            "Using cached audio for:",
            cleanText.substring(0, 50) + "..."
          );

          // Create and play audio from cache
          const audio = new Audio(audioCache.current.get(cacheKey));
          audioRef.current = audio;

          return new Promise<boolean>((resolve) => {
            audio.onloadstart = () => setSpeaking(true);
            audio.onplay = () => {
              setSpeaking(true);
              setUsingElevenLabs(true);
            };
            audio.onpause = () => setPaused(true);
            audio.onplaying = () => setPaused(false);
            audio.onended = () => {
              setSpeaking(false);
              setPaused(false);
              setUsingElevenLabs(false);
              audioRef.current = null;
              resolve(true);
            };
            audio.onerror = () => {
              console.error("Audio playback error from cache");
              setSpeaking(false);
              setPaused(false);
              setUsingElevenLabs(false);
              audioRef.current = null;
              audioCache.current.delete(cacheKey); // Remove bad cache entry
              resolve(false);
            };

            audio.play().catch((error) => {
              console.error("Failed to play cached audio:", error);
              audioCache.current.delete(cacheKey); // Remove bad cache entry
              resolve(false);
            });
          });
        }

        console.log(
          "Using ElevenLabs TTS for:",
          cleanText.substring(0, 50) + "..."
        );

        // Use AbortController to allow timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${API_BASE_URL}/api/tts/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanText,
            voice_id: options.elevenLabsVoiceId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
          signal: controller.signal,
        }).catch((error) => {
          if (error.name === "AbortError") {
            console.warn("ElevenLabs request timed out");
          }
          return null;
        });

        clearTimeout(timeoutId);

        if (!response || !response.ok) {
          let errorMessage = "Failed to connect to TTS service";
          if (response) {
            try {
              const errorData = await response.json();
              console.error("ElevenLabs API error:", errorData);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error("Failed to parse error response");
            }
          }
          return false;
        }

        // Get audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Cache the audio URL for future use
        audioCache.current.set(cacheKey, audioUrl);

        // Limit cache size
        if (audioCache.current.size > 50) {
          // Remove oldest entry
          const firstKey = audioCache.current.keys().next().value;
          if (firstKey) {
            const urlToRevoke = audioCache.current.get(firstKey);
            if (urlToRevoke) {
              URL.revokeObjectURL(urlToRevoke);
              audioCache.current.delete(firstKey);
            }
          }
        }

        // Create and play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        return new Promise<boolean>((resolve) => {
          let hasStarted = false;
          let playAttempts = 0;
          const maxPlayAttempts = 3;

          audio.onloadstart = () => {
            setSpeaking(true);
            hasStarted = true;
          };
          audio.onplay = () => {
            setSpeaking(true);
            setUsingElevenLabs(true);
            hasStarted = true;
            dispatchSpeechEvent("tts-started");
          };
          audio.onpause = () => setPaused(true);
          audio.onplaying = () => setPaused(false);
          audio.onended = () => {
            setSpeaking(false);
            setPaused(false);
            setUsingElevenLabs(false);
            audioRef.current = null;
            dispatchSpeechEvent("tts-ended");
            resolve(true);
          };
          audio.onerror = (error) => {
            console.error("Audio playback error:", error);
            setSpeaking(false);
            setPaused(false);
            setUsingElevenLabs(false);
            audioRef.current = null;

            // Don't revoke URL as we've cached it
            resolve(false);
          };

          const attemptPlay = () => {
            if (playAttempts >= maxPlayAttempts) {
              console.error("Max play attempts reached, giving up");
              audioRef.current = null;
              resolve(false);
              return;
            }

            playAttempts++;
            audio.play().catch((error) => {
              console.warn(
                `Play attempt ${playAttempts} failed:`,
                error.message
              );
              if (
                error.name === "AbortError" ||
                error.name === "NotAllowedError"
              ) {
                // User interaction might be needed or another audio is playing
                setTimeout(attemptPlay, 500);
              } else {
                console.error("Failed to play ElevenLabs audio:", error);
                resolve(false);
              }
            });
          };

          // Start playing
          attemptPlay();

          // Safety timeout - if audio hasn't started playing after 3 seconds, resolve with false
          setTimeout(() => {
            if (!hasStarted) {
              console.warn("Audio failed to start playing within timeout");
              resolve(false);
            }
          }, 3000);
        });
      } catch (error) {
        console.error("ElevenLabs TTS error:", error);
        return false;
      }
    },
    [options.elevenLabsVoiceId, cleanTextForSpeech]
  );

  // Custom event dispatcher for speech events
  const dispatchSpeechEvent = useCallback((eventName: string) => {
    document.dispatchEvent(new CustomEvent(eventName));
  }, []);

  // Web Speech API fallback function with improved reliability
  const speakWithWebAPI = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) {
        console.error("Web Speech API not supported");
        return;
      }

      // If text is already empty/cleaned, don't clean again
      const cleanText =
        typeof text === "string" && text.trim()
          ? text.startsWith("*") || text.includes("(")
            ? cleanTextForSpeech(text)
            : text
          : text;

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
              (v.name.includes("Natural") || !v.name.includes("Google")) // Prefer non-Google voices if available
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        } else {
          utterance.voice = options.voice;
        }

        // Apply options with sensible defaults for roasting
        utterance.rate = options.rate ?? 0.9; // Slightly slower rate for dramatic effect
        utterance.pitch = options.pitch ?? 1.1; // Slightly higher pitch for energetic delivery
        utterance.volume = options.volume ?? 1.0;

        // Use robust event handling
        const setupUtterance = () => {
          utterance.onstart = () => {
            setSpeaking(true);
            setUsingElevenLabs(false);
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

            // Retry with a simpler approach if we get an interrupted error
            if (event.error === "interrupted" || event.error === "canceled") {
              console.log("Attempting speech recovery after interruption");
              // Small delay before retry
              setTimeout(() => {
                try {
                  window.speechSynthesis.cancel(); // Make sure we're clean
                  const simpleUtterance = new SpeechSynthesisUtterance(
                    cleanText
                  );
                  // Use simpler settings for the retry
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
    [options, cleanTextForSpeech]
  );

  // Track network connection status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Main speak function with intelligent fallback and retry
  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      // Always cancel any ongoing speech to prevent overlaps
      cancel();

      // Clean the text once here to be used for all TTS attempts
      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      // Only try ElevenLabs if we're online and it's preferred
      if (isOnline && options.preferElevenLabs && elevenLabsAvailable) {
        try {
          // Set a timeout for the ElevenLabs attempt
          const timeoutPromise = new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 3000);
          });

          // Race between the actual TTS request and the timeout
          const success = await Promise.race([
            speakWithElevenLabs(cleanText),
            timeoutPromise,
          ]);

          if (success) return;

          console.log(
            "ElevenLabs failed or timed out, falling back to Web Speech API"
          );
        } catch (error) {
          console.warn("Error in ElevenLabs TTS:", error);
        }
      } else if (!isOnline) {
        console.log("Device is offline. Using Web Speech API directly.");
      }

      // Fallback to Web Speech API - more reliable offline
      speakWithWebAPI(cleanText);
    },
    [
      isOnline,
      options.preferElevenLabs,
      elevenLabsAvailable,
      speakWithElevenLabs,
      speakWithWebAPI,
      cleanTextForSpeech,
    ]
  );

  // Pause function
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPaused(true);
    } else if (speaking && !paused && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [speaking, paused]);

  // Resume function
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setPaused(false);
    } else if (speaking && paused && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [speaking, paused]);

  // Cancel function
  const cancel = useCallback(() => {
    const wasSpeaking = speaking;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setPaused(false);
    setUsingElevenLabs(false);
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

  const setPreferElevenLabs = useCallback((prefer: boolean) => {
    setOptions((prev) => ({ ...prev, preferElevenLabs: prefer }));
  }, []);

  const state: TextToSpeechState = {
    speaking,
    paused,
    voices,
    options,
    usingElevenLabs,
    elevenLabsAvailable,
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
    setPreferElevenLabs,
  };

  return [state, controls];
};
