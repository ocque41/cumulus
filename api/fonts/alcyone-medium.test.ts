import { describe, expect, it } from "vitest";
import { createAlcyoneMediumFontHandler } from "./alcyone-medium";

const FONT_ENV = "ALCYONE_MEDIUM_WOFF2_BASE64";
const FONT_URL = "https://cumulush.com/api/fonts/alcyone-medium";

function syntheticWoff2(byteLength = 8_000): Buffer {
  const font = Buffer.alloc(byteLength);
  font.write("wOF2", 0, "ascii");
  font.writeUInt32BE(0x00010000, 4);
  font.writeUInt32BE(byteLength, 8);
  font.writeUInt16BE(1, 12);
  font.writeUInt16BE(0, 14);
  font.writeUInt32BE(1_024, 16);
  font.writeUInt32BE(Math.max(1, byteLength - 48), 20);
  return font;
}

function handlerWith(font: Buffer | string | undefined) {
  const value = Buffer.isBuffer(font) ? font.toString("base64") : font;
  return createAlcyoneMediumFontHandler({ [FONT_ENV]: value });
}

describe("licensed Alcyone font route", () => {
  it("serves configured synthetic WOFF2 bytes with bounded same-origin headers", async () => {
    const font = syntheticWoff2();
    const response = handlerWith(font)(new Request(FONT_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("font/woff2");
    expect(response.headers.get("Content-Length")).toBe(String(font.byteLength));
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(font);
  });

  it("returns the same metadata without a body for HEAD", async () => {
    const font = syntheticWoff2();
    const response = handlerWith(font)(new Request(FONT_URL, { method: "HEAD" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("font/woff2");
    expect(response.headers.get("Content-Length")).toBe(String(font.byteLength));
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect((await response.arrayBuffer()).byteLength).toBe(0);
  });

  it.each([undefined, "", "   "])("fails closed when configuration is missing", (value) => {
    const response = handlerWith(value)(new Request(FONT_URL));

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it.each(["not-base64%", "AAAA=", "A==="])("rejects malformed base64 configuration", (value) => {
    expect(handlerWith(value)(new Request(FONT_URL)).status).toBe(503);
  });

  it("rejects bytes with the wrong WOFF2 magic", () => {
    const font = syntheticWoff2();
    font.write("nope", 0, "ascii");

    expect(handlerWith(font)(new Request(FONT_URL)).status).toBe(503);
  });

  it("rejects a mismatched WOFF2 length header", () => {
    const font = syntheticWoff2();
    font.writeUInt32BE(font.byteLength - 1, 8);

    expect(handlerWith(font)(new Request(FONT_URL)).status).toBe(503);
  });

  it("rejects oversized decoded font data", () => {
    expect(handlerWith(syntheticWoff2(80_001))(new Request(FONT_URL)).status).toBe(503);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "rejects unsupported %s requests before reading configuration",
    (method) => {
      const response = handlerWith(undefined)(new Request(FONT_URL, { method }));

      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("GET, HEAD");
      expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
      expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    },
  );
});
