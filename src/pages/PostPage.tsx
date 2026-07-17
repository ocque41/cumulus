import {
  DitherPlate,
  PostMeta,
  articleHref,
  getRelatedSlugs,
} from "@/components/content/PostComponents";
import { FIRST_PARTY_JOURNAL_NOTICE } from "@/content/focused-posts";
import { publishedPosts, type Post } from "@/content/posts";
import { NotificationPreferences } from "@/features/notifications";
import { AppLink, useDocumentMeta } from "@/lib/router";

function relatedPosts(post: Post): readonly Post[] {
  const explicit = getRelatedSlugs(post)
    .map((slug) => publishedPosts.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is Post => Boolean(candidate));

  if (explicit.length > 0) return explicit.slice(0, 3);

  const sameCategory = publishedPosts.filter(
    (candidate) => candidate.slug !== post.slug && candidate.category === post.category,
  );
  const other = publishedPosts.filter(
    (candidate) => candidate.slug !== post.slug && candidate.category !== post.category,
  );
  return [...sameCategory, ...other].slice(0, 3);
}

export function PostPage({ post }: { post: Post }) {
  useDocumentMeta(`${post.title} — Cumulus lab`, post.excerpt);
  const related = relatedPosts(post);

  return (
    <article className="article-page">
      <header className="article-hero page-shell">
        <div className="article-hero__breadcrumbs">
          <AppLink href="/logs">Log index</AppLink>
          <span aria-hidden="true">/</span>
          <span>{post.category}</span>
        </div>
        <PostMeta post={post} />
        <p className="article-evidence-label">
          <strong>{FIRST_PARTY_JOURNAL_NOTICE.label}.</strong>{" "}
          {FIRST_PARTY_JOURNAL_NOTICE.detail}
        </p>
        <h1>{post.title}</h1>
        <p className="article-hero__excerpt">{post.excerpt}</p>
        <ul aria-label="Topics" className="tag-list tag-list--large">
          {post.tags.map((tag) => (
            <li key={tag}>
              <AppLink href={`/logs?${new URLSearchParams({ q: tag }).toString()}`}>{tag}</AppLink>
            </li>
          ))}
        </ul>
      </header>

      <div className="article-visual page-shell">
        <DitherPlate
          className="dither-plate--article"
          label="Field note"
          mode="hero"
          placement="article-lead"
          post={post}
        />
      </div>

      <div className="article-layout page-shell">
        <aside aria-label="On this page" className="article-toc">
          <p className="eyebrow">On this page</p>
          <ol>
            {post.body.map((section, index) => (
              <li key={section.heading}>
                <a href={`#section-${index + 1}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
          <AppLink href="/logs">Back to every log</AppLink>
        </aside>

        <div className="article-body">
          {post.body.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.heading}>
              <p className="article-section-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <DitherPlate
                className="dither-plate--inline"
                decorative
                placement={`article-inline-${index}`}
                post={post}
              />
            </section>
          ))}
        </div>
      </div>

      <section aria-labelledby="related-title" className="related-logs page-shell">
        <div className="section-heading">
          <p className="eyebrow">Continue the trail</p>
          <h2 id="related-title">Related logs</h2>
        </div>
        <div className="related-logs__grid">
          {related.map((candidate, index) => (
            <AppLink href={articleHref(candidate)} key={candidate.slug}>
              <DitherPlate
                className="related-logs__plate"
                decorative
                placement="related"
                post={candidate}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{candidate.title}</strong>
              <small>{candidate.category}</small>
            </AppLink>
          ))}
        </div>
      </section>

      <section aria-labelledby="article-notify-title" className="article-notify page-shell">
        <div>
          <p className="eyebrow">Next dispatch</p>
          <h2 id="article-notify-title">Follow the next public entry.</h2>
          <p>Optional email notifications only. Reading Cumulus never requires an account.</p>
        </div>
        <NotificationPreferences />
      </section>
    </article>
  );
}
