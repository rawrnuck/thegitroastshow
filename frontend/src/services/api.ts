import type {
  HealthResponse,
  UserProfileResponse,
  UserReposResponse,
  UserAnalysisResponse,
  RoastResponse,
} from "../types/api";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class APIRequestError extends Error {
  public readonly status: number;
  public readonly data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "APIRequestError";
    this.status = status;
    this.data = data;
  }
}

// Generic API fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("🌐 Making API request to:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log("📡 API Response status:", response.status);
    const data = await response.json();
    console.log("📄 API Response data:", data);

    if (!response.ok) {
      throw new APIRequestError(
        data.message || data.error || "API request failed",
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    console.error("❌ API Request failed:", error);
    if (error instanceof APIRequestError) {
      throw error;
    }

    // Network or other errors
    throw new APIRequestError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
}

// API Service Class
export class RoastRepoAPI {
  // Health check
  static async checkHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>("/api/health");
  }

  // User endpoints
  static async getUserProfile(username: string): Promise<UserProfileResponse> {
    if (!username?.trim()) {
      throw new APIRequestError("Username is required", 400);
    }
    return apiRequest<UserProfileResponse>(
      `/api/user/${encodeURIComponent(username)}`
    );
  }

  static async getUserRepos(
    username: string,
    options: {
      sort?: "updated" | "created" | "pushed" | "full_name";
      per_page?: number;
    } = {}
  ): Promise<UserReposResponse> {
    if (!username?.trim()) {
      throw new APIRequestError("Username is required", 400);
    }

    const params = new URLSearchParams();
    if (options.sort) params.append("sort", options.sort);
    if (options.per_page)
      params.append("per_page", options.per_page.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<UserReposResponse>(
      `/api/user/${encodeURIComponent(username)}/repos${query}`
    );
  }

  static async analyzeUser(username: string): Promise<UserAnalysisResponse> {
    if (!username?.trim()) {
      throw new APIRequestError("Username is required", 400);
    }
    return apiRequest<UserAnalysisResponse>(
      `/api/user/${encodeURIComponent(username)}/analyze`
    );
  }

  // Roast endpoints
  static async generateRoast(
    username: string,
    options: {
      variants?: number;
      language?: string;
    } = {}
  ): Promise<RoastResponse> {
    if (!username?.trim()) {
      throw new APIRequestError("Username is required", 400);
    }

    const params = new URLSearchParams();
    if (options.variants && options.variants > 1) {
      params.append("variants", Math.min(options.variants, 3).toString());
    }
    if (options.language) {
      params.append("language", options.language);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<RoastResponse>(
      `/api/roast/${encodeURIComponent(username)}${query}`
    );
  }

  static async generateQuickRoast(username: string): Promise<{
    success: boolean;
    username: string;
    roast: string;
    fallback: boolean;
    quick: boolean;
    meta: any;
  }> {
    if (!username?.trim()) {
      throw new APIRequestError("Username is required", 400);
    }
    return apiRequest(`/api/roast/${encodeURIComponent(username)}/quick`);
  }

  // Demo endpoint
  static async getSampleRoast(): Promise<{
    success: boolean;
    demo: boolean;
    roast: string;
    message: string;
  }> {
    return apiRequest("/api/roast/demo/sample");
  }
}

// Helper functions for common use cases
export const roastAPI = {
  // Simple wrapper for getting a roast
  async roastUser(
    username: string,
    variants = 1,
    language = "en"
  ): Promise<string[]> {
    try {
      const response = await RoastRepoAPI.generateRoast(username, {
        variants,
        language,
      });

      if (response.roasts) {
        return response.roasts.map((r) => r.roast);
      } else if (response.roast) {
        return [response.roast];
      }

      return ["Failed to generate roast"];
    } catch (error) {
      console.error("Failed to roast user:", error);
      throw error;
    }
  },

  // Check if backend is available
  async isBackendAvailable(): Promise<boolean> {
    try {
      await RoastRepoAPI.checkHealth();
      return true;
    } catch {
      return false;
    }
  },

  // Get user stats for display
  async getUserStats(username: string) {
    try {
      const analysis = await RoastRepoAPI.analyzeUser(username);
      const { repositories, languageStats } = analysis.data;

      const totalStars = repositories.reduce(
        (sum, repo) => sum + repo.stars,
        0
      );
      const topLanguage =
        Object.entries(languageStats).sort(([, a], [, b]) => b - a)?.[0]?.[0] ||
        "Unknown";

      return {
        totalRepos: repositories.length,
        totalStars,
        topLanguage,
        languages: Object.keys(languageStats).length,
      };
    } catch (error) {
      console.error("Failed to get user stats:", error);
      throw error;
    }
  },
};

// Export the API class as default
export default RoastRepoAPI;
