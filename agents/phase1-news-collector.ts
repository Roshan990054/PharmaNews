import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 1 — NEWS COLLECTOR AGENT
// Collects pharma news from multiple sources every 5 AM IST
// Stores everything in Supabase automatically
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const PHARMA_QUERIES = [
  { query: "FDA drug approval 2026",           category: "Drug Approvals"    },
  { query: "clinical trial results pharma",    category: "Clinical Trials"   },
  { query: "biotechnology breakthrough",       category: "Biotechnology"     },
  { query: "healthcare policy regulation",     category: "Healthcare Policy" },
  { query: "AI artificial intelligence medicine", category: "AI in Healthcare" },
  { query: "pharmaceutical industry news",     category: "Industry News"     },
  { query: "medical research discovery",       category: "Medical Research"  },
  { query: "drug shortage recall warning",     category: "Drug Safety"       },
  { query: "oncology cancer treatment new",    category: "Oncology"          },
  { query: "vaccine immunization update",      category: "Vaccines"          },
];

const FALLBACK_IMAGES: Record<string, string> = {
  "Drug Approvals":    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
  "Clinical Trials":   "https://images.unsplash.com/photo-1530026405186-ed1ea400c3af?w=800",
  "Biotechnology":     "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
  "Healthcare Policy": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
  "AI in Healthcare":  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
  "Industry News":     "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=800",
  "Medical Research":  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
  "Drug Safety":       "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
  "Oncology":          "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800",
  "Vaccines":          "https://images.unsplash.com/photo-1605289982774-9a6fef564df8?w=800",
};

// ── Fetch from NewsAPI ──────────────────────────────────────
async function fetchFromNewsAPI(query: string): Promise<any[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.status === "ok" ? (data.articles || []) : [];
  } catch { return []; }
}

// ── Enrich article with Gemini AI ──────────────────────────
async function enrichWithGemini(raw: any, category: string): Promise<any> {
  try {
    const prompt = `You are a professional pharmaceutical journalist. Analyze this news and provide enriched content.

Title: ${raw.title}
Description: ${raw.description || ""}
Content: ${raw.content || raw.description || ""}
Category: ${category}

Respond ONLY in this exact JSON format:
{
  "summary": "2-3 sentence professional summary",
  "full_content": "4-5 paragraph detailed professional article (minimum 300 words)",
  "author_role": "suggested author role like 'Regulatory Affairs Advisor'",
  "read_time": "X min read",
  "is_breaking": false,
  "is_featured": false,
  "relevance_score": 85
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text?.replace(/```json|```/g, "").trim() || "{}";
    return JSON.parse(text);
  } catch {
    return {
      summary: raw.description || "Latest pharmaceutical news update.",
      full_content: raw.content || raw.description || "Read the full article for more details.",
      author_role: "PharmaNews Staff",
      read_time: "3 min read",
      is_breaking: false,
      is_featured: false,
      relevance_score: 50
    };
  }
}

// ── Check if article already exists ────────────────────────
async function articleExists(title: string): Promise<boolean> {
  const { data } = await supabase
    .from("articles")
    .select("id")
    .ilike("title", `%${title.substring(0, 50)}%`)
    .limit(1);
  return (data?.length || 0) > 0;
}

// ── Save article to Supabase ────────────────────────────────
async function saveArticle(article: any): Promise<boolean> {
  const { error } = await supabase.from("articles").insert({
    title: article.title,
    content: article.full_content,
    summary: article.summary,
    category: article.category,
    source: article.source,
    author: article.author,
    image_url: article.imageUrl,
    published: true,
    created_at: new Date().toISOString(),
  });
  return !error;
}

// ── Log agent run ───────────────────────────────────────────
async function logAgentRun(status: string, message: string, count: number) {
  await supabase.from("agent_logs").insert({
    agent_name: "Phase1-NewsCollector",
    status,
    message,
    articles_processed: count,
    ran_at: new Date().toISOString()
  });
}

// ── MAIN COLLECTOR FUNCTION ─────────────────────────────────
export async function runNewsCollector(): Promise<number> {
  console.log("🔍 [Phase 1] News Collector Agent starting...");
  let totalSaved = 0;

  for (const { query, category } of PHARMA_QUERIES) {
    console.log(`  📡 Fetching: ${category}...`);
    const rawArticles = await fetchFromNewsAPI(query);

    for (const raw of rawArticles) {
      if (!raw.title || raw.title === "[Removed]") continue;

      // Skip duplicates
      const exists = await articleExists(raw.title);
      if (exists) {
        console.log(`  ⏭️  Skipping duplicate: ${raw.title.substring(0, 50)}...`);
        continue;
      }

      // Enrich with Gemini
      console.log(`  🤖 Enriching: ${raw.title.substring(0, 50)}...`);
      const enriched = await enrichWithGemini(raw, category);

      // Save to Supabase
      const saved = await saveArticle({
        title: raw.title,
        full_content: enriched.full_content,
        summary: enriched.summary,
        category,
        source: raw.source?.name || "PharmaNews",
        author: raw.author || `PharmaNews ${enriched.author_role}`,
        imageUrl: raw.urlToImage || FALLBACK_IMAGES[category],
      });

      if (saved) {
        totalSaved++;
        console.log(`  ✅ Saved: ${raw.title.substring(0, 50)}...`);
      }
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  await logAgentRun("success", `Collected ${totalSaved} new articles`, totalSaved);
  console.log(`✅ [Phase 1] Complete! Saved ${totalSaved} new articles to Supabase`);
  return totalSaved;
}

// ── SCHEDULER — Runs every day at 5 AM IST ─────────────────
export function scheduleNewsCollector(): void {
  function msUntilNext5AM(): number {
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const next5AM = new Date(istNow);
    next5AM.setHours(5, 0, 0, 0);
    if (istNow >= next5AM) next5AM.setDate(next5AM.getDate() + 1);
    return next5AM.getTime() - istNow.getTime();
  }

  function scheduleNext() {
    const ms = msUntilNext5AM();
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    console.log(`⏰ [Phase 1] Next collection in ${hours}h ${mins}m (5:00 AM IST)`);

    setTimeout(async () => {
      await runNewsCollector();
      scheduleNext();
    }, ms);
  }

  // Run immediately on startup + schedule daily
  runNewsCollector().catch(console.error);
  scheduleNext();
}
