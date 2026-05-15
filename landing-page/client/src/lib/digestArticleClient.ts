// client/src/lib/digestArticleClient.ts
//
// Read-only Sanity client for "Insights" — the editorial articles
// (digestArticle docs) authored in iporadar.sanity.studio.
//
// Same Sanity project as the calendar / live filings strip (8896dke9).
// Queries hit Sanity's public CDN, no token required for published docs.
//
// The query field set is defensive: we ask for the common field-name
// variants (excerpt|summary|dek, coverImage|heroImage|mainImage|image)
// so it works regardless of which name the schema actually uses. The
// rendering code picks the first non-empty value. Tighten this up once
// the actual schema is confirmed.

import imageUrlBuilder from "@sanity/image-url";
import { createClient, type SanityClient } from "@sanity/client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const DEFAULT_PROJECT_ID = "8896dke9";
const DEFAULT_DATASET = "production";
const DEFAULT_API_VERSION = "2024-10-01";

const projectId =
  (import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined) || DEFAULT_PROJECT_ID;
const dataset =
  (import.meta.env.VITE_SANITY_DATASET as string | undefined) || DEFAULT_DATASET;
const apiVersion =
  (import.meta.env.VITE_SANITY_API_VERSION as string | undefined) || DEFAULT_API_VERSION;

export const sanityRead: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

const _builder = imageUrlBuilder(sanityRead);

export function urlForImage(source: SanityImageSource): string | null {
  if (!source) return null;
  try {
    return _builder.image(source).url();
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────

export interface DigestArticleSummary {
  _id: string;
  title: string;
  slug: string;             // resolved from slug.current
  excerpt: string;          // resolved from excerpt|summary|dek
  coverImage: any | null;   // resolved from coverImage|heroImage|mainImage|image
  publishedAt: string;      // ISO datetime
  author: string;
  category: string;
  readTime: number | null;
}

export interface DigestArticleFull extends DigestArticleSummary {
  body: any[] | null;       // Portable Text blocks
}

// ───────────────────────────────────────────────────────────────────────
// GROQ
// ───────────────────────────────────────────────────────────────────────

// Defensive: pull every plausible field name, let the client pick what's there.
const ARTICLE_PROJECTION = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  "excerpt":  coalesce(excerpt, summary, dek, ""),
  "coverImage": coalesce(coverImage, heroImage, mainImage, image),
  "publishedAt": coalesce(publishedAt, publishDate, date, _createdAt),
  "author":   coalesce(author->name, author, "IPO Radar editorial"),
  "category": coalesce(category->title, category, tags[0], ""),
  "readTime": readTime
`;

const ARTICLE_PROJECTION_FULL = ARTICLE_PROJECTION + `, body`;

const LIST_QUERY = /* groq */ `
  *[_type == "digestArticle"
      && (defined(publishedAt) == false || publishedAt <= now())
      && !(_id in path("drafts.**"))]
    | order(coalesce(publishedAt, _createdAt) desc) [0..$limit] {
    ${ARTICLE_PROJECTION}
  }
`;

const SINGLE_QUERY = /* groq */ `
  *[_type == "digestArticle"
      && slug.current == $slug
      && !(_id in path("drafts.**"))][0] {
    ${ARTICLE_PROJECTION_FULL}
  }
`;

export async function getRecentInsights(limit = 12): Promise<DigestArticleSummary[]> {
  return sanityRead.fetch<DigestArticleSummary[]>(LIST_QUERY, { limit: limit - 1 });
}

export async function getInsightBySlug(slug: string): Promise<DigestArticleFull | null> {
  return sanityRead.fetch<DigestArticleFull | null>(SINGLE_QUERY, { slug });
}

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

export function formatPublishedDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
