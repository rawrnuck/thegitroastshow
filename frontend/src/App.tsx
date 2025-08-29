import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingAnimation from "./components/LoadingAnimation.jsx";
import GitHubInput from "./components/GitHubInput.jsx";
import TypewriterText from "./components/TypewriterText.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import APITestComponent from "./components/APITestComponent";
import PageTransition from "./components/PageTransition";
import { useRoastFlow } from "./hooks/useRoastAPI";
import "./App.css";

function App() {
  const [appState, setAppState] = useState("loading"); // 'loading', 'input', 'processing', 'roast', 'test', 'error'
  const [username, setUsername] = useState("");
  const [roastText, setRoastText] = useState("");
  const [roastStats, setRoastStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Use the roast API hook
  const {
    isBackendHealthy,
    isLoading,
    error,
    roastData,
    generateRoast,
    clearRoast,
  } = useRoastFlow();

  // Check URL for test mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test") === "true") {
      setAppState("test");
      return;
    }
  }, []);

  // Handle initial loading
  useEffect(() => {
    // Initial app loading - 3 seconds
    const timer = setTimeout(() => {
      setAppState("input");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Handle username submission - now uses real API
  const handleUsernameSubmit = async (
    submittedUsername: string,
    language: string = "en"
  ) => {
    console.log(
      "🔄 Starting roast generation for username:",
      submittedUsername,
      "in language:",
      language
    );
    console.log(
      "🌐 API Base URL:",
      import.meta.env.VITE_API_URL || "http://localhost:3001"
    );

    setUsername(submittedUsername);
    setAppState("processing");
    setErrorMessage("");

    try {
      console.log("📡 Calling generateRoast function...");
      // Generate roast using the real backend with language support
      await generateRoast(submittedUsername, 1, language);
      console.log("✅ generateRoast completed successfully");
    } catch (err) {
      console.error("❌ Failed to generate roast:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate roast"
      );
      setAppState("error");
    }
  };

  // Watch for roast data changes
  useEffect(() => {
    if (roastData && !isLoading && !error) {
      // Extract the roast text and stats
      const roast =
        roastData.roasts?.[0]?.roast ||
        roastData.roast ||
        "Failed to generate roast";
      setRoastText(roast);
      setRoastStats(roastData.stats);
      setAppState("roast");
    } else if (error && !isLoading) {
      setErrorMessage(error);
      setAppState("error");
    }
  }, [roastData, isLoading, error]);

  const handleProcessingComplete = () => {
    setAppState("roast");
  };

  const handleNewRoast = () => {
    setAppState("input");
    setUsername("");
    setRoastText("");
    setRoastStats(null);
    setErrorMessage("");
    clearRoast();
  };

  const handleTypewriterComplete = () => {
    // Could add additional effects here when roast is complete
    console.log("Roast delivery complete!");
  };

  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-bg-dark text-accent-light relative overflow-hidden">
        {/* API Test Mode */}
        {appState === "test" && (
          <div className="min-h-screen bg-white text-black">
            <APITestComponent />
            <div className="text-center p-4">
              <button
                onClick={() => {
                  window.history.replaceState({}, "", window.location.pathname);
                  setAppState("loading");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Back to Main App
              </button>
            </div>
          </div>
        )}

        {/* Regular app states with smooth transitions */}
        {appState !== "test" && (
          <>
            {/* Matrix background - always present */}
            <div className="matrix-bg" />

            <AnimatePresence mode="wait">
              {/* Initial Loading State */}
              {appState === "loading" && (
                <PageTransition key="loading">
                  <LoadingAnimation
                    type="initial"
                    onComplete={() => setAppState("input")}
                  />
                </PageTransition>
              )}

              {/* Input State */}
              {appState === "input" && (
                <PageTransition key="input">
                  <GitHubInput onSubmit={handleUsernameSubmit} />
                </PageTransition>
              )}

              {/* Processing State */}
              {appState === "processing" && (
                <PageTransition key="processing">
                  <LoadingAnimation
                    type="processing"
                    onComplete={handleProcessingComplete}
                  />
                </PageTransition>
              )}

              {/* Error State */}
              {appState === "error" && (
                <PageTransition key="error">
                  <div className="min-h-screen flex items-center justify-center relative">
                    <div className="max-w-2xl mx-auto p-8 relative z-10 text-center">
                      <h1 className="text-4xl md:text-6xl font-bold font-mono text-red-500 text-glow-strong mb-4">
                        ROAST FAILED
                      </h1>
                      <div className="bg-bg-darker border border-red-500 border-opacity-30 rounded-lg p-6 border-glow mb-8">
                        <p className="text-red-400 font-mono text-lg mb-4">
                          🚨 ERROR: {errorMessage}
                        </p>
                        <p className="text-primary-dark font-mono text-sm">
                          {isBackendHealthy === false
                            ? "Backend server is offline. Please check the connection."
                            : "Unable to roast this target. Maybe they're too good to roast?"}
                        </p>
                      </div>
                      <button
                        onClick={handleNewRoast}
                        className="
                          px-8 py-3 bg-transparent border-2 border-red-500
                          text-red-500 font-mono font-bold rounded-lg
                          hover:bg-red-500 hover:text-bg-dark
                          transition-all duration-300 terminal-button
                        "
                      >
                        TRY ANOTHER TARGET
                      </button>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* Roast Display State */}
              {appState === "roast" && (
                <PageTransition key="roast">
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
                            animationDuration: `${3 + Math.random() * 2}s`,
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
                          Target:{" "}
                          <span className="text-primary-green">{username}</span>
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

                        {/* Show backend stats if available */}
                        {roastStats && (
                          <div className="text-xs font-mono text-primary-dark mt-4 space-y-1">
                            <div>
                              [DAMAGE ASSESSMENT] Repositories analyzed:{" "}
                              {roastStats.totalRepos} | Stars collected:{" "}
                              {roastStats.totalStars}
                            </div>
                            <div>
                              Commits examined: {roastStats.totalCommits} |
                              Primary language: {roastStats.topLanguage}
                            </div>
                            <div>
                              Account age: {roastStats.accountAge} years | Empty
                              repos: {roastStats.emptyRepos}
                            </div>
                          </div>
                        )}

                        {!roastStats && (
                          <div className="text-xs font-mono text-primary-dark mt-4">
                            [DAMAGE ASSESSMENT] Ego destruction: 100% | Recovery
                            time: Unknown
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
