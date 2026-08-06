-- Phase 6: client portal messaging, re-upload metadata, and client upload permissions.

alter table public.documents
  add column if not exists client_upload_note text,
  add column if not exists reupload_reason text,
  add column if not exists reupload_requested_at timestamptz,
  add column if not exists reupload_requested_by uuid references public.profiles(id) on delete set null;

alter table public.document_versions
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  add column if not exists upload_note text;

create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  sender_role public.app_role not null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_case_messages_case_created on public.case_messages(case_id, created_at desc);
alter table public.case_messages enable row level security;

-- Messages are visible only through the case visibility boundary already enforced by cases RLS.
create policy case_messages_case_scoped_read on public.case_messages
for select using (exists (select 1 from public.cases c where c.id = case_messages.case_id));

-- Clients can only send messages as themselves to their own case; firm team members are scoped to their firm.
create policy case_messages_case_member_insert on public.case_messages
for insert with check (
  sender_id = auth.uid()
  and (
    (public.current_profile_role() = 'client' and sender_role = 'client' and exists (
      select 1 from public.cases c where c.id = case_messages.case_id and c.client_id = public.current_profile_client_id()
    ))
    or
    (public.current_profile_role() in ('practitioner', 'assistant') and sender_role = public.current_profile_role() and exists (
      select 1 from public.cases c where c.id = case_messages.case_id and c.firm_id = public.current_profile_firm_id()
    ))
  )
);

-- Client uploads can create metadata only for their own case. Team members retain existing management policy.
create policy documents_client_insert_own_case on public.documents
for insert with check (
  public.current_profile_role() = 'client'
  and upload_source = 'client_portal'
  and uploaded_by = auth.uid()
  and exists (
    select 1 from public.cases c where c.id = documents.case_id and c.client_id = public.current_profile_client_id() and c.firm_id = documents.firm_id
  )
);

-- A client may replace only a document explicitly marked for re-upload, and cannot change ownership/category/exhibit metadata.
create policy documents_client_reupload_own_case on public.documents
for update using (
  public.current_profile_role() = 'client'
  and document_status = 'needs_reupload'
  and exists (select 1 from public.cases c where c.id = documents.case_id and c.client_id = public.current_profile_client_id())
) with check (
  public.current_profile_role() = 'client'
  and upload_source = 'client_portal'
  and uploaded_by = auth.uid()
  and exists (select 1 from public.cases c where c.id = documents.case_id and c.client_id = public.current_profile_client_id() and c.firm_id = documents.firm_id)
);

-- Prevent clients from changing practitioner-controlled classification, exhibit, or ownership fields.
create or replace function public.guard_client_document_reupload()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'client' and (
    new.firm_id is distinct from old.firm_id
    or new.case_id is distinct from old.case_id
    or new.participant_id is distinct from old.participant_id
    or new.requirement_id is distinct from old.requirement_id
    or new.exhibit_label is distinct from old.exhibit_label
  ) then
    raise exception 'client cannot change protected document fields';
  end if;
  return new;
end;
$$;

create trigger trg_documents_guard_client_reupload
before update on public.documents
for each row execute function public.guard_client_document_reupload();

create policy document_versions_client_insert_own_case on public.document_versions
for insert with check (
  public.current_profile_role() = 'client'
  and created_by = auth.uid()
  and exists (
    select 1 from public.documents d join public.cases c on c.id = d.case_id
    where d.id = document_versions.document_id and c.client_id = public.current_profile_client_id()
  )
);

-- Client responses are limited to their own case and remain tied to the case's pinned stream config version.
create policy intake_responses_client_own_case_write on public.intake_responses
for all using (
  public.current_profile_role() = 'client'
  and exists (select 1 from public.cases c where c.id = intake_responses.case_id and c.client_id = public.current_profile_client_id())
) with check (
  public.current_profile_role() = 'client'
  and exists (
    select 1 from public.cases c
    where c.id = intake_responses.case_id
      and c.client_id = public.current_profile_client_id()
      and c.stream_config_version = intake_responses.stream_config_version
  )
);
