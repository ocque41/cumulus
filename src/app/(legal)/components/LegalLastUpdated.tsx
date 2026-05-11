import { legalMeta } from "@/lib/legal/data";
import type { SupportedLocale } from "@/lib/legal/schema";

type LegalLastUpdatedProps = {
  lastUpdated?: string;
  locale: SupportedLocale;
};

const lastUpdatedLabel: Record<SupportedLocale, string> = {
  en: "Last updated",
  es: "Última actualización",
};

export function LegalLastUpdated({ lastUpdated, locale }: LegalLastUpdatedProps) {
  const isoDate = lastUpdated ?? legalMeta.legal.lastUpdated;

  let friendly = isoDate;
  try {
    friendly = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(new Date(isoDate));
  } catch {
    friendly = isoDate;
  }

  return (
    <div className="glass-surface glass-subtle glass-e1 rounded-[5.5px] p-4 text-sm">
      <p className="font-semibold text-[color:var(--glass-text-title)]">{lastUpdatedLabel[locale]}</p>
      <time
        className="mt-1 block text-[color:var(--glass-text-muted)]"
        dateTime={isoDate}
        title={friendly}
      >
        {isoDate}
      </time>
    </div>
  );
}
