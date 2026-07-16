/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

export interface RouteSnapshot {
  hash: string;
  pathname: string;
  search: string;
}

const serverSnapshot: RouteSnapshot = {
  hash: "",
  pathname: "/",
  search: "",
};

let browserSnapshot: RouteSnapshot | undefined;

function readBrowserSnapshot(): RouteSnapshot {
  if (typeof window === "undefined") return serverSnapshot;

  const next = {
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
  };

  if (
    browserSnapshot?.hash === next.hash &&
    browserSnapshot.pathname === next.pathname &&
    browserSnapshot.search === next.search
  ) {
    return browserSnapshot;
  }

  browserSnapshot = next;
  return next;
}

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("cumulus:navigate", listener);

  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("cumulus:navigate", listener);
  };
}

export function navigate(to: string, options?: { replace?: boolean; scroll?: boolean }) {
  const url = new URL(to, window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const next = `${url.pathname}${url.search}${url.hash}`;

  if (current === next) return;

  if (options?.replace) {
    window.history.replaceState({}, "", next);
  } else {
    window.history.pushState({}, "", next);
  }

  browserSnapshot = undefined;
  window.dispatchEvent(new Event("cumulus:navigate"));

  if (options?.scroll === false) return;

  if (url.hash) {
    requestAnimationFrame(() => {
      document.getElementById(url.hash.slice(1))?.scrollIntoView();
    });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

export function useRoute(): RouteSnapshot {
  return useSyncExternalStore(subscribe, readBrowserSnapshot, () => serverSnapshot);
}

export function usePathname(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => serverSnapshot.pathname,
  );
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => serverSnapshot.search,
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface AppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
}

export function AppLink({ children, href, onClick, target, ...props }: AppLinkProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        target === "_blank"
      ) {
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const sameDocumentHash =
        Boolean(url.hash) &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search;
      if (sameDocumentHash) return;

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    },
    [href, onClick, target],
  );

  return (
    <a href={href} onClick={handleClick} target={target} {...props}>
      {children}
    </a>
  );
}

export function useDocumentMeta(title: string, description?: string) {
  const pathname = usePathname();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;

    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.append(meta);
      }
      meta.content = description;
    }

    const canonicalUrl = new URL(pathname, "https://cumulush.com").toString();
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;

    const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta(
      'meta[property="og:type"]',
      "property",
      "og:type",
      pathname.startsWith("/logs/") ? "article" : "website",
    );
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    if (description) {
      setMeta('meta[property="og:description"]', "property", "og:description", description);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    }

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) {
        meta.content = previousDescription;
      }
    };
  }, [description, pathname, title]);
}
