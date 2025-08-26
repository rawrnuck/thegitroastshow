import { useState, useEffect, useCallback } from "react";
import { RoastRepoAPI, roastAPI } from "../services/api";
import type {
  RoastResponse,
  UserAnalysisResponse,
  HealthResponse,
} from "../types/api";

// Hook for backend health status
export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      await RoastRepoAPI.checkHealth();
      setIsHealthy(true);
    } catch {
      setIsHealthy(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { isHealthy, isLoading, checkHealth };
}

// Hook for generating roasts
export function useRoastGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roastData, setRoastData] = useState<RoastResponse | null>(null);

  const generateRoast = useCallback(async (username: string, variants = 1) => {
    if (!username?.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoastData(null);

    try {
      const data = await RoastRepoAPI.generateRoast(username, { variants });
      setRoastData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate roast";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateQuickRoast = useCallback(async (username: string) => {
    if (!username?.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await RoastRepoAPI.generateQuickRoast(username);
      // Convert quick roast format to regular format
      setRoastData({
        success: data.success,
        username: data.username,
        roast: data.roast,
        stats: {
          totalRepos: 0,
          totalStars: 0,
          totalCommits: 0,
          topLanguage: "Unknown",
          accountAge: 0,
          emptyRepos: 0,
        },
        profile: {},
        meta: {
          generated_at: new Date().toISOString(),
          variants_requested: 1,
          variants_generated: 1,
          data_points_analyzed: {
            repositories: 0,
            commits: 0,
            events: 0,
            languages: 0,
          },
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate quick roast";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRoast = useCallback(() => {
    setRoastData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    roastData,
    generateRoast,
    generateQuickRoast,
    clearRoast,
  };
}

// Hook for user analysis
export function useUserAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserAnalysisResponse | null>(null);

  const analyzeUser = useCallback(async (username: string) => {
    if (!username?.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUserData(null);

    try {
      const data = await RoastRepoAPI.analyzeUser(username);
      setUserData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze user";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setUserData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    userData,
    analyzeUser,
    clearData,
  };
}

// Hook for checking if a GitHub user exists
export function useUserValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateUser = useCallback(
    async (username: string): Promise<boolean> => {
      if (!username?.trim()) return false;

      setIsValidating(true);
      try {
        await RoastRepoAPI.getUserProfile(username);
        return true;
      } catch {
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  return { validateUser, isValidating };
}

// Combined hook for the roasting flow
export function useRoastFlow() {
  const { isHealthy } = useBackendHealth();
  const roastGeneration = useRoastGeneration();
  const userAnalysis = useUserAnalysis();
  const userValidation = useUserValidation();

  const roastUser = useCallback(
    async (username: string, variants = 1) => {
      // First validate the user exists
      const isValid = await userValidation.validateUser(username);
      if (!isValid) {
        roastGeneration.clearRoast();
        return { success: false, error: "GitHub user not found" };
      }

      // Generate the roast
      await roastGeneration.generateRoast(username, variants);
      return { success: !roastGeneration.error, error: roastGeneration.error };
    },
    [userValidation, roastGeneration]
  );

  return {
    isBackendHealthy: isHealthy,
    ...roastGeneration,
    ...userAnalysis,
    ...userValidation,
    roastUser,
  };
}
