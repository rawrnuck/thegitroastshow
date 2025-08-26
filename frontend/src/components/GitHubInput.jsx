import React, { useState } from 'react';
import { extractUsername, isValidGitHubUsername } from '../utils/extractUsername';

const GitHubInput = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

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
      onSubmit(username);
    } else {
      setIsValid(false);
      // Shake animation for invalid input
      const inputElement = e.target.querySelector('input');
      inputElement.classList.add('animate-pulse');
      setTimeout(() => {
        inputElement.classList.remove('animate-pulse');
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Matrix background */}
      <div className="matrix-bg" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="text-center space-y-12 p-8 relative z-10 max-w-2xl mx-auto">
        {/* Main Title */}
        <div className="space-y-4">
          <div className="text-primary-teal text-glow-strong font-mono text-xs sm:text-sm leading-tight">
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
          </div>
          <p className="text-lg md:text-xl font-mono text-accent-light text-glow">
            Serving fresh code critiques since your last commit
          </p>
          <p className="text-sm font-mono text-primary-dark">
            Where your GitHub reputation comes to die
          </p>
        </div>

        {/* Terminal Window */}
        <div className="bg-bg-darker border border-primary-teal border-opacity-30 rounded-lg p-6 border-glow">
          {/* Terminal Header */}
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-primary-teal border-opacity-20">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-primary-dark font-mono text-sm ml-4">roast-terminal</span>
          </div>

          {/* Terminal Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <div className="font-mono text-primary-teal text-sm mb-2">
                <span className="text-accent-cyan">$</span> roast --target github.com/
              </div>
              
              <div className="relative">
                <input
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
                    ${isFocused ? 'border-glow-strong' : ''}
                    ${!isValid ? 'border-red-500 border-glow' : ''}
                  `}
                />
                
                {/* Input status indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {input && (
                    <span className={`
                      w-2 h-2 rounded-full 
                      ${isValid ? 'bg-green-500' : 'bg-red-500'}
                      ${isValid ? 'shadow-green-500' : 'shadow-red-500'}
                      shadow-sm
                    `}></span>
                  )}
                </div>
              </div>

              {/* Validation message */}
              {!isValid && input && (
                <div className="text-red-400 text-sm font-mono mt-2 text-glow">
                  Invalid GitHub username format
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!input.trim() || !isValid}
              className={`
                w-full py-3 px-6 rounded-lg font-mono font-bold text-bg-dark
                transition-all duration-300 terminal-button text-glow
                ${input.trim() && isValid 
                  ? 'opacity-100 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'}
              `}
            >
              INITIATE ROAST SEQUENCE
            </button>
          </form>

          {/* Terminal prompt line */}
          <div className="mt-4 flex items-center text-primary-teal font-mono text-sm">
            <span className="text-accent-cyan">$</span>
            <span className="ml-2">awaiting target...</span>
            <span className="cursor ml-1"></span>
          </div>
        </div>

        {/* Usage examples */}
        <div className="space-y-2 text-xs font-mono text-primary-dark">
          <div className="text-accent-light text-sm mb-2">Examples:</div>
          <div>• octocat</div>
          <div>• github.com/octocat</div>
          <div>• https://github.com/octocat/Hello-World</div>
        </div>

        {/* Footer */}
        <div className="text-xs font-mono text-primary-dark space-y-1">
          <div>[WARNING] This tool may cause severe ego damage</div>
          <div className="text-accent-cyan">Proceed at your own risk</div>
        </div>
      </div>
    </div>
  );
};

export default GitHubInput;
