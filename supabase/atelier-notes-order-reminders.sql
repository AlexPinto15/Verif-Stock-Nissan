alter table public.atelier_notes
    add column if not exists note_brand text
        check (note_brand in ('Nissan', 'MG', 'Infinity', 'Suzuki')),
    add column if not exists reminder_days integer
        check (reminder_days between 1 and 30),
    add column if not exists reminder_at timestamptz,
    add column if not exists reminder_acknowledged boolean not null default false;

notify pgrst, 'reload schema';
