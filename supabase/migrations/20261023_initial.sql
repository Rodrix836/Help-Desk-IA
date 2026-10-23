-- NeuraDesk AI: ejecutar una vez en SQL Editor de un proyecto Supabase nuevo.
-- El navegador usa únicamente la clave publicable; RLS protege cada fila.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 60),
  role text not null default 'solicitante'
    check (role in ('solicitante', 'soporte')),
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(trim(requester_name)) between 1 and 60),
  requester_email text not null default (auth.jwt()->>'email'),
  subject text not null check (char_length(trim(subject)) between 1 and 100),
  description text not null check (char_length(trim(description)) between 1 and 500),
  category text not null
    check (category in ('Modelos IA', 'Infraestructura', 'Datos', 'Accesos', 'Software', 'Otros')),
  priority text not null default 'Media'
    check (priority in ('Alta', 'Media', 'Baja')),
  status text not null default 'Abierto'
    check (status in ('Abierto', 'En proceso', 'Resuelto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index tickets_requester_created_idx on public.tickets (requester_id, created_at desc);
create index tickets_status_created_idx on public.tickets (status, created_at desc);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
                  split_part(new.email, '@', 1)), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_support()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'soporte'
  );
$$;

create function public.set_ticket_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'Resuelto' and old.status <> 'Resuelto' then
    new.resolved_at := now();
  elsif new.status <> 'Resuelto' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger on_ticket_status_changed
before update of status on public.tickets
for each row execute function public.set_ticket_timestamps();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.tickets from anon, authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.tickets to authenticated;
grant insert (requester_name, subject, description, category, priority)
  on table public.tickets to authenticated;
grant update (status) on table public.tickets to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_support() from public, anon, authenticated;
revoke all on function public.set_ticket_timestamps() from public, anon, authenticated;
grant execute on function public.is_support() to authenticated;

create policy "Cada usuario lee su perfil"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Solicitante ve sus tickets y soporte ve todos"
on public.tickets for select to authenticated
using (requester_id = (select auth.uid()) or (select public.is_support()));

create policy "Usuario crea su ticket abierto"
on public.tickets for insert to authenticated
with check (requester_id = (select auth.uid()) and status = 'Abierto');

create policy "Solo soporte modifica estados"
on public.tickets for update to authenticated
using ((select public.is_support()))
with check ((select public.is_support()));

