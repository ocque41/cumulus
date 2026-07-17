import { createHash } from "node:crypto";
import { Resend, type ErrorResponse } from "resend";

import { renderMagicLinkEmail, renderPostBroadcast } from "./render.js";
import { broadcastIdempotencyKey } from "./security.js";
import type {
  BroadcastPublicationResult,
  NotificationPreferenceStatus,
  NotificationProvider,
  PublishablePost,
} from "./types.js";

export class NotificationProviderError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly statusCode: number | null;

  constructor(code: string, error?: ErrorResponse) {
    super(code);
    this.name = "NotificationProviderError";
    this.code = code;
    this.statusCode = error?.statusCode ?? null;
    this.retryable = Boolean(
      error
      && error.name !== "invalid_idempotency_key"
      && error.name !== "invalid_idempotent_request"
      && error.name !== "daily_quota_exceeded"
      && error.name !== "monthly_quota_exceeded"
      && (
        error.name === "concurrent_idempotent_requests"
        || error.name === "rate_limit_exceeded"
        || error.name === "internal_server_error"
        || error.statusCode === 408
        || error.statusCode === 425
        || error.statusCode === 429
        || (error.statusCode !== null && error.statusCode >= 500)
      ),
    );
  }
}

interface ResendMagicLinkSenderOptions {
  apiKey: string;
  fromEmail: string;
  siteOrigin: string;
  resend?: Resend;
}

interface ResendNotificationProviderOptions
  extends ResendMagicLinkSenderOptions {
  segmentId: string;
  topicId: string;
}

function contactIdempotencyKey(email: string): string {
  const hash = createHash("sha256").update(email, "utf8").digest("hex");
  return `cumulus-contact-${hash}`;
}

function isNotFound(error: ErrorResponse): boolean {
  return error.name === "not_found" || error.statusCode === 404;
}

export class ResendMagicLinkSender {
  protected readonly resend: Resend;
  protected readonly fromEmail: string;
  protected readonly siteOrigin: string;

  constructor(options: ResendMagicLinkSenderOptions) {
    this.resend = options.resend ?? new Resend(options.apiKey);
    this.fromEmail = options.fromEmail;
    this.siteOrigin = options.siteOrigin;
  }

  async sendMagicLink(input: {
    email: string;
    link: string;
    idempotencyKey: string;
    expiresAt: Date;
  }): Promise<void> {
    const rendered = renderMagicLinkEmail({
      link: input.link,
      expiresAt: input.expiresAt,
      siteOrigin: this.siteOrigin,
    });
    let result;
    try {
      result = await this.resend.emails.send(
        {
          from: this.fromEmail,
          to: [input.email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: [{ name: "category", value: "cumulus_notification_access" }],
        },
        { idempotencyKey: input.idempotencyKey },
      );
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (result.error) {
      throw new NotificationProviderError("resend_magic_link_failed", result.error);
    }
  }
}

export class ResendNotificationProvider
  extends ResendMagicLinkSender
  implements NotificationProvider {
  private readonly segmentId: string;
  private readonly topicId: string;

  constructor(options: ResendNotificationProviderOptions) {
    super(options);
    this.segmentId = options.segmentId;
    this.topicId = options.topicId;
  }

  private async getContact(email: string) {
    let result;
    try {
      result = await this.resend.contacts.get({ email });
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (result.error) {
      if (isNotFound(result.error)) return null;
      throw new NotificationProviderError("resend_contact_read_failed", result.error);
    }
    return result.data;
  }

  private async contactHasSegment(email: string): Promise<boolean> {
    let after: string | undefined;
    for (let page = 0; page < 100; page += 1) {
      const options = after
        ? { email, limit: 100, after }
        : { email, limit: 100 };
      let result;
      try {
        result = await this.resend.contacts.segments.list(options);
      } catch {
        throw new NotificationProviderError("resend_network_error");
      }
      if (result.error) {
        if (isNotFound(result.error)) return false;
        throw new NotificationProviderError(
          "resend_contact_segments_failed",
          result.error,
        );
      }
      if (result.data.data.some((segment) => segment.id === this.segmentId)) {
        return true;
      }
      if (!result.data.has_more) return false;
      after = result.data.data.at(-1)?.id;
      if (!after) break;
    }
    throw new NotificationProviderError("resend_contact_segments_incomplete");
  }

  private async readTopicStatus(
    email: string,
  ): Promise<NotificationPreferenceStatus> {
    let after: string | undefined;
    for (let page = 0; page < 100; page += 1) {
      const options = after
        ? { email, limit: 100, after }
        : { email, limit: 100 };
      let result;
      try {
        result = await this.resend.contacts.topics.list(options);
      } catch {
        throw new NotificationProviderError("resend_network_error");
      }
      if (result.error) {
        if (isNotFound(result.error)) return "unsubscribed";
        throw new NotificationProviderError(
          "resend_contact_topics_failed",
          result.error,
        );
      }
      const topic = result.data.data.find((item) => item.id === this.topicId);
      if (topic) return topic.subscription === "opt_in" ? "active" : "unsubscribed";
      if (!result.data.has_more) return "unsubscribed";
      after = result.data.data.at(-1)?.id;
      if (!after) break;
    }
    throw new NotificationProviderError("resend_contact_topics_incomplete");
  }

  async getPreference(email: string): Promise<NotificationPreferenceStatus> {
    const contact = await this.getContact(email);
    if (!contact || contact.unsubscribed) return "unsubscribed";
    if (!(await this.contactHasSegment(email))) return "unsubscribed";
    return this.readTopicStatus(email);
  }

  private async addContact(email: string): Promise<void> {
    let result;
    try {
      result = await this.resend.contacts.create(
        {
          email,
          unsubscribed: false,
          segments: [{ id: this.segmentId }],
          topics: [{ id: this.topicId, subscription: "opt_in" }],
        },
        { headers: { "Idempotency-Key": contactIdempotencyKey(email) } },
      );
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (
      result.error
      && result.error.name !== "concurrent_idempotent_requests"
    ) {
      throw new NotificationProviderError("resend_contact_create_failed", result.error);
    }
  }

  private async updateTopic(
    email: string,
    subscription: "opt_in" | "opt_out",
  ): Promise<void> {
    let result;
    try {
      result = await this.resend.contacts.topics.update({
        email,
        topics: [{ id: this.topicId, subscription }],
      });
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (result.error) {
      throw new NotificationProviderError("resend_contact_update_failed", result.error);
    }
  }

  async setPreference(
    email: string,
    status: NotificationPreferenceStatus,
  ): Promise<NotificationPreferenceStatus> {
    const contact = await this.getContact(email);
    if (status === "unsubscribed") {
      if (contact && await this.contactHasSegment(email)) {
        await this.updateTopic(email, "opt_out");
      }
      return "unsubscribed";
    }

    if (!contact) {
      await this.addContact(email);
      const created = await this.getContact(email);
      if (!created) {
        throw new NotificationProviderError("resend_contact_create_unconfirmed");
      }
    } else {
      let update;
      try {
        update = await this.resend.contacts.update({
          email,
          unsubscribed: false,
        });
      } catch {
        throw new NotificationProviderError("resend_network_error");
      }
      if (update.error) {
        throw new NotificationProviderError(
          "resend_contact_update_failed",
          update.error,
        );
      }
      if (!(await this.contactHasSegment(email))) {
        let segment;
        try {
          segment = await this.resend.contacts.segments.add({
            email,
            segmentId: this.segmentId,
          });
        } catch {
          throw new NotificationProviderError("resend_network_error");
        }
        if (segment.error) {
          throw new NotificationProviderError(
            "resend_contact_segment_add_failed",
            segment.error,
          );
        }
      }
      await this.updateTopic(email, "opt_in");
    }

    return "active";
  }

  private async verifyResources(): Promise<void> {
    const [segment, topic] = await Promise.all([
      this.resend.segments.get(this.segmentId),
      this.resend.topics.get(this.topicId),
    ]).catch(() => {
      throw new NotificationProviderError("resend_network_error");
    });
    if (segment.error) {
      throw new NotificationProviderError("resend_segment_invalid", segment.error);
    }
    if (topic.error) {
      throw new NotificationProviderError("resend_topic_invalid", topic.error);
    }
    if (topic.data.default_subscription !== "opt_out") {
      throw new NotificationProviderError("resend_topic_must_default_opt_out");
    }
  }

  private async findBroadcast(name: string) {
    let after: string | undefined;
    for (let page = 0; page < 100; page += 1) {
      const options = after ? { limit: 100, after } : { limit: 100 };
      let result;
      try {
        result = await this.resend.broadcasts.list(options);
      } catch {
        throw new NotificationProviderError("resend_network_error");
      }
      if (result.error) {
        throw new NotificationProviderError("resend_broadcast_list_failed", result.error);
      }
      const match = result.data.data.find((broadcast) => broadcast.name === name);
      if (match) return match;
      if (!result.data.has_more) return null;
      after = result.data.data.at(-1)?.id;
      if (!after) break;
    }
    throw new NotificationProviderError("resend_broadcast_search_incomplete");
  }

  private async sendDraft(id: string): Promise<void> {
    let result;
    try {
      result = await this.resend.broadcasts.send(id);
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (!result.error) return;

    let current;
    try {
      current = await this.resend.broadcasts.get(id);
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (!current.error && current.data.status !== "draft") return;
    throw new NotificationProviderError("resend_broadcast_send_failed", result.error);
  }

  async publishPost(input: {
    post: PublishablePost;
    siteOrigin: string;
    postalAddress: string;
    dryRun: boolean;
  }): Promise<BroadcastPublicationResult> {
    await this.verifyResources();
    if (input.dryRun) return { status: "dry_run" };

    const name = `cumulus-post-v1:${input.post.slug}`;
    const postUrl = new URL(
      `/logs/${encodeURIComponent(input.post.slug)}`,
      input.siteOrigin,
    ).toString();
    const rendered = renderPostBroadcast({
      post: input.post,
      postUrl,
      postalAddress: input.postalAddress,
    });
    const existing = await this.findBroadcast(name);
    if (existing) {
      const full = await this.resend.broadcasts.get(existing.id).catch(() => {
        throw new NotificationProviderError("resend_network_error");
      });
      if (full.error) {
        throw new NotificationProviderError("resend_broadcast_read_failed", full.error);
      }
      if (
        full.data.segment_id !== this.segmentId
        || full.data.topic_id !== this.topicId
        || full.data.from !== this.fromEmail
        || full.data.subject !== rendered.subject
        || full.data.html !== rendered.html
        || full.data.text !== rendered.text
      ) {
        throw new NotificationProviderError("resend_broadcast_content_conflict");
      }
      if (full.data.status === "draft") {
        await this.sendDraft(full.data.id);
        return { status: "created" };
      }
      return { status: "already_sent" };
    }

    let created;
    try {
      created = await this.resend.broadcasts.create(
        {
          name,
          segmentId: this.segmentId,
          topicId: this.topicId,
          from: this.fromEmail,
          subject: rendered.subject,
          previewText: rendered.previewText,
          html: rendered.html,
          text: rendered.text,
        },
        {
          headers: {
            "Idempotency-Key": broadcastIdempotencyKey(input.post.slug),
          },
        },
      );
    } catch {
      throw new NotificationProviderError("resend_network_error");
    }
    if (created.error) {
      const recovered = await this.findBroadcast(name);
      if (recovered) {
        if (recovered.status === "draft") await this.sendDraft(recovered.id);
        return { status: recovered.status === "draft" ? "created" : "already_sent" };
      }
      throw new NotificationProviderError("resend_broadcast_create_failed", created.error);
    }
    await this.sendDraft(created.data.id);
    return { status: "created" };
  }

  async suppressContact(email: string): Promise<"suppressed" | "ignored"> {
    const contact = await this.getContact(email);
    if (!contact || !(await this.contactHasSegment(email))) return "ignored";
    await this.updateTopic(email, "opt_out");
    return "suppressed";
  }
}
