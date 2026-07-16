import { describe, expect, it } from "vitest";
import { readSmallText, RequestBodyError } from "./http";

describe("bounded request body reader", () => {
  it("reads a body whose UTF-8 byte length is within the limit", async () => {
    const request = new Request("https://cumulush.com/api/test", {
      method: "POST",
      body: "cloud-ñ",
    });
    await expect(readSmallText(request, 8)).resolves.toBe("cloud-ñ");
  });

  it("stops an unlabelled body once it exceeds the byte limit", async () => {
    const request = new Request("https://cumulush.com/api/test", {
      method: "POST",
      body: "x".repeat(4097),
    });
    await expect(readSmallText(request)).rejects.toMatchObject({
      status: 413,
      message: "request_too_large",
    } satisfies Partial<RequestBodyError>);
  });

  it("rejects malformed content length and invalid UTF-8", async () => {
    const malformedLength = new Request("https://cumulush.com/api/test", {
      method: "POST",
      headers: { "Content-Length": "unknown" },
      body: "{}",
    });
    await expect(readSmallText(malformedLength)).rejects.toMatchObject({
      status: 400,
      message: "invalid_content_length",
    });

    const invalidUtf8 = new Request("https://cumulush.com/api/test", {
      method: "POST",
      body: new Uint8Array([0xff]),
    });
    await expect(readSmallText(invalidUtf8)).rejects.toMatchObject({
      status: 400,
      message: "invalid_request_body",
    });
  });
});
