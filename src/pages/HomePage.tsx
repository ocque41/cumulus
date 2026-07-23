import { GitHubContributionGraph } from "@/components/github/GitHubContributionGraph";
import {
  CompactPostRow,
  articleHref,
  FeaturedPost,
} from "@/components/content/PostComponents";
import { HeroDither } from "@/components/visual/HeroDither";
import { HomeHeroDither } from "@/components/visual/HomeHeroDither";
import { CONTENT_AREAS, areaHref, postsForArea } from "@/content/areas";
import { homePreviousPosts, latestPost, publishedPosts } from "@/content/posts";
import { NotificationPreferences } from "@/features/notifications";
import { AppLink, useDocumentMeta } from "@/lib/router";

interface HomePageProps {
  onOpenAuth: () => void;
}

export function HomePage({ onOpenAuth }: HomePageProps) {
  useDocumentMeta(
    "Cumulus lab — Field notes from the build",
    "Cumulus is a public laboratory for large-form field notes on systems, interfaces, operations, and the evidence between them.",
  );

  return (
    <>
      <section aria-labelledby="home-title" className="home-hero">
        <HomeHeroDither />
        <div className="home-hero__veil" aria-hidden="true" />
        <div className="home-hero__content">
          <div className="home-hero__type page-shell">
            <p className="eyebrow">Systems / Interfaces / Evidence</p>
            <h1 id="home-title">CUMULUS</h1>
            <p className="home-hero__lab">lab</p>
          </div>
          <div className="home-hero__graph">
            <GitHubContributionGraph />
          </div>
          <div className="home-hero__footer page-shell">
            <p>Independent notes on Requisia, Insuja, Hyoka Hanesu, and gy.</p>
            <AppLink href="/work">Four active systems</AppLink>
          </div>
        </div>
      </section>

      <section className="opening-statement page-shell" aria-labelledby="opening-title">
        <p className="eyebrow">Cumulus / public laboratory</p>
        <h2 id="opening-title">
          The work is the story. The log keeps its receipts.
        </h2>
        <div className="opening-statement__copy">
          <p>
            Cumulus studies four systems in depth: Requisia for procurement
            operations, Insuja for controlled acquisition infrastructure, Hyoka
            Hanesu for local repository assistance, and gy for Git and forge research.
          </p>
          <p>
            Every entry is public to read. Email confirmation is offered only to
            readers who choose a new-log notification preference.
          </p>
        </div>
      </section>

      <section aria-labelledby="latest-log-title" className="home-section page-shell">
        <div className="section-heading">
          <p className="eyebrow">Latest log / 002</p>
          <h2 id="latest-log-title">The newest public record</h2>
        </div>
        <FeaturedPost post={latestPost} />
      </section>

      <section aria-labelledby="previous-title" className="home-section page-shell">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow">Previous logs / 003</p>
            <h2 id="previous-title">The chronological chain</h2>
          </div>
          <p>
            The four entries immediately before the latest record. Older work remains
            available in the complete archive and its project area.
          </p>
        </div>
        <div className="compact-post-chain" data-card-count={homePreviousPosts.length}>
          {homePreviousPosts.map((post, index) => (
            <CompactPostRow index={index} key={post.slug} post={post} />
          ))}
        </div>
        <AppLink className="large-index-link" href="/logs">
          <span>Browse the complete log index</span>
          <span aria-hidden="true">{String(publishedPosts.length).padStart(2, "0")}</span>
        </AppLink>
      </section>

      <section aria-labelledby="areas-title" className="home-section page-shell">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow">Explore by area / 004</p>
            <h2 id="areas-title">Five durable streams of work</h2>
          </div>
          <AppLink href="/areas">Open the area index</AppLink>
        </div>
        <div className="area-overview-grid">
          {CONTENT_AREAS.map((area, index) => {
            const areaPosts = postsForArea(publishedPosts, area);
            const newest = areaPosts[0];
            return (
              <article className="area-overview-card" key={area.slug}>
                <div className="area-overview-card__signal" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <p className="eyebrow">{areaPosts.length} public logs</p>
                <h3>
                  <AppLink href={areaHref(area)}>{area.category}</AppLink>
                </h3>
                <p>{area.description}</p>
                {newest ? (
                  <AppLink className="area-overview-card__latest" href={articleHref(newest)}>
                    Latest: {newest.title}
                  </AppLink>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="signal-interlude" aria-label="Cumulus signal field">
        <HeroDither
          fallbackClassName="signal-interlude__fallback"
          frame={642}
          maxPixelCount={720_000}
          shape="ripple"
          size={3}
          speed={0.48}
          type="4x4"
        />
        <div className="signal-interlude__copy page-shell">
          <p>Read the boundary.</p>
          <p>Keep the proof.</p>
        </div>
      </section>

      <section aria-labelledby="notify-title" className="notify-section page-shell" id="notify">
        <div className="notify-section__intro">
          <p className="eyebrow">Optional dispatch / 005</p>
          <h2 id="notify-title">One email when a new log lands.</h2>
          <p>
            No reading wall, no digest machinery, no access tier. Confirm an email
            only if you want new-log notifications, and turn them off whenever you
            like.
          </p>
          <button className="button-primary" onClick={onOpenAuth} type="button">
            Set notification preference
          </button>
        </div>
        <NotificationPreferences className="notify-section__preferences" />
      </section>
    </>
  );
}
