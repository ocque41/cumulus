import { describe, expect, it } from "vitest";

import { renderMagicLinkEmail, renderPostBroadcast } from "./render";

const UNSUBSCRIBE_URL = "{{{RESEND_UNSUBSCRIBE_URL}}}";

describe("new-post broadcast rendering", () => {
  it("puts the recipient unsubscribe action at the bottom of HTML and text emails", () => {
    const rendered = renderPostBroadcast({
      post: {
        date: "2026-07-18",
        excerpt: "A public update.",
        slug: "public-update",
        title: "Public update",
      },
      postalAddress: "Madrid, Spain",
      postUrl: "https://cumulush.com/logs/public-update",
    });

    const readLink = rendered.html.indexOf("Read Public update");
    const unsubscribeLink = rendered.html.indexOf(
      `href="${UNSUBSCRIBE_URL}"`,
    );
    const postalAddress = rendered.html.indexOf("Cumulus postal address");

    expect(readLink).toBeGreaterThan(-1);
    expect(unsubscribeLink).toBeGreaterThan(readLink);
    expect(postalAddress).toBeGreaterThan(unsubscribeLink);
    expect(rendered.html).toContain("display:inline-block");
    expect(rendered.html).toContain("Unsubscribe from new-post emails");
    expect(rendered.text).toContain(
      `Unsubscribe from new-post emails: ${UNSUBSCRIBE_URL}`,
    );
  });
});

describe("notification-access email rendering", () => {
  it("ends with a signed manage-or-unsubscribe action in HTML and text", () => {
    const settingsUrl = "https://cumulush.com/auth/callback?token=signed-token";
    const rendered = renderMagicLinkEmail({
      expiresAt: new Date("2026-07-18T20:00:00.000Z"),
      link: settingsUrl,
      siteOrigin: "https://cumulush.com",
    });

    const primaryAction = rendered.html.indexOf("Open notification settings");
    const manageAction = rendered.html.indexOf(
      "Manage or unsubscribe from new-post emails",
    );
    const manageButton = rendered.html.lastIndexOf(
      `<a href="${settingsUrl}" style=`,
    );

    expect(primaryAction).toBeGreaterThan(-1);
    expect(manageAction).toBeGreaterThan(primaryAction);
    expect(manageButton).toBeGreaterThan(primaryAction);
    expect(manageButton).toBeLessThan(manageAction);
    expect(rendered.html.slice(manageButton, manageAction))
      .toContain("display:inline-block");
    expect(rendered.text).toContain(
      `Manage or unsubscribe from new-post emails: ${settingsUrl}`,
    );
  });
});
