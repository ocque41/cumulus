/* eslint-disable react-refresh/only-export-components */
import type { ComponentProps, CSSProperties } from "react";

import { stableDitherSeed } from "@/components/visual/DitherArtwork";
import { HeroDither } from "@/components/visual/HeroDither";
import { PostSignalArtwork } from "@/components/visual/PostSignalArtwork";
import type { Post } from "@/content/posts";
import type { DitherVariant } from "@/content/post-types";
import { AppLink } from "@/lib/router";

type EnrichedPost = Post & {
  project?: string;
  relatedSlugs?: readonly string[];
};

const SHAPES: Array<ComponentProps<typeof HeroDither>["shape"]> = [
  "simplex",
  "warp",
  "dots",
  "wave",
  "ripple",
  "swirl",
  "sphere",
];
const TYPES: Array<ComponentProps<typeof HeroDither>["type"]> = [
  "2x2",
  "4x4",
  "8x8",
];
const INLINE_SIGNAL_VARIANTS: readonly DitherVariant[] = [
  "record-lattice",
  "event-river",
  "contract-bridge",
  "context-rings",
  "plan-stack",
  "terminal-rain",
  "signal-window",
];

export function formatPostDate(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function articleHref(post: Pick<Post, "slug">): string {
  return `/logs/${encodeURIComponent(post.slug)}`;
}

export function getPostProject(post: Post): string | undefined {
  const project = (post as EnrichedPost).project;
  return typeof project === "string" && project.trim() ? project : undefined;
}

export function getRelatedSlugs(post: Post): readonly string[] {
  const slugs = (post as EnrichedPost).relatedSlugs;
  return Array.isArray(slugs)
    ? slugs.filter((slug): slug is string => typeof slug === "string")
    : [];
}

export function DitherPlate({
  accessibleLabel,
  className = "",
  decorative = false,
  label,
  mode = "artwork",
  placement = "default",
  post,
}: {
  accessibleLabel?: string;
  className?: string;
  decorative?: boolean;
  label?: string;
  mode?: "artwork" | "hero";
  placement?: string;
  post: Post;
}) {
  const seedKey = `${post.slug}:${placement}`;
  const seed = stableDitherSeed(`${seedKey}:${post.visual.variant}`);
  const shape = SHAPES[seed % SHAPES.length];
  const type = TYPES[Math.floor(seed / SHAPES.length) % TYPES.length];
  const semantics = decorative
    ? { decorative: true as const }
    : {
        decorative: false as const,
        label: accessibleLabel ?? post.visual.alt,
      };

  if (mode === "artwork") {
    const artworkVariant = placement.startsWith("article-inline-")
      ? INLINE_SIGNAL_VARIANTS[seed % INLINE_SIGNAL_VARIANTS.length]
        ?? post.visual.variant
      : post.visual.variant;

    return (
      <PostSignalArtwork
        {...semantics}
        className={`dither-plate ${className}`.trim()}
        seed={seedKey}
        variant={artworkVariant}
      >
        {label ? (
          <span aria-hidden="true" className="dither-plate__label">
            {label}
          </span>
        ) : null}
      </PostSignalArtwork>
    );
  }

  return (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : accessibleLabel ?? post.visual.alt}
      className={`dither-plate ${className}`.trim()}
      data-dither-seed={seed}
      role={decorative ? undefined : "img"}
    >
      <HeroDither
        fallbackClassName="dither-plate__fallback"
        frame={seed % 997}
        maxPixelCount={420_000}
        shape={shape}
        size={(seed % 3) + 2}
        speed={0.38 + (seed % 4) * 0.06}
        type={type}
      />
      {label ? (
        <span aria-hidden="true" className="dither-plate__label">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function PostMeta({ post }: { post: Post }) {
  const project = getPostProject(post);

  return (
    <div className="post-meta">
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
      <span>{post.category}</span>
      {project ? <span>{project}</span> : null}
      <span>{post.readingTime} min read</span>
    </div>
  );
}

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <article className="featured-post">
      <div className="featured-post__visual">
        <DitherPlate
          decorative
          label="Open log"
          mode="hero"
          placement="home-feature"
          post={post}
        />
      </div>
      <div className="featured-post__copy">
        <p className="eyebrow">Latest log</p>
        <PostMeta post={post} />
        <h3>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h3>
        <p>{post.excerpt}</p>
        <span aria-hidden="true" className="featured-post__action">
          Read the complete log
        </span>
      </div>
    </article>
  );
}

export function CompactPostRow({
  index,
  post,
}: {
  index: number;
  post: Post;
}) {
  return (
    <article className="compact-post-row">
      <span aria-hidden="true" className="compact-post-row__index">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="compact-post-row__signal" data-variant={post.visual.variant} aria-hidden="true" />
      <div className="compact-post-row__body">
        <PostMeta post={post} />
        <h3>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h3>
        <p>{post.excerpt}</p>
      </div>
      <span aria-hidden="true" className="compact-post-row__action">
        Open
      </span>
    </article>
  );
}

export function PaginationNav({
  currentPage,
  hrefForPage,
  label,
  totalPages,
}: {
  currentPage: number;
  hrefForPage: (page: number) => string;
  label: string;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={label} className="pagination">
      {currentPage > 1 ? (
        <AppLink href={hrefForPage(currentPage - 1)} rel="prev">
          Previous
        </AppLink>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <ol>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span aria-current="page">{page}</span>
            ) : (
              <AppLink href={hrefForPage(page)}>{page}</AppLink>
            )}
          </li>
        ))}
      </ol>
      {currentPage < totalPages ? (
        <AppLink href={hrefForPage(currentPage + 1)} rel="next">
          Next
        </AppLink>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}

export function PostCard({
  index,
  post,
  style,
}: {
  index: number;
  post: Post;
  style?: CSSProperties;
}) {
  return (
    <article className="post-card" data-signal-host style={style}>
      <div className="post-card__index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="post-card__visual">
        <DitherPlate
          className="post-card__plate"
          decorative
          placement="home-card"
          post={post}
        />
      </div>
      <div className="post-card__body">
        <PostMeta post={post} />
        <h3>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h3>
        <p>{post.excerpt}</p>
        <ul aria-label="Topics" className="tag-list">
          {post.tags.slice(0, 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function PostIndexRow({ index, post }: { index: number; post: Post }) {
  return (
    <article className="post-index-row" data-signal-host>
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div className="post-index-row__visual">
        <DitherPlate
          className="post-index-row__plate"
          decorative
          placement="archive-row"
          post={post}
        />
      </div>
      <div className="post-index-row__body">
        <PostMeta post={post} />
        <h2>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h2>
        <p>{post.excerpt}</p>
      </div>
      <span aria-hidden="true" className="post-index-row__action">
        Open
      </span>
    </article>
  );
}
