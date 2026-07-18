import type { PublishablePost } from "./types.js";

const RESEND_UNSUBSCRIBE_URL = "{{{RESEND_UNSUBSCRIBE_URL}}}";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 180);
}

export function renderMagicLinkEmail(input: {
  link: string;
  expiresAt: Date;
  siteOrigin: string;
}) {
  const expiresAt = input.expiresAt.toISOString();
  const privacyUrl = new URL("/privacy", input.siteOrigin).toString();
  return {
    subject: "Manage Cumulus new-log notifications",
    html: [
      '<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Manage Cumulus notifications</title></head>',
      '<body lang="en" dir="ltr" style="margin:0;background:#000;color:#f5f5f5;font-family:\'Jacquard 12\',serif">',
      '<main lang="en" dir="ltr" style="max-width:640px;margin:0 auto;padding:48px 24px">',
      '<p style="color:#ff4d00;margin:0 0 20px">NOTIFICATION ACCESS</p>',
      '<h1 style="font-size:32px;font-weight:400;line-height:1.1;margin:0 0 20px">Confirm this email address</h1>',
      '<p style="color:#b7b7b7;font-size:18px;line-height:1.5;margin:0 0 28px">Open the link to manage optional email when a new public Cumulus log is published. Notifications remain off until you explicitly turn them on.</p>',
      `<p><a href="${escapeHtml(input.link)}" style="color:#ff4d00">Open notification settings</a></p>`,
      `<p style="color:#8f8f8f;font-size:13px;line-height:1.5;margin-top:44px">This link expires at ${escapeHtml(expiresAt)}. If you did not request it, ignore this message.</p>`,
      `<p style="color:#8f8f8f;font-size:13px;line-height:1.5"><a href="${escapeHtml(privacyUrl)}" style="color:#b7b7b7">Notification privacy and data rights</a></p>`,
      `<p style="margin:24px 0 0"><a href="${escapeHtml(input.link)}" style="border:1px solid #b7b7b7;color:#f5f5f5;display:inline-block;padding:12px 16px;text-decoration:none">Manage or unsubscribe from new-post emails</a></p>`,
      "</main></body></html>",
    ].join(""),
    text: [
      "Manage Cumulus new-log notifications",
      "",
      "Open this link to confirm the address and reach the final notification setting:",
      input.link,
      "",
      "Notifications remain off until you explicitly turn them on.",
      `This link expires at ${expiresAt}.`,
      `Privacy: ${privacyUrl}`,
      "",
      `Manage or unsubscribe from new-post emails: ${input.link}`,
    ].join("\n"),
  };
}

export function renderPostBroadcast(input: {
  post: PublishablePost;
  postUrl: string;
  postalAddress: string;
}) {
  const title = input.post.title.trim();
  const excerpt = input.post.excerpt.trim();
  return {
    subject: safeSubject(`New Cumulus log: ${title}`),
    previewText: excerpt.slice(0, 140),
    html: [
      `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>`,
      '<body lang="en" dir="ltr" style="margin:0;background:#000;color:#f5f5f5;font-family:\'Jacquard 12\',serif">',
      '<main lang="en" dir="ltr" style="max-width:640px;margin:0 auto;padding:48px 24px">',
      '<p style="color:#ff4d00;margin:0 0 20px">NEW LOG</p>',
      `<h1 style="font-size:32px;font-weight:400;line-height:1.1;margin:0 0 20px">${escapeHtml(title)}</h1>`,
      `<p style="color:#b7b7b7;font-size:18px;line-height:1.5;margin:0 0 28px">${escapeHtml(excerpt)}</p>`,
      `<p style="color:#777">${escapeHtml(input.post.date)}</p>`,
      `<p><a href="${escapeHtml(input.postUrl)}" style="color:#ff4d00">Read ${escapeHtml(title)}</a></p>`,
      '<p style="color:#8f8f8f;font-size:13px;line-height:1.5;margin:44px 0 14px">You receive this because you enabled new-log notifications.</p>',
      `<p style="margin:0 0 24px"><a href="${RESEND_UNSUBSCRIBE_URL}" style="border:1px solid #b7b7b7;color:#f5f5f5;display:inline-block;padding:12px 16px;text-decoration:none">Unsubscribe from new-post emails</a></p>`,
      `<p style="color:#8f8f8f;font-size:13px;line-height:1.5">Cumulus postal address: ${escapeHtml(input.postalAddress)}</p>`,
      "</main></body></html>",
    ].join(""),
    text: [
      `New Cumulus log: ${title}`,
      input.post.date,
      "",
      excerpt,
      "",
      `Read the log: ${input.postUrl}`,
      "",
      `Unsubscribe from new-post emails: ${RESEND_UNSUBSCRIBE_URL}`,
      "",
      `Cumulus postal address: ${input.postalAddress}`,
    ].join("\n"),
  };
}
