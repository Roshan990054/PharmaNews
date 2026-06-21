import { runNewsCollector, scheduleNewsCollector } from "./phase1-news-collector.js";
import { runArticleWriter } from "./phase2-article-writer.js";
import { runSEOOptimizer } from "./phase3-seo-optimizer.js";
import { runSocialPublisher } from "./phase4-social-publisher.js";
import { runNewsletterGenerator } from "./phase5-newsletter.js";
import { runCompetitorIntelligence } from "./phase6-competitor-intelligence.js";

// ============================================================
// MASTER ORCHESTRATOR
// Controls all 6 AI agents with proper scheduling
// ============================================================

function msUntilTime(hour: number, minute: number): number {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const target = new Date(ist);
  target.setHours(hour, minute, 0, 0);
  if (ist >= target) target.setDate(target.getDate() + 1);
  return target.getTime() - ist.getTime();
}

function isMonday(): boolean {
  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
  return ist.getDay() === 1;
}

function isSunday(): boolean {
  const ist = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
  return ist.getDay() === 0;
}

export async function startAllAgents(): Promise<void> {
  console.log("🚀 PharmaNews AI Agent Orchestrator Starting...");
  console.log("📋 6 Agents: News Collector → Article Writer → SEO → Social → Newsletter → Competitor Intel");
  console.log("");

  // ── PHASE 1: News Collector ── runs every day at 5:00 AM IST
  scheduleNewsCollector();

  // ── PHASE 2: Article Writer ── runs every day at 5:30 AM IST
  const scheduleArticleWriter = () => {
    const ms = msUntilTime(5, 30);
    console.log(`⏰ [Phase 2] Article Writer scheduled in ${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`);
    setTimeout(async () => {
      await runArticleWriter();
      scheduleArticleWriter();
    }, ms);
  };
  scheduleArticleWriter();

  // ── PHASE 3: SEO Optimizer ── runs every day at 6:00 AM IST
  const scheduleSEO = () => {
    const ms = msUntilTime(6, 0);
    console.log(`⏰ [Phase 3] SEO Optimizer scheduled in ${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`);
    setTimeout(async () => {
      await runSEOOptimizer();
      scheduleSEO();
    }, ms);
  };
  scheduleSEO();

  // ── PHASE 4: Social Publisher ── runs every day at 7:00 AM IST
  const scheduleSocial = () => {
    const ms = msUntilTime(7, 0);
    console.log(`⏰ [Phase 4] Social Publisher scheduled in ${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`);
    setTimeout(async () => {
      await runSocialPublisher();
      scheduleSocial();
    }, ms);
  };
  scheduleSocial();

  // ── PHASE 5: Newsletter ── runs every Monday at 8:00 AM IST
  const scheduleNewsletter = () => {
    const ms = msUntilTime(8, 0);
    setTimeout(async () => {
      if (isMonday()) {
        console.log("📧 [Phase 5] It's Monday! Sending weekly newsletter...");
        await runNewsletterGenerator();
      }
      scheduleNewsletter();
    }, ms);
  };
  scheduleNewsletter();
  console.log(`⏰ [Phase 5] Newsletter runs every Monday at 8:00 AM IST`);

  // ── PHASE 6: Competitor Intel ── runs every Sunday at 9:00 AM IST
  const scheduleCompetitor = () => {
    const ms = msUntilTime(9, 0);
    setTimeout(async () => {
      if (isSunday()) {
        console.log("🕵️ [Phase 6] It's Sunday! Running competitor analysis...");
        await runCompetitorIntelligence();
      }
      scheduleCompetitor();
    }, ms);
  };
  scheduleCompetitor();
  console.log(`⏰ [Phase 6] Competitor Intel runs every Sunday at 9:00 AM IST`);

  console.log("");
  console.log("✅ All 6 agents scheduled and running!");
  console.log("📅 Daily Schedule (IST):");
  console.log("   5:00 AM → Phase 1: News Collector");
  console.log("   5:30 AM → Phase 2: Article Writer");
  console.log("   6:00 AM → Phase 3: SEO Optimizer");
  console.log("   7:00 AM → Phase 4: Social Publisher");
  console.log("   8:00 AM → Phase 5: Newsletter (Mondays only)");
  console.log("   9:00 AM → Phase 6: Competitor Intel (Sundays only)");
}
