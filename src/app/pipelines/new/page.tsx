import { CreatePipelineForm } from '@/components/pipelines/create-pipeline-form';

export default function NewPipelinePage() {
  return (
    <div className="space-y-6 h-full">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Create New Pipeline</h1>
        <p className="text-muted-foreground max-w-2xl">
          Visually design your data flow using high-level bricks. The system will execute your design to ingest and process your data.
        </p>
      </div>
      <CreatePipelineForm />
    </div>
  );
}
