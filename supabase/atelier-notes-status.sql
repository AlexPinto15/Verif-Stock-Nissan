alter table public.atelier_notes
    add column if not exists note_status text not null default 'Devis'
    check (note_status in ('Commandé', 'Attente Mail', 'Devis', 'Attente téléphone'));
