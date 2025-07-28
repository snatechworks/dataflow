import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PipelineList } from '@/components/pipelines/pipeline-list';
import { PipelineStatusOverview } from '@/components/pipelines/pipeline-status-overview';
import { mockPipelines } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <Button asChild>
            <Link href="/pipelines/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Pipeline
            </Link>
          </Button>
        </div>
        <PipelineList pipelines={mockPipelines} />
      </div>
      <div className="space-y-6">
        <PipelineStatusOverview pipelines={mockPipelines} />
      </div>
    </div>
  );
}
