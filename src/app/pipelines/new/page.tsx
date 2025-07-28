import { CreatePipelineForm } from '@/components/pipelines/create-pipeline-form';

export default function NewPipelinePage() {
  return (
    <div className="space-y-6 h-full">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Create New Pipeline</h1>
        <p className="text-muted-foreground max-w-2xl">
          Visually design your data flow using high-level bricks. The AI will translate your design into an executable NiFi pipeline.
        </p>
      </div>
      <CreatePipelineForm />
    </div>
  );
}
