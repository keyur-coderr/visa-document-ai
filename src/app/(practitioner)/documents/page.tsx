"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { StatusChip } from "@/components/ui/StatusChip";
import { Pagination } from "@/components/ui/Pagination";
import { mockDocuments, type MockDocument } from "@/lib/mock/documents";
import { documentStatusPresentation, aiConfidenceBand } from "@/lib/utilities/status";

const PAGE_SIZE = 6;

const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(documentStatusPresentation).map(([value, presentation]) => ({
    label: presentation.label,
    value,
  })),
];

function formatSize(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}

export default function DocumentsPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.filename.toLowerCase().includes(search.toLowerCase()) ||
        doc.caseTitle.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<MockDocument>[] = [
    {
      id: "filename",
      header: "Document",
      cell: (row) => (
        <div>
          <p className="font-medium text-neutral-800 dark:text-neutral-200">{row.filename}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.caseTitle}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.category}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const presentation = documentStatusPresentation[row.status];
        return <StatusChip label={presentation.label} tone={presentation.tone} />;
      },
    },
    {
      id: "confidence",
      header: "AI Confidence",
      cell: (row) => {
        if (row.confidence === null) return <span className="text-neutral-400">—</span>;
        const band = aiConfidenceBand(row.confidence);
        return <StatusChip label={`${band.percent}% · ${band.label}`} tone={band.tone} />;
      },
    },
    {
      id: "size",
      header: "Size",
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{formatSize(row.sizeKb)}</span>,
    },
  ];

  return (
    <PageContainer title="Documents" description="Every document uploaded across your firm's cases.">
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No documents yet"
        emptyDescription="Documents uploaded by clients or practitioners will appear here."
        errorDescription="We couldn't load documents. Try again in a moment."
        skeletonVariant="table"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar value={search} onChange={setSearch} placeholder="Search documents or cases..." className="sm:w-72" />
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
            <PageState status="empty" emptyTitle="No matching documents" emptyDescription="Try a different search term or filter.">
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
    </PageContainer>
  );
}
