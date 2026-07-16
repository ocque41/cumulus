-- New-post notification consent and delivery state.
--
-- Email remains authoritative in Supabase Auth. These public tables contain
-- only auth user IDs and operational state; they never copy an email address.

create table public.blog_notification_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'pending',
  consent_version text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint blog_notification_subscriptions_status_check
    check (status in ('pending', 'active', 'unsubscribed')),
  constraint blog_notification_subscriptions_lifecycle_check
    check (
      (
        status = 'pending'
        and consent_version is null
        and confirmed_at is null
        and unsubscribed_at is null
      )
      or (
        status = 'active'
        and consent_version = 'new-post-email-v1'
        and confirmed_at is not null
        and unsubscribed_at is null
      )
      or (
        status = 'unsubscribed'
        and unsubscribed_at is not null
      )
    )
);

comment on table public.blog_notification_subscriptions is
  'User-owned new-post consent. Recipient email stays authoritative in auth.users.';
comment on column public.blog_notification_subscriptions.confirmed_at is
  'Database-stamped time of the latest explicit activation.';
comment on column public.blog_notification_subscriptions.consent_version is
  'Database-stamped identifier for the disclosure accepted at activation.';

create index blog_notification_subscriptions_active_idx
  on public.blog_notification_subscriptions (user_id, confirmed_at)
  where status = 'active'
    and confirmed_at is not null
    and unsubscribed_at is null;

create table public.blog_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  content_hash text not null,
  consent_confirmed_at timestamptz not null,
  consent_version text not null,
  provider_idempotency_key text not null,
  status text not null default 'processing',
  attempt_count integer not null default 1,
  lease_token uuid,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  retry_deadline_at timestamptz not null,
  unsubscribe_token_expires_at timestamptz not null,
  provider_started_at timestamptz,
  provider_message_id text,
  failure_code text,
  claimed_at timestamptz not null default statement_timestamp(),
  last_attempt_at timestamptz not null default statement_timestamp(),
  sent_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint blog_notification_deliveries_post_slug_check
    check (
      char_length(post_slug) between 1 and 160
      and post_slug = lower(post_slug)
      and post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  constraint blog_notification_deliveries_content_hash_check
    check (content_hash ~ '^[a-f0-9]{64}$'),
  constraint blog_notification_deliveries_consent_version_check
    check (consent_version = 'new-post-email-v1'),
  constraint blog_notification_deliveries_idempotency_key_check
    check (provider_idempotency_key ~ '^blog-notification-[a-f0-9]{64}$'),
  constraint blog_notification_deliveries_status_check
    check (status in ('processing', 'retryable', 'sent', 'failed', 'cancelled')),
  constraint blog_notification_deliveries_attempt_count_check
    check (attempt_count between 1 and 5),
  constraint blog_notification_deliveries_retry_window_check
    check (
      retry_deadline_at > claimed_at
      and unsubscribe_token_expires_at > retry_deadline_at
      and last_attempt_at >= claimed_at
    ),
  constraint blog_notification_deliveries_provider_message_id_check
    check (
      provider_message_id is null
      or char_length(provider_message_id) between 1 and 255
    ),
  constraint blog_notification_deliveries_failure_code_check
    check (failure_code is null or failure_code ~ '^[a-z0-9_]{1,64}$'),
  constraint blog_notification_deliveries_lifecycle_check
    check (
      (
        status = 'processing'
        and lease_token is not null
        and lease_expires_at is not null
        and next_attempt_at is null
        and provider_message_id is null
        and failure_code is null
        and sent_at is null
        and failed_at is null
        and cancelled_at is null
      )
      or (
        status = 'retryable'
        and lease_token is null
        and lease_expires_at is null
        and next_attempt_at is not null
        and provider_started_at is null
        and provider_message_id is null
        and failure_code is not null
        and sent_at is null
        and failed_at is null
        and cancelled_at is null
      )
      or (
        status = 'sent'
        and lease_token is null
        and lease_expires_at is null
        and next_attempt_at is null
        and provider_started_at is not null
        and provider_message_id is not null
        and failure_code is null
        and sent_at is not null
        and failed_at is null
        and cancelled_at is null
      )
      or (
        status = 'failed'
        and lease_token is null
        and lease_expires_at is null
        and next_attempt_at is null
        and provider_message_id is null
        and failure_code is not null
        and sent_at is null
        and failed_at is not null
        and cancelled_at is null
      )
      or (
        status = 'cancelled'
        and lease_token is null
        and lease_expires_at is null
        and next_attempt_at is null
        and provider_started_at is null
        and provider_message_id is null
        and failure_code is null
        and sent_at is null
        and failed_at is null
        and cancelled_at is not null
      )
    ),
  constraint blog_notification_deliveries_post_user_key unique (post_slug, user_id)
);

comment on table public.blog_notification_deliveries is
  'Server-only post/user delivery ledger with bounded leases and retry attempts.';
comment on column public.blog_notification_deliveries.failure_code is
  'Bounded machine code only. Never store recipient data or provider response bodies.';
comment on column public.blog_notification_deliveries.content_hash is
  'SHA-256 fingerprint of the complete provider payload identity; no raw address is stored.';

create table public.blog_notification_dispatch_gate (
  singleton boolean primary key default true check (singleton),
  next_available_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

insert into public.blog_notification_dispatch_gate (singleton) values (true);

comment on table public.blog_notification_dispatch_gate is
  'Server-only durable reservation gate enforcing one provider start per 550 milliseconds.';

create index blog_notification_deliveries_work_idx
  on public.blog_notification_deliveries (status, next_attempt_at, lease_expires_at)
  where status in ('processing', 'retryable');

create function public.set_blog_notification_subscription_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = statement_timestamp();
  else
    if new.user_id is distinct from old.user_id then
      raise exception 'notification subscription identity is immutable'
        using errcode = '23514';
    end if;
    new.user_id = old.user_id;
    new.created_at = old.created_at;

    if new.status is distinct from old.status
       and not (
         (old.status = 'pending' and new.status in ('active', 'unsubscribed'))
         or (old.status = 'active' and new.status = 'unsubscribed')
         or (old.status = 'unsubscribed' and new.status = 'active')
       ) then
      raise exception 'invalid notification subscription transition'
        using errcode = '23514';
    end if;

    if new.status is not distinct from old.status then
      new.confirmed_at = old.confirmed_at;
      new.consent_version = old.consent_version;
      new.unsubscribed_at = old.unsubscribed_at;
      new.updated_at = statement_timestamp();
      return new;
    end if;
  end if;

  new.updated_at = statement_timestamp();

  if new.status = 'pending' then
    new.consent_version = null;
    new.confirmed_at = null;
    new.unsubscribed_at = null;
  elsif new.status = 'active' then
    new.consent_version = 'new-post-email-v1';
    new.confirmed_at = statement_timestamp();
    new.unsubscribed_at = null;
  elsif new.status = 'unsubscribed' then
    if tg_op = 'INSERT' then
      new.consent_version = null;
      new.confirmed_at = null;
    else
      new.consent_version = old.consent_version;
      new.confirmed_at = old.confirmed_at;
    end if;
    new.unsubscribed_at = statement_timestamp();
  end if;

  return new;
end;
$$;

create function public.enforce_blog_notification_delivery_lifecycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.post_slug is distinct from old.post_slug
     or new.user_id is distinct from old.user_id
     or new.content_hash is distinct from old.content_hash
     or new.consent_confirmed_at is distinct from old.consent_confirmed_at
     or new.consent_version is distinct from old.consent_version
     or new.provider_idempotency_key is distinct from old.provider_idempotency_key
     or new.claimed_at is distinct from old.claimed_at
     or new.retry_deadline_at is distinct from old.retry_deadline_at
     or new.unsubscribe_token_expires_at is distinct from old.unsubscribe_token_expires_at
     or new.created_at is distinct from old.created_at then
    raise exception 'notification delivery identity is immutable'
      using errcode = '23514';
  end if;

  new.updated_at = statement_timestamp();

  if new.status = old.status then
    if old.status <> 'processing' then
      raise exception 'terminal notification delivery is immutable'
        using errcode = '23514';
    end if;

    if old.provider_started_at is null
       and new.lease_token is not distinct from old.lease_token
       and new.provider_started_at is not null then
      new.provider_started_at = statement_timestamp();
      new.lease_expires_at = old.lease_expires_at;
      new.attempt_count = old.attempt_count;
      new.last_attempt_at = old.last_attempt_at;
      return new;
    end if;

    if old.lease_expires_at <= statement_timestamp()
       and new.lease_token is distinct from old.lease_token
       and new.attempt_count = old.attempt_count + 1
       and new.lease_expires_at > statement_timestamp()
       and new.lease_expires_at < old.retry_deadline_at then
      new.provider_started_at = null;
      new.failure_code = null;
      new.next_attempt_at = null;
      new.provider_message_id = null;
      new.sent_at = null;
      new.failed_at = null;
      new.cancelled_at = null;
      new.last_attempt_at = statement_timestamp();
      return new;
    end if;

    raise exception 'invalid notification delivery processing update'
      using errcode = '23514';
  end if;

  if old.status = 'processing' and new.status = 'sent' then
    if old.provider_started_at is null or new.provider_message_id is null then
      raise exception 'provider attempt is required before sent'
        using errcode = '23514';
    end if;
    new.provider_started_at = old.provider_started_at;
    new.lease_token = null;
    new.lease_expires_at = null;
    new.next_attempt_at = null;
    new.failure_code = null;
    new.sent_at = statement_timestamp();
    new.failed_at = null;
    new.cancelled_at = null;
    return new;
  end if;

  if old.status = 'processing' and new.status = 'retryable' then
    if new.failure_code is null
       or new.next_attempt_at is null
       or new.next_attempt_at <= statement_timestamp()
       or new.next_attempt_at >= old.retry_deadline_at then
      raise exception 'invalid retryable notification delivery'
        using errcode = '23514';
    end if;
    new.provider_started_at = null;
    new.provider_message_id = null;
    new.lease_token = null;
    new.lease_expires_at = null;
    new.sent_at = null;
    new.failed_at = null;
    new.cancelled_at = null;
    return new;
  end if;

  if old.status in ('processing', 'retryable') and new.status = 'failed' then
    if new.failure_code is null then
      raise exception 'failure code is required'
        using errcode = '23514';
    end if;
    new.provider_message_id = null;
    new.lease_token = null;
    new.lease_expires_at = null;
    new.next_attempt_at = null;
    new.sent_at = null;
    new.failed_at = statement_timestamp();
    new.cancelled_at = null;
    return new;
  end if;

  if old.status in ('processing', 'retryable') and new.status = 'cancelled' then
    if old.status = 'processing' and old.provider_started_at is not null then
      raise exception 'provider-started notification cannot be cancelled'
        using errcode = '23514';
    end if;
    new.provider_started_at = null;
    new.provider_message_id = null;
    new.failure_code = null;
    new.lease_token = null;
    new.lease_expires_at = null;
    new.next_attempt_at = null;
    new.sent_at = null;
    new.failed_at = null;
    new.cancelled_at = statement_timestamp();
    return new;
  end if;

  if old.status = 'retryable' and new.status = 'processing' then
    if old.next_attempt_at > statement_timestamp()
       or new.lease_token is null
       or new.lease_expires_at <= statement_timestamp()
       or new.lease_expires_at >= old.retry_deadline_at
       or new.attempt_count <> old.attempt_count + 1 then
      raise exception 'invalid notification retry claim'
        using errcode = '23514';
    end if;
    new.provider_started_at = null;
    new.provider_message_id = null;
    new.failure_code = null;
    new.next_attempt_at = null;
    new.sent_at = null;
    new.failed_at = null;
    new.cancelled_at = null;
    new.last_attempt_at = statement_timestamp();
    return new;
  end if;

  raise exception 'invalid notification delivery transition'
    using errcode = '23514';
end;
$$;

create function public.claim_blog_notification_delivery(
  requested_post_slug text,
  requested_user_id uuid,
  requested_content_hash text,
  requested_provider_idempotency_key text
)
returns table (
  disposition text,
  delivery_id uuid,
  delivery_lease_token uuid,
  delivery_attempt_count integer,
  token_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  active_consent_at timestamptz;
  active_consent_version text;
  current_delivery public.blog_notification_deliveries%rowtype;
  new_lease_token uuid;
  now_at timestamptz := statement_timestamp();
begin
  select confirmed_at, consent_version
  into active_consent_at, active_consent_version
  from public.blog_notification_subscriptions
  where user_id = requested_user_id
    and status = 'active'
    and confirmed_at is not null
    and unsubscribed_at is null
  for update;

  if active_consent_at is null or active_consent_version is null then
    return query select 'inactive'::text, null::uuid, null::uuid, 0, null::timestamptz;
    return;
  end if;

  new_lease_token := gen_random_uuid();

  insert into public.blog_notification_deliveries (
    post_slug,
    user_id,
    content_hash,
    consent_confirmed_at,
    consent_version,
    provider_idempotency_key,
    status,
    attempt_count,
    lease_token,
    lease_expires_at,
    retry_deadline_at,
    unsubscribe_token_expires_at,
    claimed_at,
    last_attempt_at
  )
  values (
    requested_post_slug,
    requested_user_id,
    requested_content_hash,
    active_consent_at,
    active_consent_version,
    requested_provider_idempotency_key,
    'processing',
    1,
    new_lease_token,
    now_at + interval '10 minutes',
    now_at + interval '23 hours',
    now_at + interval '180 days',
    now_at,
    now_at
  )
  on conflict (post_slug, user_id) do nothing
  returning * into current_delivery;

  if found then
    return query select
      'claimed'::text,
      current_delivery.id,
      current_delivery.lease_token,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  select *
  into current_delivery
  from public.blog_notification_deliveries
  where post_slug = requested_post_slug
    and user_id = requested_user_id
  for update;

  if current_delivery.content_hash <> requested_content_hash
     or current_delivery.provider_idempotency_key <> requested_provider_idempotency_key then
    return query select
      'content_mismatch'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.status = 'sent' then
    return query select
      'sent'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.status in ('failed', 'cancelled') then
    return query select
      'terminal'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.consent_confirmed_at <> active_consent_at
     or current_delivery.consent_version <> active_consent_version then
    if current_delivery.status = 'processing'
       and current_delivery.provider_started_at is not null then
      update public.blog_notification_deliveries
      set
        status = 'failed',
        failure_code = 'consent_changed_after_attempt'
      where id = current_delivery.id;
    else
      update public.blog_notification_deliveries
      set status = 'cancelled'
      where id = current_delivery.id;
    end if;

    return query select
      'terminal'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.status = 'processing'
     and current_delivery.lease_expires_at > now_at then
    return query select
      'in_progress'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.status = 'retryable'
     and current_delivery.next_attempt_at > now_at then
    return query select
      'retry_later'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  if current_delivery.attempt_count >= 5
     or now_at + interval '10 minutes' >= current_delivery.retry_deadline_at then
    update public.blog_notification_deliveries
    set
      status = 'failed',
      failure_code = 'retry_window_exhausted'
    where id = current_delivery.id;

    return query select
      'terminal'::text,
      current_delivery.id,
      null::uuid,
      current_delivery.attempt_count,
      current_delivery.unsubscribe_token_expires_at;
    return;
  end if;

  new_lease_token := gen_random_uuid();

  update public.blog_notification_deliveries
  set
    status = 'processing',
    attempt_count = current_delivery.attempt_count + 1,
    lease_token = new_lease_token,
    lease_expires_at = now_at + interval '10 minutes',
    provider_started_at = null,
    failure_code = null,
    next_attempt_at = null,
    last_attempt_at = now_at
  where id = current_delivery.id
  returning * into current_delivery;

  return query select
    'claimed'::text,
    current_delivery.id,
    current_delivery.lease_token,
    current_delivery.attempt_count,
    current_delivery.unsubscribe_token_expires_at;
end;
$$;

create function public.start_blog_notification_provider_attempt(
  requested_delivery_id uuid,
  requested_lease_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  update public.blog_notification_deliveries as delivery
  set provider_started_at = statement_timestamp()
  where delivery.id = requested_delivery_id
    and delivery.status = 'processing'
    and delivery.lease_token = requested_lease_token
    and delivery.lease_expires_at > statement_timestamp()
    and delivery.provider_started_at is null
    and exists (
      select 1
      from public.blog_notification_subscriptions as subscription
      where subscription.user_id = delivery.user_id
        and subscription.status = 'active'
        and subscription.confirmed_at = delivery.consent_confirmed_at
        and subscription.consent_version = delivery.consent_version
        and subscription.unsubscribed_at is null
    )
  returning delivery.id into updated_id;

  return updated_id is not null;
end;
$$;

create function public.reserve_blog_notification_dispatch_slot(
  requested_delivery_id uuid,
  requested_lease_token uuid
)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  reserved_at timestamptz;
  now_at timestamptz := statement_timestamp();
begin
  if not exists (
    select 1
    from public.blog_notification_deliveries as delivery
    where delivery.id = requested_delivery_id
      and delivery.status = 'processing'
      and delivery.lease_token = requested_lease_token
      and delivery.lease_expires_at > now_at
      and delivery.provider_started_at is null
  ) then
    return null;
  end if;

  select greatest(gate.next_available_at, now_at)
  into reserved_at
  from public.blog_notification_dispatch_gate as gate
  where gate.singleton
  for update;

  update public.blog_notification_dispatch_gate
  set
    next_available_at = reserved_at + interval '550 milliseconds',
    updated_at = now_at
  where singleton;

  return reserved_at;
end;
$$;

create function public.complete_blog_notification_delivery(
  requested_delivery_id uuid,
  requested_lease_token uuid,
  requested_provider_message_id text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  update public.blog_notification_deliveries as delivery
  set
    status = 'sent',
    provider_message_id = requested_provider_message_id
  where delivery.id = requested_delivery_id
    and delivery.status = 'processing'
    and delivery.lease_token = requested_lease_token
    and delivery.provider_started_at is not null
  returning delivery.id into updated_id;

  return updated_id is not null;
end;
$$;

create function public.record_blog_notification_delivery_failure(
  requested_delivery_id uuid,
  requested_lease_token uuid,
  requested_failure_code text,
  requested_retryable boolean,
  requested_retry_after_seconds integer
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resulting_status text;
  now_at timestamptz := statement_timestamp();
  retry_seconds integer := greatest(30, least(3600, requested_retry_after_seconds));
begin
  update public.blog_notification_deliveries as delivery
  set
    status = case
      when requested_retryable
        and delivery.attempt_count < 5
        and now_at + make_interval(secs => retry_seconds) < delivery.retry_deadline_at
        then 'retryable'
      else 'failed'
    end,
    failure_code = requested_failure_code,
    next_attempt_at = case
      when requested_retryable
        and delivery.attempt_count < 5
        and now_at + make_interval(secs => retry_seconds) < delivery.retry_deadline_at
        then now_at + make_interval(secs => retry_seconds)
      else null
    end
  where delivery.id = requested_delivery_id
    and delivery.status = 'processing'
    and delivery.lease_token = requested_lease_token
  returning delivery.status into resulting_status;

  return resulting_status;
end;
$$;

create function public.cancel_blog_notification_delivery(
  requested_delivery_id uuid,
  requested_lease_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_id uuid;
begin
  update public.blog_notification_deliveries as delivery
  set status = 'cancelled'
  where delivery.id = requested_delivery_id
    and delivery.status = 'processing'
    and delivery.lease_token = requested_lease_token
    and delivery.provider_started_at is null
  returning delivery.id into updated_id;

  return updated_id is not null;
end;
$$;

create function public.unsubscribe_blog_notifications(
  requested_user_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cancelled_count integer;
  expected_consent_at timestamptz;
begin
  select subscription.confirmed_at
  into expected_consent_at
  from public.blog_notification_subscriptions as subscription
  where subscription.user_id = requested_user_id
  for update;

  if not found then
    return 0;
  end if;

  update public.blog_notification_subscriptions
  set status = 'unsubscribed'
  where user_id = requested_user_id;

  with cancelled as (
    update public.blog_notification_deliveries as delivery
    set status = 'cancelled'
    where delivery.user_id = requested_user_id
      and delivery.consent_confirmed_at = expected_consent_at
      and exists (
        select 1
        from public.blog_notification_subscriptions as subscription
        where subscription.user_id = requested_user_id
          and subscription.status = 'unsubscribed'
          and subscription.confirmed_at is not distinct from expected_consent_at
      )
      and (
        delivery.status = 'retryable'
        or (
          delivery.status = 'processing'
          and delivery.provider_started_at is null
        )
      )
    returning 1
  )
  select count(*)::integer into cancelled_count from cancelled;

  return cancelled_count;
end;
$$;

create trigger set_blog_notification_subscription_lifecycle
before insert or update on public.blog_notification_subscriptions
for each row execute function public.set_blog_notification_subscription_lifecycle();

create trigger enforce_blog_notification_delivery_lifecycle
before update on public.blog_notification_deliveries
for each row execute function public.enforce_blog_notification_delivery_lifecycle();

alter table public.blog_notification_subscriptions enable row level security;
alter table public.blog_notification_subscriptions force row level security;
alter table public.blog_notification_deliveries enable row level security;
alter table public.blog_notification_deliveries force row level security;
alter table public.blog_notification_dispatch_gate enable row level security;
alter table public.blog_notification_dispatch_gate force row level security;

create policy "Users can read their own notification subscription"
on public.blog_notification_subscriptions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false)
);

create policy "Users can create their own notification subscription"
on public.blog_notification_subscriptions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and not coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false)
);

create policy "Users can update their own notification subscription"
on public.blog_notification_subscriptions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false)
)
with check (
  (select auth.uid()) = user_id
  and not coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false)
);

-- Supabase projects may retain permissive historical default privileges, so
-- make the complete Data API surface explicit here.
revoke all on table public.blog_notification_subscriptions
  from public, anon, authenticated, service_role;
revoke all on table public.blog_notification_deliveries
  from public, anon, authenticated, service_role;
revoke all on table public.blog_notification_dispatch_gate
  from public, anon, authenticated, service_role;

grant select on table public.blog_notification_subscriptions to authenticated;
grant insert (user_id, status) on table public.blog_notification_subscriptions
  to authenticated;
grant update (user_id, status) on table public.blog_notification_subscriptions
  to authenticated;
grant select, insert, update, delete on table public.blog_notification_subscriptions
  to service_role;
grant select, insert, update on table public.blog_notification_deliveries
  to service_role;
grant select, update on table public.blog_notification_dispatch_gate
  to service_role;

revoke all on function public.set_blog_notification_subscription_lifecycle()
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_blog_notification_delivery_lifecycle()
  from public, anon, authenticated, service_role;
revoke all on function public.claim_blog_notification_delivery(text, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.start_blog_notification_provider_attempt(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.reserve_blog_notification_dispatch_slot(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.complete_blog_notification_delivery(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.record_blog_notification_delivery_failure(uuid, uuid, text, boolean, integer)
  from public, anon, authenticated;
revoke all on function public.cancel_blog_notification_delivery(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.unsubscribe_blog_notifications(uuid)
  from public, anon, authenticated;

grant execute on function public.claim_blog_notification_delivery(text, uuid, text, text)
  to service_role;
grant execute on function public.start_blog_notification_provider_attempt(uuid, uuid)
  to service_role;
grant execute on function public.reserve_blog_notification_dispatch_slot(uuid, uuid)
  to service_role;
grant execute on function public.complete_blog_notification_delivery(uuid, uuid, text)
  to service_role;
grant execute on function public.record_blog_notification_delivery_failure(uuid, uuid, text, boolean, integer)
  to service_role;
grant execute on function public.cancel_blog_notification_delivery(uuid, uuid)
  to service_role;
grant execute on function public.unsubscribe_blog_notifications(uuid)
  to service_role;
