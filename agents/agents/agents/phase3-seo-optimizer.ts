import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 3 — SEO OPTIMIZER AGENT
// Optimizes every article for Google ranking automatically
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function generateSEO(article: any): Promise<any> {
  const prompt = `You are an expert SEO specialist for pharmaceutical news websites. Generate SEO data for this article.

Title: ${article.title}
Category: ${article.category}
Content: ${article.content?.substring(0, 500)}

Respond ONLY in this exact JSON:
{
  "seo_title": "SEO optimized title under 60 chars with main keyword",
  "meta_description": "Compelling meta description under 155 chars with keywords",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
  "score": 85,
  "slug": "url-friendly-slug-here"
}`;

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text?.replace(/```json|```/g, "").trim() || "{}";
    return JSON.parse(text);
  } catch {
    return {
      seo_title: article.title?.substring(0, 60),
      meta_description: article.summary?.substring(0, 155),
      keywords: article.category,
      score: 50,
      slug: article.title?.toLowerCase().replace(/\s+/g, "-").substring(0, 50)
    };
  }
}

export async function runSEOOptimizer(): Promise<number> {
  console.log("🔍 [Phase 3] SEO Optimizer Agent starting...");

  // Get articles without SEO data
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .is("seo_title", null)
    .limit(20);

  if (!articles || articles.length === 0) {
    console.log("  ℹ️  All articles already SEO optimized");
    return 0;
  }

  let count = 0;
  for (const article of articles) {
    console.log(`  🔍 SEO optimizing: ${article.title?.substring(0, 50)}...`);
    const seo = await generateSEO(article);

    // Update article with SEO data
    await supabase
      .from("articles")
      .update({
        seo_title: seo.seo_title,
        seo_description: seo.meta_description,
        keywords: seo.keywords,
      })
      .eq("id", article.id);

    // Save to seo_data table
    await supabase.from("seo_data").insert({
      article_id: article.id,
      meta_title: seo.seo_title,
      meta_description: seo.meta_description,
      keywords: seo.keywords,
      score: seo.score,
      analyzed_at: new Date().toISOString()
    });

    count++;
    await new Promise(r => setTimeout(r, 1500));
  }

  await supabase.from("agent_logs").insert({
    agent_name: "Phase3-SEOOptimizer",
    status: "success",
    message: `SEO optimized ${count} articles`,
    articles_processed: count,
    ran_at: new Date().toISOString()
  });

  console.log(`✅ [Phase 3] Complete! SEO optimized ${count} articles`);
  return count;
}
