-- Fictional development-only seed data.
-- No real client PII is included.

insert into public.firms (id, name, jurisdiction, brand_color)
values (
  '11111111-1111-1111-1111-111111111111',
  'Fictional Immigration Partners',
  'CA',
  '#1D4ED8'
)
on conflict (id) do nothing;

insert into public.clients (id, firm_id, legal_name, preferred_name, email, phone, language, status)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Avery Clarke',
    'Avery',
    'avery.clarke+fictional@example.test',
    '+1-555-0101',
    'English',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Jordan Rivera',
    'Jordan',
    'jordan.rivera+fictional@example.test',
    '+1-555-0102',
    'English',
    'onboarding'
  )
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role, firm_id, client_id, mfa_required, mfa_enabled)
values
  (
    '33333333-3333-3333-3333-333333333331',
    'practitioner+fictional@example.test',
    'Morgan Patel',
    'practitioner',
    '11111111-1111-1111-1111-111111111111',
    null,
    true,
    false
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    'assistant+fictional@example.test',
    'Casey Lin',
    'assistant',
    '11111111-1111-1111-1111-111111111111',
    null,
    false,
    false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'client.avery+fictional@example.test',
    'Avery Clarke',
    'client',
    null,
    '22222222-2222-2222-2222-222222222221',
    false,
    false
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    'client.jordan+fictional@example.test',
    'Jordan Rivera',
    'client',
    null,
    '22222222-2222-2222-2222-222222222222',
    false,
    false
  )
on conflict (id) do nothing;

insert into public.firm_memberships (id, firm_id, user_id, role, status, invited_by, joined_at)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'practitioner',
    'active',
    null,
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333332',
    'assistant',
    'active',
    '33333333-3333-3333-3333-333333333331',
    now()
  )
on conflict (firm_id, user_id) do nothing;

insert into public.immigration_stream_configs (id, key, name, phase, liability_tier, version, active, config_json)
values
  (
    '55555555-5555-5555-5555-555555555551',
    'express-entry-fswp',
    'Express Entry — Federal Skilled Worker',
    1,
    'standard',
    1,
    true,
    '{"placeholder":true}'::jsonb
  )
on conflict (key, version) do nothing;

insert into public.cases (id, firm_id, client_id, stream_key, stream_config_version, title, status, current_milestone, risk_tier)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'express-entry-fswp',
    1,
    'Clarke — Express Entry (Fictional)',
    'documents_in_progress',
    'documents_complete',
    'standard'
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'express-entry-fswp',
    1,
    'Rivera — Express Entry (Fictional)',
    'intake_in_progress',
    'intake',
    'elevated'
  )
on conflict (id) do nothing;

insert into public.case_assignments (id, firm_id, case_id, user_id, role, is_primary)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '33333333-3333-3333-3333-333333333331',
    'practitioner',
    true
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '33333333-3333-3333-3333-333333333332',
    'assistant',
    false
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666662',
    '33333333-3333-3333-3333-333333333331',
    'practitioner',
    true
  )
on conflict (case_id, user_id, role) do nothing;

insert into public.document_requirements (id, case_id, stream_config_version, requirement_key, label, category, required, status, sort_order)
values
  (
    '88888888-8888-8888-8888-888888888881',
    '66666666-6666-6666-6666-666666666661',
    1,
    'passport',
    'Valid passport',
    'identity',
    true,
    'uploaded',
    1
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '66666666-6666-6666-6666-666666666662',
    1,
    'language_test',
    'Language test results',
    'language',
    true,
    'missing',
    2
  )
on conflict (id) do nothing;

insert into public.documents (id, firm_id, case_id, requirement_id, original_filename, normalized_filename, storage_path, mime_type, size_bytes, checksum, upload_source, document_status, exhibit_label, uploaded_by)
values
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '88888888-8888-8888-8888-888888888881',
    'fictional_passport.pdf',
    'fictional_passport.pdf',
    'firm/11111111-1111-1111-1111-111111111111/case/66666666-6666-6666-6666-666666666661/fictional_passport.pdf',
    'application/pdf',
    240111,
    'sha256:fictionalchecksum01',
    'client_portal',
    'uploaded',
    'A',
    '33333333-3333-3333-3333-333333333333'
  )
on conflict (id) do nothing;

insert into public.document_versions (id, document_id, version, storage_path, checksum, created_by)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '99999999-9999-9999-9999-999999999991',
    1,
    'firm/11111111-1111-1111-1111-111111111111/case/66666666-6666-6666-6666-666666666661/fictional_passport.pdf',
    'sha256:fictionalchecksum01',
    '33333333-3333-3333-3333-333333333333'
  )
on conflict (document_id, version) do nothing;

insert into public.activities (id, firm_id, case_id, actor_id, action, entity_type, entity_id, metadata)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666661',
    '33333333-3333-3333-3333-333333333331',
    'seed_activity_created',
    'case',
    '66666666-6666-6666-6666-666666666661',
    '{"note":"Fictional seed activity"}'::jsonb
  )
on conflict (id) do nothing;
