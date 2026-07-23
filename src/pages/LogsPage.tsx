import { useMemo, useState, type FormEvent } from "react";

import {
  PaginationNav,
  PostIndexRow,
} from "@/components/content/PostComponents";
import { HeroDither } from "@/components/visual/HeroDither";
import { ARCHIVE_PAGE_SIZE, pageCount, pageItems } from "@/content/areas";
import { publishedPosts, searchPublishedPosts } from "@/content/posts";
import { navigate, useDocumentMeta, useSearchParams } from "@/lib/router";

function searchHref(query: string, category: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category !== "all") params.set("category", category);
  const search = params.toString();
  return search ? `/logs?${search}` : "/logs";
}

function archiveHref(page: number): string {
  return page > 1 ? `/logs/page/${page}` : "/logs";
}

export function LogsPage({ page = 1 }: { page?: number }) {
  const params = useSearchParams();
  const routeQuery = params.get("q") ?? "";
  const routeCategory = params.get("category") ?? "all";
  const filtersActive = Boolean(routeQuery || routeCategory !== "all");
  const canonicalPath = archiveHref(page);
  const pageSuffix = page > 1 ? `, page ${page}` : "";

  useDocumentMeta(
    `Log index${pageSuffix} — Cumulus lab`,
    "Search and filter the complete public Cumulus log archive.",
    { canonicalPath, noIndex: filtersActive, type: "website" },
  );

  return <LogsArchive category={routeCategory} page={page} query={routeQuery} />;
}

function LogsArchive({
  category: initialCategory,
  page,
  query: initialQuery,
}: {
  category: string;
  page: number;
  query: string;
}) {
  const routeQuery = initialQuery;
  const routeCategory = initialCategory;
  const [queryDraft, setQueryDraft] = useState({
    routeQuery,
    value: routeQuery,
  });
  const query = queryDraft.routeQuery === routeQuery
    ? queryDraft.value
    : routeQuery;
  const setQuery = (value: string) => setQueryDraft({ routeQuery, value });

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(publishedPosts.map((post) => post.category))).sort()],
    [],
  );
  const filteredResults = useMemo(
    () => searchPublishedPosts(routeQuery, routeCategory),
    [routeCategory, routeQuery],
  );
  const filtersActive = Boolean(routeQuery || routeCategory !== "all");
  const effectivePage = filtersActive ? 1 : page;
  const totalPages = pageCount(filteredResults.length);
  const results = filtersActive
    ? filteredResults
    : pageItems(filteredResults, effectivePage);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(searchHref(query, routeCategory), { scroll: false });
  };

  const chooseCategory = (nextCategory: string) => {
    navigate(searchHref(query, nextCategory), { scroll: false });
  };

  return (
    <>
      <header className="archive-hero page-shell">
        <div>
          <p className="eyebrow">Cumulus archive / all public logs</p>
          <h1>Log index</h1>
          <p>
            Search across systems, projects, evidence, and field notes. The archive
            stays public; authentication is never required to read it.
          </p>
        </div>
        <HeroDither
          fallbackClassName="archive-hero__fallback"
          frame={824}
          maxPixelCount={480_000}
          priority
          shape="warp"
          size={3}
          speed={0.58}
          type="4x4"
        />
      </header>

      <section aria-labelledby="archive-filter-title" className="archive page-shell">
        <h2 className="visually-hidden" id="archive-filter-title">
          Filter the log archive
        </h2>
        <form className="archive-search" onSubmit={submit} role="search">
          <label htmlFor="log-query">Search logs</label>
          <div>
            <input
              autoComplete="off"
              id="log-query"
              name="q"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Project, decision, or phrase"
              type="search"
              value={query}
            />
            <button type="submit">Search</button>
          </div>
        </form>

        <div aria-label="Filter by category" className="category-filter">
          {categories.map((item) => (
            <button
              aria-pressed={routeCategory === item}
              key={item}
              onClick={() => chooseCategory(item)}
              type="button"
            >
              {item === "all" ? "All logs" : item}
            </button>
          ))}
        </div>

        <div className="archive-results-heading">
          <p aria-live="polite" role="status">
            {filteredResults.length} {filteredResults.length === 1 ? "entry" : "entries"}
            {routeQuery ? ` matching “${routeQuery}”` : ""}
            {!filtersActive ? ` · page ${effectivePage} of ${totalPages}` : ""}
          </p>
          {(routeQuery || routeCategory !== "all") && (
            <button
              onClick={() => {
                setQuery("");
                navigate("/logs", { scroll: false });
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <div className="post-index">
            {results.map((post, index) => (
              <PostIndexRow
                index={(effectivePage - 1) * ARCHIVE_PAGE_SIZE + index}
                key={post.slug}
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">No signal found</p>
            <h2>Try a wider phrase or clear the category.</h2>
            <button
              onClick={() => {
                setQuery("");
                navigate("/logs", { scroll: false });
              }}
              type="button"
            >
              Return to every log
            </button>
          </div>
        )}
        {!filtersActive && results.length > 0 ? (
          <PaginationNav
            currentPage={effectivePage}
            hrefForPage={archiveHref}
            label="Log archive pages"
            totalPages={totalPages}
          />
        ) : null}
      </section>
    </>
  );
}
