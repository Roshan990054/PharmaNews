import React, { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  Search, 
  Bookmark, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  Share2, 
  ArrowLeft, 
  Clock, 
  Wifi, 
  Battery, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  FileCode, 
  Folder, 
  FolderOpen,
  Bell, 
  FileText,
  Eye,
  RefreshCw,
  SearchCode,
  Sliders,
  Database,
  CloudOff,
  Moon,
  Sun,
  Laptop,
  Cpu,
  BookOpen,
  BarChart3,
  MessageSquare,
  Zap,
  Activity,
  GitMerge,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ANDROID_PROJECT_FILES, AndroidFile } from "./androidFiles";

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  author: string;
  date: string;
  imageUrl: string;
  readTime: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
}

export default function App() {
  // Simulator States
  const [activeTab, setActiveTab] = useState<"home" | "search" | "saved" | "settings">("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>("All News");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("pharmanews_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState<boolean>(true); // default to elegant dark theme for medical intelligence
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [cacheSize, setCacheSize] = useState<string>("50 MB");
  const [autoRefresh, setAutoRefresh] = useState<string>("Every 15 mins");
  
  // Simulation Network controls
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>("local-cache");

  // Notifications Feed state (simulated FCM)
  const [fcmNotifications, setFcmNotifications] = useState<{ id: number; title: string; body: string }[]>([]);

  // Studio Inspector States
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[0]);
  const [copiedFileId, setCopiedFileId] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Gradle": true,
    "Manifest": true,
    "Resources": false,
    "Layouts": false,
    "Kotlin Arch": true
  });

  const categoriesList = [
    "All News",
    "Drug Approvals",
    "Clinical Trials",
    "Medical Research",
    "Healthcare Policy",
    "Industry News",
    "COVID-19 Updates",
    "Biotechnology",
    "AI in Healthcare"
  ];

  // --- CO-PILOT WORKSPACE MODES ---
  const [workspaceMode, setWorkspaceMode] = useState<"ai-lab" | "android-studio">("ai-lab");
  const [selectedSubMode, setSelectedSubMode] = useState<
    "summarization" | "categorization" | "recommendations" | "chatbot" | "simplification" | "trends" | "deduplication" | "smart-search"
  >("chatbot");

  // --- PHONE EMULATOR IN-APP AI DYNAMIC CONTROLS ---
  const [activeReadingLevel, setActiveReadingLevel] = useState<"original" | "student" | "professional" | "researcher">("original");
  const [activeSummaryFormat, setActiveSummaryFormat] = useState<"none" | "short" | "medium" | "detailed">("none");
  const [emulatorSummaryText, setEmulatorSummaryText] = useState<string>("");
  const [emulatorSummaryLoading, setEmulatorSummaryLoading] = useState<boolean>(false);
  const [emulatorArticleText, setEmulatorArticleText] = useState<string>("");
  const [emulatorArticleLoading, setEmulatorArticleLoading] = useState<boolean>(false);

  // --- 1. SUMMARIZATION WORKSPACE STATES ---
  const [summaryTargetArticleId, setSummaryTargetArticleId] = useState<string>("1");
  const [summaryFormat, setSummaryFormat] = useState<"short" | "medium" | "detailed">("medium");
  const [summarizedText, setSummarizedText] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryLocalFallback, setSummaryLocalFallback] = useState<boolean>(false);

  // --- 2. CATEGORIZATION WORKSPACE STATES ---
  const [categorizeArticleId, setCategorizeArticleId] = useState<string>("1");
  const [classifiedScores, setClassifiedScores] = useState<{ category: string; confidence: number }[]>([]);
  const [classifyLoading, setClassifyLoading] = useState<boolean>(false);
  const [classifyLocalFallback, setClassifyLocalFallback] = useState<boolean>(false);

  // --- 3. RECOMMENDATIONS WORKSPACE STATES ---
  const [usrRole, setUsrRole] = useState<string>("Pharmaceutical Researcher");
  const [usrTags, setUsrTags] = useState<string[]>(["Biotechnology", "Drug Approvals"]);
  const [recommendedItems, setRecommendedItems] = useState<{ article: Article; recommendationScore: number; reason: string }[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState<boolean>(false);
  const [recommendationLocalFallback, setRecommendationLocalFallback] = useState<boolean>(false);

  // --- 4. CHATBOT WORKSPACE STATES ---
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string; citations?: string[]; isFallback?: boolean }>>([
    {
      role: "assistant",
      text: "Hello! I am **PharmaNews AI**, your intelligent clinical co-pilot. I can analyze recent clinical trials, summarize drug clearance endpoints, parse medical research, and review international health policy parameters.\n\n*DISCLAIMER: I am an AI information assistant, not a clinical prescription generator. I cannot issue treatment directions or clinical medical advice.*",
      citations: ["PharmaNews Core System"]
    }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // --- 5. SIMPLIFICATION WORKSPACE STATES ---
  const [simplifyTargetArticleId, setSimplifyTargetArticleId] = useState<string>("3");
  const [simplifyMode, setSimplifyMode] = useState<"student" | "professional" | "researcher">("student");
  const [simplifiedResultText, setSimplifiedResultText] = useState<string>("");
  const [simplifyLoading, setSimplifyLoading] = useState<boolean>(false);
  const [simplifyLocalFallback, setSimplifyLocalFallback] = useState<boolean>(false);

  // --- 6. TREND DETECTION WORKSPACE STATES ---
  const [trendsData, setTrendsData] = useState<any>(null);
  const [trendsLoading, setTrendsLoading] = useState<boolean>(false);
  const [trendsLocalFallback, setTrendsLocalFallback] = useState<boolean>(false);

  // --- 7. DUPLICATE DETECTION WORKSPACE STATES ---
  const [dupArticleIdA, setDupArticleIdA] = useState<string>("2");
  const [dupArticleIdB, setDupArticleIdB] = useState<string>("7");
  const [dupMergeResult, setDupMergeResult] = useState<any>(null);
  const [dupMergeLoading, setDupMergeLoading] = useState<boolean>(false);

  // --- 8. SMART SEMANTIC SEARCH WORKSPACE STATES ---
  const [smartSearchQuery, setSmartSearchQuery] = useState<string>("Latest weight-loss clinical trials");
  const [smartSearchResults, setSmartSearchResults] = useState<Array<{ article: Article; semanticMatchScore: number; semanticReason: string }>>([]);
  const [smartSearchLoading, setSmartSearchLoading] = useState<boolean>(false);
  const [smartSearchLocalFallback, setSmartSearchLocalFallback] = useState<boolean>(false);

  // Fetch articles from full-stack api
  const fetchArticles = async (categoryName = currentCategory, search = "") => {
    if (offlineMode) {
      setApiSource("offline-room-cache");
      return; 
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          search: search
        })
      });
      const data = await response.json();
      if (search) {
        setSearchResults(data.articles || []);
      } else {
        setArticles(data.articles || []);
      }
      setApiSource(data.source || "local-cache");
    } catch (error) {
      console.error("Failed to load news from backend API:", error);
      setApiSource("fallback-cache");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(currentCategory);
  }, [currentCategory, offlineMode]);

  useEffect(() => {
    if (searchQuery) {
      fetchArticles(currentCategory, searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Sync simulator modified text when selectedArticle changes
  useEffect(() => {
    if (selectedArticle) {
      setEmulatorArticleText(selectedArticle.content);
      setActiveReadingLevel("original");
      setActiveSummaryFormat("none");
      setEmulatorSummaryText("");
    } else {
      setEmulatorArticleText("");
    }
  }, [selectedArticle]);

  // Persists bookmarks
  useEffect(() => {
    localStorage.setItem("pharmanews_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarks(prev => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter(b => b !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFileId(true);
    setTimeout(() => {
      setCopiedFileId(false);
    }, 2000);
  };

  // ==========================================
  // --- INTEGRATED CLINICAL AI SUITE API CALLS ---
  // ==========================================

  // Feature 1: Summarize selected news article in playground
  const handleGetAILabSummary = async () => {
    const art = articles.find(a => a.id === summaryTargetArticleId) || articles[0];
    if (!art) return;
    
    setSummaryLoading(true);
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: art.content,
          length: summaryFormat
        })
      });
      const data = await response.json();
      setSummarizedText(data.summary || "");
      setSummaryLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setSummarizedText("An unexpected error occurred during summarization.");
      setSummaryLocalFallback(true);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Feature 2: Automatic News Categorization in playground
  const handleGetAILabClassification = async () => {
    const art = articles.find(a => a.id === categorizeArticleId) || articles[0];
    if (!art) return;

    setClassifyLoading(true);
    try {
      const response = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: art.title,
          content: art.summary
        })
      });
      const data = await response.json();
      setClassifiedScores(data.categories || []);
      setClassifyLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setClassifyLocalFallback(true);
    } finally {
      setClassifyLoading(false);
    }
  };

  // Feature 3: Personalized Recommendations
  const handleGetAILabRecommendations = async () => {
    setRecommendationLoading(true);
    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: usrRole,
          interests: usrTags
        })
      });
      const data = await response.json();
      setRecommendedItems(data.recommendations || []);
      setRecommendationLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setRecommendationLocalFallback(true);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // Feature 4: Interactive AI Chatbot Communication
  const handleSendAIChatQuery = async (customQuery?: string) => {
    const queryToSend = customQuery || chatInput;
    if (!queryToSend.trim()) return;

    const userMsg = { role: "user" as const, text: queryToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Package messages for full context
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          userMessage: queryToSend
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: data.text || "Unable to calculate response indices.",
        citations: data.citations || [],
        isFallback: !!data.localFallback
      }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: "Pipeline latency detected. Restoring fallback operations...",
        citations: ["System Fault handler"],
        isFallback: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Feature 5: Scientific Language Simplification in playground
  const handleGetAILabSimplification = async () => {
    const art = articles.find(a => a.id === simplifyTargetArticleId) || articles[0];
    if (!art) return;

    setSimplifyLoading(true);
    try {
      const response = await fetch("/api/ai/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: art.content,
          mode: simplifyMode
        })
      });
      const data = await response.json();
      setSimplifiedResultText(data.rewritten || "");
      setSimplifyLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setSimplifyLocalFallback(true);
    } finally {
      setSimplifyLoading(false);
    }
  };

  // Feature 6: Emerging Trend Detection fetches on request
  const handleFetchTrendsReport = async () => {
    setTrendsLoading(true);
    try {
      const response = await fetch("/api/ai/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setTrendsData(data.trends || null);
      setTrendsLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setTrendsLocalFallback(true);
    } finally {
      setTrendsLoading(false);
    }
  };

  // Feature 7: Duplicate Merging Comparisons
  const handleGetAILabSmartMerge = async () => {
    setDupMergeLoading(true);
    try {
      const response = await fetch("/api/ai/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIdA: dupArticleIdA,
          articleIdB: dupArticleIdB
        })
      });
      const data = await response.json();
      setDupMergeResult(data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setDupMergeLoading(false);
    }
  };

  // Feature 8: Smart Semantic Search
  const handleGetAILabSmartSearch = async () => {
    if (!smartSearchQuery.trim()) return;
    setSmartSearchLoading(true);
    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: smartSearchQuery
        })
      });
      const data = await response.json();
      setSmartSearchResults(data.results || []);
      setSmartSearchLocalFallback(!!data.localFallback);
    } catch (e) {
      console.error(e);
      setSmartSearchLocalFallback(true);
    } finally {
      setSmartSearchLoading(false);
    }
  };

  // --- PHONE EMULATOR INTEGRATED COMPASS ---
  const handleGetEmulatorReadingMode = async (level: "original" | "student" | "professional" | "researcher") => {
    if (!selectedArticle) return;
    setActiveReadingLevel(level);

    if (level === "original") {
      setEmulatorArticleText(selectedArticle.content);
      return;
    }

    setEmulatorArticleLoading(true);
    try {
      const response = await fetch("/api/ai/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedArticle.content,
          mode: level
        })
      });
      const data = await response.json();
      setEmulatorArticleText(data.rewritten || selectedArticle.content);
    } catch (e) {
      console.error(e);
      setEmulatorArticleText(selectedArticle.content);
    } finally {
      setEmulatorArticleLoading(false);
    }
  };

  const handleGetEmulatorSummary = async (format: "none" | "short" | "medium" | "detailed") => {
    if (!selectedArticle) return;
    setActiveSummaryFormat(format);

    if (format === "none") {
      setEmulatorSummaryText("");
      return;
    }

    setEmulatorSummaryLoading(true);
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedArticle.content,
          length: format
        })
      });
      const data = await response.json();
      setEmulatorSummaryText(data.summary || "");
    } catch (e) {
      console.error(e);
      setEmulatorSummaryText("Failed to retrieve summary.");
    } finally {
      setEmulatorSummaryLoading(false);
    }
  };

  // Lazy trigger of individual AI features when their workspace tab is selected to avoid 429 rate limit errors on mount
  useEffect(() => {
    if (articles.length === 0 || workspaceMode !== "ai-lab") return;

    switch (selectedSubMode) {
      case "summarization":
        if (!summarizedText && !summaryLoading) {
          handleGetAILabSummary();
        }
        break;
      case "categorization":
        if (classifiedScores.length === 0 && !classifyLoading) {
          handleGetAILabClassification();
        }
        break;
      case "recommendations":
        if (recommendedItems.length === 0 && !recommendationLoading) {
          handleGetAILabRecommendations();
        }
        break;
      case "trends":
        if (!trendsData && !trendsLoading) {
          handleFetchTrendsReport();
        }
        break;
      case "deduplication":
        if (!dupMergeResult && !dupMergeLoading) {
          handleGetAILabSmartMerge();
        }
        break;
      case "smart-search":
        if (smartSearchResults.length === 0 && !smartSearchLoading) {
          handleGetAILabSmartSearch();
        }
        break;
      default:
        break;
    }
  }, [selectedSubMode, articles, workspaceMode]);

  const triggerFcmNotification = () => {
    if (!notificationsEnabled) return;

    const breakthroughs = [
      {
        title: "🚨 BREAKING FDA APPROVAL",
        body: "FDA approves LY-90021 daily pill achieving 18.2% BMI weight-loss indexes."
      },
      {
        title: "🧬 CRISPR CLINICAL ADVANCE",
        body: "Cas12-LNPs cross Blood-Brain Barrier to deactivate glial PLK1 oncogenes."
      },
      {
        title: "🏭 GLOBAL DRUG ALLIANCE",
        body: "Zurich Declaration signed by 40 nations to subsidize critical API manufacturing."
      }
    ];

    const chosen = breakthroughs[Math.floor(Math.random() * breakthroughs.length)];
    const newNotif = {
      id: Date.now(),
      ...chosen
    };

    setFcmNotifications(prev => [newNotif, ...prev]);

    // Play default system sound context if allowed
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 chord tone
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio sandbox limits ignored
    }

    // Auto dismiss notification banner after 6 seconds
    setTimeout(() => {
      setFcmNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 6000);
  };

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const activeArticleIsBookmarked = selectedArticle ? bookmarks.includes(selectedArticle.id) : false;

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans geometric-dots">
      
      {/* Top Professional Portal Header */}
      <header className="border-b border-slate-850 bg-[#0B0F19]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] rounded-lg border border-white/10 shadow-lg text-white">
            <SearchCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-extrabold text-xl tracking-wider text-white">
                PHARMA<span className="text-[#06B6D4]">NEWS</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-slate-900 text-cyan-400 border border-cyan-500/20 font-mono">
                SDK 34
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-400">Architect Platform & Core Emulator</p>
          </div>
        </div>

        {/* System Simulation Control Center */}
        <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-1.5 rounded-lg shadow-sm">
          {/* Offline/Online toggle */}
          <button 
            onClick={() => setOfflineMode(!offlineMode)}
            className={`flex items-center space-x-1.5 text-[10px] tracking-wider uppercase font-display px-3 py-1.5 rounded-[4px] transition cursor-pointer font-bold ${
              offlineMode 
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
            title="Toggle offline cache simulation"
          >
            {offlineMode ? <CloudOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{offlineMode ? "Offline Cache" : "Connected API"}</span>
          </button>

          {/* FCM Push Notification Trigger */}
          <button
            onClick={triggerFcmNotification}
            disabled={!notificationsEnabled}
            className={`flex items-center space-x-1 py-1.5 px-3 text-[10px] font-bold tracking-wider uppercase font-display rounded-[4px] transition-all cursor-pointer ${
              notificationsEnabled 
                ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border border-blue-500" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850"
            }`}
            title="Simulate push notification sent from server"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Mock FCM Push</span>
          </button>
        </div>
      </header>

      {/* Main Two-Panel Dynamic Dashboard */}
      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto p-4 lg:p-6 gap-6 overscroll-contain">
        
        {/* PANEL 1: THE INTERACTIVE SMARTPHONE EMULATOR */}
        <section className="flex-1 lg:max-w-md flex flex-col items-center">
          
          <div className="relative w-full max-w-[390px] aspect-[9/19.5] bg-[#020617] rounded-[50px] p-3.5 shadow-[0_0_50px_rgba(59,130,246,0.15)] border-[5px] border-slate-800 shadow-blue-950/20 ring-1 ring-slate-800">
            {/* Speaker hole / camera notch */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-40 flex items-center justify-center border border-slate-900/60 shadow-inner">
              <div className="w-2.5 h-2.5 bg-[#0f172a] rounded-full border border-slate-800 ml-1"></div>
              <div className="w-12 h-1 bg-[#1e293b] rounded-full ml-auto mr-4"></div>
            </div>

            {/* Android Screen Body */}
            <div className={`w-full h-full rounded-[38px] overflow-hidden flex flex-col relative ${
              darkMode ? "bg-[#0B0F19] text-slate-100" : "bg-slate-50 text-slate-900"
            } transition-colors duration-350`}>
              
              {/* Android Custom Status Bar */}
              <div className={`h-11 px-6 pt-6 flex justify-between items-center text-xs font-mono font-medium relative z-30 select-none ${
                darkMode ? "text-slate-400 bg-[#0B0F19]" : "text-slate-650 bg-slate-100"
              } border-b ${darkMode ? "border-slate-900/60" : "border-slate-200"}`}>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 mr-0.5" />
                  <span>09:41</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono tracking-wider font-bold">5G</span>
                  {offlineMode ? <CloudOff className="w-3 h-3 text-amber-500 animate-pulse" /> : <Wifi className="w-3 h-3 text-emerald-500" />}
                  <Battery className="w-4 h-3.5" />
                </div>
              </div>

              {/* SIMULATED PUSH NOTIFICATION ALERTS OVERLAY */}
              <div className="absolute top-12 left-0 right-0 px-3 z-50 pointer-events-none">
                <AnimatePresence>
                  {fcmNotifications.map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: -50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="bg-slate-900/95 backdrop-blur-md shadow-xl border border-blue-500/20 text-white rounded-2xl p-3.5 mb-2 flex items-start space-x-2.5 pointer-events-auto"
                    >
                      <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Bell className="w-4 h-4 animate-bounce" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate text-blue-300">{n.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{n.body}</p>
                      </div>
                      <button 
                        onClick={() => setFcmNotifications(prev => prev.filter(item => item.id !== n.id))}
                        className="text-slate-400 hover:text-white text-[10px] bg-slate-800/60 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* EMULATOR SCREEN CONTENT PORT (Controlled by navigation/tabs) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-16">
                
                {/* 1. VIEWING FULL ARTICLE DETAIL PAGE */}
                {selectedArticle ? (
                  <div className="flex flex-col h-full bg-slate-150/10 dark:bg-slate-950/20 font-sans">
                    <div className="relative h-44 bg-slate-800 flex-shrink-0 border-b border-slate-200 dark:border-slate-950">
                      <img 
                        src={selectedArticle.imageUrl} 
                        alt="Article Cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3">
                        <button
                          onClick={() => setSelectedArticle(null)}
                          className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer border border-white/10"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-widest uppercase font-bold text-[#06B6D4] font-display">
                          {selectedArticle.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-900/60 px-1.5 py-0.5 rounded-[2px] border border-slate-350 dark:border-slate-850">
                          {selectedArticle.readTime || "4 min"}
                        </span>
                      </div>
                      <h2 className="text-sm font-display font-medium leading-snug mt-1.5 text-slate-900 dark:text-slate-100">
                        {selectedArticle.title}
                      </h2>

                      {/* Author Card line */}
                      <div className="mt-3 py-2 px-3 bg-slate-100/80 dark:bg-[#0F172A] border-l-2 border-[#3B82F6] rounded-[4px] flex flex-col border border-y-slate-200 dark:border-y-slate-850/40 border-r-slate-200 dark:border-r-slate-850/40">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                          {selectedArticle.author}
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-450 dark:text-slate-500 mt-0.5">
                          {selectedArticle.source} • {selectedArticle.date}
                        </span>
                      </div>

                      {/* --- IN-APP ADVANCED CLINICAL AI INTEGRATION BAR --- */}
                      <div className="mt-4 p-3 bg-slate-100/90 dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-850 rounded-[8px] space-y-3 font-sans shadow-inner">
                        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-cyan-400 font-mono tracking-wider uppercase">
                          <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                          <span>M3 Clinical AI Assistance</span>
                        </div>

                        {/* Feature A: Reading Level / Simplified Modes */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Scientific Reading Mode:</span>
                            {emulatorArticleLoading && <span className="text-[8.5px] text-cyan-400 animate-pulse font-mono font-bold">REWRITING VIA GEMINI...</span>}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {(["original", "student", "professional", "researcher"] as const).map(lvl => (
                              <button
                                key={lvl}
                                onClick={() => handleGetEmulatorReadingMode(lvl)}
                                className={`text-[8.5px] font-mono font-bold py-1 px-1 rounded-[3px] border transition cursor-pointer ${
                                  activeReadingLevel === lvl
                                    ? "bg-slate-900 border-cyan-500 text-cyan-400 dark:bg-cyan-500/15 dark:border-cyan-500"
                                    : "bg-slate-205 border-slate-300 dark:bg-slate-950/40 dark:border-slate-850 text-slate-500 hover:text-slate-200"
                                }`}
                              >
                                {lvl.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Feature B: In-App News Summarization format */}
                        <div className="space-y-1 border-t border-slate-200/50 dark:border-slate-800/40 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Instant Summary Level:</span>
                            {emulatorSummaryLoading && <span className="text-[8.5px] text-cyan-400 animate-pulse font-mono font-bold">CONDENSING VIA GEMINI...</span>}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {(["none", "short", "medium", "detailed"] as const).map(fmt => (
                              <button
                                key={fmt}
                                onClick={() => handleGetEmulatorSummary(fmt)}
                                className={`text-[8.5px] font-mono font-bold py-1 px-1 rounded-[3px] border transition cursor-pointer ${
                                  activeSummaryFormat === fmt
                                    ? "bg-slate-900 border-cyan-500 text-cyan-400 dark:bg-cyan-500/15 dark:border-cyan-500"
                                    : "bg-slate-205 border-slate-300 dark:bg-slate-950/40 dark:border-slate-850 text-slate-500 hover:text-slate-200"
                                }`}
                              >
                                {fmt === "none" ? "OFF" : fmt.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary Display Box if active */}
                      {activeSummaryFormat !== "none" && emulatorSummaryText && (
                        <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-400/25 rounded-[6px] text-[10.5px] leading-relaxed select-text font-sans">
                          <div className="flex items-center space-x-1.5 text-cyan-400 font-mono text-[9px] font-bold tracking-widest uppercase mb-1">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>AI Summary Analysis ({activeSummaryFormat})</span>
                          </div>
                          <div className="text-slate-700 dark:text-slate-300">{emulatorSummaryText}</div>
                        </div>
                      )}

                      {/* Main Readable Article Body */}
                      <div className={`mt-4 border-t border-slate-200/20 dark:border-slate-800/45 pt-4 ${emulatorArticleLoading ? "opacity-40 animate-pulse" : "opacity-100 transition-opacity duration-300"}`}>
                        <p className="text-[11px] leading-relaxed text-slate-650 dark:text-slate-300 whitespace-pre-line font-medium">
                          {emulatorArticleText}
                        </p>
                      </div>

                      {/* Read Original Mock button */}
                      <div className="mt-6 flex space-x-2.5 pb-8">
                        <button
                          onClick={() => triggerFcmNotification()}
                          className="flex-1 py-1.5 text-center text-[11.5px] font-display font-medium border border-slate-300 dark:border-slate-800 hover:border-[#3B82F6] text-slate-700 dark:text-slate-300 hover:text-[#3B82F6] rounded-[4px] transition duration-200 cursor-pointer text-xs"
                        >
                          Share Reference
                        </button>
                        <button
                          onClick={() => {
                            alert("This simulates launching an Android Intent opening the original publisher website in Google Chrome!");
                          }}
                          className="flex-1 py-1.5 text-center text-[11.5px] font-display font-medium bg-[#3B82F6] text-white hover:bg-blue-500 rounded-[4px] transition duration-200 shadow-md shadow-blue-500/10 cursor-pointer text-xs"
                        >
                          Original Source
                        </button>
                      </div>
                    </div>

                    {/* Bookmark Floating button inside simulator */}
                    <button
                      onClick={() => toggleBookmark(selectedArticle.id)}
                      className="absolute bottom-20 right-4 p-3 rounded-full bg-[#06B6D4] text-white shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer z-20 border border-cyan-400/20"
                    >
                      <Bookmark className={`w-4 h-4 ${activeArticleIsBookmarked ? "fill-white" : ""}`} />
                    </button>
                  </div>
                ) : (
                  /* 2. TAB SELECTION CONTENT SCREEN */
                  <div className="flex-1 flex flex-col p-4">
                    
                    {/* HOME TAB SCREEN */}
                    {activeTab === "home" && (
                      <div className="flex flex-col space-y-4 font-sans">
                        {/* Title Bar */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white tracking-wide">
                            PharmaNews Hub
                          </h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-[4px] bg-[#06B6D4]/10 text-[#06B6D4] font-mono font-bold uppercase border border-cyan-500/10">
                            db: {apiSource}
                          </span>
                        </div>

                        {/* Category Horizontal scroll */}
                        <div className="flex space-x-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
                          {categoriesList.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setCurrentCategory(cat)}
                              className={`text-[10px] px-3 py-1.5 rounded-[4px] whitespace-nowrap font-display font-medium tracking-wide transition cursor-pointer border ${
                                currentCategory === cat 
                                  ? "bg-[#3B82F6] text-white border-[#3B82F6] font-bold" 
                                  : "bg-slate-200/50 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800 border-slate-300/40 dark:border-slate-850"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Network Warning Banner if Offline mode is active */}
                        {offlineMode && (
                          <div className="bg-amber-500/5 border border-amber-500/20 text-amber-500 p-2.5 rounded-[4px] flex items-start space-x-2">
                            <CloudOff className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div className="text-[10px]">
                              <p className="font-bold uppercase tracking-wider font-display">Offline Cache Active</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Showing SQLite Room database CachedArticleEntities.</p>
                            </div>
                          </div>
                        )}

                        {/* Featured article (First item in list if not empty) */}
                        {!isLoading && articles.length > 0 && (
                          <div 
                            onClick={() => setSelectedArticle(articles[0])}
                            className="bg-white dark:bg-slate-900 rounded-[12px] overflow-hidden border border-slate-250 dark:border-slate-850 p-2.5 hover:border-[#3B82F6] dark:hover:border-[#3B82F6]/60 transition duration-300 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.03)] dark:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px]"
                          >
                            <div className="relative h-28 rounded-[8px] overflow-hidden bg-slate-850">
                              <img 
                                src={articles[0].imageUrl} 
                                alt="Featured News Image" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-2 left-2 text-[8px] font-display font-bold tracking-widest uppercase bg-[#06B6D4] text-white px-2 py-0.5 rounded-[2px]">
                                FEATURED RESEARCH
                              </span>
                            </div>
                            <span className="text-[8.5px] font-mono font-bold text-[#3B82F6] uppercase mt-2 block tracking-wider">
                              {articles[0].category}
                            </span>
                            <h4 className="text-xs font-display font-bold leading-normal mt-0.5 text-slate-900 dark:text-slate-100">
                              {articles[0].title}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {articles[0].summary}
                            </p>
                          </div>
                        )}

                        {/* SKELETON SHIMMER PLACEHOLDERS */}
                        {isLoading && (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="bg-slate-200/45 dark:bg-slate-900/40 p-2.5 rounded-[8px] border border-slate-200/50 dark:border-slate-850 flex space-x-3 animate-pulse">
                                <div className="flex-1 space-y-2">
                                  <div className="h-2.5 bg-slate-300 dark:bg-slate-800 rounded w-20"></div>
                                  <div className="h-3.5 bg-slate-300 dark:bg-slate-800 rounded"></div>
                                  <div className="h-3.5 bg-slate-300 dark:bg-slate-800 rounded w-4/5"></div>
                                </div>
                                <div className="w-14 h-14 bg-slate-300 dark:bg-slate-800 rounded-[6px]"></div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ARTICLES LIST */}
                        {!isLoading && (
                          <div className="space-y-2">
                            {articles.map((item, index) => {
                              // Skip index 0 as featured
                              if (index === 0 && articles.length > 1) return null;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => setSelectedArticle(item)}
                                  className="bg-white dark:bg-slate-900 rounded-[10px] p-2.5 border border-slate-200 dark:border-slate-850 flex items-start space-x-3 cursor-pointer hover:border-[#3B82F6]/60 dark:hover:border-[#3B82F6]/40 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.02)] hover:translate-y-[-1px]"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[8.5px] font-mono font-bold text-[#06B6D4] capitalize tracking-wide">
                                        {item.category}
                                      </span>
                                      <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">
                                        {item.date}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-display font-medium leading-normal mt-0.5 text-slate-900 dark:text-slate-100 line-clamp-2">
                                      {item.title}
                                    </h4>
                                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1 block truncate">
                                      {item.source} • {item.author}
                                    </span>
                                  </div>
                                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-[6px] overflow-hidden flex-shrink-0 border border-slate-200/5 animate-none">
                                    <img 
                                      src={item.imageUrl} 
                                      alt="Thumbnail" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEARCH TAB SCREEN */}
                    {activeTab === "search" && (
                      <div className="flex flex-col space-y-4 font-sans">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white tracking-wide">
                          Index Database Search
                        </h3>

                        {/* Search Input Box */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search clinical registries, drugs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-[11px] rounded-[6px] border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] text-slate-900 dark:text-slate-100 placeholder-slate-400 font-sans"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                        </div>

                        {/* Search Results list */}
                        {searchQuery ? (
                          isLoading ? (
                            <div className="text-center py-8 text-xs text-slate-450 font-mono animate-pulse">
                              searching room database indices...
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {searchResults.map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => setSelectedArticle(item)}
                                  className="bg-white dark:bg-slate-900 rounded-[8px] p-2.5 border border-slate-200 dark:border-slate-850 flex items-start space-x-3 cursor-pointer hover:border-[#3B82F6] transition-all shadow-sm"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[8px] font-mono font-bold text-[#06B6D4] uppercase tracking-wider">
                                      {item.category}
                                    </span>
                                    <h4 className="text-xs font-display font-medium leading-normal mt-0.5 text-slate-900 dark:text-slate-100 line-clamp-2">
                                      {item.title}
                                    </h4>
                                  </div>
                                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-[4px] overflow-hidden flex-shrink-0 border border-slate-200/10">
                                    <img 
                                      src={item.imageUrl} 
                                      alt="Thumbnail" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ))}
                              {searchResults.length === 0 && (
                                <p className="text-center py-6 text-xs text-slate-400 font-mono">
                                  No records match search sequence.
                                </p>
                              )}
                            </div>
                          )
                        ) : (
                          /* Pre-search recommendations */
                          <div className="space-y-3 pt-1">
                            <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#3B82F6] block">
                              Suggested Clinical Parameters
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {["FDA Approvals", "LY-90021", "GLP-1 Weight Loss", "CRISPR Neuromuscular", "Avian H5N1", "Synthetic Mitochondria"].map(s => (
                                <button
                                  key={s}
                                  onClick={() => setSearchQuery(s)}
                                  className="text-[10px] bg-slate-250 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300/40 dark:border-slate-850 px-2.5 py-1.5 rounded-[4px] text-slate-700 dark:text-slate-350 cursor-pointer font-sans transition"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BOOKMARKS / SAVED SCREEN */}
                    {activeTab === "saved" && (
                      <div className="flex flex-col space-y-4 font-sans">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white tracking-wide">
                          Room SQLite Journals ({bookmarks.length})
                        </h3>

                        <div className="space-y-2">
                          {articles.filter(a => bookmarks.includes(a.id)).map(item => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedArticle(item)}
                              className="bg-white dark:bg-slate-900 rounded-[10px] p-2.5 border border-slate-250 dark:border-slate-850 flex items-start space-x-3 cursor-pointer hover:border-[#3B82F6] transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-mono font-bold text-[#10B981] uppercase tracking-wider block">
                                  CACHED FOR OFFLINE
                                </span>
                                <h4 className="text-xs font-display font-medium leading-normal mt-0.5 text-slate-900 dark:text-slate-100 line-clamp-2">
                                  {item.title}
                                </h4>
                              </div>
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-[6px] overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.imageUrl} 
                                  alt="Thumbnail" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          ))}

                          {articles.filter(a => bookmarks.includes(a.id)).length === 0 && (
                            <div className="text-center py-12 flex flex-col items-center justify-center space-y-3.5 border border-dashed border-slate-300 dark:border-slate-800 rounded-[8px]">
                              <Bookmark className="w-7 h-7 text-slate-400 dark:text-slate-700" />
                              <div>
                                <p className="text-xs text-slate-850 dark:text-slate-200 font-bold font-display uppercase tracking-wider">No Saved Journals</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-450 px-6 mt-1 leading-normal font-sans">Save clinical reports or regulatory reviews to replicate persistent SQLite Room Dao serialization offline.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SETTINGS SCREEN */}
                    {activeTab === "settings" && (
                      <div className="flex flex-col space-y-4 font-sans">
                        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white tracking-wide">
                          Framework Variables
                        </h3>

                        <div className="space-y-2.5 pt-1">
                          {/* Theme selection */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-[8px] flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[11px] font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wide font-display">Dark Theme</p>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-sans">Enable high-contrast layout</p>
                            </div>
                            <button
                              onClick={() => setDarkMode(!darkMode)}
                              className="p-1.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 cursor-pointer border border-slate-300 dark:border-slate-800"
                            >
                              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#3B82F6]" />}
                            </button>
                          </div>

                          {/* FCM notifications toggle */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 p-3 rounded-[8px] flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[11px] font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wide font-display">FCM Broadcasts</p>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-sans">Receive push-notifications</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={notificationsEnabled}
                              onChange={(e) => setNotificationsEnabled(e.target.checked)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                            />
                          </div>

                          {/* SQLite/Room cache bounds */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-[8px] flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[11px] font-bold text-slate-855 dark:text-slate-200 uppercase tracking-wide font-display">Room Limit footprint</p>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-sans">Cap offline database sectors</p>
                            </div>
                            <select
                              value={cacheSize}
                              onChange={(e) => setCacheSize(e.target.value)}
                              className="bg-slate-100 dark:bg-slate-800 border-0 text-[10px] rounded px-1.5 py-1 text-slate-800 dark:text-slate-250 cursor-pointer focus:ring-1 focus:ring-blue-400 font-mono"
                            >
                              <option>10 MB</option>
                              <option>50 MB</option>
                              <option>100 MB</option>
                              <option>unlimited</option>
                            </select>
                          </div>

                          {/* Worker sync intervals */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-3 rounded-[8px] flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[11px] font-bold text-slate-855 dark:text-slate-200 uppercase tracking-wide font-display">WorkManager Interval</p>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-sans">Synchronize background thread</p>
                            </div>
                            <select
                              value={autoRefresh}
                              onChange={(e) => setAutoRefresh(e.target.value)}
                              className="bg-slate-100 dark:bg-slate-850 border-0 text-[10px] rounded px-1.5 py-1 text-slate-800 dark:text-slate-250 cursor-pointer focus:ring-1 focus:ring-blue-400 font-mono"
                            >
                              <option>Every 15 mins</option>
                              <option>Every hour</option>
                              <option>Twice daily</option>
                              <option>Manual only</option>
                            </select>
                          </div>

                          {/* Version Tag */}
                          <div className="text-center pt-4 border-t border-slate-200/40 dark:border-slate-850/60 mt-1">
                            <p className="text-[9.5px] font-mono font-bold text-[#3B82F6] uppercase tracking-widest">PharmaNews App Client</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-1 font-mono">Version 1.0.0 (API 34) • Developed in Hilt & Material 3</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ANDROID BOTTOM NAVIGATION BAR MOCKUP */}
              <div className={`absolute bottom-0 left-0 right-0 h-14 border-t px-6 flex justify-between items-center z-30 select-none ${
                darkMode ? "bg-[#0B0F19] border-slate-900" : "bg-slate-100 border-slate-250"
              }`}>
                {[
                  { id: "home", label: "Home", icon: HomeIcon },
                  { id: "search", label: "Search", icon: Search },
                  { id: "saved", label: "Saved", icon: Bookmark },
                  { id: "settings", label: "Settings", icon: SettingsIcon }
                ].map(tab => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id && !selectedArticle;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedArticle(null);
                        setActiveTab(tab.id as any);
                      }}
                      className={`flex flex-col items-center space-y-1 py-1 px-3.5 transition-all text-[9.5px] font-display font-medium cursor-pointer ${
                        isActive 
                          ? "text-[#3B82F6] font-extrabold scale-105" 
                          : "text-slate-400 dark:text-slate-550 hover:text-slate-700 dark:hover:text-slate-350"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* PANEL 2: INTEGRATED INTELLIGENCE SUITE & CODE INSPECTOR */}
        <section className="flex-1 flex flex-col bg-[#0F172A]/90 rounded-[16px] border border-slate-850 p-4 lg:p-6 shadow-2xl relative overflow-hidden geometric-dots-subtle font-sans">
          
          {/* Top Panel Dynamic Toggle Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 mb-5 gap-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#06B6D4]/10 text-cyan-400 rounded-[4px] border border-cyan-400/20 animate-pulse">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xs tracking-wider text-white uppercase">workspace dynamic co-pilot</h3>
                <p className="text-[10px] font-mono text-slate-400 tracking-tight uppercase">COMPILE STATE: ACTIVE • CO-PILOT TUNED TO PORT 3000</p>
              </div>
            </div>

            {/* Segmented control toggle */}
            <div className="flex bg-[#090d16] p-1 rounded-[6px] border border-slate-800">
              <button
                onClick={() => setWorkspaceMode("ai-lab")}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[4px] text-[10.5px] font-mono font-bold tracking-wide transition cursor-pointer ${
                  workspaceMode === "ai-lab"
                    ? "bg-[#06B6D4] text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>PHARMA AI LAB</span>
              </button>
              <button
                onClick={() => setWorkspaceMode("android-studio")}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[4px] text-[10.5px] font-mono font-bold tracking-wide transition cursor-pointer ${
                  workspaceMode === "android-studio"
                    ? "bg-[#3B82F6] text-white border-b-2 border-[#1D4ED8]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>KOTLIN SYSTEM CODE</span>
              </button>
            </div>
          </div>

          {/* WORKSPACE RENDERING ROUTINES */}
          {workspaceMode === "android-studio" ? (
            /* ==========================================
               MODE A: THE KOTLIN ANDROID CODE VISUALIZER
               ========================================== */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[500px]">
                {/* File Directory Structure Tree (Left column) */}
                <div className="md:col-span-4 bg-slate-950/80 rounded-[8px] border border-slate-850 p-3 overflow-y-auto max-h-[550px]">
                  <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1 pb-2.5 block select-none border-b border-slate-900/60 mb-2">
                    PROJECT FILES DIRECTORY
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {Object.keys(expandedCategories).map(catName => {
                      const isOpen = expandedCategories[catName];
                      const filesMatching = ANDROID_PROJECT_FILES.filter(f => f.category === catName);
                      return (
                        <div key={catName} className="space-y-1">
                          <button 
                            onClick={() => toggleCategoryExpand(catName)}
                            className="w-full flex items-center justify-between p-1.5 hover:bg-slate-905 rounded-[4px] text-slate-350 cursor-pointer text-left focus:outline-none"
                          >
                            <div className="flex items-center space-x-2">
                              {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-sky-400" /> : <Folder className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="font-bold font-mono tracking-wide text-slate-300">{catName}</span>
                            </div>
                            <span className="text-[9.5px] bg-[#1E293B] font-mono font-bold px-1.5 py-0.5 rounded text-slate-400">
                              {filesMatching.length}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="pl-3.5 space-y-0.5 border-l border-slate-800/40 ml-2 mt-0.5">
                              {filesMatching.map(file => {
                                const isSelected = selectedFile.path === file.path;
                                return (
                                  <button
                                    key={file.path}
                                    onClick={() => setSelectedFile(file)}
                                    className={`w-full flex items-center space-x-2 p-1.5 rounded-[4px] transition cursor-pointer text-left ${
                                      isSelected 
                                        ? "bg-[#3B82F6]/10 text-[#3B82F6] font-bold border-l-2 border-[#3B82F6]" 
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/20"
                                    }`}
                                  >
                                    <FileCode className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate font-mono text-[10px]">{file.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Code Highlight view (Right column) */}
                <div className="md:col-span-8 flex flex-col bg-slate-950/85 border border-slate-850 rounded-[8px] overflow-hidden min-h-[380px] max-h-[550px]">
                  
                  {/* File Title Bar */}
                  <div className="bg-[#090d16] px-4 py-2.5 border-b border-slate-900 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span className="font-mono text-[10px] tracking-wide select-all text-slate-350">{selectedFile.path}</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center space-x-1 px-2.5 py-1 text-[9.5px] font-mono font-bold bg-[#1E293B] text-slate-200 rounded-[4px] hover:bg-slate-750 border border-slate-800 transition cursor-pointer active:scale-95"
                    >
                      {copiedFileId ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real Code display box */}
                  <div className="flex-1 overflow-auto p-4 font-mono text-[10.5px] leading-relaxed text-slate-300 bg-slate-950 select-text select-all whitespace-pre">
                    <code>{selectedFile.content}</code>
                  </div>
                </div>
              </div>

              {/* Quick Architecture MVVM bullet guide under the inspector */}
              <div className="mt-5 border-t border-slate-850 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-3 bg-slate-955/40 rounded-[8px] border border-slate-850">
                  <h4 className="font-display font-bold text-slate-205 text-xs tracking-wider uppercase">📂 decoupled design engine</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">Unifies Retrofit networks and Room DAOs behind Hilt Inject constructs, keeping views completely independent from physical databases.</p>
                </div>
                <div className="p-3 bg-slate-955/40 rounded-[8px] border border-slate-850">
                  <h4 className="font-display font-bold text-slate-205 text-xs tracking-wider uppercase">⚡ stateflow & triggers</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">Drives modern StateFlow structures using flatMapLatest pipeline triggers. Emits direct reactive updates on the application layer.</p>
                </div>
                <div className="p-3 bg-slate-955/45 rounded-[8px] border border-slate-850">
                  <h4 className="font-display font-bold text-slate-205 text-xs tracking-wider uppercase">🏭 fcm & pipeline alerts</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">Integrates Firebase Cloud Messaging tokens, structured preferences DataStore, and responsive layout shimmers ready for device release.</p>
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================
               MODE B: PHARMA AI INSIGHTS LABORATORY
               ========================================== */
            <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-[500px]">
              
              {/* Left Sub-Navigator Tab Column (8 distinct requested AI models) */}
              <div className="md:w-1/4 flex flex-col space-y-1 bg-slate-950/50 p-2 rounded-[8px] border border-slate-850">
                <div className="text-[9px] font-mono font-bold text-[#06B6D4] uppercase tracking-widest px-2.5 py-1.5 border-b border-slate-900/70 mb-2">
                  Clinical AI Services
                </div>

                {[
                  { id: "chatbot", label: "AI Co-Pilot Chat", icon: MessageSquare, badge: "LIVE" },
                  { id: "summarization", label: "News Summarizer", icon: FileText, badge: "GEMINI" },
                  { id: "categorization", label: "Auto Categorizer", icon: FileCheck, badge: "CONV" },
                  { id: "recommendations", label: "Dynamic Personalizer", icon: Sliders, badge: "ALG" },
                  { id: "simplification", label: "Scientific Simplifier", icon: BookOpen, badge: "TRANS" },
                  { id: "trends", label: "Trend Detection", icon: BarChart3, badge: "REP" },
                  { id: "deduplication", label: "Deduplicate & Merger", icon: GitMerge, badge: "RESOL" },
                  { id: "smart-search", label: "Smart Semantic Search", icon: Search, badge: "SEM" }
                ].map((m) => {
                  const SubIcon = m.icon;
                  const isActive = selectedSubMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedSubMode(m.id as any)}
                      className={`w-full flex items-center justify-between p-2 rounded-[4px] text-left transition cursor-pointer ${
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 font-bold border-l-2 border-cyan-400"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/30"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 font-sans text-[11px] font-medium tracking-wide">
                        <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{m.label}</span>
                      </div>
                      <span className="text-[7.5px] font-mono uppercase bg-slate-900 text-slate-500 border border-slate-800 px-1 py-0.5 rounded">
                        {m.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Workspace Segment (Active AI Service Dashboard) */}
              <div className="md:w-3/4 flex flex-col bg-slate-950/80 border border-slate-850 rounded-[8px] p-4 font-sans select-text relative overflow-y-auto max-h-[550px]">
                
                {/* 1. CHATBOT WORKSPACE */}
                {selectedSubMode === "chatbot" && (
                  <div className="flex flex-col h-full space-y-4">
                    <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">💬 Clinically-Grounded Conversational Co-Pilot</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">GEMINI 3.5-FLASH • CITED FACT SHEETS • STRICT TREATMENT DIRECTIVE OFFSETS</p>
                      </div>
                    </div>

                    {/* Pre-canned expert prompt helpers */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Suggested Exploration Vectors:</span>
                      <div className="flex flex-wrap gap-1.5 select-none">
                        {[
                          "Explain GLP-1 obesity trial endpoints in simple language.",
                          "What are the major terms of the Zurich API declaration?",
                          "Has the FDA granted fast-tracks for Lignogene gene therapy?"
                        ].map((qStr) => (
                          <button
                            key={qStr}
                            onClick={() => handleSendAIChatQuery(qStr)}
                            className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-[9.5px] py-1 px-2.5 rounded border border-slate-800 transition cursor-pointer font-sans"
                          >
                            {qStr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 bg-[#090d16] border border-slate-900 rounded-[6px] p-3 space-y-3 max-h-[300px] overflow-y-auto">
                      {chatMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col space-y-1 max-w-[90%] ${
                            m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                        >
                          <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            m.role === "user" ? "text-blue-400" : "text-cyan-400"
                          }`}>
                            {m.role === "user" ? "Academic User" : "Pharma AI Assistant"}
                          </div>
                          <div
                            className={`p-2.5 rounded-lg text-[11px] leading-relaxed select-text font-sans whitespace-pre-wrap ${
                              m.role === "user"
                                ? "bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700"
                                : "bg-slate-950 text-slate-200 rounded-tl-none border border-slate-850"
                            }`}
                          >
                            {m.text}

                            {/* Citations Footer */}
                            {m.citations && m.citations.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800/40 flex flex-wrap items-center gap-1">
                                <span className="text-[8.5px] font-mono text-slate-500 uppercase mr-1">Citations:</span>
                                {m.citations.map((cit, cIdx) => (
                                  <span key={cIdx} className="bg-slate-900 text-slate-400 border border-slate-850 text-[8.5px] font-sans px-1.5 py-0.5 rounded">
                                    {cit}
                                  </span>
                                ))}
                              </div>
                            )}

                            {m.isFallback && (
                              <div className="mt-1.5 text-[8.5px] font-mono text-amber-500 tracking-wider">
                                [OOS Offline-Mode Engine Synthesis]
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center space-x-2 text-cyan-400 animate-pulse text-[10.5px] font-mono">
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini clinical retrieval pipeline running...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Inputs */}
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendAIChatQuery()}
                        placeholder="Inquire regarding trial designs, molecular knockouts, active api, drug clearances..."
                        className="flex-1 bg-[#090d16] border border-slate-850 rounded-[4px] px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500 text-white font-sans"
                      />
                      <button
                        onClick={() => handleSendAIChatQuery()}
                        disabled={chatLoading}
                        className="bg-[#06B6D4] hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2 px-4 rounded-[4px] cursor-pointer transition flex items-center space-x-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-slate-950" />
                        <span>SEND</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. SUMMARIZATION WORKSPACE */}
                {selectedSubMode === "summarization" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">📝 Clinical Text Summarization Engine</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">DETERMINISTIC CONTEXT MATRIX • NO TREATMENTS PRESCRIBED</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left parameter column */}
                      <div className="space-y-3 bg-[#090d16] p-3 rounded border border-slate-900">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Input Article Source Target:</label>
                          <select
                            value={summaryTargetArticleId}
                            onChange={(e) => setSummaryTargetArticleId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-2 rounded cursor-pointer"
                          >
                            {articles.map(a => (
                              <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Target Condensation Level:</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(["short", "medium", "detailed"] as const).map(len => (
                              <button
                                key={len}
                                onClick={() => setSummaryFormat(len)}
                                className={`py-1 px-1 text-[9.5px] font-mono font-bold rounded border transition cursor-pointer ${
                                  summaryFormat === len
                                    ? "bg-[#06B6D4] text-slate-950 border-[#06B6D4]"
                                    : "bg-slate-950 text-slate-450 border-slate-850 hover:text-white"
                                }`}
                              >
                                {len.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleGetAILabSummary}
                          disabled={summaryLoading}
                          className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          {summaryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                          <span>EXECUTE CONDENSE RETRIEVAL</span>
                        </button>
                      </div>

                      {/* Right feedback column */}
                      <div className="bg-slate-950 border border-slate-850 rounded p-3 flex flex-col justify-between min-h-[160px]">
                        <div>
                          <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            ANALYZER REPORT FEEDBACK
                          </div>
                          {summaryLoading ? (
                            <div className="text-cyan-400 font-mono text-[10px] animate-pulse">Running medical summary pass via Gemini API...</div>
                          ) : (
                            <p className="text-[11px] leading-relaxed text-slate-350 select-text whitespace-pre-wrap">
                              {summarizedText || "Select parameters and click render above to fetch the abstract summary."}
                            </p>
                          )}
                        </div>
                        {summaryLocalFallback && summarizedText && (
                          <div className="text-[8.5px] font-mono text-amber-500 border-t border-slate-900 mt-2 pt-1.5">
                            [OFFLINE DEMO METRICS ACTIVATED] Validates formatting abstract pipelines.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CATEGORIZATION WORKSPACE */}
                {selectedSubMode === "categorization" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">🏷️ Multi-Disciplinary NLP Categorization</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">COMPUTES PROBABILITY WEIGHTS OVER 10 TARGET PHARMACEUTICAL DOMAINS</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left control block */}
                      <div className="space-y-3 bg-[#090d16] p-3 rounded border border-slate-900">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Input Headline Selection:</label>
                          <select
                            value={categorizeArticleId}
                            onChange={(e) => setCategorizeArticleId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-2 rounded cursor-pointer"
                          >
                            {articles.map(a => (
                              <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleGetAILabClassification}
                          disabled={classifyLoading}
                          className="w-full bg-[#06B6D4] hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2 px-3 rounded cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          {classifyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                          <span>CLASSIFY SCIENTIFIC DISCIPLINE</span>
                        </button>
                      </div>

                      {/* Right visualization results block */}
                      <div className="bg-slate-955 border border-slate-850 rounded p-3 text-[11px] space-y-2 max-h-[220px] overflow-y-auto">
                        <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 mb-1">
                          DISCIPLINE MAP CONFIDENCE SCORE
                        </div>

                        {classifyLoading ? (
                          <div className="text-cyan-400 font-mono animate-pulse">Running advanced scientific terminology classifier...</div>
                        ) : classifiedScores.length > 0 ? (
                          <div className="space-y-1.5">
                            {classifiedScores.map((sc, scIdx) => (
                              <div key={scIdx} className="space-y-0.5">
                                <div className="flex justify-between font-medium text-[10px]">
                                  <span className="text-slate-205 truncate max-w-[150px]">{sc.category}</span>
                                  <span className="font-mono text-cyan-400 font-bold">{sc.confidence}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850/40">
                                  <div
                                    style={{ width: `${sc.confidence}%` }}
                                    className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] h-full"
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Select article and trigger NLP matching scan.</p>
                        )}
                        {classifyLocalFallback && classifiedScores.length > 0 && (
                          <div className="text-[8.5px] font-mono text-amber-500 pt-1 mt-1 border-t border-slate-900/60">
                            [LOCAL SCAN FALLBACK DETECTED] Compiles syntactic tokens determinant weights.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PERSONALIZED RECOMMENDATIONS WORKSPACE */}
                {selectedSubMode === "recommendations" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">🎯 State-Based Personalized Pipeline</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">EVALUATES PROFESSIONAL USER ROLES & EXPLICIT INTERESTS THROUGH SEMANTIC ALIGNMENT</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Config parameters */}
                      <div className="space-y-3 bg-[#090d16] p-3 rounded border border-slate-900 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Dynamic Role Category Selector:</label>
                          <select
                            value={usrRole}
                            onChange={(e) => setUsrRole(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-1.5 rounded cursor-pointer font-sans"
                          >
                            <option>Pharmaceutical Researcher</option>
                            <option>Clinical Pharmacist</option>
                            <option>Academic Pharmacy Student</option>
                            <option>Regulatory Affairs Specialist</option>
                            <option>Drug Discovery Scientist</option>
                            <option>Biotech Industry Executive</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Clinical Topic Interests:</label>
                          <div className="grid grid-cols-2 gap-1.5 font-sans">
                            {["Biotechnology", "Drug Approvals", "Clinical Trials", "Metabolic Diseases", "Oncology Research", "Supply Chains"].map((t) => {
                              const isChecked = usrTags.includes(t);
                              return (
                                <label key={t} className="flex items-center space-x-1.5 text-[10px] text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setUsrTags(prev => prev.filter(item => item !== t));
                                      } else {
                                        setUsrTags(prev => [...prev, t]);
                                      }
                                    }}
                                    className="rounded border-slate-800 text-cyan-400 focus:ring-0"
                                  />
                                  <span>{t}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={handleGetAILabRecommendations}
                          disabled={recommendationLoading}
                          className="w-full bg-[#3B82F6] hover:bg-blue-650 text-white font-bold text-xs py-2 px-3 rounded cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          {recommendationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                          <span>ALIGN RELEVANCY PIPELINES</span>
                        </button>
                      </div>

                      {/* Output Feed section */}
                      <div className="bg-slate-955 border border-slate-850 rounded p-3 space-y-2.5 max-h-[220px] overflow-y-auto">
                        <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 flex justify-between">
                          <span>PERSONALIZED DIGEST RECOMMENDATIONS</span>
                          {recommendationLocalFallback && <span className="text-amber-500 font-bold">[LOCAL MATCH]</span>}
                        </div>

                        {recommendationLoading ? (
                          <div className="text-cyan-400 font-mono animate-pulse text-[10.5px]">Aligning semantic profiles to available news entities...</div>
                        ) : recommendedItems.length > 0 ? (
                          <div className="space-y-2">
                            {recommendedItems.map((rec, recIdx) => (
                              <div key={recIdx} className="bg-[#090d16] border border-slate-900 p-2 rounded relative hover:border-cyan-500/20 transition">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8.5px] font-mono font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-1 py-0.5 rounded uppercase">
                                    {rec.article.category}
                                  </span>
                                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{rec.recommendationScore}% MATCH</span>
                                </div>
                                <h5 className="font-display font-medium text-[10.5px] text-white leading-snug mt-1">{rec.article.title}</h5>
                                <p className="text-[9.5px] text-slate-400 leading-snug mt-1 bg-slate-950/60 p-1 rounded font-sans border-l border-cyan-400/35 select-text">
                                  {rec.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Configure profile parameters and click align parameters.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SCIENTIFIC SIMPLIFICATION */}
                {selectedSubMode === "simplification" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">🧬 Molecular Translation & Scientific register translation</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">GEMINI RE-TRANSLATION PIPELINE IN STUDENT, PRACTICE, OR ACADEMIC MODALITY PRESETS</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Inputs Column */}
                      <div className="space-y-3 bg-[#090d16] p-3 rounded border border-slate-900 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Passage Target Article:</label>
                          <select
                            value={simplifyTargetArticleId}
                            onChange={(e) => setSimplifyTargetArticleId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-2 rounded cursor-pointer"
                          >
                            {articles.map(a => (
                              <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Translation Target Archetype:</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(["student", "professional", "researcher"] as const).map(m => (
                              <button
                                key={m}
                                onClick={() => setSimplifyMode(m)}
                                className={`py-1.5 px-0.5 text-[9px] font-mono font-bold rounded border transition cursor-pointer ${
                                  simplifyMode === m
                                    ? "bg-[#06B6D4] text-slate-950 border-[#06B6D4]"
                                    : "bg-slate-955 text-slate-450 border-slate-850 hover:text-white"
                                }`}
                              >
                                {m.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleGetAILabSimplification}
                          disabled={simplifyLoading}
                          className="w-full bg-[#06B6D4] hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2 px-3 rounded cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          {simplifyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5 text-slate-950" />}
                          <span>RE-PUBLISH SCIENTIFIC TEXT</span>
                        </button>
                      </div>

                      {/* Display Outputs Side-By-Side/Results */}
                      <div className="bg-slate-955 border border-slate-850 rounded p-3 flex flex-col justify-between min-h-[160px]">
                        <div>
                          <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-1 mb-1.5 flex justify-between">
                            <span>TRANSLATED RESULT MODE: {simplifyMode.toUpperCase()}</span>
                            {simplifyLocalFallback && <span className="text-amber-500">[OOS FALLBACK]</span>}
                          </div>

                          {simplifyLoading ? (
                            <div className="text-cyan-400 font-mono text-[10.5px] animate-pulse">Running semantic register translation modules...</div>
                          ) : (
                            <div className="text-[11px] leading-relaxed text-slate-300 font-sans select-text whitespace-pre-wrap max-h-[170px] overflow-y-auto">
                              {simplifiedResultText || "Configure parameters and execute scientific compilation."}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. WEEKLY TRENDS DETECTOR */}
                {selectedSubMode === "trends" && (
                  <div className="space-y-3.5">
                    <div className="border-b border-slate-900 pb-1.5 flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">📈 Intelligent Biopharma Trend Detector & Sector Audit</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">MONITORS MERGER ACCELERATION INDEXES, TOPICAL VELOCITY, AND MAMMALIAN SPREAD ALIGNMENTS</p>
                      </div>
                      <button
                        onClick={handleFetchTrendsReport}
                        disabled={trendsLoading}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono font-bold px-3 py-1.5 rounded cursor-pointer text-cyan-400 active:scale-95"
                      >
                        {trendsLoading ? "Scrutinizing..." : "Recalculate Trends"}
                      </button>
                    </div>

                    {trendsLoading ? (
                      <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                        <span className="text-xs font-mono text-slate-450 uppercase animate-pulse">Assembling live sector news matrices...</span>
                      </div>
                    ) : trendsData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Summary Block */}
                        <div className="bg-[#090d16] border border-slate-900 rounded p-3 space-y-1.5 md:col-span-2 select-text">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">Sector Weekly Overview Abstract:</span>
                          <p className="text-[10.5px] leading-relaxed text-slate-300 font-sans">{trendsData.weeklyOverview}</p>
                        </div>

                        {/* Emerging Diseases Panel */}
                        <div className="bg-[#090d16] border border-slate-900 rounded p-3 space-y-2">
                          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest block flex items-center space-x-1">
                            <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span>EMERGING GENOMIC HEALTH THREATS</span>
                          </span>
                          <div className="space-y-1.5 font-sans justify-between">
                            {trendsData.emergingDiseases?.map((dis: any, idx: number) => (
                              <div key={idx} className="bg-slate-950 p-1.5 rounded border border-slate-850/40">
                                <div className="font-bold text-slate-205 text-[10px]">{dis.name}</div>
                                <div className="flex justify-between items-center text-[9px] mt-0.5 text-slate-450 font-mono">
                                  <span>RISK LEVEL: <strong className="text-red-400">{dis.level}</strong></span>
                                  <span>{dis.growthTrend}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trending Therapeutic Target areas */}
                        <div className="bg-[#090d16] border border-slate-900 rounded p-3 space-y-2">
                          <span className="text-[9px] font-mono font-bold text-[#06B6D4] uppercase tracking-widest block">HOT THERAPEUTIC MECHANISM FOCUS</span>
                          <div className="space-y-1.5 font-sans max-h-[120px] overflow-y-auto">
                            {trendsData.trendingTherapeuticAreas?.map((tr: any, idx: number) => (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between font-bold text-[9.5px]">
                                  <span className="text-slate-300 truncate max-w-[120px]">{tr.area}</span>
                                  <span className="font-mono text-[#06B6D4]">{tr.share}% Share</span>
                                </div>
                                <p className="text-[8.5px] text-slate-450 italic truncate">{tr.focus}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fast Growth Academic lines */}
                        <div className="bg-[#090d16] border border-slate-900 rounded p-3 space-y-1.5 md:col-span-2">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">FAST-GROWING RESEARCH TOPICAL CORRELATIONS</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {trendsData.fastGrowingResearchTopics?.map((top: string, idx: number) => (
                              <div key={idx} className="bg-slate-950 text-slate-350 p-1.5 rounded text-[9.5px] font-mono leading-tight select-text border border-slate-850/10 hover:border-cyan-400/10">
                                • {top}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Select recalculate above to formulate. fallback parameters will initialize.</p>
                    )}
                  </div>
                )}

                {/* 7. DEDUPLICATION AND COLLISION WORKSPACE */}
                {selectedSubMode === "deduplication" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">🧬 Clinical Deduplication & Unified Article Merger</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">COMPUTES OVERLAP METRICS AND CONSOLIDATES REDUNDANT PRESS RELEASES</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Options Column */}
                      <div className="space-y-3 bg-[#090d16] p-3 rounded border border-slate-900 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Primary Document A:</label>
                          <select
                            value={dupArticleIdA}
                            onChange={(e) => setDupArticleIdA(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-1.5 rounded cursor-pointer truncate"
                          >
                            {articles.map(a => (
                              <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Comparable Document B:</label>
                          <select
                            value={dupArticleIdB}
                            onChange={(e) => setDupArticleIdB(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 text-xs text-white p-1.5 rounded cursor-pointer truncate"
                          >
                            {articles.map(a => (
                              <option key={a.id} value={a.id}>{a.title}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleGetAILabSmartMerge}
                          disabled={dupMergeLoading}
                          className="w-full bg-[#06B6D4] hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2 px-3 rounded cursor-pointer transition flex items-center justify-center space-x-1.5"
                        >
                          {dupMergeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5 text-slate-950" />}
                          <span>SCRUTINIZE COLLISION METRICS</span>
                        </button>
                      </div>

                      {/* Output workspace merged block */}
                      <div className="bg-slate-955 border border-slate-850 rounded p-3 space-y-2 max-h-[220px] overflow-y-auto text-xs">
                        {dupMergeLoading ? (
                          <div className="text-cyan-400 font-mono animate-pulse text-[10.5px]">Decombining press releases, resolving database overlaps...</div>
                        ) : dupMergeResult ? (
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 text-[10.5px]">
                              <span className="text-slate-450 font-mono uppercase">Collision audit overlap:</span>
                              <strong className="text-[#06B6D4] font-mono">{dupMergeResult.overlapPercentage}% overlap</strong>
                            </div>
                            <div className="bg-[#090d16] p-2 rounded">
                              <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase block tracking-wider">Unified Generated Dispatch Headline:</span>
                              <h5 className="font-display font-medium text-white text-[10.5px] leading-snug mt-0.5">{dupMergeResult.mergedTitle}</h5>
                            </div>

                            {dupMergeResult.identifiedDuplicates && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider block">Identified Collisions & Redundancy Metrics:</span>
                                <ul className="list-disc pl-3 text-[9.5px] text-slate-400 space-y-0.5">
                                  {dupMergeResult.identifiedDuplicates.map((dupFact: string, dfIdx: number) => (
                                    <li key={dfIdx}>{dupFact}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="bg-slate-950 p-2.5 rounded text-[10.5px] select-text whitespace-pre-wrap leading-relaxed border border-slate-850 font-sans">
                              {dupMergeResult.mergedContent}
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">Configure separate documents and click inspect redundancy.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. SMART SEMANTIC SEARCH */}
                {selectedSubMode === "smart-search" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-2">
                      <h4 className="font-display font-extrabold text-white text-xs uppercase tracking-wider">🔍 Semantic Smart Search Correlator</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">GEMINI SEMANTIC CORRELATIONS • RETRIEVES HIGHLIGHED ALIGNMENTS CORRESPONDING BEYOND EXACT STR STRINGS</p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          value={smartSearchQuery}
                          onChange={(e) => setSmartSearchQuery(e.target.value)}
                          placeholder="Search naturally (e.g. 'muscle orphan codes' or 'drug pipelines achieving obesity loss')..."
                          className="flex-1 bg-[#090d16] border border-slate-850 rounded-[4px] px-3 text-xs focus:outline-none text-white focus:ring-1 focus:ring-cyan-500 font-sans"
                        />
                        <button
                          onClick={handleGetAILabSmartSearch}
                          disabled={smartSearchLoading}
                          className="bg-[#06B6D4] hover:bg-cyan-500 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-[4px] cursor-pointer transition flex items-center space-x-1.5"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-950" />
                          <span>SEMANTIC</span>
                        </button>
                      </div>

                      <div className="bg-[#090d16] border border-slate-900 rounded p-3 select-text space-y-2.5 max-h-[180px] overflow-y-auto">
                        <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex justify-between">
                          <span>SEMANTIC QUERY MATCH RESULTS</span>
                          {smartSearchLocalFallback && <span className="text-amber-500 font-bold">[LOCAL MATCH ANALYSIS]</span>}
                        </div>

                        {smartSearchLoading ? (
                          <div className="text-cyan-400 font-mono animate-pulse text-[10.5px]">Calculating multi-dimensional distance metrics...</div>
                        ) : smartSearchResults.length > 0 ? (
                          <div className="space-y-2">
                            {smartSearchResults.map((ent, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedArticle(ent.article)}
                                className="bg-slate-950 border border-slate-850/40 p-2 rounded hover:border-cyan-500 cursor-pointer transition text-xs"
                              >
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="font-mono font-bold text-cyan-400 bg-cyan-400/5 px-1 py-0.5 rounded border border-cyan-400/10">
                                    {ent.article.category}
                                  </span>
                                  <span className="font-mono text-emerald-400 font-extrabold">{ent.semanticMatchScore}% CORRELATION</span>
                                </div>
                                <h5 className="font-display font-medium text-white text-[10.5px] mt-1 leading-snug">{ent.article.title}</h5>
                                <p className="text-[9.5px] text-slate-450 leading-relaxed mt-1 italic select-text p-1 bg-[#090d16] rounded border-l border-emerald-500/30">
                                  {ent.semanticReason}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-505 italic text-[10.5px]">No matches calculated. Run search query.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </section>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-850 bg-[#090d16] py-5 px-6 text-center text-[11px] text-slate-550 font-mono">
        <p>PharmaNews Aggregator Platform © 2026. Designed with Geometric Balance guidelines, and structured with clean Kotlin MVVM standards.</p>
      </footer>
    </div>
  );
}
