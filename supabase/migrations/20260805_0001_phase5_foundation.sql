-- Phase 5 foundation migration: auth-ready tenancy, roles, RLS, and secure storage.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums and shared trigger
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('practitioner', 'assistant', 'client');
create type public.membership_status as enum ('invited', 'active', 'removed');
create type public.client_status as enum ('active', 'onboarding', 'attention');
create type public.case_status as enum (
  'draft',
  'intake_in_progress',
  'documents_in_progress',
  'in_review',
  'ready_for_submission',
  'submitted',
  'awaiting_decision',
  'decision_received',
  'closed'
);
create type public.milestone_key as enum (
  'intake',
  'documents_complete',
  'forms_ready',
  'submitted',
  'awaiting_decision',
  'decision_received'
);
create type public.assignment_role as enum ('practitioner', 'assistant');
create type public.document_requirement_status as enum (
  'missing',
  'uploaded',
  'needs_review',
  'approved',
  'rejected',
  'not_applicable'
);
create type public.document_status as enum (
  'missing',
  'uploaded',
  'processing',
  'needs_review',
  'needs_reupload',
  'approved',
  'rejected',
  'expired',
  'duplicate'
);
create type public.upload_source as enum ('client_portal', 'practitioner_upload', 'assistant_upload');
create type public.case_flag_severity as enum ('low', 'medium', 'high');
create type public.case_flag_status as enum ('open', 'in_progress', 'resolved', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction text not null default 'CA',
  logo_url text,
  brand_color text,
  license_details text,
  retention_policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_firms_updated_at before update on public.firms for each row execute function public.set_updated_at();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  legal_name text not null,
  preferred_name text,
  email text not null,
  phone text,
  language text not null default 'English',
  status public.client_status not null default 'onboarding',
  -- TODO(phase-6): do not store passport/UCI values until field-level encryption is implemented.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

create table public.profiles (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role public.app_role not null,
  firm_id uuid references public.firms(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  mfa_required boolean not null default false,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_scope_check check (
    (role = 'client' and client_id is not null)
    or (role in ('practitioner','assistant') and firm_id is not null)
  )
);
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create table public.firm_memberships (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.assignment_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, user_id)
);
create trigger trg_firm_memberships_updated_at before update on public.firm_memberships for each row execute function public.set_updated_at();

create table public.immigration_stream_configs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  phase smallint not null check (phase in (1,2,3)),
  liability_tier text not null,
  version integer not null,
  active boolean not null default true,
  config_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, version)
);
create trigger trg_stream_configs_updated_at before update on public.immigration_stream_configs for each row execute function public.set_updated_at();

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  stream_key text not null,
  stream_config_version integer not null,
  title text not null,
  status public.case_status not null default 'draft',
  current_milestone public.milestone_key not null default 'intake',
  risk_tier text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_cases_updated_at before update on public.cases for each row execute function public.set_updated_at();

create table public.case_participants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  relationship text not null,
  legal_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_case_participants_updated_at before update on public.case_participants for each row execute function public.set_updated_at();

create table public.case_assignments (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.assignment_role not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, user_id, role)
);
create trigger trg_case_assignments_updated_at before update on public.case_assignments for each row execute function public.set_updated_at();

create table public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  stream_config_version integer not null,
  answers jsonb not null default '{}'::jsonb,
  completion_status text not null default 'not_started',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_intake_responses_updated_at before update on public.intake_responses for each row execute function public.set_updated_at();

create table public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  stream_config_version integer not null,
  participant_id uuid references public.case_participants(id) on delete set null,
  requirement_key text not null,
  label text not null,
  category text not null,
  required boolean not null,
  status public.document_requirement_status not null default 'missing',
  reason text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_document_requirements_updated_at before update on public.document_requirements for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  participant_id uuid references public.case_participants(id) on delete set null,
  requirement_id uuid references public.document_requirements(id) on delete set null,
  original_filename text not null,
  normalized_filename text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum text not null,
  upload_source public.upload_source not null,
  document_status public.document_status not null default 'uploaded',
  exhibit_label text,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  checksum text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create table public.case_milestones (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  milestone public.milestone_key not null,
  status text not null default 'pending',
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, milestone)
);
create trigger trg_case_milestones_updated_at before update on public.case_milestones for each row execute function public.set_updated_at();

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  type text not null,
  due_date date not null,
  reminder_schedule jsonb not null default '{"offsetsDays":[30,15,3]}'::jsonb,
  status text not null default 'upcoming',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_deadlines_updated_at before update on public.deadlines for each row execute function public.set_updated_at();

create table public.case_flags (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  type text not null,
  severity public.case_flag_severity not null,
  title text not null,
  description text not null,
  status public.case_flag_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  raised_by_type text not null default 'human',
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_case_flags_updated_at before update on public.case_flags for each row execute function public.set_updated_at();

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  version integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_approvals_updated_at before update on public.approvals for each row execute function public.set_updated_at();

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_hash text,
  after_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events are immutable';
end;
$$;

create trigger trg_audit_events_no_update
before update on public.audit_events
for each row
execute function public.prevent_audit_event_mutation();

create trigger trg_audit_events_no_delete
before delete on public.audit_events
for each row
execute function public.prevent_audit_event_mutation();

-- ---------------------------------------------------------------------------
-- Indexes for case/client/document access patterns
-- ---------------------------------------------------------------------------

create index idx_profiles_firm_role on public.profiles(firm_id, role);
create index idx_clients_firm_legal_name on public.clients(firm_id, legal_name);
create index idx_clients_firm_email on public.clients(firm_id, email);
create index idx_cases_firm_status_updated on public.cases(firm_id, status, updated_at desc);
create index idx_cases_client on public.cases(client_id);
create index idx_case_assignments_case_role on public.case_assignments(case_id, role);
create index idx_case_assignments_user on public.case_assignments(user_id, case_id);
create index idx_document_requirements_case_status on public.document_requirements(case_id, status);
create index idx_documents_case_status_uploaded on public.documents(case_id, document_status, uploaded_at desc);
create index idx_documents_firm_case on public.documents(firm_id, case_id);
create index idx_document_versions_document_version on public.document_versions(document_id, version desc);
create index idx_case_flags_case_status on public.case_flags(case_id, status);
create index idx_activities_firm_case_created on public.activities(firm_id, case_id, created_at desc);
create index idx_audit_events_firm_case_created on public.audit_events(firm_id, case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.current_profile_firm_id()
returns uuid
language sql
stable
as $$
  select p.firm_id from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.current_profile_client_id()
returns uuid
language sql
stable
as $$
  select p.client_id from public.profiles p where p.id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security policies
-- ---------------------------------------------------------------------------

alter table public.firms enable row level security;
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.firm_memberships enable row level security;
alter table public.immigration_stream_configs enable row level security;
alter table public.cases enable row level security;
alter table public.case_participants enable row level security;
alter table public.case_assignments enable row level security;
alter table public.intake_responses enable row level security;
alter table public.document_requirements enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.case_milestones enable row level security;
alter table public.deadlines enable row level security;
alter table public.case_flags enable row level security;
alter table public.activities enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_events enable row level security;

-- profiles: users can read/update own profile, practitioners can read same-firm users.
create policy profiles_self_select on public.profiles
for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_practitioner_firm_read on public.profiles
for select using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

-- firms: only practitioner/assistant in same firm can read. practitioner can update.
create policy firms_firm_read on public.firms
for select using (
  id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner', 'assistant')
);
create policy firms_practitioner_update on public.firms
for update using (
  id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
) with check (
  id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

-- clients: practitioner full same-firm access; assistant only assigned-case client visibility; client own profile client.
create policy clients_practitioner_all on public.clients
for all using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
) with check (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

create policy clients_assistant_read_assigned on public.clients
for select using (
  public.current_profile_role() = 'assistant'
  and exists (
    select 1
    from public.cases c
    join public.case_assignments ca on ca.case_id = c.id
    where c.client_id = clients.id
      and ca.user_id = auth.uid()
  )
);

create policy clients_self_read on public.clients
for select using (
  public.current_profile_role() = 'client'
  and id = public.current_profile_client_id()
);

-- memberships: practitioner manage same-firm memberships.
create policy memberships_practitioner_manage on public.firm_memberships
for all using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
) with check (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

-- stream configs: readable to all authenticated roles.
create policy stream_configs_authenticated_read on public.immigration_stream_configs
for select using (auth.uid() is not null);

-- cases: practitioner same firm; assistant assigned only; client own cases only.
create policy cases_practitioner_all on public.cases
for all using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
) with check (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

create policy cases_assistant_assigned_read on public.cases
for select using (
  public.current_profile_role() = 'assistant'
  and exists (
    select 1 from public.case_assignments ca
    where ca.case_id = cases.id and ca.user_id = auth.uid()
  )
);

create policy cases_client_own_read on public.cases
for select using (
  public.current_profile_role() = 'client'
  and client_id = public.current_profile_client_id()
);

-- participants inherit case visibility.
create policy case_participants_visible_by_case on public.case_participants
for select using (
  exists (select 1 from public.cases c where c.id = case_participants.case_id)
);
create policy case_participants_practitioner_write on public.case_participants
for all using (
  exists (
    select 1 from public.cases c
    where c.id = case_participants.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() = 'practitioner'
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = case_participants.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() = 'practitioner'
  )
);

-- assignments: practitioner manages; assistant/client read only if linked.
create policy case_assignments_practitioner_manage on public.case_assignments
for all using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
) with check (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

create policy case_assignments_read_linked on public.case_assignments
for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.cases c
    where c.id = case_assignments.case_id
      and (
        (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
        or (public.current_profile_role() = 'client' and c.client_id = public.current_profile_client_id())
      )
  )
);

-- intake responses, requirements, documents, versions, milestones, deadlines, flags, activities, approvals:
-- inherit from cases and prevent cross-firm access.
create policy intake_responses_case_scoped on public.intake_responses
for select using (exists (select 1 from public.cases c where c.id = intake_responses.case_id));
create policy intake_responses_practitioner_write on public.intake_responses
for all using (
  exists (select 1 from public.cases c where c.id = intake_responses.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
) with check (
  exists (select 1 from public.cases c where c.id = intake_responses.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
);

create policy document_requirements_case_scoped on public.document_requirements
for select using (exists (select 1 from public.cases c where c.id = document_requirements.case_id));
create policy document_requirements_team_write on public.document_requirements
for all using (
  exists (select 1 from public.cases c where c.id = document_requirements.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
) with check (
  exists (select 1 from public.cases c where c.id = document_requirements.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
);

create policy documents_case_scoped_read on public.documents
for select using (
  exists (
    select 1 from public.cases c
    where c.id = documents.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
        or (public.current_profile_role() = 'client' and c.client_id = public.current_profile_client_id())
      )
  )
);
create policy documents_team_write on public.documents
for all using (
  exists (
    select 1 from public.cases c
    where c.id = documents.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = documents.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy document_versions_case_scoped on public.document_versions
for select using (
  exists (select 1 from public.documents d join public.cases c on c.id = d.case_id where d.id = document_versions.document_id)
);
create policy document_versions_team_write on public.document_versions
for all using (
  exists (
    select 1
    from public.documents d
    join public.cases c on c.id = d.case_id
    where d.id = document_versions.document_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1
    from public.documents d
    join public.cases c on c.id = d.case_id
    where d.id = document_versions.document_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy case_milestones_case_scoped on public.case_milestones
for select using (exists (select 1 from public.cases c where c.id = case_milestones.case_id));
create policy case_milestones_team_write on public.case_milestones
for all using (
  exists (select 1 from public.cases c where c.id = case_milestones.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
) with check (
  exists (select 1 from public.cases c where c.id = case_milestones.case_id and c.firm_id = public.current_profile_firm_id() and public.current_profile_role() in ('practitioner','assistant'))
);

create policy deadlines_case_scoped on public.deadlines
for select using (
  exists (select 1 from public.cases c where c.id = deadlines.case_id)
);
create policy deadlines_practitioner_write on public.deadlines
for all using (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
) with check (
  public.current_profile_role() = 'practitioner'
  and firm_id = public.current_profile_firm_id()
);

create policy case_flags_case_scoped on public.case_flags
for select using (
  exists (select 1 from public.cases c where c.id = case_flags.case_id)
);
create policy case_flags_team_write on public.case_flags
for all using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
) with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);

create policy activities_case_scoped_read on public.activities
for select using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);
create policy activities_team_insert on public.activities
for insert with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);

create policy approvals_practitioner_read on public.approvals
for select using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);
create policy approvals_practitioner_write on public.approvals
for all using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
) with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

-- audit events are immutable: insert-only for practitioner/assistant server actions, read practitioner only.
create policy audit_events_practitioner_read on public.audit_events
for select using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);
create policy audit_events_team_insert on public.audit_events
for insert with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);

-- ---------------------------------------------------------------------------
-- Storage buckets and policies
-- Path convention: firm/<firm_id>/case/<case_id>/filename.ext
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('case-documents', 'case-documents', false),
  ('firm-branding', 'firm-branding', false),
  ('generated-exports', 'generated-exports', false)
on conflict (id) do nothing;

-- Case documents access follows role and tenant boundaries.
create policy storage_case_documents_select on storage.objects
for select using (
  bucket_id = 'case-documents'
  and (
    (
      public.current_profile_role() = 'practitioner'
      and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
    )
    or (
      public.current_profile_role() = 'assistant'
      and exists (
        select 1
        from public.case_assignments ca
        where ca.user_id = auth.uid()
          and ca.case_id::text = split_part(name, '/', 4)
      )
    )
    or (
      public.current_profile_role() = 'client'
      and exists (
        select 1
        from public.profiles p
        join public.cases c on c.client_id = p.client_id
        where p.id = auth.uid()
          and c.id::text = split_part(name, '/', 4)
      )
    )
  )
);

create policy storage_case_documents_insert on storage.objects
for insert with check (
  bucket_id = 'case-documents'
  and (
    (
      public.current_profile_role() in ('practitioner','assistant')
      and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
    )
    or (
      public.current_profile_role() = 'client'
      and exists (
        select 1
        from public.profiles p
        join public.cases c on c.client_id = p.client_id
        where p.id = auth.uid()
          and c.id::text = split_part(name, '/', 4)
      )
    )
  )
);

create policy storage_case_documents_update on storage.objects
for update using (
  bucket_id = 'case-documents'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);

create policy storage_case_documents_delete on storage.objects
for delete using (
  bucket_id = 'case-documents'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

-- Firm branding bucket: practitioner-only write, team read.
create policy storage_branding_select on storage.objects
for select using (
  bucket_id = 'firm-branding'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner','assistant')
);

create policy storage_branding_write on storage.objects
for all using (
  bucket_id = 'firm-branding'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
) with check (
  bucket_id = 'firm-branding'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

-- Generated exports: practitioner-controlled, private by default.
create policy storage_exports_select on storage.objects
for select using (
  bucket_id = 'generated-exports'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

create policy storage_exports_insert on storage.objects
for insert with check (
  bucket_id = 'generated-exports'
  and split_part(name, '/', 2)::uuid = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);
