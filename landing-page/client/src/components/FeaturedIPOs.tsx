import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Loader2 } from "lucide-react";
import {
  getRecentFilings,
  filingTypeColor,
  type Filing,
} from "@/lib/filingsClient";

/**
 * FeaturedIPOs — live Sanity-backed IPO card grid for the landing page.
 *
 * v3 / FINAL — supersedes FeaturedIPOs_FIXED.tsx.
 *
 *   1. Real CloudFront image URLs (all 6 verified against data.ts)
 *   2. SIC-code range matching for raw "SIC NNNN" industry strings
 *   3. Card clicks now open the calendar-app FACT SHEET in a new tab
 *      (cross-app link via <a target="_blank">, not wouter <Link>)
 *   4. "Browse all IPOs" footer link → calendar-app /ipos route
 *
 * Set CALENDAR_APP_URL below to your actual calendar-app Vercel URL
 * if it differs from the default.
 */

// ─── Cross-app routing ──────────────────────────────────────────────
// The fact-sheet and all-IPOs pages live in the calendar-app repo, so
// from this landing page they are external links. Update this constant
// if the Vercel domain changes.
const CALENDAR_APP_URL = "https://ipo-radar-calendar-app.vercel.app";

// ─── Industry → cinematic image mapping ──────────────────────────────
// All 6 image URLs are verified against the Manus mock data file
// (client/src/lib/data.ts) — these are real CloudFront paths.
//
// Two matching strategies, tried in order:
//   1. KEYWORD match on the industry string ("fintech", "biotech", etc.)
//   2. SIC RANGE match — for raw "SIC NNNN" the poller writes when it
//      can't map a SIC code to a friendly label.
//
// SIC code reference: https://www.sec.gov/info/edgar/siccodes.htm
const INDUSTRY_IMAGES: Array<{
  keywords: string[];
  sicRanges: Array<[number, number]>;
  image: string;
}> = [
  {
    keywords: ["quantum", "compute", "hardware", "semiconductor", "chip"],
    sicRanges: [[3670, 3679], [3674, 3674]],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/quantum_computing_8fd76da9.jpg",
  },
  {
    keywords: [
      "biotech",
      "biosciences",
      "pharma",
      "pharmaceutical",
      "medical",
      "health",
      "therapy",
      "clinical",
    ],
    sicRanges: [
      [2830, 2839],
      [3840, 3849],
      [8000, 8099],
      [8731, 8731],
    ],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/biotech_ed6b4244.jpg",
  },
  {
    keywords: [
      "fintech",
      "payment",
      "bank",
      "financial",
      "insurance",
      "credit",
      "spac",
      "blank check",
    ],
    sicRanges: [[6000, 6999]],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/fintech_d7356136.jpg",
  },
  {
    keywords: [
      "energy",
      "solar",
      "renewable",
      "battery",
      "utility",
      "clean",
      "oil",
      "gas",
      "shipping",
      "transport",
    ],
    sicRanges: [
      [1300, 1399],
      [2900, 2999],
      [4400, 4499],
      [4900, 4999],
    ],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/clean_energy_f50a3017.jpg",
  },
  {
    keywords: [
      "ai",
      "artificial intelligence",
      "machine learning",
      "software",
      "cloud",
      "saas",
      "telecom",
      "communications",
      "data",
    ],
    sicRanges: [
      [7370, 7379],
      [4812, 4899],
    ],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/ai_platform_a372bcbc.jpg",
  },
  {
    keywords: [
      "commerce",
      "retail",
      "consumer",
      "marketplace",
      "platform",
      "apparel",
      "amusement",
      "gaming",
      "media",
      "entertainment",
      "leisure",
    ],
    sicRanges: [
      [2300, 2399],
      [3020, 3029],
      [3620, 3629],
      [5000, 5999],
      [7800, 7999],
    ],
    image:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663280665947/XKw6FAyQwbdSSsaMMhPauF/ecommerce_48c320f5.jpg",
  },
];

function imageForFiling(filing: Filing): string | null {
  // 1. Real cinematic DALL-E image from the matching initiationReport,
  //    joined in by the filingsClient GROQ.
  if (filing.heroImageUrl) return filing.heroImageUrl;

  const industry = (filing.industry || "").toLowerCase();

  // 2. Keyword match on the industry label.
  for (const entry of INDUSTRY_IMAGES) {
    if (entry.keywords.some((kw) => industry.includes(kw))) {
      return entry.image;
    }
  }

  // 3. SIC code range match (catches "SIC 6221" style strings).
  const sicMatch = industry.match(/sic\s*(\d{3,4})/);
  if (sicMatch) {
    const sic = parseInt(sicMatch[1], 10);
    if (!Number.isNaN(sic)) {
      for (const entry of INDUSTRY_IMAGES) {
        if (entry.sicRanges.some(([lo, hi]) => sic >= lo && sic <= hi)) {
          return entry.image;
        }
      }
    }
  }

  // 4. Last resort: caller renders a teal gradient placeholder.
  return null;
}

// ─── Filing → display props ──────────────────────────────────────────

function shortDate(iso?: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
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

  // FACT SHEET lives in the calendar-app, so this is a cross-app link.
  // Open in a new tab so we don't tear the visitor away from the
  // landing page entirely.
  const factSheetHref = reportSlug
    ? `${CALENDAR_APP_URL}/fact-sheet/${encodeURIComponent(reportSlug)}`
    : null;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-card border border-border/60 overflow-hidden h-full flex flex-col"
      style={{ borderRadius: "4px" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 to-card">
        {img ? (
          <img
            src={img}
            alt={filing.companyName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

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

        {filing.ticker ? (
          <div
            className="absolute bottom-3 left-3 font-mono text-[11px] text-foreground/95 tracking-[0.1em] px-2.5 py-1 bg-black/45 backdrop-blur-sm"
            style={{ borderRadius: "2px" }}
          >
            {filing.exchange && filing.exchange !== "UNKNOWN" ? `${filing.exchange}: ` : ""}
            {filing.ticker}
          </div>
        ) : null}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="vv-section-title text-[20px] text-foreground leading-tight mb-2">
          {filing.companyName}
        </h3>
        <div className="font-mono text-[10px] text-muted-foreground tracking-[0.14em] uppercase mb-3">
          {filing.filingType}
          <span className="mx-2 opacity-40">·</span>
          {shortDate(filing.filingDate)}
        </div>

        <div className="mt-auto pt-3 border-t border-border/40">
          {factSheetHref ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-primary tracking-[0.16em] uppercase">
              View fact sheet
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

  if (factSheetHref) {
    return (
      <a
        href={factSheetHref}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline block h-full"
      >
        {inner}
      </a>
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

  if (!filings || filings.length === 0) return null;

  const recent = filings.filter((f) => /\/A$/.test(f.filingType)).slice(0, 3);
  const upcoming = filings.filter((f) => !/\/A$/.test(f.filingType)).slice(0, 3);

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
          <a
            href={`${CALENDAR_APP_URL}/ipos`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 font-mono text-[10px] text-primary hover:text-primary/80 tracking-[0.16em] uppercase no-underline transition-colors"
          >
            Browse all IPOs
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

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
