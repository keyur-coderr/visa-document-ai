-- Phase 7: OCR/classification/extraction processing pipeline and review-ready records.

create type public.processing_job_status as enum (
  'queued',
  'processing',
  'completed',
  'failed',
  'retry_pending',
  'needs_review',
  'cancelled'
);

create type public.document_category as enum (
  'passport',
  'language_test',
  'wes_eca_report',
  'educational_degree',
  'educational_transcript',
  'employment_reference_letter',
  'employment_offer_letter',
  'pay_slip',
  'tax_document',
  'bank_statement',
  'police_clearance_certificate',
  'marriage_certificate',
  'birth_certificate',
  'resume_cv',
  'medical_document',
  'work_permit',
  'study_permit',
  'visitor_visa',
  'permanent_resident_card',
  'national_id',
  'unknown'
);

create type public.ai_review_status as enum ('pending_review', 'approved', 'rejected', 'overridden');

create type public.document_quality_issue_key as enum (
  'unreadable_file',
  'blurry_image',
  'low_resolution',
  'wrong_orientation',
  'missing_page',
  'duplicate_document',
  'unsupported_file',
  'password_protected_pdf',
  'corrupted_file',
  'low_ocr_confidence',
  'document_expired',
  'document_expiring_soon',
  'name_mismatch',
  'date_inconsistency'
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text not null,
  job_type text not null,
  status public.processing_job_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  idempotency_key text not null,
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  safe_error_message text,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, job_type, idempotency_key)
);
create trigger trg_processing_jobs_updated_at before update on public.processing_jobs for each row execute function public.set_updated_at();
create index idx_processing_jobs_status_created on public.processing_jobs(status, created_at);

create table public.document_classification_results (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text not null,
  model text not null,
  schema_version integer not null,
  prompt_version integer not null,
  generated_at timestamptz not null default now(),
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  run_version integer not null check (run_version > 0),
  is_latest boolean not null default true,
  predicted_category public.document_category not null,
  alternatives jsonb not null default '[]'::jsonb,
  source_metadata jsonb not null default '{}'::jsonb,
  review_status public.ai_review_status not null default 'pending_review',
  final_category public.document_category,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, run_version),
  unique (document_id, idempotency_key)
);
create trigger trg_document_classification_results_updated_at before update on public.document_classification_results for each row execute function public.set_updated_at();
create index idx_document_classification_results_document_latest on public.document_classification_results(document_id, is_latest);

create table public.document_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text not null,
  model text not null,
  schema_version integer not null,
  prompt_version integer not null,
  status public.processing_job_status not null default 'queued',
  review_status public.ai_review_status not null default 'pending_review',
  generated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  extracted_json jsonb not null default '{}'::jsonb,
  source_metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, idempotency_key)
);
create trigger trg_document_extraction_runs_updated_at before update on public.document_extraction_runs for each row execute function public.set_updated_at();

create table public.document_extracted_fields (
  id uuid primary key default gen_random_uuid(),
  extraction_run_id uuid not null references public.document_extraction_runs(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  field_key text not null,
  raw_value text,
  normalized_value text,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  source_page integer,
  source_text text,
  source_coordinates jsonb,
  review_required boolean not null default true,
  approval_status public.ai_review_status not null default 'pending_review',
  approved_value text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_document_extracted_fields_updated_at before update on public.document_extracted_fields for each row execute function public.set_updated_at();
create index idx_document_extracted_fields_document on public.document_extracted_fields(document_id, field_key);

create table public.document_quality_checks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  issue_key public.document_quality_issue_key not null,
  severity public.case_flag_severity not null,
  detected_by text not null,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  status public.ai_review_status not null default 'pending_review',
  details jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, issue_key, idempotency_key)
);
create trigger trg_document_quality_checks_updated_at before update on public.document_quality_checks for each row execute function public.set_updated_at();

alter table public.processing_jobs enable row level security;
alter table public.document_classification_results enable row level security;
alter table public.document_extraction_runs enable row level security;
alter table public.document_extracted_fields enable row level security;
alter table public.document_quality_checks enable row level security;

create policy processing_jobs_team_read on public.processing_jobs
for select using (
  exists (
    select 1 from public.cases c
    where c.id = processing_jobs.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy processing_jobs_client_enqueue on public.processing_jobs
for insert with check (
  public.current_profile_role() = 'client'
  and created_by = auth.uid()
  and status = 'queued'
  and exists (
    select 1 from public.cases c
    where c.id = processing_jobs.case_id
      and c.client_id = public.current_profile_client_id()
      and c.firm_id = processing_jobs.firm_id
  )
);

create policy processing_jobs_team_manage on public.processing_jobs
for all using (
  exists (
    select 1 from public.cases c
    where c.id = processing_jobs.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = processing_jobs.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy classification_results_team_scoped on public.document_classification_results
for all using (
  exists (
    select 1 from public.cases c
    where c.id = document_classification_results.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = document_classification_results.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy extraction_runs_team_scoped on public.document_extraction_runs
for all using (
  exists (
    select 1 from public.cases c
    where c.id = document_extraction_runs.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = document_extraction_runs.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy extracted_fields_team_scoped on public.document_extracted_fields
for all using (
  exists (
    select 1 from public.cases c
    where c.id = document_extracted_fields.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = document_extracted_fields.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);

create policy quality_checks_team_scoped on public.document_quality_checks
for all using (
  exists (
    select 1 from public.cases c
    where c.id = document_quality_checks.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = document_quality_checks.case_id
      and c.firm_id = public.current_profile_firm_id()
      and public.current_profile_role() in ('practitioner','assistant')
  )
);
