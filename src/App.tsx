import { useState } from "react";

import {
  AuthCallbackPage,
  AuthDialog,
  AuthProvider,
} from "@/components/auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getPublishedPostBySlug } from "@/content/posts";
import { UnsubscribePage } from "@/features/notifications";
import { navigate, useRoute } from "@/lib/router";
import { HomePage } from "@/pages/HomePage";
import { LogsPage } from "@/pages/LogsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PostPage } from "@/pages/PostPage";

function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function decodeSlug(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function PublicRoutes() {
  const { pathname } = useRoute();
  const [authOpen, setAuthOpen] = useState(false);
  const path = normalizePath(pathname);

  if (path === "/auth/callback") {
    return <AuthCallbackPage onComplete={() => navigate("/", { replace: true })} />;
  }

  if (path === "/unsubscribe") {
    return <UnsubscribePage />;
  }

  let page;

  if (path === "/") {
    page = <HomePage onOpenAuth={() => setAuthOpen(true)} />;
  } else if (path === "/logs") {
    page = <LogsPage />;
  } else if (path.startsWith("/logs/")) {
    const slug = decodeSlug(path.slice("/logs/".length));
    const post = slug ? getPublishedPostBySlug(slug) : undefined;
    page = post ? <PostPage post={post} /> : <NotFoundPage />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <>
      <SiteLayout onOpenAuth={() => setAuthOpen(true)}>{page}</SiteLayout>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <PublicRoutes />
    </AuthProvider>
  );
}
