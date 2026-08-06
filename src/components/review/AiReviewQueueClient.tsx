"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Table, type TableColumn } from "@/components/ui/Table";
import { aiConfidenceBand } from "@/lib/utilities/status";
import type { ReviewQueueItem } from "@/server/services/review-service";

const PAGE_SIZE = 10;

function confidenceBucket(value: number): "low" | "medium" | "high" {
  if (value >= 0.85) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

export function AiReviewQueueClient({ rows }: { rows: ReviewQueueItem[] }) {
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [processingFilter, setProcessingFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [uploadDateFilter, setUploadDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("uploaded_desc");
  const [page, setPage] = useState(1);

  const caseOptions = useMemo(() => [{ label: "All Cases", value: "all" }, ...Array.from(new Set(rows.map((row) => row.caseId))).map((caseId) => ({ label: rows.find((row) => row.caseId === caseId)?.caseTitle ?? caseId, value: caseId }))], [rows]);
  const clientOptions = useMemo(() => [{ label: "All Clients", value: "all" }, ...Array.from(new Set(rows.map((row) => row.clientName))).map((item) => ({ label: item, value: item }))], [rows]);
  const categoryOptions = useMemo(() => [{ label: "All Categories", value: "all" }, ...Array.from(new Set(rows.map((row) => row.predictedCategory))).map((item) => ({ label: item, value: item }))], [rows]);
  const reviewerOptions = useMemo(() => [{ label: "All Reviewers", value: "all" }, ...Array.from(new Set(rows.map((row) => row.assignedReviewer))).map((item) => ({ label: item, value: item }))], [rows]);

  const filtered = useMemo(() => {
    const now = new Date();
    const data = rows.filter((row) => {
      const matchesSearch = !search || row.filename.toLowerCase().includes(search.toLowerCase()) || row.caseTitle.toLowerCase().includes(search.toLowerCase()) || row.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesCase = caseFilter === "all" || row.caseId === caseFilter;
      const matchesClient = clientFilter === "all" || row.clientName === clientFilter;
      const matchesCategory = categoryFilter === "all" || row.predictedCategory === categoryFilter;
      const matchesConfidence = confidenceFilter === "all" || confidenceBucket(row.classificationConfidence) === confidenceFilter;
      const matchesProcessing = processingFilter === "all" || row.processingStatus === processingFilter;
      const matchesQuality = qualityFilter === "all" || (qualityFilter === "with_warning" ? row.qualityWarningCount > 0 : row.qualityWarningCount === 0);
      const matchesReviewer = reviewerFilter === "all" || row.assignedReviewer === reviewerFilter;

      let matchesUploadDate = true;
      if (uploadDateFilter === "last_7_days") {
        const diff = (now.getTime() - new Date(row.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
        matchesUploadDate = diff <= 7;
      }
      if (uploadDateFilter === "last_30_days") {
        const diff = (now.getTime() - new Date(row.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
        matchesUploadDate = diff <= 30;
      }

      return matchesSearch && matchesCase && matchesClient && matchesCategory && matchesConfidence && matchesProcessing && matchesQuality && matchesReviewer && matchesUploadDate;
    });

    const sorted = [...data].sort((a, b) => {
      if (sortBy === "uploaded_desc") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortBy === "confidence_desc") return b.classificationConfidence - a.classificationConfidence;
      if (sortBy === "warnings_desc") return b.qualityWarningCount - a.qualityWarningCount;
      return a.caseTitle.localeCompare(b.caseTitle);
    });

    return sorted;
  }, [rows, search, caseFilter, clientFilter, categoryFilter, confidenceFilter, processingFilter, qualityFilter, reviewerFilter, uploadDateFilter, sortBy]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Array<TableColumn<ReviewQueueItem>> = [
    {
      id: "case",
      header: "Case",
      cell: (row) => <div><p className="font-medium text-neutral-800 dark:text-neutral-200">{row.caseTitle}</p><p className="text-xs text-neutral-500">{row.clientName}</p></div>,
    },
    {
      id: "document",
      header: "Document",
      cell: (row) => <Link href={`/cases/${row.caseId}/review/${row.documentId}`} className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">{row.filename}</Link>,
    },
    {
      id: "classification",
      header: "Classification",
      cell: (row) => {
        const band = aiConfidenceBand(row.classificationConfidence);
        return <div className="space-y-1"><p className="text-sm">{row.predictedCategory}</p><StatusChip label={`${band.percent}%`} tone={band.tone} /></div>;
      },
    },
    {
      id: "extraction",
      header: "Extraction",
      cell: (row) => {
        const band = aiConfidenceBand(row.extractionConfidence);
        return <StatusChip label={`${band.percent}%`} tone={band.tone} />;
      },
    },
    {
      id: "processing",
      header: "Processing",
      cell: (row) => <StatusChip label={row.processingStatus.replaceAll("_", " ")} tone={row.processingStatus === "failed" ? "danger" : row.processingStatus === "needs_review" ? "warning" : "info"} />,
    },
    {
      id: "warnings",
      header: "Warnings",
      cell: (row) => <span className="text-sm">{row.qualityWarningCount}</span>,
      className: "w-20",
    },
    {
      id: "meta",
      header: "Reviewer / Uploaded",
      cell: (row) => <div className="text-xs text-neutral-500"><p>{row.assignedReviewer}</p><p>{new Date(row.uploadedAt).toLocaleDateString()}</p><p>Flags: {row.unresolvedFlagCount}</p></div>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search filename, case, or client" className="lg:w-96" />
        <FilterBar
          filters={[
            { id: "case", label: "Case", value: caseFilter, options: caseOptions, onChange: (value) => { setCaseFilter(value); setPage(1); } },
            { id: "client", label: "Client", value: clientFilter, options: clientOptions, onChange: (value) => { setClientFilter(value); setPage(1); } },
            { id: "category", label: "Category", value: categoryFilter, options: categoryOptions, onChange: (value) => { setCategoryFilter(value); setPage(1); } },
            { id: "confidence", label: "Confidence", value: confidenceFilter, options: [{ label: "All Confidence", value: "all" }, { label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Low", value: "low" }], onChange: (value) => { setConfidenceFilter(value); setPage(1); } },
            { id: "processing", label: "Processing", value: processingFilter, options: [{ label: "All Processing", value: "all" }, { label: "Queued", value: "queued" }, { label: "Processing", value: "processing" }, { label: "Needs Review", value: "needs_review" }, { label: "Failed", value: "failed" }, { label: "Completed", value: "completed" }], onChange: (value) => { setProcessingFilter(value); setPage(1); } },
            { id: "quality", label: "Quality", value: qualityFilter, options: [{ label: "All Quality", value: "all" }, { label: "With Warnings", value: "with_warning" }, { label: "No Warnings", value: "without_warning" }], onChange: (value) => { setQualityFilter(value); setPage(1); } },
            { id: "reviewer", label: "Reviewer", value: reviewerFilter, options: reviewerOptions, onChange: (value) => { setReviewerFilter(value); setPage(1); } },
            { id: "upload_date", label: "Upload Date", value: uploadDateFilter, options: [{ label: "Any Upload Date", value: "all" }, { label: "Last 7 Days", value: "last_7_days" }, { label: "Last 30 Days", value: "last_30_days" }], onChange: (value) => { setUploadDateFilter(value); setPage(1); } },
          ]}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p>{filtered.length} documents</p>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="focus-ring rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900">
          <option value="uploaded_desc">Newest uploads</option>
          <option value="confidence_desc">Highest confidence</option>
          <option value="warnings_desc">Most warnings</option>
          <option value="case_asc">Case A-Z</option>
        </select>
      </div>

      <Table columns={columns} rows={pageRows} getRowKey={(row) => row.documentId} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
