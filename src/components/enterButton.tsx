import {
  AnimatePresence,
} from "motion/react"

import { ThanosSnapEffect } from "@/components/ui/thanos-snap-effect";

interface EnterButtonProps {
  onAnimationComplete?: () => void;
}

function EnterButton({ onAnimationComplete }: EnterButtonProps) {
  const handleAnimationComplete = () => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  return (
    <div className="text-white">
      <AnimatePresence mode="wait">
        <ThanosSnapEffect onAnimationComplete={handleAnimationComplete}>
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-primary text-primary-teal barriecito-regular shadow-sm shadow-black/5 hover:bg-primary/90 h-9 px-4 py-2 gap-2"
          >
            ENTER
          </button>
        </ThanosSnapEffect>
      </AnimatePresence>
    </div>
  );
}

// Default export for Fast Refresh to work properly
export default EnterButton;
