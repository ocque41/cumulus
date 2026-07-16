-- Authenticated Resend suppression events for new-post notifications.
--
-- Provider payloads and recipient addresses stay out of the public schema.
-- The server first verifies the Svix signature, maps the provider message ID
-- to a delivery, and compares the signed recipient with Supabase Auth before
-- invoking the atomic processor below.

create table public.blog_notification_webhook_events (
  provider_event_id text primary key,
  provider_message_id text not null,
  event_type text not null,
  disposition text not null,
  delivery_id uuid references public.blog_notification_deliveries (id)
    on delete set null,
  processed_at timestamptz not null default statement_timestamp(),
  constraint blog_notification_webhook_events_event_id_check
    check (provider_event_id ~ '^[A-Za-z0-9_-]{1,255}$'),
  constraint blog_notification_webhook_events_message_id_check
    check (provider_message_id ~ '^[A-Za-z0-9_-]{1,255}$'),
  constraint blog_notification_webhook_events_type_check
    check (event_type in ('email.bounced', 'email.complained', 'email.suppressed')),
  constraint blog_notification_webhook_events_disposition_check
    check (disposition in ('suppressed', 'ignored'))
);

comment on table public.blog_notification_webhook_events is
  'Server-only replay ledger for verified Resend suppression events. No recipient address or raw provider payload is stored.';

create index blog_notification_deliveries_provider_message_id_idx
  on public.blog_notification_deliveries (provider_message_id)
  where status = 'sent' and provider_message_id is not null;

create index blog_notification_webhook_events_delivery_id_idx
  on public.blog_notification_webhook_events (delivery_id)
  where delivery_id is not null;

create function public.find_blog_notification_delivery_owner(
  requested_provider_message_id text
)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select delivery.user_id
  from public.blog_notification_deliveries as delivery
  where delivery.status = 'sent'
    and delivery.provider_message_id = requested_provider_message_id
  order by delivery.sent_at desc
  limit 1
$$;

create function public.process_blog_notification_resend_event(
  requested_provider_event_id text,
  requested_provider_message_id text,
  requested_event_type text,
  requested_user_id uuid,
  requested_recipient_matches boolean
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  matched_delivery public.blog_notification_deliveries%rowtype;
  expected_consent_at timestamptz;
  inserted_count integer;
  resulting_disposition text;
begin
  if requested_provider_event_id !~ '^[A-Za-z0-9_-]{1,255}$'
     or requested_provider_message_id !~ '^[A-Za-z0-9_-]{1,255}$'
     or requested_event_type not in (
       'email.bounced',
       'email.complained',
       'email.suppressed'
     ) then
    raise exception 'invalid notification webhook event'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.blog_notification_webhook_events as event
    where event.provider_event_id = requested_provider_event_id
  ) then
    return 'duplicate';
  end if;

  select delivery.*
  into matched_delivery
  from public.blog_notification_deliveries as delivery
  where delivery.status = 'sent'
    and delivery.provider_message_id = requested_provider_message_id
    and delivery.user_id = requested_user_id
  order by delivery.sent_at desc
  limit 1
  for update;

  if not found then
    return 'unmatched';
  end if;

  resulting_disposition := case
    when requested_recipient_matches then 'suppressed'
    else 'ignored'
  end;

  insert into public.blog_notification_webhook_events (
    provider_event_id,
    provider_message_id,
    event_type,
    disposition,
    delivery_id
  ) values (
    requested_provider_event_id,
    requested_provider_message_id,
    requested_event_type,
    resulting_disposition,
    matched_delivery.id
  )
  on conflict (provider_event_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then
    return 'duplicate';
  end if;

  if resulting_disposition = 'ignored' then
    return resulting_disposition;
  end if;

  select subscription.confirmed_at
  into expected_consent_at
  from public.blog_notification_subscriptions as subscription
  where subscription.user_id = matched_delivery.user_id
  for update;

  if not found then
    return resulting_disposition;
  end if;

  update public.blog_notification_subscriptions
  set status = 'unsubscribed'
  where user_id = matched_delivery.user_id
    and status <> 'unsubscribed';

  update public.blog_notification_deliveries as delivery
  set status = 'cancelled'
  where delivery.user_id = matched_delivery.user_id
    and delivery.consent_confirmed_at = expected_consent_at
    and (
      delivery.status = 'retryable'
      or (
        delivery.status = 'processing'
        and delivery.provider_started_at is null
      )
    );

  return resulting_disposition;
end;
$$;

alter table public.blog_notification_webhook_events enable row level security;
alter table public.blog_notification_webhook_events force row level security;

create policy "No public access to notification webhook events"
on public.blog_notification_webhook_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

revoke all on table public.blog_notification_webhook_events
  from public, anon, authenticated, service_role;
grant select, insert on table public.blog_notification_webhook_events
  to service_role;

revoke all on function public.find_blog_notification_delivery_owner(text)
  from public, anon, authenticated;
revoke all on function public.process_blog_notification_resend_event(text, text, text, uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.find_blog_notification_delivery_owner(text)
  to service_role;
grant execute on function public.process_blog_notification_resend_event(text, text, text, uuid, boolean)
  to service_role;
