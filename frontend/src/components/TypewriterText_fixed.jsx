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

  // More selective approach - only look for specific stage direction patterns
  // Look for asterisks that contain action/sound words
  const stageDirectionKeywords = [
    "crowd",
    "audience",
    "applause",
    "clap",
    "cheer",
    "laugh",
    "boo",
    "gasp",
    "cricket",
    "silence",
    "awkward",
    "rimshot",
    "drum",
    "ba dum",
    "mic drop",
    "drops mic",
    "microphone",
    "mic",
    "horn",
    "air horn",
    "adjusts",
    "taps",
    "feedback",
    "testing",
    "sound",
  ];

  const script = [];
  let currentText = rawText;
  let processedText = "";

  // Find potential stage directions
  const stageDirectionRegex = /\*([^*]*)\*/g;
  let match;
  let lastIndex = 0;

  while ((match = stageDirectionRegex.exec(rawText)) !== null) {
    const fullMatch = match[0];
    const content = match[1].toLowerCase().trim();

    // Check if this asterisk contains stage direction keywords
    const isStageDirection = stageDirectionKeywords.some((keyword) =>
      content.includes(keyword.toLowerCase())
    );

    if (isStageDirection) {
      console.log(`🎭 Found stage direction: "${content}"`);

      // Add speech before this stage direction
      const speechBefore = rawText.slice(lastIndex, match.index).trim();
      if (speechBefore) {
        script.push({ type: "speech", text: speechBefore });
      }

      // Find matching sound effect
      let effect = "crickets"; // Default
      for (const [soundKey, soundData] of Object.entries(SOUND_EFFECTS)) {
        if (
          soundData.keywords.some((keyword) =>
            content.includes(keyword.toLowerCase())
          )
        ) {
          effect = soundKey;
          console.log(`✅ Matched sound: ${effect} for "${content}"`);
          break;
        }
      }

      script.push({
        type: "sound",
        effect,
        cue: fullMatch,
        emoji: SOUND_EFFECTS[effect].emoji,
        file: SOUND_EFFECTS[effect].file,
      });

      lastIndex = match.index + fullMatch.length;
    } else {
      console.log(`⚠️ Skipping formatting asterisk: ${fullMatch}`);
    }
  }

  // Add remaining speech after last stage direction
  const remainingSpeech = rawText.slice(lastIndex).trim();
  if (remainingSpeech) {
    script.push({ type: "speech", text: remainingSpeech });
  }

  console.log("🔍 Initial Script:", script);

  // Check if we have reasonable parsing results
  const validSpeechItems = script.filter(
    (item) => item.type === "speech" && item.text.length > 10
  );
  const soundItems = script.filter((item) => item.type === "sound");

  console.log(
    `📊 Parse Results: ${validSpeechItems.length} speech items, ${soundItems.length} sound items`
  );

  // If we don't have enough content, create a simple fallback
  if (script.length === 0) {
    console.log("⚠️ No parsing results, using simple fallback");

    // Clean the text and split into sentences
    const cleanText = rawText.replace(/\*/g, "");
    const sentences = cleanText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);

    const fallbackScript = [
      {
        type: "sound",
        effect: "mic_moving",
        cue: "*adjusts mic*",
        emoji: "🎤",
        file: "sounds/micmoving.mp3",
      },
    ];

    sentences.forEach((sentence, index) => {
      fallbackScript.push({
        type: "speech",
        text: sentence.trim(),
      });

      // Add occasional sounds
      if (index === Math.floor(sentences.length / 3)) {
        fallbackScript.push({
          type: "sound",
          effect: "crowd_laugh",
          cue: "*crowd laughs*",
          emoji: "😂",
          file: "sounds/applause.mp3",
        });
      }
    });

    return fallbackScript;
  }

  return script.filter(
    (item) => item && (item.text?.length > 0 || item.type === "sound")
  );
}

const TypewriterText = ({
  text,
  speed = 50,
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

  // Sound playing state
  const lastSoundTimeRef = useRef(0);
  const lastSoundFileRef = useRef("");

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
      const audio = new Audio(`/${soundEffect.file}`);
      audio.volume = 0.5;

      audio.addEventListener("error", (e) => {
        console.error(`❌ Error loading sound: ${soundEffect.file}`, e);
      });

      audio.play().catch((error) => {
        console.log(
          `🔇 Could not play sound: ${soundEffect.file}`,
          error.message
        );
      });

      // Update tracking variables
      lastSoundTimeRef.current = now;
      lastSoundFileRef.current = soundEffect.file;
    } catch (error) {
      console.log(`🔇 Sound file not found: ${soundEffect.file}`);
    }
  };

  // Parse the text when it changes
  useEffect(() => {
    if (text) {
      const parsedScript = parseRoast(text);
      setScript(parsedScript);
      setCurrentScriptIndex(0);
      setDisplayedText("");
      setCurrentIndex(0);
      setIsComplete(false);
      setSoundCue(null);
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

      // Type out the speech
      if (currentIndex < currentItem.text.length) {
        const currentChar = currentItem.text[currentIndex];

        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + currentChar);
          setCurrentIndex((prev) => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else {
        // Speech is done, move to next item
        setCurrentScriptIndex((prev) => prev + 1);
        setCurrentIndex(0);
      }
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
  }, [currentScriptIndex, currentIndex, script, speed]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const handleRestart = () => {
    if (canRestart && isComplete) {
      setCurrentScriptIndex(0);
      setDisplayedText("");
      setCurrentIndex(0);
      setIsComplete(false);
      setSoundCue(null);
    }
  };

  return (
    <div className="min-h-[200px] bg-gray-900 text-green-400 p-6 rounded-lg font-mono overflow-y-auto">
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

      {/* Sound Cue Display */}
      {soundCue && (
        <div className="mt-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg text-blue-300 text-sm animate-pulse">
          <span className="mr-2 text-xl">{soundCue.emoji}</span>
          <em>{soundCue.cue}</em>
        </div>
      )}

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
