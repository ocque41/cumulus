import { CopyCommand } from "@/components/create/copy-command";
import { CREATE_SHORT_COMMAND } from "@/lib/cumulus-create";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--hairline)] py-8">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <p className="font-mono text-xs uppercase text-[color:var(--title)]">
          Cumulus Create
        </p>
        <CopyCommand command={CREATE_SHORT_COMMAND} />
      </div>
    </footer>
  );
}
