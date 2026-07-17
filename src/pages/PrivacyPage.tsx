import { AppLink, useDocumentMeta } from "@/lib/router";

export function PrivacyPage() {
  useDocumentMeta(
    "Notification privacy — Cumulus lab",
    "How Cumulus handles the email identity and minimal delivery records used for optional new-log notifications.",
  );

  return (
    <article className="privacy-page page-shell">
      <header className="privacy-page__hero">
        <p className="eyebrow">Cumulus lab / reader data</p>
        <h1>Notification privacy</h1>
        <p>
          Reading Cumulus is public and does not require an account. Email identity exists
          only so a reader can deliberately enable and manage new-log notifications.
        </p>
      </header>

      <div className="privacy-page__sections">
        <section>
          <p className="eyebrow">01 / Data</p>
          <h2>What the notification flow handles</h2>
          <p>
            Supabase Auth stores the confirmed email address and notification session.
            Cumulus stores an opaque Auth user ID, consent version and time, subscription
            state, and the minimal delivery, retry, unsubscribe, and suppression records
            needed to send safely. It does not create a public profile or copy the address
            into the public notification tables.
          </p>
        </section>

        <section>
          <p className="eyebrow">02 / Purpose</p>
          <h2>How it is used</h2>
          <p>
            The address is used only for sign-in links and notifications for newly
            published Cumulus logs after explicit opt-in. Supabase provides authentication
            and notification storage, Resend provides email delivery and suppression events,
            and Vercel runs the public application and server functions. Cumulus does not
            sell the address or use it for advertising profiles.
          </p>
        </section>

        <section>
          <p className="eyebrow">03 / Control</p>
          <h2>Withdrawal, correction, and deletion</h2>
          <p>
            Every notification includes an unsubscribe action. Unsubscribing stops future
            Cumulus log email and cancels queued work, but it is not the same as deleting the
            underlying authentication and delivery records. To request access, correct an
            address, or delete notification data, email{" "}
            <a href="mailto:hi@cumulush.com">hi@cumulush.com</a> from the affected address.
            Cumulus verifies control of the mailbox before changing or deleting private data.
          </p>
        </section>

        <section>
          <p className="eyebrow">04 / Retention</p>
          <h2>What remains after unsubscribe</h2>
          <p>
            Active identity and consent records remain while notifications are enabled.
            After unsubscribe, the minimum subscription, delivery, and suppression metadata
            remains so the opt-out can be honored, duplicate sends can be prevented, and
            delivery problems can be investigated. Cumulus does not promise an automatic
            expiry that the current system cannot enforce. A verified deletion request is
            the way to remove Cumulus-held notification data; provider records and protected
            backups then age out under their configured operational retention.
          </p>
        </section>

        <section>
          <p className="eyebrow">05 / Boundaries</p>
          <h2>Important distinctions</h2>
          <p>
            Signing out ends the browser session but does not unsubscribe. Unsubscribing
            stops future sends but does not itself erase records. Public logs remain readable
            in every state. This page describes the narrow Cumulus notification system; it is
            not a general account or social identity service.
          </p>
        </section>
      </div>

      <footer className="privacy-page__footer">
        <p>
          Questions or verified data requests: <a href="mailto:hi@cumulush.com">hi@cumulush.com</a>
        </p>
        <AppLink className="text-link" href="/logs">Return to the public logs</AppLink>
      </footer>
    </article>
  );
}
