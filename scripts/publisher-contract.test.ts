import { describe, expect, it } from "vitest";

// The contract stays plain Node ESM so Actions can execute it before install.
import {
  applyPublication,
  decodePublicationPayload,
  publicationBranch,
  sha256,
  stableJson,
  validatePost,
} from "./publisher-contract.mjs";

function editorialPost(overrides: Record<string, unknown> = {}) {
  return {
    slug: "repository-native-publishing",
    title: "Repository-native publishing",
    excerpt: "A detailed public record of moving publication mutation into reviewed repository workflows.",
    status: "published",
    date: "2026-07-23",
    category: "Editorial",
    tags: ["Publishing", "GitHub"],
    placement: "recent",
    visual: {
      variant: "signal-window",
      alt: "A deterministic dither signal showing a publication moving through review",
    },
    body: [{
      heading: "The reliable boundary",
      paragraphs: ["The repository now owns validation, review, and exact-commit publication."],
    }],
    verifiedAt: "2026-07-23",
    ...overrides,
  };
}

function encodedPayload(overrides: Record<string, unknown> = {}) {
  const post = validatePost(editorialPost());
  const payload = {
    schemaVersion: 1,
    draftId: "draft_01",
    correlationId: "draft_01_attempt_1",
    attemptNumber: 1,
    sourceHash: sha256("source"),
    contentDigest: sha256(stableJson(post)),
    post,
    ...overrides,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

describe("publisher contract", () => {
  it("validates an exact versioned payload and deterministic branch", () => {
    const payload = decodePublicationPayload(encodedPayload());

    expect(payload.post.slug).toBe("repository-native-publishing");
    expect(publicationBranch(payload)).toMatch(
      /^content\/repository-native-publishing-[a-f0-9]{10}-a1$/,
    );
  });

  it("rejects malformed, oversized, unsupported, and digest-mismatched payloads", () => {
    expect(() => decodePublicationPayload("not base64!")).toThrow(/malformed/i);
    expect(() => decodePublicationPayload("A".repeat(65_536))).toThrow(/oversized/i);
    expect(() => decodePublicationPayload(encodedPayload({ injectedCommand: "rm" })))
      .toThrow(/unsupported field/i);
    expect(() => decodePublicationPayload(encodedPayload({
      contentDigest: "0".repeat(64),
    }))).toThrow(/does not match/i);
  });

  it("rejects unsafe links, unknown categories, future dates, and arbitrary fields", () => {
    expect(() => validatePost(editorialPost({
      sourceLinks: [{ label: "Local", href: "http://localhost/private" }],
    }))).toThrow(/public HTTPS/i);
    expect(() => validatePost(editorialPost({ category: "Unknown" })))
      .toThrow(/not approved/i);
    expect(() => validatePost(editorialPost({ date: "2999-01-01" })))
      .toThrow(/future/i);
    expect(() => validatePost(editorialPost({ executable: "<script>" })))
      .toThrow(/unsupported field/i);
  });

  it("inserts same-day posts first and reuses only equivalent validated content", () => {
    const payload = decodePublicationPayload(encodedPayload());
    const olderSameDay = editorialPost({
      slug: "existing-log",
      title: "Existing log",
    });
    const inserted = applyPublication([olderSameDay], payload);

    expect(inserted.catalog.map((post: { slug: string }) => post.slug)).toEqual([
      "repository-native-publishing",
      "existing-log",
    ]);
    expect(applyPublication(inserted.catalog, payload).reused).toBe(true);
    expect(() => applyPublication([
      editorialPost({
        slug: payload.post.slug,
        title: "Different content",
      }),
    ], payload)).toThrow(/Duplicate slug/i);
  });

  it("rejects related slugs that are absent from the published catalog", () => {
    const post = validatePost(editorialPost({ relatedSlugs: ["missing-log"] }));
    const payload = decodePublicationPayload(encodedPayload({
      post,
      contentDigest: sha256(stableJson(post)),
    }));

    expect(() => applyPublication([], payload)).toThrow(/does not resolve/i);
  });
});
