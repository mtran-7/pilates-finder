-- Emails of visitors who want to hear when a coming-soon region launches.
create table public.waitlist_signups (
    id uuid primary key default gen_random_uuid(),
    email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    region text not null default 'general',
    created_at timestamptz not null default now()
);

-- One signup per email per region; case-insensitive.
create unique index waitlist_signups_email_region_key
    on public.waitlist_signups (lower(email), region);

alter table public.waitlist_signups enable row level security;

-- Public visitors may add themselves, but can never read the list.
create policy "anon can insert" on public.waitlist_signups
    for insert to anon with check (true);
