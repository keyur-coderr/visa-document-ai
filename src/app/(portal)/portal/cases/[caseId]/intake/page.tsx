import Link from "next/link";
import { notFound } from "next/navigation";
import { getStreamConfig } from "@/config/streams";
import { PortalIntakeForm } from "@/components/portal/PortalIntakeForm";
import { getPortalCase } from "@/server/services/portal-service";

export default async function ClientIntakePage({ params }: { params: { caseId: string } }) {
  const caseItem = await getPortalCase(params.caseId); if (!caseItem) notFound(); const config = getStreamConfig(caseItem.streamKey as Parameters<typeof getStreamConfig>[0]);
  const fields = config.forms.map((item) => ({ key: item.key, label: item.label, required: item.required }));
  return <div><Link href={`/portal/cases/${caseItem.id}`} className="text-sm font-medium text-brand-700">Back to case</Link><h1 className="mt-4 text-2xl font-semibold">Intake</h1><p className="mt-2 text-sm text-neutral-600">Save a draft at any time. Submit when your answers are ready for review.</p><div className="mt-6"><PortalIntakeForm caseId={caseItem.id} fields={fields} /></div></div>;
}
