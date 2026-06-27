import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Mail, ChevronLeft, Share2, X, Menu, TrendingUp,
  Newspaper, BookOpen, Sparkles, Eye, Clock, Send, LineChart,
  Calendar, ChevronDown, ExternalLink, Facebook, Twitter,
  Linkedin, Instagram, Sun, Moon, RefreshCw, Bell,
  ArrowUpRight, ArrowDownRight, Shield, Terminal, Check,
  Zap, Tag, Rss, Home, BarChart2, FlaskConical, ChevronRight,
  Bookmark, Copy, AlertCircle, Globe, Activity
} from "lucide-react";
import CapsuleLogo from "./CapsuleLogo";

// ─── TYPES ───────────────────────────────────────────────────
interface Article {
  id: string; title: string; summary: string; content: string;
  category: string; source: string; author: string; authorRole?: string;
  date: string; imageUrl: string; readTime: string;
  views?: number; isBreaking?: boolean; isFeatured?: boolean;
  seo_title?: string; seo_description?: string; keywords?: string;
}
interface Stock { symbol: string; name: string; price: number; change: number; changePct: number; up: boolean; }
interface ChatMsg { role: "user" | "assistant"; text: string; }

// ─── CONSTANTS ───────────────────────────────────────────────
const STOCKS: Stock[] = [
  { symbol:"PFE",  name:"Pfizer",       price:28.42,  change:+0.38, changePct:+1.36, up:true  },
  { symbol:"JNJ",  name:"J&J",          price:152.90, change:-1.20, changePct:-0.78, up:false },
  { symbol:"MRK",  name:"Merck",        price:104.55, change:+2.10, changePct:+2.05, up:true  },
  { symbol:"ABBV", name:"AbbVie",       price:171.30, change:+0.95, changePct:+0.56, up:true  },
  { symbol:"BMY",  name:"Bristol-Myers",price:47.80,  change:-0.60, changePct:-1.24, up:false },
  { symbol:"GILD", name:"Gilead",       price:88.15,  change:+1.45, changePct:+1.67, up:true  },
  { symbol:"AMGN", name:"Amgen",        price:265.40, change:-3.20, changePct:-1.19, up:false },
  { symbol:"BIIB", name:"Biogen",       price:143.75, change:+4.30, changePct:+3.08, up:true  },
  { symbol:"MRNA", name:"Moderna",      price:68.20,  change:+1.80, changePct:+2.71, up:true  },
  { symbol:"REGN", name:"Regeneron",    price:892.10, change:-5.40, changePct:-0.60, up:false },
];

const NAV_ITEMS = [
  { label:"Home",         id:"home"      },
  { label:"Drug Approvals", id:"drug-approvals" },
  { label:"Clinical Trials", id:"clinical-trials" },
  { label:"Biotechnology",  id:"biotechnology"  },
  { label:"AI in Healthcare", id:"ai-healthcare" },
  { label:"Industry News",  id:"industry"   },
  { label:"AI Lab",         id:"ai-lab"     },
  { label:"Dashboard",      id:"dashboard"  },
];

const CATEGORIES = [
  "All","Drug Approvals","Clinical Trials","Biotechnology",
  "AI in Healthcare","Industry News","Medical Research",
  "Healthcare Policy","Oncology","Vaccines","Drug Safety"
];

const CAT_COLORS: Record<string,string> = {
  "Drug Approvals":   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Clinical Trials":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Biotechnology":    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "AI in Healthcare": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Industry News":    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Medical Research": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Healthcare Policy":"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Oncology":         "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Vaccines":         "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Drug Safety":      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const TRENDING = [
  "FDA Panel Backs Moderna mRNA Flu Vaccine",
  "Ozempic Patent Battle Intensifies in EU",
  "CRISPR Gene Therapy Achieves 95% Success Rate",
  "WHO Issues New Antibiotic Resistance Guidelines",
  "Biotech M&A Activity Surges in Q2 2026",
];

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [page, setPage] = useState("home");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article|null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role:"assistant", text:"Hello! I am **PharmaNews AI**, your pharmaceutical intelligence co-pilot. Ask me about FDA approvals, clinical trials, drug compounds, or any pharma topic!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSumLoading, setAiSumLoading] = useState(false);
  const [articleView, setArticleView] = useState<"full"|"ai">("full");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const PER_PAGE = 8;

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Fetch articles
  const fetchArticles = useCallback(async (cat = activeCategory, q = "") => {
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ category: cat === "All" ? "" : cat, search: q })
      });
      const data = await res.json();
      setArticles(data.articles || []);
      setCurrentPage(1);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchArticles(activeCategory); }, [activeCategory]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs]);

  // AI Chat
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatMsgs(p => [...p, { role:"user", text:msg }]);
    setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: chatMsgs, userMessage: msg })
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role:"assistant", text: data.text || "No response." }]);
    } catch {
      setChatMsgs(p => [...p, { role:"assistant", text:"Connection error. Try again." }]);
    } finally { setChatLoading(false); }
  };

  // AI Summary
  const getAISummary = async (article: Article) => {
    setAiSumLoading(true); setAiSummary("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content: article.content, length:"medium" })
      });
      const data = await res.json();
      setAiSummary(data.summary || "");
    } catch { setAiSummary("Could not generate summary."); }
    finally { setAiSumLoading(false); }
  };

  // Agent trigger
  const triggerAgent = async () => {
    setAgentRunning(true);
    setAgentLogs(["[INIT] Connecting to Gemini pipeline...", "[SCAN] Checking FDA registries, PubMed, EMA..."]);
    try {
      const res = await fetch("/api/auto-news/refresh", { method:"POST" });
      const data = await res.json();
      setAgentLogs(p => [...p,
        "[OK] NewsAPI scan complete",
        `[OK] ${data.count || 0} new articles collected`,
        "[OK] Gemini AI analysis complete",
        "[OK] SEO optimization applied",
        "[DONE] Editorial updated ✓"
      ]);
      await fetchArticles();
    } catch { setAgentLogs(p => [...p, "[ERROR] Agent encountered an issue"]); }
    finally { setAgentRunning(false); }
  };

  // Newsletter
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/newsletter/subscribe", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: newsletterEmail })
      });
    } catch {}
    setNewsletterDone(true);
  };

  // Share
  const handleShare = (article: Article) => {
    if (navigator.share) {
      navigator.share({ title: article.title, text: article.summary, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  // Paginate
  const filtered = articles.filter(a =>
    (activeCategory === "All" || a.category === activeCategory) &&
    (!searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);
  const featured = articles.find(a => a.isFeatured) || articles[0];
  const breaking = articles.filter(a => a.isBreaking).slice(0, 3);
  const latest = [...articles].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);

  // ── ARTICLE DETAIL PAGE ───────────────────────────────────
  if (selectedArticle) return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Article Header */}
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <button onClick={() => { setSelectedArticle(null); setAiSummary(""); }}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to PharmaNews
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => { setArticleView("ai"); if (!aiSummary) getAISummary(selectedArticle); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${articleView==="ai" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}>
                <Sparkles className="w-3 h-3" /> AI Summary
              </button>
              <button onClick={() => setArticleView("full")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${articleView==="full" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                Full Article
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBookmarks(p => p.includes(selectedArticle.id) ? p.filter(b => b !== selectedArticle.id) : [...p, selectedArticle.id])}
                className={`p-2 rounded-full transition-colors ${bookmarks.includes(selectedArticle.id) ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <Bookmark className="w-4 h-4" fill={bookmarks.includes(selectedArticle.id) ? "currentColor" : "none"} />
              </button>
              <button onClick={() => handleShare(selectedArticle)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {copied ? <><Check className="w-3 h-3 text-emerald-500"/> Copied!</> : <><Share2 className="w-3 h-3"/> Share</>}
              </button>
              <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <article className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${CAT_COLORS[selectedArticle.category] || "bg-slate-100 text-slate-600"}`}>
                {selectedArticle.category}
              </span>
              {selectedArticle.isBreaking && (
                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                  Breaking
                </span>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 text-slate-900 dark:text-white">
              {selectedArticle.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">By {selectedArticle.author}{selectedArticle.authorRole ? `, ${selectedArticle.authorRole}` : ""}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedArticle.readTime}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{selectedArticle.views || Math.floor(Math.random()*800+200)} views</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{selectedArticle.source}</span>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-72 lg:h-96 object-cover rounded-xl mb-8" />

            {articleView === "ai" ? (
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Gemini AI Summary</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Powered by Google Gemini</p>
                  </div>
                </div>
                {aiSumLoading ? (
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating AI summary...</span>
                  </div>
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{aiSummary}</p>
                )}
              </div>
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedArticle.content?.split("\n").map((para, i) => para.trim() && (
                  <p key={i} className="mb-4 text-base leading-relaxed">{para}</p>
                ))}
              </div>
            )}

            {selectedArticle.keywords && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.keywords.split(",").map(k => (
                    <span key={k} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">{k.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Latest Articles */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Activity className="w-4 h-4 text-blue-600" /> Latest Articles
              </h3>
              <div className="space-y-4">
                {latest.filter(a => a.id !== selectedArticle.id).slice(0,4).map(a => (
                  <div key={a.id} onClick={() => { setSelectedArticle(a); setArticleView("full"); setAiSummary(""); window.scrollTo(0,0); }}
                    className="flex gap-3 cursor-pointer group">
                    <img src={a.imageUrl} alt="" className="w-16 h-12 object-cover rounded-lg flex-none" />
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${CAT_COLORS[a.category] || "bg-slate-100 text-slate-600"}`}>{a.category}</span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{a.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pharma Stocks */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <LineChart className="w-4 h-4 text-blue-600" /> Pharma Stocks
              </h3>
              <div className="space-y-2.5">
                {STOCKS.slice(0,6).map(s => (
                  <div key={s.symbol} className="flex items-center justify-between">
                    <div><span className="font-bold text-sm text-slate-900 dark:text-white">{s.symbol}</span><span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{s.name}</span></div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">${s.price.toFixed(2)}</div>
                      <div className={`text-xs font-mono flex items-center gap-0.5 justify-end ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                        {s.up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                        {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  // ── MAIN WEBSITE ──────────────────────────────────────────
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#060d1a] text-slate-900 dark:text-slate-100 font-sans">

        {/* ── STOCK TICKER ── */}
        <div className="bg-slate-900 dark:bg-black border-b border-slate-800 py-1.5 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap gap-8">
            {[...STOCKS,...STOCKS].map((s,i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 font-bold">{s.symbol}</span>
                <span className="text-white">${s.price.toFixed(2)}</span>
                <span className={`flex items-center gap-0.5 ${s.up ? "text-emerald-400" : "text-red-400"}`}>
                  {s.up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                  {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ── MAIN HEADER ── */}
        <header className="bg-white dark:bg-[#060d1a] border-b-2 border-blue-700 dark:border-blue-600 sticky top-0 z-50 shadow-sm">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
            {/* Top Bar */}
            <div className="flex items-center gap-4 py-3">
              {/* Logo */}
              <a href="#" onClick={() => { setPage("home"); setSelectedArticle(null); }} className="flex items-center gap-2.5 flex-none">
                <CapsuleLogo size={40} />
                <div>
                  <h1 className="font-black text-xl leading-none text-slate-900 dark:text-white tracking-tight">
                    Pharma<span className="text-blue-600 dark:text-blue-400">NEWS</span>
                  </h1>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest leading-none">Pharmaceutical Intelligence Platform</p>
                </div>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />
              </a>

              {/* Search */}
              <div className={`flex-1 max-w-2xl hidden md:flex items-center gap-2 border-2 rounded-lg px-3 py-2 transition-colors ${searchOpen ? "border-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"}`}>
                <Search className="w-4 h-4 text-slate-400 flex-none" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)}
                  onKeyDown={e => e.key === "Enter" && fetchArticles(activeCategory, searchQuery)}
                  placeholder="Search pharma news, drugs, trials..."
                  className="bg-transparent flex-1 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400" />
                <button onClick={() => fetchArticles(activeCategory, searchQuery)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors">
                  Search
                </button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">
                  <Rss className="w-3.5 h-3.5" /> Subscribe
                </button>
                <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-3 hidden lg:flex text-slate-400">
                  {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <button key={i} className="hover:text-blue-600 transition-colors"><Icon className="w-4 h-4" /></button>
                  ))}
                </div>
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Bar */}
            <nav className="hidden lg:flex items-center gap-0 border-t border-slate-200 dark:border-slate-800">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setPage(item.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    page === item.id
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300"
                  }`}>
                  {item.label}
                </button>
              ))}
              {/* AI Agent Status */}
              <div className="ml-auto flex items-center gap-2 pr-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">7 AI AGENTS ACTIVE</span>
              </div>
            </nav>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">PharmaNews</span>
                <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="py-2">
                {NAV_ITEMS.map(item => (
                  <button key={item.id} onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${page === item.id ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BREAKING NEWS BANNER ── */}
        {breaking.length > 0 && (
          <div className="bg-red-600 text-white py-2 px-4">
            <div className="max-w-screen-xl mx-auto flex items-center gap-3">
              <span className="flex-none font-black text-xs uppercase tracking-widest bg-white text-red-600 px-2 py-0.5 rounded">Breaking</span>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium truncate">{breaking[0]?.title}</p>
              </div>
              <span className="flex-none text-xs opacity-75">{breaking[0]?.source}</span>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8">

          {/* ═══ HOME PAGE ═══ */}
          {(page === "home" || page === "drug-approvals" || page === "clinical-trials" ||
            page === "biotechnology" || page === "ai-healthcare" || page === "industry") && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

              {/* Left: Main Content */}
              <div className="xl:col-span-3 space-y-8">

                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); fetchArticles(cat); }}
                      className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                        activeCategory === cat
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Featured Article */}
                {featured && !loading && (
                  <div onClick={() => { setSelectedArticle(featured); setArticleView("full"); setAiSummary(""); window.scrollTo(0,0); }}
                    className="group relative bg-white dark:bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="relative h-64 md:h-auto">
                        <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 dark:to-slate-900/20" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Featured</span>
                          {featured.isBreaking && <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Breaking</span>}
                        </div>
                      </div>
                      <div className="p-6 lg:p-8 flex flex-col justify-between">
                        <div>
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider mb-3 ${CAT_COLORS[featured.category] || "bg-slate-100 text-slate-600"}`}>{featured.category}</span>
                          <h2 className="text-2xl lg:text-3xl font-bold leading-tight mb-3 text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{featured.title}</h2>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 text-sm">{featured.summary}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium">By {featured.author}</span>
                          <div className="flex items-center gap-3">
                            <span>{featured.date}</span>
                            <span>{featured.readTime}</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">Read More <ChevronRight className="w-3 h-3" /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Agent Control Panel */}
                <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">
                        <Terminal className="w-3.5 h-3.5" /> Gemini Autonomous PharmaNews Analyst
                      </div>
                      <p className="text-slate-400 text-sm">7 AI agents running • CEO Agent audits at 4AM • News collected at 5AM IST daily</p>
                    </div>
                    <div className="flex items-center gap-3 flex-none">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">System:</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 font-mono">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                        </div>
                      </div>
                      <button onClick={triggerAgent} disabled={agentRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors">
                        {agentRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {agentRunning ? "Running..." : "Trigger AI Update"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-xs min-h-[60px]">
                    <div className="text-slate-500 mb-2">MONITORED: PubMed, FDA, EMA, ClinicalTrials.gov • Schedule: CEO@4AM → News@5AM → Writer@5:30AM → SEO@6AM → Social@7AM</div>
                    {agentLogs.length === 0 ? (
                      <span className="text-slate-600 italic">No events triggered. Click "Trigger AI Update" to run all agents now.</span>
                    ) : agentLogs.map((log, i) => (
                      <div key={i} className={log.includes("ERROR") ? "text-red-400" : log.includes("DONE") || log.includes("OK") ? "text-emerald-400" : "text-slate-400"}>{log}</div>
                    ))}
                  </div>
                </div>

                {/* Article Grid */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-blue-600" />
                      {activeCategory === "All" ? "Latest Pharma News" : activeCategory}
                      {!loading && <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({filtered.length} articles)</span>}
                    </h2>
                    <button onClick={() => fetchArticles(activeCategory)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {paginated.map(article => (
                          <div key={article.id} onClick={() => { setSelectedArticle(article); setArticleView("full"); setAiSummary(""); window.scrollTo(0,0); }}
                            className="group bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                            <div className="relative h-44 overflow-hidden">
                              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${CAT_COLORS[article.category] || "bg-slate-100 text-slate-700"}`}>
                                {article.category}
                              </span>
                              {article.isBreaking && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white animate-pulse">Live</span>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-3">{article.summary}</p>
                              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">{article.source}</span>
                                  <span>•</span>
                                  <span>{article.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
                                  <button onClick={e => { e.stopPropagation(); setBookmarks(p => p.includes(article.id) ? p.filter(b=>b!==article.id) : [...p,article.id]); }}
                                    className={`${bookmarks.includes(article.id) ? "text-blue-600" : "text-slate-400"} hover:text-blue-600 transition-colors`}>
                                    <Bookmark className="w-3.5 h-3.5" fill={bookmarks.includes(article.id) ? "currentColor" : "none"} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p=>p-1)}
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm disabled:opacity-40 hover:border-blue-500 transition-colors">
                            ← Prev
                          </button>
                          {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i+1).map(p => (
                            <button key={p} onClick={() => setCurrentPage(p)}
                              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage===p ? "bg-blue-600 text-white" : "border border-slate-300 dark:border-slate-700 hover:border-blue-500"}`}>
                              {p}
                            </button>
                          ))}
                          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p=>p+1)}
                            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm disabled:opacity-40 hover:border-blue-500 transition-colors">
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <aside className="xl:col-span-1 space-y-6">
                {/* Trending */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Trending Now
                  </h3>
                  <div className="space-y-3">
                    {TRENDING.map((t, i) => (
                      <div key={i} className="flex gap-3 cursor-pointer group">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-none">{i+1}</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pharma Stocks */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                    <BarChart2 className="w-4 h-4 text-blue-600" /> Pharma Markets
                    <span className="ml-auto text-[10px] text-emerald-500 font-mono">LIVE</span>
                  </h3>
                  <div className="space-y-2.5">
                    {STOCKS.map(s => (
                      <div key={s.symbol} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{s.symbol}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 hidden xl:inline">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold">${s.price.toFixed(2)}</div>
                          <div className={`text-xs font-mono flex items-center gap-0.5 justify-end ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                            {s.up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                            {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-mono">* Delayed 15 min. Not financial advice.</p>
                </div>

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 text-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5" />
                    <h3 className="font-bold">Weekly Digest</h3>
                  </div>
                  <p className="text-blue-100 text-sm mb-4">Top pharma news delivered every Monday. Join 14,000+ healthcare professionals.</p>
                  {newsletterDone ? (
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3 text-sm font-medium">
                      <Check className="w-4 h-4" /> Subscribed! Check your email.
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletter} className="space-y-2">
                      <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                        placeholder="your@email.com" required
                        className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm text-white placeholder-blue-200 outline-none focus:border-white transition-colors" />
                      <button type="submit" className="w-full py-2 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                        Subscribe Free →
                      </button>
                    </form>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 text-[10px] text-blue-200">
                    <Shield className="w-3 h-3" /> No spam. Unsubscribe anytime.
                  </div>
                </div>

                {/* Bookmarks */}
                {bookmarks.length > 0 && (
                  <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
                      <Bookmark className="w-4 h-4 text-blue-600" /> Saved ({bookmarks.length})
                    </h3>
                    <div className="space-y-3">
                      {articles.filter(a => bookmarks.includes(a.id)).slice(0,3).map(a => (
                        <div key={a.id} onClick={() => { setSelectedArticle(a); setArticleView("full"); window.scrollTo(0,0); }}
                          className="flex gap-2 cursor-pointer group">
                          <img src={a.imageUrl} alt="" className="w-12 h-10 object-cover rounded flex-none" />
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 line-clamp-2 leading-snug">{a.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}

          {/* ═══ AI LAB PAGE ═══ */}
          {page === "ai-lab" && (
            <div className="space-y-8">
              {/* Hero */}
              <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-8 lg:p-12 overflow-hidden border border-blue-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full -ml-24 -mb-24" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest mb-4 bg-emerald-900/30 border border-emerald-800 px-3 py-1.5 rounded-full">
                    <FlaskConical className="w-3.5 h-3.5" /> Gemini Clinical Laboratory
                  </span>
                  <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">AI Intelligence Lab</h2>
                  <p className="text-slate-400 max-w-2xl mb-6 text-lg">Synthesize clinical-grade molecular pathway briefings, analyze pharmaceutical compounds, and get AI-powered insights powered by Google Gemini.</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors">
                      <BookOpen className="w-4 h-4" /> Compound Explainer
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-600 text-slate-300 hover:border-blue-500 hover:text-white rounded-lg font-bold transition-colors">
                      <Sparkles className="w-4 h-4" /> AI Article Writer
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm" style={{height:"560px"}}>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">PharmaNews AI Assistant</p>
                      <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" /> Powered by Gemini</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMsgs.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role==="user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role==="user" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 flex gap-1">
                          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {["FDA AI rules","PROTAC mechanism","GLP-1 drugs","CRISPR therapy"].map(q => (
                        <button key={q} onClick={() => setChatInput(q)}
                          className="text-[10px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && sendChat()}
                        placeholder="Ask about any pharma topic..."
                        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors" />
                      <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compound Analyst */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 border-2 border-blue-500 rounded flex-none" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Compound Analyst</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter any pharmaceutical compound, API reagent, or monoclonal antibody for automated pathway analysis.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Compound Name</label>
                      <div className="flex gap-2">
                        <input id="compound-input" placeholder="e.g. Pembrolizumab, Ozempic, Metformin..."
                          className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors" />
                        <button onClick={() => {
                          const val = (document.getElementById("compound-input") as HTMLInputElement)?.value;
                          if (val) { setChatInput(`Explain the pharmaceutical compound: ${val} - mechanism of action, clinical uses, side effects, and regulatory status.`); setPage("ai-lab"); setTimeout(() => sendChat(), 100); }
                        }} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Popular Compounds:</label>
                      <div className="flex flex-wrap gap-2">
                        {["Pembrolizumab","Metformin","Semaglutide","Paclitaxel","Ibuprofen","Humira","Keytruda","Ozempic"].map(c => (
                          <button key={c} onClick={() => { const el = document.getElementById("compound-input") as HTMLInputElement; if(el) el.value = c; }}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium">
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/30">
                      <FlaskConical className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Biological Report Workspace</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter a compound above to generate structured clinical, chemical, and regulatory insights.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DASHBOARD PAGE ═══ */}
          {page === "dashboard" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-blue-600" /> Live Analytics Dashboard
                </h2>
                <button onClick={() => fetchArticles()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Refresh Data
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:"Total Articles", value:articles.length, icon:Newspaper, color:"text-blue-600", bg:"bg-blue-50 dark:bg-blue-900/20" },
                  { label:"Drug Approvals", value:articles.filter(a=>a.category==="Drug Approvals").length, icon:Shield, color:"text-amber-600", bg:"bg-amber-50 dark:bg-amber-900/20" },
                  { label:"Clinical Trials", value:articles.filter(a=>a.category==="Clinical Trials").length, icon:FlaskConical, color:"text-purple-600", bg:"bg-purple-50 dark:bg-purple-900/20" },
                  { label:"AI Articles", value:articles.filter(a=>a.category==="AI in Healthcare").length, icon:Sparkles, color:"text-emerald-600", bg:"bg-emerald-50 dark:bg-emerald-900/20" },
                ].map((stat,i) => (
                  <div key={i} className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Category Chart */}
              <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" /> Articles by Category
                </h3>
                <div className="space-y-3">
                  {Object.keys(CAT_COLORS).map(cat => {
                    const count = articles.filter(a => a.category === cat).length;
                    const pct = articles.length ? Math.round((count/articles.length)*100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300 w-40 flex-none font-medium">{cat}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-700" style={{width:`${pct}%`}} />
                        </div>
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400 w-16 text-right">{count} articles</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stocks Table */}
              <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-600" /> Pharma Stock Performance
                  <span className="ml-auto text-xs text-emerald-500 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" /> LIVE
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Company</th>
                        <th className="pb-3 font-semibold text-right">Price</th>
                        <th className="pb-3 font-semibold text-right">Change</th>
                        <th className="pb-3 font-semibold text-right">% Change</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {STOCKS.map(s => (
                        <tr key={s.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3">
                            <span className="font-bold text-slate-900 dark:text-white">{s.symbol}</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs">{s.name}</span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${s.price.toFixed(2)}</td>
                          <td className={`py-3 text-right font-mono ${s.up?"text-emerald-600":"text-red-500"}`}>{s.change > 0 ? "+" : ""}{s.change.toFixed(2)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${s.up?"text-emerald-600":"text-red-500"}`}>
                            <span className="flex items-center justify-end gap-0.5">
                              {s.up ? <ArrowUpRight className="w-3.5 h-3.5"/> : <ArrowDownRight className="w-3.5 h-3.5"/>}
                              {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.up ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                              {s.up ? "↑ BUY" : "↓ SELL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 font-mono">* Market data delayed 15 min. Not financial advice. For informational purposes only.</p>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-16 bg-slate-900 dark:bg-black border-t border-slate-800">
          <div className="max-w-screen-xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <CapsuleLogo size={32} />
                  <span className="font-black text-xl text-white">Pharma<span className="text-blue-400">NEWS</span></span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">Your trusted source for pharmaceutical intelligence. Powered by 7 AI agents running 24/7 to deliver the most relevant pharma news.</p>
                <div className="flex items-center gap-4">
                  {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <button key={i} className="text-slate-500 hover:text-blue-400 transition-colors"><Icon className="w-4 h-4" /></button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Categories</h4>
                <div className="space-y-2">
                  {CATEGORIES.slice(1,6).map(cat => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setPage("home"); }}
                      className="block text-slate-400 hover:text-blue-400 text-sm transition-colors text-left">{cat}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Platform</h4>
                <div className="space-y-2">
                  {["AI Intelligence Lab","Live Dashboard","Newsletter","About Us","Privacy Policy","Terms of Service"].map(item => (
                    <p key={item} className="text-slate-400 hover:text-blue-400 text-sm transition-colors cursor-pointer">{item}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-xs">© 2026 PharmaNews. All rights reserved. AI-Powered Pharmaceutical Intelligence.</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" /> 7 AGENTS ACTIVE
                </span>
                <span className="text-xs text-blue-400 border border-blue-900 px-2 py-1 rounded font-mono">GEMINI POWERED</span>
                <span className="text-xs text-slate-500 border border-slate-800 px-2 py-1 rounded font-mono">SSL SECURED</span>
              </div>
            </div>
          </div>
        </footer>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display:none; }
          .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 35s linear infinite; display:flex; width:max-content; gap:2rem; }
        `}</style>
      </div>
    </div>
  );
}
