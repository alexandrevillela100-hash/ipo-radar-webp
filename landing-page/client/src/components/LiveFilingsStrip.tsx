import { useEffect, useState } from "react";
import { FileText, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import {
  getRecentFilings,
  filingTypeColor,
  filingTypeLabel,
  type Filing,
} from "@/lib/filingsClient";

/**
 * Live IPO filings strip — landing-page integration of the Sanity feed.
 *
 * Reads the 8 most recent filings from the same Sanity dataset the
 * calendar app uses. Renders them as a horizontal card grid above the
 * trust bar on the public landing page.
 *
 * Each card shows:
 *   - Filing type chip (S-1, S-1/A, F-1, 424B, RW)
 *   - Company name + ticker
 *   - Filing date
 *   - Industry pill (if available)
 *   - "View Report" CTA when reportSlug exists, otherwise EDGAR link
 *
 * Loading state: spinner + label
 * Empty state:   silent (component returns null)
 * Error state:   silent (logs to console, returns null)
 *
 * REAL data — pulls from Sanity. The mock data in lib/data.ts is no
 * longer used for this section.
 */

const REPORTS_BASE =
  (import.meta.env.VITE_IPORADAR_BASE as string | undefined) ||
  "https://ipo-radar-calendar-app.vercel.app";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function FilingCard({ filing }: { filing: Filing }) {
  const accent = filingTypeColor(filing.filingType);
  const typeLabel = filingTypeLabel(filing.filingType);
  const reportUrl = filing.reportSlug
    ? `${REPORTS_BASE}/reports/${encodeURIComponent(filing.reportSlug)}`
    : null;

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
      {/* Filing type chip */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded"
          style={{
            color: accent,
            backgroundColor: `${accent}1a`,
            border: `1px solid ${accent}40`,
          }}
        >
          {filing.filingType}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(filing.filingDate)}
        </span>
      </div>

      {/* Company name + ticker */}
      <h3 className="text-base font-bold text-foreground leading-tight mb-1">
        {filing.companyName}
      </h3>
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-mono">
        {filing.ticker ? <span className="text-primary">{filing.ticker}</span> : null}
        {filing.ticker && filing.exchange && filing.exchange !== "UNKNOWN"
          ? <span className="opacity-40">·</span> : null}
        {filing.exchange && filing.exchange !== "UNKNOWN"
          ? <span>{filing.exchange}</span> : null}
      </div>

      {/* Type label + industry */}
      <p className="text-xs text-muted-foreground mb-4">
        {typeLabel}
        {filing.industry ? ` · ${filing.industry}` : ""}
      </p>

      {/* Action */}
      {reportUrl ? (
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors no-underline"
        >
          View Report
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      ) : filing.edgarUrl ? (
        <a
          href={filing.edgarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors no-underline"
        >
          View on EDGAR
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : null}
    </div>
  );
}

export default function LiveFilingsStrip() {
  const [filings, setFilings] = useState<Filing[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentFilings(8)
      .then((rows) => {
        if (!cancelled) {
          setFilings(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        // Silent fail — landing page renders without the strip if Sanity is unreachable.
        console.error("[LiveFilingsStrip] Sanity fetch failed:", err);
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
      <section className="py-12 border-y border-border/50 bg-secondary/10">
        <div className="container">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading live SEC filings…</span>
          </div>
        </div>
      </section>
    );
  }

  // Empty (no filings or fetch error) — render nothing so the landing page
  // gracefully degrades to its other sections.
  if (!filings || filings.length === 0) return null;

  return (
    <section className="py-14 border-y border-border/50 bg-secondary/10">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                Live · From SEC EDGAR
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Latest IPO Filings
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Real filings, pulled live from the SEC. {filings.length} most recent.
            </p>
          </div>
          <a
            href={`${REPORTS_BASE}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-semibold transition-colors no-underline"
          >
            View full calendar
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filings.map((f) => (
            <FilingCard key={f._id} filing={f} />
          ))}
        </div>

        <div className="flex justify-center mt-8 sm:hidden">
          <a
            href={`${REPORTS_BASE}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary font-semibold no-underline"
          >
            View full calendar
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
