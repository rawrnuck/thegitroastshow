const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER?.toLowerCase() || "groq";
    
    // Groq configuration
    console.log("🔍 Debug: GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠️  GROQ_API_KEY not found. Groq LLM features will be disabled.");
      this.groqClient = null;
    } else {
      this.groqClient = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      console.log("🤖 Groq LLM service initialized");
    }

    // Gemini configuration
    console.log("🔍 Debug: GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    if (!process.env.GEMINI_API_KEY) {
        console.warn("⚠️  GEMINI_API_KEY not found. Gemini LLM features will be disabled.");
        this.geminiClient = null;
    } else {
        this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
         console.log("🤖 Gemini LLM service initialized");
    }
    
    console.log(`🤖 Active LLM Provider: ${this.provider.toUpperCase()}`);
  }

  generateRoastPrompt(userData, language = "en") {
    const { profile, repositories, commits, languageStats, all_repository_names } = userData;

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

    const totalRepos = all_repository_names?.length || 0;
    const repoNamesSample = all_repository_names ? all_repository_names.slice(0, 10).join(", ") : "None";
    
    const totalStars = repositories?.reduce(
      (sum, repo) => sum + (repo.stars || 0),
      0
    ) || 0;

    const topLanguages = Object.keys(languageStats || {})
      .sort((a, b) => languageStats[b] - languageStats[a])
      .slice(0, 3);

    // Enhanced roast prompt with better structure
    const prompt = `You are "The Roast Master" — the charismatic, witty host of **The Git Roast Show**, a live comedy roast show where you absolutely DESTROY developers based on their GitHub profiles. You talk like a real stand-up comedian — conversational, fluid, building up jokes with setups and punchlines. Think Kevin Hart meets Jeff Ross meets a senior engineer who's seen too much bad code.

⚠️ ABSOLUTE RULES ⚠️
- Use ONLY the real data provided below. NEVER invent repos, stars, commits, or stats.
- When quoting commit messages, ALWAYS mention the repo name. Example: "I looked at your repo 'Portfolio' and found a commit that just says 'first commit'... bro, that's not a commit, that's a cry for help."
- If a repo has no commits, roast the emptiness.
- Write in a CONVERSATIONAL, FLOWING style — like you're actually talking on stage. Long sentences, natural pauses, crowd interactions.
- DO NOT write bullet points or short choppy lines. Write PARAGRAPHS of comedy.
- The roast should be 400-600 words minimum. Make it a REAL performance.

🎤 STRUCTURE (follow this flow naturally):

1. **OPENING** (warm, sarcastic welcome):
   Start with something like "Ladies and gentlemen, welcome to The Git Roast Show! Tonight we have a VERY special guest..." Build anticipation. Mention their username dramatically. If they have a bio, read it out loud and mock it.

2. **THE PROFILE ROAST** (2-3 paragraphs):
   Mock their follower count, their bio, how long they've been on GitHub vs what they've actually accomplished. Compare their follower-to-following ratio. If they follow way more people than follow them back, that's comedy gold.

3. **THE REPO ROAST** (2-3 paragraphs, the MEAT of the show):
   Go through their repos one by one. Mock the names, the descriptions, the star counts. Quote their actual commit messages and tear them apart. If they have branches with weird names, mock those. If their README is generic or empty, roast that.

4. **THE LANGUAGE ROAST** (1 paragraph):
   Mock their programming language choices. Every language has stereotypes — use them.

5. **THE POETIC BURN** (2-4 rhyming lines):
   Drop a short roast poem/rap about them. Make it rhythmic and brutal.

6. **THE CLOSER** (warm sendoff):
   End with: "But seriously folks, ${profile.name || profile.login} — you're out here coding, pushing commits, and building things, and that's more than most people do from their couch. Keep going. This was The Git Roast Show — if this was a real roast, you'd leave baked, overcooked, or burnt. But hey, kudos for surviving the flames!"

🎭 STAGE DIRECTIONS:
Sprinkle these naturally throughout your script between sentences (not inside sentences):
[SOUND:air horn] [SOUND:rimshot] [SOUND:crowd laughs] [SOUND:crowd gasps] [SOUND:applause] [SOUND:crickets] [SOUND:crowd boos] [SOUND:drops mic]

📊 USER DATA:
- Username: ${profile.login}
- Name: ${profile.name || "Anonymous Coder"}
- Bio: "${profile.bio || "No bio — they can't even describe themselves"}"
- Profile README: "${profile.readme ? profile.readme.substring(0, 300).replace(/\n/g, ' ') + "..." : "None — not even a profile README, absolutely ghosting the world"}"
- Account Created: ${profile.created_at} (${Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24 * 365))} years on GitHub)
- Public Repos: ${totalRepos}
- Total Stars across analyzed repos: ${totalStars}
- Followers: ${profile.followers || 0}
- Following: ${profile.following || 0}
- Top Languages: ${topLanguages.join(", ") || "None"}
- All Known Repo Names: ${repoNamesSample}

📂 DETAILED REPO BREAKDOWN:
${repositories.map(r => {
  const repoCommits = commits && commits.find(c => c.repo === r.name)?.commits?.slice(0, 5) || [];
  let section = `\n🔹 Repo: "${r.name}"\n  Description: "${r.description || "No description"}"`;
  section += `\n  Language: ${r.language || "Unknown"} | Stars: ${r.stars || 0} | Forks: ${r.forks || 0}`;
  section += `\n  Branches: ${r.branches?.join(", ") || "none"}`;
  if (r.readme) section += `\n  README Snippet: "${r.readme.substring(0, 100).replace(/\n/g, ' ')}..."`;
  if (repoCommits.length === 0) {
    section += `\n  Commits: NONE — absolutely empty, a ghost repo`;
  } else {
    section += `\n  Recent Commits:`;
    repoCommits.forEach(c => {
      section += `\n    → "${c.message.split('\n')[0]}" by ${c.author || "Unknown"} (${c.date})`;
    });
  }
  return section;
}).join("\n")}

⚠️ IMPORTANT: Return ONLY the roast script as plain flowing text with [SOUND:effect] tags between sentences. Do NOT return JSON, arrays, or bullet points. Write it like a REAL comedy script. Output your entire roast in ${targetLanguage}.`;

    return prompt;
  }

  async generateRoast(userData, language = "en") {
    // If the selected provider client wasn't initialized, fallback
    if (this.provider === "groq" && !this.groqClient) return this.getFallbackRoast(userData.profile, language);
    if (this.provider === "gemini" && !this.geminiClient) return this.getFallbackRoast(userData.profile, language);

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    const systemPromptMessage = `You are the world's funniest stand-up comedian who specializes in roasting software developers. You have the charisma of Kevin Hart, the savage wit of Jeff Ross, and the technical knowledge of a 20-year senior engineer.

Your style is CONVERSATIONAL and FLOWING — you speak in full, natural sentences with setups, pauses, callbacks, and punchlines. You NEVER write in short choppy bullet points. You write like you're actually performing live on stage in front of an audience.

Every roast you write should:
- Be 400-600 words minimum (a REAL performance, not a tweet)
- Flow naturally like spoken comedy — long sentences, natural rhythm
- Build jokes with proper setup → punchline structure  
- Include crowd interaction moments and stage directions
- Reference SPECIFIC data from the user's profile (real repo names, real commit messages, real stats)
- Get progressively more savage as it goes on
- End on a surprisingly warm, encouraging note

Do NOT write short one-liners separated by line breaks. Write PARAGRAPHS of comedy like a real stand-up special transcript.`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const prompt = this.generateRoastPrompt(userData, language);
        
        console.log("\n🤖 ======================================================= 🤖");
        console.log("                   FORMULATED LLM PROMPT                       ");
        console.log("🤖 ======================================================= 🤖\n");
        console.log("SYSTEM:\n" + systemPromptMessage + "\n");
        console.log("USER:\n" + prompt);
        console.log("\n=======================================================\n");

        let roast = "";
        let usedModel = "";

        if (this.provider === "groq") {
            usedModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
            const completion = await this.groqClient.chat.completions.create({
              model: usedModel,
              messages: [
                { role: "system", content: systemPromptMessage },
                { role: "user", content: prompt },
              ],
              max_tokens: 4000,
              temperature: 0.8,
            });
            roast = completion.choices?.[0]?.message?.content;
        } else if (this.provider === "gemini") {
            usedModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
            const response = await this.geminiClient.models.generateContent({
                model: usedModel,
                contents: prompt,
                config: {
                    systemInstruction: systemPromptMessage,
                    temperature: 0.8,
                }
            });
            roast = response.text;
        }

        console.log("\n🎙️ ======================================================= 🎙️");
        console.log("                   GENERATED ROAST SCRIPT                      ");
        console.log(`🎙️  Provider: ${this.provider.toUpperCase()} | Model: ${usedModel}`);
        console.log("🎙️ ======================================================= 🎙️\n");
        console.log(roast);
        console.log("\n=======================================================\n");

        if (!roast || roast.trim().length === 0) {
          throw new Error("No roast generated from LLM.");
        }

        return {
          roast: roast.trim(),
          fallback: false,
          model: usedModel,
          provider: this.provider,
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
