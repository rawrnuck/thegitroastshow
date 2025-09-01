const OpenAI = require("openai");

class LLMService {
  constructor() {
    // OpenRouter configuration (commented out)
    // if (!process.env.OPENROUTER_API_KEY) {
    //   console.warn(
    //     "⚠️  OPENROUTER_API_KEY not found. LLM features will be disabled."
    //   );
    //   this.client = null;
    // } else {
    //   this.client = new OpenAI({
    //     baseURL: "https://openrouter.ai/api/v1",
    //     apiKey: process.env.OPENROUTER_API_KEY,
    //   });
    //   console.log("🤖 OpenRouter LLM service initialized with DeepSeek R1");
    // }

    // Groq configuration
    console.log("🔍 Debug: GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
    console.log("🔍 This is the NEW LLM Service using Groq!");
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️  GROQ_API_KEY not found. LLM features will be disabled."
      );
      this.client = null;
    } else {
      this.client = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("🤖 Groq LLM service initialized");
    }
  }

  generateRoastPrompt(userData, language = "en") {
    const { profile, repositories, commits, languageStats } = userData;

    const languageMap = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      hi: "Hindi",
      zh: "Chinese",
      ja: "Japanese",
      ru: "Russian",
    };
    const targetLanguage = languageMap[language] || "English";

    const totalRepos = repositories?.length || 0;
    const totalStars = repositories?.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    ) || 0;

    const topLanguages = Object.keys(languageStats || {})
      .sort((a, b) => languageStats[b] - languageStats[a])
      .slice(0, 3);

    const recentCommits = commits?.slice(0, 5)?.map(commit => 
      commit.commit?.message?.split('\n')[0] || "No message"
    ) || [];

    // Enhanced roast prompt with better structure
    const prompt = `You are a world-class roast show host writing a script for a comedy roast. Your task is to write a DETAILED, humorous, satirical roast of the GitHub developer described below.

⚠️ CRITICAL REQUIREMENTS ⚠️
1. **LENGTH**: Write AT LEAST 300-500 words. This should be a FULL roast, not a short comment.
2. **LANGUAGE**: The entire roast script MUST be written in **${targetLanguage.toUpperCase()}**.
3. **TONE**: Professional comedian style - witty, clever, satirical but not mean-spirited.
4. **STRUCTURE**: Multiple paragraphs covering different aspects of their GitHub profile.

⚠️ STAGE DIRECTIONS FOR SOUND EFFECTS ⚠️
Include these EXACT stage directions throughout your roast:
- *adjusts mic* (opening)
- *crowd laughs* (after jokes)
- *crowd gasps* (shocking stats)
- *applause* (rare compliments)
- *crickets* (awkward moments)
- *crowd boos* (harsh truths)
- *rimshot* (punchlines)
- *air horn* (dramatic moments)
- *drops mic* (ending)

⚠️ ROASTING TOPICS TO COVER ⚠️
1. **Opening**: Introduce them with their username and a witty observation
2. **Bio Analysis**: Roast their bio (or lack of one)
3. **Repository Stats**: Mock their repo count vs star ratio
4. **Commit Messages**: Make fun of generic commit messages
5. **Language Choices**: Comment on their programming languages
6. **GitHub Activity**: Follower count, contribution patterns
7. **Repo Names**: Make jokes about their repository names
8. **Closing**: End with backhanded compliment

EXAMPLE QUALITY ROAST:
"*adjusts mic* Ladies and gentlemen, presenting ${profile.login}! *applause* Now here's a developer whose GitHub profile reads like a cry for help written in JavaScript. *crowd laughs* 

Their bio says 'looping through repos' - which I assume means they're stuck in an infinite while loop of existential dread. *crickets* With ${totalRepos} repositories and only ${totalStars} stars total, their code has less popularity than a debugging session at 3 AM. *crowd gasps*

Let's talk about those commit messages! *air horn* 'Add files via upload', 'first commit', 'fix' - it's like watching someone communicate entirely through grunts and pointing. *crowd laughs* Shakespeare is rolling in his grave so hard he could power a small city! *rimshot*

But seriously folks, ${profile.login} is out here coding, sharing their work, and that takes real courage. *applause* Keep pushing those commits, you beautiful, chaotic mess of a developer! *drops mic*"

---
DEVELOPER DATA TO ROAST:
- Username: ${profile.login}
- Name: ${profile.name || "Anonymous Coder"}
- Bio: "${profile.bio || "No bio - mysterious like their debugging skills"}"
- Total Repositories: ${totalRepos}
- Total Stars: ${totalStars}
- Star-to-Repo Ratio: ${totalStars}/${totalRepos} = ${(totalStars/totalRepos || 0).toFixed(2)}
- Top Languages: ${topLanguages.join(", ") || "HTML (probably)"}
- Recent Commit Messages: ${recentCommits.length > 0 ? `"${recentCommits.join('", "')}"` : "None available"}
- Followers: Data not available (probably single digits)
---

Write your roast script now!`;

    return prompt;
  }

  async generateRoast(userData, language = "en") {
    if (!this.client) {
      return this.getFallbackRoast(userData.profile, language);
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const prompt = this.generateRoastPrompt(userData, language);

        const completion = await this.client.chat.completions.create({
          // OpenRouter specific headers (commented out)
          // extra_headers: {
          //   "HTTP-Referer": "http://localhost:3001",
          //   "X-Title": "RoastRepo",
          // },
          // extra_body: {},
          model: "llama-3.1-8b-instant", // Groq model
          messages: [
            {
              role: "system",
              content: `You are a professional stand-up comedian and roast show host. Your job is to write DETAILED, HILARIOUS roast scripts.

CRITICAL REQUIREMENTS:
- Write AT LEAST 300-500 words per roast
- Include multiple jokes about different aspects of their GitHub
- Use specific stage directions: *adjusts mic*, *crowd laughs*, *crowd gasps*, *applause*, *crickets*, *crowd boos*, *rimshot*, *air horn*, *drops mic*
- Be witty and clever, not just mean
- Cover their bio, repos, commits, languages, stats in detail
- Make it feel like a real comedy roast show

DO NOT write short, generic responses. This should be a FULL professional roast performance.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.8,
        });

        const roast = completion.choices?.[0]?.message?.content;

        if (!roast || roast.trim().length === 0) {
          throw new Error("No roast generated from LLM.");
        }

        return {
          roast: roast.trim(),
          fallback: false,
          model: "llama-3.1-8b-instant", // Groq model
          language: language,
          attempts: attempt + 1
        };

      } catch (error) {
        console.error(`LLM Error (attempt ${attempt + 1}):`, error.message);

        // Check if it's a rate limit error
        const isRateLimit = error.message.includes("429") || 
                           error.message.includes("rate limit") ||
                           error.status === 429;

        if (isRateLimit && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`⏳ Rate limited. Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // If it's the last attempt or not a rate limit error, continue to next attempt
        if (attempt === maxRetries - 1) {
          console.error("🚨 All LLM attempts failed, using fallback roast");
          return this.getFallbackRoast(userData.profile, language);
        }

        // Wait before retry for other errors
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return this.getFallbackRoast(userData.profile, language);
  }

  getFallbackRoast(profile, language = "en") {
    const fallbackRoasts = {
      en: `*adjusts mic* Well well well, look who we have here - ${profile.login}! *crowd laughs* 

I've seen GitHub profiles that tell a story, and yours tells the story of someone who clearly thinks "git push --force" is a lifestyle choice! *rimshot* 

Your coding style is so unique, it makes spaghetti code look like fine Italian cuisine! *crowd gasps* I bet your commit messages are longer than your actual code changes. "Fixed the thing that was broken because I broke it while fixing the other thing" - Shakespeare would be proud! *crickets*

But hey, at least you're consistent! Consistently confusing every developer who tries to understand your repository structure! *crowd boos* 

Keep coding though, ${profile.login}. The world needs people like you to make the rest of us feel like coding ninjas! *applause* *drops mic*`,
      
      es: `*adjusts mic* ¡Damas y caballeros, aquí tenemos a ${profile.login}! *crowd laughs*

He visto perfiles de GitHub que cuentan una historia, ¡y el tuyo cuenta la historia de alguien que claramente piensa que "git push --force" es un estilo de vida! *rimshot*

Tu estilo de programación es tan único que hace que el código espagueti parezca alta cocina italiana! *crowd gasps* Apuesto a que tus mensajes de commit son más largos que tus cambios de código reales! *crickets*

¡Pero oye, al menos eres consistente! ¡Consistentemente confundes a cada desarrollador que trata de entender la estructura de tu repositorio! *crowd boos*

¡Sigue programando, ${profile.login}! ¡El mundo necesita gente como tú para hacernos sentir como ninjas de la programación al resto! *applause* *drops mic*`,
      
      fr: `*adjusts mic* Mesdames et messieurs, voici ${profile.login}! *crowd laughs*

J'ai vu des profils GitHub qui racontent une histoire, et le vôtre raconte l'histoire de quelqu'un qui pense clairement que "git push --force" est un mode de vie! *rimshot*

Votre style de codage est si unique qu'il fait passer le code spaghetti pour de la haute cuisine italienne! *crowd gasps* Je parie que vos messages de commit sont plus longs que vos changements de code réels! *crickets*

Mais au moins, vous êtes cohérent! Constamment en train de confondre chaque développeur qui essaie de comprendre la structure de votre dépôt! *crowd boos*

Continuez à coder, ${profile.login}! Le monde a besoin de gens comme vous pour nous faire sentir comme des ninjas du code! *applause* *drops mic*`
    };

    const roast = fallbackRoasts[language] || fallbackRoasts.en;
    
    return {
      roast,
      fallback: true,
      model: "fallback",
      language: language,
      attempts: 1
    };
  }

  async generateMultipleRoasts(userData, language = "en", count = 3) {
    const roasts = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const roast = await this.generateRoast(userData, language);
        roasts.push(roast);
        
        // Small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to generate roast ${i + 1}:`, error.message);
      }
    }

    return roasts;
  }
}

module.exports = new LLMService();
