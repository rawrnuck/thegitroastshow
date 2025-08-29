const express = require("express");
const router = express.Router();
const githubService = require("../services/githubService");
const llmService = require("../services/llmService");

// Validation middleware
const validateUsername = (req, res, next) => {
  const { username } = req.params;

  if (!username || username.length < 1 || username.length > 39) {
    return res.status(400).json({
      error: "Invalid username",
      message: "Username must be between 1 and 39 characters",
    });
  }

  if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return res.status(400).json({
      error: "Invalid username format",
      message: "Username contains invalid characters",
    });
  }

  next();
};

// Generate roast for a GitHub user
router.get("/:username", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    const { variants = 1, language = "en" } = req.query;

    console.log(
      `🔥 Generating roast for: ${username} in language: ${language}`
    );

    // Validate language parameter
    const supportedLanguages = ["en", "es", "fr", "de", "hi", "zh", "ja", "ru"];
    const targetLanguage = supportedLanguages.includes(language)
      ? language
      : "en";

    // Gather GitHub data
    const userData = await githubService.gatherUserData(username);

    // Generate roast(s) with language support
    let roasts;
    const variantCount = Math.min(Math.max(parseInt(variants) || 1, 1), 3); // 1-3 variants

    if (variantCount === 1) {
      const roast = await llmService.generateRoast(userData, targetLanguage);
      roasts = [roast];
    } else {
      roasts = await llmService.generateMultipleRoasts(
        userData,
        variantCount,
        targetLanguage
      );
    }

    // Calculate some fun stats
    const stats = {
      totalRepos: userData.repositories.length,
      totalStars: userData.repositories.reduce(
        (sum, repo) => sum + repo.stars,
        0
      ),
      totalCommits: userData.commits.reduce(
        (sum, repoCommit) => sum + repoCommit.commits.length,
        0
      ),
      topLanguage:
        Object.entries(userData.languageStats).sort(
          ([, a], [, b]) => b - a
        )?.[0]?.[0] || "Unknown",
      accountAge: Math.floor(
        (Date.now() - new Date(userData.profile.created_at)) /
          (1000 * 60 * 60 * 24 * 365)
      ),
      emptyRepos: userData.repositories.filter((repo) => repo.size === 0)
        .length,
    };

    res.json({
      success: true,
      username,
      language: targetLanguage,
      roasts: roasts.filter((r) => r), // Filter out any failed attempts
      stats,
      profile: {
        name: userData.profile.name,
        bio: userData.profile.bio,
        location: userData.profile.location,
        company: userData.profile.company,
        followers: userData.profile.followers,
        following: userData.profile.following,
      },
      meta: {
        generated_at: new Date().toISOString(),
        variants_requested: variantCount,
        variants_generated: roasts.filter((r) => r).length,
        data_points_analyzed: {
          repositories: userData.repositories.length,
          commits: userData.commits.reduce(
            (sum, repoCommit) => sum + repoCommit.commits.length,
            0
          ),
          events: userData.events.length,
          languages: Object.keys(userData.languageStats).length,
        },
      },
    });
  } catch (error) {
    console.error(
      `Error generating roast for ${req.params.username}:`,
      error.message
    );

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "User not found",
        message: `GitHub user '${req.params.username}' does not exist or has no public activity`,
      });
    }

    if (error.message.includes("rate limit")) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "GitHub API rate limit exceeded. Please try again later.",
        retryAfter: 3600, // 1 hour
      });
    }

    res.status(500).json({
      error: "Failed to generate roast",
      message: "Something went wrong while analyzing the GitHub profile",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Quick roast endpoint (minimal data gathering)
router.get("/:username/quick", validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`⚡ Quick roast for: ${username}`);

    // Get just basic profile and recent repos
    const [profile, repos] = await Promise.all([
      githubService.getUserProfile(username),
      githubService.getUserRepos(username, "updated", 10),
    ]);

    const quickData = {
      profile,
      repositories: repos,
      commits: [],
      events: [],
      languageStats: {},
    };

    const roast = await llmService.generateRoast(quickData);

    res.json({
      success: true,
      username,
      roast: roast.roast,
      fallback: roast.fallback,
      quick: true,
      meta: {
        generated_at: new Date().toISOString(),
        mode: "quick",
      },
    });
  } catch (error) {
    console.error(
      `Error generating quick roast for ${req.params.username}:`,
      error.message
    );

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "User not found",
        message: `GitHub user '${req.params.username}' does not exist`,
      });
    }

    res.status(500).json({
      error: "Failed to generate quick roast",
      message: error.message,
    });
  }
});

// Get sample roast (for demo purposes)
router.get("/demo/sample", (req, res) => {
  const sampleRoasts = [
    "Looking at your GitHub, I see you're the kind of developer who commits 'fix typo' more often than actual features. Your repository names suggest you either have a naming convention phobia or you're trying to speak in code... literally. But hey, at least you're consistent in your inconsistency! 🚀",

    "Your commit history reads like a mystery novel where the plot never develops. 'Update README', 'Fix bug', 'Change stuff' - Shakespeare would weep. Your repos have more forks than a fancy restaurant, but fewer stars than a cloudy night. Keep coding though, someone has to keep the 'TODO' comments industry alive! 💻",

    "I see you've mastered the art of the empty repository. It's like modern art - we don't understand it, but we respect the boldness. Your bio says 'passionate developer' but your commit frequency suggests 'passionate about weekends'. Still, your GitHub green squares look like a beautiful archipelago of productivity islands! 🌟",
  ];

  res.json({
    success: true,
    demo: true,
    roast: sampleRoasts[Math.floor(Math.random() * sampleRoasts.length)],
    message:
      "This is a sample roast. Provide a real GitHub username to get a personalized roast!",
  });
});

module.exports = router;
