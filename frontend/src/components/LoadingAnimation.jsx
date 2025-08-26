import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingAnimation = ({ type = "processing", onComplete }) => {
  const [stage, setStage] = useState("initializing"); // initializing, scanning, analyzing, generating, complete
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: "🔍",
      text: "Fetching user profile...",
      color: "text-primary-teal",
    },
    { icon: "📊", text: "Scanning repositories...", color: "text-accent-cyan" },
    {
      icon: "🔬",
      text: "Analyzing commit patterns...",
      color: "text-accent-purple",
    },
    {
      icon: "🔥",
      text: "Generating savage roast...",
      color: "text-accent-light",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setStage("scanning"), 1000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setStage("complete");
          return 100;
        }
        return prev + 2;
      });
    }, 150);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Matrix background with animated particles */}
      <div className="matrix-bg" />

      {/* Animated floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="text-center space-y-12 p-8 relative z-10 max-w-2xl mx-auto"
        variants={itemVariants}
      >
        {/* Terminal Window with entrance animation */}
        <motion.div
          className="bg-bg-darker border border-primary-teal border-opacity-30 rounded-lg p-8 border-glow backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Animated Terminal Header */}
          <motion.div
            className="flex items-center space-x-2 mb-6 pb-3 border-b border-primary-teal border-opacity-20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-red-500"
              variants={pulseVariants}
              animate="pulse"
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-yellow-500"
              variants={pulseVariants}
              animate="pulse"
              transition={{ delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500"
              variants={pulseVariants}
              animate="pulse"
              transition={{ delay: 0.4 }}
            />
            <span className="text-primary-dark font-mono text-sm ml-4">
              roast-processor
            </span>
          </motion.div>

          {/* Animated Loading Content */}
          <div className="space-y-6">
            {/* Main loading text with typing effect */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div
                className="text-primary-teal text-glow-strong font-mono text-lg mb-4"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(0,206,201,0.5)",
                    "0 0 20px rgba(0,206,201,0.8)",
                    "0 0 10px rgba(0,206,201,0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Analyzing GitHub Repository...
              </motion.div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-bg-dark rounded-full h-2 mb-6 border border-primary-teal border-opacity-30 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-primary-teal to-accent-cyan h-2 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* Animated Loading Steps */}
            <div className="space-y-3 text-left">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center space-x-3 font-mono text-sm ${
                    index <= currentStep ? "opacity-100" : "opacity-30"
                  }`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{
                    opacity: index <= currentStep ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2,
                    ease: "easeOut",
                  }}
                >
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep
                        ? "bg-primary-teal"
                        : index < currentStep
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                    animate={
                      index === currentStep
                        ? {
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 1, 0.7],
                          }
                        : {}
                    }
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className={`text-accent-light ${step.color}`}>
                    {step.icon} {step.text}
                  </span>
                  {index === currentStep && (
                    <motion.span
                      className="text-primary-teal"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ...
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Enhanced Central Spinner */}
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="relative">
                {/* Outer ring with pulse */}
                <motion.div
                  className="w-16 h-16 border-4 border-primary-teal border-opacity-20 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                    borderOpacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Spinning ring */}
                <motion.div
                  className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-teal border-r-accent-cyan rounded-full"
                  variants={spinnerVariants}
                  animate="animate"
                />

                {/* Inner glow with reverse spin */}
                <motion.div
                  className="absolute top-2 left-2 w-12 h-12 border-2 border-transparent border-t-accent-light rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>
            </motion.div>

            {/* Status text with fade */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
            >
              <div className="text-primary-dark font-mono text-xs">
                This may take a moment while we craft the perfect roast...
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Warning message */}
        <motion.div
          className="text-xs font-mono text-primary-dark text-center space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          <motion.div
            animate={{
              color: [
                "rgba(107, 114, 128, 1)",
                "rgba(239, 68, 68, 1)",
                "rgba(107, 114, 128, 1)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            [WARNING] Preparing devastating code critique
          </motion.div>
          <div className="text-accent-cyan">
            Your feelings are about to be compiled with errors
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingAnimation;
