# Visa Document AI — Architecture (Phase 0)

## 1. Product Definition

Visa Document AI is **AI Documentation Assistance Software** for Canadian RCICs,
immigration lawyers, their assistants, and their clients. It supports case
intake, document collection, OCR/extraction, classification, gap detection,
timeline reconstruction, evidence-completeness summaries, practitioner review,
deadline tracking, audit history, compliance export, and IRCC-ready PDF
preparation.

It is explicitly **not**: an immigration lawyer, a consultant, an eligibility
decision engine, an autonomous filer, an IRCC submission bot, or a source of
legal advice. No AI output is final without explicit human approval by an
authorized practitioner. See [security-model.md](./security-model.md) and
[ai-processing-pipeline.md](./ai-processing-pipeline.md) for the guardrails
that enforce this.

## 2. Core Principles

1. Human approval is mandatory for every AI-derived output.
2. Every AI and human action is auditable (append-only).
3. AI flags inconsistencies; it never resolves legal questions.
4. Legal judgment remains with the licensed practitioner.
5. Security and tenant isolation are architectural requirements, not
   afterthoughts.
6. Immigration streams are configuration-driven — adding a stream is a
   data/config change, not a UI rewrite.
7. The practitioner review screen is the most important screen in the product.
8. Client uploads must work exceptionally well on mobile.
9. Only the approved MVP is built before secondary SaaS features.

## 3. Technology Stack

| Concern | Choice |
|---|---|
| Frontend/App | Next.js (App Router), React, TypeScript strict mode, Tailwind CSS |
| Backend | Next.js server actions + route handlers, structured as a service layer so a dedicated Node/Python service can be extracted later |
| Database | Supabase Postgres |
| Auth | Supabase Auth (practitioner: password/magic-link + MFA; assistant: invitation-based; client: magic-link) |
| Storage | Supabase Storage, private buckets, signed expiring URLs |
| Authorization | Postgres Row-Level Security + application-layer permission checks |
| Validation | Zod (introduced when forms/APIs are implemented — not installed in Phase 0) |
| Forms | React Hook Form, only for complex multi-step forms |
| AI | Provider-agnostic server-side interface, structured JSON responses only |
| OCR | Separate provider-agnostic server-side interface |
| Email | Provider abstraction, not wired up until notifications phase |
| Deployment | Vercel or equivalent, Canadian data residency verified before production |
| VCS | GitHub |

No packages beyond what already exists are installed during architecture work.

## 4. Modular Monolith Structure

The application is organized by **business domain** first, technical layer
second. This keeps stream-specific and case-specific logic cohesive and lets
domains later be extracted into standalone services without a rewrite.

```
src/
  app/                        # Next.js App Router routes only — thin, no business logic
    (auth)/                   # login, verify, reset-password
    (practitioner)/           # dashboard, clients, cases, team, settings
    (assistant)/              # assistant-scoped views of assigned cases
    (client)/                 # client portal
    api/                      # uploads, webhooks, ai, exports route handlers

  components/                 # Presentational/UI building blocks, grouped by domain
    ui/ layout/ cases/ clients/ documents/ review/ timeline/ audit/
    notifications/ agreements/ portal/

  features/                    # Domain logic: hooks, orchestration, feature-local types
    auth/ firms/ users/ clients/ cases/ immigration-streams/ intake/
    documents/ extraction/ classification/ checklists/ evidence/ timelines/
    reviews/ approvals/ deadlines/ notifications/ audit/ compliance-export/
    agreements/ pdf-tools/

  lib/                         # Cross-cutting infrastructure
    supabase/ (client.ts, server.ts, admin.ts) validation/ encryption/
    security/ permissions/ storage/ email/ pdf/ utilities/

  server/                      # Server-only domain logic, never imported by client bundles
    repositories/ services/ policies/
    ai/ (provider.ts, schemas.ts, prompts/, extraction/, classification/, gap-detection/, timeline/)
    ocr/ (provider.ts, preprocessing/)
    jobs/ events/

  config/
    immigration-streams/ (schema.ts, registry.ts, phase-1/, phase-2/, phase-3/)

  types/                       # database.ts, domain.ts, permissions.ts
  constants/
  hooks/

supabase/
  migrations/ seed/ policies/

tests/
  unit/ integration/ e2e/
```

### Layering rules

- `app/` routes call into `features/` and `server/services` — they do not
  contain business logic or direct Supabase queries.
- `server/` code (AI providers, OCR providers, repositories, services) is
  never imported by client components. Route handlers/server actions are the
  only callers.
- `lib/supabase/client.ts` is browser-safe (anon key only). `server.ts` and
  `admin.ts` are server-only and must never be imported into client
  components.
- `config/immigration-streams/` is pure configuration/data — no React, no
  side effects — so it can be loaded on both server and client where needed
  (e.g., to render a checklist) without pulling in server-only code.
- `features/*` may depend on `types/`, `lib/`, and call `server/services`
  through server actions; they do not talk to Postgres directly.

## 5. Domain Model

Full entity-by-entity schema is in [database-schema.md](./database-schema.md).
TypeScript representations of every entity live in
[src/types/domain.ts](../src/types/domain.ts).

Key architectural invariants baked into the model:

- **Configuration versioning** — every `Case` and `IntakeResponse` records the
  exact `ImmigrationStreamConfig` version used, so historical cases remain
  interpretable after configs change.
- **Document versioning** — `DocumentVersion` is append-only; uploads never
  overwrite the sole copy of a file.
- **Source provenance** — every `ExtractedField` and `TimelineEvent` points to
  a document, page, and (where available) coordinates.
- **Central approval model** — `Approval` is the single entity type used to
  represent human sign-off on any AI-derived output (extracted fields,
  classifications, evidence assessments, timeline events).
- **Append-only audit** — `AuditEvent` supports insert only; no update/delete
  paths exist at the DB or application layer.

## 6. Provider Abstraction

- `server/ai/provider.ts` defines the AI provider interface (structured JSON
  in, structured JSON out, versioned schemas in `server/ai/schemas.ts`).
- `server/ocr/provider.ts` defines a separate OCR interface.
- Both are called only from server-side code (route handlers, server actions,
  job workers) — never from client components.
- Concrete vendor implementations (e.g., a specific LLM or OCR vendor) are
  added later behind these interfaces; no SDKs are installed in Phase 0.
- Email is abstracted the same way and is not configured until the
  notifications phase.

## 7. Permissions

Role definitions, capability matrix, and enforcement layers (UI, server
service, and Postgres RLS) are documented in
[role-permissions.md](./role-permissions.md) and typed in
[src/types/permissions.ts](../src/types/permissions.ts). UI hiding is never
treated as authorization — every mutating server action re-checks role and
tenant scope, and RLS provides the final backstop at the database layer.

## 8. Immigration Stream Configuration

Streams are data, not code. The shared shape is defined once in
[src/config/immigration-streams/schema.ts](../src/config/immigration-streams/schema.ts)
and must support all 18 identified streams across three phases, even though
only Phase 1 streams are populated with real content initially. See
[mvp-roadmap.md](./mvp-roadmap.md) for the phase/stream list and
[ai-processing-pipeline.md](./ai-processing-pipeline.md) for how a stream's
`extractionSchema`, `evidenceRules`, and `timelineRules` feed the AI pipeline.

## 9. Out of Scope (Architectural Safeguards)

The architecture must not make the following easy to accidentally build in
later phases without a deliberate decision:

- IRCC portal submission or scraping, autonomous form submission
- Eligibility determination or approval-probability outputs of any kind
- A legal-advice chatbot; substantive drafting for H&C/refugee/PRRA matters
- Payments, invoicing, trust accounting
- Full CRM, real-time chat, multi-firm hierarchy, enterprise custom roles
- Third-party integrations (QuickBooks, Zapier, Dropbox, Drive, O365/Gmail
  sync, Calendly, video consultations), native mobile app

These are enforced by product scope and by keeping the AI provider interface
restricted to structured extraction/classification/gap-detection outputs
rather than open-ended generation or action-taking.

## 10. Compliance Copy Requirements

All user-facing copy must state the product is documentation software, not a
law firm or licensed consultancy, and that licensed professionals remain
responsible for judgment and submissions. Evidence-completeness labels
(Weak/Moderate/Strong) describe evidence quantity/source diversity only and
must never be phrased as legal sufficiency or success probability. Terms like
"guaranteed eligibility", "approval prediction", or "autonomous immigration
lawyer" are disallowed anywhere in the codebase or copy.
