"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelect } from "@/components/ui/Form";
import { CaseCard } from "@/components/cases/CaseCard";
import {
  mockCaseRecords,
  mockClients,
  mockTeamUsers,
  getUserNameById,
  getClientById,
  type MockCaseRecord,
} from "@/lib/mock/case-management";
import { caseStatusPresentation } from "@/lib/utilities/status";

const PAGE_SIZE = 6;

const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(caseStatusPresentation).map(([value, presentation]) => ({
    label: presentation.label,
    value,
  })),
];

const streamOptions = [
  { label: "All Streams", value: "all" },
  ...Array.from(new Set(mockCaseRecords.map((record) => record.streamLabel))).map((stream) => ({
    label: stream,
    value: stream,
  })),
];

const practitionerOptions = [
  { label: "All Practitioners", value: "all" },
  ...mockTeamUsers
    .filter((user) => user.role === "practitioner")
    .map((user) => ({ label: user.fullName, value: user.id })),
];

const assistantOptions = [
  { label: "All Assistants", value: "all" },
  { label: "Unassigned", value: "unassigned" },
  ...mockTeamUsers
    .filter((user) => user.role === "assistant")
    .map((user) => ({ label: user.fullName, value: user.id })),
];

const deadlineOptions = [
  { label: "All Deadlines", value: "all" },
  { label: "Due in next 7 days", value: "next_7_days" },
  { label: "No deadline", value: "no_deadline" },
  { label: "Overdue", value: "overdue" },
];

const sortOptions = [
  { label: "Recently Updated", value: "updated_desc" },
  { label: "Nearest Deadline", value: "deadline_asc" },
  { label: "Highest Flags", value: "flags_desc" },
  { label: "Client Name A-Z", value: "client_asc" },
];

export default function CasesPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [streamFilter, setStreamFilter] = useState("all");
  const [practitionerFilter, setPractitionerFilter] = useState("all");
  const [assistantFilter, setAssistantFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);

  const withClientName = useMemo(() => {
    return mockCaseRecords.map((record) => ({
      ...record,
      clientName: getClientById(record.clientId)?.legalName ?? "Unknown Client",
    }));
  }, []);

  const filtered = useMemo(() => {
    const now = new Date("2026-08-05T00:00:00Z");

    const scoped = withClientName.filter((caseItem) => {
      const matchesSearch =
        !search ||
        caseItem.title.toLowerCase().includes(search.toLowerCase()) ||
        caseItem.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
      const matchesStream = streamFilter === "all" || caseItem.streamLabel === streamFilter;
      const matchesPractitioner =
        practitionerFilter === "all" || caseItem.assignedPractitionerId === practitionerFilter;
      const matchesAssistant =
        assistantFilter === "all" ||
        (assistantFilter === "unassigned" && caseItem.assignedAssistantId === null) ||
        caseItem.assignedAssistantId === assistantFilter;

      let matchesDeadline = true;
      if (deadlineFilter === "next_7_days") {
        if (!caseItem.nearestDeadline) {
          matchesDeadline = false;
        } else {
          const due = new Date(caseItem.nearestDeadline);
          const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          matchesDeadline = diffDays >= 0 && diffDays <= 7;
        }
      }

      if (deadlineFilter === "no_deadline") {
        matchesDeadline = caseItem.nearestDeadline === null;
      }

      if (deadlineFilter === "overdue") {
        if (!caseItem.nearestDeadline) {
          matchesDeadline = false;
        } else {
          matchesDeadline = new Date(caseItem.nearestDeadline).getTime() < now.getTime();
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStream &&
        matchesPractitioner &&
        matchesAssistant &&
        matchesDeadline
      );
    });

    const sorted = [...scoped];
    sorted.sort((left, right) => {
      if (sortBy === "updated_desc") {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }

      if (sortBy === "deadline_asc") {
        if (!left.nearestDeadline && !right.nearestDeadline) return 0;
        if (!left.nearestDeadline) return 1;
        if (!right.nearestDeadline) return -1;
        return new Date(left.nearestDeadline).getTime() - new Date(right.nearestDeadline).getTime();
      }

      if (sortBy === "flags_desc") {
        return right.unresolvedFlagCount - left.unresolvedFlagCount;
      }

      return left.clientName.localeCompare(right.clientName);
    });

    return sorted;
  }, [
    withClientName,
    search,
    statusFilter,
    streamFilter,
    practitionerFilter,
    assistantFilter,
    deadlineFilter,
    sortBy,
  ]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageContainer
      title="Cases"
      description="Manage every immigration case file across your firm."
      actions={
        <Link href="/cases/new" className="focus-ring rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Create Case
        </Link>
      }
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No cases yet"
        emptyDescription="Cases created for your clients will appear here."
        errorDescription="We couldn't load your cases. Try again in a moment."
        skeletonVariant="table"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search case title or client"
              className="lg:w-80"
            />

            <FilterBar
              filters={[
                {
                  id: "status",
                  label: "Status",
                  value: statusFilter,
                  options: statusFilterOptions,
                  onChange: (value) => {
                    setStatusFilter(value);
                    setPage(1);
                  },
                },
                {
                  id: "stream",
                  label: "Stream",
                  value: streamFilter,
                  options: streamOptions,
                  onChange: (value) => {
                    setStreamFilter(value);
                    setPage(1);
                  },
                },
                {
                  id: "practitioner",
                  label: "Practitioner",
                  value: practitionerFilter,
                  options: practitionerOptions,
                  onChange: (value) => {
                    setPractitionerFilter(value);
                    setPage(1);
                  },
                },
                {
                  id: "assistant",
                  label: "Assistant",
                  value: assistantFilter,
                  options: assistantOptions,
                  onChange: (value) => {
                    setAssistantFilter(value);
                    setPage(1);
                  },
                },
                {
                  id: "deadline",
                  label: "Deadline",
                  value: deadlineFilter,
                  options: deadlineOptions,
                  onChange: (value) => {
                    setDeadlineFilter(value);
                    setPage(1);
                  },
                },
              ]}
            />
          </div>

          <FormField className="max-w-xs">
            <FormSelect
              aria-label="Sort cases"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {filtered.length === 0 ? (
            <PageState status="empty" emptyTitle="No matching cases" emptyDescription="Try a different search term or filter.">
              <div />
            </PageState>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {pageRows.map((record: MockCaseRecord & { clientName: string }) => (
                  <CaseCard
                    key={record.id}
                    caseRecord={record}
                    clientName={record.clientName}
                    practitionerName={getUserNameById(record.assignedPractitionerId)}
                    assistantName={getUserNameById(record.assignedAssistantId)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Pagination is mock-only in Phase 2 and uses local in-memory data.
                </p>
                <div className="min-w-[240px]">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                Mock workflow note: filtering, sorting, searching, and card updates are client-side only and do not persist.
              </div>
            </>
          )}
        </div>
      </PageState>
    </PageContainer>
  );
}
