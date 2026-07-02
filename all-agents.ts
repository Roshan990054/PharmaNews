import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// ALL PHARMANEWS AI AGENTS — SINGLE FILE
// CEO Agent + 6 Phase Agents + Orchestrator
// ============================================================

const getSupabase = () => createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
);

const getGemini = () => new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";

function msUntilTime(hour: number, minute = 0): number {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const target = new Date(ist);
  target.setHours(hour, minute, 0, 0);
  if (ist >= target) target.setDate(target.getDate() + 1);
  return target.getTime() - ist.getTime();
}

async function logAgent(name: string, status: string, message: string, count = 0) {
  try {
    await getSupabase().from("agent_logs").insert({
      agent_name: name, status, message,
      articles_processed: count,
      ran_at: new Date().toISOString()
    });
  } catch (e) { console.error("Log error:", e); }
}

// ── #24 RETRY LOGIC — Wraps any agent function with auto-retry ──
async function withRetry<T>(
  agentName: string,
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 5000
): Promise<T | null> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        console.log(`  ✅ [${agentName}] Succeeded on retry attempt ${attempt}/${maxRetries}`);
        await logAgent(agentName, "success", `Recovered after ${attempt} attempts`, 0);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const errMsg = error?.message || String(error);
      console.error(`  ⚠️  [${agentName}] Attempt ${attempt}/${maxRetries} failed: ${errMsg}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 5s, 10s, 20s...
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`  ⏳ [${agentName}] Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  // All retries exhausted — log failure
  console.error(`  ❌ [${agentName}] Failed after ${maxRetries} attempts: ${lastError?.message || lastError}`);
  await logAgent(agentName, "error", `Failed after ${maxRetries} retries: ${String(lastError).substring(0,200)}`, 0);
  return null;
}

// ── #24 SAFE FETCH — fetch wrapper with retry + timeout ──
async function safeFetch(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 15000): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok || res.status < 500) return res; // Don't retry client errors
      throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      if (i === retries) {
        console.error(`  safeFetch failed after ${retries+1} tries:`, e?.message || e);
        return null;
      }
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

// ── PHASE 1: NEWS COLLECTOR ────────────────────────────────
async function runPhase1(): Promise<number> {
  console.log("📰 [Phase 1] News Collector starting...");
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) { console.log("  ⚠️  No NEWS_API_KEY"); return 0; }

  const queries = [
    { q: "FDA drug approval 2026",        cat: "Drug Approvals"    },
    { q: "clinical trial results pharma", cat: "Clinical Trials"   },
    { q: "biotechnology breakthrough",    cat: "Biotechnology"     },
    { q: "AI artificial intelligence medicine", cat: "AI in Healthcare" },
    { q: "pharmaceutical industry news",  cat: "Industry News"     },
  ];

  const images: Record<string, string> = {
    "Drug Approvals":   "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800",
    "Clinical Trials":  "https://images.unsplash.com/photo-1530026405186-ed1ea400c3af?w=800",
    "Biotechnology":    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "AI in Healthcare": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    "Industry News":    "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=800",
  };

  let saved = 0;
  for (const { q, cat } of queries) {
    try {
      const res = await safeFetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`);
      if (!res) { console.log(`  ⚠️  Skipping ${cat} — NewsAPI unreachable`); continue; }
      const data = await res.json();
      for (const raw of data.articles || []) {
        if (!raw.title || raw.title === "[Removed]") continue;
        const { data: existing } = await getSupabase().from("articles").select("id").ilike("title", `%${raw.title.substring(0, 40)}%`).limit(1);
        if (existing?.length) continue;
        const { error } = await getSupabase().from("articles").insert({
          title: raw.title, content: raw.content || raw.description || "",
          summary: raw.description || "", category: cat,
          source: raw.source?.name || "PharmaNews",
          author: raw.author || "PharmaNews Staff",
          image_url: raw.urlToImage || images[cat],
          published: true, created_at: new Date().toISOString()
        });
        if (!error) saved++;
      }
    } catch (e) { console.error(`  Error fetching ${cat}:`, e); }
    await new Promise(r => setTimeout(r, 1000));
  }
  await logAgent("Phase1-NewsCollector", "success", `Saved ${saved} articles`, saved);
  console.log(`✅ [Phase 1] Done — ${saved} articles saved`);
  return saved;
}

// ── PHASE 2: ARTICLE WRITER ────────────────────────────────
async function runPhase2(): Promise<number> {
  console.log("✍️ [Phase 2] Article Writer starting...");
  const { data: articles } = await getSupabase().from("articles").select("*").eq("published", true).order("created_at", { ascending: false }).limit(5);
  if (!articles?.length) { console.log("  ℹ️  No articles to enhance"); return 0; }

  let count = 0;
  for (const article of articles) {
    if (article.content && article.content.length > 300) continue;
    try {
      const prompt = `You are a senior pharmaceutical journalist. Write a comprehensive 400-word professional article based on:
Title: ${article.title}
Category: ${article.category}
Summary: ${article.summary}
Write ONLY the article content, professional tone, 4 paragraphs.`;
      const res = await getGemini().models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
      await getSupabase().from("articles").update({ content: res.text || article.content }).eq("id", article.id);
      count++;
    } catch (e) { console.error("  Writer error:", e); }
    await new Promise(r => setTimeout(r, 2000));
  }
  await logAgent("Phase2-ArticleWriter", "success", `Enhanced ${count} articles`, count);
  console.log(`✅ [Phase 2] Done — ${count} articles enhanced`);
  return count;
}

// ── PHASE 3: SEO OPTIMIZER + INTERNAL LINKER ───────────────
async function runPhase3(): Promise<number> {
  console.log("🔍 [Phase 3] SEO Optimizer + Internal Linker starting...");
  const { data: articles } = await getSupabase().from("articles").select("*").is("seo_title", null).limit(10);
  if (!articles?.length) { console.log("  ℹ️  All articles SEO optimized"); return 0; }

  // Get all published articles for internal linking
  const { data: allArticles } = await getSupabase().from("articles")
    .select("id, title, category, keywords").eq("published", true).limit(100);

  let count = 0;
  for (const article of articles) {
    try {
      const prompt = `Generate SEO data for this pharma article. Respond ONLY in JSON:
{"seo_title":"under 60 chars","meta_description":"under 155 chars","keywords":"kw1,kw2,kw3","score":85}
Article: ${article.title} — ${article.category}`;
      const res = await getGemini().models.generateContent({
        model: "gemini-2.0-flash", contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const seo = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");

      // #18 — Internal linking: find related articles and add links to content
      const related = (allArticles || [])
        .filter(a => a.id !== article.id && a.category === article.category)
        .slice(0, 3);

      let enrichedContent = article.content || "";
      if (related.length > 0 && enrichedContent.length > 200) {
        const relatedLinks = related.map(r =>
          `• <a href="/#article/${r.id}">${r.title}</a>`
        ).join("\n");
        enrichedContent += `\n\n**Related Articles:**\n${relatedLinks}`;
      }

      await getSupabase().from("articles").update({
        seo_title: seo.seo_title,
        seo_description: seo.meta_description,
        keywords: seo.keywords,
        content: enrichedContent
      }).eq("id", article.id);

      await getSupabase().from("seo_data").insert({
        article_id: article.id, meta_title: seo.seo_title,
        meta_description: seo.meta_description, keywords: seo.keywords,
        score: seo.score || 70, analyzed_at: new Date().toISOString()
      });
      count++;
    } catch (e) { console.error("  SEO error:", e); }
    await new Promise(r => setTimeout(r, 1500));
  }
  await logAgent("Phase3-SEOOptimizer", "success", `SEO optimized + linked ${count} articles`, count);
  console.log(`✅ [Phase 3] Done — ${count} articles SEO optimized with internal links`);
  return count;
}

// ── PHASE 7: FACT CHECK AGENT ──────────────────────────────
async function runPhase7(): Promise<number> {
  console.log("✅ [Phase 7] Fact Check Agent starting...");
  const { data: articles } = await getSupabase().from("articles")
    .select("*").eq("published", true)
    .gte("created_at", new Date(Date.now() - 24*3600*1000).toISOString())
    .limit(10);

  if (!articles?.length) { console.log("  ℹ️  No new articles to fact-check"); return 0; }

  let flagged = 0;
  for (const article of articles) {
    try {
      const prompt = `You are a pharmaceutical fact-checker. Review this article for accuracy.

Title: ${article.title}
Content: ${article.content?.substring(0, 400)}
Category: ${article.category}

Check for:
1. Unverified drug claims
2. Incorrect dosage information
3. Misleading statistics
4. Hallucinated clinical data
5. Dangerous medical advice

Respond ONLY in JSON:
{
  "is_accurate": true/false,
  "confidence": 85,
  "flags": ["issue1", "issue2"],
  "verdict": "PASS/WARN/FAIL",
  "recommendation": "brief action"
}`;

      const res = await getGemini().models.generateContent({
        model: "gemini-2.0-flash", contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");

      if (result.verdict === "FAIL") {
        // Unpublish dangerous content
        await getSupabase().from("articles").update({ published: false }).eq("id", article.id);
        flagged++;
        console.log(`  ❌ UNPUBLISHED (FAIL): ${article.title?.substring(0, 50)}`);
      } else if (result.verdict === "WARN") {
        flagged++;
        console.log(`  ⚠️  WARNING: ${article.title?.substring(0, 50)} — ${result.flags?.join(", ")}`);
      } else {
        console.log(`  ✅ PASS: ${article.title?.substring(0, 50)}`);
      }
    } catch (e) { console.error("  Fact-check error:", e); }
    await new Promise(r => setTimeout(r, 1000));
  }

  await logAgent("Phase7-FactCheck", "success",
    `Fact-checked ${articles.length} articles, ${flagged} flagged`, articles.length);
  console.log(`✅ [Phase 7] Done — ${articles.length} checked, ${flagged} flagged`);
  return flagged;
}

// ── PHASE 8: TRENDING TOPICS AGENT ────────────────────────
async function runPhase8(): Promise<number> {
  console.log("📈 [Phase 8] Trending Topics Agent starting...");
  try {
    // Use Gemini to identify trending pharma topics
    const prompt = `You are a pharmaceutical trend analyst. Today is ${new Date().toLocaleDateString("en-IN")}.

Identify the top 10 trending pharmaceutical topics RIGHT NOW that people are searching for.
Focus on: breaking FDA news, viral drug stories, major clinical trial results, biotech IPOs.

Respond ONLY in JSON:
{
  "trending": [
    {"topic": "topic name", "search_query": "newsapi search query", "category": "Drug Approvals", "priority": 9},
    {"topic": "topic name", "search_query": "newsapi search query", "category": "Clinical Trials", "priority": 8}
  ]
}`;

    const res = await getGemini().models.generateContent({
      model: "gemini-2.0-flash", contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
    const trending = data.trending || [];

    if (!trending.length) return 0;

    console.log(`  📊 Found ${trending.length} trending topics`);

    // Fetch news for top 5 trending topics
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) { console.log("  ⚠️  No NEWS_API_KEY"); return 0; }

    let saved = 0;
    for (const trend of trending.slice(0, 5)) {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(trend.search_query)}&language=en&sortBy=publishedAt&pageSize=2&apiKey=${apiKey}`;
        const newsRes = await fetch(url);
        const newsData = await newsRes.json();

        for (const raw of newsData.articles || []) {
          if (!raw.title || raw.title === "[Removed]") continue;
          const { data: existing } = await getSupabase().from("articles")
            .select("id").ilike("title", `%${raw.title.substring(0, 40)}%`).limit(1);
          if (existing?.length) continue;

          await getSupabase().from("articles").insert({
            title: raw.title,
            content: raw.content || raw.description || "",
            summary: raw.description || "",
            category: trend.category,
            source: raw.source?.name || "PharmaNews",
            author: raw.author || "PharmaNews Staff",
            image_url: raw.urlToImage || `https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800`,
            published: true,
            created_at: new Date().toISOString()
          });
          saved++;
        }
      } catch (e) { console.error(`  Error fetching trend ${trend.topic}:`, e); }
      await new Promise(r => setTimeout(r, 1000));
    }

    await logAgent("Phase8-TrendingTopics", "success",
      `Found ${trending.length} trends, saved ${saved} articles`, saved);
    console.log(`✅ [Phase 8] Done — ${saved} trending articles saved`);
    return saved;
  } catch (e) {
    console.error("  Trending error:", e);
    return 0;
  }
}



// ── PHASE 4: SOCIAL PUBLISHER ──────────────────────────────
// ── Buffer API Helper ──────────────────────────────────────
async function postToMakeWebhook(caption: string, title: string, category: string, imageUrl: string): Promise<boolean> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) { console.log('  ⚠️  No MAKE_WEBHOOK_URL set'); return false; }
  try {
    const res = await safeFetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: caption, title, category, imageUrl, siteUrl: SITE_URL })
    });
    if (res) { console.log('  ✅ Make.com webhook triggered!'); return true; }
    return false;
  } catch (e) { console.error('  Make.com error:', e); return false; }
}

async function runPhase4(): Promise<number> {
  console.log('📱 [Phase 4] Social Publisher (Make.com) starting...');
  if (!process.env.MAKE_WEBHOOK_URL) { console.log('  ⚠️  No MAKE_WEBHOOK_URL in Render environment'); return 0; }

  const { data: articles } = await getSupabase().from('articles')
    .select('*').eq('published', true)
    .order('created_at', { ascending: false }).limit(10);

  if (!articles?.length) { console.log('  ℹ️  No articles in Supabase yet'); return 0; }

  let posted = 0;
  for (const article of articles) {
    if (posted >= 3) break;
    const { data: existing } = await getSupabase().from('social_posts')
      .select('id').eq('article_id', article.id).eq('platform', 'make').limit(1);
    if (existing?.length) { console.log(`  ⏭️  Already posted: ${article.title?.substring(0, 40)}`); continue; }

    try {
      const prompt = `Write an engaging social media post for pharma news. Max 250 chars. Include 3 hashtags. End with: ${SITE_URL}

Title: ${article.title}
Category: ${article.category}
Write ONLY the post text.`;
      const res = await getGemini().models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
      const caption = res.text?.trim() || `🔬 ${article.title}

${SITE_URL}

#PharmaNews #Healthcare #FDA`;

      const success = await postToMakeWebhook(caption, article.title || '', article.category || '', article.image_url || '');

      await getSupabase().from('social_posts').insert({
        article_id: article.id, platform: 'make', caption,
        hashtags: (caption.match(/#\w+/g) || []).join(', '),
        status: success ? 'posted' : 'failed',
        post_url: SITE_URL, posted_at: new Date().toISOString()
      });

      if (success) { posted++; console.log(`  ✅ Posted: ${article.title?.substring(0, 50)}`); }
    } catch (e) { console.error('  Social error:', e); }
    await new Promise(r => setTimeout(r, 2000));
  }

  await logAgent('Phase4-SocialPublisher', 'success', `Posted ${posted} via Make.com`, posted);
  console.log(`✅ [Phase 4] Done — ${posted} posts published!`);
  return posted;
}

async function buildNewsletterHTML(articles: any[]): Promise<{subject: string, html: string}> {
  const date = new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  let intro = "Welcome to this week's most important pharmaceutical developments, curated and summarized by our AI agents.";
  try {
    const res = await getGemini().models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Write a 2-sentence engaging intro for a weekly pharma newsletter dated ${date}. Mention the top theme from these topics: ${articles.map(a=>a.category).join(", ")}. Be professional and exciting.`
    });
    intro = res.text?.trim() || intro;
  } catch {}

  const subject = `PharmaNews Weekly Digest — ${date} | ${articles.length} Top Stories`;

  const articlesHTML = articles.map(a => `
    <tr>
      <td style="padding:20px 0;border-bottom:1px solid #e5e7eb">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="100" style="vertical-align:top;padding-right:16px">
              <img src="${a.image_url || a.imageUrl || ''}" width="100" height="70" style="border-radius:8px;object-fit:cover;display:block" />
            </td>
            <td style="vertical-align:top">
              <div style="background:#dbeafe;color:#1e40af;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:4px;display:inline-block;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${a.category}</div>
              <h3 style="margin:0 0 6px;font-size:16px;color:#111827;line-height:1.4;font-family:Georgia,serif">${a.title}</h3>
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5">${(a.summary || '').substring(0,120)}...</p>
              <div style="font-size:11px;color:#9ca3af">${a.author || 'PharmaNews Staff'} • ${a.date || ''} • ${a.readTime || '3 min read'}</div>
              <a href="${SITE_URL}" style="color:#2563eb;font-size:12px;font-weight:bold;text-decoration:none;display:inline-block;margin-top:6px">Read Full Article →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#1e3a5f,#1e40af);padding:28px 32px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><h1 style="margin:0;color:white;font-size:28px;font-family:Georgia,serif">💊 Pharma<span style="color:#60a5fa">NEWS</span></h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:monospace">AI-Powered Pharmaceutical Intelligence</p></td>
            <td align="right"><div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;text-align:center">
              <div style="color:#60a5fa;font-size:10px;font-family:monospace;text-transform:uppercase">Weekly Digest</div>
              <div style="color:white;font-size:12px;font-weight:bold">${date}</div>
            </div></td>
          </tr>
        </table>
      </td></tr>

      <!-- Breaking Banner -->
      <tr><td style="background:#fef3c7;padding:12px 32px;border-bottom:2px solid #f59e0b">
        <p style="margin:0;font-size:13px;color:#92400e">⚡ <strong>${articles.length} top pharma stories</strong> this week — FDA updates, clinical breakthroughs & biotech news</p>
      </td></tr>

      <!-- Intro -->
      <tr><td style="padding:28px 32px 8px">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.7">${intro}</p>
      </td></tr>

      <!-- Articles -->
      <tr><td style="padding:8px 32px 24px">
        <h2 style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;font-family:monospace;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #2563eb">📰 Top Stories This Week</h2>
        <table width="100%" cellpadding="0" cellspacing="0">${articlesHTML}</table>
      </td></tr>

      <!-- AI Agent Note -->
      <tr><td style="padding:0 32px 24px">
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px">
          <p style="margin:0;font-size:12px;color:#166534">🤖 <strong>Powered by 7 AI Agents:</strong> This digest was automatically curated, written, and optimized by our AI system — News Collector → Article Writer → SEO Optimizer → Newsletter Generator. Running 24/7 at pharmanews.onrender.com</p>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:0 32px 28px;text-align:center">
        <a href="${SITE_URL}" style="background:#2563eb;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Visit PharmaNews for More Stories →</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#111827;padding:20px 32px;text-align:center">
        <p style="margin:0 0 8px;color:#9ca3af;font-size:12px">© 2026 PharmaNews • AI-Powered Pharmaceutical Intelligence Platform</p>
        <p style="margin:0;font-size:11px;color:#6b7280">
          <a href="${SITE_URL}" style="color:#60a5fa;text-decoration:none">Visit Website</a> •
          <a href="${SITE_URL}/unsubscribe" style="color:#6b7280;text-decoration:none">Unsubscribe</a>
        </p>
        <div style="margin-top:12px;font-family:monospace;font-size:10px;color:#374151">
          <span style="background:#1f2937;padding:3px 8px;border-radius:4px;color:#34d399">7 AGENTS ACTIVE</span>
          <span style="background:#1f2937;padding:3px 8px;border-radius:4px;color:#60a5fa;margin:0 4px">GEMINI POWERED</span>
          <span style="background:#1f2937;padding:3px 8px;border-radius:4px;color:#a78bfa">SSL SECURED</span>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

async function runPhase5(): Promise<number> {
  const isMonday = new Date(Date.now() + 5.5*3600000).getDay() === 1;
  if (!isMonday) { console.log("  ℹ️  Newsletter runs on Mondays only"); return 0; }
  console.log("📧 [Phase 5] Newsletter Generator starting...");

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) { console.log("  ⚠️  No RESEND_API_KEY — add it to Render environment"); return 0; }

  // Get this week's top articles
  const weekAgo = new Date(Date.now() - 7*24*3600*1000).toISOString();
  const { data: articles } = await getSupabase().from("articles")
    .select("*").gte("created_at", weekAgo).eq("published", true)
    .order("created_at", { ascending: false }).limit(6);

  if (!articles?.length) { console.log("  ℹ️  No articles this week"); return 0; }

  // Get active subscribers
  const { data: subscribers } = await getSupabase().from("subscribers")
    .select("email, name").eq("active", true);

  if (!subscribers?.length) { console.log("  ℹ️  No subscribers yet"); return 0; }

  // Build newsletter HTML
  console.log(`  📝 Building newsletter for ${subscribers.length} subscribers...`);
  const { subject, html } = await buildNewsletterHTML(articles);

  // Send to all subscribers via Resend
  let sent = 0;
  for (const sub of subscribers) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "PharmaNews <newsletter@pharmanews.onrender.com>",
          to: sub.email,
          subject,
          html
        })
      });
      if (res.ok) { sent++; console.log(`  ✅ Sent to ${sub.email}`); }
    } catch (e) { console.error(`  ❌ Failed to send to ${sub.email}:`, e); }
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }

  // Save newsletter record
  await getSupabase().from("newsletters").insert({
    subject, content: html,
    recipients_count: sent,
    sent_at: new Date().toISOString()
  });

  await logAgent("Phase5-Newsletter", "success", `Sent newsletter to ${sent}/${subscribers.length} subscribers`, articles.length);
  console.log(`✅ [Phase 5] Done — Newsletter sent to ${sent} subscribers!`);
  return sent;
}

// ── PHASE 6: COMPETITOR INTEL ──────────────────────────────
async function runPhase6(): Promise<number> {
  const isSunday = new Date(Date.now() + 5.5*3600000).getDay() === 0;
  if (!isSunday) { console.log("  ℹ️  Competitor Intel runs on Sundays only"); return 0; }
  console.log("🕵️ [Phase 6] Competitor Intelligence starting...");

  const competitors = [
    { name: "Pharmacy Times", url: "https://www.pharmacytimes.com" },
    { name: "Fierce Pharma",  url: "https://www.fiercepharma.com"  },
    { name: "Drug Topics",    url: "https://www.drugtopics.com"    },
  ];

  for (const comp of competitors) {
    try {
      const res = await getGemini().models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Briefly analyze ${comp.name} (${comp.url}) as a pharma news competitor. What are their top 3 content topics and 2 weaknesses? Be concise.`
      });
      await getSupabase().from("competitor_data").upsert({
        competitor_name: comp.name, competitor_url: comp.url,
        insights: res.text || "", analyzed_at: new Date().toISOString()
      }, { onConflict: "competitor_name" });
    } catch (e) { console.error(`  Error analyzing ${comp.name}:`, e); }
    await new Promise(r => setTimeout(r, 2000));
  }

  await logAgent("Phase6-CompetitorIntel", "success", `Analyzed ${competitors.length} competitors`, competitors.length);
  console.log(`✅ [Phase 6] Done — ${competitors.length} competitors analyzed`);
  return competitors.length;
}
// ── PHASE 9: IMAGE ENHANCEMENT AGENT ─────────────────────
async function runPhase9(): Promise<number> {
  console.log("🖼️ [Phase 9] Image Enhancement Agent starting...");

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  // Category default images (always available as fallback)
  const CATEGORY_IMAGES: Record<string, string[]> = {
    "Drug Approvals":    [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop"
    ],
    "Clinical Trials":  [
      "https://images.unsplash.com/photo-1530026405186-ed1ea400c3af?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop"
    ],
    "Biotechnology":    [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop"
    ],
    "AI in Healthcare": [
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop"
    ],
    "Industry News":    [
      "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop"
    ],
    "Medical Research": [
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop"
    ],
    "Healthcare Policy": [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop"
    ],
    "Oncology":        [
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=800&auto=format&fit=crop"
    ],
    "Vaccines":        [
      "https://images.unsplash.com/photo-1605289982774-9a6fef564df8?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop"
    ],
    "Drug Safety":     [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&auto=format&fit=crop"
    ],
  };

  // Get articles with missing or default images
  const { data: articles } = await getSupabase()
    .from("articles")
    .select("id, title, category, image_url")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!articles?.length) {
    console.log("  ℹ️  No articles to enhance");
    return 0;
  }

  let enhanced = 0;

  for (const article of articles) {
    const currentImg = article.image_url || "";

    // Skip if already has a good unique image (not a generic fallback)
    const isGenericImage = !currentImg ||
      currentImg.includes("Thumbr") ||
      currentImg.length < 10;

    if (!isGenericImage) continue;

    try {
      let newImageUrl = "";

      // Try Unsplash API if key available
      if (unsplashKey) {
        // Use Gemini to create perfect search query
        const queryPrompt = `Create a 3-word Unsplash photo search query for this pharma article.
Title: ${article.title}
Category: ${article.category}
Return ONLY the search query, nothing else. Example: "medicine laboratory research"`;

        const queryRes = await getGemini().models.generateContent({
          model: "gemini-2.0-flash", contents: queryPrompt
        });
        const searchQuery = queryRes.text?.trim().replace(/"/g, "") || article.category;

        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
          { headers: { "Authorization": `Client-ID ${unsplashKey}` } }
        );
        const unsplashData = await unsplashRes.json();
        if (unsplashData.results?.length > 0) {
          const photo = unsplashData.results[Math.floor(Math.random() * Math.min(3, unsplashData.results.length))];
          newImageUrl = `${photo.urls.regular}&w=800&auto=format&fit=crop`;
          console.log(`  🎨 Unsplash image found for: ${article.title?.substring(0, 40)}...`);
        }
      }

      // Fallback to category images pool
      if (!newImageUrl) {
        const categoryPool = CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES["Medical Research"];
        newImageUrl = categoryPool[Math.floor(Math.random() * categoryPool.length)];
        console.log(`  📦 Category fallback for: ${article.title?.substring(0, 40)}...`);
      }

      // Update article image
      const { error } = await getSupabase()
        .from("articles")
        .update({ image_url: newImageUrl })
        .eq("id", article.id);

      if (!error) enhanced++;

    } catch (e) {
      console.error(`  Image error for ${article.id}:`, e);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  await logAgent("Phase9-ImageEnhancement", "success",
    `Enhanced ${enhanced} article images`, enhanced);
  console.log(`✅ [Phase 9] Done — ${enhanced} images enhanced!`);
  return enhanced;
}

// ── PHASE 10: TRANSLATION AGENT (Hindi) ───────────────────
async function runPhase10(): Promise<number> {
  console.log("🌐 [Phase 10] Translation Agent starting...");
  const { data: articles } = await getSupabase()
    .from("articles")
    .select("id, title, summary")
    .eq("published", true)
    .is("title_hi", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!articles?.length) { console.log("  ℹ️  No articles need translation"); return 0; }

  let translated = 0;
  for (const article of articles) {
    try {
      const prompt = `Translate this pharma news to Hindi (Devanagari script). Keep medical/drug names in English where appropriate.

Title: ${article.title}
Summary: ${article.summary}

Respond ONLY in JSON: {"title_hi": "हिंदी शीर्षक", "summary_hi": "हिंदी सारांश"}`;

      const res = await getGemini().models.generateContent({
        model: "gemini-2.0-flash", contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");

      await getSupabase().from("articles").update({
        title_hi: result.title_hi || "",
        summary_hi: result.summary_hi || ""
      }).eq("id", article.id);

      translated++;
      console.log(`  ✅ Translated: ${article.title?.substring(0, 40)}...`);
    } catch (e) { console.error("  Translation error:", e); }
    await new Promise(r => setTimeout(r, 1500));
  }

  await logAgent("Phase10-Translation", "success", `Translated ${translated} articles to Hindi`, translated);
  console.log(`✅ [Phase 10] Done — ${translated} articles translated!`);
  return translated;
}

// ── CEO EXECUTIVE AGENT ────────────────────────────────────
async function runCEO(): Promise<void> {
  console.log("");
  console.log("👔 ═══════════════════════════════════════");
  console.log("👔  CEO EXECUTIVE AGENT — PharmaNews");
  console.log(`👔  ${new Date().toLocaleDateString("en-IN", { weekday:"long", month:"long", day:"numeric" })}`);
  console.log("👔 ═══════════════════════════════════════");

  const { data: logs } = await getSupabase().from("agent_logs")
    .select("*").gte("ran_at", new Date(Date.now() - 24*3600*1000).toISOString())
    .order("ran_at", { ascending: false });

  const { count: totalArticles } = await getSupabase().from("articles")
    .select("*", { count: "exact", head: true }).eq("published", true);
  const { count: totalSubs } = await getSupabase().from("subscribers")
    .select("*", { count: "exact", head: true }).eq("active", true);

  const agentNames = ["Phase1-NewsCollector","Phase2-ArticleWriter","Phase3-SEOOptimizer","Phase4-SocialPublisher","Phase5-Newsletter","Phase6-CompetitorIntel","Phase7-FactChecker","Phase8-TrendingTopics","Phase9-ImageEnhancement","Phase10-Translation"];

  console.log("📊 Agent Performance:");
  const perfLines: string[] = [];
  agentNames.forEach(name => {
    const agentLog = logs?.find(l => l.agent_name === name);
    const score = agentLog ? (agentLog.status === "success" ? 100 : 40) : 0;
    const bar = "█".repeat(Math.floor(score/10)) + "░".repeat(10 - Math.floor(score/10));
    console.log(`   ${name.padEnd(28)} [${bar}] ${score}/100`);
    perfLines.push(`<tr><td style="padding:6px 0;color:#374151">${name}</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:${score>=80?'#16a34a':score>=50?'#d97706':'#dc2626'}">${score}/100</td></tr>`);
  });

  let summary = "Platform operating normally.";
  let recommendations = "Continue daily operations.";
  try {
    const prompt = `You are the CEO AI of PharmaNews. Platform stats:
- Total articles: ${totalArticles}
- Subscribers: ${totalSubs}
- Agents run today: ${logs?.length || 0}

In 2 sentences: give an executive summary. Then in 2 more sentences: give growth recommendations.
Respond ONLY in JSON: {"summary":"...", "recommendations":"..."}`;
    const res = await getGemini().models.generateContent({
      model: "gemini-2.0-flash", contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
    summary = result.summary || summary;
    recommendations = result.recommendations || recommendations;
    console.log(`📋 Executive Summary: ${summary}`);
  } catch (e) {}

  // ── EMAIL THE DAILY REPORT TO ADMIN ──
  const adminEmail = process.env.ADMIN_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  if (adminEmail && resendKey) {
    try {
      const healthScore = Math.round(perfLines.length ? agentNames.filter(n => logs?.find(l=>l.agent_name===n && l.status==="success")).length / agentNames.length * 100 : 0);
      const html = `<!DOCTYPE html><html><body style="margin:0;font-family:Arial,sans-serif;background:#f3f4f6">
        <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;margin:24px auto">
          <tr><td style="background:#0f172a;padding:24px 32px">
            <h1 style="color:white;margin:0;font-size:22px">👔 CEO Daily Report</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;font-family:monospace">${new Date().toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
          </td></tr>
          <tr><td style="padding:24px 32px">
            <div style="background:${healthScore>=80?'#f0fdf4':healthScore>=50?'#fffbeb':'#fef2f2'};border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">
              <div style="font-size:36px;font-weight:bold;color:${healthScore>=80?'#16a34a':healthScore>=50?'#d97706':'#dc2626'}">${healthScore}/100</div>
              <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">System Health Score</div>
            </div>
            <h3 style="color:#111827;font-size:14px;margin-bottom:8px">📝 Executive Summary</h3>
            <p style="color:#4b5563;font-size:13px;line-height:1.6">${summary}</p>
            <h3 style="color:#111827;font-size:14px;margin:16px 0 8px">🚀 Recommendations</h3>
            <p style="color:#4b5563;font-size:13px;line-height:1.6">${recommendations}</p>
            <h3 style="color:#111827;font-size:14px;margin:20px 0 8px">📊 Agent Performance</h3>
            <table width="100%" style="font-size:13px"><tbody>${perfLines.join("")}</tbody></table>
            <h3 style="color:#111827;font-size:14px;margin:20px 0 8px">📈 Platform Stats</h3>
            <table width="100%" style="font-size:13px">
              <tr><td style="padding:4px 0">Total Articles</td><td style="text-align:right;font-weight:bold">${totalArticles}</td></tr>
              <tr><td style="padding:4px 0">Active Subscribers</td><td style="text-align:right;font-weight:bold">${totalSubs}</td></tr>
              <tr><td style="padding:4px 0">Agent Runs Today</td><td style="text-align:right;font-weight:bold">${logs?.length || 0}</td></tr>
            </table>
          </td></tr>
          <tr><td style="background:#111827;padding:16px 32px;text-align:center">
            <p style="color:#6b7280;font-size:11px;margin:0">PharmaNews CEO Agent • Automated Daily Report</p>
          </td></tr>
        </table>
      </body></html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "PharmaNews CEO <ceo@pharmanews.co.in>",
          to: adminEmail,
          subject: `👔 CEO Daily Report — Health Score ${healthScore}/100 — ${new Date().toLocaleDateString("en-IN")}`,
          html
        })
      });
      console.log(`  📧 CEO report emailed to ${adminEmail}`);
    } catch (e) { console.error("  Email report error:", e); }
  } else {
    console.log("  ℹ️  Set ADMIN_EMAIL env var to receive daily CEO reports");
  }

  await logAgent("CEO-ExecutiveAgent", "success", `Daily audit — ${totalArticles} articles, ${totalSubs} subscribers`, totalArticles || 0);
  console.log("👔 ═══════════════════════════════════════");
  console.log("");
}

// ── MASTER ORCHESTRATOR ────────────────────────────────────
export function startAllAgents(): void {
  console.log("🚀 PharmaNews AI Agent System Starting...");
  console.log("👔 CEO + 10 Phase Agents Ready");
  console.log("");

  const schedule = (name: string, hour: number, min: number, fn: () => Promise<any>) => {
    const run = () => {
      const ms = msUntilTime(hour, min);
      console.log(`⏰ [${name}] Next run in ${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m (${hour}:${String(min).padStart(2,"0")} IST)`);
      setTimeout(async () => {
        await withRetry(name, fn, 3, 5000); // #24 — auto-retry up to 3 times with backoff
        run();
      }, ms);
    };
    run();
  };

  withRetry("CEO", runCEO, 2, 3000).catch(console.error);
  schedule("CEO",     4,  0, runCEO);
  schedule("Phase8",  4, 30, runPhase8);  // Trending topics
  schedule("Phase1",  5,  0, runPhase1);  // News collector
  schedule("Phase2",  5, 30, runPhase2);  // Article writer
  schedule("Phase9",  5, 45, runPhase9);  // Image enhancement
  schedule("Phase3",  6,  0, runPhase3);  // SEO optimizer
  schedule("Phase7",  6, 30, runPhase7);  // Fact checker
  schedule("Phase10", 6, 45, runPhase10); // Translation
  schedule("Phase4",  7,  0, runPhase4);  // Social publisher
  schedule("Phase5",  8,  0, runPhase5);  // Newsletter (Mon)
  schedule("Phase6",  9,  0, runPhase6);  // Competitor intel (Sun)

  setTimeout(() => withRetry("Phase1-Startup", runPhase1, 2, 3000).catch(console.error), 5000);

  console.log("📅 Schedule (IST): 4AM CEO → 4:30 Trending → 5AM News → 5:30 Writer → 5:45 Images → 6AM SEO → 6:30 FactCheck → 6:45 Translate → 7AM Social → 8AM Newsletter(Mon) → 9AM Competitor(Sun)");
  console.log("✅ All 10 agents running!");
}
