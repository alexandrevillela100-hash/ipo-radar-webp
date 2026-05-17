import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import IPOCard from "@/components/IPOCard";
import SECIPOCard from "@/components/SECIPOCard";
import FeaturedIPOs from "@/components/FeaturedIPOs";
import { ipoCompanies } from "@/lib/data";
import {
  Radar,
  FileSearch,
  GitCompare,
  Bell,
  BarChart3,
  Shield,
  ArrowRight,
  TrendingUp,
  Sparkles,
  User,
  Send,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";

/*
 * Design: Dark Terminal Luxe
 * - Deep charcoal base, slate card surfaces
 * - Teal primary accent, muted gold highlights
 * - DM Sans headings, JetBrains Mono for financial data
 * - Airbnb-style card grid for Upcoming IPOs
 *
 * Data: Hybrid approach
 * - Real SEC data from EDGAR (fetched via tRPC)
 * - Mock data as fallback / showcase examples
 */

/* ─── FAQ Accordion Item ─────────────────────────────────────────────── */
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/40 first:border-t first:border-border/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group cursor-pointer"
      >
        <span
          className={`text-[15px] sm:text-base font-medium transition-colors duration-200 pr-4 ${
            isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
          }`}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={`shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 ${
            isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 0.5V13.5M0.5 7H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  // Path A: stub for CTA buttons that previously routed to auth-gated pages.
  const comingSoon = (label: string) => {
    toast("Backend coming soon", {
      description: `${label} will be available when the auth layer ships. Preview build.`,
    });
  };


  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handlePlaceholder = (label: string) => {
    toast("Feature coming soon", {
      description: `${label} will be available in a future release.`,
    });
  };

  // ─── Real SEC Data ──────────────────────────────────────────────────────
  // Path A static deploy: no backend, so we stub the filings query.
  // The Home page falls back to the curated mock data in @/lib/data
  // for the "Upcoming IPOs" section.
  const filingsQuery = {
    data: undefined as any,
    isLoading: false,
    refetch: () => {},
  };

  // Deduplicate filings: show only the most recent filing per company
  const uniqueFilings = useMemo(() => {
    if (!filingsQuery.data) return [];
    const seen = new Set<string>();
    return filingsQuery.data.filter((item) => {
      if (seen.has(item.company.cik)) return false;
      seen.add(item.company.cik);
      return true;
    });
  }, [filingsQuery.data]);

  const hasRealData = uniqueFilings.length > 0;

  // Split filings into Upcoming (initial filings) and Recent (amendments)
  const upcomingIPOs = useMemo(() => {
    return uniqueFilings.filter(
      (item) => !item.filing.formType.includes("/A")
    );
  }, [uniqueFilings]);

  const recentIPOs = useMemo(() => {
    return uniqueFilings.filter(
      (item) => item.filing.formType.includes("/A")
    );
  }, [uniqueFilings]);

  // ─── IPO tab state (Upcoming / Recent / All) ───────────────────────────
  const [ipoTab, setIpoTab] = useState<"upcoming" | "recent" | "all">(
    "upcoming"
  );
  const displayedIPOs = useMemo(() => {
    if (ipoTab === "upcoming") return upcomingIPOs;
    if (ipoTab === "recent") return recentIPOs;
    return uniqueFilings;
  }, [ipoTab, upcomingIPOs, recentIPOs, uniqueFilings]);

  // ─── Last SEC sync (derived from most recent filing date) ──────────────
  const lastSyncLabel = useMemo(() => {
    if (!filingsQuery.data || filingsQuery.data.length === 0) return null;
    // Use filingDate (YYYY-MM-DD) as a proxy for sync recency
    const mostRecent = filingsQuery.data.reduce((max, f) =>
      f.filing.filingDate > max ? f.filing.filingDate : max,
      filingsQuery.data[0].filing.filingDate
    );
    const then = new Date(mostRecent).getTime();
    const diffMs = Date.now() - then;
    const minutes = Math.max(1, Math.floor(diffMs / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }, [filingsQuery.data]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section — Velocia look: hyper-realistic photo, serif display, DM Mono eyebrow */}
      <section className="relative min-h-[88vh] flex flex-col justify-end pt-28 pb-24 overflow-hidden grain-overlay">
        {/* Hyper-realistic photo background */}
        <div className="vv-hero-bg" aria-hidden="true" />
        {/* Teal grid overlay */}
        <div className="vv-hero-grid" aria-hidden="true" />

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="vv-eyebrow mb-7">
              <Radar className="w-3 h-3 -mr-2 opacity-80" />
              SEC Filing Intelligence
            </div>
            <h1 className="vv-display text-[clamp(48px,7.5vw,104px)] text-foreground max-w-[900px] mb-8">
              See the IPO <em>before</em> the market does.
            </h1>
            <p className="text-[17px] sm:text-lg text-foreground/65 max-w-xl leading-[1.85] font-light mb-11">
              IPO Radar AI turns SEC filings into institutional-grade initiation
              reports — instantly. Monitor S-1 and F-1 filings, track amendments,
              and get AI-generated first-look research.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={() => comingSoon("Get Started")}
                className="vv-btn-primary"
              >
                Get Started Free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => window.open("https://ipo-radar-calendar-app.vercel.app/reports/psus", "_blank")}
                className="vv-btn-outline"
              >
                See a Sample Report
              </button>
            </div>
            <p className="mt-8 font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase">
              Free tier
              <span className="mx-3 opacity-40">·</span>
              Pro $49/mo
              <span className="mx-3 opacity-40">·</span>
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Trust/Proof Bar — concrete source proof in DM Mono */}
      <section className="border-y border-border/40 bg-card/40">
        <div className="container py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { label: "Source", value: "SEC EDGAR (official)" },
              { label: "Coverage", value: "S-1 · S-1/A · F-1 · F-1/A" },
              { label: "Latency", value: "Minutes after publication" },
              { label: "Method", value: "Structured extraction, zero fabrication" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-primary uppercase tracking-[0.22em] opacity-80">
                  {item.label}
                </span>
                <span className="font-mono text-[11px] text-foreground/85 tracking-[0.06em]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* The Research Gap — bridge from the hero into the IPO grid */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="vv-eyebrow mb-7 justify-center inline-flex">
              The Research Gap
            </div>
            <h2 className="vv-section-title text-[clamp(34px,4vw,64px)] text-foreground leading-[1.08] mb-8">
              Institutional research used to cost{" "}
              $50,000 &mdash; <em>or a relationship with Goldman</em>.
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-3xl mx-auto font-light leading-[1.85]">
              For 40 years, bulge-bracket banks have published initiation
              reports on every IPO filer &mdash; for their hedge fund clients.
              Everyone else waits for CNBC. IPO Radar AI closes the gap. Same
              filings.{" "}
              <em className="text-primary not-italic font-medium">Forty-nine dollars a month.</em>
            </p>
          </div>

          {/* Two-column comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 max-w-5xl mx-auto">
            {/* Old model */}
            <div
              className="bg-card border border-border/50 p-7"
              style={{ borderRadius: "4px" }}
            >
              <div className="font-mono text-[10px] text-muted-foreground tracking-[0.22em] uppercase mb-1">
                The Old Model
              </div>
              <div className="font-mono text-[11px] text-muted-foreground/60 tracking-[0.14em] mb-6">
                Gatekept research
              </div>
              <ul className="space-y-3.5">
                {[
                  "Sell-side reports gated at $50K+/yr",
                  "Bloomberg terminal at $2,000/mo",
                  "300-page S-1s, unreadable manually",
                  "News summaries arrive days late",
                  "Edge belongs to whoever has the terminal",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[14px] text-foreground/75 leading-relaxed">
                    <X className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* IPO Radar */}
            <div
              className="border border-primary/35 p-7"
              style={{
                borderRadius: "4px",
                background: "linear-gradient(180deg, rgba(3,200,181,0.06), rgba(3,200,181,0.01))",
              }}
            >
              <div className="font-mono text-[10px] text-primary tracking-[0.22em] uppercase mb-1">
                With IPO Radar AI
              </div>
              <div className="font-mono text-[11px] text-muted-foreground/60 tracking-[0.14em] mb-6">
                Democratized research
              </div>
              <ul className="space-y-3.5">
                {[
                  "Institutional-grade report on every filer",
                  "Primary-source SEC data — same source banks use",
                  "Amendment diffs in minutes, not hours",
                  "Cited, structured, fabrication-free",
                  "Edge democratized — not gatekept",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[14px] text-foreground leading-relaxed">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer tagline */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 font-mono text-[10px] text-primary/75 tracking-[0.22em] uppercase">
              <span>Institutional Methodology</span>
              <span className="opacity-40">·</span>
              <span>Retail Accessible</span>
              <span className="opacity-40">·</span>
              <span>$49/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loading state */}
      {filingsQuery.isLoading && (
        <section className="py-20">
          <div className="container flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">
              Loading SEC filings...
            </span>
          </div>
        </section>
      )}

      {/* Featured IPOs — live Sanity data, 3 recent + 3 upcoming */}
      <FeaturedIPOs />

      {/* How It Works */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="text-center mb-14">
            <div className="vv-eyebrow mb-5 justify-center">
              The Pipeline
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground mb-4">
              From SEC filing to <em>institutional research</em>.
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-xl mx-auto font-light leading-[1.75]">
              Four automated steps, zero manual handoffs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                title: "Detect",
                description:
                  "Monitor new SEC IPO-related filings (S-1, F-1) in real time with automated polling.",
                icon: Radar,
              },
              {
                step: "02",
                title: "Structure",
                description:
                  "Extract issuer, offering, financial, and risk data into a usable structured schema.",
                icon: FileSearch,
              },
              {
                step: "03",
                title: "Compare",
                description:
                  "Identify what changed across amendments with side-by-side diff analysis.",
                icon: GitCompare,
              },
              {
                step: "04",
                title: "Deliver",
                description:
                  "Generate first-look reports, alerts, dashboards, and filing timelines automatically.",
                icon: Bell,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-7 bg-card border border-border/60 group hover:border-primary/40 transition-all"
                style={{ borderRadius: "2px" }}
              >
                <span className="font-mono text-[10px] text-primary/60 tracking-[0.2em]">
                  {item.step} —
                </span>
                <div className="mt-5 mb-4">
                  <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-foreground mb-3 leading-tight">
                  {item.title}
                </h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed font-light">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-24 border-t border-border/40" style={{ background: "oklch(0.17 0.013 195)" }}>
        <div className="container">
          <div className="text-center mb-14">
            <div className="vv-eyebrow mb-5 justify-center">
              Capabilities
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground mb-4">
              Built for <em>IPO intelligence</em>.
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-xl mx-auto font-light leading-[1.75]">
              Every feature designed to give you an edge in tracking and analyzing IPO filings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "SEC Filing Monitor",
                description:
                  "Real-time monitoring of S-1, S-1/A, F-1, and F-1/A filings from SEC EDGAR with automated classification.",
                icon: Radar,
              },
              {
                title: "Amendment Diff Engine",
                description:
                  "Side-by-side comparison of filing versions highlighting material changes in pricing, financials, and risk factors.",
                icon: GitCompare,
              },
              {
                title: "AI First-Look Reports",
                description:
                  "Institutional-quality initiation reports generated automatically from structured filing data.",
                icon: FileSearch,
              },
              {
                title: "IPO Calendar Intelligence",
                description:
                  "Track filing timelines, expected pricing dates, and market windows with predictive signals.",
                icon: BarChart3,
              },
              {
                title: "Company Profiles",
                description:
                  "Comprehensive issuer pages with business overview, financials, offering details, and risk analysis.",
                icon: Shield,
              },
              {
                title: "Alerts & Watchlists",
                description:
                  "Custom watchlists with real-time alerts for new filings, amendments, and material changes.",
                icon: Bell,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-7 bg-card/80 border border-border/60 hover:border-primary/30 transition-all group"
                style={{ borderRadius: "2px" }}
              >
                <div className="w-10 h-10 flex items-center justify-center mb-5 border border-primary/25 bg-primary/5 group-hover:bg-primary/10 transition-colors" style={{ borderRadius: "2px" }}>
                  <feature.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversational Demo — shows product in action */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="text-center mb-14">
            <div className="vv-eyebrow mb-5 justify-center">
              <Sparkles className="w-3 h-3 -mr-2 opacity-80" />
              See It in Action
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground mb-4">
              Ask questions, get <em>research-grade answers</em>.
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-xl mx-auto font-light leading-[1.75]">
              Every answer is grounded in the underlying SEC filing — structured, cited, and free of fabrication.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div
              className="bg-card border border-border/60 overflow-hidden shadow-2xl shadow-primary/5"
              style={{ borderRadius: "4px" }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-background/40">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                </div>
                <span className="ml-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                  IPO Radar AI · Chat
                </span>
                <span className="ml-auto px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-mono text-[9px] tracking-[0.16em] uppercase">
                  Live
                </span>
              </div>

              {/* Messages */}
              <div className="p-6 sm:p-8 space-y-5">
                {/* User message 1 */}
                <div className="flex justify-end items-start gap-3">
                  <div
                    className="max-w-[80%] px-4 py-2.5 bg-primary text-primary-foreground text-[14px] leading-relaxed"
                    style={{ borderRadius: "6px" }}
                  >
                    What changed in Reddit&rsquo;s latest S-1/A vs the original filing?
                  </div>
                  <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                </div>

                {/* AI message 1 */}
                <div className="flex justify-start items-start gap-3">
                  <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div
                    className="max-w-[85%] px-4 py-3 bg-muted text-foreground text-[14px] leading-[1.7]"
                    style={{ borderRadius: "6px" }}
                  >
                    <p className="mb-2">
                      Reddit filed S-1/A on <span className="font-mono text-primary">March 18, 2024</span>. Three material changes:
                    </p>
                    <ul className="space-y-1.5 pl-4 list-disc marker:text-primary/60">
                      <li>
                        Offering size raised from{" "}
                        <span className="font-mono text-primary">$748M</span> to{" "}
                        <span className="font-mono text-primary">$813M</span> (+8.7%)
                      </li>
                      <li>
                        Pricing range widened from{" "}
                        <span className="font-mono text-primary">$31–$34</span> to{" "}
                        <span className="font-mono text-primary">$31–$36</span> per share
                      </li>
                      <li>New risk factor added: reliance on third-party AI training data licenses</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground text-[11px] font-mono tracking-[0.04em]">
                      Source: SEC EDGAR · Accession 0001193125-24-072101
                    </p>
                  </div>
                </div>

                {/* User message 2 */}
                <div className="flex justify-end items-start gap-3">
                  <div
                    className="max-w-[80%] px-4 py-2.5 bg-primary text-primary-foreground text-[14px] leading-relaxed"
                    style={{ borderRadius: "6px" }}
                  >
                    Compare that to similar marketplace IPOs.
                  </div>
                  <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                </div>

                {/* AI message 2 — with typing cursor */}
                <div className="flex justify-start items-start gap-3">
                  <div className="w-8 h-8 shrink-0 mt-1 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div
                    className="max-w-[85%] px-4 py-3 bg-muted text-foreground text-[14px] leading-[1.7]"
                    style={{ borderRadius: "6px" }}
                  >
                    Closest comps by model and scale are{" "}
                    <span className="font-mono text-primary">Pinterest</span> (April 2019, debuted at $19) and{" "}
                    <span className="font-mono text-primary">Snap</span> (March 2017, debuted at $17). Both priced with
                    broader ranges than Reddit&rsquo;s amended range
                    <span
                      className="inline-block w-[2px] h-[14px] align-middle ml-0.5 bg-primary animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              {/* Input area (visual only) */}
              <div className="px-5 py-4 border-t border-border/40 bg-background/40">
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 px-4 py-2.5 bg-popover border border-border/50 text-[13px] text-muted-foreground/70"
                    style={{ borderRadius: "4px" }}
                  >
                    Ask about any IPO filing, amendment, or comparable…
                  </div>
                  <div
                    className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground"
                    style={{ borderRadius: "4px" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] font-mono text-muted-foreground/60 tracking-[0.18em] mt-6 uppercase">
              Available on the Pro plan · Sample conversation
            </p>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="vv-eyebrow mb-5 justify-center">
              The Difference
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground mb-5">
              Why we&rsquo;re <em>different</em>.
            </h2>
            <p className="text-[16px] text-muted-foreground leading-[1.85] font-light">
              Traditional IPO sites give you calendars, listings, and news. IPO Radar AI
              gives you{" "}
              <span className="text-primary font-normal italic font-serif text-[17px]">
                filing ingestion, structured extraction, amendment analysis,
                AI-generated reports, and workflow alerts
              </span>
              {" "}— all from the primary source.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 max-w-4xl mx-auto">
            <div className="p-7 border border-border/60 bg-card" style={{ borderRadius: "2px" }}>
              <div className="mb-5">
                <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                  Calendar &amp; News Sites
                </h3>
                <p className="font-mono text-[10px] text-muted-foreground/50 mt-1.5 tracking-[0.12em]">
                  Renaissance Capital · IPOScoop · Nasdaq IPO Center
                </p>
              </div>
              <ul className="space-y-3.5">
                {[
                  "Calendar-based listings",
                  "News aggregation",
                  "Basic company profiles",
                  "Manual research required",
                  "No filing-level analysis",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[14px] text-muted-foreground font-light"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-7 border border-primary/30 bg-primary/5" style={{ borderRadius: "2px" }}>
              <div className="mb-5">
                <h3 className="font-mono text-[10px] text-primary uppercase tracking-[0.22em]">
                  IPO Radar AI
                </h3>
                <p className="font-mono text-[10px] text-primary/50 mt-1.5 tracking-[0.12em]">
                  Primary-source intelligence
                </p>
              </div>
              <ul className="space-y-3.5">
                {[
                  "Direct SEC filing ingestion",
                  "Structured data extraction",
                  "Amendment diff analysis",
                  "AI-generated first-look reports",
                  "Real-time workflow alerts",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[14px] text-foreground font-light"
                  >
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users */}
      <section className="py-24 border-t border-border/40" style={{ background: "oklch(0.17 0.013 195)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <div className="vv-eyebrow mb-5 justify-center">
              Who It&rsquo;s For
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground">
              Built for <em>institutional</em> professionals.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              "Hedge Funds & Long-Only Investors",
              "Family Offices",
              "Investment Banks & ECM Teams",
              "Corporate Development",
              "IR & Advisory Firms",
            ].map((user) => (
              <div
                key={user}
                className="px-5 py-3 bg-card border border-border/60 font-mono text-[11px] text-foreground tracking-[0.08em]"
                style={{ borderRadius: "2px" }}
              >
                {user}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="vv-eyebrow mb-5 justify-center">
              FAQ
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.5vw,52px)] text-foreground text-center mb-14">
              Common <em>questions</em>.
            </h2>
            <div className="space-y-0">
              {[
                {
                  q: "What is IPO Radar AI and how does it work?",
                  a: "IPO Radar AI is an intelligence platform that monitors SEC EDGAR for S-1 and F-1 filings in near real-time. When a new IPO registration is detected, the system extracts structured financial data from the filing and generates an institutional-grade initiation report using AI. Every figure in the report comes directly from the SEC filing — nothing is estimated or inferred."
                },
                {
                  q: "Where does the financial data come from?",
                  a: "All financial data is sourced exclusively from SEC EDGAR — the official public repository of Securities and Exchange Commission filings. IPO Radar connects to the EDGAR EFTS (full-text search) and Submissions APIs to retrieve filings, company metadata, and XBRL financial data. The AI never fabricates financial figures; it only narrates and analyzes data that has been verified against the original filing."
                },
                {
                  q: "What types of SEC filings does IPO Radar track?",
                  a: "The platform tracks four filing types: S-1 (initial domestic IPO registration), S-1/A (amendments to domestic filings), F-1 (initial foreign private issuer registration), and F-1/A (amendments to foreign filings). This covers the full lifecycle of an IPO from initial registration through pricing, including every material amendment along the way."
                },
                {
                  q: "How are the AI initiation reports generated?",
                  a: "Reports follow a four-stage pipeline. First, the system collects raw filing data from SEC EDGAR. Second, it structures the data into a standardized package — financials, risk factors, use of proceeds, and business overview. Third, the LLM generates a section-by-section narrative using only the structured data as input. Finally, the system assembles the complete report with proper formatting and citations. The LLM is explicitly constrained to never invent financial data."
                },
                {
                  q: "Do I need a paid plan to use IPO Radar?",
                  a: "No. The Free tier gives you access to the IPO calendar, basic company profiles, and sector browsing. The Pro plan at $49 per month unlocks full AI-generated initiation reports, real-time filing alerts, watchlist functionality, amendment diff analysis, and priority data access. Enterprise pricing is available for teams that need API access, custom integrations, and dedicated support."
                },
                {
                  q: "How quickly are new filings detected?",
                  a: "IPO Radar monitors the SEC EDGAR EFTS API for new filings on a continuous basis. In practice, new S-1 and F-1 filings typically appear in the platform within minutes of being published on EDGAR. Amendment filings (S-1/A, F-1/A) are detected on the same schedule, and users with alerts enabled receive notifications as soon as a new filing is processed."
                },
                {
                  q: "Can I track specific companies or sectors?",
                  a: "Yes. The watchlist feature lets you follow specific companies and receive alerts when they file new documents or amend existing registrations. You can also browse by sector — the platform maps every company's SIC code to a human-readable sector classification. Custom alert rules let you filter by filing type, sector, or specific company, so you only see what matters to your workflow."
                },
              ].map((item, index) => (
                <FAQItem
                  key={index}
                  question={item.q}
                  answer={item.a}
                  isOpen={openFaqIndex === index}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-28 border-t border-border/40 relative overflow-hidden"
        style={{ background: "oklch(0.17 0.02 195)" }}
      >
        {/* Giant serif watermark — Velocia signature */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none select-none font-serif"
          style={{
            top: "-40px",
            right: "-30px",
            fontSize: "320px",
            fontWeight: 300,
            color: "var(--primary)",
            opacity: 0.028,
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          IR
        </div>
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="vv-eyebrow mb-6 justify-center">
              Get Started
            </div>
            <h2 className="vv-section-title text-[clamp(36px,4.5vw,68px)] text-foreground mb-5">
              Get ahead of the <em>IPO market</em>.
            </h2>
            <p className="text-[16px] text-muted-foreground font-light leading-[1.85] mb-10 max-w-lg mx-auto">
              Join the professionals who see filings first.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <button onClick={() => comingSoon("Get Started")} className="vv-btn-primary">
                Get Started Free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => window.open("https://ipo-radar-calendar-app.vercel.app/reports/psus", "_blank")} className="vv-btn-outline">
                See a Sample Report
              </button>
            </div>
            <p className="mt-6 font-mono text-[10px] text-muted-foreground/70 tracking-[0.14em] uppercase">
              Free tier
              <span className="mx-3 opacity-40">·</span>
              Pro $49/mo
              <span className="mx-3 opacity-40">·</span>
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-14" style={{ background: "oklch(0.14 0.012 195)" }}>
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Radar className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              <span className="font-serif text-[17px] font-medium text-foreground tracking-wide">
                IPO Radar <span className="text-primary italic font-light">AI</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-7">
              {["Product", "Coverage", "Reports", "Pricing", "Contact", "Terms", "Privacy"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => handlePlaceholder(item)}
                    className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.16em] hover:text-primary transition-colors"
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Sync status + copyright row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border/30">
            <div className="flex items-center gap-2.5">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-[0.14em] uppercase">
                Last SEC sync: {lastSyncLabel ?? "Monitoring"}
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.14em] uppercase">
              © {new Date().getFullYear()} IPO Radar AI · All rights reserved
            </p>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground/50 mt-8 text-center tracking-[0.06em] leading-relaxed max-w-2xl mx-auto">
            SEC filings are monitored from official public sources. IPO Radar AI
            does not provide investment advice. All AI-generated content is for
            informational purposes only.
          </p>
        </div>
      </footer>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
