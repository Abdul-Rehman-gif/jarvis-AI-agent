import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export interface IntentResponse {
  replyText: string;
  intent: string;
  actions: {
    action: string;
    category: 'app_control' | 'window_control' | 'system_power' | 'volume_media' | 'file_system' | 'powershell_cmd' | 'browser_automation' | 'workflow' | 'plugin' | 'info_query' | 'communication';
    params: Record<string, any>;
    requiresConfirmation: boolean;
    description: string;
  }[];
}

// ---------------------------------------------------------------------------
// Known site -> search URL builders, used both by the rule-based fallback
// parser and exported for the client executor to reuse if it wants a single
// source of truth for "search X on Y" style requests. Falls back to a plain
// Google search (optionally scoped with `site:`) for anything not listed.
// ---------------------------------------------------------------------------
const SITE_SEARCH_BUILDERS: Record<string, (q: string) => string> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  amazon: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  github: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`,
  reddit: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
  wikipedia: (q) => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
  twitter: (q) => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
  x: (q) => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
  "stack overflow": (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
  stackoverflow: (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
  npm: (q) => `https://www.npmjs.com/search?q=${encodeURIComponent(q)}`,
  "google maps": (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
  maps: (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
  linkedin: (q) => `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}`,
  spotify: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
};

export function resolveSiteSearchUrl(site: string, query: string): string {
  const key = site.trim().toLowerCase();
  const builder = SITE_SEARCH_BUILDERS[key];
  if (builder) return builder(query);
  // Unknown site: scope a Google search to that domain-ish term instead of failing.
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} site:${key.replace(/\s+/g, "")}.com`)}`;
}

// The special embed form of a YouTube search auto-plays the first result
// instead of just opening a page of thumbnails, so "play X" can actually
// start playback without needing the YouTube Data API or scraping video IDs.
export function resolveYoutubeAutoplayUrl(query: string): string {
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
}

const SYSTEM_INSTRUCTION = `
You are Jarvis, an advanced AI Desktop Copilot & Windows PC Automation Assistant.
Your job is to understand natural language user prompts and generate both a friendly conversational response and a list of structured PC actions to execute.

YOUR BOSS / OWNER: you were built for and serve Abdul Rehman. If asked anything like "who is your boss", "who do you work for", "who made/owns you", "who is Abdul Rehman", or about your boss's speciality, skills, background, education, or projects, answer directly and warmly using ONLY the facts below - do not invent anything not listed here. This is a conversational answer: intent should be "Owner Info Query" and actions should be an empty array [], never a PC action.
- Name: Abdul Rehman, based in Lahore, Punjab, Pakistan.
- Education: BS in Computational Science at University of Central Punjab (Oct 2024 - present, currently 4th semester).
- Speciality: AI automation and Generative AI - designing automated, intelligent workflows. Particularly strong in web scraping & browser automation (Selenium, Playwright, BeautifulSoup, Scrapy, DrissionPage) and workflow automation with n8n.
- Core skills: Python, JavaScript, React.js, Django/FastAPI/Flask, HTML/CSS, SMTP integration, MySQL, Git/GitHub, N8N.
- Experience: National Ambassador at CodeAlpha (Mar-Jun 2026, remote - promoting tech learning and developer community building); C++ Developer at CodeAlpha (Nov 2025-Jan 2026); Software Engineer at CodeAlpha (Mar-Apr 2025 - C++ applications, code reviews, testing/debugging).
- Notable projects: Qwen Image Generator (a VS Code extension for local AI image generation), a Software House Management System (React + Django REST + Supabase), a Hostinger Bulk Mail Sender, a Gmail Clone with email automation, a ChatGPT automation tool built with Playwright, a Bulk Email Campaign web app (FastAPI + Google Sheets), an Airport Luggage Management System in C++ using a Red-Black Tree, an OLX Product Scraper, a WhatsApp Automation Agent built in n8n, and this Jarvis AI Desktop Assistant itself.
- Certifications include Generative AI Application Developer (University of Engineering and Technology, Lahore) and Introduction to Object-Oriented Programming in C++ (University of London/Coursera), among several others.
- Languages: English (professional working proficiency), Urdu (native).

Available PC Action Types:
- open_app: { name: string, path?: string }
- close_app: { name: string, pid?: number }
- system_power: { mode: 'lock' | 'shutdown' | 'restart' | 'clean_temp' } (REQUIRES CONFIRMATION for shutdown/restart)
- volume: { level: number } (0-100) or { mute: boolean }
- file_system: { operation: 'create_folder' | 'open_folder' | 'search' | 'delete' | 'zip', path: string } (delete REQUIRES CONFIRMATION)
- powershell: { script: string } (REQUIRES CONFIRMATION)
- browser_automation: { url?: string, query?: string, site?: string, index?: number, ordinal?: string, titleFragment?: string, action: 'open' | 'search_youtube' | 'search_youtube_list' | 'play_youtube' | 'search_google' | 'search_site' | 'select_result' }
- workflow: { workflowId: string, name: string }
- screenshot: { fullScreen: boolean }
- clipboard: { operation: 'read' | 'write', text?: string }
- get_datetime: {} (category: info_query) - user asked the current date/time. No PC action needed, server answers directly.
- get_weather: { city?: string } (category: info_query) - user asked about weather. City is optional; if omitted the server uses a configured default. No PC action needed, server fetches live data.
- whatsapp_message: { contactName?: string, phone?: string, message: string } (category: communication, ALWAYS requiresConfirmation: true) - user wants to send/text/message someone on WhatsApp. Prefer contactName (a name they said) over phone unless they gave a literal number. This only PRE-FILLS the message in WhatsApp for the user to send themselves - it never sends automatically, so always still set requiresConfirmation true and never claim in replyText that the message was sent, only that it will be opened/pre-filled.

Browser automation actions in detail:
- "open": open a specific URL as-is. params: { url }.
- "search_google": open a Google search results page for a query. params: { query }.
- "search_youtube": open YouTube's search RESULTS PAGE for a query (does NOT start playback - use this when the user wants to browse/see options, e.g. "search youtube for lofi beats", "find some cooking videos on youtube"). params: { query }.
- "play_youtube": ACTUALLY START PLAYBACK of the first matching result immediately, with no intermediate list (use this when the user names something specific and just wants it playing NOW, e.g. "play Shape of You", "play some music"). params: { query }.
- "search_youtube_list": search YouTube and get back a REAL numbered list of actual result titles the user can then pick from (use this when the user wants to browse/choose, e.g. "search trending songs", "search youtube for lofi beats and show me some options", "find some cooking videos on youtube"). params: { query }.
- "select_result": the user is picking one item from the list shown by the most recent search_youtube_list (e.g. "play 1", "play the second one", "play number 3", "the last one", "play the Ed Sheeran one"). Use params.index for a literal number ("play 2" -> index: 2), params.ordinal for a word ("first"/"second"/"third"/"last" etc.) if no literal number was given, or params.titleFragment if they referenced it by name/artist instead of position. Only emit this when the message is clearly picking from a just-shown list, not a fresh search request.
- "search_site": search on a specific named website other than Google/YouTube (Amazon, GitHub, Reddit, Wikipedia, Twitter/X, LinkedIn, Stack Overflow, npm, Spotify, Google Maps, etc). Use this for "search X on Y" / "look up X on Y" / "find X on Y" where Y is a named site. params: { site, query }. If the site isn't one you recognize, still emit search_site with your best guess at the site name - the executor has a Google fallback.

Instructions:
1. Always analyze intent carefully (e.g. "open chrome" -> open_app, "shutdown pc" -> system_power shutdown with confirmation).
2. If the user asks dangerous operations (deleting files, shutdown, powershell script execution, killing processes), set requiresConfirmation to true.
3. For requests to play a specific named song/artist right away ("play Shape of You", "play some music"), use "play_youtube" with query set to what was requested (or "popular music playlist" if unspecified). For requests to browse/choose from options first ("search trending songs", "find some songs and let me pick"), use "search_youtube_list" instead - it does NOT auto-play, it returns a numbered list for the user to choose from. When the user then says something like "play 1" / "play the second one" / "play the Ed Sheeran one" in response to a list you just showed, use "select_result", not a fresh play_youtube/search_youtube_list call.
4. For date/time questions, use get_datetime with no params. For weather questions, use get_weather, including a city in params only if the user actually named one.
5. For WhatsApp requests ("message X on whatsapp", "text X saying...", "send Y to X on whatsapp"), use whatsapp_message with the contact name as contactName and the literal text to send as message. Never invent a phone number. Do not use whatsapp_message for phone calls - there is no call capability; if the user asks to call someone, say in replyText that you can't place calls automatically but can open their WhatsApp chat instead, and still offer a whatsapp_message action if that's useful, or an empty actions array if not.
6. If the request contains multiple sequential steps (separated by words like "then", "after that", "and then", or listed with commas/semicolons - e.g. "open chrome, then search youtube, then play a song"), return MULTIPLE actions in the actions array in the exact order they should run. Each one executes only after the previous one finishes. Collapse steps that are redundant together into one action where possible - e.g. "launch youtube and then search songs and play the songs" should collapse straight into a single "play_youtube" action, since play_youtube already opens the browser, searches, AND starts playback in one step.
7. For general web searches not tied to a specific site ("search for X", "google X", "look up X"), use "search_google". For searches tied to a named site ("search for X on Y"), use "search_site" with that site name.
8. Return JSON matching the schema format:
{
  "replyText": "Jarvis conversational response...",
  "intent": "Brief intent label",
  "actions": [
    {
      "action": "open_app",
      "category": "app_control",
      "params": { "name": "Chrome" },
      "requiresConfirmation": false,
      "description": "Launching Google Chrome browser"
    }
  ]
}
`;

export async function parseUserCommand(userPrompt: string): Promise<IntentResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing. Using local rule-based command parser.");
    return fallbackRuleBasedParser(userPrompt);
  }

  // Attempt using models with fallback for rate limit (429) or quota errors
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];

  for (const model of modelsToTry) {
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text || "";
      try {
        const parsed = JSON.parse(text) as IntentResponse;
        if (parsed.replyText && Array.isArray(parsed.actions)) {
          return parsed;
        }
      } catch {
        return {
          replyText: text || `Jarvis: Executing command "${userPrompt}".`,
          intent: "General Assistant Request",
          actions: [],
        };
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isQuotaError = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");

      if (isQuotaError) {
        console.warn(`Gemini model ${model} rate limited or quota exhausted (429). Trying fallback mechanism...`);
        // Continue loop to try next model or drop down to rule-based fallback
        continue;
      }

      console.error(`Gemini API Error with model ${model}:`, errMsg);
    }
  }

  // If all models hit quota or fail, fallback smoothly to rule-based parser
  console.info("Using intelligent rule-based parser fallback for prompt:", userPrompt);
  return fallbackRuleBasedParser(userPrompt);
}

// Splits requests like "open chrome, then search youtube, then play X" into
// ordered sub-commands and parses each one separately, so the offline
// fallback parser can chain multiple actions even without Gemini. Real
// Gemini parsing (above) handles this more flexibly via the system prompt
// instruction instead of regex splitting.
const SEQUENCE_SEPARATORS = /\s*(?:,?\s*and then\s*,?|,?\s*then\s*,?|,?\s*after that\s*,?|;)\s*/i;

function fallbackRuleBasedParser(prompt: string): IntentResponse {
  const segments = prompt.split(SEQUENCE_SEPARATORS).map(s => s.trim()).filter(Boolean);

  if (segments.length > 1) {
    const combined: IntentResponse = { replyText: "", intent: "Multi-Step Command", actions: [] };
    const replyParts: string[] = [];
    for (const segment of segments) {
      const sub = parseSingleCommand(segment);
      replyParts.push(sub.replyText);
      combined.actions.push(...sub.actions);
    }
    combined.replyText = replyParts.join(" Then, ");
    return combined;
  }

  return parseSingleCommand(prompt);
}

// Recognized non-YouTube, non-Google site names for "search X on <site>"
// style requests. Order matters only in that longer/more-specific phrases
// (e.g. "stack overflow") are checked before shorter ones.
const KNOWN_SEARCH_SITES = [
  "stack overflow", "stackoverflow", "google maps", "amazon", "github",
  "reddit", "wikipedia", "twitter", "linkedin", "npm", "spotify", "maps", "x",
];

function parseSingleCommand(prompt: string): IntentResponse {
  const lower = prompt.toLowerCase().trim();

  // Owner info - works even without a Gemini API key. Checked early since
  // "who is your boss" etc. shouldn't fall through to app-control/search
  // keyword matching below (e.g. it doesn't mention any app or site name).
  const asksAboutBoss = /\b(your\s+boss|your\s+owner|who\s+(made|owns|created|built)\s+you|who\s+do\s+you\s+work\s+for|who\s+is\s+abdul\s+rehman)\b/i.test(lower);
  const asksBossDetail = /\b(boss|owner)\b.*\b(speciality|specialty|skill|skills|expert|background|good\s+at|do|study|studies|education|project|projects)\b/i.test(lower);
  if (asksAboutBoss || asksBossDetail) {
    return {
      replyText: "My boss is Abdul Rehman, a Computer Science student at the University of Central Punjab in Lahore, Pakistan. He specializes in AI automation and Generative AI - especially web scraping, browser automation, and workflow automation with tools like Python, Selenium, Playwright, and n8n. He's built projects including an AI image generator VS Code extension, a WhatsApp automation agent, and me - Jarvis.",
      intent: "Owner Info Query",
      actions: []
    };
  }

  // Date / time - answered directly, no PC action needed.
  if (!lower.includes("weather") && !lower.includes("temperature") && !lower.includes("forecast") &&
      (lower.includes("what") || lower.includes("tell")) && (lower.includes("time") || lower.includes("date") || lower.includes("today"))) {
    return {
      replyText: `It's currently ${new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`,
      intent: "Date/Time Query",
      actions: []
    };
  }

  // Weather - answered directly via a live lookup, no PC action needed.
  if (lower.includes("weather") || lower.includes("temperature") || lower.includes("forecast")) {
    const cityMatch = prompt.match(/(?:in|for)\s+([a-zA-Z\s]+)$/i);
    return {
      replyText: "__WEATHER_LOOKUP__",
      intent: "Weather Query",
      actions: [{
        action: "get_weather",
        category: "info_query",
        params: { city: cityMatch ? cityMatch[1].trim() : undefined },
        requiresConfirmation: false,
        description: "Checking current weather"
      }]
    };
  }

  // Picking an item from a list the executor just showed (e.g. after
  // "search trending songs" returned "1. ... 2. ... 3. ..."). This must be
  // checked BEFORE the generic "play X" branch below, since "play 1" and
  // "play the second one" would otherwise be treated as a literal song
  // query. The executor resolves index/ordinal/titleFragment against
  // whatever it actually has stored from the last search_youtube_list call.
  const ORDINAL_WORDS: Record<string, number> = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
    seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  };
  const indexMatch = lower.match(/^(?:play|select|choose|pick)\s+(?:number\s+)?#?(\d+)\b/);
  const ordinalMatch = lower.match(/^(?:play|select|choose|pick)\s+(?:the\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last)\b(?!\s+\S+\s+one)/);
  const titleFragmentMatch = lower.match(/^(?:play|select|choose|pick)\s+the\s+(.+?)\s+one\b/);
  if (indexMatch || ordinalMatch || titleFragmentMatch) {
    if (indexMatch) {
      const index = parseInt(indexMatch[1], 10);
      return {
        replyText: `Playing option ${index} from the last search.`,
        intent: "Select Search Result",
        actions: [{
          action: "browser_automation",
          category: "browser_automation",
          params: { action: "select_result", index },
          requiresConfirmation: false,
          description: `Play result #${index} from the last search results`
        }]
      };
    }
    if (ordinalMatch) {
      const word = ordinalMatch[1];
      const index = word === "last" ? -1 : ORDINAL_WORDS[word];
      return {
        replyText: `Playing the ${word} option from the last search.`,
        intent: "Select Search Result",
        actions: [{
          action: "browser_automation",
          category: "browser_automation",
          params: { action: "select_result", index, ordinal: word },
          requiresConfirmation: false,
          description: `Play the ${word} result from the last search results`
        }]
      };
    }
    const fragment = titleFragmentMatch![1].trim();
    return {
      replyText: `Playing the one matching "${fragment}" from the last search.`,
      intent: "Select Search Result",
      actions: [{
        action: "browser_automation",
        category: "browser_automation",
        params: { action: "select_result", titleFragment: fragment },
        requiresConfirmation: false,
        description: `Play the result matching "${fragment}" from the last search results`
      }]
    };
  }

  // Browse-and-choose: get a REAL numbered list of results back, no autoplay.
  // e.g. "search trending songs", "search youtube for lofi beats and show options".
  if ((lower.includes("trending song") || lower.includes("trending music") ||
       /\bsearch\b.*\b(songs?|music|videos?)\b/.test(lower) && (lower.includes("option") || lower.includes("show") || lower.includes("list") || lower.includes("choose") || lower.includes("pick")))) {
    const query = lower.includes("trending song") || lower.includes("trending music")
      ? "trending songs"
      : prompt.replace(/^(?:search|find)\s+/i, "").replace(/\band\s+(?:show|let me choose|let me pick).*/i, "").trim();
    return {
      replyText: `Searching YouTube for "${query}" - I'll list the top results.`,
      intent: "Search Youtube List",
      actions: [{
        action: "browser_automation",
        category: "browser_automation",
        params: { action: "search_youtube_list", query },
        requiresConfirmation: false,
        description: `Search YouTube and list results for: ${query}`
      }]
    };
  }

  // Play music -> ACTUALLY starts playback (autoplay embed), not just a search page.
  // Handles "play X", "play some music", and combined phrasing like
  // "launch youtube and search songs and play the songs" once the sequence
  // splitter above has already peeled off any earlier steps in that sentence.
  if (lower.startsWith("play ") || lower.includes("play music") || lower.includes("play song") || lower.includes("play some music") || lower.includes("play the song")) {
    const query = prompt
      .replace(/^play\s+/i, "")
      .replace(/\bthe\s+songs?\b/gi, "")
      .replace(/\bsong\b|\bmusic\b/gi, "")
      .trim() || "popular music playlist";
    return {
      replyText: `Playing "${query}" on YouTube.`,
      intent: "Play Music",
      actions: [{
        action: "browser_automation",
        category: "browser_automation",
        params: { action: "play_youtube", query },
        requiresConfirmation: false,
        description: `Auto-play YouTube result for: ${query}`
      }]
    };
  }

  // YouTube browsing/search that isn't phrased as "play X" - e.g. "search
  // youtube", "search youtube for cat videos", "open youtube and search X".
  // This opens the RESULTS PAGE only; it does not start playback.
  if (lower.includes("youtube")) {
    const searchMatch = prompt.match(/(?:search|find|look up)\s+(?:for\s+)?(.+?)(?:\s+(?:on|in)\s+youtube)?$/i);
    let query = searchMatch ? searchMatch[1].trim() : "";
    // Strip leftover filler words if the whole phrase was just "search youtube"
    query = query.replace(/\byoutube\b/gi, "").trim();
    if (!query) {
      // Bare "open youtube" with nothing to search for - just open the site.
      return {
        replyText: "Opening YouTube.",
        intent: "Open YouTube",
        actions: [{
          action: "browser_automation",
          category: "browser_automation",
          params: { action: "open", url: "https://www.youtube.com" },
          requiresConfirmation: false,
          description: "Open YouTube"
        }]
      };
    }
    return {
      replyText: `Searching YouTube for "${query}".`,
      intent: "YouTube Search",
      actions: [{
        action: "browser_automation",
        category: "browser_automation",
        params: { action: "search_youtube", query },
        requiresConfirmation: false,
        description: `Search YouTube for: ${query}`
      }]
    };
  }

  // Generic "search X on <site>" for any recognized non-YouTube/Google site,
  // e.g. "search wireless mouse on amazon", "look up react hooks on github".
  const siteSearchMatch = prompt.match(/(?:search|find|look up|look for)\s+(?:for\s+)?(.+?)\s+(?:on|in)\s+(.+)$/i);
  if (siteSearchMatch) {
    const candidateSite = siteSearchMatch[2].trim().toLowerCase();
    const matchedSite = KNOWN_SEARCH_SITES.find(s => candidateSite === s || candidateSite.startsWith(s));
    if (matchedSite) {
      const query = siteSearchMatch[1].trim();
      return {
        replyText: `Searching for "${query}" on ${matchedSite}.`,
        intent: "Site Search",
        actions: [{
          action: "browser_automation",
          category: "browser_automation",
          params: { action: "search_site", site: matchedSite, query },
          requiresConfirmation: false,
          description: `Search ${matchedSite} for: ${query}`
        }]
      };
    }
  }

  // Plain "search/google for X" with no site named -> Google.
  const googleMatch = prompt.match(/^(?:search|google|look up|look for)\s+(?:for\s+)?(.+)$/i);
  if (googleMatch && !lower.includes("whatsapp")) {
    const query = googleMatch[1].trim();
    return {
      replyText: `Searching Google for "${query}".`,
      intent: "Web Search",
      actions: [{
        action: "browser_automation",
        category: "browser_automation",
        params: { action: "search_google", query },
        requiresConfirmation: false,
        description: `Search Google for: ${query}`
      }]
    };
  }

  // WhatsApp - always requires confirmation, and only ever pre-fills the
  // message via the official wa.me click-to-chat link. Never auto-sends.
  const whatsappMatch = lower.match(/(?:message|text|send)\s+(.+?)\s+(?:on whatsapp|via whatsapp|whatsapp)\b.*?(?:saying|that says|:)\s*(.+)/i)
    || prompt.match(/(?:message|text|send)\s+(.+?)\s+(?:on|via)\s+whatsapp\s+(.+)/i);
  if (lower.includes("whatsapp")) {
    if (whatsappMatch) {
      return {
        replyText: `Opening WhatsApp with your message to ${whatsappMatch[1].trim()} pre-filled - you'll need to press Send yourself.`,
        intent: "WhatsApp Message",
        actions: [{
          action: "whatsapp_message",
          category: "communication",
          params: { contactName: whatsappMatch[1].trim(), message: whatsappMatch[2].trim() },
          requiresConfirmation: true,
          description: `Open WhatsApp chat with ${whatsappMatch[1].trim()} and pre-fill a message`
        }]
      };
    }
    return {
      replyText: "I can open a WhatsApp chat with your message pre-filled, but I need both who to message and what to say - try something like \"message Ali on whatsapp saying I'm running late\".",
      intent: "WhatsApp Message (Unclear)",
      actions: []
    };
  }

  // App Control - Chrome
  if (lower.includes("chrome") || lower.includes("google chrome") || lower.includes("browser")) {
    return {
      replyText: "Launching Google Chrome browser.",
      intent: "Launch Application",
      actions: [{ action: "open_app", category: "app_control", params: { name: "Google Chrome" }, requiresConfirmation: false, description: "Opening Google Chrome" }]
    };
  }

  // App Control - VS Code / IDE
  if (lower.includes("vs code") || lower.includes("vscode") || lower.includes("code editor") || lower.includes("ide")) {
    return {
      replyText: "Opening Visual Studio Code editor.",
      intent: "Launch IDE",
      actions: [{ action: "open_app", category: "app_control", params: { name: "VS Code" }, requiresConfirmation: false, description: "Opening VS Code" }]
    };
  }

  // App Control - Notepad / Calc / Explorer
  if (lower.includes("notepad") || lower.includes("text editor")) {
    return {
      replyText: "Launching Windows Notepad.",
      intent: "Launch Application",
      actions: [{ action: "open_app", category: "app_control", params: { name: "Notepad" }, requiresConfirmation: false, description: "Opening Notepad" }]
    };
  }
  if (lower.includes("calc") || lower.includes("calculator")) {
    return {
      replyText: "Opening Windows Calculator.",
      intent: "Launch Application",
      actions: [{ action: "open_app", category: "app_control", params: { name: "Calculator" }, requiresConfirmation: false, description: "Opening Calculator" }]
    };
  }
  if (lower.includes("explorer") || lower.includes("downloads") || lower.includes("my computer") || lower.includes("files")) {
    return {
      replyText: "Opening Windows File Explorer.",
      intent: "Open File Explorer",
      actions: [{ action: "file_system", category: "file_system", params: { operation: "open_folder", path: "C:\\Users\\Admin\\Downloads" }, requiresConfirmation: false, description: "Opening File Explorer" }]
    };
  }

  // System Power & Maintenance
  if (lower.includes("shutdown") || lower.includes("turn off pc") || lower.includes("power off")) {
    return {
      replyText: "I've queued a system shutdown request for security. Please confirm to proceed.",
      intent: "System Power Shutdown",
      actions: [{ action: "system_power", category: "system_power", params: { mode: "shutdown" }, requiresConfirmation: true, description: "Shutdown Windows PC" }]
    };
  }
  if (lower.includes("restart") || lower.includes("reboot")) {
    return {
      replyText: "Reboot request queued. Please confirm workstation restart.",
      intent: "System Power Restart",
      actions: [{ action: "system_power", category: "system_power", params: { mode: "restart" }, requiresConfirmation: true, description: "Restart Windows PC" }]
    };
  }
  if (lower.includes("lock") || lower.includes("lock pc") || lower.includes("lock workstation")) {
    return {
      replyText: "Locking Windows PC workstation now.",
      intent: "Lock PC Workstation",
      actions: [{ action: "system_power", category: "system_power", params: { mode: "lock" }, requiresConfirmation: false, description: "Lock Windows Workstation" }]
    };
  }
  if (lower.includes("clean") || lower.includes("temp") || lower.includes("cache") || lower.includes("junk")) {
    return {
      replyText: "Cleaning Windows temporary files and cache directory.",
      intent: "System Cleanup",
      actions: [{ action: "system_power", category: "system_power", params: { mode: "clean_temp" }, requiresConfirmation: false, description: "Clean Windows Temp Files" }]
    };
  }

  // Media & Volume
  if (lower.includes("volume") || lower.includes("mute") || lower.includes("sound") || lower.includes("audio")) {
    const volMatch = lower.match(/\d+/);
    const level = volMatch ? parseInt(volMatch[0], 10) : 50;
    return {
      replyText: `Adjusting system volume level to ${level}%.`,
      intent: "Volume Adjustment",
      actions: [{ action: "volume", category: "volume_media", params: { level }, requiresConfirmation: false, description: `Set Volume to ${level}%` }]
    };
  }

  // Screenshot
  if (lower.includes("screenshot") || lower.includes("snip") || lower.includes("capture screen")) {
    return {
      replyText: "Capturing primary display screenshot...",
      intent: "Screenshot Capture",
      actions: [{ action: "screenshot", category: "window_control", params: { fullScreen: true }, requiresConfirmation: false, description: "Take Desktop Screenshot" }]
    };
  }

  // Work Mode / Workflows
  if (lower.includes("work mode") || lower.includes("focus mode") || lower.includes("dev mode")) {
    return {
      replyText: "Activating Work Mode workflow: Launching Chrome, VS Code, and Terminal.",
      intent: "Execute Workflow",
      actions: [{ action: "workflow", category: "workflow", params: { workflowId: "work_mode", name: "Work Mode" }, requiresConfirmation: false, description: "Launch Work Mode Workflow" }]
    };
  }

  // System stats / metrics queries - the dashboard already streams this
  // live via telemetry polling, so answer directly instead of sending a
  // PC action (there's no agent action type for "read metrics" - trying to
  // dispatch one just produced an "Unknown action type" error before).
  if (lower.includes("cpu") || lower.includes("ram") || lower.includes("memory usage") || (lower.includes("usage") && (lower.includes("system") || lower.includes("resource")))) {
    return {
      replyText: "You can see live CPU, RAM, and network usage in the top status bar and on the System Monitor page - it updates every couple of seconds directly from your PC.",
      intent: "System Stats Query",
      actions: []
    };
  }

  // Default fallback response
  return {
    replyText: `Jarvis: I've received your request "${prompt}", but I don't have a specific automation for that yet. Try one of the suggested prompts, or phrase it as opening an app, adjusting volume, taking a screenshot, or a similar supported action.`,
    intent: "Unrecognized Command",
    actions: []
  };
}