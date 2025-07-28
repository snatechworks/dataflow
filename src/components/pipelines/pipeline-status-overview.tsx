"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import type { Pipeline, PipelineStatus } from "@/lib/types";

const STATUS_COLORS: Record<PipelineStatus, string> = {
  RUNNING: "hsl(var(--chart-2))",
  STOPPED: "hsl(var(--muted-foreground))",
  IDLE: "hsl(var(--chart-4))",
  ERROR: "hsl(var(--destructive))",
};

export function PipelineStatusOverview({ pipelines }: { pipelines: Pipeline[] }) {
  const statusCounts = pipelines.reduce((acc, pipeline) => {
    acc[pipeline.status] = (acc[pipeline.status] || 0) + 1;
    return acc;
  }, {} as Record<PipelineStatus, number>);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as PipelineStatus,
    count,
    fill: STATUS_COLORS[status as PipelineStatus],
  }));

  const chartConfig = {
    count: {
      label: "Pipelines",
    },
    ...chartData.reduce((acc, { status }) => {
      acc[status] = { label: status };
      return acc;
    }, {} as any)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Status Overview</CardTitle>
        <CardDescription>A summary of the current status of all pipelines.</CardDescription>
      </CardHeader>
      <CardContent>
        {pipelines.length > 0 ? (
          <div className="flex flex-col items-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-48"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
              {chartData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  ></span>
                  <span className="text-muted-foreground">{entry.status}</span>
                  <span className="ml-auto font-semibold">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No pipeline data to display.</p>
        )}
      </CardContent>
    </Card>
  );
}
