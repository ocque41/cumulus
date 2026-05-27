import Image from "next/image";

import { CREATE_SHORT_COMMAND } from "@/lib/cumulus-create";

const darkLogo = "/create/darkmode.png";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--hairline)] py-8">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Image src={darkLogo} alt="Cumulus" width={1122} height={1402} className="h-10 w-10 rounded-[5.5px] object-cover" />
          <span className="font-mono text-xs uppercase text-[color:var(--title)]">
            Cumulus Create
          </span>
        </div>
        <code className="w-fit max-w-full overflow-x-auto rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-2 font-mono text-xs text-[color:var(--subtitle)]">
          {CREATE_SHORT_COMMAND}
        </code>
      </div>
    </footer>
  );
}
