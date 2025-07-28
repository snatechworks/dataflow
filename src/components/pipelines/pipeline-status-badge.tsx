import { Badge } from "@/components/ui/badge";
import type { PipelineStatus } from "@/lib/types";

export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  switch (status) {
    case 'RUNNING':
      return <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/80 border-transparent">Running</Badge>;
    case 'STOPPED':
      return <Badge variant="secondary">Stopped</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Error</Badge>;
    case 'IDLE':
      return <Badge variant="outline">Idle</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
