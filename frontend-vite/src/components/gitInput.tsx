import { useState } from "react";
import { AnimatePresence } from "motion/react";

import { ThanosSnapEffect } from "@/components/ui/thanos-snap-effect";
import { RoastRepoAPI } from "@/services/api";

interface GitInputProps {
  onAnimationComplete?: (username: string) => void;
}

function GitInput({ onAnimationComplete }: GitInputProps) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorHeading, setShowErrorHeading] = useState(false);
  const [userExists, setUserExists] = useState(true);
  const [inputStyles, setInputStyles] = useState({
    borderColor: "#00808045",
    boxShadow: "none",
    color: "rgba(255, 255, 255, 0.87)",
    placeholderColor: "#777777"
  });

  const handleAnimationComplete = () => {
    // Only call the parent onAnimationComplete if the user exists
    if (onAnimationComplete && username.trim() && userExists) {
      onAnimationComplete(username.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && !isSubmitting) {
      // Reset any previous error
      setShowErrorHeading(false);
      setUserExists(true);
      
      // Reset input styles to default
      setInputStyles({
        borderColor: "#00808045",
        boxShadow: "none",
        color: "rgba(255, 255, 255, 0.87)",
        placeholderColor: "#777777"
      });
      
      // Validate GitHub username format
      const isValidUsername =
        /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(
          username.trim()
        );

      if (!isValidUsername) {
        alert("Please enter a valid GitHub username");
        return;
      }

      // Check if the GitHub user exists
      try {
        setIsSubmitting(true);
        
        // Try to get the user profile to validate if the user exists
        await RoastRepoAPI.getUserProfile(username.trim());
        
        // If successful, continue with the Thanos snap effect
        setUserExists(true);
        // The Thanos snap effect will be triggered by clicking the button
      } catch {
        // If the user doesn't exist, show the custom error message
        setIsSubmitting(false);
        setShowErrorHeading(true);
        setUserExists(false);
        
        // Set input styles to error state
        setInputStyles({
          borderColor: "#ff5555",
          boxShadow: "0 0 0 2px rgba(255, 85, 85, 0.2)",
          color: "#ff5555",
          placeholderColor: "#ff5555"
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    
    // If there was an error before, reset it when the user edits
    if (showErrorHeading || !userExists) {
      setShowErrorHeading(false);
      setUserExists(true);
      
      // Reset input styles to default
      setInputStyles({
        borderColor: "#00808045",
        boxShadow: "none",
        color: "rgba(255, 255, 255, 0.87)",
        placeholderColor: "#777777"
      });
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && username.trim() && !isSubmitting) {
      handleSubmit(e as unknown as React.FormEvent);
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
  {showErrorHeading ? (
    <span> <span style={{ color: "#ff5555" }}>the</span> <span> victim</span > <span style={{ color: "#ff5555" }}>just roasted themselves with that</span> <span >typo!</span></span>
  ) : (
    <>who's the <span style={{ color: "#00a0a0" }}>victim</span> tonight?</>
  )}
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
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="enter github username"
            disabled={isSubmitting}
            className="barriecito-regular"
            style={{
              padding: "0.75em 3em",
              marginTop: "-2.5em",
              fontSize: "1.1em",
              borderRadius: "8px",
              border: `2px solid ${inputStyles.borderColor}`,
              backgroundColor: "#111319",
              color: inputStyles.color,
              outline: "none",
              transition: "all 0.25s ease",
              minWidth: "300px",
              textAlign: "center",
            }}
            onFocus={(e) => {
              if (!showErrorHeading && userExists) {
                e.target.style.borderColor = "#00a0a0";
                e.target.style.boxShadow = "0 0 0 2px rgba(0, 128, 128, 0.2)";
                e.target.placeholder = "yeah, type it… the humiliation awaits";
              } else {
                e.target.style.borderColor = "#ff5555";
                e.target.style.boxShadow = "0 0 0 2px rgba(255, 85, 85, 0.2)";
                e.target.placeholder = "try a valid username this time...";
              }
            }}
            onBlur={(e) => {
              if (!showErrorHeading && userExists) {
                e.target.style.borderColor = "#00808045";
                e.target.style.boxShadow = "none";
                e.target.placeholder = "enter github username";
              } else {
                e.target.style.borderColor = "#ff5555";
                e.target.style.boxShadow = "none";
                e.target.placeholder = "enter valid github username";
              }
            }}
          />

          {username.trim() && (
            <AnimatePresence mode="wait">
              {!showErrorHeading && (
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
              )}
              
            </AnimatePresence>
          )}
        </form>
      </div>
    </div>
  );
}

// Default export for Fast Refresh to work properly
export default GitInput;
