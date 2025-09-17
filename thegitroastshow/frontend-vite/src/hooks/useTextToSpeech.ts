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
 * Custom hook for text-to-speech functionality
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

  // Reference to current utterance to control it
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize voices
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
        window.speechSynthesis?.cancel();
      }
    };
  }, [speaking]);

  // Speak function
  const speak = useCallback(
    (text: string) => {
      if (!text || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply options
      if (options.voice) utterance.voice = options.voice;
      if (options.rate) utterance.rate = options.rate;
      if (options.pitch) utterance.pitch = options.pitch;
      if (options.volume) utterance.volume = options.volume;

      // Add event handlers
      utterance.onstart = () => setSpeaking(true);
      utterance.onpause = () => setPaused(true);
      utterance.onresume = () => setPaused(false);
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setSpeaking(false);
        setPaused(false);
        utteranceRef.current = null;
      };

      // Save reference
      utteranceRef.current = utterance;

      // Speak
      window.speechSynthesis.speak(utterance);
    },
    [options]
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
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
    }
  }, []);

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
