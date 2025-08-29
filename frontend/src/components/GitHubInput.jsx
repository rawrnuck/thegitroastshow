import React, { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import {
  extractUsername,
  isValidGitHubUsername,
} from "../utils/extractUsername";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
  // Add more as needed
];

const GitHubInput = ({ onSubmit }) => {
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguage] = useState("en");
  const controls = useAnimation();

  useEffect(() => {
    setIsLoaded(true);
    controls.start("visible");
  }, [controls]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Real-time validation
    if (value.trim()) {
      const username = extractUsername(value);
      setIsValid(isValidGitHubUsername(username));
    } else {
      setIsValid(true); // Empty input is valid (neutral state)
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = extractUsername(input.trim());
    if (isValidGitHubUsername(username)) {
      onSubmit(username, language);
    } else {
      setIsValid(false);
      // Shake animation for invalid input
      const inputElement = e.target.querySelector("input");
      inputElement.classList.add("animate-pulse");
      setTimeout(() => {
        inputElement.classList.remove("animate-pulse");
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 1.2,
      },
    },
  };

  const glitchVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  };

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Matrix background */}
      <div className="matrix-bg" />

      {/* Floating particles with entrance animation */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: Math.random() * 2,
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="text-center space-y-12 p-8 relative z-10 max-w-2xl mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      >
        {/* Main Title with staggered entrance */}
        <motion.div
          className="space-y-4"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="text-primary-teal text-glow-strong font-mono text-xs sm:text-sm leading-tight"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <pre className="whitespace-pre">
              {`
██████╗  ██████╗  █████╗ ███████╗████████╗    ██████╗ ███████╗██████╗  ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝    ██╔══██╗██╔════╝██╔══██╗██╔═══██╗
██████╔╝██║   ██║███████║███████╗   ██║       ██████╔╝█████╗  ██████╔╝██║   ██║
██╔══██╗██║   ██║██╔══██║╚════██║   ██║       ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║
██║  ██║╚██████╔╝██║  ██║███████║   ██║       ██║  ██║███████╗██║     ╚██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ 
`}
            </pre>
          </motion.div>
          <motion.p
            className="text-lg md:text-xl font-mono text-accent-light text-glow"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Serving fresh code critiques since your last commit
          </motion.p>
          <motion.p
            className="text-sm font-mono text-primary-dark"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            Where your GitHub reputation comes to die
          </motion.p>
        </motion.div>

        {/* Terminal Window with enhanced entrance */}
        <motion.div
          className="bg-bg-darker border border-primary-teal border-opacity-30 rounded-lg p-6 border-glow"
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
        >
          {/* Terminal Header with animation */}
          <motion.div
            className="flex items-center space-x-2 mb-4 pb-2 border-b border-primary-teal border-opacity-20"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-primary-dark font-mono text-sm ml-4">
              roast-terminal
            </span>
          </motion.div>

          {/* Terminal Content */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <div className="text-left">
              <motion.div
                className="font-mono text-primary-teal text-sm mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                <span className="text-accent-cyan">$</span> roast --target
                github.com/
              </motion.div>

              <div className="relative flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <motion.input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter GitHub username or profile URL"
                    className={`
                      w-full px-4 py-3 bg-transparent border-2 rounded-lg font-mono text-accent-light 
                      placeholder-primary-dark transition-all duration-300 terminal-input
                      ${isFocused ? "border-glow-strong" : ""}
                      ${!isValid ? "border-red-500 border-glow" : ""}
                    `}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 2.0 }}
                  />
                  {/* Input status indicator */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {input && (
                      <motion.span
                        className={`
                          w-2 h-2 rounded-full 
                          ${isValid ? "bg-green-500" : "bg-red-500"}
                          ${isValid ? "shadow-green-500" : "shadow-red-500"}
                          shadow-sm
                        `}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </div>
                </div>
                {/* Language selector */}
                <motion.select
                  className="px-3 py-2 rounded-lg border-2 border-primary-teal bg-bg-dark text-accent-light font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-teal transition-all duration-300 md:min-w-[120px]"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label="Select language"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 2.2 }}
                >
                  {LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-bg-dark text-accent-light"
                    >
                      {lang.label}
                    </option>
                  ))}
                </motion.select>
              </div>

              {/* Validation message */}
              {!isValid && input && (
                <motion.div
                  className="text-red-400 text-sm font-mono mt-2 text-glow"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  Invalid GitHub username format
                </motion.div>
              )}
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={!input.trim() || !isValid}
              className={`
                w-full py-3 px-6 rounded-lg font-mono font-bold text-bg-dark
                transition-all duration-300 terminal-button text-glow
                ${
                  input.trim() && isValid
                    ? "opacity-100 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }
              `}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.2 }}
              whileHover={input.trim() && isValid ? { scale: 1.02 } : {}}
              whileTap={input.trim() && isValid ? { scale: 0.98 } : {}}
            >
              INITIATE ROAST SEQUENCE
            </motion.button>
          </motion.form>

          {/* Terminal prompt line */}
          <motion.div
            className="mt-4 flex items-center text-primary-teal font-mono text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.4 }}
          >
            <span className="text-accent-cyan">$</span>
            <span className="ml-2">awaiting target...</span>
            <motion.span
              className="cursor ml-1"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>

        {/* Usage examples */}
        <motion.div
          className="space-y-2 text-xs font-mono text-primary-dark"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.6 }}
        >
          <div className="text-accent-light text-sm mb-2">Examples:</div>
          <div>• octocat</div>
          <div>• github.com/octocat</div>
          <div>• https://github.com/octocat/Hello-World</div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-xs font-mono text-primary-dark space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.8 }}
        >
          <motion.div
            animate={{
              color: [
                "rgba(107, 114, 128, 1)",
                "rgba(239, 68, 68, 1)",
                "rgba(107, 114, 128, 1)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            [WARNING] This tool may cause severe ego damage
          </motion.div>
          <div className="text-accent-cyan">Proceed at your own risk</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GitHubInput;
