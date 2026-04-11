-- Tabela usada por src/pages/TodosScreen.tsx (from('todos')).
-- Aplique no Supabase: SQL Editor → New query → colar → Run.
-- Ou: supabase db push (com CLI linkado ao projeto).

create table if not exists public.todos (
  id bigint generated always as identity primary key,
  name text not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.todos is 'Tarefas da tela Supabase Todos';

alter table public.todos enable row level security;

-- Cliente usa VITE_SUPABASE_ANON_KEY: políticas para o role anon.
-- Para produção, restrinja por user_id ou outra regra de negócio.
create policy "todos_select_anon"
  on public.todos for select
  to anon
  using (true);

create policy "todos_insert_anon"
  on public.todos for insert
  to anon
  with check (true);

create policy "todos_update_anon"
  on public.todos for update
  to anon
  using (true)
  with check (true);

create policy "todos_delete_anon"
  on public.todos for delete
  to anon
  using (true);
