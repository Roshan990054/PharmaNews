import { GoogleGenAI } from "@google/genai";

// ============================================================
// PHARMANEWS AUTO-UPDATER
// Fetches real pharma news daily at 5 AM and summarizes with Gemini
// ============================================================

export interface FetchedArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  author: string;
  date: string;
  imageUrl: string;
  readTime: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  url?: string;
}

// In-memory cache of today's news
let cachedNews: FetchedArticle[] = [];
let lastFetchDate: string = "";

const PHARMA_CATEGORIES = [
  { query: "FDA drug approval pharmaceutical", category: "Drug Approvals" },
  { query: "clinical trial results medicine", category: "Clinical Trials" },
  { query: "biotechnology healthcare research", category: "Biotechnology" },
  { query: "healthcare policy medical regulation", category: "Healthcare Policy" },
  { query: "artificial intelligence healthcare medicine", category: "AI in Healthcare" },
  { query: "pharmaceutical industry news", category: "Industry News" },
];

const UNSPLASH_IMAGES: Record<string, string> = {
  "Drug Approvals": "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
  "Clinical Trials": "https://images.unsplash.com/photo-1530026405186-ed1ea400c3af?q=80&w=800&auto=format&fit=crop",
  "Biotechnology": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
  "Healthcare Policy": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
  "AI in Healthcare": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop",
  "Industry News": "https://images.unsplash.com/photo-1563213126-a4273aed2016?q=80&w=800&auto=format&fit=crop",
};

async function fetchNewsFromAPI(query: string, apiKey: string): Promise<any[]> {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "ok" && data.articles) {
      return data.articles;
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch news for "${query}":`, error);
    return [];
  }
}

async function summarizeWithGemini(
  title: string,
  description: string,
  content: string,
  category: string,
  gemini: GoogleGenAI
): Promise<{ summary: string; fullContent: string; readTime: string }> {
  try {
    const prompt = `You are a professional pharmaceutical journalist. Based on this news article, write a professional summary for a pharma news platform.

Title: ${title}
Description: ${description}
Content: ${content}
Category: ${category}

Respond in JSON format only:
{
  "summary": "2-3 sentence professional summary of the article",
  "fullContent": "3-4 paragraph detailed professional analysis of this pharma news (minimum 200 words)",
  "readTime": "X min read"
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text?.trim() || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      summary: description || "Latest pharmaceutical news update.",
      fullContent: content || description || "Read the full article for more details.",
      readTime: "3 min read"
    };
  }
}

export async function fetchAndUpdateNews(): Promise<FetchedArticle[]> {
  const newsApiKey = process.env.NEWS_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!newsApiKey || newsApiKey === "YOUR_NEWS_API_KEY") {
    console.log("No NEWS_API_KEY found — using local articles");
    return [];
  }

  if (!geminiApiKey || geminiApiKey === "MY_GEMINI_API_KEY") {
    console.log("No GEMINI_API_KEY found");
    return [];
  }

  const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
  const articles: FetchedArticle[] = [];
  let idCounter = 1000;

  console.log("🔄 Fetching fresh pharma news from NewsAPI...");

  for (const { query, category } of PHARMA_CATEGORIES) {
    const rawArticles = await fetchNewsFromAPI(query, newsApiKey);

    for (const raw of rawArticles.slice(0, 2)) {
      if (!raw.title || raw.title === "[Removed]") continue;

      const ai = await summarizeWithGemini(
        raw.title,
        raw.description || "",
        raw.content || raw.description || "",
        category,
        gemini
      );

      articles.push({
        id: `auto_${idCounter++}`,
        title: raw.title,
        summary: ai.summary,
        content: ai.fullContent,
        category,
        source: raw.source?.name || "PharmaNews",
        author: raw.author || "PharmaNews Staff",
        date: raw.publishedAt?.split("T")[0] || new Date().toISOString().split("T")[0],
        imageUrl: raw.urlToImage || UNSPLASH_IMAGES[category],
        readTime: ai.readTime,
        isBreaking: category === "Drug Approvals",
        isFeatured: idCounter === 1001,
        url: raw.url
      });
    }
  }

  console.log(`✅ Fetched and summarized ${articles.length} pharma articles`);
  cachedNews = articles;
  lastFetchDate = new Date().toISOString().split("T")[0];
  return articles;
}

export function getCachedNews(): FetchedArticle[] {
  return cachedNews;
}

export function getLastFetchDate(): string {
  return lastFetchDate;
}

// Schedule daily fetch at 5:00 AM IST (23:30 UTC previous day)
export function scheduleDailyNewsUpdate(): void {
  function msUntilNext5AMIST(): number {
    const now = new Date();
    // IST = UTC + 5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    const next5AM = new Date(istNow);
    next5AM.setHours(5, 0, 0, 0);

    // If already past 5 AM today, schedule for tomorrow
    if (istNow >= next5AM) {
      next5AM.setDate(next5AM.getDate() + 1);
    }

    return next5AM.getTime() - istNow.getTime();
  }

  function scheduleNext() {
    const ms = msUntilNext5AMIST();
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    console.log(`⏰ Next news update scheduled in ${hours}h ${mins}m (5:00 AM IST)`);

    setTimeout(async () => {
      console.log("🌅 5 AM IST — Running daily pharma news update...");
      await fetchAndUpdateNews();
      scheduleNext(); // Schedule next day
    }, ms);
  }

  // Fetch immediately on startup too
  fetchAndUpdateNews().catch(console.error);
  scheduleNext();
}
