-- Phase 8: practitioner review workspace persistence, canonical facts, and approval guardrails.

create table if not exists public.case_facts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  extracted_field_id uuid references public.document_extracted_fields(id) on delete set null,
  extraction_run_id uuid references public.document_extraction_runs(id) on delete set null,
  field_key text not null,
  original_ai_value text,
  approved_value text not null,
  provider text,
  model text,
  schema_version integer,
  prompt_version integer,
  extraction_version integer,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, document_id, field_key)
);
create trigger trg_case_facts_updated_at before update on public.case_facts for each row execute function public.set_updated_at();

create table if not exists public.document_field_review_drafts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  field_id uuid not null references public.document_extracted_fields(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  draft_value text,
  reviewer_note text,
  unsaved_changes boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (field_id, reviewer_id)
);
create trigger trg_document_field_review_drafts_updated_at before update on public.document_field_review_drafts for each row execute function public.set_updated_at();

alter table public.document_classification_results
  add column if not exists override_reason text,
  add column if not exists review_note text;

alter table public.document_extracted_fields
  add column if not exists override_reason text,
  add column if not exists clarification_required boolean not null default false;

alter table public.documents
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists internal_review_note text;

alter table public.case_facts enable row level security;
alter table public.document_field_review_drafts enable row level security;

create policy case_facts_practitioner_manage on public.case_facts
for all using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
) with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() = 'practitioner'
);

create policy case_facts_assistant_read_assigned on public.case_facts
for select using (
  public.current_profile_role() = 'assistant'
  and exists (
    select 1 from public.cases c
    where c.id = case_facts.case_id
      and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid())
  )
);

create policy field_drafts_team_scoped on public.document_field_review_drafts
for all using (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner', 'assistant')
) with check (
  firm_id = public.current_profile_firm_id()
  and public.current_profile_role() in ('practitioner', 'assistant')
);

-- Assistants can organize and prepare, but cannot issue final approvals/rejections/overrides.
create or replace function public.guard_assistant_extracted_field_final_actions()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'assistant' and (
    new.approval_status in ('approved', 'rejected', 'overridden')
    or new.approved_by is not null
    or new.approved_at is not null
  ) then
    raise exception 'assistant cannot finalize extracted field review actions';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_extracted_field_final_actions on public.document_extracted_fields;
create trigger trg_guard_assistant_extracted_field_final_actions
before update on public.document_extracted_fields
for each row execute function public.guard_assistant_extracted_field_final_actions();

create or replace function public.guard_assistant_classification_final_actions()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'assistant' and (
    new.review_status in ('approved', 'rejected', 'overridden')
    or new.reviewed_by is not null
    or new.reviewed_at is not null
    or new.final_category is not null
  ) then
    raise exception 'assistant cannot finalize classification review actions';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_classification_final_actions on public.document_classification_results;
create trigger trg_guard_assistant_classification_final_actions
before update on public.document_classification_results
for each row execute function public.guard_assistant_classification_final_actions();

create or replace function public.guard_assistant_document_final_actions()
returns trigger
language plpgsql
as $$
begin
  if public.current_profile_role() = 'assistant' and new.document_status in ('approved', 'rejected', 'needs_reupload') then
    raise exception 'assistant cannot finalize document review actions';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_document_final_actions on public.documents;
create trigger trg_guard_assistant_document_final_actions
before update on public.documents
for each row execute function public.guard_assistant_document_final_actions();
