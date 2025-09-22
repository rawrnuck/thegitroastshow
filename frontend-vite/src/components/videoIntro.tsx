import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface VideoIntroProps {
  onComplete: (navigateTo?: string) => void;
}

const VideoIntro = ({ onComplete }: VideoIntroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showButtons, setShowButtons] = useState(false); // Always show buttons regardless of video state

  // Detect if user is on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkIsMobile();

    // Listen for window resize
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Effect to handle video timing and pausing
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    // Track whether playback actually started
    const playbackStartedRef = { current: false } as { current: boolean };

    // Function to check time and pause at 9 seconds
    const handleTimeUpdate = () => {
      if (videoElement.currentTime >= 9.0 && !videoPaused) {
        videoElement.pause();
        setVideoPaused(true);
        setShowButtons(true);
        console.log("Video paused at 9-second mark, showing buttons");
      }
    };

    // If the video can play, attempt to autoplay. If autoplay fails, show buttons.
    const onCanPlay = async () => {
      try {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        playbackStartedRef.current = true;
        console.log("Video autoplay started");
      } catch (err) {
        // Autoplay blocked (common on mobile/desktop without user gesture)
        console.warn("Autoplay blocked or failed, showing buttons", err);
        setShowButtons(true);
        setVideoPaused(true);
      }
    };

    // Attach listeners
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("canplay", onCanPlay);

    // Note: we purposely do NOT add a 'pause' listener so the video is non-interactive.
    // Buttons are shown only when reaching 9s or when autoplay is blocked.

    // Clean up
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
        videoElement.removeEventListener("canplay", onCanPlay);
        // Do not remove 'pause' because we never attached one
        videoElement.pause();
      }
    };
  }, []); // Only run once on mount

  return (
    <div
      className="video-intro-container"
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
        overflow: "hidden",
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none", // make video non-interactive
        }}
        src={
          isMobile
            ? "/media/roast intro phone.mp4"
            : "/media/roast intro(1).mp4"
        }
        preload="auto"
      />

      {/* Buttons overlay that appears when video is paused or showButtons is true */}
      <AnimatePresence>
        {(videoPaused || showButtons) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute",
              bottom: isMobile ? "15%" : "20%",
              display: "flex",
              justifyContent: "center",
              width: "100%",
              gap: isMobile ? "1rem" : "2rem",
              zIndex: 300, // Ensure buttons are above video
            }}
          >
            <button
              onClick={() => onComplete("ENTER_BUTTON")}
              className="barriecito-regular"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                border: "2px solid #00a0a0",
                borderRadius: "8px",
                padding: isMobile ? "0.5em 1.5em" : "0.75em 2em",
                fontSize: isMobile ? "1em" : "1.1em",
                cursor: "pointer",
                transition: "all 0.25s ease",
                backdropFilter: "blur(4px)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
              }}
            >
              yeah got it
            </button>
            <button
              onClick={() => onComplete("GIT_INPUT")}
              className="barriecito-regular"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                border: "2px solid #00a0a0",
                borderRadius: "8px",
                padding: isMobile ? "0.5em 1.5em" : "0.75em 2em",
                fontSize: isMobile ? "1em" : "1.1em",
                cursor: "pointer",
                transition: "all 0.25s ease",
                backdropFilter: "blur(4px)",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
              }}
            >
              i don't care
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoIntro;
