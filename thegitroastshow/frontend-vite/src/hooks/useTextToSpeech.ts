import { useState, useEffect, useCallback, useRef } from "react";

interface TextToSpeechOptions {
  volume?: number;
  elevenLabsVoiceId?: string;
}

export interface TextToSpeechState {
  speaking: boolean;
  paused: boolean;
  options: TextToSpeechOptions;
  elevenLabsAvailable: boolean;
}

export interface TextToSpeechControls {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setVolume: (volume: number) => void;
  setElevenLabsVoiceId: (voiceId: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Custom hook for text-to-speech functionality using ElevenLabs only
 */
export const useTextToSpeech = (
  defaultOptions?: TextToSpeechOptions
): [TextToSpeechState, TextToSpeechControls] => {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState(false);
  const [options, setOptions] = useState<TextToSpeechOptions>({
    volume: defaultOptions?.volume || 1,
    elevenLabsVoiceId:
      defaultOptions?.elevenLabsVoiceId || "2EiwWnXFnvU5JabPnv8n", // Rachel
  });

  // Reference for controlling audio playback
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

  // Clean up any speaking on unmount
  useEffect(() => {
    return () => {
      if (speaking && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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

  // Custom event dispatcher for speech events
  const dispatchSpeechEvent = useCallback((eventName: string) => {
    document.dispatchEvent(new CustomEvent(eventName));
  }, []);

  // ElevenLabs TTS function
  const speakWithElevenLabs = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const cleanText = cleanTextForSpeech(text);
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
            audio.onplay = () => setSpeaking(true);
            audio.onpause = () => setPaused(true);
            audio.onplaying = () => setPaused(false);
            audio.onended = () => {
              setSpeaking(false);
              setPaused(false);
              audioRef.current = null;
              dispatchSpeechEvent("tts-ended");
              resolve(true);
            };
            audio.onerror = () => {
              console.error("Audio playback error from cache");
              setSpeaking(false);
              setPaused(false);
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
            } catch {
              console.error("Failed to parse error response");
            }
          }
          console.error("TTS Error:", errorMessage);
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
            hasStarted = true;
            dispatchSpeechEvent("tts-started");
          };
          audio.onpause = () => setPaused(true);
          audio.onplaying = () => setPaused(false);
          audio.onended = () => {
            setSpeaking(false);
            setPaused(false);
            audioRef.current = null;
            dispatchSpeechEvent("tts-ended");
            resolve(true);
          };
          audio.onerror = (error) => {
            console.error("Audio playback error:", error);
            setSpeaking(false);
            setPaused(false);
            audioRef.current = null;
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
    [options.elevenLabsVoiceId, cleanTextForSpeech, dispatchSpeechEvent]
  );

  // Main speak function
  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      // Always cancel any ongoing speech to prevent overlaps
      cancel();

      // Dispatch event to notify that speech is starting
      dispatchSpeechEvent("tts-starting");

      if (!elevenLabsAvailable) {
        console.warn("ElevenLabs TTS service is not available");
        dispatchSpeechEvent("tts-error");
        return;
      }

      const success = await speakWithElevenLabs(text);

      if (!success) {
        console.error("ElevenLabs TTS failed");
        dispatchSpeechEvent("tts-error");
        setSpeaking(false);
        setPaused(false);
      }
    },
    [elevenLabsAvailable, speakWithElevenLabs, dispatchSpeechEvent]
  );

  // Pause function
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPaused(true);
    }
  }, []);

  // Resume function
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setPaused(false);
    }
  }, []);

  // Cancel function
  const cancel = useCallback(() => {
    const wasSpeaking = speaking;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
    setPaused(false);

    // If we were speaking and now cancelling, dispatch the ended event
    if (wasSpeaking) {
      dispatchSpeechEvent("tts-ended");
    }
  }, [speaking, dispatchSpeechEvent]);

  // Option setter functions
  const setVolume = useCallback((volume: number) => {
    setOptions((prev) => ({ ...prev, volume }));
  }, []);

  const setElevenLabsVoiceId = useCallback((elevenLabsVoiceId: string) => {
    setOptions((prev) => ({ ...prev, elevenLabsVoiceId }));
  }, []);

  const state: TextToSpeechState = {
    speaking,
    paused,
    options,
    elevenLabsAvailable,
  };

  const controls: TextToSpeechControls = {
    speak,
    pause,
    resume,
    cancel,
    setVolume,
    setElevenLabsVoiceId,
  };

  return [state, controls];
};
