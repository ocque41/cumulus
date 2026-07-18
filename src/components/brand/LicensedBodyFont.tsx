import { useEffect } from "react";

import {
  ALCYONE_FONT_CONTENT_TYPE,
  ALCYONE_FONT_ENDPOINT,
  isAlcyoneFontContentType,
} from "@/lib/alcyone-font-protocol";

const BODY_FONT_ATTRIBUTE = "data-body-font";
const ALCYONE_ATTRIBUTE_VALUE = "alcyone";

export function LicensedBodyFont() {
  useEffect(() => {
    const controller = new AbortController();
    const root = document.documentElement;
    let active = true;

    root.removeAttribute(BODY_FONT_ATTRIBUTE);

    void fetch(ALCYONE_FONT_ENDPOINT, {
      cache: "default",
      credentials: "same-origin",
      headers: { Accept: ALCYONE_FONT_CONTENT_TYPE },
      method: "HEAD",
      signal: controller.signal,
    })
      .then((response) => {
        if (
          !active ||
          !response.ok ||
          !isAlcyoneFontContentType(response.headers.get("Content-Type"))
        ) {
          return;
        }
        root.setAttribute(BODY_FONT_ATTRIBUTE, ALCYONE_ATTRIBUTE_VALUE);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      controller.abort();
      if (root.getAttribute(BODY_FONT_ATTRIBUTE) === ALCYONE_ATTRIBUTE_VALUE) {
        root.removeAttribute(BODY_FONT_ATTRIBUTE);
      }
    };
  }, []);

  return null;
}
