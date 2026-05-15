import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowLeft, Clock, Loader2, Newspaper } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getInsightBySlug,
  urlForImage,
  formatPublishedDate,
  type DigestArticleFull,
} from "@/lib/digestArticleClient";

/**
 * Single insight article page — /insights/<slug>
 *
 * Renders the article body via @portabletext/react. The Portable Text
 * blocks are pulled from the digestArticle's `body` field. Headings,
 * paragraphs, lists, and inline Sanity image blocks are all rendered
 * with our dark-terminal-luxe styling.
 *
 * The big cinematic hero image at the top is the article's coverImage
 * (or whichever variant the schema uses — see digestArticleClient.ts
 * for the field-fallback chain).
 *
 * Empty state: friendly 404 message with link back to Insights index.
 */

// Tailwind components for Portable Text rendering.
// Block types: normal, h1, h2, h3, blockquote, list bullets/numbers.
// Custom types: image (inline images embedded in the body).
const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mt-12 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-10 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-8 mb-3">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-foreground tracking-tight mt-6 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-base text-foreground/85 leading-relaxed mb-5">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary pl-5 my-6 text-lg text-muted-foreground italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-outside pl-6 mb-5 space-y-2 text-foreground/85">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-outside pl-6 mb-5 space-y-2 text-foreground/85">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const url = urlForImage(value);
      if (!url) return null;
      return (
        <figure className="my-8 rounded-xl overflow-hidden border border-border/50">
          <img
            src={url}
            alt={value?.alt || ""}
            className="w-full h-auto"
            loading="lazy"
          />
          {value?.caption ? (
            <figcaption className="px-5 py-3 text-xs text-muted-foreground font-mono bg-card border-t border-border/50">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

export default function InsightArticle() {
  const [match, params] = useRoute<{ slug: string }>("/insights/:slug");
  const [article, setArticle] = useState<DigestArticleFull | null | undefined>(undefined);

  useEffect(() => {
    if (!match || !params?.slug) return;
    let cancelled = false;
    getInsightBySlug(decodeURIComponent(params.slug))
      .then((row) => {
        if (!cancelled) setArticle(row);
      })
      .catch((err) => {
        console.error("[InsightArticle] Sanity fetch failed:", err);
        if (!cancelled) setArticle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [match, params?.slug]);

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
      </div>
    );
  }

  // Loading
  if (article === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-32 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading article…</span>
        </div>
      </div>
    );
  }

  // Not found
  if (article === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-20 text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the article you're looking for. It may have been
            unpublished or the URL is incorrect.
          </p>
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  const heroUrl = urlForImage(article.coverImage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Back link */}
        <div className="container mb-6">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            All Insights
          </Link>
        </div>

        {/* Hero image — cinematic, full width container */}
        {heroUrl ? (
          <div className="container mb-10">
            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-border/50">
              <img
                src={heroUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        ) : null}

        {/* Article header */}
        <article className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {article.category ? (
                <>
                  <span className="text-primary">{article.category}</span>
                  <span className="opacity-30">·</span>
                </>
              ) : null}
              <span>{formatPublishedDate(article.publishedAt)}</span>
              {article.readTime ? (
                <>
                  <span className="opacity-30">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min
                  </span>
                </>
              ) : null}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground mb-5">
              {article.title}
            </h1>

            {article.excerpt ? (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            ) : null}

            {article.author ? (
              <p className="mt-6 text-sm text-muted-foreground font-mono">
                By {article.author}
              </p>
            ) : null}
          </div>

          {/* Portable Text body */}
          {article.body && article.body.length > 0 ? (
            <div className="prose prose-invert max-w-none">
              <PortableText
                value={article.body}
                components={portableTextComponents}
              />
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              This article has no body content yet.
            </p>
          )}

          {/* Footer back link */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all Insights
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
