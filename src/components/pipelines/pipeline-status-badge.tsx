import { Badge } from "@/components/ui/badge";
import type { PipelineStatus } from "@/lib/types";

export function PipelineStatusBadge({ status }: { status: PipelineStatus }) {
  switch (status) {
    case 'RUNNING':
      return <Badge variant="outline" className="text-green-600 border-green-600/50 bg-green-500/10"><span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>Running</Badge>;
    case 'STOPPED':
      return <Badge variant="secondary">Stopped</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Error</Badge>;
    case 'IDLE':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600/50 bg-yellow-500/10">Idle</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
