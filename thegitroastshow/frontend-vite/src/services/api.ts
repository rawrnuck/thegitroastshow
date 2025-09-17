import type {
  HealthResponse,
  UserProfileResponse,
  UserReposResponse,
  UserAnalysisResponse,
  RoastResponse,
  RoastItem,
} from "../types/api";
import { convertRoastToItems, cleanRoastText } from "../types/api";

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
  console.log("🌐 Making API request to:", url, "with options:", options);

  try {
    // Add CORS mode explicitly
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      mode: "cors", // Ensure CORS is enabled
      ...options,
    });

    console.log("📡 API Response status:", response.status);

    // Check if the response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
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
    } else {
      console.log("📄 Response is not JSON:", await response.text());

      if (!response.ok) {
        throw new APIRequestError(
          "API request failed with non-JSON response",
          response.status
        );
      }

      // Return empty object as a fallback
      return {} as T;
    }
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

  // Get sample roast for demo purposes
  async getSampleRoast(): Promise<{
    success: boolean;
    demo: boolean;
    roast: string;
    message: string;
  }> {
    try {
      return await RoastRepoAPI.getSampleRoast();
    } catch (error) {
      console.error("Failed to get sample roast:", error);
      return {
        success: false,
        demo: true,
        roast:
          "Looking at this GitHub profile, I can tell they're the type of developer who names variables like 'x', 'xx', and the classic 'xxx'. Their commit messages are probably just a series of emojis that only make sense after three energy drinks.",
        message: "This is a fallback sample roast.",
      };
    }
  },

  // Get full roast response and convert to script items
  async getRoastItems(
    username: string,
    options: { quick?: boolean; language?: string } = {}
  ): Promise<RoastItem[]> {
    try {
      let response: RoastResponse;

      if (options.quick) {
        const quickResponse = await RoastRepoAPI.generateQuickRoast(username);
        // Convert quick response to RoastResponse format
        response = {
          success: quickResponse.success,
          username: quickResponse.username,
          roast: quickResponse.roast,
          stats: {
            totalRepos: 0,
            totalStars: 0,
            totalCommits: 0,
            topLanguage: "",
            accountAge: 0,
            emptyRepos: 0,
          },
          profile: {},
          meta: quickResponse.meta,
        };
      } else {
        response = await RoastRepoAPI.generateRoast(username, {
          language: options.language,
        });
      }

      // Convert the API response to roast items
      return convertRoastToItems(response);
    } catch (error) {
      console.error("Failed to get roast items:", error);

      // Return custom error message based on error type
      let errorMessage = `Hmm, it seems like my writers have gone on strike! I couldn't get any dirt on ${username}'s GitHub profile.`;

      if (error instanceof APIRequestError) {
        if (error.status === 404) {
          errorMessage = `Ladies and gentlemen, it seems like ${username} doesn't exist on GitHub! Either they're using a different platform or they're living off the grid. Let's roast their non-existence anyway!`;
        } else if (error.status === 429) {
          errorMessage = `Woah there! We're getting a bit too popular! GitHub's rate limits are hitting us hard. Please try again in a few minutes when the digital bouncers let us back in.`;
        } else if (error.status >= 500) {
          errorMessage = `Well, this is awkward... Our server is having a meltdown! Maybe it's trying to escape the horrible roast it was about to deliver to ${username}!`;
        }
      }

      // Return fallback items if API fails
      return [
        {
          type: "sound",
          effect: "mic_drop",
          cue: "*adjusts mic*",
          emoji: "🎤",
          file: "sounds/micdrop.mp3",
        },
        {
          type: "speech",
          text: `Ladies and gentlemen, welcome to tonight's roast of ${username}!`,
        },
        {
          type: "sound",
          effect: "applause",
          cue: "*applause*",
          emoji: "👏",
          file: "sounds/applause.mp3",
        },
        {
          type: "speech",
          text: errorMessage,
        },
        {
          type: "sound",
          effect: "crickets",
          cue: "*crickets*",
          emoji: "🦗",
          file: "sounds/crickets.mp3",
        },
        {
          type: "speech",
          text: `And remember, no roast means you're doing something right... or very, very wrong!`,
        },
        {
          type: "sound",
          effect: "crowd_laugh",
          cue: "*crowd laughs*",
          emoji: "😂",
          file: "sounds/applause.mp3",
        },
      ];
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
