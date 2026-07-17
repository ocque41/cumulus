import type { NotificationEmail, PublishablePost } from "./types.js";

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

export function renderPostNotification(input: {
  post: PublishablePost;
  postUrl: string;
  browserUnsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  recipientEmail: string;
  idempotencyKey: string;
  postalAddress: string;
}): NotificationEmail {
  const title = input.post.title.trim();
  const excerpt = input.post.excerpt.trim();
  return {
    to: input.recipientEmail,
    subject: safeSubject(`New Cumulus log: ${title}`),
    html: [
      `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>`,
      '<body lang="en" dir="ltr" style="margin:0;background:#000;color:#f5f5f5;font-family:\'Jacquard 12\'">',
      '<main lang="en" dir="ltr" style="max-width:640px;margin:0 auto;padding:48px 24px">',
      '<p style="color:#ff4d00;margin:0 0 20px">NEW LOG</p>',
      `<h1 style="font-size:32px;font-weight:400;line-height:1.1;margin:0 0 20px">${escapeHtml(title)}</h1>`,
      `<p style="color:#b7b7b7;font-size:18px;line-height:1.5;margin:0 0 28px">${escapeHtml(excerpt)}</p>`,
      `<p style="color:#777">${escapeHtml(input.post.date)}</p>`,
      `<p><a href="${escapeHtml(input.postUrl)}" style="color:#ff4d00">Read ${escapeHtml(title)}</a></p>`,
      `<p style="color:#8f8f8f;font-size:13px;line-height:1.5;margin-top:44px">You receive this because you enabled new-post notifications. <a href="${escapeHtml(input.browserUnsubscribeUrl)}" style="color:#b7b7b7">Unsubscribe from Cumulus log emails</a>.</p>`,
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
      `Unsubscribe: ${input.browserUnsubscribeUrl}`,
      "",
      `Cumulus postal address: ${input.postalAddress}`,
    ].join("\n"),
    browserUnsubscribeUrl: input.browserUnsubscribeUrl,
    oneClickUnsubscribeUrl: input.oneClickUnsubscribeUrl,
    idempotencyKey: input.idempotencyKey,
  };
}
