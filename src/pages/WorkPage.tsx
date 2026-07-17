import { DitherCloudMark } from "@/components/brand/DitherCloudMark";
import { PUBLIC_WORK_COUNT, WORK_PROJECTS } from "@/content/work";
import { AppLink, useDocumentMeta } from "@/lib/router";

export function WorkPage() {
  useDocumentMeta(
    "Public work — Cumulus lab",
    "A first-party field guide to current Cumulus lab projects, their latest verified work, public status, and source boundaries.",
  );

  return (
    <>
      <header className="work-hero">
        <DitherCloudMark className="work-hero__cloud" decorative />
        <div className="work-hero__content page-shell">
          <p className="eyebrow">Cumulus lab / project field</p>
          <h1>Public work</h1>
          <div className="work-hero__intro">
            <p>
              A first-party map of the systems under construction: what each project is,
              what changed most recently, and where the evidence boundary actually sits.
            </p>
            <p>
              {WORK_PROJECTS.length} projects are documented here. {PUBLIC_WORK_COUNT} have
              reviewed public source snapshots; private and unpublished work stays plainly
              labeled instead of borrowing a public-release claim.
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
            Open a project inside this page. Source links appear only where anonymous public
            access was verified.
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
        {WORK_PROJECTS.map((project, index) => (
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
                {project.source ? (
                  <a href={project.source.href} rel="noreferrer" target="_blank">
                    {project.source.label} <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span>Source intentionally unavailable</span>
                )}
              </div>
            </div>

            <div aria-hidden="true" className="work-project__signal">
              <DitherCloudMark decorative />
              <span>{project.slug.replaceAll("-", " / ")}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="work-log-bridge page-shell" aria-labelledby="work-log-bridge-title">
        <p className="eyebrow">Project notes / 002</p>
        <h2 id="work-log-bridge-title">Follow the decisions behind the systems.</h2>
        <p>
          The log archive turns implementation choices into long-form notes with public source
          trails and related reading.
        </p>
        <AppLink className="button-primary" href="/logs">
          Search the logs
        </AppLink>
      </section>
    </>
  );
}
