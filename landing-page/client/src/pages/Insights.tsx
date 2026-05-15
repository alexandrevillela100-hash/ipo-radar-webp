import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Newspaper, Clock, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getRecentInsights,
  urlForImage,
  formatPublishedDate,
  type DigestArticleSummary,
} from "@/lib/digestArticleClient";

/**
 * Insights index — lists curated editorial articles from Sanity
 * (digestArticle documents authored in iporadar.sanity.studio).
 *
 * Layout:
 *   - Hero header with section title + subtitle
 *   - Featured card (most recent article) — large hero image
 *   - Grid of remaining articles — smaller thumbnail cards
 *
 * Empty state: a friendly "no articles yet" message — the page still
 * renders so the route doesn't 404.
 *
 * Error state: silent (logs to console, shows empty state).
 *
 * The cinematic hero images on each card come from the Sanity image
 * assets attached to the article (urlForImage() resolves them to
 * cdn.sanity.io URLs).
 */

const categoryColors: Record<string, string> = {
  "Market Review": "bg-primary/15 text-primary border-primary/25",
  "Sector Analysis": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Regulatory": "bg-amber-500/15 text-amber-400 border-amber-500/25",
  "Research": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Education": "bg-green-500/15 text-green-400 border-green-500/25",
};

function categoryClass(cat: string): string {
  return categoryColors[cat] || "bg-secondary text-muted-foreground border-border/40";
}

function ArticleHero({ article }: { article: DigestArticleSummary }) {
  const imgUrl = urlForImage(article.coverImage);
  return (
    <Link
      href={`/insights/${encodeURIComponent(article.slug)}`}
      className="block bg-card border border-border/50 rounded-xl overflow-hidden mb-12 group hover:border-primary/30 transition-all duration-300 no-underline"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Newspaper className="w-20 h-20 text-primary/30" />
            </div>
          )}
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            {article.category ? (
              <span
                className={`inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded border ${categoryClass(article.category)}`}
              >
                {article.category}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground font-mono">
              {formatPublishedDate(article.publishedAt)}
            </span>
            {article.readTime ? (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime} min
              </span>
            ) : null}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-3 group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          {article.excerpt ? (
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {article.excerpt}
            </p>
          ) : null}
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Read article
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: DigestArticleSummary }) {
  const imgUrl = urlForImage(article.coverImage);
  return (
    <Link
      href={`/insights/${encodeURIComponent(article.slug)}`}
      className="block bg-card border border-border/50 rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300 no-underline"
    >
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-primary/30" />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {article.category ? (
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${categoryClass(article.category)}`}
            >
              {article.category}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground font-mono">
            {formatPublishedDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="text-base font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        ) : null}
        {article.readTime ? (
          <div className="mt-3 text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime} min read
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function Insights() {
  const [articles, setArticles] = useState<DigestArticleSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentInsights(12)
      .then((rows) => {
        if (!cancelled) {
          setArticles(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[Insights] Sanity fetch failed:", err);
        if (!cancelled) {
          setArticles([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container">
          {/* Page header */}
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                Editorial
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-foreground">
              Insights
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Expert analysis, sector deep-dives, and educational content on the
              IPO market — written by the IPO Radar editorial team.
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading insights…</span>
            </div>
          ) : null}

          {/* Empty */}
          {!loading && articles && articles.length === 0 ? (
            <div className="py-20 text-center">
              <Newspaper className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No insights have been published yet.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Check back soon — the editorial team is preparing the first
                batch of articles.
              </p>
            </div>
          ) : null}

          {/* Featured + grid */}
          {!loading && articles && articles.length > 0 ? (
            <>
              <ArticleHero article={articles[0]} />
              {articles.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.slice(1).map((a) => (
                    <ArticleCard key={a._id} article={a} />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
