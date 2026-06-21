import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 2 — ARTICLE WRITER AGENT
// Takes collected news and writes full professional articles
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function writeFullArticle(article: any): Promise<string> {
  const prompt = `You are a senior pharmaceutical journalist writing for a professional pharma news platform read by doctors, pharmacists, and healthcare professionals worldwide.

Write a comprehensive, well-structured article based on this news:

Title: ${article.title}
Category: ${article.category}
Source: ${article.source}
Summary: ${article.summary}
Raw Content: ${article.content}

Requirements:
- Minimum 500 words
- Professional medical/pharma tone
- Include: background, key findings, clinical implications, expert perspective, future outlook
- Use proper paragraph structure
- Include relevant statistics if available
- End with clinical takeaway for healthcare professionals

Write ONLY the article content, no JSON, no markdown headers.`;

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return response.text || article.content;
  } catch {
    return article.content;
  }
}

export async function runArticleWriter(): Promise<number> {
  console.log("✍️ [Phase 2] Article Writer Agent starting...");

  // Get articles with short content (less than 300 chars)
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .lt("content", "300")
    .eq("published", true)
    .limit(10);

  if (!articles || articles.length === 0) {
    console.log("  ℹ️  No articles need rewriting");
    return 0;
  }

  let count = 0;
  for (const article of articles) {
    console.log(`  ✍️  Rewriting: ${article.title?.substring(0, 50)}...`);
    const fullContent = await writeFullArticle(article);

    await supabase
      .from("articles")
      .update({ content: fullContent })
      .eq("id", article.id);

    count++;
    await new Promise(r => setTimeout(r, 2000));
  }

  await supabase.from("agent_logs").insert({
    agent_name: "Phase2-ArticleWriter",
    status: "success",
    message: `Rewrote ${count} articles`,
    articles_processed: count,
    ran_at: new Date().toISOString()
  });

  console.log(`✅ [Phase 2] Complete! Rewrote ${count} articles`);
  return count;
}
