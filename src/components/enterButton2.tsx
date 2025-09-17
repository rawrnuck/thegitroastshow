import { AnimatePresence } from "motion/react";
import { ThanosSnapEffect } from "@/components/ui/thanos-snap-effect";

interface EnterButton2Props {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

function EnterButton2({ isVisible, onAnimationComplete }: EnterButton2Props) {
  // Instead of tracking clicked state ourselves, let ThanosSnapEffect handle it
  const handleAnimationComplete = () => {
    console.log("Second button animation completed!");
    
    // Call the callback if provided
    if (onAnimationComplete) {
      onAnimationComplete();
    } else {
      console.log("Animation completed! Ready to navigate to the next screen/functionality.");
      // Here you would typically redirect to another page or show the next component
      // For example: window.location.href = '/dashboard';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="text-white" style={{ zIndex: 30 }}>
      <AnimatePresence mode="wait">
        <ThanosSnapEffect onAnimationComplete={handleAnimationComplete}>
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-teal barriecito-regular shadow-sm shadow-black/5 hover:bg-primary/90 h-9 px-4 py-2 gap-2"
            onClick={() => console.log("Second button clicked!")}
          >
            ENTER (for real this time)
          </button>
        </ThanosSnapEffect>
      </AnimatePresence>
    </div>
  );
}

export default EnterButton2;
