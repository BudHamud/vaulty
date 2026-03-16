-- ═══════════════════════════════════════════════════════════════
--  VAULTY HUB — Central Users Setup
--  Ejecutar una sola vez en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabla de perfiles globales (un perfil por usuario, para todos los proyectos)
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique not null,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- 3. Cualquiera puede leer perfiles (necesario para login por username)
create policy "Perfiles son públicos para lectura"
  on public.profiles
  for select
  using (true);

-- 4. Solo el propio usuario puede insertar su perfil (al registrarse)
create policy "Usuarios pueden crear su propio perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 5. Solo el propio usuario puede editar su perfil
create policy "Usuarios pueden editar su propio perfil"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6. Trigger para auto-actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 7. (Opcional) Trigger para crear perfil automáticamente al registrarse
--    Esto evita que el cliente tenga que hacer el INSERT manualmente.
--    Si ya manejás el insert desde el código (createProfile), podés omitir esto.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    -- username inicial = parte antes del @ del email
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
--  FIN. Verificá con:
--  select * from public.profiles;
-- ═══════════════════════════════════════════════════════════════
