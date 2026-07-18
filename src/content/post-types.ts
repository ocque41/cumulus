export type PostStatus = "published" | "draft";

export type PostPlacement =
  | "featured"
  | "feature-rail"
  | "recent"
  | "stories"
  | "research"
  | "build-business";

export const DITHER_VARIANTS = [
  "cloud-gate",
  "signal-window",
  "terminal-rain",
  "archive-lines",
  "split-horizon",
  "key-vault",
  "paper-field",
  "local-orbit",
  "record-lattice",
  "release-bars",
  "shared-notebook",
  "event-river",
  "handoff-map",
  "compact-grid",
  "plan-stack",
  "context-rings",
  "cost-contours",
  "contract-bridge",
  "workspace-beacon",
] as const;

export type DitherVariant = (typeof DITHER_VARIANTS)[number];

export interface PostVisual {
  variant: DitherVariant;
  alt: string;
}

export interface PostBodySection {
  heading: string;
  paragraphs: readonly string[];
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  status: PostStatus;
  date: string;
  category: string;
  tags: readonly string[];
  readingTime: number;
  placement: PostPlacement;
  visual: PostVisual;
  body: readonly PostBodySection[];
  project?: string;
  sourceLinks?: readonly { label: string; href: string }[];
  relatedSlugs?: readonly string[];
  verifiedAt?: string;
}
