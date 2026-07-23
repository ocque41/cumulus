import { HeroDither } from "@/components/visual/HeroDither";
import { AppLink, useDocumentMeta } from "@/lib/router";

export function NotFoundPage() {
  useDocumentMeta(
    "Log not found — Cumulus lab",
    "The requested Cumulus route could not be found.",
    { canonicalPath: "/404", noIndex: true, type: "website" },
  );

  return (
    <section className="not-found page-shell">
      <div>
        <p className="eyebrow">404 / signal absent</p>
        <h1>This log is not in the field.</h1>
        <p>The address may have moved, or the entry may not be public.</p>
        <AppLink className="button-primary" href="/logs">
          Open the log index
        </AppLink>
      </div>
      <HeroDither
        fallbackClassName="not-found__fallback"
        frame={404}
        maxPixelCount={460_000}
        priority
        shape="simplex"
        size={4}
        speed={0.5}
        type="8x8"
      />
    </section>
  );
}
