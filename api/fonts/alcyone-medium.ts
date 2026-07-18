import {
  ALCYONE_FONT_AVAILABLE_CACHE_CONTROL,
  ALCYONE_FONT_CONTENT_TYPE,
  ALCYONE_FONT_METHOD_NOT_ALLOWED_HEADERS,
  ALCYONE_FONT_METHOD_NOT_ALLOWED_STATUS,
  ALCYONE_FONT_SECURITY_HEADERS,
  ALCYONE_FONT_UNAVAILABLE_HEADERS,
  getAlcyoneFontUnavailableStatus,
  isAlcyoneFontRequestMethod,
} from "../../src/lib/alcyone-font-protocol.js";
import type { AlcyoneFontRequestMethod } from "../../src/lib/alcyone-font-protocol.js";

const FONT_ENV = "ALCYONE_MEDIUM_WOFF2_BASE64";
const WOFF2_MAGIC = "wOF2";
const MIN_FONT_BYTES = 8_000;
const MAX_FONT_BYTES = 80_000;
const MAX_ENCODED_BYTES = 120_000;

type FontEnvironment = Readonly<Record<string, string | undefined>>;

function unavailableResponse(method: AlcyoneFontRequestMethod): Response {
  return new Response(null, {
    status: getAlcyoneFontUnavailableStatus(method),
    headers: ALCYONE_FONT_UNAVAILABLE_HEADERS,
  });
}

function decodeConfiguredFont(encoded: string | undefined): Buffer | null {
  const value = encoded?.trim();
  if (
    !value ||
    value.length > MAX_ENCODED_BYTES ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    return null;
  }

  const font = Buffer.from(value, "base64");
  if (font.toString("base64") !== value) return null;

  const hasSupportedFlavor =
    font.byteLength >= 8 &&
    (font.readUInt32BE(4) === 0x00010000 || font.subarray(4, 8).toString("ascii") === "OTTO");

  if (
    font.byteLength < MIN_FONT_BYTES ||
    font.byteLength > MAX_FONT_BYTES ||
    font.subarray(0, 4).toString("ascii") !== WOFF2_MAGIC ||
    !hasSupportedFlavor ||
    font.readUInt32BE(8) !== font.byteLength ||
    font.readUInt16BE(12) === 0 ||
    font.readUInt16BE(14) !== 0
  ) {
    return null;
  }

  return font;
}

export function createAlcyoneMediumFontHandler(env: FontEnvironment) {
  return (request: Request): Response => {
    if (!isAlcyoneFontRequestMethod(request.method)) {
      return new Response(null, {
        status: ALCYONE_FONT_METHOD_NOT_ALLOWED_STATUS,
        headers: ALCYONE_FONT_METHOD_NOT_ALLOWED_HEADERS,
      });
    }

    const font = decodeConfiguredFont(env[FONT_ENV]);
    if (!font) {
      // The browser probes with HEAD before enabling the licensed family.
      // A bodyless success keeps expected Local/Preview fallback out of the
      // console while GET remains fail-closed and never exposes invalid bytes.
      return unavailableResponse(request.method);
    }

    const headers = {
      "Cache-Control": ALCYONE_FONT_AVAILABLE_CACHE_CONTROL,
      "Content-Length": String(font.byteLength),
      "Content-Type": ALCYONE_FONT_CONTENT_TYPE,
      ...ALCYONE_FONT_SECURITY_HEADERS,
    };

    const body = request.method === "HEAD" ? null : Uint8Array.from(font);
    return new Response(body, { headers });
  };
}

export default {
  fetch(request: Request): Response {
    return createAlcyoneMediumFontHandler(process.env)(request);
  },
};
