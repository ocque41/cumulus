/* eslint-disable react-refresh/only-export-components */
import type { ComponentProps } from "react";

import { HeroDither } from "@/components/visual/HeroDither";
import type { Post } from "@/content/posts";
import { AppLink } from "@/lib/router";

interface SourceLink {
  href: string;
  label: string;
}

type EnrichedPost = Post & {
  project?: string;
  relatedSlugs?: readonly string[];
  sourceLinks?: readonly SourceLink[];
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

function hash(value: string): number {
  return Array.from(value).reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) >>> 0;
  }, 17);
}

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

export function getPostSources(post: Post): readonly SourceLink[] {
  const links = (post as EnrichedPost).sourceLinks;
  if (!Array.isArray(links)) return [];
  return links.filter(
    (link): link is SourceLink =>
      Boolean(link && typeof link.href === "string" && typeof link.label === "string"),
  );
}

export function getRelatedSlugs(post: Post): readonly string[] {
  const slugs = (post as EnrichedPost).relatedSlugs;
  return Array.isArray(slugs)
    ? slugs.filter((slug): slug is string => typeof slug === "string")
    : [];
}

export function DitherPlate({
  className = "",
  label,
  post,
}: {
  className?: string;
  label?: string;
  post: Post;
}) {
  const seed = hash(post.visual.variant);
  const shape = SHAPES[seed % SHAPES.length];
  const type = TYPES[Math.floor(seed / SHAPES.length) % TYPES.length];

  return (
    <div
      aria-label={post.visual.alt}
      className={`dither-plate ${className}`.trim()}
      role="img"
    >
      <HeroDither
        fallbackClassName="dither-plate__fallback"
        frame={seed % 997}
        maxPixelCount={420_000}
        shape={shape}
        size={(seed % 3) + 2}
        speed={0.12 + (seed % 4) * 0.04}
        type={type}
      />
      {label ? <span aria-hidden="true">{label}</span> : null}
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
      <AppLink href={articleHref(post)} className="featured-post__visual">
        <DitherPlate label="Open log" post={post} />
      </AppLink>
      <div className="featured-post__copy">
        <p className="eyebrow">Featured log</p>
        <PostMeta post={post} />
        <h3>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h3>
        <p>{post.excerpt}</p>
        <AppLink className="text-link" href={articleHref(post)}>
          Read the complete log
        </AppLink>
      </div>
    </article>
  );
}

export function PostCard({ index, post }: { index: number; post: Post }) {
  return (
    <article className="post-card">
      <div className="post-card__index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
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
    <article className="post-index-row">
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <PostMeta post={post} />
        <h2>
          <AppLink href={articleHref(post)}>{post.title}</AppLink>
        </h2>
        <p>{post.excerpt}</p>
      </div>
      <AppLink aria-label={`Read ${post.title}`} className="post-index-row__action" href={articleHref(post)}>
        Open
      </AppLink>
    </article>
  );
}

export function SourceBacklinks({ post }: { post: Post }) {
  const sources = getPostSources(post);
  if (sources.length === 0) return null;

  return (
    <aside aria-labelledby="source-backlinks-title" className="source-backlinks">
      <p className="eyebrow" id="source-backlinks-title">
        Public links
      </p>
      <p>
        Explore related public work and upstream context. These links provide context;
        they do not imply that a private project or its implementation is published.
      </p>
      <ol>
        {sources.map((source, index) => (
          <li key={`${source.href}:${source.label}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <a href={source.href} rel="noreferrer" target="_blank">
              {source.label}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
