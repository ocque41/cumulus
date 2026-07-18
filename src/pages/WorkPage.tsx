import {
  DitherPlate,
  articleHref,
} from "@/components/content/PostComponents";
import { DitherArtwork } from "@/components/visual/DitherArtwork";
import { HeroDither } from "@/components/visual/HeroDither";
import {
  WORK_PROJECTS,
  type WorkProject,
} from "@/content/work";
import { publishedPosts, type Post } from "@/content/posts";
import { AppLink, useDocumentMeta } from "@/lib/router";

function projectPosts(project: WorkProject): readonly Post[] {
  return publishedPosts.filter((post) => {
    const postProject = post.project?.trim().toLocaleLowerCase("en-US");
    return postProject === project.slug;
  });
}

export function WorkPage() {
  useDocumentMeta(
    "Public work — Cumulus lab",
    "A first-party field guide to current Cumulus lab projects, their reviewed public summaries, stated status, and source boundaries.",
  );

  return (
    <>
      <header className="work-hero">
        <HeroDither
          className="work-hero__dither"
          fallbackClassName="work-hero__dither-fallback"
          frame={288}
          maxPixelCount={420_000}
          shape="wave"
          size={3}
          speed={0.1}
          type="8x8"
        />
        <div className="work-hero__content page-shell">
          <p className="eyebrow">Cumulus lab / project field</p>
          <h1>Public work</h1>
          <div className="work-hero__intro">
            <p>
              A first-party map of the systems under construction: what each project is,
              what its reviewed public summary currently covers, and where the evidence
              boundary actually sits.
            </p>
            <p>
              Four projects are documented here. Their product and architecture boundaries
              are public-safe; private implementation and provider evidence stay outside the page.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="work-index-title" className="work-directory page-shell">
        <div className="section-intro section-intro--split">
          <div>
            <p className="eyebrow">Project directory / 001</p>
            <h2 id="work-index-title">The lab, system by system.</h2>
          </div>
          <p>
            Open a project inside this page. The directory stays focused on the four systems
            currently being developed by the lab.
          </p>
        </div>
        <nav aria-label="Public work directory" className="work-index">
          {WORK_PROJECTS.map((project, index) => (
            <AppLink href={`/work#work-${project.slug}`} key={project.slug}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{project.name}</strong>
              <small>{project.domain}</small>
            </AppLink>
          ))}
        </nav>
      </section>

      <section aria-label="Cumulus lab projects" className="work-projects page-shell">
        {WORK_PROJECTS.map((project, index) => {
          const notes = projectPosts(project);

          return (
            <article
              aria-labelledby={`work-${project.slug}-title`}
              className="work-project"
              id={`work-${project.slug}`}
              key={project.slug}
            >
              <div className="work-project__rail">
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p>{project.status}</p>
              </div>

              <div className="work-project__body">
                <p className="eyebrow">{project.domain}</p>
                <h2 id={`work-${project.slug}-title`}>{project.name}</h2>
                <p className="work-project__description">{project.description}</p>

                <div className="work-project__latest">
                  <div>
                    <h3>Latest work</h3>
                    <time dateTime={project.verifiedAt}>Reviewed {project.verifiedAt}</time>
                  </div>
                  <p>{project.latestWork}</p>
                </div>

                <div className="work-project__stack">
                  <p className="eyebrow">Working stack</p>
                  <ul aria-label={`${project.name} technology stack`}>
                    {project.stack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>

                <div className="work-project__source">
                  <p>{project.sourceBoundary}</p>
                  <span>Private implementation boundary</span>
                </div>

                {notes.length > 0 ? (
                  <div className="work-project__notes">
                    <p className="eyebrow">Project logs</p>
                    <div>
                      {notes.map((post, noteIndex) => (
                        <AppLink data-signal-host href={articleHref(post)} key={post.slug}>
                          <DitherPlate
                            className="work-project__note-plate"
                            decorative
                            placement={`work-${project.slug}`}
                            post={post}
                          />
                          <span>{String(noteIndex + 1).padStart(2, "0")}</span>
                          <strong>{post.title}</strong>
                        </AppLink>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <DitherArtwork
                className="work-project__signal"
                decorative
                seed={`work:${project.slug}`}
                variant={project.slug}
              >
                <span>{project.slug.replaceAll("-", " / ")}</span>
              </DitherArtwork>
            </article>
          );
        })}
      </section>

      <section className="work-log-bridge page-shell" aria-labelledby="work-log-bridge-title">
        <p className="eyebrow">Project notes / 002</p>
        <h2 id="work-log-bridge-title">Follow the decisions behind the systems.</h2>
        <p>
          The log archive turns implementation choices into long-form notes with clear evidence
          limits and related reading.
        </p>
        <AppLink className="button-primary" href="/logs">
          Search the logs
        </AppLink>
      </section>
    </>
  );
}
