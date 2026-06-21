import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 6 — COMPETITOR INTELLIGENCE AGENT
// Analyzes competitor websites and finds content gaps
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const COMPETITORS = [
  { name: "Pharmacy Times",    url: "https://www.pharmacytimes.com" },
  { name: "Drug Topics",       url: "https://www.drugtopics.com" },
  { name: "Fierce Pharma",     url: "https://www.fiercepharma.com" },
  { name: "Pharma Times India",url: "https://www.pharmatimes.com" },
  { name: "Express Pharma",    url: "https://www.expresspharma.in" },
];

async function analyzeCompetitor(competitor: any): Promise<any> {
  const prompt = `You are a competitive intelligence analyst for a pharmaceutical news website.

Analyze this competitor: ${competitor.name} (${competitor.url})

Based on your knowledge of this website, provide:
{
  "top_keywords": "5 main SEO keywords they rank for",
  "content_gaps": "3 topics they cover poorly that we should cover better",
  "top_topics": "5 most popular content topics on their site",
  "posting_frequency": "how often they post new content",
  "strengths": "their main content strengths",
  "weaknesses": "their main content weaknesses",
  "opportunities": "3 specific opportunities for PharmaNews to beat them"
}`;

  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
  } catch { return {}; }
}

async function generateStrategy(allInsights: any[]): Promise<string> {
  const prompt = `Based on these competitor analyses, write a 3-paragraph content strategy for PharmaNews to outrank all competitors on Google:

${JSON.stringify(allInsights, null, 2)}

Focus on: content gaps to fill, keywords to target, posting schedule, unique angles.`;

  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return res.text || "";
  } catch { return ""; }
}

export async function runCompetitorIntelligence(): Promise<number> {
  console.log("🕵️ [Phase 6] Competitor Intelligence Agent starting...");

  const allInsights = [];

  for (const competitor of COMPETITORS) {
    console.log(`  🔍 Analyzing: ${competitor.name}...`);
    const analysis = await analyzeCompetitor(competitor);

    const insights = {
      competitor_name: competitor.name,
      competitor_url: competitor.url,
      top_keywords: analysis.top_keywords || "",
      top_articles: analysis.top_topics || "",
      insights: JSON.stringify({
        content_gaps: analysis.content_gaps,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities,
        posting_frequency: analysis.posting_frequency
      }),
      analyzed_at: new Date().toISOString()
    };

    // Save to Supabase
    await supabase
      .from("competitor_data")
      .upsert(insights, { onConflict: "competitor_name" });

    allInsights.push(insights);
    await new Promise(r => setTimeout(r, 2000));
  }

  // Generate overall strategy
  console.log("  🧠 Generating content strategy...");
  const strategy = await generateStrategy(allInsights);

  // Save strategy as special competitor entry
  await supabase.from("competitor_data").upsert({
    competitor_name: "STRATEGY_REPORT",
    competitor_url: "internal",
    insights: strategy,
    analyzed_at: new Date().toISOString()
  }, { onConflict: "competitor_name" });

  await supabase.from("agent_logs").insert({
    agent_name: "Phase6-CompetitorIntelligence",
    status: "success",
    message: `Analyzed ${COMPETITORS.length} competitors`,
    articles_processed: COMPETITORS.length,
    ran_at: new Date().toISOString()
  });

  console.log(`✅ [Phase 6] Complete! Analyzed ${COMPETITORS.length} competitors`);
  return COMPETITORS.length;
}
