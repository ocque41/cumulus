import { HeroDither } from "@/components/visual/HeroDither";
import { AppLink } from "@/lib/router";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__visual">
        <HeroDither
          fallbackClassName="footer-dither-fallback"
          frame={391}
          maxPixelCount={560_000}
          shape="wave"
          size={3}
          speed={0.18}
          type="8x8"
        />
        <p aria-hidden="true" className="site-footer__signal">
          CUMULUS
        </p>
      </div>

      <div className="site-footer__grid page-shell">
        <div>
          <p className="eyebrow">Field notes from the build</p>
          <p className="site-footer__statement">
            Systems, interfaces, and the evidence between them.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="site-footer__links">
          <AppLink href="/">Home</AppLink>
          <AppLink href="/logs">All logs</AppLink>
          <a href="https://github.com/ocque41" rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a href="mailto:hi@cumulush.com">hi@cumulush.com</a>
        </nav>
        <div className="site-footer__legal">
          <p>Cumulus lab</p>
          <p>Public notes, evidence-led.</p>
          <p>© {new Date().getFullYear()} Cumulus.</p>
        </div>
      </div>
    </footer>
  );
}
