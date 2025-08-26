import React, { useState } from "react";
import { useRoastFlow, useBackendHealth } from "../hooks/useRoastAPI";

const APITestComponent: React.FC = () => {
  const [username, setUsername] = useState("octocat");
  const {
    isBackendHealthy,
    isLoading,
    error,
    roastData,
    roastUser,
    clearRoast,
  } = useRoastFlow();

  const handleRoast = async () => {
    await roastUser(username, 1);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🔥 RoastRepo API Test
      </h1>

      {/* Backend Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100">
        <h2 className="text-xl font-semibold mb-2">Backend Status</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isBackendHealthy === null
                ? "bg-yellow-500"
                : isBackendHealthy
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
          <span>
            {isBackendHealthy === null
              ? "Checking..."
              : isBackendHealthy
              ? "Backend Online"
              : "Backend Offline"}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          API URL: {import.meta.env.VITE_API_URL || "http://localhost:3001"}
        </p>
      </div>

      {/* Input Form */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Roast Generation</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub username"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRoast}
            disabled={isLoading || !isBackendHealthy}
            className={`px-4 py-2 rounded-md font-semibold ${
              isLoading || !isBackendHealthy
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isLoading ? "Roasting..." : "Generate Roast"}
          </button>
        </div>

        {roastData && (
          <button
            onClick={clearRoast}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {roastData && (
        <div className="space-y-4">
          {/* Roast Text */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              🔥 Roast for @{roastData.username}
            </h3>
            <p className="text-gray-800 leading-relaxed">
              {roastData.roasts?.[0]?.roast || roastData.roast}
            </p>
            {roastData.roasts?.[0]?.fallback && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ This is a fallback roast (LLM service unavailable)
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📊 GitHub Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">Repositories:</span>{" "}
                {roastData.stats.totalRepos}
              </div>
              <div>
                <span className="font-semibold">Total Stars:</span>{" "}
                {roastData.stats.totalStars}
              </div>
              <div>
                <span className="font-semibold">Commits Analyzed:</span>{" "}
                {roastData.stats.totalCommits}
              </div>
              <div>
                <span className="font-semibold">Top Language:</span>{" "}
                {roastData.stats.topLanguage}
              </div>
              <div>
                <span className="font-semibold">Account Age:</span>{" "}
                {roastData.stats.accountAge} years
              </div>
              <div>
                <span className="font-semibold">Empty Repos:</span>{" "}
                {roastData.stats.emptyRepos}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          {roastData.profile.name && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                👤 Profile
              </h3>
              <div className="text-sm space-y-1">
                {roastData.profile.name && (
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    {roastData.profile.name}
                  </div>
                )}
                {roastData.profile.bio && (
                  <div>
                    <span className="font-semibold">Bio:</span>{" "}
                    {roastData.profile.bio}
                  </div>
                )}
                {roastData.profile.location && (
                  <div>
                    <span className="font-semibold">Location:</span>{" "}
                    {roastData.profile.location}
                  </div>
                )}
                {roastData.profile.company && (
                  <div>
                    <span className="font-semibold">Company:</span>{" "}
                    {roastData.profile.company}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Followers:</span>{" "}
                  {roastData.profile.followers}
                </div>
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🔍 Analysis Details
            </h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Generated:</span>{" "}
                {new Date(roastData.meta.generated_at).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Repos Analyzed:</span>{" "}
                {roastData.meta.data_points_analyzed.repositories}
              </div>
              <div>
                <span className="font-semibold">Commits Analyzed:</span>{" "}
                {roastData.meta.data_points_analyzed.commits}
              </div>
              <div>
                <span className="font-semibold">Events Analyzed:</span>{" "}
                {roastData.meta.data_points_analyzed.events}
              </div>
              <div>
                <span className="font-semibold">Languages Found:</span>{" "}
                {roastData.meta.data_points_analyzed.languages}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Test Buttons */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Quick Tests</h3>
        <div className="flex flex-wrap gap-2">
          {["octocat", "torvalds", "defunkt", "gaearon"].map((testUser) => (
            <button
              key={testUser}
              onClick={() => {
                setUsername(testUser);
                roastUser(testUser, 1);
              }}
              disabled={isLoading || !isBackendHealthy}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md disabled:opacity-50"
            >
              Test: {testUser}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default APITestComponent;
