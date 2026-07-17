const FONT_ENV = "ALCYONE_MEDIUM_WOFF2_BASE64";
const WOFF2_MAGIC = "wOF2";
const MIN_FONT_BYTES = 8_000;
const MAX_FONT_BYTES = 80_000;
const MAX_ENCODED_BYTES = 120_000;

type FontEnvironment = Readonly<Record<string, string | undefined>>;

const unavailableHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
};

function unavailableResponse(status = 503): Response {
  return new Response(null, {
    status,
    headers: unavailableHeaders,
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
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: { ...unavailableHeaders, Allow: "GET, HEAD" },
      });
    }

    const font = decodeConfiguredFont(env[FONT_ENV]);
    if (!font) return unavailableResponse();

    const headers = {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(font.byteLength),
      "Content-Type": "font/woff2",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
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
