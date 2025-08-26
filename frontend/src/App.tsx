import { useState, useEffect } from 'react';
import LoadingAnimation from './components/LoadingAnimation.jsx';
import GitHubInput from './components/GitHubInput.jsx';
import TypewriterText from './components/TypewriterText.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './App.css';

// Sample roast texts for different scenarios
const roastTexts = {
  default: `Oh look, another JavaScript developer who thinks console.log() is a debugging strategy. Your commit messages read like a diary of regret, and your repository names suggest you've given up on creativity entirely. But hey, at least your README files are consistently empty - consistency is key, right?

I see you've mastered the art of pushing broken code to main branch. Your git history is a testament to the phrase "move fast and break things," except you forgot the part about fixing them afterwards.

Your variable names are more cryptic than ancient hieroglyphics, and your functions are longer than a CVS receipt. But don't worry, I'm sure somewhere in those 500-line methods lies the secret to eternal confusion.`,

  prolific: `Wow, look at Mr. Productive over here! You've got more repositories than actual working code. It's like you're collecting half-finished projects as a hobby. Your GitHub profile is basically a graveyard of abandoned dreams and forgotten TODO comments.

I bet your "Hello World" program has three different architectural patterns and still doesn't compile. You're the type of developer who refactors perfectly working code just because you read a Medium article about clean architecture.

Your commit frequency suggests you either never sleep or you've mastered the art of committing syntax errors at 3 AM. Either way, impressive dedication to mediocrity!`,

  minimal: `Ah, the minimalist approach - where "less is more" means "barely functional is acceptable." Your repository count is lower than my expectations, which is saying something.

I see you believe in quality over quantity, except you forgot the quality part. Your three repositories contain a combined total of what most developers call "a good start." But hey, at least you can't be accused of overengineering when there's barely any engineering to begin with.

Your coding philosophy seems to be "why write documentation when you can leave everyone guessing?" Truly revolutionary approach to software development!`
};

function App() {
  const [appState, setAppState] = useState('loading'); // 'loading', 'input', 'processing', 'roast'
  const [username, setUsername] = useState('');
  const [roastText, setRoastText] = useState('');

  // Handle initial loading
  useEffect(() => {
    // Initial app loading - 3 seconds
    const timer = setTimeout(() => {
      setAppState('input');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Generate roast text based on username (simulate analysis)
  const generateRoast = (targetUsername: string): string => {
    // Simple logic to vary roasts - in a real app, this would be more sophisticated
    const usernameLength = targetUsername.length;
    let selectedRoast;

    if (usernameLength > 10) {
      selectedRoast = roastTexts.prolific;
    } else if (usernameLength < 5) {
      selectedRoast = roastTexts.minimal;
    } else {
      selectedRoast = roastTexts.default;
    }

    // Personalize the roast with the username
    return selectedRoast.replace(/your/gi, `${targetUsername}'s`);
  };

  const handleUsernameSubmit = (submittedUsername: string) => {
    setUsername(submittedUsername);
    setAppState('processing');
    
    // Generate the roast text
    const generatedRoast = generateRoast(submittedUsername);
    setRoastText(generatedRoast);
  };

  const handleProcessingComplete = () => {
    setAppState('roast');
  };

  const handleNewRoast = () => {
    setAppState('input');
    setUsername('');
    setRoastText('');
  };

  const handleTypewriterComplete = () => {
    // Could add additional effects here when roast is complete
    console.log('Roast delivery complete!');
  };

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-bg-dark text-accent-light relative overflow-hidden">
        {/* Matrix background - always present */}
        <div className="matrix-bg" />

        {/* Initial Loading State */}
        {appState === 'loading' && (
          <LoadingAnimation 
            type="initial" 
            onComplete={() => setAppState('input')} 
          />
        )}

        {/* Input State */}
        {appState === 'input' && (
          <GitHubInput onSubmit={handleUsernameSubmit} />
        )}

        {/* Processing State */}
        {appState === 'processing' && (
          <LoadingAnimation 
            type="processing" 
            onComplete={handleProcessingComplete} 
          />
        )}

        {/* Roast Display State */}
        {appState === 'roast' && (
          <div className="min-h-screen flex items-center justify-center relative">
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 25 }, (_, i) => (
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

            <div className="max-w-4xl mx-auto p-8 relative z-10">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold font-mono text-primary-teal text-glow-strong mb-4">
                  ROAST COMPLETE
                </h1>
                <div className="text-lg font-mono text-accent-cyan text-glow">
                  Target: <span className="text-primary-green">{username}</span>
                </div>
              </div>

              {/* Terminal Window for Roast */}
              <div className="bg-bg-darker border border-primary-teal border-opacity-30 rounded-lg p-8 border-glow-strong">
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-teal border-opacity-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-primary-dark font-mono text-sm ml-4">
                      roast-output.txt
                    </span>
                  </div>
                  <div className="text-xs font-mono text-primary-dark">
                    {new Date().toLocaleString()}
                  </div>
                </div>

                {/* Roast Content */}
                <TypewriterText 
                  text={roastText}
                  speed={30}
                  onComplete={handleTypewriterComplete}
                  canRestart={true}
                />
              </div>

              {/* Action buttons */}
              <div className="text-center mt-8 space-y-4">
                <button
                  onClick={handleNewRoast}
                  className="
                    px-8 py-3 bg-transparent border-2 border-primary-teal
                    text-primary-teal font-mono font-bold rounded-lg
                    hover:bg-primary-teal hover:text-bg-dark
                    transition-all duration-300 terminal-button mr-4
                  "
                >
                  ROAST ANOTHER VICTIM
                </button>
                
                <div className="text-xs font-mono text-primary-dark mt-4">
                  [DAMAGE ASSESSMENT] Ego destruction: 100% | Recovery time: Unknown
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
