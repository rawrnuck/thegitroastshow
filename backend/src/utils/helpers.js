// Utility functions for the RoastRepo backend

const validateGitHubUsername = (username) => {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  if (username.length < 1 || username.length > 39) {
    return {
      valid: false,
      error: "Username must be between 1 and 39 characters",
    };
  }

  // GitHub username validation regex
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return { valid: false, error: "Username contains invalid characters" };
  }

  return { valid: true };
};

const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.trim().replace(/[<>]/g, "");
};

const calculateAccountAge = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears >= 1) {
    return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths >= 1) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  }

  return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
};

const extractEmojiFromText = (text) => {
  if (!text) return [];
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
};

const analyzeCommitPatterns = (commits) => {
  if (!Array.isArray(commits) || commits.length === 0) {
    return {
      totalCommits: 0,
      genericMessages: 0,
      averageMessageLength: 0,
      hasEmojis: false,
      mostCommonWords: [],
    };
  }

  const messages = commits.map((commit) => commit.message || "");
  const genericPatterns =
    /^(fix|update|change|add|remove|refactor|merge|initial commit)$/i;

  const genericCount = messages.filter(
    (msg) => genericPatterns.test(msg.trim()) || msg.trim().length < 5
  ).length;

  const totalLength = messages.reduce((sum, msg) => sum + msg.length, 0);
  const averageLength = messages.length > 0 ? totalLength / messages.length : 0;

  const allEmojis = messages.flatMap(extractEmojiFromText);

  // Extract common words (excluding generic ones)
  const words = messages
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        !["this", "that", "with", "from", "have", "been", "were"].includes(word)
    );

  const wordCount = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  const mostCommonWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  return {
    totalCommits: commits.length,
    genericMessages: genericCount,
    genericPercentage: Math.round((genericCount / messages.length) * 100),
    averageMessageLength: Math.round(averageLength),
    hasEmojis: allEmojis.length > 0,
    emojiCount: allEmojis.length,
    mostCommonWords,
  };
};

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  validateGitHubUsername,
  sanitizeString,
  calculateAccountAge,
  extractEmojiFromText,
  analyzeCommitPatterns,
  formatNumber,
  sleep,
};
