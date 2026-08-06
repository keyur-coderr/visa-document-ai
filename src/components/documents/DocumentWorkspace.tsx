"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FilterBar } from "@/components/ui/FilterBar";
import { FormField, FormInput, FormLabel, FormSelect } from "@/components/ui/Form";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Table, type TableColumn } from "@/components/ui/Table";
import type { MockChecklistDocumentLink, MockManagedDocument, MockDocumentListRow } from "@/lib/mock/documents";
import { documentStatusPresentation } from "@/lib/utilities/status";

export interface DocumentWorkspaceProps {
  documents: MockManagedDocument[];
  onDocumentsChange: (documents: MockManagedDocument[]) => void;
  checklistLinks: MockChecklistDocumentLink[];
  onChecklistLinksChange: (links: MockChecklistDocumentLink[]) => void;
  caseId?: string;
  rows: MockDocumentListRow[];
  title: string;
}

type SortKey = "uploadedAt_desc" | "uploadedAt_asc" | "filename_asc" | "filename_desc" | "size_desc" | "size_asc";

type ViewMode = "list" | "grid";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "uploadedAt_desc", label: "Newest First" },
  { value: "uploadedAt_asc", label: "Oldest First" },
  { value: "filename_asc", label: "Filename A-Z" },
  { value: "filename_desc", label: "Filename Z-A" },
  { value: "size_desc", label: "Largest Size" },
  { value: "size_asc", label: "Smallest Size" },
];

function formatSize(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}

function sortRows(rows: MockDocumentListRow[], sortKey: SortKey): MockDocumentListRow[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    if (sortKey === "uploadedAt_desc") return a.uploadedAt < b.uploadedAt ? 1 : -1;
    if (sortKey === "uploadedAt_asc") return a.uploadedAt > b.uploadedAt ? 1 : -1;
    if (sortKey === "filename_asc") return a.filename.localeCompare(b.filename);
    if (sortKey === "filename_desc") return b.filename.localeCompare(a.filename);
    if (sortKey === "size_desc") return b.sizeKb - a.sizeKb;
    return a.sizeKb - b.sizeKb;
  });

  return sorted;
}

export function DocumentWorkspace({
  documents,
  onDocumentsChange,
  checklistLinks,
  onChecklistLinksChange,
  caseId,
  rows,
  title,
}: DocumentWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseFilter, setCaseFilter] = useState(caseId ?? "all");
  const [clientFilter, setClientFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("uploadedAt_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(rows[0]?.id ?? "");
  const [renameValue, setRenameValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("identity");
  const [selectedRequirementKey, setSelectedRequirementKey] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [targetOrder, setTargetOrder] = useState(0);

  const caseOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => `${row.caseId}|${row.caseTitle}`)));
    return values.map((entry) => {
      const [id, label] = entry.split("|");
      return { value: id, label };
    });
  }, [rows]);

  const clientOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => `${row.clientId}|${row.clientName}`)));
    return values.map((entry) => {
      const [id, label] = entry.split("|");
      return { value: id, label };
    });
  }, [rows]);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(rows.map((row) => row.category)));
    return categories.map((category) => ({ value: category, label: category.replace("_", " ") }));
  }, [rows]);

  const statusOptions = useMemo(
    () => [
      { label: "All Statuses", value: "all" },
      ...Object.entries(documentStatusPresentation).map(([value, presentation]) => ({
        value,
        label: presentation.label,
      })),
    ],
    [],
  );

  const activeRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        row.filename.toLowerCase().includes(searchLower) ||
        row.caseTitle.toLowerCase().includes(searchLower) ||
        row.clientName.toLowerCase().includes(searchLower);
      const matchesCase = caseFilter === "all" || row.caseId === caseFilter;
      const matchesClient = clientFilter === "all" || row.clientId === clientFilter;
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesCase && matchesClient && matchesCategory && matchesStatus;
    });

    return sortRows(filtered, sortKey);
  }, [rows, search, caseFilter, clientFilter, categoryFilter, statusFilter, sortKey]);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  const requirementOptions = useMemo(() => {
    const relevantLinks = checklistLinks.filter((link) => !caseId || link.caseId === caseId);
    return relevantLinks.map((link) => ({ value: link.requirementKey, label: link.requirementName, linkId: link.id }));
  }, [checklistLinks, caseId]);

  function patchDocument(documentId: string, updater: (document: MockManagedDocument) => MockManagedDocument) {
    onDocumentsChange(
      documents.map((document) => {
        if (document.id !== documentId) return document;
        return updater(document);
      }),
    );
  }

  function reorderDocument(documentId: string, direction: "up" | "down") {
    const target = documents.find((document) => document.id === documentId);
    if (!target) return;

    const inCase = documents
      .filter((document) => document.caseId === target.caseId)
      .sort((a, b) => a.exhibitOrder - b.exhibitOrder);
    const index = inCase.findIndex((document) => document.id === documentId);

    if (index < 0) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= inCase.length) return;

    const current = inCase[index];
    const swap = inCase[swapIndex];

    onDocumentsChange(
      documents.map((document) => {
        if (document.id === current.id) return { ...document, exhibitOrder: swap.exhibitOrder };
        if (document.id === swap.id) return { ...document, exhibitOrder: current.exhibitOrder };
        return document;
      }),
    );
  }

  function applyLinkToRequirement(documentId: string, requirementKey: string) {
    const selectedRequirement = requirementOptions.find((option) => option.value === requirementKey);
    if (!selectedRequirement) return;

    patchDocument(documentId, (document) => ({ ...document, requirementKey }));

    onChecklistLinksChange(
      checklistLinks.map((link) =>
        link.id === selectedRequirement.linkId && !link.linkedDocumentIds.includes(documentId)
          ? {
              ...link,
              linkedDocumentIds: [...link.linkedDocumentIds, documentId],
              status: "uploaded",
            }
          : link,
      ),
    );
  }

  const columns: TableColumn<MockDocumentListRow>[] = [
    {
      id: "file",
      header: "Document",
      cell: (row) => (
        <div className="space-y-1">
          <Link href={`/cases/${row.caseId}/documents/${row.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
            {row.filename}
          </Link>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{row.caseTitle} · {row.clientName}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: (row) => <span className="text-neutral-700 dark:text-neutral-300">{row.category.replace("_", " ")}</span>,
    },
    {
      id: "exhibit",
      header: "Exhibit",
      cell: (row) => <Badge tone="neutral">{row.exhibitLabel}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const status = documentStatusPresentation[row.status];
        return <StatusChip label={status.label} tone={status.tone} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" onClick={() => setSelectedDocumentId(row.id)}>Select</Button>
          <Button size="sm" variant="ghost" onClick={() => reorderDocument(row.id, "up")}>Up</Button>
          <Button size="sm" variant="ghost" onClick={() => reorderDocument(row.id, "down")}>Down</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Document list with filtering, sorting, and grid/list views.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchBar value={search} onChange={setSearch} placeholder="Search filename, case, or client..." className="md:w-80" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={viewMode === "list" ? "primary" : "secondary"} onClick={() => setViewMode("list")}>List</Button>
              <Button size="sm" variant={viewMode === "grid" ? "primary" : "secondary"} onClick={() => setViewMode("grid")}>Grid</Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterBar
              filters={[
                {
                  id: "status",
                  label: "Status",
                  value: statusFilter,
                  options: statusOptions,
                  onChange: setStatusFilter,
                },
                {
                  id: "category",
                  label: "Category",
                  value: categoryFilter,
                  options: [{ value: "all", label: "All Categories" }, ...categoryOptions],
                  onChange: setCategoryFilter,
                },
                ...(caseId
                  ? []
                  : [
                      {
                        id: "case",
                        label: "Case",
                        value: caseFilter,
                        options: [{ value: "all", label: "All Cases" }, ...caseOptions],
                        onChange: setCaseFilter,
                      },
                    ]),
                {
                  id: "client",
                  label: "Client",
                  value: clientFilter,
                  options: [{ value: "all", label: "All Clients" }, ...clientOptions],
                  onChange: setClientFilter,
                },
              ]}
            />

            <FormField className="w-full lg:w-52">
              <FormLabel htmlFor="doc-sort">Sort</FormLabel>
              <FormSelect id="doc-sort" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </FormSelect>
            </FormField>
          </div>

          {activeRows.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No documents match the active filters.</p>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            <Table columns={columns} rows={activeRows} getRowKey={(row) => row.id} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeRows.map((row) => {
                const status = documentStatusPresentation[row.status];
                return (
                  <div key={row.id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <Link href={`/cases/${row.caseId}/documents/${row.id}`} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                      {row.filename}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{row.caseTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusChip label={status.label} tone={status.tone} />
                      <Badge tone="neutral">{row.exhibitLabel}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{formatSize(row.sizeKb)}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDocumentId(row.id)}>Select</Button>
                      <Button size="sm" variant="ghost" onClick={() => reorderDocument(row.id, "up")}>Up</Button>
                      <Button size="sm" variant="ghost" onClick={() => reorderDocument(row.id, "down")}>Down</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDocument ? (
        <Card>
          <CardHeader>
            <CardTitle>Document Actions</CardTitle>
            <CardDescription>Mock-only actions: rename, category, checklist link, review, reorder, exhibit label, note, archive.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Selected: {selectedDocument.filename}</p>

              <FormField>
                <FormLabel htmlFor="rename">Rename</FormLabel>
                <div className="flex gap-2">
                  <FormInput id="rename" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} placeholder="new_filename.pdf" />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!renameValue.trim()) return;
                      patchDocument(selectedDocument.id, (document) => ({ ...document, filename: renameValue.trim() }));
                      setRenameValue("");
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </FormField>

              <FormField>
                <FormLabel htmlFor="category">Change category</FormLabel>
                <div className="flex gap-2">
                  <FormSelect id="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </FormSelect>
                  <Button
                    variant="secondary"
                    onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, category: selectedCategory as MockManagedDocument["category"] }))}
                  >
                    Save
                  </Button>
                </div>
              </FormField>

              <FormField>
                <FormLabel htmlFor="requirement">Link to checklist requirement</FormLabel>
                <div className="flex gap-2">
                  <FormSelect id="requirement" value={selectedRequirementKey} onChange={(event) => setSelectedRequirementKey(event.target.value)}>
                    <option value="">Select requirement</option>
                    {requirementOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </FormSelect>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!selectedRequirementKey) return;
                      applyLinkToRequirement(selectedDocument.id, selectedRequirementKey);
                    }}
                  >
                    Link
                  </Button>
                </div>
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, status: "needs_reupload" }))}>Mark Needs Re-upload</Button>
                <Button variant="secondary" onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, status: "approved", reviewStatus: "approved" }))}>Approve</Button>
                <Button variant="danger" onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, status: "rejected", reviewStatus: "rejected" }))}>Reject</Button>
              </div>

              <FormField>
                <FormLabel htmlFor="order">Assign exhibit label position</FormLabel>
                <div className="flex gap-2">
                  <FormInput
                    id="order"
                    type="number"
                    min={0}
                    value={targetOrder}
                    onChange={(event) => setTargetOrder(Number(event.target.value))}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, exhibitOrder: targetOrder }))}
                  >
                    Assign Label
                  </Button>
                </div>
              </FormField>

              <FormField>
                <FormLabel htmlFor="note">Add note</FormLabel>
                <div className="flex gap-2">
                  <FormInput id="note" value={noteValue} onChange={(event) => setNoteValue(event.target.value)} placeholder="Practitioner note" />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!noteValue.trim()) return;
                      patchDocument(selectedDocument.id, (document) => ({
                        ...document,
                        practitionerNotes: [noteValue.trim(), ...document.practitionerNotes],
                      }));
                      setNoteValue("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </FormField>

              <Button
                variant="ghost"
                onClick={() => patchDocument(selectedDocument.id, (document) => ({ ...document, archived: !document.archived }))}
              >
                {selectedDocument.archived ? "Unarchive" : "Archive"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
