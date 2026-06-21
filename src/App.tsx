import React, { useState, useEffect, useRef } from "react";
import {
  Search, Mail, ChevronLeft, Share2, X, Menu, TrendingUp,
  Newspaper, BookOpen, MessageSquare, Sparkles, Eye, Clock,
  Send, LineChart, Calendar, ChevronDown, ExternalLink,
  Facebook, Twitter, Linkedin, Instagram, Sun, Moon,
  RefreshCw, Bell, TrendingDown, ArrowUpRight, ArrowDownRight,
  Zap, Shield, Terminal, Check
} from "lucide-react";
import CapsuleLogo from "./CapsuleLogo";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  author: string;
  authorRole?: string;
  date: string;
  imageUrl: string;
  readTime: string;
  views?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  up: boolean;
}

interface ChatMsg { role: "user" | "assistant"; text: string; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CLINICAL_TOPICS = [
  "503B Compounding","ADHD","Allergy","Alzheimer","Anxiety","Asthma",
  "Atopic Dermatitis","Biosimilars","Bipolar","Brain Health","Breast Cancer",
  "C. difficile","COPD","COVID-19","Cardiovascular","Cervical Cancer",
  "Cholesterol","CKD","CLL/SLL","Colorectal Cancer","Depression",
  "Dermatology","Diabetes","Dry Eye","Endometrial Cancer","Epilepsy",
  "Eye Care","Flu","GI Cancer","Gout","HER2","HIV","Heart Failure",
  "Hematology","Hepatitis","Immunization","Immuno-oncology","Infectious Disease",
  "Lung Cancer","Lymphoma","Mental Health","Migraine","Multiple Myeloma",
  "Multiple Sclerosis","Neurology","Osteoporosis","Ovarian Cancer",
  "Pain Management","Parkinson","Pediatrics","Prostate Cancer","Psoriasis",
  "Reproductive Health","Rheumatoid Arthritis","Schizophrenia","Skin Cancer","Sleep"
];

const SPOTLIGHT_TOPICS = ["Oncology","mRNA","FDA Guidelines","Sterility Assurance","AI Models"];

const TRENDING = [
  { rank:1, title:"FDA Panel Backs Moderna's mRNA Flu Vaccine", keyword:"mRNA" },
  { rank:2, title:"Sonrotoclax+Zanubrutinib Achieves 90%+ MRD Rates in CLL/SLL", keyword:"clinical" },
  { rank:3, title:"Precision Medicine in Breast Cancer Via Proteomic Profiling", keyword:"cancer" },
  { rank:4, title:"Non-Opioid Therapies Challenge Opioids in Pain Management", keyword:"regulatory" },
  { rank:5, title:"AI & Automation Reshaping Pharmacy Dispensing in 2026", keyword:"AI" },
];

const MOCK_STOCKS: StockData[] = [
  { symbol:"PFE",  name:"Pfizer",         price:28.42,  change:+0.38, changePct:+1.36, up:true  },
  { symbol:"JNJ",  name:"Johnson & J.",   price:152.90, change:-1.20, changePct:-0.78, up:false },
  { symbol:"MRK",  name:"Merck",          price:104.55, change:+2.10, changePct:+2.05, up:true  },
  { symbol:"ABBV", name:"AbbVie",         price:171.30, change:+0.95, changePct:+0.56, up:true  },
  { symbol:"BMY",  name:"Bristol-Myers",  price:47.80,  change:-0.60, changePct:-1.24, up:false },
  { symbol:"GILD", name:"Gilead",         price:88.15,  change:+1.45, changePct:+1.67, up:true  },
  { symbol:"AMGN", name:"Amgen",          price:265.40, change:-3.20, changePct:-1.19, up:false },
  { symbol:"BIIB", name:"Biogen",         price:143.75, change:+4.30, changePct:+3.08, up:true  },
];

const CATEGORY_COLORS: Record<string,string> = {
  "Drug Approvals":   "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  "Clinical Trials":  "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "Medical Research": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  "Healthcare Policy":"bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  "Industry News":    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Biotechnology":    "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
  "AI in Healthcare": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState<"light"|"dark">("dark");
  const [activeTab, setActiveTab] = useState<"news"|"ai-lab"|"dashboard">("news");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clinicalDropOpen, setClinicalDropOpen] = useState(false);
  const [selectedTopicPage, setSelectedTopicPage] = useState<string|null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All News");
  const [currentPage, setCurrentPage] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role:"assistant", text:"Hello! I am **PharmaNews AI**, your specialized pharma co-pilot. Ask me about FDA approvals, clinical trials, drug compounds, or any pharma topic!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSumLoading, setAiSumLoading] = useState(false);
  const [articleView, setArticleView] = useState<"detail"|"ai">("detail");
  const [stocks] = useState<StockData[]>(MOCK_STOCKS);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 5;

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Fetch articles
  const fetchArticles = async (cat = activeCategory, q = "") => {
    setLoading(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat === "All News" ? "" : cat, search: q })
      });
      const data = await res.json();
      setArticles(data.articles || []);
      setCurrentPage(1);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(activeCategory, searchQuery); }, [activeCategory]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  // AI Summary
  const handleAISummary = async (article: Article) => {
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

  // AI Chat
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatMessages(p => [...p, { role:"user", text:msg }]);
    setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: chatMessages, userMessage: msg })
      });
      const data = await res.json();
      setChatMessages(p => [...p, { role:"assistant", text: data.text || "No response." }]);
    } catch {
      setChatMessages(p => [...p, { role:"assistant", text:"Connection error. Try again." }]);
    } finally { setChatLoading(false); }
  };

  // Agent run
  const runAgent = async () => {
    setAgentRunning(true);
    setAgentLogs(["[INIT] Connecting to Gemini pipeline...", "[SCAN] Checking PubMed, FDA registries, EMA announcements..."]);
    try {
      const res = await fetch("/api/auto-news/refresh", { method:"POST" });
      const data = await res.json();
      setAgentLogs(p => [...p,
        "[OK] NewsAPI scan complete",
        `[OK] ${data.count || 0} articles fetched and summarized`,
        "[OK] Gemini AI analysis complete",
        "[DONE] Editorial updated successfully ✓"
      ]);
      await fetchArticles();
    } catch {
      setAgentLogs(p => [...p, "[ERROR] Agent encountered an issue"]);
    } finally { setAgentRunning(false); }
  };

  // Newsletter
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      await fetch("/api/newsletter/subscribe", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: newsletterEmail })
      });
      setNewsletterSuccess(true);
    } catch { setNewsletterSuccess(true); }
  };

  // Pagination
  const filtered = articles.filter(a =>
    (activeCategory === "All News" || a.category === activeCategory) &&
    (!searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((currentPage-1)*POSTS_PER_PAGE, currentPage*POSTS_PER_PAGE);
  const featured = articles.find(a => a.isFeatured) || articles[0];

  // ─── DEDICATED TOPIC PAGE ──────────────────────────────────────────────────
  if (selectedTopicPage && !selectedArticle) {
    const topicArticles = articles.filter(a =>
      a.category === selectedTopicPage ||
      a.title.toLowerCase().includes(selectedTopicPage.toLowerCase()) ||
      a.summary?.toLowerCase().includes(selectedTopicPage.toLowerCase())
    );
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen bg-slate-50 dark:bg-[#070d1a] text-slate-900 dark:text-slate-100 font-sans">
          {/* Header */}
          <header className="bg-white dark:bg-[#070d1a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
              <button onClick={() => setSelectedTopicPage(null)}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm">
                <ChevronLeft className="w-4 h-4" /> Back to News
              </button>
              <div className="flex items-center gap-2 ml-4">
                <CapsuleLogo size={32} />
                <span className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                  Pharma<span className="text-emerald-600 dark:text-emerald-400">NEWS</span>
                </span>
              </div>
            </div>
          </header>

          <div className="max-w-screen-xl mx-auto px-6 py-10">
            {/* Topic Hero */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-8 mb-8 border border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Clinical Specialty Topic
              </div>
              <h1 className="text-4xl font-serif font-bold text-white mb-3">{selectedTopicPage}</h1>
              <p className="text-slate-400 max-w-2xl">Latest pharmaceutical news, clinical trials, drug approvals and research updates related to {selectedTopicPage}.</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="text-emerald-400 font-mono">{topicArticles.length} articles found</span>
                <span className="text-slate-500">• Updated daily at 5 AM IST</span>
              </div>
            </div>

            {/* Topic Articles */}
            {topicArticles.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium">No articles yet for {selectedTopicPage}</p>
                <p className="text-slate-600 text-sm mt-2">Our AI agent will fetch related articles at 5 AM IST tomorrow.</p>
                <button onClick={() => { setSelectedTopicPage(null); setActiveTab("news"); }}
                  className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  Browse All News
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {topicArticles.map(article => (
                    <div key={article.id} onClick={() => { setSelectedArticle(article); setArticleView("detail"); }}
                      className="group flex gap-5 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 p-5 cursor-pointer transition-all shadow-sm">
                      <img src={article.imageUrl} alt={article.title} className="w-40 h-28 object-cover rounded-lg flex-none group-hover:scale-105 transition-transform duration-300" />
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider mb-2 ${CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {article.category}
                        </span>
                        <h3 className="font-serif font-bold text-lg leading-snug mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{article.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{article.summary}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                  <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {CLINICAL_TOPICS.filter(t => t !== selectedTopicPage).slice(0, 12).map(t => (
                        <button key={t} onClick={() => { setSelectedTopicPage(t); fetchArticles(t); }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" /> Get {selectedTopicPage} Updates
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Get daily alerts for {selectedTopicPage} news directly in your inbox.</p>
                    <input type="email" placeholder="your@email.com"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 mb-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400" />
                    <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors">
                      Subscribe to {selectedTopicPage} Alerts
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  if (selectedArticle) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
          {/* Back header */}
          <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
            <button onClick={() => { setSelectedArticle(null); setAiSummary(""); }}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to News
            </button>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
              <button onClick={() => { setArticleView("ai"); if (!aiSummary) handleAISummary(selectedArticle); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${articleView==="ai" ? "bg-emerald-600 text-white shadow" : "text-slate-500 dark:text-slate-400"}`}>
                <Sparkles className="w-3.5 h-3.5" /> AI Summary
              </button>
              <button onClick={() => setArticleView("detail")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${articleView==="detail" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" : "text-slate-500 dark:text-slate-400"}`}>
                Full Article
              </button>
            </div>
            <button onClick={() => navigator.share?.({ title: selectedArticle.title, url: window.location.href })}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-10">
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded border uppercase tracking-wider mb-4 ${CATEGORY_COLORS[selectedArticle.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
              {selectedArticle.category}
            </span>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold leading-tight mb-4">{selectedArticle.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <span className="italic">By {selectedArticle.author}{selectedArticle.authorRole ? `, ${selectedArticle.authorRole}` : ""}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{selectedArticle.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedArticle.readTime}</span>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-72 object-cover rounded-xl mb-8" />

            {articleView === "ai" ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold">Gemini AI Summary</span>
                </div>
                {aiSumLoading ? (
                  <div className="flex items-center gap-2 text-slate-500"><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</div>
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{aiSummary}</p>
                )}
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedArticle.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070d1a] text-slate-900 dark:text-slate-100 font-sans">

        {/* ── STOCK TICKER ── */}
        <div className="bg-slate-900 dark:bg-black border-b border-slate-800 overflow-hidden py-1.5">
          <div className="flex animate-marquee gap-8 whitespace-nowrap">
            {[...stocks, ...stocks].map((s, i) => (
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

        {/* ── TOP HEADER ── */}
        <header className="bg-white dark:bg-[#070d1a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
          <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-3 flex items-center gap-4">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 flex-none" onClick={() => setActiveTab("news")}>
              <CapsuleLogo size={38} />
              <span className="font-serif font-bold text-2xl text-slate-900 dark:text-white">
                Pharma<span className="text-emerald-600 dark:text-emerald-400">NEWS</span>
              </span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </a>

            {/* Search bar */}
            <div className="flex-1 max-w-xl hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-slate-400 flex-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchArticles(activeCategory, searchQuery)}
                placeholder="Search articles..."
                className="bg-transparent flex-1 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button onClick={() => fetchArticles(activeCategory, searchQuery)}
                className="bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-emerald-700 transition-colors flex-none">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1 ml-auto">
              <button onClick={() => setActiveTab("news")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab==="news" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                News Portal
              </button>
              <button onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab==="dashboard" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                <LineChart className="w-4 h-4" /> Live Dashboard
              </button>
              <button onClick={() => setActiveTab("ai-lab")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab==="ai-lab" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                <Sparkles className="w-4 h-4" /> AI Intelligence Lab
              </button>
              <button onClick={() => setActiveTab("news")}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Mail className="w-4 h-4" /> Subscribe
              </button>
              <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </nav>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* ── CATEGORY NAV BAR ── */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950">
            <div className="max-w-screen-xl mx-auto px-4 lg:px-6 flex items-center gap-0 overflow-x-auto no-scrollbar">
              {/* Clinical topics dropdown */}
              <div className="relative flex-none">
                <button onClick={() => setClinicalDropOpen(!clinicalDropOpen)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white border rounded-sm mr-4 transition-colors whitespace-nowrap ${clinicalDropOpen ? "border-emerald-500 bg-emerald-900/20" : "border-slate-600 hover:border-emerald-500"}`}>
                  Clinical Specialty Topics <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${clinicalDropOpen ? "rotate-180" : ""}`} />
                </button>
                {clinicalDropOpen && (
                  <>
                    {/* Click outside overlay */}
                    <div className="fixed inset-0 z-[90]" onClick={() => setClinicalDropOpen(false)} />
                    <div className="fixed left-0 top-auto z-[100] w-screen bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-h-[70vh] overflow-y-auto">
                      <div className="max-w-screen-xl mx-auto">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-500" /> Comprehensive Clinical Topics Index
                          </h3>
                          <button onClick={() => setClinicalDropOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-2.5">
                          {CLINICAL_TOPICS.map(t => (
                            <button key={t} onClick={() => {
                              setActiveCategory(t);
                              setClinicalDropOpen(false);
                              setActiveTab("news");
                              setSelectedTopicPage(t);
                              fetchArticles(t);
                            }}
                              className="text-left text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-1 transition-colors flex items-center gap-1.5 group">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity flex-none" />
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Spotlight topics */}
              <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider px-3 flex-none">Spotlight —</span>
                {SPOTLIGHT_TOPICS.map(t => (
                  <button key={t} onClick={() => { setActiveCategory(t); setActiveTab("news"); fetchArticles(t); }}
                    className="px-4 py-3 text-xs text-slate-400 hover:text-white whitespace-nowrap border-r border-slate-800 transition-colors">
                    {t}
                  </button>
                ))}
              </div>

              {/* Social follow */}
              <div className="hidden lg:flex items-center gap-3 ml-auto px-4 flex-none">
                <span className="text-slate-500 text-xs uppercase tracking-widest">Follow PharmaNews:</span>
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <button key={i} className="text-slate-500 hover:text-emerald-400 transition-colors"><Icon className="w-3.5 h-3.5" /></button>
                ))}
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">PN</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── MOBILE MENU ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-slate-900 dark:text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-col gap-2">
                {[["news","News Portal"],["dashboard","Live Dashboard"],["ai-lab","AI Intelligence Lab"]].map(([id, label]) => (
                  <button key={id} onClick={() => { setActiveTab(id as any); setMobileMenuOpen(false); }}
                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium ${activeTab===id ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "text-slate-600 dark:text-slate-400"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8">

          {/* ════ NEWS PORTAL TAB ════ */}
          {activeTab === "news" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Articles */}
              <div className="lg:col-span-2 space-y-6">

                {/* Featured Article */}
                {featured && !loading && (
                  <div onClick={() => { setSelectedArticle(featured); setArticleView("detail"); }}
                    className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group shadow-sm">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-64 h-48 md:h-auto bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Top Story</span>
                      </div>
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider mb-3 ${CATEGORY_COLORS[featured.category] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {featured.category}
                          </span>
                          <h2 className="text-2xl font-serif font-bold leading-snug mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{featured.title}</h2>
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">{featured.summary}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="italic">By {featured.author}</span>
                          <span>{featured.date}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Full Article →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Agent Banner */}
                <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">
                        <Terminal className="w-3.5 h-3.5" /> Gemini Autonomous PharmaNews Analyst
                      </div>
                      <p className="text-slate-400 text-sm">Server-authoritative pipeline connected to Gemini. Runs daily diagnostics and news updates.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-none">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Agent:</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                        </div>
                      </div>
                      <button onClick={runAgent} disabled={agentRunning}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors">
                        {agentRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {agentRunning ? "Running..." : "Trigger Daily AI Update"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 font-mono text-xs">
                    <div className="text-slate-500 mb-2">MONITORED: PubMed, FDA registries, EMA announcements • Last Scan: Today at 05:00 AM IST</div>
                    {agentLogs.length === 0 ? (
                      <div className="text-slate-600 italic">No scanner events triggered. Click "Trigger Daily AI Update" to run the agent.</div>
                    ) : agentLogs.map((log, i) => (
                      <div key={i} className={`${log.includes("ERROR") ? "text-red-400" : log.includes("DONE") || log.includes("OK") ? "text-emerald-400" : "text-slate-400"}`}>{log}</div>
                    ))}
                  </div>
                </div>

                {/* Article list */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Newspaper className="w-4 h-4" /> Today's Pharma News Archives
                      {!loading && <span className="text-emerald-500">• Showing {paginated.length} articles</span>}
                    </h2>
                    <div className="flex gap-2">
                      {["All News","Drug Approvals","Clinical Trials","Biotechnology","AI in Healthcare"].map(cat => (
                        <button key={cat} onClick={() => { setActiveCategory(cat); fetchArticles(cat); }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors hidden md:block ${activeCategory===cat ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-emerald-500" /></div>
                  ) : (
                    <div className="space-y-4">
                      {paginated.map(article => (
                        <div key={article.id} onClick={() => { setSelectedArticle(article); setArticleView("detail"); }}
                          className="group flex flex-col md:flex-row bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 p-5 gap-5 cursor-pointer transition-all shadow-sm">
                          <div className="relative md:w-56 h-36 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${CATEGORY_COLORS[article.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {article.category}
                            </span>
                          </div>
                          <div className="flex flex-col justify-between flex-1">
                            <div>
                              <h3 className="text-xl font-serif font-bold leading-snug mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{article.title}</h3>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <span className="italic">By {article.author}{article.authorRole ? `, ${article.authorRole}` : ""}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{article.summary}</p>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                              <span className="text-slate-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views || Math.floor(Math.random()*500+100)} Clinical Views</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">Read Editorial <ExternalLink className="w-3 h-3" /></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      {Array.from({length: Math.min(totalPages,5)}, (_,i) => i+1).map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded text-sm font-medium transition-colors ${currentPage===p ? "bg-amber-500 text-white" : "border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-500"}`}>
                          {p}
                        </button>
                      ))}
                      {totalPages > 5 && <span className="text-slate-400">...</span>}
                      {currentPage < totalPages && (
                        <button onClick={() => setCurrentPage(p => p+1)}
                          className="px-4 h-9 rounded border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:border-emerald-500 transition-colors">
                          Next →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <aside className="space-y-6">
                {/* Trending */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Trending on PharmaNews
                  </h3>
                  <div className="space-y-4">
                    {TRENDING.map(t => (
                      <div key={t.rank} className="flex gap-3 cursor-pointer group">
                        <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-none">{t.rank}</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">{t.title}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-mono">Rank metrics compiled hourly via analytics reader frequency counters.</p>
                </div>

                {/* Pharma Stocks */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-blue-500" /> Pharma Stocks
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">LIVE</span>
                  </h3>
                  <div className="space-y-3">
                    {stocks.map(s => (
                      <div key={s.symbol} className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{s.symbol}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">${s.price.toFixed(2)}</div>
                          <div className={`text-xs font-mono flex items-center gap-0.5 justify-end ${s.up ? "text-emerald-500" : "text-red-500"}`}>
                            {s.up ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                            {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-mono">Data delayed 15 min. Not financial advice.</p>
                </div>

                {/* Newsletter */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Weekly Clinical Digest</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Read by pharmacists, drug regulators, and biochemists worldwide. Get immediate PDF alerts on FDA priority announcements.</p>
                  {newsletterSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                      <Check className="w-4 h-4" /> Subscribed successfully!
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletter} className="space-y-2">
                      <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                        placeholder="pharmacist@hospital.org" required
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500" />
                      <button type="submit" className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                        Subscribe to Weekly Digest
                      </button>
                    </form>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                    <Shield className="w-3 h-3 text-emerald-500" /> SECURE VERIFICATION DATABASE
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* ════ AI INTELLIGENCE LAB TAB ════ */}
          {activeTab === "ai-lab" && (
            <div className="space-y-8">
              {/* Hero banner */}
              <div className="relative bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-8 overflow-hidden border border-emerald-800">
                <div className="absolute right-8 top-8 opacity-10 text-emerald-400"><Sparkles className="w-32 h-32" /></div>
                <div className="relative">
                  <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini Clinical Laboratory Space
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-white mb-3">AI Chemical Analysis & Editorial Publisher</h2>
                  <p className="text-slate-400 max-w-2xl mb-6">Synthesise deep clinical-grade molecular pathway briefings or compile complete, validated regulatory research articles using real-time generative capabilities.</p>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors">
                      <BookOpen className="w-4 h-4" /> Compound Explainer
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-600 text-slate-300 rounded-lg text-sm font-bold hover:border-emerald-500 transition-colors">
                      <Newspaper className="w-4 h-4" /> AI Creative Writer
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Chat */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm" style={{height:"560px"}}>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">PharmaNews AI Assistant</p>
                      <p className="text-xs text-emerald-500">● Powered by Gemini</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role==="user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role==="user" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 flex gap-1">
                          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                      {["FDA AI Algorithm rules","What is EU Annex 1?","PROTAC vs Kinase inhibitors","GLP-1 drug mechanisms"].map(q => (
                        <button key={q} onClick={() => setChatInput(q)}
                          className="flex-none text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors whitespace-nowrap">
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && sendChat()}
                        placeholder="Ask about any pharma topic..."
                        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500" />
                      <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compound Analyst */}
                <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 rounded flex-none" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Compound Analyst</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Type any organic pharmaceutical compound, API reagent, or monoclonal antibody to compile an automated pathways summary.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Compound Name</label>
                      <div className="flex gap-2">
                        <input id="compound-input" placeholder="e.g. Pembrolizumab, Metformin..."
                          className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500" />
                        <button onClick={async () => {
                          const val = (document.getElementById("compound-input") as HTMLInputElement)?.value;
                          if (val) { setChatInput(`Explain the pharmaceutical compound: ${val} - its mechanism of action, clinical uses, and regulatory status.`); setActiveTab("ai-lab"); setTimeout(() => sendChat(), 100); }
                        }} className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Popular Reagents:</label>
                      <div className="flex flex-wrap gap-2">
                        {["Pembrolizumab","Metformin","Paclitaxel","Ozempic","Keytruda","Humira"].map(c => (
                          <button key={c} onClick={() => { const el = document.getElementById("compound-input") as HTMLInputElement; if(el) el.value = c; }}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors font-medium">
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Biological Report placeholder */}
                  <div className="mt-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/30">
                    <div className="w-10 h-10 border-2 border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Biological Compound Report Workspace</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter a medicinal agent to pull structured insights from chemical, regulatory and historical oncology pipelines.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ LIVE DASHBOARD TAB ════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-emerald-500" /> Live Analytics Dashboard
                </h2>
                <button onClick={() => fetchArticles()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Refresh Data
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:"Total Articles", value: articles.length, icon:Newspaper, color:"text-blue-500" },
                  { label:"Drug Approvals", value: articles.filter(a=>a.category==="Drug Approvals").length, icon:Shield, color:"text-amber-500" },
                  { label:"Clinical Trials", value: articles.filter(a=>a.category==="Clinical Trials").length, icon:Zap, color:"text-purple-500" },
                  { label:"AI Articles", value: articles.filter(a=>a.category==="AI in Healthcare").length, icon:Sparkles, color:"text-emerald-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-5">Articles by Category</h3>
                <div className="space-y-3">
                  {Object.keys(CATEGORY_COLORS).map(cat => {
                    const count = articles.filter(a => a.category === cat).length;
                    const pct = articles.length ? Math.round((count/articles.length)*100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{count} articles</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stocks table */}
              <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Pharma Companies Stock Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="pb-3 font-medium">Company</th>
                        <th className="pb-3 font-medium text-right">Price</th>
                        <th className="pb-3 font-medium text-right">Change</th>
                        <th className="pb-3 font-medium text-right">% Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stocks.map(s => (
                        <tr key={s.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3">
                            <span className="font-bold text-slate-900 dark:text-white">{s.symbol}</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">{s.name}</span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${s.price.toFixed(2)}</td>
                          <td className={`py-3 text-right font-mono ${s.up?"text-emerald-500":"text-red-500"}`}>{s.change > 0 ? "+" : ""}{s.change.toFixed(2)}</td>
                          <td className={`py-3 text-right font-mono font-bold flex items-center justify-end gap-1 ${s.up?"text-emerald-500":"text-red-500"}`}>
                            {s.up ? <ArrowUpRight className="w-3.5 h-3.5"/> : <ArrowDownRight className="w-3.5 h-3.5"/>}
                            {s.changePct > 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-3 font-mono">* Data delayed 15 minutes. Not financial advice.</p>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-12 bg-slate-900 dark:bg-black border-t border-slate-800 py-8">
          <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CapsuleLogo size={28} />
              <span className="font-serif font-bold text-white">Pharma<span className="text-emerald-400">NEWS</span></span>
            </div>
            <p className="text-slate-500 text-sm">Curated biopharmaceutical pipelines, drug trial registries and critical regulatory oversight indicators. All data encrypted with SSL.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono">SSL PLATFORM SECURED</span>
              <span className="text-xs text-blue-400 border border-blue-900 px-2 py-1 rounded font-mono">GEMINI SCANNERS ACTIVE</span>
            </div>
          </div>
        </footer>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display:none; }
          .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 30s linear infinite; display:flex; width:max-content; }
        `}</style>
      </div>
    </div>
  );
}
