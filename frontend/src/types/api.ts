// API Types for RoastRepo Backend
export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  avatar_url: string;
}

export interface GitHubRepository {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  size: number;
  created_at: string;
  updated_at: string;
  topics: string[];
  html_url: string;
}

export interface CommitInfo {
  message: string;
  date: string;
  additions?: number;
  deletions?: number;
}

export interface RepoCommits {
  repo: string;
  commits: CommitInfo[];
}

export interface GitHubEvent {
  type: string;
  repo: string | null;
  created_at: string;
  payload: any;
}

export interface UserAnalysis {
  profile: GitHubProfile;
  repositories: GitHubRepository[];
  commits: RepoCommits[];
  events: GitHubEvent[];
  languageStats: Record<string, number>;
}

export interface RoastStats {
  totalRepos: number;
  totalStars: number;
  totalCommits: number;
  topLanguage: string;
  accountAge: number;
  emptyRepos: number;
}

export interface GeneratedRoast {
  roast: string;
  fallback: boolean;
  variant?: number;
  model?: string;
  timestamp?: string;
  error?: string;
}

export interface RoastResponse {
  success: boolean;
  username: string;
  roasts?: GeneratedRoast[];
  roast?: string; // For single roast responses
  stats: RoastStats;
  profile: Partial<GitHubProfile>;
  meta: {
    generated_at: string;
    variants_requested: number;
    variants_generated: number;
    data_points_analyzed: {
      repositories: number;
      commits: number;
      events: number;
      languages: number;
    };
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: string;
  version: string;
  environment: string;
  services: {
    github: boolean;
    llm: boolean;
  };
}

export interface APIError {
  error: string;
  message: string;
  details?: string;
  retryAfter?: number;
}

export interface UserProfileResponse {
  success: boolean;
  data: GitHubProfile;
}

export interface UserReposResponse {
  success: boolean;
  data: GitHubRepository[];
  meta: {
    count: number;
    sort: string;
    per_page: number;
  };
}

export interface UserAnalysisResponse {
  success: boolean;
  data: UserAnalysis;
  meta: {
    analyzed_at: string;
    repos_analyzed: number;
    commits_analyzed: number;
  };
}
