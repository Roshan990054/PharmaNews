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

const SITE_URL = process.env.SITE_URL || "https://pharmanews.onrender.com";

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
      const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`);
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

// ── PHASE 3: SEO OPTIMIZER ─────────────────────────────────
async function runPhase3(): Promise<number> {
  console.log("🔍 [Phase 3] SEO Optimizer starting...");
  const { data: articles } = await getSupabase().from("articles").select("*").is("seo_title", null).limit(10);
  if (!articles?.length) { console.log("  ℹ️  All articles SEO optimized"); return 0; }

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
      await getSupabase().from("articles").update({
        seo_title: seo.seo_title, seo_description: seo.meta_description, keywords: seo.keywords
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
  await logAgent("Phase3-SEOOptimizer", "success", `SEO optimized ${count} articles`, count);
  console.log(`✅ [Phase 3] Done — ${count} articles SEO optimized`);
  return count;
}

// ── PHASE 4: SOCIAL PUBLISHER ──────────────────────────────
// ── Buffer API Helper ──────────────────────────────────────
async function getBufferProfiles(): Promise<any[]> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${token}`);
    return await res.json();
  } catch { return []; }
}

async function postToBuffer(text: string, profileIds: string[]): Promise<boolean> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token || !profileIds.length) return false;
  try {
    const body = new URLSearchParams();
    body.append("text", text);
    body.append("access_token", token);
    body.append("now", "true");
    profileIds.forEach(id => body.append("profile_ids[]", id));
    const res = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const data = await res.json();
    return data.success === true;
  } catch { return false; }
}

async function runPhase4(): Promise<number> {
  console.log("📱 [Phase 4] Social Publisher (Buffer) starting...");

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) {
    console.log("  ⚠️  No BUFFER_ACCESS_TOKEN — add it to Render environment");
    return 0;
  }

  // Get Buffer profile IDs
  const profiles = await getBufferProfiles();
  if (!profiles.length) {
    console.log("  ⚠️  No Buffer profiles found");
    return 0;
  }
  const profileIds = profiles.map((p: any) => p.id);
  console.log(`  ✅ Found ${profiles.length} Buffer profiles: ${profiles.map((p:any) => p.service).join(", ")}`);

  // Get today's top articles
  const today = new Date().toISOString().split("T")[0];
  const { data: articles } = await getSupabase().from("articles")
    .select("*").gte("created_at", today).eq("published", true)
    .order("created_at", { ascending: false }).limit(3);

  if (!articles?.length) { console.log("  ℹ️  No new articles to post today"); return 0; }

  let posted = 0;
  for (const article of articles) {
    // Check if already posted today
    const { data: existing } = await getSupabase().from("social_posts")
      .select("id").eq("article_id", article.id).eq("platform", "buffer").limit(1);
    if (existing?.length) continue;

    try {
      // Generate engaging caption with Gemini
      const prompt = `Write an engaging social media post for this pharma news.
Max 250 characters. Include 3-4 relevant hashtags. End with the link.

Title: ${article.title}
Category: ${article.category}
Link: ${SITE_URL}

Write ONLY the post text, nothing else.`;

      const res = await getGemini().models.generateContent({
        model: "gemini-2.0-flash", contents: prompt
      });
      const caption = res.text?.trim() ||
        `🔬 ${article.title}\n\nRead more: ${SITE_URL}\n\n#PharmaNews #Healthcare #FDA #Pharma`;

      // Post to ALL connected Buffer profiles (Twitter, LinkedIn, Instagram)
      const success = await postToBuffer(caption, profileIds);

      // Save to Supabase
      await getSupabase().from("social_posts").insert({
        article_id: article.id,
        platform: "buffer",
        caption,
        hashtags: (caption.match(/#\w+/g) || []).join(", "),
        status: success ? "posted" : "pending",
        post_url: SITE_URL,
        posted_at: new Date().toISOString()
      });

      if (success) {
        posted++;
        console.log(`  ✅ Posted to all platforms: ${article.title?.substring(0, 50)}...`);
      } else {
        console.log(`  📋 Queued in Buffer: ${article.title?.substring(0, 50)}...`);
      }
    } catch (e) { console.error("  Social error:", e); }
    await new Promise(r => setTimeout(r, 2000));
  }

  await logAgent("Phase4-SocialPublisher", "success",
    `Posted ${posted} articles to Buffer (Twitter + LinkedIn + Instagram)`, posted);
  console.log(`✅ [Phase 4] Done — ${posted} posts published to all platforms!`);
  return posted;
}

// ── PHASE 5: NEWSLETTER ────────────────────────────────────
async function runPhase5(): Promise<number> {
  const isMonday = new Date(Date.now() + 5.5*3600000).getDay() === 1;
  if (!isMonday) { console.log("  ℹ️  Newsletter runs on Mondays only"); return 0; }
  console.log("📧 [Phase 5] Newsletter Generator starting...");

  const weekAgo = new Date(Date.now() - 7*24*3600*1000).toISOString();
  const { data: articles } = await getSupabase().from("articles")
    .select("*").gte("created_at", weekAgo).eq("published", true).limit(5);
  const { data: subscribers } = await getSupabase().from("subscribers")
    .select("email").eq("active", true);

  if (!articles?.length || !subscribers?.length) {
    console.log("  ℹ️  No articles or subscribers"); return 0;
  }

  await getSupabase().from("newsletters").insert({
    subject: `PharmaNews Weekly Digest — ${new Date().toLocaleDateString("en-IN")}`,
    content: `Weekly digest with ${articles.length} articles`,
    recipients_count: subscribers.length,
    sent_at: new Date().toISOString()
  });

  await logAgent("Phase5-Newsletter", "success", `Newsletter prepared for ${subscribers.length} subscribers`, articles.length);
  console.log(`✅ [Phase 5] Done — Newsletter prepared for ${subscribers.length} subscribers`);
  return subscribers.length;
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

  const agentNames = ["Phase1-NewsCollector","Phase2-ArticleWriter","Phase3-SEOOptimizer","Phase4-SocialPublisher","Phase5-Newsletter","Phase6-CompetitorIntel"];
  
  console.log("📊 Agent Performance:");
  agentNames.forEach(name => {
    const agentLog = logs?.find(l => l.agent_name === name);
    const score = agentLog ? (agentLog.status === "success" ? 100 : 40) : 0;
    const bar = "█".repeat(score/10) + "░".repeat(10 - score/10);
    console.log(`   ${name.padEnd(28)} [${bar}] ${score}/100`);
  });

  try {
    const prompt = `You are the CEO AI of PharmaNews. Platform stats:
- Total articles: ${totalArticles}
- Subscribers: ${totalSubs}
- Agents run today: ${logs?.length || 0}

In 2 sentences: give an executive summary and 2 growth recommendations.`;
    const res = await getGemini().models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    console.log(`📋 Executive Summary: ${res.text}`);
  } catch (e) {}

  await logAgent("CEO-ExecutiveAgent", "success", `Daily audit — ${totalArticles} articles, ${totalSubs} subscribers`, totalArticles || 0);
  console.log("👔 ═══════════════════════════════════════");
  console.log("");
}

// ── MASTER ORCHESTRATOR ────────────────────────────────────
export function startAllAgents(): void {
  console.log("🚀 PharmaNews AI Agent System Starting...");
  console.log("👔 CEO + 6 Phase Agents Ready");
  console.log("");

  const schedule = (name: string, hour: number, min: number, fn: () => Promise<any>) => {
    const run = () => {
      const ms = msUntilTime(hour, min);
      console.log(`⏰ [${name}] Next run in ${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m (${hour}:${String(min).padStart(2,"0")} AM IST)`);
      setTimeout(async () => { try { await fn(); } catch(e) { console.error(`[${name}] Error:`, e); } run(); }, ms);
    };
    run();
  };

  // Run CEO immediately then schedule
  runCEO().catch(console.error);
  schedule("CEO",        4,  0, runCEO);
  schedule("Phase1",     5,  0, runPhase1);
  schedule("Phase2",     5, 30, runPhase2);
  schedule("Phase3",     6,  0, runPhase3);
  schedule("Phase4",     7,  0, runPhase4);
  schedule("Phase5",     8,  0, runPhase5);
  schedule("Phase6",     9,  0, runPhase6);

  // Also run Phase 1 immediately to fetch news
  setTimeout(() => runPhase1().catch(console.error), 5000);

  console.log("📅 Schedule (IST): 4AM→CEO  5AM→News  5:30AM→Writer  6AM→SEO  7AM→Social  8AM→Newsletter(Mon)  9AM→Competitor(Sun)");
  console.log("✅ All agents running!");
}
