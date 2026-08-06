import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { getPortalCase } from "@/server/services/portal-service";

export default async function ClientDocumentsPage({ params }: { params: { caseId: string } }) {
  const caseItem = await getPortalCase(params.caseId); if (!caseItem) notFound();
  return <div><Link href={`/portal/cases/${caseItem.id}`} className="text-sm font-medium text-brand-700">Back to case</Link><h1 className="mt-4 text-2xl font-semibold">Documents</h1><p className="mt-2 text-sm text-neutral-600">Upload requested files and follow review status here.</p><div className="mt-6"><PortalDocuments caseId={caseItem.id} requirements={caseItem.requirements} documents={caseItem.documents} /></div></div>;
}
