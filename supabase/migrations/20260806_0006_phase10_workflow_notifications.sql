-- Phase 10: case lifecycle workflow, internal tasks, automation rules, timeline, and notifications.

create table if not exists public.workflow_stage_configs (
  id uuid primary key default gen_random_uuid(),
  stage_key text not null unique,
  display_name text not null,
  display_order integer not null,
  icon text not null,
  color text not null,
  description text,
  sla_days integer,
  completion_rules jsonb not null default '{}'::jsonb,
  automation_hooks jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_workflow_stage_configs_updated_at before update on public.workflow_stage_configs for each row execute function public.set_updated_at();

create table if not exists public.case_workflow_milestones (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  stage_key text not null,
  stage_order integer not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'blocked', 'overdue')),
  started_at timestamptz,
  completed_at timestamptz,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  attachments jsonb not null default '[]'::jsonb,
  duration_minutes integer,
  overdue boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, stage_key)
);
create trigger trg_case_workflow_milestones_updated_at before update on public.case_workflow_milestones for each row execute function public.set_updated_at();
create index idx_case_workflow_milestones_case_order on public.case_workflow_milestones(case_id, stage_order);

create table if not exists public.case_tasks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  milestone_id uuid references public.case_workflow_milestones(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_case_tasks_updated_at before update on public.case_tasks for each row execute function public.set_updated_at();
create index idx_case_tasks_case_due on public.case_tasks(case_id, due_at);

create table if not exists public.workflow_automation_rules (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  event_key text not null,
  stage_key text,
  condition_json jsonb not null default '{}'::jsonb,
  action_key text not null,
  action_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_workflow_automation_rules_updated_at before update on public.workflow_automation_rules for each row execute function public.set_updated_at();

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  display_name text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'in_app')),
  subject_template text,
  body_template text not null,
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_notification_templates_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'in_app')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'dismissed', 'read')),
  title text not null,
  body text not null,
  template_key text,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
create unique index if not exists idx_notifications_dedupe on public.notifications(dedupe_key) where dedupe_key is not null;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  provider_name text not null,
  provider_message_id text,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_queue (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  task_id uuid references public.case_tasks(id) on delete cascade,
  milestone_id uuid references public.case_workflow_milestones(id) on delete cascade,
  reminder_type text not null,
  escalation_level integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'sent', 'cancelled')),
  due_at timestamptz not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_reminder_queue_updated_at before update on public.reminder_queue for each row execute function public.set_updated_at();
create index idx_reminder_queue_scheduled on public.reminder_queue(status, scheduled_for);

create table if not exists public.case_timeline_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null,
  event_key text not null,
  event_label text not null,
  icon text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_case_timeline_events_case_created on public.case_timeline_events(case_id, created_at desc);

create or replace function public.prevent_case_timeline_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'case_timeline_events are immutable';
end;
$$;

drop trigger if exists trg_case_timeline_events_no_update on public.case_timeline_events;
create trigger trg_case_timeline_events_no_update
before update on public.case_timeline_events
for each row execute function public.prevent_case_timeline_mutation();

drop trigger if exists trg_case_timeline_events_no_delete on public.case_timeline_events;
create trigger trg_case_timeline_events_no_delete
before delete on public.case_timeline_events
for each row execute function public.prevent_case_timeline_mutation();

alter table public.case_workflow_milestones enable row level security;
alter table public.case_tasks enable row level security;
alter table public.workflow_automation_rules enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.reminder_queue enable row level security;
alter table public.case_timeline_events enable row level security;
alter table public.workflow_stage_configs enable row level security;

create policy workflow_stage_configs_team_read on public.workflow_stage_configs
for select using (public.current_profile_role() in ('practitioner', 'assistant'));

create policy workflow_stage_configs_practitioner_write on public.workflow_stage_configs
for all using (public.current_profile_role() = 'practitioner')
with check (public.current_profile_role() = 'practitioner');

create policy case_workflow_milestones_team_scoped on public.case_workflow_milestones
for all using (
  exists (
    select 1 from public.cases c
    where c.id = case_workflow_milestones.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = case_workflow_milestones.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy case_tasks_team_scoped on public.case_tasks
for all using (
  exists (
    select 1 from public.cases c
    where c.id = case_tasks.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = case_tasks.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy automation_rules_practitioner_manage on public.workflow_automation_rules
for all using (public.current_profile_role() = 'practitioner' and (firm_id is null or firm_id = public.current_profile_firm_id()))
with check (public.current_profile_role() = 'practitioner' and (firm_id is null or firm_id = public.current_profile_firm_id()));

create policy notification_templates_team_read on public.notification_templates
for select using (public.current_profile_role() in ('practitioner', 'assistant', 'client'));

create policy notification_templates_practitioner_write on public.notification_templates
for all using (public.current_profile_role() = 'practitioner')
with check (public.current_profile_role() = 'practitioner');

create policy notifications_team_case_scoped on public.notifications
for all using (
  (
    public.current_profile_role() in ('practitioner', 'assistant')
    and exists (
      select 1 from public.cases c
      where c.id = notifications.case_id
        and (
          (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
          or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
        )
    )
  )
  or (public.current_profile_role() = 'client' and recipient_id = auth.uid())
) with check (
  public.current_profile_role() in ('practitioner', 'assistant')
  and exists (
    select 1 from public.cases c
    where c.id = notifications.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy notification_deliveries_team_read on public.notification_deliveries
for select using (
  exists (
    select 1
    from public.notifications n
    join public.cases c on c.id = n.case_id
    where n.id = notification_deliveries.notification_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy reminder_queue_team_scoped on public.reminder_queue
for all using (
  exists (
    select 1 from public.cases c
    where c.id = reminder_queue.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = reminder_queue.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

create policy case_timeline_events_team_scoped on public.case_timeline_events
for all using (
  exists (
    select 1 from public.cases c
    where c.id = case_timeline_events.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
) with check (
  exists (
    select 1 from public.cases c
    where c.id = case_timeline_events.case_id
      and (
        (public.current_profile_role() = 'practitioner' and c.firm_id = public.current_profile_firm_id())
        or (public.current_profile_role() = 'assistant' and exists (select 1 from public.case_assignments ca where ca.case_id = c.id and ca.user_id = auth.uid()))
      )
  )
);

insert into public.workflow_stage_configs (stage_key, display_name, display_order, icon, color, description, sla_days, completion_rules, automation_hooks, is_active)
values
  ('lead', 'Lead', 1, 'user-plus', 'neutral', 'Initial lead capture and qualification.', 3, '{"required":["lead_contact"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('consultation', 'Consultation', 2, 'calendar', 'info', 'Consultation scheduled and completed.', 7, '{"required":["consultation_note"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('agreement_signed', 'Agreement Signed', 3, 'file-signature', 'brand', 'Retainer and service agreement signed.', 10, '{"required":["agreement"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('documents_requested', 'Documents Requested', 4, 'list-check', 'warning', 'Document checklist requested from client.', 3, '{"required":["request_sent"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('documents_received', 'Documents Received', 5, 'folder-check', 'success', 'Required documents uploaded and indexed.', 14, '{"required":["required_documents_uploaded"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('ai_processing', 'AI Processing', 6, 'cpu', 'info', 'OCR, classification, and extraction processing.', 2, '{"required":["processing_jobs_completed"]}'::jsonb, '["on_enter","on_complete"]'::jsonb, true),
  ('consultant_review', 'Consultant Review', 7, 'shield-check', 'warning', 'Practitioner reviews AI outputs.', 5, '{"required":["field_approvals"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('forms_generated', 'Forms Generated', 8, 'file-text', 'info', 'IMM forms generated from approved facts.', 3, '{"required":["generated_forms"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('forms_approved', 'Forms Approved', 9, 'check-circle', 'success', 'Practitioner approved final forms.', 3, '{"required":["form_approvals"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('application_submitted', 'Application Submitted', 10, 'send', 'brand', 'Application submitted to IRCC portal manually.', 2, '{"required":["submission_reference"]}'::jsonb, '["on_complete"]'::jsonb, true),
  ('aor', 'AOR', 11, 'inbox', 'info', 'Acknowledgement of receipt received.', 30, '{"required":["aor_reference"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('biometrics', 'Biometrics', 12, 'fingerprint', 'warning', 'Biometric instruction letter and completion.', 45, '{"required":["biometric_status"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('medical', 'Medical', 13, 'heart-pulse', 'warning', 'Medical request and completion tracking.', 45, '{"required":["medical_status"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('adr', 'ADR', 14, 'alert-circle', 'danger', 'Additional document request handling.', 21, '{"required":["adr_response"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('background_check', 'Background Check', 15, 'search', 'info', 'Background verification progress.', 60, '{"required":["background_status"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('ppr', 'PPR', 16, 'mail-open', 'brand', 'Passport request stage.', 30, '{"required":["ppr_received"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('copr', 'COPR', 17, 'award', 'success', 'Confirmation of permanent residence received.', 15, '{"required":["copr_received"]}'::jsonb, '["on_enter"]'::jsonb, true),
  ('closed', 'Closed', 18, 'archive', 'neutral', 'Case lifecycle completed and archived.', null, '{}'::jsonb, '["on_enter"]'::jsonb, true)
on conflict (stage_key) do update set
  display_name = excluded.display_name,
  display_order = excluded.display_order,
  icon = excluded.icon,
  color = excluded.color,
  description = excluded.description,
  sla_days = excluded.sla_days,
  completion_rules = excluded.completion_rules,
  automation_hooks = excluded.automation_hooks,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.notification_templates (template_key, display_name, channel, subject_template, body_template, variables, is_active)
values
  ('documents_requested', 'Documents Requested', 'in_app', 'Documents requested for {{caseTitle}}', 'Your case team requested additional documents for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('reminder', 'Reminder', 'in_app', 'Reminder for {{caseTitle}}', 'Reminder: {{message}}', '["caseTitle","message"]'::jsonb, true),
  ('documents_missing', 'Documents Missing', 'in_app', 'Missing documents in {{caseTitle}}', 'Some required documents are still missing in {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('review_complete', 'Review Complete', 'in_app', 'Review completed for {{caseTitle}}', 'Consultant review is completed for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('forms_ready', 'Forms Ready', 'in_app', 'Forms ready for {{caseTitle}}', 'IMM forms are generated and ready for review for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('application_submitted', 'Application Submitted', 'in_app', 'Application submitted for {{caseTitle}}', 'Application has been submitted for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('aor', 'AOR', 'in_app', 'AOR received for {{caseTitle}}', 'Acknowledgement of receipt has been recorded for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('biometrics', 'Biometrics', 'in_app', 'Biometrics update for {{caseTitle}}', 'Biometrics step updated for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('medical', 'Medical', 'in_app', 'Medical update for {{caseTitle}}', 'Medical step updated for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('adr', 'ADR', 'in_app', 'ADR update for {{caseTitle}}', 'Additional document request requires attention for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('passport_request', 'Passport Request', 'in_app', 'Passport request for {{caseTitle}}', 'Passport request stage has started for {{caseTitle}}.', '["caseTitle"]'::jsonb, true),
  ('congratulations', 'Congratulations', 'in_app', 'Congratulations on {{caseTitle}}', 'Congratulations. Your case {{caseTitle}} has reached COPR.', '["caseTitle"]'::jsonb, true)
on conflict (template_key) do update set
  display_name = excluded.display_name,
  channel = excluded.channel,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  variables = excluded.variables,
  is_active = excluded.is_active,
  updated_at = now();
