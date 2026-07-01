import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { scheduleDailyNewsUpdate, getCachedNews, fetchAndUpdateNews } from "./news-scheduler.js";
import { startAllAgents } from "./all-agents.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Extensive local database of highly professional pharmaceutical articles
// across multiple disciplines. This guarantees rich offline and online experiences.
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

const LOCAL_ARTICLES: Article[] = [
  {
    id: "1",
    title: "FDA Approves Breakthrough Gene Therapy for Rare Neuromuscular Disorder",
    summary: "The FDA has granted fast-track approval to a novel Adeno-Associated Virus (AAV) gene therapy, opening new avenues for pediatric patients matching the specific genetic markers.",
    content: `In a landmark decision, the U.S. Food and Drug Administration (FDA) has granted accelerated approval to Lignogene (lignogene-cept), a pioneering Adeno-Associated Virus (AAV9) vector-based gene therapy developed by Biopharma Nexus. The therapy is indicated for pediatric patients suffering from Congenital Myopathic Atrophy (CMA), a severe, ultra-rare neuromuscular disorder characterized by progressive muscle weakness and premature respiratory failure.\n\n### Clinical Efficacy and Trial Outcomes\nThe approval was based on data from the Phase 3 'RESOLVE' clinical trial, an open-label, single-arm study evaluating the safety and efficacy of a single intravenous infusion of Lignogene in 42 infants aged 2 to 9 months.\n\n- **Primary Endpoint**: 88% of patients achieved independent sitting for at least 10 seconds at 12 months post-infusion, a milestone never historically observed in natural history cohorts of untreated CMA.\n- **Motor Function**: Significant improvements in infant motor scales (CHOP-INTEND) were recorded, with a mean increase of 24 points from baseline.\n- **Survival Rate**: 100% of infants survived without requiring permanent respiratory support at 18 months.\n\n### Safety Profile and Regulatory Path\nThe safety profile was characterized as manageable, though close monitoring for hepatotoxicity is mandated. The most common adverse events included transient elevations in liver enzymes (ALT/AST), vomiting, and low platelet counts. High-dose corticosteroid regimens are co-prescribed to mitigate immunological responses to the AAV capsid.\n\nUnder the accelerated approval pathway, Biopharma Nexus is required to conduct a confirmatory Phase 4 trial to verify clinical benefit. Dr. Sarah Jenkins, Chief Neurologist at the Boston Children's Neuromuscular Center, remarked: 'This is not merely an incremental improvement; it is a paradigm-shifting cure that addresses the root genetic defect at its source.'`,
    category: "Drug Approvals",
    source: "PharmaNews Journal",
    author: "Dr. Elizabeth Vance, PharmD",
    date: "2026-06-18",
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
    readTime: "4 min read",
    isBreaking: true,
    isFeatured: true
  },
  {
    id: "2",
    title: "Phase III Results of Oral GLP-1/GIP Co-Agonist Demonstrate Unprecedented Weight Loss",
    summary: "A newly presented clinical trial reveals that a small-molecule oral dual agonist achieves 18.2% weight reduction over 48 weeks, rivaling injectable options.",
    content: `Results from the international, randomized Phase III clinical trial 'OR-METAB-5' have sent shockwaves through the metabolic healthcare industry. A novel small-molecule oral dual GLP-1 (glucagon-like peptide-1) and GIP (glucose-dependent insulinotropic polypeptide) receptor co-agonist, code-named LY-90021, has demonstrated weight-reduction capabilities that directly rival established subcutaneous injectables.\n\n### Study Methodology\nThe double-blind trial enrolled 1,450 adults living with obesity or overweight with at least one weight-related comorbidity (excluding Type 2 diabetes). Participants were randomized 1:1 to receive either LY-90021 (40mg once daily) or an active placebo, combined with a standardized lifestyle and caloric intervention.\n\n### Efficacy Highlights\nAt the 48-week mark, the results were definitive:\n- **Mean Weight Loss**: Patients on LY-90021 achieved an average weight loss of **18.2% (approx. 19.8 kg)**, compared to just 2.1% in the placebo group.\n- **Secondary Endpoints**: 74% of participants in the active pool achieved a weight reduction of ≥15%, and 41% achieved a reduction of ≥20%.\n- **Cardiovascular Biomarkers**: Significant decreases were observed in systolic blood pressure (-7.4 mmHg), LDL cholesterol (-12%), and high-sensitivity C-reactive protein (hs-CRP).\n\n### Tolerability and Patient Compliance\nAs expected with incretin-based therapies, gastrointestinal side effects were highly prevalent during the initial 8-week titration phase, with nausea (38%), diarrhea (29%), and vomiting (14%) reported. However, withdrawal rates due to adverse events remained low at 4.2%, suggesting a favorable patient compliance curve for oral therapeutics compared to needle-based regimes.\n\nIndustry analysts forecast LY-90021 to secure immediate blockbuster status upon regulatory submission, expected in early Q4 2026.`,
    category: "Clinical Trials",
    source: "Lancet Endocrinology News",
    author: "Marcus Thorne, PhD",
    date: "2026-06-19",
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1ea400c3af?q=80&w=800&auto=format&fit=crop",
    readTime: "5 min read",
    isFeatured: false
  },
  {
    id: "3",
    title: "Crispr-Cas12 Nano-Delivery System Successfully Attacks Glioblastoma in Animal Models",
    summary: "Researchers have designed a specialized lipid nanoparticles (LNPs) system that crosses the blood-brain barrier to target metabolic pathways in high-grade gliomas.",
    content: `Scientists at the Molecular Medicine Alliance (MMA) have published a groundbreaking paper in *Nature Biotechnology* detailing a highly specific gene-editing delivery vehicle. By leveraging specialized lipid nanoparticles (LNPs) conjugated with blood-brain-barrier-penetrating ligands, they successfully delivered modular CRISPR-Cas12a complexes into high-grade glioblastoma tumors in mouse models.\n\n### Overcoming the Blood-Brain Barrier (BBB)\nHistorically, over 98% of small-molecule drugs and virtually all macromolecules fail to cross the physiological blood-brain barrier. The researchers circumvented this hurdle by attaching a synthetic peptide targeting low-density lipoprotein receptor-related protein 1 (LRP1), which is highly expressed on the brain capillary endothelial cells and overexpressed on malignant glial cells.\n\n### Mechanistic Action of CRISPR-Cas12a\nOnce inside the glioma cells, the guide RNAs directed Cas12a to knock down the *PLK1* (Polo-like kinase 1) gene, an essential regulator of mitosis. Knocking down this metabolic driver triggered selective apoptosis (cell death) in tumor cells while sparing neighboring healthy astrocytes and neurons.\n\n- **Tumor Reduction**: Treated animals showed a **74% reduction in tumor volume** compared to control groups within three weeks.\n- **Extended Survival**: Median survival times in the target animal group more than doubled from 22 days to 58 days.\n- **Off-Target Minimization**: Deep sequencing revealed off-target mutagenesis rates of less than 0.05%, demonstrating the safety refinement of the Cas12a system.\n\nDr. Raymond Cho, Chief Biotechnology Officer of MMA, remarked: "We have proven that gene editing can be selectively targeted to intracranial malignancies, bypassing systemic toxicities. Human clinical trials are being prepared for late next year."`,
    category: "Medical Research",
    source: "Biotech Science Review",
    author: "Dr. Raymond Cho, MD, PhD",
    date: "2026-06-17",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
    readTime: "6 min read",
    isFeatured: false
  },
  {
    id: "4",
    title: "Global Supply Chain Pact Established to Prevent Chronic API Shortages",
    summary: "Representatives from 40 nations, along with leading pharmaceutical giants, have signed the Zurich Declaration to bolster manufacturing resilience of Active Pharmaceutical Ingredients.",
    content: `To combat the chronic shortages of critical medicines that have plagued global hospitals over the past decade, a historic coalition of 40 sovereign states and 15 major multi-national pharmaceutical corporations have finalized the **Zurich Declaration on Pharmaceutical Supply Chain Resilience**.\n\n### The Problem: API Consolidation in East Asia\nAt present, more than 70% of the world's Active Pharmaceutical Ingredients (APIs)—the chemical precursors required to formulate essential generic drugs such as antibiotics, anesthetics, and cardiovascular stabilizers—are produced in dedicated industrial clusters in India and China. While highly cost-effective, this geographical concentration leaves the global healthcare architecture vulnerable to localized factory shutdowns, environmental regulations, or geopolitical trade disputes.\n\n### The Zurich Framework\nThe accord establishes three core directives designed to diversify manufacturing capacity over the next five years:\n\n1. **Redundant Sourcing Mandates**: Pharmaceutical companies marketing critical-care medicines in signee nations must maintain validated API suppliers in at least two separate geographical continents.\n2. **Strategic Reserve Infrastructure**: Participating nations will co-fund local reserves containing a minimum 6-month supply of 120 designated "critical life-saving chemicals".\n3. **Subsidized Production Corridors**: A $12 billion economic stimulus fund will subsidize the construction of modern, advanced continuous-manufacturing facilities in North America, Europe, and South America to lower manufacturing cost-disadvantages.\n\nPharma industry executives have praised the regulatory clarity, though warning that transition costs may lead to marginal price increases in the generic drug sector. "Security of supply has been elevated from a corporate procurement metric to an issue of national security," stated Jean-Claude Sandoz, policy director at the Global Generics Association.`,
    category: "Healthcare Policy",
    source: "Healthcare Economics Forum",
    author: "Elena Petrova, MBA",
    date: "2026-06-15",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    readTime: "4 min read",
    isFeatured: false
  },
  {
    id: "5",
    title: "Pharma Giants Astra-Vax and Gen-Dynamics Announce $82 Billion Merger",
    summary: "The combined conglomerate will establish the world's largest oncology and rare disease biotech pipeline, shifting the competitive landscape.",
    content: `In the largest corporate transaction in the healthcare sector this decade, Astra-Vax PLC has agreed to acquire Gen-Dynamics Inc. in an cash-and-stock deal valued at a staggering **$82 billion**.\n\n### Synergistic Integration of Capabilities\nThe transaction brings together Astra-Vax's global regulatory clout, massive commercial infrastructure, and established cardiovascular portfolio with Gen-Dynamics' highly coveted oncology and rare disease biotechnology pipeline.\n\n- **Oncology Expansion**: The merger places five late-stage antibody-drug conjugate (ADC) clinical candidates under unified management.\n- **RARE Pipeline**: Gen-Dynamics brings three innovative RNA-interference (RNAi) drugs targeted at metabolic liver diseases.\n- **Cost Efficiency**: Corporate boards expect to realize $3.4 billion in annual pre-tax cost synergies by integrating generalized R&D, clinical development pipelines, and administrative functions.\n\n### Regulatory Scrutiny Expected\nFederal antitrust regulators in both Washington and Brussels immediately announced plans to conduct intensive reviews of the proposal, citing potential consolidation of ownership in PD-L1 immune checkpoint inhibitors. The companies have expressed confidence in securing approvals, indicating a willingness to divest certain regional assets to resolve potential competitive overlaps.\n\nThe combined company will operate under the name **AstraDynamics Global**, with its primary corporate headquarters remaining in Cambridge, UK.`,
    category: "Industry News",
    source: "Pharma Business Daily",
    author: "Richard Holloway",
    date: "2026-06-16",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
    readTime: "3 min read",
    isFeatured: false
  },
  {
    id: "6",
    title: "Next-Generation mRNA Vaccine for H5N1 Avian Influenza Enters Phase II Trials",
    summary: "In response to rising localized mammal transmissions, a dual-antigen mRNA vaccine is undergoing trials to assess safety and immunological memory.",
    content: `With global veterinary and public health authorities continuing to warn of localized mammal-to-mammal transmissions of the H5N1 avian influenza virus, biotechnology leader Vaxicor has initiated Phase II clinical trials of its next-generation dual-antigen mRNA vaccine candidate, H5-mRNA-V2.\n\n### Dual-Antigen Design Targeting Hemagglutinin and Neuraminidase\nUnlike traditional trivalent flu vaccines which primarily target a single variable epitope on the Hemagglutinin (HA) surface protein, Vaxicor's formulation uses a modified nucleoside mRNA platform that codes for both a conserved sequence of the H5 Hemagglutinin and the N1 Neuraminidase. This dual strategy is designed to trigger both neutralising antibody responses and CD8+ T-cell memory, protective against potential drift variants.\n\n### Trial Parameters\nThe Phase II trial is enrolling 600 healthy adults aged 18 to 64 across clinical sites in North America and South-East Asia.\n- **Cohorts**: Participants are randomized into three dosage groups (30mcg, 50mcg, and 100mcg) receiving a primary dose followed by a booster at Day 28.\n- **Objectives**: Primary endpoints look at geometric mean titers (GMTs) of neutralizing antibodies at Day 56, alongside detailed local adverse reaction monitoring.\n\nPublic health agencies are closely watching the trials. "Though H5N1 remains primarily a threat to agricultural livestock, having a rapidly scaleable, immunological-validated mRNA platform ready for immediate mass production is our most critical contingency," said Dr. Maria de Souza, infectious disease advisor.`,
    category: "COVID-19 & Vaccines",
    source: "Infectious Disease Monitor",
    author: "Dr. Maria de Souza, MD",
    date: "2026-06-14",
    imageUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=800&auto=format&fit=crop",
    readTime: "4 min read",
    isFeatured: false
  },
  {
    id: "7",
    title: "AI-Designed Inhibitor Enters Clinical Pipeline for Advanced Solid Tumors",
    summary: "Using deep generative modeling, researchers identified and synthesized a potent inhibitor targeting the previously 'undruggable' Ras-related protein in under 90 days.",
    content: `Biotech start-up SyntheRx, in collaboration with leading digital health labs, has announced that its principal drug candidate, SRX-420, has received clearance for Investigational New Drug (IND) clinical evaluations. SRX-420 is a small-molecule inhibitor of the KRAS-G12D mutation in advanced solid tumors, designed entirely using a deep generative AI model in a record-breaking timeframe.\n\n### Disrupting the Conventional Drug Discovery Timeline\nNormally, the drug discovery phase—from primary target identification, lead generation, structure-activity relationship (SAR) modeling, to pre-clinical validation—takes an average of 4.5 to 6 years and costs tens of millions of dollars. SyntheRx completed this entire sequence in **just 89 days**.\n\n- **AI Model Architecture**: The company's proprietary platform, ChemGenerative-Net, ingested multi-dimensional crystal structures of mutated Ras proteins and generated more than 400,000 synthetic ligands matching the binding pockets.\n- **Synthetic Optimization**: The AI filtered candidate compounds based on synthesizability scores, membrane permeability, and predictive metabolic toxicity, selecting the top 12 compounds for direct chemistry synthesis and assay comparison.\n- **Affinity Efficacy**: SRX-420 demonstrated sub-nanomolar binding affinity (KD = 0.45 nM), showing a 30-fold improvement in selectivity compared to previous generation non-AI structural leads.\n\n### Future Implications\n"This represents a future where customized therapeutics can be drafted, verified, and sent to clinical trials in response to emerging mutated tumor strains almost instantly," declared Dr. Aris Wadia, director of AI Bio-computation.`,
    category: "AI in Healthcare",
    source: "Advanced Intelligent Medicine",
    author: "Dr. Alan Turing-Green, PhD",
    date: "2026-06-19",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    readTime: "5 min read",
    isFeatured: false
  },
  {
    id: "8",
    title: "Biotechnology Breakthrough: Synthetic Mitochondria Restoration Restores Cellular Function",
    summary: "A novel technique involving transplanting lipid-encapsulated synthetic mitochondria shows recovery of organ function in degenerative diseases.",
    content: `In what is being described as a cellular mechanics revolution, researchers at the Genomix Research Center have successfully engineered **synthetic micro-mitochondria** and delivered them intravenously to restore metabolic cellular health in compromised cardiovascular tissues of animal models.\n\n### The Science of Mitochondrial Transplantation\nMitochondrial decay is the ultimate driver of aging, neurodegeneration, and ischemic cell death. Traditional gene therapies fail to correct systemic mitochondrial DNA defects due to the complex double-membrane structures of the organelle. The new approach resolves this by formulating synthetic mitochondrial casings using a biological, immunologically inert lipid bilayer that integrates organically with cellular membranes upon delivery.\n\n### Therapeutic Outcomes\nIn the published trials:\n- **Cellular ATP Production**: Intracoronary administration of synthetic mitochondria resulted in a **140% increase in ATP (energy) production** in cardiac cells damaged by simulated heart failure.\n- **Tissue Re-oxygenation**: Tissues showed significantly higher respiratory rates and a 40% reduction in oxidative cell damage markers.\n- **Regenerative Impact**: Damaged cardiac muscle showed accelerated repair pathways, mimicking youth metabolic profiles.\n\nTherapeutic developers are expanding studies into neurodegenerative models, with an eye toward Parkinson's disease where mitochondrial structural decline is highly implicated.`,
    category: "Biotechnology",
    source: "Applied Biotech Reports",
    author: "Dr. Clara Oswald, PhD",
    date: "2026-06-13",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    readTime: "5 min read",
    isFeatured: false
  }
];

// Combine mock news and call Gemini for fresh real-time articles if key exists
app.post("/api/news", async (req, res) => {
  const { category, search } = req.body;
  const gemini = getGeminiClient();

  if (!gemini) {
    // If no API key or key is initial, filter local data
    let filtered = [...LOCAL_ARTICLES];
    if (category && category !== "All News" && category !== "All") {
      filtered = filtered.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }
    return res.json({ articles: filtered, source: "mock-cache" });
  }

  try {
    // Build specific prompt asking Gemini to either generate news or filter existing
    const categoryFilterPrompt = category ? `matching category "${category}"` : "";
    const searchFilterPrompt = search ? `matching search keyword "${search}"` : "";

    const userPrompt = `You are a high-fidelity synthetic data generator for an advanced pharmaceutical news aggregator app called "PharmaNews". 
Generate a list of 4 highly detailed, extremely realistic, professional pharmaceutical news articles ${categoryFilterPrompt} ${searchFilterPrompt}. 
Each article must fit the interests of pharmacists, pharmacy students, researchers, drug discovery scientists, and biotech executives.

Provide the response strictly in JSON format. Do not include markdown codeblocks or any enclosing wrapper except valid JSON. 
The JSON must be an array of objects matching this exact structure:
[
  {
    "id": "gemini_[unique_number]",
    "title": "[A highly compelling and realistic pharmaceutical headline]",
    "summary": "[A professional 1-2 sentence overview of the article]",
    "content": "[Detailed news report of 3-4 paragraphs including scientific data, regulatory terms, endpoints, or market analytics]",
    "category": "[Must be one of: 'Drug Approvals', 'Clinical Trials', 'Medical Research', 'Healthcare Policy', 'Industry News', 'COVID-19 Updates', 'Biotechnology', 'AI in Healthcare']",
    "source": "[Realistic source name e.g. Clinical Trial Monitor, BioBusiness World, FDA Insights]",
    "author": "[A realistic name, potentially Dr. or PhD]",
    "date": "2026-06-19",
    "imageUrl": "[A high quality Unsplash medical/lab image URL e.g. https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800]",
    "readTime": "4 min read",
    "isBreaking": false,
    "isFeatured": false
  }
]`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text?.trim() || "";
    const generatedArticles = JSON.parse(textOutput);

    // Merge or prioritize generated, keeping LOCAL_ARTICLES as foundational database
    // Filter local articles using the same criteria
    let localFiltered = [...LOCAL_ARTICLES];
    if (category && category !== "All News" && category !== "All") {
      localFiltered = localFiltered.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      localFiltered = localFiltered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      );
    }

    // Combine and send
    const combined = [...generatedArticles, ...localFiltered];
    return res.json({ articles: combined, source: "gemini-ai" });

  } catch (error) {
    console.error("Gemini news generation failed, falling back to local dataset:", error);
    // Return filtered local cache as fallback gracefully
    let filtered = [...LOCAL_ARTICLES];
    if (category && category !== "All News" && category !== "All") {
      filtered = filtered.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      );
    }
    return res.json({ articles: filtered, source: "fallback-cache", error: true });
  }
});

// Serve direct article by ID (including fallback)
app.get("/api/article/:id", (req, res) => {
  const { id } = req.params;
  const article = LOCAL_ARTICLES.find((a) => a.id === id);
  if (article) {
    return res.json({ article });
  }
  return res.status(404).json({ error: "Article not found in memory database." });
});

// --- AI FEATURE 1: News Summarization ---
app.post("/api/ai/summarize", async (req, res) => {
  const { content, length } = req.body; // length can be "short", "medium", "detailed"
  if (!content) {
    return res.status(400).json({ error: "Content is required for summarization." });
  }

  const gemini = getGeminiClient();
  const wordLimit = length === "short" ? 50 : length === "medium" ? 150 : 300;
  
  if (!gemini) {
    // Elegant mockup fallback preserving clinical details
    const words = content.split(" ");
    const sliced = words.slice(0, wordLimit).join(" ") + "...";
    return res.json({
      summary: `[OFFLINE FALLBACK DEMO - KEY EXPIRED/PENDING]\n\nThis would be an AI-generated ${length} summary restricted to approx ${wordLimit} words. Here is a curated snippet: ${sliced}\n\nClinical Fact Sheet: This summary focuses on therapeutic outcomes, physiological markers, and strict safety indicators without prescribing or creating medical treatment guidelines.`,
      localFallback: true,
      length
    });
  }

  try {
    const prompt = `You are an advanced medical writer and pharmaceutical scientific editor. 
Summarize the following text accurately. Maintain strict factual safety and absolute adherence to medical correctness. 
Do not suggest treatments or formulate diagnostic medical advice.

Your target length is exactly ${length} (${wordLimit} words). Provide the summary directly. No header, introductory fluff, or meta reflections.

Text to summarize:
${content}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({
      summary: response.text?.trim() || "Failed to generate summary.",
      localFallback: false,
      length
    });
  } catch (error: any) {
    console.error("Gemini Summarization failed:", error);
    return res.json({
      summary: `[Fallback due to api failure] ${content.substring(0, 180)}...`,
      localFallback: true,
      length
    });
  }
});

// --- AI FEATURE 2: Automatic News Categorization ---
app.post("/api/ai/classify", async (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required for categorization." });
  }

  const targetCategories = [
    "Drug Approvals",
    "Clinical Trials",
    "Regulatory Affairs",
    "Medical Research",
    "Pharmacovigilance",
    "Biotechnology",
    "AI in Healthcare",
    "Industry Mergers and Acquisitions",
    "Healthcare Policy",
    "Vaccine Development"
  ];

  const gemini = getGeminiClient();

  if (!gemini) {
    // Generate realistic, deterministic score matching keywords
    let matchCat = "Medical Research";
    const textToScan = `${title} ${content || ""}`.toLowerCase();
    
    if (textToScan.includes("fda") || textToScan.includes("approv") || textToScan.includes("cleared")) {
      matchCat = "Drug Approvals";
    } else if (textToScan.includes("phase") || textToScan.includes("trial") || textToScan.includes("efficacy")) {
      matchCat = "Clinical Trials";
    } else if (textToScan.includes("policy") || textToScan.includes("supply chain") || textToScan.includes("nations") || textToScan.includes("zurich")) {
      matchCat = "Healthcare Policy";
    } else if (textToScan.includes("merger") || textToScan.includes("conglomerate") || textToScan.includes("billion") || textToScan.includes("acquire")) {
      matchCat = "Industry Mergers and Acquisitions";
    } else if (textToScan.includes("mrna") || textToScan.includes("vaccine") || textToScan.includes("influenza") || textToScan.includes("h5n1")) {
      matchCat = "Vaccine Development";
    } else if (textToScan.includes("ai ") || textToScan.includes("deep generative") || textToScan.includes("synthe")) {
      matchCat = "AI in Healthcare";
    } else if (textToScan.includes("crispr") || textToScan.includes("cas12") || textToScan.includes("nanoparticles")) {
      matchCat = "Biotechnology";
    }

    const scores = targetCategories.map(cat => ({
      category: cat,
      confidence: cat === matchCat ? 92 : Math.floor(Math.random() * 8) + 2
    })).sort((a,b) => b.confidence - a.confidence);

    return res.json({
      categories: scores,
      localFallback: true
    });
  }

  try {
    const prompt = `You are an AI classification agent specializing in pharmacomedical literature.
Categorize the article title "${title}" (with outline description: "${content ? content.substring(0, 150) : ''}") into the following 10 pharmaceutical disciplines. 
Provide a confidence score from 0 to 100 for each category.

Target categories:
${targetCategories.join("\n")}

Respond strictly in JSON array format containing objects with "category" and "confidence". Do not include markdown codeblocks or wrapper text.
Example:
[
  {"category": "Drug Approvals", "confidence": 95},
  {"category": "Vaccine Development", "confidence": 5}
]`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "[]");
    return res.json({
      categories: parsed,
      localFallback: false
    });
  } catch (error) {
    console.error("Gemini Categorization failed:", error);
    const mockScores = targetCategories.map((cat, i) => ({
      category: cat,
      confidence: i === 0 ? 80 : 5
    }));
    return res.json({
      categories: mockScores,
      localFallback: true
    });
  }
});

// --- AI FEATURE 3: Personalized Recommendations ---
app.post("/api/ai/recommend", async (req, res) => {
  const { userRole, interests } = req.body; // userRole is "Pharmacist", "Researcher", etc. interests is array of strings
  
  const activeInterests = interests || ["Clinical Research", "FDA Approvals"];
  const role = userRole || "Biomedical Specialist";

  const gemini = getGeminiClient();

  if (!gemini) {
    // Locally compute similarity matching user tags
    const scored = LOCAL_ARTICLES.map(art => {
      let score = 20; // base score
      if (role.toLowerCase() === "pharmacist" && (art.category === "Drug Approvals" || art.category === "Pharmacovigilance")) {
        score += 40;
      }
      if (role.toLowerCase() === "researcher" || role.toLowerCase() === "discovery scientist") {
        if (art.category === "Medical Research" || art.category === "Biotechnology" || art.category === "AI in Healthcare") {
          score += 50;
        }
      }
      if (role.toLowerCase() === "regulatory affairs" && (art.category === "Regulatory Affairs" || art.category === "Healthcare Policy" || art.category === "Drug Approvals")) {
        score += 45;
      }
      if (role.toLowerCase() === "student" && art.category === "Medical Research") {
        score += 30;
      }
      
      // Interest keyword matching
      activeInterests.forEach((interest: string) => {
        if (art.title.toLowerCase().includes(interest.toLowerCase()) || 
            art.summary.toLowerCase().includes(interest.toLowerCase())) {
          score += 30;
        }
      });

      return {
        article: art,
        recommendationScore: Math.min(score, 99),
        reason: `Matches your professional interest in ${activeInterests[0] || "pharmaceuticals"} and alignment with typical ${role} criteria.`
      };
    });

    const sortedRecommendations = scored.sort((a,b) => b.recommendationScore - a.recommendationScore);
    return res.json({
      recommendations: sortedRecommendations.slice(0, 3),
      localFallback: true
    });
  }

  try {
    const prompt = `You are a personalized recommendation service for "PharmaNews". 
We have a user with the following profile:
- Professional Role: ${role}
- Explicit Interests: ${activeInterests.join(", ")}

Here is our current pharmaceutical articles database:
${JSON.stringify(LOCAL_ARTICLES.map(a => ({ id: a.id, title: a.title, category: a.category, summary: a.summary })))}

Evaluate these articles and select the top 3 most relevant ones for this specific profile. 
For each selection, compute a recommendation percentage score (0-100) and draft a precise, highly personal 1-sentence explanation of why it fits their profile (e.g., "Highly relevant to your research in gene therapy vectors").

Provide your response strictly in JSON array format with this structure:
[
  {
    "articleId": "1",
    "recommendationScore": 95,
    "reason": "Directly presents clinical endpoints of gene-therapies matching your researcher profile."
  }
]`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedEvaluations = JSON.parse(response.text?.trim() || "[]");
    
    // Map article details back to the evaluations
    const recommendations = parsedEvaluations.map((evalObj: any) => {
      const art = LOCAL_ARTICLES.find(a => a.id === evalObj.articleId) || LOCAL_ARTICLES[0];
      return {
        article: art,
        recommendationScore: evalObj.recommendationScore,
        reason: evalObj.reason
      };
    });

    return res.json({
      recommendations,
      localFallback: false
    });
  } catch (error) {
    console.error("Personalized recommendations failed:", error);
    // fallback
    const fallbackList = LOCAL_ARTICLES.slice(0, 3).map((art, idx) => ({
      article: art,
      recommendationScore: 88 - idx * 5,
      reason: "Aligned with clinical trials and pharmaceutical breakthrough updates."
    }));
    return res.json({ recommendations: fallbackList, localFallback: true });
  }
});

// --- AI FEATURE 4: Interactive Pharma AI Chatbot ---
app.post("/api/ai/chat", async (req, res) => {
  const { messages, userMessage } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: "User message is empty." });
  }

  const gemini = getGeminiClient();

  if (!gemini) {
    // Generate context-aware fallback answer citing localized database records
    let reply = "";
    let citations: string[] = [];

    const normalized = userMessage.toLowerCase();
    if (normalized.includes("drug") || normalized.includes("approve")) {
      reply = `**CDSCO & FDA Weekly Drug Approval Report** (Offline Demo Mode):\n\n- The FDA has granted accelerated clearance to **Lignogene (lignogene-cept)**, an AAV9 vector gene therapy for Congenital Myopathic Atrophy (CMA) in infants.\n- Phase III metabolic trial data has been submitted for LY-90021, a dual-agonist oral formulation demonstrating 18.2% weight loss metrics, positioning it as an industry-disrupting metabolic blockbuster.\n\n*DISCLAIMER: This report is automatically generated using high-fidelity local database matrices. It does not constituent personal medical or clinical therapy recommendation guidelines.*`;
      citations = ["Lignogene FDA Fast-track Briefing Q2 2026", "Lancet Metabolism OR-METAB-5 Cohorts"];
    } else if (normalized.includes("clinical") || normalized.includes("trial") || normalized.includes("obesity") || normalized.includes("diabetes")) {
      reply = `**Incretin Co-Agonist Trial Summary (LY-90021)**:\n\n- **Study**: OR-METAB-5, Phase III randomized double-blind trial.\n- **Subjects**: 1,450 patients with obesity / comorbidities.\n- **Endpoint**: Mean weight loss of **18.2%** over 48 weeks. Favorable tolerability despite initial 8-week titration phase with mild gastrointestinal indices.\n- **Mechanism**: Small-molecule oral dual agonist of both GLP-1 and GIP receptors.`;
      citations = ["Lancet Endocrinology News, LY-90021 Clinical Update"];
    } else if (normalized.includes("alzheimer") || normalized.includes("congenital") || normalized.includes("neuro")) {
      reply = `**Neuromuscular & Neurodegenerative Therapeutic Area Intelligence**:\n\n- **Biopharma Nexus** is pioneering Congenital Myopathic Atrophy treatments with Lignogene which demonstrated 88% infant independent sitting rate.\n- Specialized blood-brain barrier penetrating ligands on lipid nanoparticles (LNPs) are being deployed in brain-tumors/oncology (Glioblastoma) targeting PLK1. Similar vectors are under investigation for Alzheimer's micro-mitochondria rejuvenation models.`;
      citations = ["Boston Children's Neuromuscular Center Bulletins", "Nature Biotechnology Cas12/LRP1 Brain Barrier Report"];
    } else {
      reply = `Welcome to the **PharmaNews AI assistant** (Local Fallback Core). I can answer inquiries regarding clinical trial endpoints, drug pipeline approvals, regulatory supply chain decisions, and bio-computation techniques.\n\nBased on our current database, here is is what I can analyze:\n1. **Gene Therapy** clinical milestones (Lignogene for CMA).\n2. **Incretin agonsits** oral delivery pipelines (LY-90021 weight-loss indices).\n3. **CRISPR lipid delivery systems** for intracranial tumors.\n4. **Supply Chain policy** changes (Zurich API Resiliency Declaration).`;
      citations = ["PharmaNews Database Engine v1.0"];
    }

    return res.json({
      text: reply,
      citations,
      localFallback: true
    });
  }

  try {
    // Format chat history for context
    const previousMessagesContext = (messages || [])
      .slice(-6)
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const systemInstruction = `You are "PharmaNews AI", an expert conversational artificial intelligence assistant specializing in pharmaceutical sciences, clinical drug discovery, biotechnology trials, and global health policy governance.

Rules for your responses:
1. Always base your replies on verified biochemical, regulatory, and industrial facts.
2. Cite sources explicitly using markdown brackets indicating the specific clinical trial, journal, or regulatory agency (e.g. [Phase III RESOLVE trial], [Nature Biotechnology Report 2026], [Zurich Declaration 2026]).
3. Use clean Markdown styling with headers, lists, and bold key clinical indicators.
4. Strictly maintain transparency. State if certain information lacks clear database matches.
5. STRICT COMPLIANCE: Do not generate diagnoses, treatment prescriptions, dosage guidelines, or medical advice under any circumstance. Clearly state that this information is for educational and research intelligence purposes only.
6. Local Context: You have access to these current articles in your active memory pool:
${JSON.stringify(LOCAL_ARTICLES.map(a => ({ title: a.title, summary: a.summary, content: a.content.substring(0, 300) })))}`;

    const prompt = `${previousMessagesContext}
User: ${userMessage}
Assistant (answer scientific, cite sources, provide disclaimer):`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Parse cited sources or extract them
    const responseText = response.text || "I was unable to retrieve a response from the clinical model.";
    
    // Simulate citation list extraction
    const citationRegex = /\[([^\]]+)\]/g;
    let match;
    const citations = [];
    while ((match = citationRegex.exec(responseText)) !== null) {
      if (match[1] && match[1].length < 60) {
        citations.push(match[1]);
      }
    }
    if (citations.length === 0) {
      citations.push("PharmaNews Academic Model");
    }

    return res.json({
      text: responseText,
      citations: Array.from(new Set(citations)),
      localFallback: false
    });

  } catch (error) {
    console.error("Gemini Chat failed:", error);
    return res.json({
      text: "I experienced a pipeline retrieval issue. Please query local database items.",
      citations: ["PharmaNews local repository"],
      localFallback: true
    });
  }
});

// --- AI FEATURE 5: Scientific Language Simplification ---
app.post("/api/ai/simplify", async (req, res) => {
  const { content, mode } = req.body; // mode is "student", "professional", "researcher"
  if (!content) {
    return res.status(400).json({ error: "Content is required for simplification." });
  }

  const gemini = getGeminiClient();

  if (!gemini) {
    // Generate static rewritten versions
    if (mode === "student") {
      return res.json({
        rewritten: `**Student Mode (Simplified Conceptual Walkthrough)**:\n\nThis breakthrough uses tiny lipid fat-bubbles (called lipid nanoparticles) acting like carrier-hulls to navigate past the strict brain security gate (the blood-brain barrier). Once safely inside, it uses a genetic editing cut-and-paste tool (Cas12) to switch off a special cell-division engine button. This starves and kills the cancerous tumor cells while keeping the neighboring healthy brain cells perfectly safe. In animal trials, this doubled the lifespan of subjects and shrank tumor weights by nearly three-quarters in under a month!`,
        mode,
        localFallback: true
      });
    } else if (mode === "professional") {
      return res.json({
        rewritten: `**Professional Mode (Clinical & Translational Practice Overview)**:\n\nThis novel gene-editing vector implements a synthetic LRP1 Ligand-conjugated Lipid Nanoparticle (LNP) model to successfully execute blood-brain barrier transport. Once localized in malignant glial fields, the modular CRISPR-Cas12a complex performs a highly targeted knockout of the mitotic engine PLK1. Phase trials in vivo generated 74% tumor volume shrinkage and prolonged survival rates from 22 to 58 days, with highly restricted off-target alterations under 0.05%, suggesting a substantial therapeutic matrix for neuro-oncology specialists.`,
        mode,
        localFallback: true
      });
    } else {
      return res.json({
        rewritten: `**Researcher Mode (High-Fidelity Biochemical Integrity)**:\n\nThis study outlines the synthesis of low-density lipoprotein receptor-related protein 1 (LRP1) targeted lipid nanoparticles encapsulating endonucleolytic CRISPR-Cas12a. Direct gene-editing targets Polo-like kinase 1 (PLK1) transcription pathways within intracranial glioblastoma cells. This molecular approach bypasses sovereign BBB physical limitations via receptor-mediated transcytosis, generating a 74% localized tumor bulk dissolution. Deep-sequencing protocols confirm off-target mutagenesis rates at ≤0.05%, validating structural endonuclease safety parameters.`,
        mode,
        localFallback: true
      });
    }
  }

  try {
    let modeGuideline = "";
    if (mode === "student") {
      modeGuideline = "Student Mode: Explain in highly visual, exciting, and easily understood language suitable for university freshmen or pharmacists in training. De-jargonize long Greek/Latin scientific components and replace them with common analogies without losing diagnostic factuality.";
    } else if (mode === "professional") {
      modeGuideline = "Professional Mode: Tailor for a doctor, clinical pharmacist, or hospital practitioner. Focus heavily on practical outcomes, patient tolerability profiles, clinical workflows, safety standards, dosing insights, and translational efficacy.";
    } else {
      modeGuideline = "Researcher Mode: Maintain maximum biomechanical complexity, deep scientific jargon, molecular pathways, genetic sequencing indices, structural crystallography terminologies, and statistical metrics. Tailor for molecular biologists and drug discovery scientists.";
    }

    const prompt = `You are a scientific translator and regulatory medical writer.
Rewrite the following scientific passage into "${modeGuideline}". Ensure scientific accuracy is preserved, zero factoids are hallucinated, and no medical prescription recommendations are made.

Passage:
${content}`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({
      rewritten: response.text?.trim() || "Failed to rewrite scientific text.",
      mode,
      localFallback: false
    });

  } catch (error) {
    console.error("Gemini Simplification failed:", error);
    return res.json({
      rewritten: `[Technical issue, displaying original content fallback]:\n\n${content}`,
      mode,
      localFallback: true
    });
  }
});

// --- AI FEATURE 6: Trend Detection & Analytics ---
app.post("/api/ai/trends", async (req, res) => {
  const gemini = getGeminiClient();

  if (!gemini) {
    // Return high-quality deterministic trend payload
    const demoTrends = {
      weeklyOverview: "The pharmaceutical sector is experiencing strong capital migrations towards long-acting metabolic disease controls and bio-engineered targeting vectors. Continuous manufacturing agreements have risen in geopolitical focus to protect global supply stability.",
      emergingDiseases: [
        { name: "H5N1 Avian Influenza (Mammalian Spillover)", level: "Critical Warning", growthTrend: "+68% monitoring indexes" },
        { name: "Myopathic Atrophy Genotypes", level: "Ultra-Rare Orphan", growthTrend: "+15% screening audits" }
      ],
      trendingTherapeuticAreas: [
        { area: "Incretin (GLP-1/GIP) Metabolic Modalities", share: 38, focus: "Oral dual-agonists for metabolic syndromic management" },
        { area: "BBB-Penetrating Immunotherapy Carriers", share: 24, focus: "Conjugated LNPs targeting intracranial carcinomas" },
        { area: "Synthetic Organelle Restoration", share: 20, focus: "Lipid-bilayer synthetic mitochondria delivery" },
        { area: "Antibody-Drug Conjugates (ADC)", share: 18, focus: "Next-gen targeted chemotherapy releases" }
      ],
      trendingCompanies: [
        { name: "Biopharma Nexus", metricType: "Pipeline Acceleration", score: 98, movement: "Up 5 places" },
        { name: "SyntheRx Biotech", metricType: "AI Molecular Synthesis Duration", score: 95, movement: "Breakout" },
        { name: "Vaxicor Labs", metricType: "Nucleoside mRNA Development Velocity", score: 91, movement: "Up 2 places" }
      ],
      fastGrowingResearchTopics: [
        "Receptor-mediated transcytosis across brain capillary fields",
        "AAV9 immunological encapsulation neutralization with corticosteroids",
        "Continuous API manufacturing paradigms via Zurich guidelines",
        "Deep generative structural modeling for undruggable KRAS binding pockets"
      ]
    };
    return res.json({
      trends: demoTrends,
      localFallback: true
    });
  }

  try {
    const prompt = `You are a leading pharmaceutical sector market intelligence officer.
Analyze current simulated articles and industrial dynamics to compile a comprehensive, highly credible weekly trend report.

Here is current news metadata:
${JSON.stringify(LOCAL_ARTICLES.map(a => ({ title: a.title, category: a.category, summary: a.summary })))}

Assemble a beautiful, data-rich weekly trend report. Respond strictly in JSON format matching this schema:
{
  "weeklyOverview": "[A concise, highly professional summary of key movements seen in the industry]",
  "emergingDiseases": [
    { "name": "[Specific disease]", "level": "[Sovereign warning severity]", "growthTrend": "[Growth metric or trend percentage]" }
  ],
  "trendingTherapeuticAreas": [
    { "area": "[Mechanism or therapeutic target]", "share": 38, "focus": "[Clinical focus details]" }
  ],
  "trendingCompanies": [
    { "name": "[Specific developer]", "metricType": "[e.g. Patent Velocity, pipeline index]", "score": 95, "movement": "[e.g. Up 3 places]" }
  ],
  "fastGrowingResearchTopics": [
    "[Specific molecular / chemical / genetic topic]",
    "[Another topic]"
  ]
}

Ensure your response is valid JSON. Remove any markdown code wrappers.`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedTrends = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      trends: parsedTrends,
      localFallback: false
    });

  } catch (error) {
    console.error("Gemini Trends retrieval failed:", error);
    return res.json({ error: "Failed to generate AI trends.", localFallback: true });
  }
});

// --- AI FEATURE 7: Duplicate Detection & Smart Merger ---
app.post("/api/ai/deduplicate", async (req, res) => {
  const { articleIdA, articleIdB } = req.body;
  
  const a = LOCAL_ARTICLES.find(item => item.id === articleIdA) || LOCAL_ARTICLES[0];
  const b = LOCAL_ARTICLES.find(item => item.id === articleIdB) || LOCAL_ARTICLES[1];

  const gemini = getGeminiClient();

  if (!gemini) {
    // Generate simulated smart merged article content
    return res.json({
      isDuplicateRange: articleIdA === articleIdB ? "Same Article" : "Moderate overlap based on incretin metrics (simulated)",
      overlapPercentage: articleIdA === articleIdB ? 100 : 45,
      mergedTitle: `Synthesized Update: ${a.title.split(" ").slice(0, 5).join(" ")} & ${b.title.split(" ").slice(0, 4).join(" ")}`,
      mergedContent: `### Consolidated Clinical Update (Offline Merge Platform)\n\nThis consolidated dispatch combines primary endpoints and market signals extracted from multiple agencies.\n\n#### Component 1: ${a.title}\n${a.summary}\n\n#### Component 2: ${b.title}\n${b.summary}\n\n#### Deduplication Audit Insights:\n- Combined drug discovery platforms indicate that AI generative networks and oral metabolic therapies are both driving a shorter timeline to commercial monetization.\n- Regulatory approval tracking has been cross-referenced to avoid repeating clinical milestones or trial patient cohorts.`,
      identifiedDuplicates: [
        "Overlapping mentions of Phase III trial durations",
        "Redundant executive citations regarding biological molecular speeds"
      ],
      localFallback: true
    });
  }

  try {
    const prompt = `You are a medical duplicate-detection system for a premier academic news feed.
Compare these two pharmaceutical articles and identify overlapping clinical claims, redundancy, and matching facts.
Merge them perfectly into a single, high-fidelity, comprehensive clinical report that combines the best points of both without loss of scientific integrity, or technical specifications.

Article A:
Title: ${a.title}
Content: ${a.content}

Article B:
Title: ${b.title}
Content: ${b.content}

Provide your analysis in strict JSON format. Do not include markdown codeblocks or wrapper text.
Required JSON schema:
{
  "isDuplicateRange": "[Categorize state: 'High Overlap (Merge Mandated)', 'Low Overlap', or 'Complementary/Unrelated']",
  "overlapPercentage": 72,
  "mergedTitle": "[A unified title combining these insights cleanly]",
  "mergedContent": "[Fully merged and consolidated detailed scientific report, styled with pristine markdown headers and lists]",
  "identifiedDuplicates": [
    "[Redundant fact or duplicated citation 1]",
    "[Redundant fact or duplicated citation 2]"
  ]
}

Your response must be valid JSON matching this schema exactly.`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedMerge = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      ...parsedMerge,
      localFallback: false
    });

  } catch (error) {
    console.error("Gemini deduplication failed:", error);
    return res.json({ error: "Failed to perform AI deduplication and merging.", localFallback: true });
  }
});

// --- AI FEATURE 8: Smart Semantic Search ---
app.post("/api/ai/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Search query is empty" });
  }

  const gemini = getGeminiClient();

  if (!gemini) {
    // Quick semantic keyword mapping fallbacks
    const q = query.toLowerCase();
    const scoredList = LOCAL_ARTICLES.map(art => {
      let score = 5;
      let matchedReason = "Indexed inside the pharmaceutical platform.";
      
      if (q.includes("weight") || q.includes("loss") || q.includes("metabolism") || q.includes("diet") || q.includes("obesity")) {
        if (art.category === "Clinical Trials" && art.title.includes("Weight")) {
          score = 98;
          matchedReason = "Strong semantic correspondence to GLP-1/GIP receptor double agonists.";
        }
      }
      if (q.includes("gene") || q.includes("mutation") || q.includes("dna") || q.includes("neuromuscular") || q.includes("muscle") || q.includes("rare") || q.includes("cma")) {
        if (art.title.includes("Gene Therapy") || art.title.includes("Mitochondria")) {
          score = 96;
          matchedReason = "Corresponds with nucleic acid therapies, synthetic mitochondrial vectors, and neuromuscular orphan codes.";
        }
      }
      if (q.includes("brain") || q.includes("cancer") || q.includes("tumor") || q.includes("tumor") || q.includes("glioma") || q.includes("crispr")) {
        if (art.title.includes("Crispr-Cas12") || art.title.includes("Inhibitor")) {
          score = 95;
          matchedReason = "Relevant to blood-brain barrier transport, oncology, and CRISPR enzyme knockouts.";
        }
      }
      if (q.includes("policy") || q.includes("supply") || q.includes("shortage") || q.includes("global") || q.includes("api ") || q.includes("nation")) {
        if (art.title.includes("Supply Chain")) {
          score = 92;
          matchedReason = "Directly connected to sovereign supply resilient declarations, continuous production, and active API reserves.";
        }
      }
      if (q.includes("ai ") || q.includes("model") || q.includes("molecule") || q.includes("discovery") || q.includes("generative")) {
        if (art.title.includes("AI-Designed") || art.title.includes("Crispr")) {
          score = 94;
          matchedReason = "Corresponds with AI-accelerated small molecule synthesis, algorithmic design buffers, and biological deep modeling.";
        }
      }

      // Keyword overlaps general fallback score booster
      if (art.title.toLowerCase().includes(q) || art.summary.toLowerCase().includes(q)) {
        score = Math.max(score, 80);
      }

      return {
        article: art,
        semanticMatchScore: score,
        semanticReason: matchedReason
      };
    }).filter(i => i.semanticMatchScore > 10)
      .sort((a,b) => b.semanticMatchScore - a.semanticMatchScore);

    return res.json({
      results: scoredList,
      localFallback: true
    });
  }

  try {
    const prompt = `You are a Smart Semantic Search engine for "PharmaNews". 
Our user asks naturally: "${query}"

Here is our available catalog:
${JSON.stringify(LOCAL_ARTICLES.map(a => ({ id: a.id, title: a.title, category: a.category, summary: a.summary })))}

Evaluate each article. Determine if there is a semantic match (not just literal matches). If there is a conceptual connection, compute a semantic correlation percentage (0-100) and draft a brief 1-sentence reasoning statement of why this matches the prompt.
Only return articles with correlation > 20.

Provide your response strictly in JSON array format with this structure:
[
  {
    "articleId": "1",
    "semanticCorrelation": 96,
    "semanticReason": "Directly addresses your search for gene therapy solutions with updated clinical trial numbers."
  }
]`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedResults = JSON.parse(response.text?.trim() || "[]");
    const results = parsedResults.map((resObj: any) => {
      const art = LOCAL_ARTICLES.find(a => a.id === resObj.articleId) || LOCAL_ARTICLES[0];
      return {
        article: art,
        semanticMatchScore: resObj.semanticCorrelation,
        semanticReason: resObj.semanticReason
      };
    }).sort((a: any, b: any) => b.semanticMatchScore - a.semanticMatchScore);

    return res.json({
      results,
      localFallback: false
    });

  } catch (error) {
    console.error("Gemini Semantic Search failed:", error);
    // filter simple keywords
    const matches = LOCAL_ARTICLES.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())).map(art => ({
      article: art,
      semanticMatchScore: 85,
      semanticReason: "Matches search keywords inside title or category."
    }));
    return res.json({ results: matches, localFallback: true });
  }
});

// ============================================================
// AUTO NEWS API ENDPOINTS
// ============================================================

// Get today's auto-fetched news
app.get("/api/auto-news", (req, res) => {
  const news = getCachedNews();
  res.json({
    articles: news,
    count: news.length,
    source: news.length > 0 ? "live" : "local",
    message: news.length > 0
      ? "Live pharma news updated daily at 5 AM IST"
      : "Using local articles — add NEWS_API_KEY for live news"
  });
});

// Manual trigger to refresh news
app.post("/api/auto-news/refresh", async (req, res) => {
  try {
    const articles = await fetchAndUpdateNews();
    res.json({ success: true, count: articles.length });
  } catch (error) {
    res.json({ success: false, error: String(error) });
  }
});

// Manual trigger for social posting (for testing Buffer)
app.post("/api/agents/trigger-social", async (req, res) => {
  try {
    const token = process.env.BUFFER_ACCESS_TOKEN;
    if (!token) return res.json({ success: false, error: "No BUFFER_ACCESS_TOKEN set in Render environment" });

    // Test with Buffer GraphQL API
    const gqlRes = await fetch("https://api.bufferapp.com/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: `{ channels { id name service serviceType } }` })
    });

    const gqlData = await gqlRes.json();
    const channels = gqlData?.data?.channels || [];

    if (gqlData.errors) {
      return res.json({
        success: false,
        error: "Buffer GraphQL error",
        details: gqlData.errors,
        hint: "Your token may be expired. Go to buffer.com → Settings → Apps & Integrations → regenerate token"
      });
    }

    if (!channels.length) {
      return res.json({
        success: false,
        error: "No channels found in Buffer",
        hint: "Go to buffer.com → Add a channel → reconnect Instagram/Twitter/LinkedIn"
      });
    }

    res.json({
      success: true,
      message: `Buffer connected! Found ${channels.length} channels`,
      channels: channels.map((c: any) => ({
        id: c.id,
        service: c.service,
        name: c.name,
        type: c.serviceType
      }))
    });
  } catch (error) {
    res.json({ success: false, error: String(error) });
  }
});


// ============================================================
// NEWSLETTER, BOOKMARKS, AGENT STATUS — Complete API Suite
// ============================================================

// Newsletter subscribe
app.post("/api/newsletter/subscribe", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.json({ success: false, error: "Email required" });
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { error } = await supabase.from("subscribers").upsert(
      { email, name: name || "", active: true, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) return res.json({ success: false, error: error.message });
    // Send welcome email via Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "PharmaNews <newsletter@pharmanews.co.in>",
          to: email,
          subject: "Welcome to PharmaNews Weekly Digest! 💊",
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1e3a5f;padding:24px;text-align:center">
              <h1 style="color:white;margin:0">Pharma<span style="color:#60a5fa">NEWS</span></h1>
            </div>
            <div style="padding:32px">
              <h2 style="color:#1e3a5f">Welcome aboard! 🎉</h2>
              <p>You're now subscribed to the PharmaNews Weekly Digest — trusted by 14,000+ healthcare professionals.</p>
              <p>Every Monday at 8 AM IST you'll receive:</p>
              <ul>
                <li>Top 5 pharma news stories of the week</li>
                <li>FDA approval updates</li>
                <li>Clinical trial breakthroughs</li>
                <li>AI in healthcare insights</li>
              </ul>
              <a href="https://pharmanews.co.in" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px">Visit PharmaNews →</a>
            </div>
            <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#6b7280">
              © 2026 PharmaNews • AI-Powered Pharmaceutical Intelligence
            </div>
          </div>`
        })
      });
    }
    res.json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    res.json({ success: false, error: String(error) });
  }
});

// Newsletter unsubscribe
app.post("/api/newsletter/unsubscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false });
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    await supabase.from("subscribers").update({ active: false }).eq("email", email);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: String(error) });
  }
});

// Get all articles from Supabase (real data)
app.get("/api/articles", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { category, limit = 20, page = 1 } = req.query;
    let query = supabase.from("articles").select("*").eq("published", true)
      .order("created_at", { ascending: false })
      .range((Number(page)-1)*Number(limit), Number(page)*Number(limit)-1);
    if (category && category !== "All") query = query.eq("category", category);
    const { data, count } = await query;
    res.json({ articles: data || [], total: count, page: Number(page) });
  } catch (error) {
    res.json({ articles: [], error: String(error) });
  }
});

// Get agent status + logs
app.get("/api/agents/status", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: logs } = await supabase.from("agent_logs").select("*")
      .gte("ran_at", yesterday).order("ran_at", { ascending: false });
    const { count: totalArticles } = await supabase.from("articles")
      .select("*", { count:"exact", head:true }).eq("published", true);
    const { count: totalSubs } = await supabase.from("subscribers")
      .select("*", { count:"exact", head:true }).eq("active", true);
    const { count: socialPosts } = await supabase.from("social_posts")
      .select("*", { count:"exact", head:true }).eq("status", "posted");
    res.json({
      agents: logs || [],
      stats: { totalArticles, totalSubs, socialPosts },
      system: "online",
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.json({ agents: [], stats: {}, system: "error" });
  }
});

// Get competitor insights
app.get("/api/competitor-insights", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data } = await supabase.from("competitor_data").select("*")
      .neq("competitor_name", "STRATEGY_REPORT")
      .order("analyzed_at", { ascending: false });
    res.json({ competitors: data || [] });
  } catch (error) {
    res.json({ competitors: [] });
  }
});

// Get SEO performance
app.get("/api/seo/performance", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data } = await supabase.from("seo_data").select("*")
      .order("analyzed_at", { ascending: false }).limit(50);
    const avgScore = data?.length ? Math.round(data.reduce((a,b) => a+(b.score||0), 0)/data.length) : 0;
    res.json({ seoData: data || [], avgScore, totalOptimized: data?.length || 0 });
  } catch (error) {
    res.json({ seoData: [], avgScore: 0 });
  }
});

// Social posts status
app.get("/api/social/posts", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data } = await supabase.from("social_posts").select("*, articles(title, category)")
      .order("posted_at", { ascending: false }).limit(20);
    res.json({ posts: data || [] });
  } catch (error) {
    res.json({ posts: [] });
  }
});

// ============================================================
// SEO ROUTES — Sitemap, Robots.txt, Google Verification
// ============================================================

// Sitemap XML — tells Google all your pages
app.get("/sitemap.xml", async (req, res) => {
  const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";

  // Get all published articles from Supabase
  let articleUrls = "";
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data: articles } = await supabase
      .from("articles")
      .select("id, created_at, category")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(500);

    articleUrls = (articles || []).map(a => `
  <url>
    <loc>${SITE_URL}/article/${a.id}</loc>
    <lastmod>${new Date(a.created_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join("");
  } catch (e) {}

  const categories = [
    "Drug Approvals", "Clinical Trials", "Biotechnology",
    "AI in Healthcare", "Industry News", "Medical Research",
    "Healthcare Policy", "Oncology", "Vaccines"
  ];

  const categoryUrls = categories.map(cat => `
  <url>
    <loc>${SITE_URL}/category/${encodeURIComponent(cat.toLowerCase().replace(/ /g, "-"))}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/ai-lab</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/dashboard</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
  <!-- Categories -->
  ${categoryUrls}
  <!-- Articles -->
  ${articleUrls}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.send(sitemap);
});

// Robots.txt — tells Google what to crawl
app.get("/robots.txt", (req, res) => {
  const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /private/

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay for bots
Crawl-delay: 1`);
});

// Google Site Verification — add your verification code to Render env
app.get("/google-site-verification:code", (req, res) => {
  const code = process.env.GOOGLE_SITE_VERIFICATION || "";
  res.setHeader("Content-Type", "text/html");
  res.send(`google-site-verification: ${code}`);
});

// Article Schema — NewsArticle JSON-LD for each article
app.get("/api/article-schema/:id", async (req, res) => {
  const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data: article } = await supabase.from("articles")
      .select("*").eq("id", req.params.id).single();
    if (!article) return res.status(404).json({ error: "Not found" });

    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.seo_title || article.title,
      "description": article.seo_description || article.summary,
      "image": article.image_url,
      "datePublished": article.created_at,
      "dateModified": article.created_at,
      "author": {
        "@type": "Person",
        "name": article.author || "PharmaNews Staff"
      },
      "publisher": {
        "@type": "NewsMediaOrganization",
        "name": "PharmaNews",
        "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` },
        "url": SITE_URL
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#article/${article.id}`
      },
      "articleSection": article.category,
      "keywords": article.keywords || article.category,
      "url": `${SITE_URL}/#article/${article.id}`,
      "canonicalUrl": `${SITE_URL}/#article/${article.id}`
    };
    res.json(schema);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Open Graph Image Generator for articles
app.get("/api/og-image/:id", async (req, res) => {
  const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const { data: article } = await supabase.from("articles")
      .select("title, category, image_url, author").eq("id", req.params.id).single();
    if (!article) return res.status(404).send("Not found");

    // Generate SVG OG image
    const title = (article.title || "").substring(0, 80);
    const category = article.category || "Pharma News";
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3a5f;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <rect x="0" y="0" width="8" height="630" fill="#60a5fa" />
      <text x="60" y="80" font-family="Arial" font-size="20" fill="#60a5fa" font-weight="bold" text-transform="uppercase">${category.toUpperCase()}</text>
      <foreignObject x="60" y="120" width="1080" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:52px;font-weight:bold;color:white;line-height:1.3">${title}</div>
      </foreignObject>
      <text x="60" y="550" font-family="Arial" font-size="24" fill="#93c5fd">By ${article.author || "PharmaNews Staff"}</text>
      <text x="60" y="590" font-family="Arial" font-size="20" fill="#64748b">pharmanews.co.in</text>
      <text x="1140" y="590" font-family="Arial" font-size="36" fill="#1d4ed8" text-anchor="end">💊</text>
    </svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg);
  } catch (e) { res.status(500).send("Error"); }
});

// Google News Sitemap
app.get("/news-sitemap.xml", async (req, res) => {
  const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";
  let newsItems = "";
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const twoDaysAgo = new Date(Date.now() - 2*24*60*60*1000).toISOString();
    const { data: articles } = await supabase.from("articles")
      .select("id, title, created_at, category, source")
      .eq("published", true).gte("created_at", twoDaysAgo)
      .order("created_at", { ascending: false }).limit(50);
    newsItems = (articles || []).map(a => `
  <url>
    <loc>${SITE_URL}/article/${a.id}</loc>
    <news:news>
      <news:publication>
        <news:name>PharmaNews</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.created_at).toISOString()}</news:publication_date>
      <news:title>${a.title?.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</news:title>
      <news:keywords>${a.category}, pharmaceutical, healthcare</news:keywords>
    </news:news>
  </url>`).join("");
  } catch {}
  res.setHeader("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsItems}
</urlset>`);
});

// Serve manifest.json
app.get("/manifest.json", (req, res) => {
  res.json({
    name: "PharmaNews — Pharmaceutical Intelligence",
    short_name: "PharmaNews",
    description: "AI-powered pharmaceutical news platform",
    start_url: "/",
    display: "standalone",
    background_color: "#060d1a",
    theme_color: "#2563eb",
    icons: [
      { src: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=192&h=192&fit=crop", sizes: "192x192", type: "image/png" },
      { src: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=512&h=512&fit=crop", sizes: "512x512", type: "image/png" }
    ],
    categories: ["news", "medical", "health"]
  });
});

// Buffer Test Route — visit /api/buffer/test to check connection
app.get("/api/buffer/test", async (req, res) => {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) return res.json({ success: false, error: "No BUFFER_ACCESS_TOKEN in environment" });
  try {
    const profileRes = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${token}`);
    const profiles = await profileRes.json();
    if (!profileRes.ok) return res.json({ success: false, error: "Buffer API error", details: profiles });
    if (!Array.isArray(profiles) || profiles.length === 0)
      return res.json({ success: false, error: "No profiles found. Connect Instagram/Twitter/LinkedIn in Buffer." });
    res.json({
      success: true,
      message: `Buffer connected! ${profiles.length} profiles found`,
      profiles: profiles.map((p: any) => ({ service: p.service, username: p.formatted_username, id: p.id }))
    });
  } catch (e) { res.json({ success: false, error: String(e) }); }
});

// Manual Buffer post — POST /api/buffer/post-now
app.post("/api/buffer/post-now", async (req, res) => {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) return res.json({ success: false, error: "No BUFFER_ACCESS_TOKEN" });
  try {
    const profileRes = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${token}`);
    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || !profiles.length)
      return res.json({ success: false, error: "No Buffer profiles found" });
    const profileIds = profiles.map((p: any) => p.id);

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || "");
    const { data: articles } = await supabase.from("articles").select("*").eq("published", true).order("created_at", { ascending: false }).limit(1);
    if (!articles?.length) return res.json({ success: false, error: "No articles in Supabase" });

    const article = articles[0];
    const SITE_URL = process.env.SITE_URL || "https://pharmanews.co.in";
    const text = `🔬 ${article.title}\n\n${(article.summary || "").substring(0, 100)}...\n\nRead more: ${SITE_URL}\n\n#PharmaNews #Healthcare #FDA #Pharma`;

    const body = new URLSearchParams();
    body.append("text", text.substring(0, 280));
    body.append("access_token", token);
    body.append("now", "true");
    profileIds.forEach((id: string) => body.append("profile_ids[]", id));

    const postRes = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const result = await postRes.json();
    res.json({ success: postRes.ok, result, articleTitle: article.title, profilesUsed: profiles.length });
  } catch (e) { res.json({ success: false, error: String(e) }); }
});

// Admin stats endpoint
app.get("/api/admin/stats", async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || ""
    );
    const [articles, subscribers, social, newsletters, seo, logs] = await Promise.all([
      supabase.from("articles").select("*", { count:"exact", head:true }).eq("published", true),
      supabase.from("subscribers").select("*", { count:"exact", head:true }).eq("active", true),
      supabase.from("social_posts").select("*", { count:"exact", head:true }).eq("status", "posted"),
      supabase.from("newsletters").select("recipients_count").order("sent_at", { ascending:false }).limit(1),
      supabase.from("seo_data").select("score").order("analyzed_at", { ascending:false }).limit(50),
      supabase.from("agent_logs").select("*").order("ran_at", { ascending:false }).limit(20)
    ]);
    const avgSEO = seo.data?.length ? Math.round(seo.data.reduce((a:number,b:any)=>a+(b.score||0),0)/seo.data.length) : 0;
    res.json({
      articles: articles.count || 0,
      subscribers: subscribers.count || 0,
      socialPosts: social.count || 0,
      newsletterReach: newsletters.data?.[0]?.recipients_count || 0,
      avgSeoScore: avgSEO,
      agentLogs: logs.data || [],
      lastUpdated: new Date().toISOString()
    });
  } catch (e) { res.json({ error: String(e) }); }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
startAllAgents();
scheduleDailyNewsUpdate();
