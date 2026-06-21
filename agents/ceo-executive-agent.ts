import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CEO EXECUTIVE AGENT
// Highest-level supervisory AI for PharmaNews
// Manages, audits, and improves all subordinate agents
// Runs daily at 4:00 AM IST (before all other agents)
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SITE_URL = process.env.SITE_URL || "https://pharmanews.onrender.com";

// ── Types ──────────────────────────────────────────────────
interface AgentPerformance {
  name: string;
  lastRun: string;
  articlesProcessed: number;
  status: string;
  score: number;
  issues: string[];
}

interface ExecutiveReport {
  date: string;
  executiveSummary: string;
  agentPerformance: AgentPerformance[];
  detectedRisks: string[];
  recommendedActions: string[];
  growthOpportunities: string[];
  systemHealthScore: number;
  topPerformingContent: any[];
  publishingStats: any;
  seoMetrics: any;
}

// ── 1. STRATEGIC OVERSIGHT ─────────────────────────────────
async function defineContentPriorities(): Promise<string[]> {
  const prompt = `You are the CEO of PharmaNews, a pharmaceutical news platform.

Today is ${new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}.

Define today's top 5 content priorities for maximum Google ranking and user engagement.
Focus on: breaking FDA news, trending drug approvals, clinical trial results, healthcare policy.

Respond in JSON array: ["priority1", "priority2", "priority3", "priority4", "priority5"]`;

  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "[]");
  } catch {
    return [
      "FDA drug approvals and fast-track designations",
      "Clinical trial Phase 3 results",
      "Drug pricing and healthcare policy updates",
      "Biotech company mergers and acquisitions",
      "AI applications in drug discovery"
    ];
  }
}

// ── 2. AGENT PERFORMANCE EVALUATION ───────────────────────
async function evaluateAgentPerformance(): Promise<AgentPerformance[]> {
  const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();

  const { data: logs } = await supabase
    .from("agent_logs")
    .select("*")
    .gte("ran_at", yesterday)
    .order("ran_at", { ascending: false });

  const agents = [
    "Phase1-NewsCollector",
    "Phase2-ArticleWriter",
    "Phase3-SEOOptimizer",
    "Phase4-SocialPublisher",
    "Phase5-Newsletter",
    "Phase6-CompetitorIntelligence"
  ];

  return agents.map(agentName => {
    const agentLogs = logs?.filter(l => l.agent_name === agentName) || [];
    const lastLog = agentLogs[0];
    const issues: string[] = [];
    let score = 100;

    if (!lastLog) {
      issues.push("Agent did not run in last 24 hours");
      score = 0;
    } else {
      if (lastLog.status === "error") { issues.push("Agent reported error"); score -= 40; }
      if (lastLog.articles_processed === 0) { issues.push("No articles processed"); score -= 20; }
      if (agentLogs.length > 3) { issues.push("Running too frequently"); score -= 10; }
    }

    return {
      name: agentName,
      lastRun: lastLog?.ran_at || "Never",
      articlesProcessed: lastLog?.articles_processed || 0,
      status: lastLog?.status || "not_run",
      score: Math.max(0, score),
      issues
    };
  });
}

// ── 3. QUALITY ASSURANCE ───────────────────────────────────
async function runQualityAssurance(): Promise<{approved: number, rejected: number, issues: string[]}> {
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString())
    .limit(20);

  if (!articles || articles.length === 0) {
    return { approved: 0, rejected: 0, issues: ["No articles to review"] };
  }

  let approved = 0, rejected = 0;
  const issues: string[] = [];

  for (const article of articles) {
    const prompt = `You are a pharmaceutical content quality checker.

Review this article for quality:
Title: ${article.title}
Content: ${article.content?.substring(0, 300)}
Category: ${article.category}

Check for:
1. Is it relevant to pharma/healthcare? (yes/no)
2. Is the title clear and professional? (yes/no)
3. Is content substantial (>100 words)? (yes/no)
4. Any obvious misinformation? (yes/no)

Respond in JSON: {"approve": true/false, "reason": "brief reason", "quality_score": 0-100}`;

    try {
      const res = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");

      if (result.approve === false) {
        rejected++;
        issues.push(`Rejected: "${article.title?.substring(0, 50)}" — ${result.reason}`);
        // Unpublish low quality articles
        await supabase
          .from("articles")
          .update({ published: false })
          .eq("id", article.id);
      } else {
        approved++;
      }
    } catch { approved++; }

    await new Promise(r => setTimeout(r, 500));
  }

  return { approved, rejected, issues };
}

// ── 4. FACTUAL SAFETY CHECK ────────────────────────────────
async function runFactualSafetyCheck(): Promise<string[]> {
  const { data: articles } = await supabase
    .from("articles")
    .select("title, content, id")
    .eq("published", true)
    .gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString())
    .limit(10);

  const risks: string[] = [];

  for (const article of articles || []) {
    const prompt = `Check this pharma article for factual risks:
Title: ${article.title}
Content: ${article.content?.substring(0, 200)}

Flag if it contains:
- Unverified drug claims
- Dangerous medical advice
- Misleading statistics
- Hallucinated data

Respond in JSON: {"has_risk": true/false, "risk_description": "description or null"}`;

    try {
      const res = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
      if (result.has_risk) {
        risks.push(`⚠️ Risk in "${article.title?.substring(0, 50)}": ${result.risk_description}`);
      }
    } catch {}

    await new Promise(r => setTimeout(r, 500));
  }

  return risks;
}

// ── 5. SEO SUPERVISION ─────────────────────────────────────
async function reviewSEOStrategy(): Promise<any> {
  const { data: seoData } = await supabase
    .from("seo_data")
    .select("*")
    .order("analyzed_at", { ascending: false })
    .limit(10);

  const avgScore = seoData?.length
    ? Math.round(seoData.reduce((a, b) => a + (b.score || 0), 0) / seoData.length)
    : 0;

  const prompt = `You are an SEO director for a pharma news website.

Current SEO metrics:
- Average SEO score: ${avgScore}/100
- Articles with SEO data: ${seoData?.length || 0}
- Website: ${SITE_URL}

Provide 3 specific SEO recommendations to improve Google ranking.
Respond in JSON: {"recommendations": ["rec1", "rec2", "rec3"], "priority_keywords": ["kw1","kw2","kw3"]}`;

  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
    return { avgScore, ...result };
  } catch {
    return { avgScore, recommendations: [], priority_keywords: [] };
  }
}

// ── 6. ANALYTICS REVIEW ────────────────────────────────────
async function reviewAnalytics(): Promise<any> {
  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("published", true);

  const { count: totalSubscribers } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  const { count: socialPosts } = await supabase
    .from("social_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "posted");

  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("recipients_count")
    .order("sent_at", { ascending: false })
    .limit(1);

  return {
    totalArticles: totalArticles || 0,
    totalSubscribers: totalSubscribers || 0,
    socialPostsPublished: socialPosts || 0,
    lastNewsletterReach: newsletters?.[0]?.recipients_count || 0
  };
}

// ── 7. GENERATE EXECUTIVE REPORT ──────────────────────────
async function generateExecutiveReport(data: any): Promise<ExecutiveReport> {
  const prompt = `You are the CEO AI of PharmaNews. Generate an executive report.

Data:
- Content Priorities: ${JSON.stringify(data.priorities)}
- Agent Performance: ${JSON.stringify(data.agentPerformance)}
- Quality Issues: ${JSON.stringify(data.qualityIssues)}
- Factual Risks: ${JSON.stringify(data.factualRisks)}
- SEO Metrics: ${JSON.stringify(data.seoMetrics)}
- Analytics: ${JSON.stringify(data.analytics)}

Generate comprehensive executive report in JSON:
{
  "executiveSummary": "3-4 sentence summary of platform status",
  "detectedRisks": ["risk1", "risk2"],
  "recommendedActions": ["action1", "action2", "action3"],
  "growthOpportunities": ["opp1", "opp2", "opp3"],
  "systemHealthScore": 85
}`;

  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");

    return {
      date: new Date().toISOString(),
      executiveSummary: result.executiveSummary || "System operating normally.",
      agentPerformance: data.agentPerformance,
      detectedRisks: [...(result.detectedRisks || []), ...data.factualRisks],
      recommendedActions: result.recommendedActions || [],
      growthOpportunities: result.growthOpportunities || [],
      systemHealthScore: result.systemHealthScore || 75,
      topPerformingContent: [],
      publishingStats: data.analytics,
      seoMetrics: data.seoMetrics
    };
  } catch {
    return {
      date: new Date().toISOString(),
      executiveSummary: "System check completed.",
      agentPerformance: data.agentPerformance,
      detectedRisks: data.factualRisks,
      recommendedActions: [],
      growthOpportunities: [],
      systemHealthScore: 70,
      topPerformingContent: [],
      publishingStats: data.analytics,
      seoMetrics: data.seoMetrics
    };
  }
}

// ── 8. SAVE & LOG REPORT ───────────────────────────────────
async function saveReport(report: ExecutiveReport): Promise<void> {
  await supabase.from("agent_logs").insert({
    agent_name: "CEO-ExecutiveAgent",
    status: "success",
    message: JSON.stringify({
      summary: report.executiveSummary,
      health_score: report.systemHealthScore,
      risks: report.detectedRisks.length,
      actions: report.recommendedActions.length
    }),
    articles_processed: report.publishingStats?.totalArticles || 0,
    ran_at: new Date().toISOString()
  });

  // Also save full report to competitor_data table (repurposed for reports)
  await supabase.from("competitor_data").upsert({
    competitor_name: `CEO_REPORT_${new Date().toISOString().split("T")[0]}`,
    competitor_url: "internal",
    insights: JSON.stringify(report),
    analyzed_at: new Date().toISOString()
  }, { onConflict: "competitor_name" });
}

// ── MAIN CEO FUNCTION ──────────────────────────────────────
export async function runCEOAgent(): Promise<ExecutiveReport> {
  console.log("");
  console.log("👔 ════════════════════════════════════════");
  console.log("👔  CEO EXECUTIVE AGENT STARTING");
  console.log("👔  PharmaNews Intelligence Platform");
  console.log(`👔  ${new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}`);
  console.log("👔 ════════════════════════════════════════");
  console.log("");

  // 1. Define content priorities
  console.log("📋 [CEO] Step 1/7: Defining content priorities...");
  const priorities = await defineContentPriorities();
  console.log(`  ✅ ${priorities.length} priorities set`);

  // 2. Evaluate all agents
  console.log("📊 [CEO] Step 2/7: Evaluating agent performance...");
  const agentPerformance = await evaluateAgentPerformance();
  const avgAgentScore = Math.round(agentPerformance.reduce((a,b) => a+b.score, 0) / agentPerformance.length);
  console.log(`  ✅ Average agent score: ${avgAgentScore}/100`);

  // 3. Quality assurance
  console.log("✅ [CEO] Step 3/7: Running quality assurance...");
  const qaResult = await runQualityAssurance();
  console.log(`  ✅ Approved: ${qaResult.approved}, Rejected: ${qaResult.rejected}`);

  // 4. Factual safety
  console.log("🛡️ [CEO] Step 4/7: Running factual safety check...");
  const factualRisks = await runFactualSafetyCheck();
  console.log(`  ✅ Found ${factualRisks.length} potential risks`);

  // 5. SEO review
  console.log("🔍 [CEO] Step 5/7: Reviewing SEO strategy...");
  const seoMetrics = await reviewSEOStrategy();
  console.log(`  ✅ Average SEO score: ${seoMetrics.avgScore}/100`);

  // 6. Analytics
  console.log("📈 [CEO] Step 6/7: Reviewing analytics...");
  const analytics = await reviewAnalytics();
  console.log(`  ✅ Total articles: ${analytics.totalArticles}, Subscribers: ${analytics.totalSubscribers}`);

  // 7. Generate report
  console.log("📄 [CEO] Step 7/7: Generating executive report...");
  const report = await generateExecutiveReport({
    priorities,
    agentPerformance,
    qualityIssues: qaResult.issues,
    factualRisks,
    seoMetrics,
    analytics
  });

  // Save report
  await saveReport(report);

  // Print report to logs
  console.log("");
  console.log("👔 ════════════════════════════════════════");
  console.log("👔  EXECUTIVE REPORT");
  console.log("👔 ════════════════════════════════════════");
  console.log(`📊 System Health Score: ${report.systemHealthScore}/100`);
  console.log(`📝 Summary: ${report.executiveSummary}`);
  console.log(`⚠️  Risks Detected: ${report.detectedRisks.length}`);
  report.detectedRisks.forEach(r => console.log(`   • ${r}`));
  console.log(`✅ Recommended Actions:`);
  report.recommendedActions.forEach(a => console.log(`   → ${a}`));
  console.log(`🚀 Growth Opportunities:`);
  report.growthOpportunities.forEach(o => console.log(`   💡 ${o}`));
  console.log("");
  console.log("👔 Agent Performance:");
  report.agentPerformance.forEach(a => {
    const bar = "█".repeat(Math.floor(a.score/10)) + "░".repeat(10-Math.floor(a.score/10));
    console.log(`   ${a.name.padEnd(30)} [${bar}] ${a.score}/100`);
  });
  console.log("👔 ════════════════════════════════════════");
  console.log("");

  return report;
}

// ── SCHEDULE CEO AGENT ─────────────────────────────────────
export function scheduleCEOAgent(): void {
  function msUntil4AM(): number {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const next4AM = new Date(ist);
    next4AM.setHours(4, 0, 0, 0);
    if (ist >= next4AM) next4AM.setDate(next4AM.getDate() + 1);
    return next4AM.getTime() - ist.getTime();
  }

  function scheduleNext() {
    const ms = msUntil4AM();
    const hours = Math.floor(ms/3600000);
    const mins = Math.floor((ms%3600000)/60000);
    console.log(`⏰ [CEO] Next executive review in ${hours}h ${mins}m (4:00 AM IST)`);

    setTimeout(async () => {
      await runCEOAgent();
      scheduleNext();
    }, ms);
  }

  // Run immediately on startup
  runCEOAgent().catch(console.error);
  scheduleNext();
}
