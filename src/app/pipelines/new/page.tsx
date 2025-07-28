import { CreatePipelineForm } from '@/components/pipelines/create-pipeline-form';

export default function NewPipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Pipeline</h1>
        <p className="text-muted-foreground">
          Configure and deploy a new data ingestion pipeline in a few steps.
        </p>
      </div>
      <CreatePipelineForm />
    </div>
  );
}
