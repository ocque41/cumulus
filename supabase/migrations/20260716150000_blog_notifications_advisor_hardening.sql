-- Make the server-only notification boundary explicit to database advisors.

create index blog_notification_deliveries_user_id_idx
  on public.blog_notification_deliveries (user_id);

create policy "Clients cannot read or write notification deliveries"
on public.blog_notification_deliveries
for all
to anon, authenticated
using (false)
with check (false);

create policy "Clients cannot read or write the notification dispatch gate"
on public.blog_notification_dispatch_gate
for all
to anon, authenticated
using (false)
with check (false);
