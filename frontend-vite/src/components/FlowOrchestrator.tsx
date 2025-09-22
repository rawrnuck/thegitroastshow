import { useState, useCallback } from "react";
import EnterButton from "./enterButton";
import EnterButton2 from "./enterButton2";
import GitInput from "./gitInput";
import Fillers from "./fillers";
import RoastScript from "./roastScript";
import Intro from "./intro";
import Outro from "./outro";
import type { RoastItem } from "../types/api";

// Flow Steps Configuration - Comment out steps you want to skip
const FLOW_STEPS = [
  'ENTER_BUTTON',    // Initial enter button
  // 'INTRO',           // Intro animation with welcome message
  // 'ENTER_BUTTON_2',  // Second enter button
  "GIT_INPUT",       // GitHub username input
  "FILLERS",         // Fillers with audio (loading spinner while fetching roast data)
  "ROAST",           // User-specific roast script
  "OUTRO",           // Outro with exit message
];

const FlowOrchestrator = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [username, setUsername] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showDevControls, setShowDevControls] = useState(false);
  const [prefetchedRoastData, setPrefetchedRoastData] = useState<RoastItem[] | null>(null);

  // Get current step
  const currentStep = FLOW_STEPS[currentStepIndex];
  const isComplete = currentStepIndex >= FLOW_STEPS.length - 1;

  // Prefetch roast data in the background
  const prefetchRoastData = useCallback(async (username: string) => {
    if (!username || username.trim() === "") {
      console.warn("Attempted to prefetch data with empty username");
      return;
    }
    
    try {
      console.log("Prefetching roast data for username:", username);
      // Import the roastAPI from services only when needed to avoid circular dependencies
      const { roastAPI } = await import('../services/api');
      
      // Check if backend is available
      const isAvailable = await roastAPI.isBackendAvailable();
      console.log("Backend available for prefetch:", isAvailable);
      
      let items;
      if (isAvailable) {
        items = await roastAPI.getRoastItems(username, { language: "en" });
        console.log("Successfully prefetched roast items:", items);
      } else {
        throw new Error("Backend not available");
      }
      
      setPrefetchedRoastData(items);
    } catch (error) {
      console.warn("Could not prefetch roast data, will fetch during ROAST step:", error);
      setPrefetchedRoastData(null);
    }
  }, []);
  
  // Generic step advance handler
  const advanceToNextStep = (data?: string) => {
    const currentStepName = FLOW_STEPS[currentStepIndex];
    
    // Handle username data if provided (from GitInput)
    if (data && typeof data === "string" && data.trim()) {
      console.log(`Setting username to "${data}" from ${currentStepName}`);
      setUsername(data.trim()); // Store username if provided
      
      // Determine next step
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < FLOW_STEPS.length) {
        const nextStep = FLOW_STEPS[nextIndex];
        
        // If next step is FILLERS, start prefetching the data
        if (nextStep === "FILLERS") {
          console.log(`Will prefetch data for username "${data}" before showing fillers`);
          prefetchRoastData(data);
        }
      }
    } else if (data) {
      console.warn(`Invalid data provided: "${data}" from ${currentStepName}`);
    }

    // Determine the next step index
    const nextStepIndex = currentStepIndex + 1;
    const nextStepName = nextStepIndex < FLOW_STEPS.length ? FLOW_STEPS[nextStepIndex] : "NONE";
    
    console.log(
      `Advancing from step ${currentStepIndex} (${currentStepName}) to step ${nextStepIndex} (${nextStepName})`
    );
    
    // Move to the next step if it exists
    if (nextStepIndex < FLOW_STEPS.length) {
      setCurrentStepIndex(nextStepIndex);
    } else {
      console.warn("Attempted to advance beyond the last step");
    }
  };

  // Debug helper to skip to a specific flow step (can be called from console)
  const skipToFlow = (stepName: string, testUsername?: string) => {
    const stepIndex = FLOW_STEPS.findIndex((step) => step === stepName);
    if (stepIndex !== -1) {
      if (testUsername) {
        setUsername(testUsername);
      }
      setCurrentStepIndex(stepIndex);
      console.log(`Skipped to flow: ${stepName} at index ${stepIndex}`);
    } else {
      console.error(`Flow step ${stepName} not found`);
    }
  };

  // Expose developer functions for debugging
  (window as Window & typeof globalThis & { 
    skipToFlow: (stepName: string, testUsername?: string) => void;
    toggleSound: () => void;
    toggleTts: () => void;
    toggleDevControls: () => void;
  }).skipToFlow = skipToFlow;
  
  (window as Window & typeof globalThis & { 
    toggleSound: () => void;
  }).toggleSound = () => {
    setSoundEnabled(prev => {
      console.log("Sound toggled:", !prev);
      return !prev;
    });
  };

  (window as Window & typeof globalThis & { 
    toggleTts: () => void;
  }).toggleTts = () => {
    setTtsEnabled(prev => {
      console.log("TTS toggled:", !prev);
      return !prev;
    });
  };
  
  (window as Window & typeof globalThis & { 
    toggleDevControls: () => void;
  }).toggleDevControls = () => {
    setShowDevControls(prev => !prev);
  };

  console.log(
    "FlowOrchestrator - Current step:",
    currentStepIndex,
    currentStep,
    "Complete:",
    isComplete,
    "Username:", username ? username : "<none>"
  );

  return (
    <div className="flow-container">
      {/* Developer Controls */}
      {showDevControls && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          fontSize: '12px'
        }}>
          <div>Dev Controls</div>
          <button onClick={() => setSoundEnabled(!soundEnabled)} style={{
            margin: '5px',
            padding: '5px 10px',
            backgroundColor: soundEnabled ? '#008080' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
          </button>
          <button onClick={() => setTtsEnabled(!ttsEnabled)} style={{
            margin: '5px',
            padding: '5px 10px',
            backgroundColor: ttsEnabled ? '#008080' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            {ttsEnabled ? '🎙️ TTS ON' : '🔕 TTS OFF'}
          </button>
          <div style={{ fontSize: '10px', marginTop: '5px' }}>
            Console: toggleSound(), toggleTts(), toggleDevControls()
          </div>
        </div>
      )}
      {/* Step 1: Initial Enter Button - Comment this block to skip */}
      {currentStep === "ENTER_BUTTON" && (
        <EnterButton onAnimationComplete={() => advanceToNextStep()} />
      )}

      {/* Step 2: Intro Animation - Comment this block to skip */}
      {currentStep === "INTRO" && (
        <Intro onComplete={(navigateTo) => {
          console.log("Intro onComplete called with navigateTo:", navigateTo);
          if (navigateTo === 'GIT_INPUT') {
            // Skip to GIT_INPUT step when user clicks "i don't care"
            skipToFlow('GIT_INPUT');
          } else if (navigateTo === 'ENTER_BUTTON') {
            // Go back to ENTER_BUTTON when user clicks "yeah got it"
            skipToFlow('ENTER_BUTTON');
          }
          // No default behavior - we explicitly require a button click
        }} />
      )}

      {/* Step 3: Second Enter Button - Comment this block to skip */}
      {currentStep === "ENTER_BUTTON_2" && (
        <div
          className="card"
          style={{
            position: "absolute",
            zIndex: 100,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#111319",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <EnterButton2
            isVisible={true}
            onAnimationComplete={() => advanceToNextStep()}
          />
        </div>
      )}

      {/* Step 4: GitHub Input - Comment this block to skip */}
      {currentStep === "GIT_INPUT" && (
        <GitInput
          onAnimationComplete={(username: string) => {
            console.log("GitInput onAnimationComplete called with username:", username);
            if (username && username.trim()) {
              // Only advance if we have a valid username
              advanceToNextStep(username);
            } else {
              console.warn("GitInput completed without a valid username");
            }
          }}
        />
      )}

      {/* Step 5: Fillers - Comment this block to skip */}
      {currentStep === "FILLERS" && (
        <Fillers 
          onComplete={() => {
            console.log("Fillers onComplete called, advancing to ROAST");
            advanceToNextStep();
          }} 
          username={username}
        />
      )}

      {/* Step 6: User-specific Roast Script - Comment this block to skip */}
      {currentStep === "ROAST" && (
        <RoastScript 
          username={username} 
          onComplete={() => {
            console.log("RoastScript onComplete called, advancing to OUTRO");
            advanceToNextStep();
          }} 
          soundEnabled={soundEnabled}
          ttsEnabled={ttsEnabled}
          prefetchedRoastData={prefetchedRoastData}
        />
      )}

      {/* Step 7: Outro with exit message */}
      {currentStep === "OUTRO" && (
        <Outro 
          onComplete={(navigateTo) => {
            console.log("Outro onComplete called with navigateTo:", navigateTo);
            if (navigateTo === 'ENTER_BUTTON') {
              console.log("Redirecting to ENTER_BUTTON from Outro");
              // Reset username when going back to the beginning
              setUsername("");
              // Go back to ENTER_BUTTON when outro is complete
              skipToFlow('ENTER_BUTTON');
            } else {
              // This should not happen, but just in case
              console.warn("Outro completed without navigation target");
              advanceToNextStep();
            }
          }}
        />
      )}

      {/* Step 8: Flow Complete - Comment this block to skip */}
      {currentStep === "COMPLETE" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "white",
            fontSize: "2em",
            backgroundColor: "#111319",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                marginBottom: "2rem",
                fontFamily: '"Barriecito", cursive',
              }}
            >
              
            </h3>
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setUsername("");
              }}
              style={{
                padding: "0.75em 1.5em",
                fontSize: "0.7em",
                backgroundColor: "#008080",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: '"Barriecito", cursive',
              }}
            >
              Roast Another Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowOrchestrator;
