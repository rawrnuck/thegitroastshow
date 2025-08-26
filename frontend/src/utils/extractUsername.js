/**
 * Extracts GitHub username from various URL formats
 * @param {string} input - GitHub URL or username
 * @returns {string} - Clean username string
 */
export function extractUsername(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove whitespace
  const trimmed = input.trim();
  
  // If it's already just a username (no URL parts), return it
  if (!trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  // Handle various GitHub URL formats
  const patterns = [
    // https://github.com/username
    /^https?:\/\/github\.com\/([^\/\?#]+)/i,
    // github.com/username
    /^github\.com\/([^\/\?#]+)/i,
    // www.github.com/username
    /^www\.github\.com\/([^\/\?#]+)/i,
    // github.com/username/repo
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\?#]+)\/*/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      // Additional validation - GitHub usernames are alphanumeric, hyphens, but can't start/end with hyphen
      const username = match[1];
      if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
        return username;
      }
    }
  }

  // If no pattern matches, assume it's a direct username
  // Clean it by removing any invalid characters
  const cleaned = trimmed.replace(/[^a-zA-Z0-9-]/g, '');
  
  // Validate the cleaned username
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(cleaned)) {
    return cleaned;
  }

  return '';
}

/**
 * Validates if a username is valid GitHub format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid GitHub username format
 */
export function isValidGitHubUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // GitHub username rules:
  // - 1-39 characters
  // - alphanumeric and hyphens only
  // - cannot start or end with hyphen
  // - cannot have consecutive hyphens
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username) && 
         username.length <= 39 && 
         !username.includes('--');
}
