const axios = require("axios");
const NodeCache = require("node-cache");

// Cache for 5 minutes by default
const cache = new NodeCache({
  stdTTL: process.env.CACHE_TTL || 300,
  maxKeys: process.env.MAX_CACHE_SIZE || 100,
});

class GitHubService {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.setupAuthHeaders();
  }

  setupAuthHeaders() {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "RoastRepo-Backend/1.0",
    };

    // Choose authentication method based on available environment variables
    if (process.env.GITHUB_TOKEN) {
      // Personal Access Token (simplest for development)
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
      console.log("🔑 Using GitHub Personal Access Token authentication");
    } else if (
      process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET
    ) {
      // OAuth App - for this we'll use basic auth for app-level requests
      // Note: For user-specific requests, you'd need OAuth flow
      const credentials = Buffer.from(
        `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
      console.log("🔑 Using GitHub OAuth App authentication");
    } else {
      console.log(
        "⚠️  No GitHub authentication configured - using unauthenticated requests (60/hour limit)"
      );
    }

    this.headers = headers;
  }

  async makeRequest(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`📦 Cache hit for: ${endpoint}`);
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: this.headers,
        params,
      });

      // Cache successful responses
      cache.set(cacheKey, response.data);
      console.log(`🌐 API call: ${endpoint} (${response.status})`);

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`GitHub user not found: ${endpoint}`);
      }
      if (error.response?.status === 403) {
        console.error("GitHub API rate limit exceeded");
        throw new Error("GitHub API rate limit exceeded");
      }
      console.error("GitHub API error:", error.message);
      throw error;
    }
  }

  async getUserProfile(username) {
    return await this.makeRequest(`/users/${username}`);
  }

  async getUserRepos(username, sort = "updated", per_page = 30) {
    return await this.makeRequest(`/users/${username}/repos`, {
      sort,
      per_page,
      type: "public",
    });
  }

  async getRepoCommits(username, repo, per_page = 30) {
    return await this.makeRequest(`/repos/${username}/${repo}/commits`, {
      author: username,
      per_page,
    });
  }

  async getRepoLanguages(username, repo) {
    return await this.makeRequest(`/repos/${username}/${repo}/languages`);
  }

  async getUserEvents(username, per_page = 30) {
    return await this.makeRequest(`/users/${username}/events/public`, {
      per_page,
    });
  }

  async getRepoContributors(username, repo) {
    return await this.makeRequest(`/repos/${username}/${repo}/contributors`);
  }

  // Comprehensive data gathering for roasting
  async gatherUserData(username) {
    try {
      console.log(`🔍 Gathering data for user: ${username}`);

      // Get basic profile
      const profile = await this.getUserProfile(username);

      // Get repositories
      const repos = await this.getUserRepos(username, "updated", 20);

      // Get recent commits from top repositories
      const repoCommits = [];
      const topRepos = repos.slice(0, 5); // Analyze top 5 repos

      for (const repo of topRepos) {
        try {
          const commits = await this.getRepoCommits(username, repo.name, 10);
          repoCommits.push({
            repo: repo.name,
            commits: commits.map((commit) => ({
              message: commit.commit.message,
              date: commit.commit.author.date,
              additions: commit.stats?.additions || 0,
              deletions: commit.stats?.deletions || 0,
            })),
          });
        } catch (error) {
          console.log(`⚠️  Could not fetch commits for ${repo.name}`);
        }
      }

      // Get recent public events
      const events = await this.getUserEvents(username, 20);

      // Analyze languages across repositories
      const languageStats = {};
      for (const repo of topRepos.slice(0, 10)) {
        try {
          const languages = await this.getRepoLanguages(username, repo.name);
          Object.entries(languages).forEach(([lang, bytes]) => {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          });
        } catch (error) {
          console.log(`⚠️  Could not fetch languages for ${repo.name}`);
        }
      }

      return {
        profile: {
          login: profile.login,
          name: profile.name,
          bio: profile.bio,
          location: profile.location,
          company: profile.company,
          blog: profile.blog,
          twitter_username: profile.twitter_username,
          public_repos: profile.public_repos,
          followers: profile.followers,
          following: profile.following,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        repositories: repos.map((repo) => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          size: repo.size,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          topics: repo.topics || [],
        })),
        commits: repoCommits,
        events: events.map((event) => ({
          type: event.type,
          repo: event.repo?.name,
          created_at: event.created_at,
          payload: event.payload,
        })),
        languageStats,
      };
    } catch (error) {
      console.error(`Error gathering data for ${username}:`, error.message);
      throw error;
    }
  }

  // Get rate limit status
  async getRateLimit() {
    return await this.makeRequest("/rate_limit");
  }
}

module.exports = new GitHubService();
