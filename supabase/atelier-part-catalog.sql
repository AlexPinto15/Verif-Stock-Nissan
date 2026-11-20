create table if not exists public.atelier_part_catalog (
    reference text primary key check (char_length(reference) between 1 and 80),
    designation text not null check (char_length(designation) between 1 and 500),
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id)
);

alter table public.atelier_part_catalog enable row level security;

grant select, insert, update on public.atelier_part_catalog to authenticated;

drop policy if exists "Company users can read part catalog" on public.atelier_part_catalog;
create policy "Company users can read part catalog"
    on public.atelier_part_catalog
    for select
    to authenticated
    using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@sofibrie.fr');

drop policy if exists "Company users can insert part catalog" on public.atelier_part_catalog;
create policy "Company users can insert part catalog"
    on public.atelier_part_catalog
    for insert
    to authenticated
    with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@sofibrie.fr');

drop policy if exists "Company users can update part catalog" on public.atelier_part_catalog;
create policy "Company users can update part catalog"
    on public.atelier_part_catalog
    for update
    to authenticated
    using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@sofibrie.fr')
    with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@sofibrie.fr');
