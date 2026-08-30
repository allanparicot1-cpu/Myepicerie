-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase
-- (Supabase → ton projet → SQL Editor → New query → colle ceci → Run)

create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Maintient updated_at à jour automatiquement
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_data_updated_at on app_data;
create trigger trg_app_data_updated_at
before update on app_data
for each row execute procedure set_updated_at();

-- Active la sécurité au niveau des lignes
alter table app_data enable row level security;

-- Autorise la lecture et l'écriture à toute personne munie de la clé "anon"
-- (l'app protège déjà l'accès par prénom + mot de passe côté application ;
-- ceci correspond au même niveau de protection que le stockage précédent)
create policy "Lecture publique" on app_data
  for select using (true);

create policy "Écriture publique" on app_data
  for insert with check (true);

create policy "Mise à jour publique" on app_data
  for update using (true);
