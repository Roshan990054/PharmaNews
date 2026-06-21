import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 5 — NEWSLETTER GENERATOR AGENT
// Sends weekly pharma digest to all subscribers every Monday
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const SITE_URL = process.env.SITE_URL || "https://pharmanews.onrender.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function generateNewsletterHTML(articles: any[]): Promise<{subject: string, html: string}> {
  const articleList = articles.map((a, i) =>
    `${i+1}. ${a.title} (${a.category}) - ${a.summary?.substring(0, 100)}...`
  ).join("\n");

  const prompt = `You are a pharma newsletter editor. Write a weekly digest email.

Top Articles This Week:
${articleList}

Respond in JSON:
{
  "subject": "compelling email subject line",
  "intro": "2-3 sentence engaging intro paragraph",
  "highlights": "2-3 sentence week highlights"
}`;

  let aiContent: any = {};
  try {
    const res = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    aiContent = JSON.parse(res.text?.replace(/```json|```/g, "").trim() || "{}");
  } catch {}

  const subject = aiContent.subject || `PharmaNews Weekly Digest — ${new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">

    <!-- Header -->
    <div style="background:#0a0f1e;padding:24px 32px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:28px">Pharma<span style="color:#10b981">NEWS</span></h1>
      <p style="color:#6b7280;margin:8px 0 0;font-size:12px;font-family:monospace;letter-spacing:2px">WEEKLY CLINICAL DIGEST</p>
    </div>

    <!-- Intro -->
    <div style="padding:32px;background:#f8fafc;border-bottom:2px solid #e2e8f0">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0">${aiContent.intro || "Welcome to this week's PharmaNews digest — your curated summary of the most important pharmaceutical developments."}</p>
    </div>

    <!-- Articles -->
    <div style="padding:32px">
      <h2 style="color:#0a0f1e;font-size:18px;border-bottom:2px solid #10b981;padding-bottom:8px;margin-bottom:24px">📰 Top Stories This Week</h2>
      ${articles.map(a => `
      <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #e5e7eb">
        <span style="background:#dcfce7;color:#166534;font-size:10px;font-weight:bold;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:1px">${a.category}</span>
        <h3 style="color:#111827;font-size:18px;margin:10px 0 8px;line-height:1.4">${a.title}</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 12px">${a.summary}</p>
        <a href="${SITE_URL}" style="color:#10b981;font-size:13px;font-weight:bold;text-decoration:none">Read Full Article →</a>
      </div>`).join("")}
    </div>

    <!-- Footer -->
    <div style="background:#0a0f1e;padding:24px 32px;text-align:center">
      <p style="color:#6b7280;font-size:12px;margin:0">© 2026 PharmaNews • AI-Powered Pharmaceutical Intelligence</p>
      <p style="margin:8px 0 0"><a href="${SITE_URL}" style="color:#10b981;font-size:12px">Visit PharmaNews</a></p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PharmaNews <newsletter@pharmanews.onrender.com>",
        to,
        subject,
        html
      })
    });
    return res.ok;
  } catch { return false; }
}

export async function runNewsletterGenerator(): Promise<number> {
  console.log("📧 [Phase 5] Newsletter Generator Agent starting...");

  // Get this week's top articles
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .gte("created_at", weekAgo)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!articles || articles.length === 0) {
    console.log("  ℹ️  No articles this week");
    return 0;
  }

  // Generate newsletter
  const { subject, html } = await generateNewsletterHTML(articles);

  // Get active subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("active", true);

  if (!subscribers || subscribers.length === 0) {
    console.log("  ℹ️  No subscribers yet");
    return 0;
  }

  // Send to all subscribers
  let sent = 0;
  for (const sub of subscribers) {
    const ok = await sendEmail(sub.email, subject, html);
    if (ok) sent++;
    await new Promise(r => setTimeout(r, 100));
  }

  // Save newsletter record
  await supabase.from("newsletters").insert({
    subject,
    content: html,
    recipients_count: sent,
    sent_at: new Date().toISOString()
  });

  await supabase.from("agent_logs").insert({
    agent_name: "Phase5-Newsletter",
    status: "success",
    message: `Sent newsletter to ${sent} subscribers`,
    articles_processed: articles.length,
    ran_at: new Date().toISOString()
  });

  console.log(`✅ [Phase 5] Complete! Sent newsletter to ${sent} subscribers`);
  return sent;
}
