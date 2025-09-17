import { useState } from "react";
import EnterButton from "./enterButton";
import MockVideo from "./mockVideo";
import EnterButton2 from "./enterButton2";
import GitInput from "./gitInput";
import Fillers from "./fillers";
import Roast from "./roast";

// Flow Steps Configuration - Comment out steps you want to skip
const FLOW_STEPS = [
  // 'ENTER_BUTTON',    // Initial enter button
  // 'VIDEO',           // Video playback
  // 'ENTER_BUTTON_2',  // Second enter button
  "GIT_INPUT", // GitHub username input
  // 'FILLERS',         // Fillers with audio
  "ROAST", // User-specific roast
  "COMPLETE", // Flow completion
];

const FlowOrchestrator = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [username, setUsername] = useState<string>("");

  // Get current step
  const currentStep = FLOW_STEPS[currentStepIndex];
  const isComplete = currentStepIndex >= FLOW_STEPS.length - 1;

  // Generic step advance handler
  const advanceToNextStep = (data?: string) => {
    if (data && typeof data === "string") {
      setUsername(data); // Store username if provided
    }

    console.log(
      `Advancing from step ${currentStepIndex} (${currentStep}) to step ${
        currentStepIndex + 1
      }`
    );
    setCurrentStepIndex((prev) => Math.min(prev + 1, FLOW_STEPS.length - 1));
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

  // Expose the skip function for debugging
  (window as any).skipToFlow = skipToFlow;

  console.log(
    "FlowOrchestrator - Current step:",
    currentStepIndex,
    currentStep,
    "Complete:",
    isComplete
  );

  return (
    <div className="flow-container">
      {/* Step 1: Initial Enter Button - Comment this block to skip */}
      {currentStep === "ENTER_BUTTON" && (
        <EnterButton onAnimationComplete={() => advanceToNextStep()} />
      )}

      {/* Step 2: Video Screen - Comment this block to skip */}
      {currentStep === "VIDEO" && (
        <MockVideo isVisible={true} onVideoEnd={() => advanceToNextStep()} />
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
          onAnimationComplete={(username: string) =>
            advanceToNextStep(username)
          }
        />
      )}

      {/* Step 5: Fillers - Comment this block to skip */}
      {currentStep === "FILLERS" && (
        <Fillers onComplete={() => advanceToNextStep()} />
      )}

      {/* Step 6: User-specific Roast - Comment this block to skip */}
      {currentStep === "ROAST" && (
        <Roast username={username} onComplete={() => advanceToNextStep()} />
      )}

      {/* Step 7: Flow Complete - Comment this block to skip */}
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
              Roast Completed!
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
