import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import {
  getRecentFilings,
  filingTypeColor,
  type Filing,
} from "@/lib/filingsClient";

/**
 * FeaturedIPOs — live Sanity-backed IPO card grid for the landing page.
 *
 * Layout:
 *   Row 1 (top)    — 3 most-recent AMENDMENT filings (S-1/A, F-1/A)
 *   Row 2 (bottom) — 3 most-recent INITIAL filings (S-1, F-1)
 *
 * Each card carries a "RECENT" or "UPCOMING" pill badge in the top-right
 * of the image, so visitors immediately see which row is which without
 * extra reading.
 *
 * Image strategy: live filings don't carry cinematic images, so we map
 * each filing to a stock image via its `industry` string. The mapping
 * lives in INDUSTRY_IMAGES below — reuses the 6 cinematic AI URLs from
 * the existing mock data. If no industry match, falls back to a teal
 * gradient placeholder.
 *
 * Empty state: if Sanity has zero eligible filings, the section quietly
 * returns null so the page degrades gracefully.
 */

// ─── Industry → cinematic image mapping ──────────────────────────────
// Reuses the 6 AI-generated images from data.ts. Add more entries as
// new industries appear. Anything unmapped gets the gradient fallback.
const INDUSTRY_IMAGES: Array<{ keywords: string[]; image: string }> = [
  {
    keywords: ["quantum", "compute", "hardware", "semiconductor", "chip"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/quantum_computing_8fd76da9.jpg",
  },
  {
    keywords: ["biotech", "biosciences", "pharma", "pharmaceutical", "medical", "health", "therapy", "clinical"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/biotech_ed6b4244.jpg",
  },
  {
    keywords: ["fintech", "payment", "bank", "financial", "insurance", "credit"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/fintech_2e21fd16.jpg",
  },
  {
    keywords: ["energy", "solar", "renewable", "battery", "utility", "clean"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/clean_energy_8a1d5e72.jpg",
  },
  {
    keywords: ["ai", "artificial intelligence", "machine learning", "software", "cloud", "saas"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/ai_brain_3f8c4a91.jpg",
  },
  {
    keywords: ["commerce", "retail", "consumer", "marketplace", "platform"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/ecommerce_5d2e8b47.jpg",
  },
];

function imageForFiling(filing: Filing): string | null {
  // 1. Real cinematic DALL-E image from the matching initiationReport,
  //    joined in by the filingsClient GROQ. This is the ideal — actual
  //    per-company imagery generated when extract-filing was run.
  if (filing.heroImageUrl) return filing.heroImageUrl;

  // 2. Otherwise fall back to an industry-mapped stock photo.
  const industry = (filing.industry || "").toLowerCase();
  for (const entry of INDUSTRY_IMAGES) {
    if (entry.keywords.some((kw) => industry.includes(kw))) {
      return entry.image;
    }
  }

  // 3. Last resort: caller renders a teal gradient placeholder.
  return null;
}

// ─── Filing → display props ──────────────────────────────────────────

function shortDate(iso?: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${iso.split("-")[0]}`;
}

interface FeaturedCardProps {
  filing: Filing;
  badge: "RECENT" | "UPCOMING";
  index: number;
}

function FeaturedCard({ filing, badge, index }: FeaturedCardProps) {
  const img = imageForFiling(filing);
  const accent = filingTypeColor(filing.filingType);
  const reportSlug = filing.reportSlug;
  const reportHref = reportSlug ? `/reports/${encodeURIComponent(reportSlug)}` : null;

  // Card body — wrapped in Link if we have a report, otherwise inert.
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-card border border-border/60 overflow-hidden h-full flex flex-col"
      style={{ borderRadius: "4px" }}
    >
      {/* Image / gradient with badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 to-card">
        {img ? (
          <img
            src={img}
            alt={filing.companyName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : null}
        {/* Bottom scrim so text on the image reads */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Industry chip (top-left) */}
        {filing.industry ? (
          <div
            className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.14em] uppercase px-2.5 py-1 backdrop-blur-sm"
            style={{
              color: accent,
              backgroundColor: `${accent}22`,
              border: `1px solid ${accent}55`,
              borderRadius: "2px",
            }}
          >
            {filing.industry}
          </div>
        ) : null}

        {/* RECENT / UPCOMING badge (top-right) */}
        <div
          className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.18em] uppercase px-2.5 py-1"
          style={{
            color: badge === "RECENT" ? "#c8a45c" : "#03c8b5",
            backgroundColor: badge === "RECENT" ? "rgba(200,164,92,0.18)" : "rgba(3,200,181,0.18)",
            border: `1px solid ${badge === "RECENT" ? "rgba(200,164,92,0.55)" : "rgba(3,200,181,0.55)"}`,
            borderRadius: "2px",
          }}
        >
          {badge}
        </div>

        {/* Ticker pill (bottom-left, over image) */}
        {filing.ticker ? (
          <div className="absolute bottom-3 left-3 font-mono text-[11px] text-foreground/95 tracking-[0.1em] px-2.5 py-1 bg-black/45 backdrop-blur-sm" style={{ borderRadius: "2px" }}>
            {filing.exchange && filing.exchange !== "UNKNOWN" ? `${filing.exchange}: ` : ""}{filing.ticker}
          </div>
        ) : null}
      </div>

      {/* Text body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="vv-section-title text-[20px] text-foreground leading-tight mb-2">
          {filing.companyName}
        </h3>
        <div className="font-mono text-[10px] text-muted-foreground tracking-[0.14em] uppercase mb-3">
          {filing.filingType}
          <span className="mx-2 opacity-40">·</span>
          {shortDate(filing.filingDate)}
        </div>

        {/* Footer action */}
        <div className="mt-auto pt-3 border-t border-border/40">
          {reportHref ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-primary tracking-[0.16em] uppercase">
              View report
              <ArrowRight className="w-3 h-3" />
            </span>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground/60 tracking-[0.16em] uppercase">
              Report pending
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (reportHref) {
    return (
      <Link href={reportHref} className="no-underline block h-full">
        {inner}
      </Link>
    );
  }
  return <div className="h-full">{inner}</div>;
}

// ─── Main component ──────────────────────────────────────────────────

export default function FeaturedIPOs() {
  const [filings, setFilings] = useState<Filing[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Pull a wider net (50) so we have enough variety to split into
    // 3 recent + 3 upcoming. Filter client-side.
    getRecentFilings(50)
      .then((rows) => {
        if (!cancelled) {
          setFilings(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[FeaturedIPOs] Sanity fetch failed:", err);
        if (!cancelled) {
          setFilings([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading
  if (loading) {
    return (
      <section className="py-24">
        <div className="container flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-3" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Loading featured IPOs…
          </span>
        </div>
      </section>
    );
  }

  // No data — render nothing
  if (!filings || filings.length === 0) return null;

  // Split into recent (amendments) and upcoming (initial filings)
  const recent = filings.filter((f) => /\/A$/.test(f.filingType)).slice(0, 3);
  const upcoming = filings.filter((f) => !/\/A$/.test(f.filingType)).slice(0, 3);

  // Nothing to show? bail
  if (recent.length === 0 && upcoming.length === 0) return null;

  return (
    <section className="py-24">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <div className="vv-eyebrow mb-5">
              <TrendingUp className="w-3 h-3 -mr-2 opacity-80" />
              The Pipeline
            </div>
            <h2 className="vv-section-title text-[clamp(32px,3.2vw,48px)] text-foreground mb-3">
              Featured <em>IPOs</em>.
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-xl font-light leading-[1.75]">
              Live filings pulled directly from SEC EDGAR — most recent
              amendments on top, fresh initial filings below.
            </p>
          </div>
          <Link
            href="/ipos"
            className="hidden sm:inline-flex items-center gap-2 font-mono text-[10px] text-primary hover:text-primary/80 tracking-[0.16em] uppercase no-underline transition-colors"
          >
            Browse all IPOs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Row 1 — RECENT (amendments) */}
        {recent.length > 0 ? (
          <div className="mb-8">
            <div className="font-mono text-[10px] text-muted-foreground tracking-[0.18em] uppercase mb-4">
              <span className="text-[#c8a45c]">— Recent</span>
              <span className="ml-3 opacity-50">Amendments and material updates</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent.map((f, i) => (
                <FeaturedCard key={f._id} filing={f} badge="RECENT" index={i} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Row 2 — UPCOMING (fresh initial filings) */}
        {upcoming.length > 0 ? (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-[0.18em] uppercase mb-4">
              <span className="text-primary">— Upcoming</span>
              <span className="ml-3 opacity-50">Fresh S-1 and F-1 registrations</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((f, i) => (
                <FeaturedCard key={f._id} filing={f} badge="UPCOMING" index={i} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
