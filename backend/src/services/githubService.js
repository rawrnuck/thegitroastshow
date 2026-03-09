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

  async getUserRepos(username) {
    // We replace the simple page fetch with the complex fetching logic below
    // in order to avoid breaking existing signatures if they are called elsewhere
    return await this.makeRequest(`/users/${username}/repos`, {
      sort: "updated",
      per_page: 30,
      type: "public",
    });
  }

  async getRepoReadme(username, repo) {
    return await this.makeRequest(`/repos/${username}/${repo}/readme`);
  }

  async getRepoBranches(username, repo) {
    return await this.makeRequest(`/repos/${username}/${repo}/branches`);
  }

  async fetchEnhanceRepoNames(username) {
    const names = new Set();
    try {
      // 15 most recently updated
      const recent = await this.makeRequest(`/users/${username}/repos`, {
        sort: "updated",
        direction: "desc",
        per_page: 15,
      });
      if (Array.isArray(recent)) recent.forEach((r) => names.add(r.name));

      // 15 oldest created
      const oldest = await this.makeRequest(`/users/${username}/repos`, {
        sort: "created",
        direction: "asc",
        per_page: 15,
      });
      if (Array.isArray(oldest)) oldest.forEach((r) => names.add(r.name));
    } catch (error) {
       console.log("Error fetching enhanced repo names:", error.message);
    }
    return Array.from(names);
  }

  async fetchTargetRepos(username) {
    let combined = {};
    try {
      // 3 most recently updated
      const recent = await this.makeRequest(`/users/${username}/repos`, {
        sort: "updated",
        direction: "desc",
        per_page: 3,
      });
      if (Array.isArray(recent)) {
        recent.forEach((r) => { if (r.id) combined[r.id] = r; });
      }

      // 2 oldest created
      const oldest = await this.makeRequest(`/users/${username}/repos`, {
        sort: "created",
        direction: "asc",
        per_page: 2,
      });
      if (Array.isArray(oldest)) {
        oldest.forEach((r) => { if (r.id) combined[r.id] = r; });
      }
    } catch (error) {
       console.log("Error fetching target repos:", error.message);
    }
    return Object.values(combined);
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
      console.log(`${"=".repeat(60)}`);

      // Get basic profile
      console.log(`📱 Fetching profile for: ${username}`);
      const profile = await this.getUserProfile(username);
      console.log(`✅ Profile fetched:`, {
        login: profile.login,
        name: profile.name || "No name",
        bio: profile.bio || "No bio",
        location: profile.location || "No location",
        company: profile.company || "No company",
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      });

      // Fetch Profile README from special repository (username/username)
      let profileReadme = null;
      try {
        console.log(`📜 Fetching profile README for: ${username}`);
        const readmeData = await this.getRepoReadme(username, username);
        if (readmeData && readmeData.content) {
            profileReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            if (profileReadme.length > 2000) {
                profileReadme = profileReadme.substring(0, 2000) + "...";
            }
        }
      } catch (error) {
        console.log(`   ⚠️  No profile README found for ${username}`);
      }

      // Get repositories logic based on test.py (15/15 and top 5 deep dive)
      console.log(`📁 Fetching full repository names for: ${username}`);
      const repoNames = await this.fetchEnhanceRepoNames(username);
      console.log(`✅ Collected up to 30 repository names`);
      
      console.log(`📁 Fetching target repositories for deep analysis...`);
      const targetRepos = await this.fetchTargetRepos(username);
      console.log(`✅ Found ${targetRepos.length} target repositories to analyze deeply`);

      const repoCommits = [];
      const languageStats = {};
      const deepRepos = [];

      for (const repo of targetRepos) {
        try {
          console.log(`   🔍 Deep diving into: ${repo.name}`);
          
          // Commits
          const commits = await this.getRepoCommits(username, repo.name, 5);
          const processedCommits = commits.map((commit) => ({
             message: commit.commit.message,
             date: commit.commit.author.date,
             author: commit.commit.author.name
          }));
          repoCommits.push({ repo: repo.name, commits: processedCommits });
          
          // Languages
          try {
            const languages = await this.getRepoLanguages(username, repo.name);
            Object.entries(languages).forEach(([lang, bytes]) => {
              languageStats[lang] = (languageStats[lang] || 0) + bytes;
            });
          } catch (e) {
             console.log(`   ⚠️  No language data for ${repo.name}`);
          }
          
          // Branches
          let branches = [];
          try {
             const branchData = await this.getRepoBranches(username, repo.name);
             branches = branchData.map(b => b.name);
          } catch(e) { /* ignore */ }

          // README
          let readmeContent = null;
          try {
             const readme = await this.getRepoReadme(username, repo.name);
             if (readme && readme.content) {
                readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
                // Truncate to save tokens
                if (readmeContent.length > 1000) {
                   readmeContent = readmeContent.substring(0, 1000) + "...";
                }
             }
          } catch(e) { /* ignore */ }

          deepRepos.push({
             name: repo.name,
             description: repo.description,
             language: repo.language,
             stars: repo.stargazers_count,
             forks: repo.forks_count,
             size: repo.size,
             created_at: repo.created_at,
             updated_at: repo.updated_at,
             topics: repo.topics || [],
             branches: branches,
             readme: readmeContent
          });

        } catch (error) {
          console.log(`   ⚠️  Could not deep fetch ${repo.name}: ${error.message}`);
        }
      }

      // Get recent public events
      console.log(`🎯 Fetching recent events for: ${username}`);
      const events = await this.getUserEvents(username, 20);
      console.log(`✅ Found ${events.length} recent events`);
      const eventTypes = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {});
      console.log(`   Event breakdown:`, eventTypes);

      const sortedLanguages = Object.entries(languageStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      console.log(
        `✅ Top languages:`,
        sortedLanguages
          .map(([lang, bytes]) => `${lang}: ${(bytes / 1024).toFixed(1)}KB`)
          .join(", ")
      );

      console.log(`${"=".repeat(60)}`);
      console.log(`🎯 Data gathering complete for ${username}!`);
      console.log(
        `   📊 Stats: ${targetRepos.length} repos analyzed deep, ${repoCommits.reduce(
          (sum, rc) => sum + rc.commits.length,
          0
        )} commits fetched, ${events.length} events, ${
          Object.keys(languageStats).length
        } languages`
      );
      console.log(`${"=".repeat(60)}`);
      
      const gatheredData = {
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
          readme: profileReadme,
        },
        all_repository_names: repoNames,
        repositories: deepRepos,
        commits: repoCommits,
        events: events.map((event) => ({
          type: event.type,
          repo: event.repo?.name,
          created_at: event.created_at,
          payload: event.payload,
        })),
        languageStats,
      };

      return gatheredData;
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
