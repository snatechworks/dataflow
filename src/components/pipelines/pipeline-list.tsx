import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Globe, FileText, Database } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { Pipeline, PipelineSourceType } from "@/lib/types";
import { PipelineStatusBadge } from "./pipeline-status-badge";
import { Card } from "../ui/card";

const SourceIcons: Record<PipelineSourceType, React.ReactElement> = {
  HTTP: <Globe className="h-5 w-5 text-muted-foreground" />,
  FILE: <FileText className="h-5 w-5 text-muted-foreground" />,
  DATABASE: <Database className="h-5 w-5 text-muted-foreground" />,
};

export function PipelineList({ pipelines }: { pipelines: Pipeline[] }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ES Index</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipelines.map((pipeline) => (
            <TableRow key={pipeline.id}>
              <TableCell className="text-center">{SourceIcons[pipeline.sourceType]}</TableCell>
              <TableCell className="font-medium">{pipeline.name}</TableCell>
              <TableCell>
                <PipelineStatusBadge status={pipeline.status} />
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md">{pipeline.esIndex}</span>
              </TableCell>
              <TableCell>{new Date(pipeline.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Start</DropdownMenuItem>
                    <DropdownMenuItem>Stop</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
