"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageState, useDemoPageState } from "@/components/ui/PageState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Table, type TableColumn } from "@/components/ui/Table";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField, FormInput, FormLabel, FormSelect } from "@/components/ui/Form";
import { useToast } from "@/components/ui/ToastProvider";
import {
  mockClients,
  mockCaseRecords,
  type ClientLifecycleStatus,
  type MockClient,
} from "@/lib/mock/case-management";

const clientStatusTone: Record<ClientLifecycleStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Active", tone: "success" },
  onboarding: { label: "Onboarding", tone: "warning" },
  attention: { label: "Needs Attention", tone: "danger" },
};

export default function ClientsPage() {
  const [status, setStatus] = useDemoPageState("ready");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { showToast } = useToast();

  const filteredClients = useMemo(() => {
    return mockClients.filter((client) => {
      const needle = search.toLowerCase();
      return (
        !needle ||
        client.legalName.toLowerCase().includes(needle) ||
        client.email.toLowerCase().includes(needle) ||
        client.phone.toLowerCase().includes(needle)
      );
    });
  }, [search]);

  const columns: TableColumn<MockClient>[] = [
    {
      id: "client",
      header: "Client",
      cell: (row) => (
        <div>
          <Link
            href={`/clients/${row.id}`}
            className="focus-ring rounded text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300"
          >
            {row.legalName}
          </Link>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">ID: {row.id}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const presentation = clientStatusTone[row.status];
        return <StatusChip label={presentation.label} tone={presentation.tone} />;
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <p>{row.email}</p>
          <p>{row.phone}</p>
        </div>
      ),
    },
    {
      id: "cases",
      header: "Active Cases",
      cell: (row) => {
        const activeCount = mockCaseRecords.filter(
          (caseRecord) => caseRecord.clientId === row.id && caseRecord.status !== "closed",
        ).length;
        return <span className="text-sm text-neutral-700 dark:text-neutral-300">{activeCount}</span>;
      },
    },
    {
      id: "language",
      header: "Language",
      cell: (row) => <span className="text-sm text-neutral-600 dark:text-neutral-400">{row.language}</span>,
    },
  ];

  return (
    <PageContainer
      title="Clients"
      description="Client records, contact details, and linked cases for your firm."
      actions={
        <Button
          onClick={() => setIsCreateOpen(true)}
          aria-label="Create mock client"
        >
          Create Client
        </Button>
      }
    >
      <PageState
        status={status}
        onStatusChange={setStatus}
        emptyTitle="No clients yet"
        emptyDescription="Clients added by your firm will appear here, along with their linked cases."
        errorDescription="We couldn't load your clients. Try again in a moment."
        skeletonVariant="table"
      >
        <div className="space-y-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search client name, email, or phone"
            className="max-w-sm"
          />

          {filteredClients.length === 0 ? (
            <PageState
              status="empty"
              emptyTitle="No matching clients"
              emptyDescription="Try a different search term to find this client record."
            >
              <div />
            </PageState>
          ) : (
            <Table columns={columns} rows={filteredClients} getRowKey={(row) => row.id} />
          )}
        </div>
      </PageState>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Client (Mock)"
        description="This is a mock-only operation for Phase 2 and does not persist data."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsCreateOpen(false);
                showToast({
                  title: "Mock client created",
                  description: "This placeholder action updates UI flow only.",
                  tone: "info",
                });
              }}
            >
              Create Mock Client
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField>
            <FormLabel htmlFor="client-name">Client name</FormLabel>
            <FormInput id="client-name" placeholder="Legal name" />
          </FormField>
          <FormField>
            <FormLabel htmlFor="client-language">Language</FormLabel>
            <FormSelect id="client-language" defaultValue="English">
              <option>English</option>
              <option>French</option>
              <option>Arabic</option>
              <option>Portuguese</option>
            </FormSelect>
          </FormField>
          <FormField>
            <FormLabel htmlFor="client-email">Email</FormLabel>
            <FormInput id="client-email" type="email" placeholder="name@email.com" />
          </FormField>
          <FormField>
            <FormLabel htmlFor="client-phone">Phone</FormLabel>
            <FormInput id="client-phone" placeholder="+1 555 000 0000" />
          </FormField>
        </div>
      </Modal>
    </PageContainer>
  );
}
