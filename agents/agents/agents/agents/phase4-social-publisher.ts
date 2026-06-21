import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// PHASE 4 — SOCIAL MEDIA PUBLISHER AGENT
// Auto-posts top pharma news to all social platforms daily
// ============================================================

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SITE_URL = process.env.SITE_URL || "https://pharmanews.onrender.com";

async function generateCaption(article: any, platform: string): Promise<string> {
  const limits: Record<string, number> = {
    twitter: 280, facebook: 500, instagram: 300, linkedin: 600
  };

  const prompt = `Write a ${platform} post for this pharma news article. Max ${limits[platform]} characters.

Title: ${article.title}
Summary: ${article.summary}
Category: ${article.category}
Link: ${SITE_URL}

Requirements:
- Professional but engaging tone
- Include 3-5 relevant hashtags
- Include the article link at the end
- Platform style: ${platform === "twitter" ? "concise, punchy" : platform === "linkedin" ? "professional, insightful" : platform === "instagram" ? "visual, engaging" : "conversational, informative"}

Write ONLY the post text, nothing else.`;

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });
    return response.text?.trim() || `${article.title}\n\n${SITE_URL}`;
  } catch {
    return `${article.title}\n\nRead more: ${SITE_URL}\n\n#PharmaNews #Healthcare #FDA`;
  }
}

async function postToTwitter(caption: string): Promise<string | null> {
  // Twitter API v2
  const token = process.env.TWITTER_BEARER_TOKEN;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !accessToken) {
    console.log("    ⚠️  Twitter keys not configured");
    return null;
  }

  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ text: caption.substring(0, 280) })
    });
    const data = await res.json();
    return data.data?.id ? `https://twitter.com/i/web/status/${data.data.id}` : null;
  } catch { return null; }
}

async function postToLinkedIn(caption: string): Promise<string | null> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORG_ID;

  if (!token || !orgId) {
    console.log("    ⚠️  LinkedIn keys not configured");
    return null;
  }

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        author: `urn:li:organization:${orgId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: "NONE"
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      })
    });
    return res.ok ? "posted" : null;
  } catch { return null; }
}

export async function runSocialPublisher(): Promise<number> {
  console.log("📱 [Phase 4] Social Media Publisher Agent starting...");

  // Get today's top 3 articles not yet posted
  const today = new Date().toISOString().split("T")[0];
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .gte("created_at", today)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!articles || articles.length === 0) {
    console.log("  ℹ️  No new articles to post today");
    return 0;
  }

  const platforms = ["twitter", "linkedin", "facebook", "instagram"];
  let totalPosted = 0;

  for (const article of articles) {
    for (const platform of platforms) {
      // Check if already posted
      const { data: existing } = await supabase
        .from("social_posts")
        .select("id")
        .eq("article_id", article.id)
        .eq("platform", platform)
        .limit(1);

      if (existing && existing.length > 0) continue;

      console.log(`  📤 Posting to ${platform}: ${article.title?.substring(0, 40)}...`);

      // Generate caption
      const caption = await generateCaption(article, platform);

      // Post to platform
      let postUrl: string | null = null;
      if (platform === "twitter") postUrl = await postToTwitter(caption);
      if (platform === "linkedin") postUrl = await postToLinkedIn(caption);
      // Facebook & Instagram need Meta Business API (add later)

      // Save to social_posts
      await supabase.from("social_posts").insert({
        article_id: article.id,
        platform,
        caption,
        hashtags: caption.match(/#\w+/g)?.join(", ") || "",
        status: postUrl ? "posted" : "pending",
        post_url: postUrl,
        posted_at: new Date().toISOString()
      });

      if (postUrl) totalPosted++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  await supabase.from("agent_logs").insert({
    agent_name: "Phase4-SocialPublisher",
    status: "success",
    message: `Posted ${totalPosted} social media updates`,
    articles_processed: totalPosted,
    ran_at: new Date().toISOString()
  });

  console.log(`✅ [Phase 4] Complete! Posted ${totalPosted} social updates`);
  return totalPosted;
}
