-- Phase 9: IMM PDF form filling engine, generation versioning, and approval workflow.

create type public.form_generation_status as enum (
  'draft',
  'generating',
  'generated',
  'needs_review',
  'approved',
  'failed',
  'unsupported',
  'archived'
);

create table if not exists public.generated_forms (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  form_code text not null,
  form_name text not null,
  form_version text not null,
  mapping_version integer not null,
  status public.form_generation_status not null default 'draft',
  latest_version integer not null default 0,
  current_generated_file_path text,
  current_checksum text,
  manual_review_required boolean not null default true,
  approval_required boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_generated_forms_updated_at before update on public.generated_forms for each row execute function public.set_updated_at();
create index idx_generated_forms_case_form on public.generated_forms(case_id, form_code, created_at desc);

create table if not exists public.generated_form_versions (
  id uuid primary key default gen_random_uuid(),
  generated_form_id uuid not null references public.generated_forms(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  version integer not null check (version > 0),
  form_code text not null,
  form_version text not null,
  mapping_version integer not null,
  provider_name text not null,
  provider_version text not null,
  template_identifier text,
  template_path text,
  template_mode text not null,
  generation_status public.form_generation_status not null,
  source_fact_ids uuid[] not null default '{}'::uuid[],
  source_intake_response_id uuid references public.intake_responses(id) on delete set null,
  source_participant_ids uuid[] not null default '{}'::uuid[],
  source_client_id uuid references public.clients(id) on delete set null,
  mapped_fields jsonb not null default '{}'::jsonb,
  filled_fields jsonb not null default '[]'::jsonb,
  skipped_fields jsonb not null default '[]'::jsonb,
  unsupported_fields jsonb not null default '[]'::jsonb,
  manual_review_fields jsonb not null default '[]'::jsonb,
  missing_required_fields jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  generated_file_path text,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  generated_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (generated_form_id, version)
);
create index idx_generated_form_versions_case_created on public.generated_form_versions(case_id, created_at desc);

create table if not exists public.form_generation_runs (
  id uuid primary key default gen_random_uuid(),
  generated_form_id uuid references public.generated_forms(id) on delete cascade,
  generated_form_version_id uuid references public.generated_form_versions(id) on delete set null,
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  form_code text not null,
  form_version text not null,
  mapping_version integer not null,
  provider_name text not null,
  provider_version text not null,
  status public.form_generation_status not null,
  unsupported_reason text,
  source_fact_ids uuid[] not null default '{}'::uuid[],
  skipped_fields jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_form_generation_runs_updated_at before update on public.form_generation_runs for each row execute function public.set_updated_at();
create index idx_form_generation_runs_case_created on public.form_generation_runs(case_id, created_at desc);

create table if not exists public.form_validation_warnings (
  id uuid primary key default gen_random_uuid(),
  form_generation_run_id uuid not null references public.form_generation_runs(id) on delete cascade,
  generated_form_version_id uuid references public.generated_form_versions(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  warning_key text not null,
  severity public.case_flag_severity not null,
  message text not null,
  field_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_form_validation_warnings_case on public.form_validation_warnings(case_id, created_at desc);

create table if not exists public.form_approvals (
  id uuid primary key default gen_random_uuid(),
  generated_form_id uuid not null references public.generated_forms(id) on delete cascade,
  generated_form_version_id uuid not null references public.generated_form_versions(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  action public.approval_action not null,
  notes text,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_form_approvals_case_created on public.form_approvals(case_id, created_at desc);

alter table public.generated_forms enable row level security;
alter table public.generated_form_versions enable row level security;
alter table public.form_generation_runs enable row level security;
alter table public.form_validation_warnings enable row level security;
alter table public.form_approvals enable row level security;

create policy generated_forms_team_access on public.generated_forms
for all using (
  exists (
    select 1 from public.cases c
    where c.id = generated_forms.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = generated_forms.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy generated_form_versions_team_access on public.generated_form_versions
for all using (
  exists (
    select 1 from public.cases c
    where c.id = generated_form_versions.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = generated_form_versions.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy form_generation_runs_team_access on public.form_generation_runs
for all using (
  exists (
    select 1 from public.cases c
    where c.id = form_generation_runs.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = form_generation_runs.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy form_validation_warnings_team_access on public.form_validation_warnings
for all using (
  exists (
    select 1 from public.cases c
    where c.id = form_validation_warnings.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = form_validation_warnings.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy form_approvals_practitioner_read on public.form_approvals
for select using (
  exists (
    select 1 from public.cases c
    where c.id = form_approvals.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() = 'practitioner'
  )
);

create policy form_approvals_practitioner_write on public.form_approvals
for all using (
  exists (
    select 1 from public.cases c
    where c.id = form_approvals.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() = 'practitioner'
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = form_approvals.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() = 'practitioner'
  )
);

create or replace function public.guard_assistant_form_approval_actions()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'assistant' then
    raise exception 'assistant cannot finalize form approvals';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_form_approval_actions on public.form_approvals;
create trigger trg_guard_assistant_form_approval_actions
before insert or update on public.form_approvals
for each row execute function public.guard_assistant_form_approval_actions();

create or replace function public.guard_assistant_generated_form_finalization()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'assistant' and (
    new.status = 'approved'
    or new.approved_by is not null
    or new.approved_at is not null
  ) then
    raise exception 'assistant cannot finalize generated forms';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_generated_form_finalization on public.generated_forms;
create trigger trg_guard_assistant_generated_form_finalization
before update on public.generated_forms
for each row execute function public.guard_assistant_generated_form_finalization();
