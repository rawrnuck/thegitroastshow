import { useState } from "react";
import { AnimatePresence } from "motion/react";

import { ThanosSnapEffect } from "@/components/ui/thanos-snap-effect";

interface GitInputProps {
  onAnimationComplete?: (username: string) => void;
}

function GitInput({ onAnimationComplete }: GitInputProps) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnimationComplete = () => {
    if (onAnimationComplete && username.trim()) {
      onAnimationComplete(username.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && !isSubmitting) {
      // Validate GitHub username format
      const isValidUsername =
        /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(
          username.trim()
        );

      if (!isValidUsername) {
        alert("Please enter a valid GitHub username");
        return;
      }

      setIsSubmitting(true);
      // The Thanos snap effect will be triggered by clicking the button
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && username.trim() && !isSubmitting) {
      setIsSubmitting(true);
      // The form submission will handle the rest
    }
  };

  console.log(
    "GitInput rendering with username:",
    username,
    "isSubmitting:",
    isSubmitting
  );

  return (
    <div
      className="text-white"
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
      <div className="card" style={{ padding: "2em" }}>
        <h1
          className="barriecito-regular"
          style={{
            fontSize: "2.5em",
            marginBottom: "1.5em",
            color: "rgba(255, 255, 255, 0.87)",
          }}
        >
          Enter GitHub Username
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5em",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="github-username"
            disabled={isSubmitting}
            className="barriecito-regular"
            style={{
              padding: "0.75em 1.5em",
              fontSize: "1.1em",
              borderRadius: "8px",
              border: "2px solid #008080",
              backgroundColor: "#111319",
              color: "rgba(255, 255, 255, 0.87)",
              outline: "none",
              transition: "all 0.25s ease",
              minWidth: "300px",
              textAlign: "center",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#00a0a0";
              e.target.style.boxShadow = "0 0 0 2px rgba(0, 128, 128, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#008080";
              e.target.style.boxShadow = "none";
            }}
          />

          {username.trim() && (
            <AnimatePresence mode="wait">
              <ThanosSnapEffect onAnimationComplete={handleAnimationComplete}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-teal barriecito-regular shadow-sm shadow-black/5 hover:bg-primary/90 h-9 px-2 py-2 gap-2"
                  style={{
                    fontSize: "1.1em",
                    padding: "0.75em 2em",
                  }}
                >
                  begin show
                </button>
              </ThanosSnapEffect>
            </AnimatePresence>
          )}
        </form>
      </div>
    </div>
  );
}

// Default export for Fast Refresh to work properly
export default GitInput;
