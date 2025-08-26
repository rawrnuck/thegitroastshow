const Groq = require("groq-sdk");

class LLMService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️  GROQ_API_KEY not found. LLM features will be disabled."
      );
      this.client = null;
    } else {
      this.client = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("🤖 Groq LLM service initialized");
    }
  }

  generateRoastPrompt(userData) {
    const { profile, repositories, commits, events, languageStats } = userData;

    // Analyze the data to create context for roasting
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);
    const totalRepos = repositories.length;
    const topLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);

    const recentCommits = commits
      .flatMap((repoCommit) =>
        repoCommit.commits.map((commit) => commit.message)
      )
      .slice(0, 10);

    const repoNames = repositories.map((repo) => repo.name);
    const emptyRepos = repositories.filter((repo) => repo.size === 0).length;
    const forkedRepos = repositories.filter(
      (repo) => repo.forks_count === 0
    ).length;

    return `You are a witty code roaster. Generate a humorous, satirical roast of this GitHub developer based on their profile and activity. Be creative but not mean-spirited. Focus on funny observations about their coding habits, project choices, and GitHub behavior.

Developer Profile:
- Username: ${profile.login}
- Name: ${profile.name || "Anonymous"}
- Bio: ${profile.bio || "No bio (too cool for descriptions?)"}
- Location: ${profile.location || "Unknown (probably in their mom's basement)"}
- Company: ${profile.company || "Unemployed (or too embarrassed to say)"}
- Public Repos: ${profile.public_repos}
- Followers: ${profile.followers}
- Following: ${profile.following}
- Joined GitHub: ${new Date(profile.created_at).getFullYear()}

Repository Analysis:
- Total repositories: ${totalRepos}
- Total stars across all repos: ${totalStars}
- Empty repositories: ${emptyRepos}
- Top programming languages: ${
      topLanguages.join(", ") || "None (HTML doesn't count)"
    }
- Repository names: ${repoNames.slice(0, 10).join(", ")}

Recent Commit Messages:
${recentCommits.map((msg) => `- "${msg}"`).join("\n")}

Roasting Guidelines:
1. Make jokes about their commit messages if they're generic ("fix bug", "update", etc.)
2. Comment on their language choices and project diversity
3. Roast their star count and repository activity
4. Be funny about empty repos, generic names, or lack of documentation
5. Make observations about their bio, location, or company
6. Keep it light-hearted and developer-friendly
7. Use coding jokes, memes, and developer culture references
8. Aim for 3-5 witty paragraphs
9. End with a backhanded compliment

Generate a roast that would make other developers laugh while being relatable:`;
  }

  async generateRoast(userData) {
    if (!this.client) {
      return {
        roast:
          "Sorry, the roasting machine is temporarily offline. But looking at your GitHub, I'm sure there's plenty to roast! 🔥",
        fallback: true,
      };
    }

    try {
      const prompt = this.generateRoastPrompt(userData);

      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a witty GitHub profile roaster. Generate humorous, creative roasts about developers based on their GitHub activity. Be funny but not cruel.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama3-8b-8192", // Fast Groq model
        temperature: 0.9, // High creativity
        max_tokens: 1000,
        top_p: 0.9,
      });

      const roast = completion.choices[0]?.message?.content;

      if (!roast) {
        throw new Error("No roast generated");
      }

      return {
        roast: roast.trim(),
        fallback: false,
        model: "llama3-8b-8192",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("LLM Error:", error.message);

      // Fallback roasts based on data analysis
      return {
        roast: this.generateFallbackRoast(userData),
        fallback: true,
        error: error.message,
      };
    }
  }

  generateFallbackRoast(userData) {
    const { profile, repositories, commits } = userData;
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);

    // Generate a simple roast based on patterns
    let roast = `Hey ${profile.login}! `;

    if (totalStars === 0) {
      roast +=
        "I see you're collecting repositories like Pokémon cards, but with zero stars. Even your mom hasn't starred your repos yet! ";
    } else if (totalStars < 10) {
      roast += `${totalStars} stars total? That's cute. I've seen more stars in a cloudy night sky. `;
    }

    if (repositories.length > 50) {
      roast +=
        "You've got more repos than a Git hoarder's garage sale. Quality over quantity, friend! ";
    }

    const recentCommits = commits.flatMap((repoCommit) =>
      repoCommit.commits.map((c) => c.message)
    );
    const genericCommits = recentCommits.filter((msg) =>
      /^(fix|update|change|add|remove)$/i.test(msg.trim())
    ).length;

    if (genericCommits > 3) {
      roast +=
        "Your commit messages are more generic than a grocery store brand cereal. 'fix', 'update', 'change' - Shakespeare would be proud! ";
    }

    roast +=
      "But hey, at least you're coding, which is more than most people can say! Keep pushing those commits! 🚀";

    return roast;
  }

  async generateMultipleRoasts(userData, count = 3) {
    const roasts = [];

    for (let i = 0; i < count; i++) {
      try {
        const roast = await this.generateRoast(userData);
        roasts.push({
          ...roast,
          variant: i + 1,
        });

        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to generate roast ${i + 1}:`, error.message);
      }
    }

    return roasts;
  }
}

module.exports = new LLMService();
