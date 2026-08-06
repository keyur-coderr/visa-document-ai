import { AICard } from "@/components/ui/AICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { MiniChartPlaceholder } from "@/components/ui/MiniChartPlaceholder";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TimelineItem } from "@/components/ui/TimelineItem";

export function DashboardFoundation() {
  return (
    <section aria-label="Dashboard foundation" className="space-y-4">
      <SectionHeader
        title="Dashboard Foundation"
        description="Reusable placeholder structure for the upcoming Design Phase 2 dashboard redesign."
      />

      <Card className="border-brand-100 bg-gradient-to-r from-brand-50 to-white">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-h3 text-[color:var(--color-text-primary)]">Hero Banner Placeholder</p>
            <p className="text-body text-[color:var(--color-text-secondary)]">Foundation section for top-level AI briefing.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-small text-brand-700 shadow-[var(--shadow-xs)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
            AI Briefing
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="KPI Placeholder" value="--" change="Awaiting data binding" trendTone="neutral" />
        <MetricCard title="KPI Placeholder" value="--" change="Awaiting data binding" trendTone="neutral" />
        <MetricCard title="KPI Placeholder" value="--" change="Awaiting data binding" trendTone="neutral" />
        <MetricCard title="KPI Placeholder" value="--" change="Awaiting data binding" trendTone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AICard title="AI Assistant" description="Placeholder panel for assistant insights and recommendations." />

        <Card>
          <CardHeader>
            <CardTitle>Today's Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={36} label="Priority Queue Placeholder" />
            <ProgressBar value={62} label="Follow-up Placeholder" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MiniChartPlaceholder />
            <p className="text-small text-[color:var(--color-text-secondary)]">Case trend visualization placeholder.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TimelineItem title="Activity placeholder" description="Reusable timeline row foundation." timestamp="Just now" />
          <TimelineItem title="Activity placeholder" description="Reusable timeline row foundation." timestamp="5m ago" />
        </CardContent>
      </Card>
    </section>
  );
}
