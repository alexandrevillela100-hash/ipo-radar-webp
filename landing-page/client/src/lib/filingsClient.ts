// client/src/lib/filingsClient.ts
//
// Read-only Sanity client for the IPO Radar landing page.
//
// The landing page consumes the SAME Sanity project as the calendar app
// (project 8896dke9, dataset "production"). All queries hit Sanity's
// public CDN — no token required for published documents.
//
// CORS: the public Vercel domain *.vercel.app is already on Sanity's
// allowed origins list (added when the calendar app was deployed). New
// domains need to be added at sanity.io/manage → IPO Radar → API →
// CORS origins.

import { createClient, type SanityClient } from "@sanity/client";

const DEFAULT_PROJECT_ID = "8896dke9";
const DEFAULT_DATASET = "production";
const DEFAULT_API_VERSION = "2024-10-01";

const projectId =
  (import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined) || DEFAULT_PROJECT_ID;
const dataset =
  (import.meta.env.VITE_SANITY_DATASET as string | undefined) || DEFAULT_DATASET;
const apiVersion =
  (import.meta.env.VITE_SANITY_API_VERSION as string | undefined) || DEFAULT_API_VERSION;

export const filingsClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

// ───────────────────────────────────────────────────────────────────────
// Types — mirror calendar-feed/sanity/schemas/filing.ts
// ───────────────────────────────────────────────────────────────────────

export type FilingType =
  | "S-1"
  | "S-1/A"
  | "F-1"
  | "F-1/A"
  | "424B"
  | "RW";

export interface Filing {
  _id: string;
  companyName: string;
  ticker?: string;
  exchange?: string;
  industry?: string;
  filingType: FilingType;
  filingDate: string;
  status?: string;
  cik?: string;
  accessionNumber?: string;
  edgarUrl?: string;
  reportSlug?: string;
}

// ───────────────────────────────────────────────────────────────────────
// GROQ
// ───────────────────────────────────────────────────────────────────────

const RECENT_QUERY = /* groq */ `
  *[_type == "filing"] | order(filingDate desc) [0..$limit] {
    _id,
    companyName,
    ticker,
    exchange,
    industry,
    filingType,
    filingDate,
    status,
    cik,
    accessionNumber,
    edgarUrl,
    reportSlug
  }
`;

export async function getRecentFilings(limit = 8): Promise<Filing[]> {
  return filingsClient.fetch<Filing[]>(RECENT_QUERY, { limit: limit - 1 });
}

// Visual helpers — mirror calendar-app's filingsClient color scheme
export function filingTypeColor(t: FilingType): string {
  switch (t) {
    case "S-1":   return "#03c8b5";
    case "S-1/A": return "#c8a45c";
    case "F-1":   return "#03c8b5";
    case "F-1/A": return "#c8a45c";
    case "424B":  return "#59c280";
    case "RW":    return "#d65a5a";
    default:      return "#a9c3bf";
  }
}

export function filingTypeLabel(t: FilingType): string {
  switch (t) {
    case "S-1":   return "Initial filing";
    case "S-1/A": return "Amendment";
    case "F-1":   return "Initial filing (foreign)";
    case "F-1/A": return "Amendment (foreign)";
    case "424B":  return "Final prospectus";
    case "RW":    return "Withdrawal";
    default:      return t;
  }
}
