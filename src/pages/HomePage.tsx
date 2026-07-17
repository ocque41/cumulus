import { GitHubContributionGraph } from "@/components/github/GitHubContributionGraph";
import {
  articleHref,
  DitherPlate,
  FeaturedPost,
  PostCard,
} from "@/components/content/PostComponents";
import { HeroDither } from "@/components/visual/HeroDither";
import { featuredPost, publishedPosts } from "@/content/posts";
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

  const newest = publishedPosts.filter((post) => post.placement === "recent");
  const stories = publishedPosts.filter((post) => post.placement === "stories");
  const research = publishedPosts.filter((post) => post.placement === "research");
  const business = publishedPosts.filter((post) => post.placement === "build-business");

  return (
    <>
      <section aria-labelledby="home-title" className="home-hero">
        <HeroDither
          className="home-hero__dither"
          fallbackClassName="home-hero__dither-fallback"
          frame={288}
          maxPixelCount={420_000}
          shape="wave"
          size={3}
          speed={0.1}
          type="8x8"
        />
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

      <section aria-labelledby="featured-title" className="home-section page-shell">
        <div className="section-heading">
          <p className="eyebrow">Current signal / 002</p>
          <h2 id="featured-title">One log, opened wide</h2>
        </div>
        <FeaturedPost post={featuredPost} />
      </section>

      <section aria-labelledby="latest-title" className="home-section page-shell">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow">Recent entries / 003</p>
            <h2 id="latest-title">Notes from active builds</h2>
          </div>
          <p>
            Focused project journals, ordered by publication. Each entry opens into a
            full reading page with evidence limits and neighboring notes.
          </p>
        </div>
        <div className="post-grid">
          {newest.map((post, index) => (
            <PostCard index={index} key={post.slug} post={post} />
          ))}
        </div>
        <AppLink className="large-index-link" href="/logs">
          <span>Browse the complete log index</span>
          <span aria-hidden="true">{String(publishedPosts.length).padStart(2, "0")}</span>
        </AppLink>
      </section>

      <section className="signal-interlude" aria-label="Cumulus signal field">
        <HeroDither
          fallbackClassName="signal-interlude__fallback"
          frame={642}
          maxPixelCount={720_000}
          shape="ripple"
          size={3}
          speed={0.14}
          type="4x4"
        />
        <div className="signal-interlude__copy page-shell">
          <p>Read the boundary.</p>
          <p>Keep the proof.</p>
        </div>
      </section>

      <section aria-labelledby="stories-title" className="home-section page-shell">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Stories / 004</p>
          <h2 id="stories-title">Systems told from the inside.</h2>
        </div>
        <div className="field-note-grid">
          {stories.map((post) => (
            <article className="field-note" key={post.slug}>
              <AppLink
                aria-label={`Read ${post.title}`}
                className="field-note__visual"
                href={articleHref(post)}
              >
                <DitherPlate
                  className="field-note__plate"
                  decorative
                  placement="home-story"
                  post={post}
                />
              </AppLink>
              <p className="eyebrow">{post.category}</p>
              <h3>
                <AppLink href={`/logs/${post.slug}`}>{post.title}</AppLink>
              </h3>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="research-title" className="home-section page-shell">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow">Latest research / 005</p>
            <h2 id="research-title">Engineering boundaries, inspected closely.</h2>
          </div>
          <p>
            First-party readings of runtime behavior, tool boundaries, and the
            evidence that keeps an implementation claim honest.
          </p>
        </div>
        <div className="post-grid">
          {research.map((post, index) => (
            <PostCard index={index + 10} key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section aria-labelledby="business-title" className="home-section page-shell">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Business / 006</p>
          <h2 id="business-title">Authority, identity, and durable operations.</h2>
        </div>
        <div className="field-note-grid">
          {business.map((post) => (
            <article className="field-note" key={post.slug}>
              <AppLink
                aria-label={`Read ${post.title}`}
                className="field-note__visual"
                href={articleHref(post)}
              >
                <DitherPlate
                  className="field-note__plate"
                  decorative
                  placement="home-business"
                  post={post}
                />
              </AppLink>
              <p className="eyebrow">{post.category}</p>
              <h3>
                <AppLink href={`/logs/${post.slug}`}>{post.title}</AppLink>
              </h3>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="notify-title" className="notify-section page-shell" id="notify">
        <div className="notify-section__intro">
          <p className="eyebrow">Optional dispatch / 007</p>
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
