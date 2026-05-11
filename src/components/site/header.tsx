"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavSheetContent } from "./nav";
import { useAuth } from "@/components/providers/auth-provider";

type HeaderProps = {
  hideNavigationMenu?: boolean;
};

export function Header({ hideNavigationMenu = false }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const isHomePage = pathname === "/";
  const guestPrimaryHref = isHomePage ? "/login" : "/login?mode=signup";
  const guestPrimaryLabel = isHomePage ? "Sign In" : "Create Account";

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="container flex items-center justify-between py-6">
        {/* Cumulus brand mark — terracotta dot + two-line JetBrains Mono caps lockup
            per /Users/miguel/Documents/cumulus/CUMULUS-BRAND.md */}
        <Link
          href="/"
          className="inline-flex items-start gap-[10px]"
          aria-label="Cumulus home"
        >
          <span
            aria-hidden
            className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--color-terracotta)]"
          />
          <span className="flex flex-col font-mono uppercase leading-none">
            <span className="text-[11px] font-semibold tracking-[0.22em] text-[color:var(--text)]">
              Cumulus
            </span>
            <span className="mt-[4px] text-[9px] font-normal tracking-[0.16em] text-[color:var(--muted)]">
              by Cumulus
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!hideNavigationMenu ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs tracking-[0.08em] xl:hidden"
                >
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-base tracking-[0.2em] text-[color:var(--muted)]">
                    Navigate
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-6">
                  <NavSheetContent />
                  <SheetClose asChild>
                    <Button variant="secondary" className="justify-center" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-sm tracking-[0.08em] xl:inline-flex"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-xs tracking-[0.08em] xl:hidden"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-sm tracking-[0.08em] xl:inline-flex"
              >
                <Link href={guestPrimaryHref}>{guestPrimaryLabel}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-xs tracking-[0.08em] xl:hidden"
              >
                <Link href={guestPrimaryHref}>{guestPrimaryLabel}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
