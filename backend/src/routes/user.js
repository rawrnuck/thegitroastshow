const express = require("express");
const router = express.Router();
const githubService = require("../services/githubService");

// Validation middleware
const validateUsername = (req, res, next) => {
  const { username } = req.params;

  if (!username || username.length < 1 || username.length > 39) {
    return res.status(400).json({
      error: "Invalid username",
      message: "Username must be between 1 and 39 characters",
    });
  }

  // Basic GitHub username validation
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return res.status(400).json({
      error: "Invalid username format",
      message: "Username contains invalid characters",
    });
  }

  next();
};

// Get user profile
router.get("/:username", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📱 Fetching profile for: ${username}`);

    const profile = await githubService.getUserProfile(username);

    res.json({
      success: true,
      data: {
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
        avatar_url: profile.avatar_url,
      },
    });
  } catch (error) {
    console.error(`Error fetching user ${req.params.username}:`, error.message);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "User not found",
        message: `GitHub user '${req.params.username}' does not exist`,
      });
    }

    res.status(500).json({
      error: "Failed to fetch user profile",
      message: error.message,
    });
  }
});

// Get user repositories
router.get("/:username/repos", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    const { sort = "updated", per_page = 30 } = req.query;

    console.log(`📦 Fetching repositories for: ${username}`);

    const repos = await githubService.getUserRepos(
      username,
      sort,
      Math.min(per_page, 100)
    );

    res.json({
      success: true,
      data: repos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        size: repo.size,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        topics: repo.topics || [],
        html_url: repo.html_url,
      })),
      meta: {
        count: repos.length,
        sort,
        per_page,
      },
    });
  } catch (error) {
    console.error(
      `Error fetching repos for ${req.params.username}:`,
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch repositories",
      message: error.message,
    });
  }
});

// Get comprehensive user data
router.get("/:username/analyze", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 Analyzing user: ${username}`);

    const userData = await githubService.gatherUserData(username);

    res.json({
      success: true,
      data: userData,
      meta: {
        analyzed_at: new Date().toISOString(),
        repos_analyzed: userData.repositories.length,
        commits_analyzed: userData.commits.reduce(
          (sum, repoCommit) => sum + repoCommit.commits.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error(
      `Error analyzing user ${req.params.username}:`,
      error.message
    );

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "User not found",
        message: `GitHub user '${req.params.username}' does not exist`,
      });
    }

    res.status(500).json({
      error: "Failed to analyze user",
      message: error.message,
    });
  }
});

module.exports = router;
