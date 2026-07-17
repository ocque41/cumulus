import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AuthCallbackPage,
  AuthDialog,
  AuthProvider,
  useAuth,
} from "@/components/auth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getPublishedPostBySlug } from "@/content/posts";
import { notificationPromptStorage } from "@/features/notifications/prompt-storage";
import { navigate, usePathname } from "@/lib/router";
import { HomePage } from "@/pages/HomePage";
import { LogsPage } from "@/pages/LogsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PostPage } from "@/pages/PostPage";
import { PrivacyPage } from "@/pages/PrivacyPage";

const WorkPage = lazy(() =>
  import("@/pages/WorkPage").then((module) => ({ default: module.WorkPage })),
);

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

type NotificationDialogMode = "automatic" | "manual";

function allowsAutomaticNotificationPrompt(path: string): boolean {
  if (path === "/" || path === "/logs" || path === "/work") return true;
  if (!path.startsWith("/logs/")) return false;

  const slug = decodeSlug(path.slice("/logs/".length));
  return Boolean(slug && getPublishedPostBySlug(slug));
}

function PublicRoutes() {
  const pathname = usePathname();
  const { available, loading, user } = useAuth();
  const [notificationDialogMode, setNotificationDialogMode] =
    useState<NotificationDialogMode | null>(null);
  const automaticPromptChecked = useRef(false);
  const path = normalizePath(pathname);
  const automaticPromptAllowed = allowsAutomaticNotificationPrompt(path);
  const notificationDialogOpen = notificationDialogMode === "manual"
    || (
      notificationDialogMode === "automatic"
      && automaticPromptAllowed
    );

  const openNotificationSettings = useCallback(() => {
    automaticPromptChecked.current = true;
    setNotificationDialogMode("manual");
  }, []);

  const closeNotificationSettings = useCallback(() => {
    setNotificationDialogMode(null);
  }, []);

  useEffect(() => {
    if (notificationDialogOpen) notificationPromptStorage.markSeen();
  }, [notificationDialogOpen]);

  useEffect(() => {
    if (
      notificationDialogMode !== "automatic"
      || automaticPromptAllowed
    ) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setNotificationDialogMode((current) =>
        current === "automatic" ? null : current
      );
    });
    return () => {
      active = false;
    };
  }, [automaticPromptAllowed, notificationDialogMode]);

  useEffect(() => {
    if (
      automaticPromptChecked.current
      || !automaticPromptAllowed
      || loading
      || !available
    ) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (!active || automaticPromptChecked.current) return;
      automaticPromptChecked.current = true;
      if (user || notificationPromptStorage.hasSeen()) return;

      setNotificationDialogMode("automatic");
    });
    return () => {
      active = false;
    };
  }, [automaticPromptAllowed, available, loading, user]);

  if (path === "/auth/callback") {
    return <AuthCallbackPage onComplete={() => navigate("/", { replace: true })} />;
  }

  let page;

  if (path === "/") {
    page = <HomePage onOpenAuth={openNotificationSettings} />;
  } else if (path === "/logs") {
    page = <LogsPage />;
  } else if (path.startsWith("/logs/")) {
    const slug = decodeSlug(path.slice("/logs/".length));
    const post = slug ? getPublishedPostBySlug(slug) : undefined;
    page = post ? <PostPage post={post} /> : <NotFoundPage />;
  } else if (path === "/work") {
    page = (
      <Suspense
        fallback={(
          <div className="route-pending page-shell" role="status">
            Loading the project field…
          </div>
        )}
      >
        <WorkPage />
      </Suspense>
    );
  } else if (path === "/privacy") {
    page = <PrivacyPage />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <>
      <SiteLayout onOpenAuth={openNotificationSettings}>{page}</SiteLayout>
      <AuthDialog
        mode={notificationDialogMode ?? "manual"}
        open={notificationDialogOpen}
        onClose={closeNotificationSettings}
      />
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
