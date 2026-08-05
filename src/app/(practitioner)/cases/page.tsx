"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { StatusChip } from "@/components/ui/StatusChip";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { mockCases, type MockCase } from "@/lib/mock/cases";
import { caseStatusPresentation, riskTierPresentation } from "@/lib/utilities/status";

const PAGE_SIZE = 6;

const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(caseStatusPresentation).map(([value, presentation]) => ({
    label: presentation.label,
    value,
  })),
];

export default function CasesPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<MockCase | null>(null);

  const filtered = useMemo(() => {
    return mockCases.filter((caseItem) => {
      const matchesSearch =
        !search ||
        caseItem.title.toLowerCase().includes(search.toLowerCase()) ||
        caseItem.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<MockCase>[] = [
    {
      id: "title",
      header: "Case",
      cell: (row) => (
        <div>
          <p className="font-medium text-neutral-800 dark:text-neutral-200">{row.title}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.streamLabel}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const presentation = caseStatusPresentation[row.status];
        return <StatusChip label={presentation.label} tone={presentation.tone} />;
      },
    },
    {
      id: "risk",
      header: "Risk Tier",
      cell: (row) => {
        const presentation = riskTierPresentation[row.riskTier];
        return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
      },
    },
    {
      id: "documents",
      header: "Documents",
      cell: (row) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {row.documentsComplete}/{row.documentsTotal}
        </span>
      ),
    },
    {
      id: "assigned",
      header: "Assigned To",
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.assignedTo}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setPendingDelete(row);
          }}
          className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10"
        >
          Archive
        </button>
      ),
    },
  ];

  return (
    <PageContainer title="Cases" description="Manage every immigration case file across your firm.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No cases yet"
        emptyDescription="Cases created for your clients will appear here."
        errorDescription="We couldn't load your cases. Try again in a moment."
        skeletonVariant="table"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar value={search} onChange={setSearch} placeholder="Search cases or clients..." className="sm:w-72" />
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
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <PageState status="empty" emptyTitle="No matching cases" emptyDescription="Try a different search term or filter.">
              <div />
            </PageState>
          ) : (
            <>
              <Table columns={columns} rows={pageRows} getRowKey={(row) => row.id} />
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </PageState>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => setPendingDelete(null)}
        title="Archive case?"
        description={pendingDelete ? `"${pendingDelete.title}" will be moved to your firm's archive.` : undefined}
        confirmLabel="Archive"
        tone="danger"
      />
    </PageContainer>
  );
}
