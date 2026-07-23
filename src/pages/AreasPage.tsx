import {
  PaginationNav,
  PostIndexRow,
  articleHref,
} from "@/components/content/PostComponents";
import { HeroDither } from "@/components/visual/HeroDither";
import {
  CONTENT_AREAS,
  ARCHIVE_PAGE_SIZE,
  areaHref,
  pageCount,
  pageItems,
  postsForArea,
  type ContentArea,
} from "@/content/areas";
import { publishedPosts } from "@/content/posts";
import { AppLink, useDocumentMeta } from "@/lib/router";

export function AreasPage() {
  useDocumentMeta(
    "Areas — Cumulus lab",
    "Explore Cumulus public logs across Requisia, Insuja, Hyoka Hanesu, gy, and Editorial.",
    { canonicalPath: "/areas", type: "website" },
  );

  return (
    <>
      <header className="archive-hero page-shell">
        <div>
          <p className="eyebrow">Cumulus areas / five public streams</p>
          <h1>Explore by area</h1>
          <p>
            Every publication belongs to one approved area. New logs appear here
            automatically without expanding the homepage.
          </p>
        </div>
        <HeroDither
          fallbackClassName="archive-hero__fallback"
          frame={521}
          maxPixelCount={480_000}
          priority
          shape="ripple"
          size={3}
          speed={0.46}
          type="4x4"
        />
      </header>

      <section aria-labelledby="area-index-title" className="archive page-shell">
        <h2 className="visually-hidden" id="area-index-title">Public log areas</h2>
        <div className="area-index-grid">
          {CONTENT_AREAS.map((area, index) => {
            const posts = postsForArea(publishedPosts, area);
            return (
              <article className="area-index-card" key={area.slug}>
                <p className="eyebrow">
                  {String(index + 1).padStart(2, "0")} / {posts.length} logs
                </p>
                <h2>
                  <AppLink href={areaHref(area)}>{area.category}</AppLink>
                </h2>
                <p>{area.description}</p>
                {posts[0] ? (
                  <AppLink href={articleHref(posts[0])}>
                    Newest: {posts[0].title}
                  </AppLink>
                ) : (
                  <span>No published logs yet</span>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function AreaArchivePage({
  area,
  page,
}: {
  area: ContentArea;
  page: number;
}) {
  const posts = postsForArea(publishedPosts, area);
  const totalPages = pageCount(posts.length);
  const visiblePosts = pageItems(posts, page);
  const pageSuffix = page > 1 ? `, page ${page}` : "";

  useDocumentMeta(
    `${area.category} logs${pageSuffix} — Cumulus lab`,
    `${area.description} Browse ${area.category} public logs in chronological order.`,
    {
      canonicalPath: areaHref(area, page),
      type: "website",
    },
  );

  return (
    <>
      <header className="collection-hero page-shell">
        <p className="eyebrow">
          <AppLink href="/areas">Areas</AppLink> / {area.category}
        </p>
        <h1>{area.category}</h1>
        <p>{area.description}</p>
        <p>{posts.length} {posts.length === 1 ? "public log" : "public logs"}</p>
      </header>

      <section aria-labelledby="area-archive-title" className="archive page-shell">
        <h2 className="visually-hidden" id="area-archive-title">
          {area.category} log archive, page {page}
        </h2>
        <p aria-live="polite" className="archive-page-status" role="status">
          Page {page} of {totalPages}
        </p>
        <div className="post-index">
          {visiblePosts.map((post, index) => (
            <PostIndexRow
              index={(page - 1) * ARCHIVE_PAGE_SIZE + index}
              key={post.slug}
              post={post}
            />
          ))}
        </div>
        <PaginationNav
          currentPage={page}
          hrefForPage={(nextPage) => areaHref(area, nextPage)}
          label={`${area.category} archive pages`}
          totalPages={totalPages}
        />
      </section>
    </>
  );
}
