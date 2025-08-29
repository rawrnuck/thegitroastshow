const OpenAI = require("openai");

class LLMService {
  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn(
        "⚠️  OPENROUTER_API_KEY not found. LLM features will be disabled."
      );
      this.client = null;
    } else {
      this.client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      console.log("🤖 OpenRouter LLM service initialized with DeepSeek R1");
    }
  }

  generateRoastPrompt(userData, language = "en") {
    const { profile, repositories, commits, events, languageStats } = userData;

    // Language-specific instructions with strong emphasis
    const languageInstructions = {
      en: "IMPORTANT: Write the entire roast response in ENGLISH ONLY. Do not use any other language.",
      es: "IMPORTANTE: Escribe toda la respuesta de roast SOLO EN ESPAÑOL. No uses ningún otro idioma. Genera el roast completamente en Español usando humor hispano y referencias culturales apropiadas.",
      fr: "IMPORTANT: Écrivez toute la réponse de roast UNIQUEMENT EN FRANÇAIS. N'utilisez aucune autre langue. Générez le roast entièrement en Français en utilisant l'humour français et des références culturelles appropriées.",
      de: "WICHTIG: Schreibe die gesamte Roast-Antwort NUR AUF DEUTSCH. Verwende keine andere Sprache. Erstelle den Roast vollständig auf Deutsch mit deutschem Humor und passenden kulturellen Referenzen.",
      hi: "महत्वपूर्ण: पूरा रोस्ट केवल हिंदी में लिखें। कोई अन्य भाषा का उपयोग न करें। भारतीय हास्य और उपयुक्त सांस्कृतिक संदर्भों का उपयोग करके पूरी तरह से हिंदी में रोस्ट बनाएं।",
      zh: "重要提示：整个roast回复必须完全用中文书写。不要使用任何其他语言。使用中国式幽默和适当的文化参考完全用中文生成roast。",
      ja: "重要：ローストの回答全体を日本語のみで書いてください。他の言語は使用しないでください。日本のユーモアと適切な文化的参照を使用して完全に日本語でローストを生成してください。",
      ru: "ВАЖНО: Напишите весь ответ роаста ТОЛЬКО НА РУССКОМ ЯЗЫКЕ. Не используйте никакого другого языка. Создайте роаст полностью на русском языке, используя русский юмор и подходящие культурные отсылки.",
    };

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

  return `🚨 LANGUAGE REQUIREMENT: ${languageInstructions[language] || languageInstructions['en']}

You are not just a code roaster—you are the host of a live roast show. 
Your job is to generate a roast script as a sequence of JSON chunks, alternating between "speech" and "sound". 
Keep it witty, playful, eccentric but respectful, like a stand-up comic roasting a fellow dev.

🎙️ RULES:
- Break the roast into MANY short chunks (1–3 lines max per "speech").
- Insert "sound" cues for timing and audience reactions:
  - crowd_applause (at intro and final tribute)
  - crowd_laugh (after punchlines)
  - crowd_big_laugh (after strongest joke)
  - crowd_gasp (mock gasp moment)
  - cricket_silence (awkward pauses or weak joke effect)
  - mic_tap (for transitions or dramatic pause)
- Always return in **JSON array** format: 
  [{ "type": "speech", "text": "..." }, { "type": "sound", "effect": "..." }]
- Check pronouns: if not available, use neutral terms (they, this dev, coder, etc.).
- Roast structure:
  1. **Profile Opener**: Roast username, bio, location, company. Add applause sound cue.
  2. **Repo & Languages**: Roast repo count, stars, empty repos, quirky language mix. Insert cricket_silence or laughs.
  3. **Commit Messages**: Mock generic commits like tragic poetry. Cue laughs.
  4. **Callbacks & Taglines**: Return to earlier jokes, exaggerate.
  5. **Honoring Closer**: Restore their reputation with genuine respect. End with applause.
- Humor should be eccentric but not cruel. Punchline → pause → sound cue.
- Keep energy like a Comedy Central Roast, but for GitHub culture.

Developer Profile:
- Username: ${profile.login}
- Name: ${profile.name || "Anonymous"}
- Bio: ${profile.bio || "No bio (mysterious or just lazy?)"}
- Location: ${profile.location || "Somewhere between Wi-Fi drops"}
- Company: ${profile.company || "Independent (aka unemployed)"}
- Public Repos: ${profile.public_repos}
- Followers: ${profile.followers}
- Following: ${profile.following}
- Joined GitHub: ${new Date(profile.created_at).getFullYear()}

Repository Analysis:
- Total repositories: ${totalRepos}
- Total stars: ${totalStars}
- Empty repositories: ${emptyRepos}
- Top programming languages: ${topLanguages.join(", ") || "None (seriously, not even HTML?)"}
- Repository names: ${repoNames.slice(0, 10).join(", ")}

Recent Commit Messages:
${recentCommits.map((msg) => `- "${msg}"`).join("\n")}

Generate the roast as a JSON array of speech/sound chunks, formatted exactly as described.`;
  }

  async generateRoast(userData, language = "en") {
    if (!this.client) {
      return {
        roast:
          "Sorry, the roasting machine is temporarily offline. But looking at your GitHub, I'm sure there's plenty to roast! 🔥",
        fallback: true,
      };
    }

    try {
      const prompt = this.generateRoastPrompt(userData, language);

      const completion = await this.client.chat.completions.create({
        extra_headers: {
          "HTTP-Referer": "https://roastrepo.com",
          "X-Title": "RoastRepo",
        },
        messages: [
          {
            role: "system",
            content: `You are a witty GitHub profile roaster. Generate humorous, creative roasts about developers based on their GitHub activity. Be funny but not cruel. 

CRITICAL LANGUAGE REQUIREMENT: You MUST respond in the exact language specified by the user. If they request Hindi, respond ONLY in Hindi. If they request Spanish, respond ONLY in Spanish. Never mix languages or default to English unless specifically requested. This is a strict requirement.

Language codes:
- 'en' = English only
- 'es' = Spanish only (Español)
- 'fr' = French only (Français)
- 'de' = German only (Deutsch)
- 'hi' = Hindi only (हिंदी)
- 'zh' = Chinese only (中文)
- 'ja' = Japanese only (日本語)
- 'ru' = Russian only (Русский)

The user has requested language: ${language}. You MUST respond in this language only.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "tngtech/deepseek-r1t2-chimera:free",
        temperature: 0.9,
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
        model: "tngtech/deepseek-r1t2-chimera:free",
        language: language,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("LLM Error:", error.message);

      // Fallback roasts based on data analysis
      return {
        roast: this.generateFallbackRoast(userData, language),
        fallback: true,
        language: language,
        error: error.message,
      };
    }
  }

  generateFallbackRoast(userData, language = "en") {
    const { profile, repositories, commits } = userData;
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);

    // Language-specific fallback roasts
    const fallbackTemplates = {
      en: {
        greeting: `Hey ${profile.login}! `,
        noStars:
          "I see you're collecting repositories like Pokémon cards, but with zero stars. Even your mom hasn't starred your repos yet! ",
        fewStars: `${totalStars} stars total? That's cute. I've seen more stars in a cloudy night sky. `,
        manyRepos:
          "You've got more repos than a Git hoarder's garage sale. Quality over quantity, friend! ",
        genericCommits:
          "Your commit messages are more generic than a grocery store brand cereal. 'fix', 'update', 'change' - Shakespeare would be proud! ",
        ending:
          "But hey, at least you're coding, which is more than most people can say! Keep pushing those commits! 🚀",
      },
      es: {
        greeting: `¡Hola ${profile.login}! `,
        noStars:
          "Veo que coleccionas repositorios como cartas de Pokémon, pero con cero estrellas. ¡Ni tu mamá ha marcado tus repos como favoritos! ",
        fewStars: `¿${totalStars} estrellas en total? Qué tierno. He visto más estrellas en una noche nublada. `,
        manyRepos:
          "Tienes más repos que una venta de garage de un acumulador de Git. ¡Calidad sobre cantidad, amigo! ",
        genericCommits:
          "Tus mensajes de commit son más genéricos que cereal de marca blanca. 'fix', 'update', 'change' - ¡Shakespeare estaría orgulloso! ",
        ending:
          "Pero hey, al menos estás programando, ¡que es más de lo que la mayoría puede decir! ¡Sigue empujando esos commits! 🚀",
      },
      fr: {
        greeting: `Salut ${profile.login} ! `,
        noStars:
          "Je vois que tu collectionnes les dépôts comme des cartes Pokémon, mais avec zéro étoile. Même ta maman n'a pas mis d'étoile à tes repos ! ",
        fewStars: `${totalStars} étoiles au total ? C'est mignon. J'ai vu plus d'étoiles dans un ciel nuageux. `,
        manyRepos:
          "Tu as plus de dépôts qu'un vide-grenier de collectionneur Git. Qualité plutôt que quantité, mon ami ! ",
        genericCommits:
          "Tes messages de commit sont plus génériques qu'une marque de distributeur. 'fix', 'update', 'change' - Shakespeare serait fier ! ",
        ending:
          "Mais bon, au moins tu codes, ce qui est plus que ce que la plupart des gens peuvent dire ! Continue à pousser ces commits ! 🚀",
      },
      de: {
        greeting: `Hey ${profile.login}! `,
        noStars:
          "Ich sehe, du sammelst Repositories wie Pokémon-Karten, aber mit null Sternen. Selbst deine Mama hat deine Repos noch nicht gestarrt! ",
        fewStars: `${totalStars} Sterne insgesamt? Wie süß. Ich habe mehr Sterne in einer bewölkten Nacht gesehen. `,
        manyRepos:
          "Du hast mehr Repos als ein Git-Sammler-Flohmarkt. Qualität vor Quantität, Freund! ",
        genericCommits:
          "Deine Commit-Nachrichten sind generischer als No-Name-Müsli. 'fix', 'update', 'change' - Shakespeare wäre stolz! ",
        ending:
          "Aber hey, wenigstens programmierst du, das ist mehr als die meisten von sich behaupten können! Mach weiter mit den Commits! 🚀",
      },
      hi: {
        greeting: `हैलो ${profile.login}! `,
        noStars:
          "मैं देख रहा हूं कि आप पोकेमॉन कार्ड की तरह रिपॉजिटरी इकट्ठा कर रहे हैं, लेकिन शून्य स्टार्स के साथ। आपकी मां ने भी अभी तक आपके रेपो को स्टार नहीं किया है! ",
        fewStars: `कुल ${totalStars} स्टार्स? कितना प्यारा। मैंने बादल भरी रात में इससे ज्यादा तारे देखे हैं। `,
        manyRepos:
          "आपके पास Git संग्राहक के गैराज सेल से ज्यादा रेपो हैं। गुणवत्ता मात्रा से ऊपर, दोस्त! ",
        genericCommits:
          "आपके कमिट संदेश किराने की दुकान के ब्रांड अनाज से भी ज्यादा सामान्य हैं। 'fix', 'update', 'change' - शेक्सपियर गर्व महसूस करते! ",
        ending:
          "लेकिन अरे हां, कम से कम आप कोडिंग तो कर रहे हैं, जो ज्यादातर लोग नहीं कह सकते! कमिट्स पुश करते रहिए! 🚀",
      },
      zh: {
        greeting: `你好 ${profile.login}! `,
        noStars:
          "我看到你像收集宝可梦卡片一样收集仓库，但是零星星。连你妈妈都还没有给你的仓库点星！ ",
        fewStars: `总共${totalStars}颗星？真可爱。我在阴天的夜晚都见过更多的星星。 `,
        manyRepos: "你的仓库比Git囤积者的车库销售还多。质量胜过数量，朋友！ ",
        genericCommits:
          "你的提交信息比杂货店品牌麦片还要通用。'fix', 'update', 'change' - 莎士比亚会感到骄傲！ ",
        ending:
          "但是嘿，至少你在编程，这比大多数人能说的都多！继续推送那些提交！🚀",
      },
      ja: {
        greeting: `こんにちは ${profile.login}! `,
        noStars:
          "ポケモンカードのようにリポジトリを集めているけど、星はゼロですね。お母さんでさえまだあなたのリポジトリにスターを付けていません！ ",
        fewStars: `合計${totalStars}個の星？かわいいですね。曇った夜空でもっと多くの星を見たことがあります。 `,
        manyRepos:
          "Gitコレクターのガレージセールよりも多くのリポジトリを持っていますね。量より質ですよ、友達！ ",
        genericCommits:
          "あなたのコミットメッセージは安売りブランドのシリアルより汎用的です。'fix', 'update', 'change' - シェイクスピアが誇りに思うでしょう！ ",
        ending:
          "でもまあ、少なくともコーディングをしているのは、ほとんどの人が言えることではありません！そのコミットを押し続けてください！🚀",
      },
      ru: {
        greeting: `Привет ${profile.login}! `,
        noStars:
          "Вижу, что ты коллекционируешь репозитории как карточки покемонов, но с нулевыми звездами. Даже твоя мама еще не поставила звездочку твоим репо! ",
        fewStars: `${totalStars} звезд всего? Мило. Я видел больше звезд в облачную ночь. `,
        manyRepos:
          "У тебя больше репо, чем на гаражной распродаже Git-накопителя. Качество важнее количества, друг! ",
        genericCommits:
          "Твои сообщения коммитов более общие, чем хлопья магазинного бренда. 'fix', 'update', 'change' - Шекспир бы гордился! ",
        ending:
          "Но эй, по крайней мере, ты кодишь, что не каждый может сказать! Продолжай пушить эти коммиты! 🚀",
      },
    };

    const template = fallbackTemplates[language] || fallbackTemplates["en"];

    // Generate a simple roast based on patterns
    let roast = template.greeting;

    if (totalStars === 0) {
      roast += template.noStars;
    } else if (totalStars < 10) {
      roast += template.fewStars;
    }

    if (repositories.length > 50) {
      roast += template.manyRepos;
    }

    const recentCommits = commits.flatMap((repoCommit) =>
      repoCommit.commits.map((c) => c.message)
    );
    const genericCommits = recentCommits.filter((msg) =>
      /^(fix|update|change|add|remove)$/i.test(msg.trim())
    ).length;

    if (genericCommits > 3) {
      roast += template.genericCommits;
    }

    roast += template.ending;

    return roast;
  }

  async generateMultipleRoasts(userData, count = 3, language = "en") {
    const roasts = [];

    for (let i = 0; i < count; i++) {
      try {
        const roast = await this.generateRoast(userData, language);
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
