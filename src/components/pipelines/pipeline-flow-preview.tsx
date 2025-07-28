
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDown, Database, FileText, Globe, Cpu, Combine, GitCommitHorizontal, VenetianMask } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getBrickConfig } from "@/lib/brick-config";

const brickIcons: Record<string, React.ReactElement> = {
    // Sources
    'HTTP': <Globe className="w-6 h-6" />,
    'File': <FileText className="w-6 h-6" />,
    'Database': <Database className="w-6 h-6" />,
    // Transformations
    'CSV to JSON': <Combine className="w-6 h-6" />,
    'XML to JSON': <Combine className="w-6 h-6" />,
    'Excel to CSV': <Combine className="w-6 h-6" />,
    'Split JSON': <GitCommitHorizontal className="w-6 h-6 -rotate-90" />,
    'Add/Modify Fields': <Cpu className="w-6 h-6" />,
    'Merge Records': <GitCommitHorizontal className="w-6 h-6" />,
    // Sinks
    'Elasticsearch': <div className="w-6 h-6 bg-[#005571] rounded-full flex items-center justify-center text-white font-bold text-lg">E</div>,
    'Default': <VenetianMask className="w-6 h-6" />,
};

const BrickIcon = ({ type }: { type: string }) => {
    return brickIcons[type] || brickIcons['Default'];
};


const BrickCard = ({ type, properties, isFirst, isLast, isSink }: { type: string, properties: any, isFirst?: boolean, isLast?: boolean, isSink?: boolean }) => {
    const config = getBrickConfig(type);
    const formattedProperties = isSink ? formatSinkProperties(properties) : config?.format(properties);

    return (
        <div className="flex flex-col items-center">
            <Card className={cn(
                "w-full bg-background shadow-md border-primary/20",
                isSink && "border-green-500/40"
            )}>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                    <div className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                        isSink && "bg-green-500/10 text-green-600"
                    )}>
                        <BrickIcon type={type} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">{type}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md font-mono whitespace-pre-wrap break-words">
                        {formattedProperties || (isSink ? 'Sink Configuration' : 'No properties configured.')}
                    </div>
                </CardContent>
            </Card>
            {!isLast && (
                <div className="my-2 text-muted-foreground/50">
                    <ArrowDown className="w-6 h-6" />
                </div>
            )}
        </div>
    );
};

function formatSinkProperties(sinkProperties: any): string {
    if (!sinkProperties) return '';
    const { elasticsearchUrl, index } = sinkProperties;
    let result = [];
    if (elasticsearchUrl) result.push(`URL: ${elasticsearchUrl}`);
    if (index) result.push(`Index: ${index}`);
    return result.join('\n');
}

export function PipelineFlowPreview({ processors, sink }: { processors: any[], sink: any }) {
    if (!processors || processors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48 border-2 border-dashed rounded-lg">
                <p>Your pipeline flow will appear here.</p>
                <p className="text-sm">Start by adding a source brick.</p>
            </div>
        )
    }

    return (
        <div className="space-y-0">
            {processors.map((p, index) => (
                <BrickCard 
                    key={index}
                    type={p.type} 
                    properties={p.properties}
                    isFirst={index === 0}
                    isLast={false}
                />
            ))}
            <BrickCard
                type={sink.type}
                properties={sink.properties}
                isLast
                isSink
            />
        </div>
    );
}
