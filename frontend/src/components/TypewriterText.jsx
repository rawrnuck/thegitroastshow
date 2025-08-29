import React, { useState, useEffect } from "react";

// Predefined sound effects mapping
const SOUND_EFFECTS = {
  crowd_laugh: {
    file: "crowd_laugh.mp3",
    emoji: "😂",
    keywords: ["laugh", "laughs", "laughter", "chuckle", "giggle"],
  },
  crowd_gasp: {
    file: "crowd_gasp.mp3",
    emoji: "😱",
    keywords: ["gasp", "gasps", "shock", "surprised"],
  },
  applause: {
    file: "applause.mp3",
    emoji: "👏",
    keywords: ["applause", "clap", "claps", "cheer", "whoop", "whoops"],
  },
  crickets: {
    file: "crickets.mp3",
    emoji: "🦗",
    keywords: ["cricket", "crickets", "silence", "awkward"],
  },
  boo: {
    file: "boo.mp3",
    emoji: "👎",
    keywords: ["boo", "boos", "hiss", "disapproval"],
  },
  rimshot: {
    file: "rimshot.mp3",
    emoji: "🥁",
    keywords: ["rimshot", "drum", "ba dum tss", "joke"],
  },
  mic_drop: {
    file: "mic_drop.mp3",
    emoji: "🎤",
    keywords: ["mic drop", "drops mic", "mic", "microphone"],
  },
  air_horn: {
    file: "air_horn.mp3",
    emoji: "📯",
    keywords: ["air horn", "horn", "dramatic", "epic"],
  },
};

// Parser function to convert LLM text into structured script
function parseRoast(rawText) {
  if (!rawText) return [];

  console.log("🔍 Raw LLM Response:", rawText);

  // Regex to find and split by *stage directions*
  const regex = /(\*.*?\*)/g;
  const parts = rawText.split(regex).filter((p) => p.trim());

  const script = parts.map((part) => {
    // If it's a stage direction, map it to a sound effect
    if (part.startsWith("*") && part.endsWith("*")) {
      const direction = part.slice(1, -1).toLowerCase();
      let effect = "crickets"; // Default fallback sound

      // Find matching sound effect based on keywords
      for (const [soundKey, soundData] of Object.entries(SOUND_EFFECTS)) {
        if (soundData.keywords.some((keyword) => direction.includes(keyword))) {
          effect = soundKey;
          break;
        }
      }

      return {
        type: "sound",
        effect,
        cue: part,
        emoji: SOUND_EFFECTS[effect].emoji,
        file: SOUND_EFFECTS[effect].file,
      };
    }
    // Otherwise, it's speech
    return { type: "speech", text: part.trim() };
  });

  console.log("✅ Roast Script Parsed:", JSON.stringify(script, null, 2));
  console.log(
    "🎵 Sound Effects Used:",
    script
      .filter((item) => item.type === "sound")
      .map((item) => `${item.effect} (${item.file})`)
  );
  return script;
}

// Function to play sound effects
const playSound = (soundEffect) => {
  try {
    const audio = new Audio(`/sounds/${soundEffect.file}`);
    audio.volume = 0.5; // Adjust volume as needed
    audio.play().catch((error) => {
      console.log(
        `🔇 Could not play sound: ${soundEffect.file}`,
        error.message
      );
    });
  } catch (error) {
    console.log(`🔇 Sound file not found: ${soundEffect.file}`);
  }
};

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

        let delay = speed;
        if (".,!?;:".includes(currentChar)) {
          delay = speed * 3;
        } else if (currentChar === " ") {
          delay = speed * 0.5;
        } else {
          delay = speed + Math.random() * 20;
        }

        const timer = setTimeout(() => {
          setDisplayedText((prev) => prev + currentChar);
          setCurrentIndex((prev) => prev + 1);
        }, delay);

        return () => clearTimeout(timer);
      } else {
        // Finished typing this speech, move to next script item
        setDisplayedText((prev) => prev + "\n\n");
        setCurrentScriptIndex((prev) => prev + 1);
        setCurrentIndex(0);
      }
    } else if (currentItem.type === "sound") {
      // Show sound cue
      setSoundCue(currentItem.cue);

      // Play the actual sound
      playSound(currentItem);

      // Wait for sound duration then move to next item
      const soundTimer = setTimeout(() => {
        setCurrentScriptIndex((prev) => prev + 1);
        setCurrentIndex(0);
      }, 1500);

      return () => clearTimeout(soundTimer);
    }
  }, [script, currentScriptIndex, currentIndex, speed, onComplete, isComplete]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  const handleRestart = () => {
    setDisplayedText("");
    setCurrentIndex(0);
    setCurrentScriptIndex(0);
    setIsComplete(false);
    setShowCursor(true);
    setSoundCue(null);
  };

  // Calculate total characters from all speech items
  const totalCharacters = script
    .filter((item) => item.type === "speech")
    .reduce((total, item) => total + item.text.length, 0);

  // Format text with proper line breaks and styling
  const formatText = (text) => {
    return text.split("\n").map((line, index) => (
      <div key={index} className="mb-2">
        {line}
      </div>
    ));
  };

  return (
    <div className="font-mono text-accent-light leading-relaxed">
      <div className="relative">
        {/* Sound Cue Display */}
        {soundCue && (
          <div className="mb-4 p-3 bg-primary-teal bg-opacity-20 rounded-lg border border-primary-teal border-opacity-50">
            <div className="text-primary-teal font-bold text-lg">
              {script[currentScriptIndex]?.emoji || "🔊"} {soundCue}
            </div>
            <div className="text-xs text-primary-teal opacity-75 mt-1">
              Playing: {script[currentScriptIndex]?.file || "sound.mp3"}
            </div>
          </div>
        )}

        {/* Main text content */}
        <div className="text-lg md:text-xl whitespace-pre-wrap">
          {formatText(displayedText)}
          {/* Cursor */}
          <span
            className={`
            inline-block w-0.5 h-6 bg-primary-teal ml-1
            ${showCursor ? "opacity-100" : "opacity-0"}
            transition-opacity duration-100
          `}
          ></span>
        </div>

        {/* Restart button */}
        {isComplete && canRestart && (
          <div className="mt-6 text-center">
            <button
              onClick={handleRestart}
              className="
                px-4 py-2 bg-transparent border border-primary-teal border-opacity-50
                text-primary-teal font-mono text-sm rounded-lg
                hover:border-opacity-100 hover:bg-primary-teal hover:bg-opacity-10
                transition-all duration-300 hover:border-glow
              "
            >
              ▶ REPLAY ROAST
            </button>
          </div>
        )}
      </div>

      {/* Terminal-style info */}
      <div className="mt-8 pt-4 border-t border-primary-teal border-opacity-20">
        <div className="text-xs font-mono text-primary-dark space-y-1">
          <div className="flex justify-between">
            <span>
              Characters: {displayedText.length}/{totalCharacters}
            </span>
            <span>Status: {isComplete ? "COMPLETE" : "TYPING"}</span>
          </div>
          <div className="text-accent-cyan">
            [ROAST ENGINE]{" "}
            {isComplete ? "Destruction complete" : "Generating savagery..."}
          </div>
          {script.length > 0 && (
            <div className="text-accent-cyan">
              Script Items: {script.length} | Current: {currentScriptIndex + 1}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypewriterText;
