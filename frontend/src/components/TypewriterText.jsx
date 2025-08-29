import React, { useState, useEffect } from "react";

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
      let effect = "default";

      if (direction.includes("laugh")) effect = "crowd_laugh";
      else if (direction.includes("gasp")) effect = "crowd_gasp";
      else if (direction.includes("applause") || direction.includes("whoop"))
        effect = "applause";
      else if (direction.includes("mic")) effect = "mic_tap";
      else if (direction.includes("cricket")) effect = "crickets";
      else if (direction.includes("rimshot")) effect = "rimshot";
      else if (direction.includes("boo")) effect = "boo";

      return { type: "sound", effect, cue: part };
    }
    // Otherwise, it's speech
    return { type: "speech", text: part.trim() };
  });

  console.log("✅ Roast Script Parsed:", JSON.stringify(script, null, 2));
  return script;
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
              🔊 {soundCue}
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
            <span>Characters: {displayedText.length}</span>
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
