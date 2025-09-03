import React, { useState, useEffect, useRef } from "react";

// Predefined sound effects mapping - Updated to use sounds directory
const SOUND_EFFECTS = {
  crowd_laugh: {
    file: "sounds/applause.mp3",
    emoji: "😂",
    keywords: ["laugh", "laughs", "laughter", "chuckle", "giggle"],
  },
  crowd_gasp: {
    file: "sounds/crowdgasp.mp3",
    emoji: "😱",
    keywords: ["gasp", "gasps", "shock", "surprised"],
  },
  applause: {
    file: "sounds/applause.mp3",
    emoji: "👏",
    keywords: ["applause", "clap", "claps", "cheer", "whoop", "whoops"],
  },
  crickets: {
    file: "sounds/crickets.mp3",
    emoji: "🦗",
    keywords: ["cricket", "crickets", "silence", "awkward"],
  },
  boo: {
    file: "sounds/crowdboos.mp3",
    emoji: "👎",
    keywords: ["boo", "boos", "hiss", "disapproval"],
  },
  rimshot: {
    file: "sounds/rimshot.mp3",
    emoji: "🥁",
    keywords: ["rimshot", "drum", "ba dum tss", "joke"],
  },
  mic_drop: {
    file: "sounds/micdrop.mp3",
    emoji: "🎤",
    keywords: ["mic drop", "drops mic", "mic", "microphone"],
  },
  air_horn: {
    file: "sounds/airhorn.mp3",
    emoji: "📯",
    keywords: ["air horn", "horn", "dramatic", "epic"],
  },
  mic_moving: {
    file: "sounds/micmoving.mp3",
    emoji: "🎤",
    keywords: ["adjusts mic", "mic feedback", "taps mic", "testing"],
  },
};

// Parser function to convert LLM text into structured script
function parseRoast(rawText) {
  if (!rawText) return [];

  console.log("🔍 Raw LLM Response:", rawText);

  // Look ONLY for specific sound effect patterns - exact matches for stage directions
  const soundEffectPatterns = [
    /\*adjusts? mic\*|\*taps? mic\*|\*mic feedback\*|\*testing\*/gi,
    /\*crowd laughs?\*|\*audience laughs?\*|\*laughter\*/gi,
    /\*crowd gasps?\*|\*audience gasps?\*|\*gasp\*/gi,
    /\*applause\*|\*claps?\*|\*cheers?\*/gi,
    /\*crickets?\*|\*silence\*|\*awkward\*/gi,
    /\*crowd boos?\*|\*audience boos?\*|\*boo\*/gi,
    /\*rimshot\*|\*drum\*|\*ba dum tss\*/gi,
    /\*drops? mic\*|\*mic drop\*/gi,
    /\*air horn\*|\*horn\*/gi,
  ];

  const script = [];
  let currentPos = 0;
  const foundEffects = [];

  // Find all sound effects in the text
  soundEffectPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(rawText)) !== null) {
      foundEffects.push({
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
        text: match[0].toLowerCase(),
      });
    }
  });

  // Sort effects by position
  foundEffects.sort((a, b) => a.start - b.start);

  console.log("🎭 Found sound effects:", foundEffects);

  // If no sound effects found, use the original text as speech and add strategic sounds
  if (foundEffects.length === 0) {
    console.log(
      "⚠️ No explicit sound effects found, using strategic injection"
    );
    return createEnhancedScript(rawText);
  }

  // Process text with found sound effects
  currentPos = 0;
  foundEffects.forEach((effect, index) => {
    // Add speech before this effect (clean formatting asterisks)
    if (effect.start > currentPos) {
      const speechText = rawText.slice(currentPos, effect.start).trim();
      if (speechText) {
        // Remove formatting asterisks but keep the text
        const cleanedText = speechText
          .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** -> bold
          .replace(/\*(.+?)\*/g, "$1") // *italic* -> italic
          .trim();
        if (cleanedText) {
          script.push({ type: "speech", text: cleanedText });
        }
      }
    }

    // Add the sound effect
    let soundEffect = "crickets"; // Default
    for (const [soundKey, soundData] of Object.entries(SOUND_EFFECTS)) {
      if (soundData.keywords.some((keyword) => effect.text.includes(keyword))) {
        soundEffect = soundKey;
        console.log(`✅ Matched sound: ${soundEffect} for "${effect.match}"`);
        break;
      }
    }

    script.push({
      type: "sound",
      effect: soundEffect,
      cue: effect.match,
      emoji: SOUND_EFFECTS[soundEffect].emoji,
      file: SOUND_EFFECTS[soundEffect].file,
    });

    currentPos = effect.end;
  });

  // Add remaining speech after last effect (clean formatting asterisks)
  if (currentPos < rawText.length) {
    const remainingSpeech = rawText.slice(currentPos).trim();
    if (remainingSpeech) {
      // Remove formatting asterisks but keep the text
      const cleanedText = remainingSpeech
        .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** -> bold
        .replace(/\*(.+?)\*/g, "$1") // *italic* -> italic
        .trim();
      if (cleanedText) {
        script.push({ type: "speech", text: cleanedText });
      }
    }
  }

  console.log("🔍 Parsed Script:", script);
  return script.filter(
    (item) => item && (item.text?.length > 0 || item.type === "sound")
  );
}

// Enhanced script creation for when no explicit sound effects are found
function createEnhancedScript(rawText) {
  // Clean the text of formatting asterisks first
  const cleanText = rawText
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** -> bold
    .replace(/\*(.+?)\*/g, "$1") // *italic* -> italic
    .trim();

  // Split into sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10);

  const enhancedScript = [];

  // Add intro sound
  enhancedScript.push({
    type: "sound",
    effect: "mic_moving",
    cue: "*adjusts mic*",
    emoji: "🎤",
    file: "sounds/micmoving.mp3",
  });

  sentences.forEach((sentence, index) => {
    const trimmedSentence = sentence.trim();

    // Add the cleaned sentence (no asterisks)
    enhancedScript.push({
      type: "speech",
      text: trimmedSentence,
    });

    // Add strategic sounds based on content and position
    const lowerSentence = trimmedSentence.toLowerCase();

    // Content-based sound detection
    if (
      lowerSentence.includes("zero") ||
      lowerSentence.includes("no ") ||
      lowerSentence.includes("none") ||
      lowerSentence.includes("empty")
    ) {
      enhancedScript.push({
        type: "sound",
        effect: "crickets",
        cue: "*crickets*",
        emoji: "🦗",
        file: "sounds/crickets.mp3",
      });
    } else if (
      lowerSentence.includes("wow") ||
      lowerSentence.includes("amazing") ||
      lowerSentence.includes("impressive") ||
      lowerSentence.includes("bravo")
    ) {
      enhancedScript.push({
        type: "sound",
        effect: "crowd_gasp",
        cue: "*crowd gasps*",
        emoji: "😱",
        file: "sounds/crowdgasp.mp3",
      });
    } else if (index === Math.floor(sentences.length / 4)) {
      // First quarter - applause
      enhancedScript.push({
        type: "sound",
        effect: "applause",
        cue: "*applause*",
        emoji: "👏",
        file: "sounds/applause.mp3",
      });
    } else if (index === Math.floor(sentences.length / 2)) {
      // Halfway - crowd laughs
      enhancedScript.push({
        type: "sound",
        effect: "crowd_laugh",
        cue: "*crowd laughs*",
        emoji: "😂",
        file: "sounds/applause.mp3",
      });
    } else if (index === Math.floor((3 * sentences.length) / 4)) {
      // Three quarters - rimshot
      enhancedScript.push({
        type: "sound",
        effect: "rimshot",
        cue: "*rimshot*",
        emoji: "🥁",
        file: "sounds/rimshot.mp3",
      });
    }
  });

  // Add ending sound
  enhancedScript.push({
    type: "sound",
    effect: "mic_drop",
    cue: "*drops mic*",
    emoji: "🎤",
    file: "sounds/micdrop.mp3",
  });

  console.log("✅ Enhanced script created with cleaned text:", enhancedScript);
  return enhancedScript;
}

const TypewriterText = ({
  text,
  speed = 100, // Slower default speed (was 50)
  onComplete,
  canRestart = true,
}) => {
  const [script, setScript] = useState([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [soundCue, setSoundCue] = useState(null);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [currentCharacterCount, setCurrentCharacterCount] = useState(0);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  // Sound playing state
  const lastSoundTimeRef = useRef(0);
  const lastSoundFileRef = useRef("");
  const currentAudioRef = useRef(null);

  // Function to play sound effects
  const playSound = (soundEffect) => {
    try {
      const now = Date.now();
      const timeSinceLastSound = now - lastSoundTimeRef.current;

      // Prevent the same sound from playing multiple times rapidly
      if (
        soundEffect.file === lastSoundFileRef.current &&
        timeSinceLastSound < 1000
      ) {
        console.log(
          `🔇 Skipping repeated sound: ${soundEffect.file} (played ${timeSinceLastSound}ms ago)`
        );
        return;
      }

      console.log(`🎵 Playing sound: ${soundEffect.file}`);

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(`/${soundEffect.file}`);
      audio.volume = 0.5;
      currentAudioRef.current = audio;

      // Set sound playing state
      setIsSoundPlaying(true);

      audio.addEventListener("error", (e) => {
        console.error(`❌ Error loading sound: ${soundEffect.file}`, e);
        setIsSoundPlaying(false);
      });

      // Limit sound duration to 2 seconds
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration > 2) {
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            setIsSoundPlaying(false);
            console.log(
              `⏹️ Sound stopped after 2 seconds: ${soundEffect.file}`
            );
          }, 2000);
        }
      });

      // Handle sound end
      audio.addEventListener("ended", () => {
        setIsSoundPlaying(false);
        console.log(`🔚 Sound ended: ${soundEffect.file}`);
      });

      audio
        .play()
        .then(() => {
          // If sound is naturally shorter than 2 seconds, it will end normally
          // The ended event listener will handle setting isSoundPlaying to false
        })
        .catch((error) => {
          console.log(
            `🔇 Could not play sound: ${soundEffect.file}`,
            error.message
          );
          setIsSoundPlaying(false);
        });

      // Update tracking variables
      lastSoundTimeRef.current = now;
      lastSoundFileRef.current = soundEffect.file;
    } catch (error) {
      console.log(`🔇 Sound file not found: ${soundEffect.file}`);
      setIsSoundPlaying(false);
    }
  };

  // Parse the text when it changes
  useEffect(() => {
    if (text) {
      const parsedScript = parseRoast(text);
      setScript(parsedScript);

      // Calculate total characters in speech elements
      const totalChars = parsedScript
        .filter((item) => item.type === "speech")
        .reduce((sum, item) => sum + (item.text?.length || 0), 0);

      setTotalCharacters(totalChars);
      setCurrentScriptIndex(0);
      setDisplayedText("");
      setCurrentIndex(0);
      setCurrentCharacterCount(0);
      setIsComplete(false);
      setSoundCue(null);
      setIsSoundPlaying(false);

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    }
  }, [text]);

  // Execute the script
  useEffect(() => {
    if (script.length === 0 || currentScriptIndex >= script.length) {
      if (!isComplete && script.length > 0) {
        setIsComplete(true);
        if (onComplete) onComplete();
      }
      return;
    }

    const currentItem = script[currentScriptIndex];

    if (currentItem.type === "speech") {
      setSoundCue(null); // Clear any sound cue

      // Only proceed with typing if no sound is playing
      if (!isSoundPlaying && currentIndex < currentItem.text.length) {
        const currentChar = currentItem.text[currentIndex];

        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + currentChar);
          setCurrentIndex((prev) => prev + 1);
          setCurrentCharacterCount((prev) => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else if (!isSoundPlaying && currentIndex >= currentItem.text.length) {
        // Speech is done, move to next item
        setCurrentScriptIndex((prev) => prev + 1);
        setCurrentIndex(0);
      }
      // If sound is playing, don't advance the typewriter
    } else if (currentItem.type === "sound") {
      // Play sound and show cue
      setSoundCue(currentItem);
      playSound(currentItem);

      // Move to next item after a brief delay
      const timeout = setTimeout(() => {
        setCurrentScriptIndex((prev) => prev + 1);
        setCurrentIndex(0);
      }, 1500); // Sound cue visible for 1.5 seconds

      return () => clearTimeout(timeout);
    }
  }, [currentScriptIndex, currentIndex, script, speed, isSoundPlaying]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, []);

  const handleRestart = () => {
    if (canRestart && isComplete) {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }

      setCurrentScriptIndex(0);
      setDisplayedText("");
      setCurrentIndex(0);
      setCurrentCharacterCount(0);
      setIsComplete(false);
      setSoundCue(null);
      setIsSoundPlaying(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    totalCharacters > 0 ? (currentCharacterCount / totalCharacters) * 100 : 0;

  return (
    <div className="min-h-[200px] bg-gray-900 text-green-400 p-6 rounded-lg font-mono overflow-y-auto">
      {/* Character Count Display */}
      <div className="mb-4 flex justify-between items-center text-sm text-gray-400">
        <div>
          Characters:{" "}
          <span className="text-green-400">{currentCharacterCount}</span> /{" "}
          <span className="text-blue-400">{totalCharacters}</span>
        </div>
        <div className="text-yellow-400">
          Progress: {progressPercentage.toFixed(1)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="whitespace-pre-wrap leading-relaxed">
        {displayedText}
        {!isComplete && (
          <span
            className={`${
              showCursor ? "opacity-100" : "opacity-0"
            } transition-opacity duration-100`}
          >
            |
          </span>
        )}
      </div>

      {/* Restart Button */}
      {isComplete && canRestart && (
        <button
          onClick={handleRestart}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          🎭 Restart Roast
        </button>
      )}
    </div>
  );
};

export default TypewriterText;
