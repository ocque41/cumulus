-- Cache stable Supabase Auth helper results once per statement in the
-- notification subscription policies. This preserves the ownership and
-- non-anonymous-user checks while avoiding per-row helper evaluation.

drop policy if exists "Users can read their own notification subscription"
on public.blog_notification_subscriptions;

drop policy if exists "Users can create their own notification subscription"
on public.blog_notification_subscriptions;

drop policy if exists "Users can update their own notification subscription"
on public.blog_notification_subscriptions;

create policy "Users can read their own notification subscription"
on public.blog_notification_subscriptions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

create policy "Users can create their own notification subscription"
on public.blog_notification_subscriptions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

create policy "Users can update their own notification subscription"
on public.blog_notification_subscriptions
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
)
with check (
  (select auth.uid()) = user_id
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);
