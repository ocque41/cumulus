import {
  DitherPlate,
  PostMeta,
  articleHref,
  getRelatedSlugs,
} from "@/components/content/PostComponents";
import { FIRST_PARTY_JOURNAL_NOTICE } from "@/content/focused-posts";
import {
  getAdjacentPublishedPosts,
  publishedPosts,
  type Post,
} from "@/content/posts";
import { getAreaByCategory, areaHref } from "@/content/areas";
import { NotificationPreferences } from "@/features/notifications";
import { AppLink, useDocumentMeta } from "@/lib/router";

function relatedPosts(post: Post): readonly Post[] {
  const explicit = getRelatedSlugs(post)
    .map((slug) => publishedPosts.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is Post => Boolean(candidate));

  const selected = new Map(
    explicit
      .filter((candidate) => candidate.slug !== post.slug)
      .map((candidate) => [candidate.slug, candidate]),
  );
  const fallback = [
    ...publishedPosts.filter((candidate) => candidate.category === post.category),
    ...publishedPosts.filter((candidate) => candidate.category !== post.category),
  ];
  for (const candidate of fallback) {
    if (candidate.slug !== post.slug && selected.size < 3) {
      selected.set(candidate.slug, candidate);
    }
  }
  return [...selected.values()].slice(0, 3);
}

export function PostPage({ post }: { post: Post }) {
  useDocumentMeta(`${post.title} — Cumulus lab`, post.excerpt, {
    canonicalPath: articleHref(post),
    type: "article",
  });
  const related = relatedPosts(post);
  const adjacent = getAdjacentPublishedPosts(post);
  const area = getAreaByCategory(post.category);

  return (
    <article className="article-page">
      <header className="article-hero page-shell">
        <div className="article-hero__breadcrumbs">
          <AppLink href="/logs">Log index</AppLink>
          <span aria-hidden="true">/</span>
          {area ? (
            <AppLink href={areaHref(area)}>{post.category}</AppLink>
          ) : (
            <span>{post.category}</span>
          )}
        </div>
        <PostMeta post={post} />
        {post.category === "Editorial" ? (
          <p className="article-evidence-label">
            <strong>Author-supplied editorial.</strong>{" "}
            Claims and links are limited to the submitted source and reviewed publication.
          </p>
        ) : (
          <p className="article-evidence-label">
            <strong>{FIRST_PARTY_JOURNAL_NOTICE.label}.</strong>{" "}
            {FIRST_PARTY_JOURNAL_NOTICE.detail}
          </p>
        )}
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
            {post.sourceLinks?.length ? (
              <li>
                <a href="#sources">Links and sources</a>
              </li>
            ) : null}
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
          {post.sourceLinks?.length ? (
            <section className="source-backlinks" id="sources">
              <p className="eyebrow">Author-supplied references</p>
              <h2>Links and sources</h2>
              <ol>
                {post.sourceLinks.map((source, index) => (
                  <li key={source.href}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <a href={source.href} rel="noreferrer" target="_blank">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>

      <nav aria-label="Chronological log navigation" className="article-chain page-shell">
        {adjacent.newer ? (
          <AppLink
            aria-label={`Newer log: ${adjacent.newer.title}`}
            className="article-chain__newer"
            href={articleHref(adjacent.newer)}
            rel="prev"
          >
            <span>Newer log</span>
            <strong>{adjacent.newer.title}</strong>
          </AppLink>
        ) : (
          <span className="article-chain__boundary">
            <span>Newer log</span>
            <strong>This is the latest log</strong>
          </span>
        )}
        {adjacent.older ? (
          <AppLink
            aria-label={`Older log: ${adjacent.older.title}`}
            className="article-chain__older"
            href={articleHref(adjacent.older)}
            rel="next"
          >
            <span>Older log</span>
            <strong>{adjacent.older.title}</strong>
          </AppLink>
        ) : (
          <AppLink className="article-chain__older" href="/logs">
            <span>Older log</span>
            <strong>Continue in the archive</strong>
          </AppLink>
        )}
      </nav>

      <section aria-labelledby="related-title" className="related-logs page-shell">
        <div className="section-heading">
          <p className="eyebrow">Continue the trail</p>
          <h2 id="related-title">Related logs</h2>
        </div>
        <div className="related-logs__grid">
          {related.map((candidate, index) => (
            <AppLink data-signal-host href={articleHref(candidate)} key={candidate.slug}>
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
