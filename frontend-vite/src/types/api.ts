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
  payload: Record<string, unknown>;
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

// Interface for text-to-speech items
export interface SpeechItem {
  type: "speech";
  text: string;
}

export interface SoundItem {
  type: "sound";
  effect: string;
  cue: string;
  emoji: string;
  file: string;
}

export type RoastItem = SpeechItem | SoundItem;

// Convert API roast response to roast items
export function convertRoastToItems(roastResponse: RoastResponse): RoastItem[] {
  const items: RoastItem[] = [];

  // Start with intro and mic adjustment
  items.push({
    type: "sound",
    effect: "mic_drop",
    cue: "*adjusts mic*",
    emoji: "🎤",
    file: "sounds/micmoving.mp3",
  });

 

  // Add applause after intro
  items.push({
    type: "sound",
    effect: "applause",
    cue: "*applause*",
    emoji: "👏",
    file: "sounds/applause.mp3",
  });

  // Get main roast text and clean it
  const roastText =
    roastResponse.roasts?.[0]?.roast || roastResponse.roast || "";

  // Clean the roast text by removing sound cues and asterisk-based actions
  const cleanedRoastText = cleanRoastText(roastText);

  // Split roast into sentences for better timing
  const sentences = cleanedRoastText.match(/[^.!?]+[.!?]+/g) || [
    cleanedRoastText,
  ];

  // Add each sentence with appropriate sound effects
  const soundEffects = [
    {
      effect: "crowd_laugh",
      cue: "*crowd laughs*",
      emoji: "😂",
      file: "sounds/crowdlaugh.mp3",
    },
    {
      effect: "rimshot",
      cue: "*rimshot*",
      emoji: "🥁",
      file: "sounds/rimshot.mp3",
    },
    {
      effect: "crickets",
      cue: "*crickets*",
      emoji: "🦗",
      file: "sounds/crickets.mp3",
    },
    {
      effect: "crowd_gasp",
      cue: "*crowd gasps*",
      emoji: "😱",
      file: "sounds/crowdgasp.mp3",
    },
    {
      effect: "air_horn",
      cue: "*air horn*",
      emoji: "📯",
      file: "sounds/airhorn.mp3",
    },
    {
      effect: "boo",
      cue: "*crowd boos*",
      emoji: "👎",
      file: "sounds/crowdboos.mp3",
    },
  ];

  sentences.forEach((sentence: string, index: number) => {
    const cleanSentence = sentence.trim();
    if (cleanSentence) {
      items.push({
        type: "speech",
        text: cleanSentence,
      });

      // Add sound effect after most sentences (but not all)
      if (index < sentences.length - 1 && Math.random() > 0.3) {
        const randomEffect =
          soundEffects[Math.floor(Math.random() * soundEffects.length)];
        items.push({
          type: "sound",
          effect: randomEffect.effect,
          cue: randomEffect.cue,
          emoji: randomEffect.emoji,
          file: randomEffect.file,
        });
      }
    }
  });

  // End with mic drop
  items.push({
    type: "sound",
    effect: "applause",
    cue: "*applause*",
    emoji: "👏",
    file: "sounds/applause.mp3",
  });

  return items;
}

// Helper function to clean roast text from sound cues and actions
export function cleanRoastText(text: string): string {
  return (
    text
      // Remove text within asterisks (sound cues like *crowd laughs*, *rimshot*)
      .replace(/\*[^*]*\*/g, "")
      // Remove text within parentheses that look like sound cues
      .replace(/\([^)]*\)/g, "")
      // Remove extra whitespace and clean up
      .replace(/\s+/g, " ")
      .trim()
      // Remove any remaining artifacts
      .replace(/^\s*,\s*/, "") // Remove leading commas
      .replace(/\s*,\s*$/, "") // Remove trailing commas
      .replace(/\s+([.!?])/g, "$1")
  ); // Fix spacing before punctuation
}
