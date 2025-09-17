import { useRef, useState, type PropsWithChildren } from 'react';
import {
  m,
  useAnimate,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react';

const DURATION_SECONDS = 3;
const VIBRATION_DURATION = 0.4; // 0.4 seconds of vibration
const MAX_DISPLACEMENT = 1000;
const OPACITY_CHANGE_START = 0.9;
const VIBRATION_INTENSITY = 8; // Maximum pixels to shake

const transition = {
  duration: DURATION_SECONDS,
  ease: (time: number) => 1 - Math.pow(1 - time, 3),
};

const vibrationTransition = {
  duration: VIBRATION_DURATION,
  ease: "linear" as const,
};

const generateVibrationKeyframes = () => {
  const keyframes = [];
  const steps = 20; // Number of vibration steps
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const intensity = VIBRATION_INTENSITY * (1 - progress); // Fade out intensity
    const randomX = (Math.random() - 0.5) * 2 * intensity;
    const randomY = (Math.random() - 0.5) * 2 * intensity;
    keyframes.push({ x: randomX, y: randomY });
  }
  
  // End at original position
  keyframes.push({ x: 0, y: 0 });
  return keyframes;
};

interface ThanosSnapEffectProps extends PropsWithChildren {
  onAnimationComplete?: () => void;
}

export function ThanosSnapEffect({ children, onAnimationComplete }: ThanosSnapEffectProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const dissolveTargetRef = useRef<HTMLDivElement>(null);
  const displacement = useMotionValue(0);
  const [isDispersed, setIsDispersed] = useState(false);

  useMotionValueEvent(displacement, "change", (latest) => {
    displacementMapRef.current?.setAttribute('scale', latest.toString());
  });



  const playSnapSound = () => {
    try {
      const audio = new Audio('/media/snap.mp3');
      audio.volume = 1.0; // Set volume to 100%
      audio.play().catch(error => {
        console.log("Could not play snap sound:", error);
      });
    } catch (error) {
      console.log("Error creating snap audio:", error);
    }
  };

  const handleClick = async () => {
    console.log("ThanosSnapEffect: Click detected");
    if (scope.current.dataset.isAnimating === 'true' || isDispersed) {
      console.log("ThanosSnapEffect: Already animating or dispersed, ignoring click");
      return;
    }
    
    scope.current.dataset.isAnimating = 'true';
    console.log("ThanosSnapEffect: Starting animation");

    // Play the snap sound effect
    playSnapSound();

    // Add vibration effect before dispersion
    console.log("ThanosSnapEffect: Starting vibration");
    const vibrationKeyframes = generateVibrationKeyframes();
    await animate(
      scope.current,
      { 
        x: vibrationKeyframes.map(kf => kf.x),
        y: vibrationKeyframes.map(kf => kf.y)
      },
      vibrationTransition
    );

    console.log("ThanosSnapEffect: Starting dispersion");
    // Start the dispersion effect
    await Promise.all([
      animate(
        dissolveTargetRef.current!,
        { 
          scale: 1.2, 
          opacity: [1, 1, 0]
        },
        { ...transition, times: [0, OPACITY_CHANGE_START, 1] }
      ),
      animate(displacement, MAX_DISPLACEMENT, transition)
    ]);

    // Keep the element dispersed and hidden
    console.log("ThanosSnapEffect: Animation complete");
    setIsDispersed(true);
    scope.current.dataset.isAnimating = 'false';
    
    // Call the onAnimationComplete callback if provided
    if (onAnimationComplete) {
      console.log("ThanosSnapEffect: Calling onAnimationComplete callback");
      onAnimationComplete();
    }
  };

  return (
    <div ref={scope}>
      <m.div
        ref={dissolveTargetRef}
        onClick={handleClick}
        className="cursor-pointer filter-[url(#dissolve-filter)]"
        style={{ 
          visibility: isDispersed ? 'hidden' : 'visible',
          pointerEvents: isDispersed ? 'none' : 'auto'
        }}
      >
        {children}
      </m.div>

      <svg width="0" height="0" className="absolute -z-1">
        <defs>
          <filter
            id="dissolve-filter"
            x="-700%"
            y="-700%"
            width="1400%"
            height="1400%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="1"
              result="bigNoise"
            />
            <feComponentTransfer
              in="bigNoise"
              result="bigNoiseAdjusted"
            >
              <feFuncR type="linear" slope="0.5" intercept="-0.2" />
              <feFuncG type="linear" slope="3" intercept="-0.6" />
            </feComponentTransfer>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1"
              numOctaves="2"
              result="fineNoise"
            />
            <feMerge result="combinedNoise">
              <feMergeNode in="bigNoiseAdjusted" />
              <feMergeNode in="fineNoise" />
            </feMerge>
            <feDisplacementMap
              ref={displacementMapRef}
              in="SourceGraphic"
              in2="combinedNoise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}