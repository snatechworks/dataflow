"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, CheckCircle, XCircle, Plus, Trash2, ArrowDown, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { validateConfigurationAction, createPipelineAction } from '@/app/actions';
import type { ValidateConfigurationOutput } from '@/ai/flows/validate-configuration';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PipelineFlowPreview } from './pipeline-flow-preview';
import { ScrollArea } from '@/components/ui/scroll-area';

const processorSchema = z.object({
  type: z.string().min(1, "Brick type is required."),
  properties: z.string().describe("High-level description of the brick's function."),
});

const sinkSchema = z.object({
  type: z.literal('Elasticsearch'),
  properties: z.object({
    elasticsearchUrl: z.string().url("Must be a valid URL."),
    index: z.string().min(1, "Index name is required."),
    user: z.string().optional(),
    password: z.string().optional(),
  })
});

const formSchema = z.object({
  name: z.string().min(3, "Pipeline name must be at least 3 characters long."),
  nifiProcessGroup: z.string().min(1, "NiFi Process Group is required."),
  processors: z.array(processorSchema).min(1, "At least one brick (a source) is required."),
  sink: sinkSchema,
});

type FormValues = z.infer<typeof formSchema>;


export function CreatePipelineForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeploying, setIsDeploying] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidateConfigurationOutput | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            nifiProcessGroup: 'root',
            processors: [{ type: 'HTTP', properties: 'Listen on port 8080 and path /data' }],
            sink: {
                type: 'Elasticsearch',
                properties: {
                    elasticsearchUrl: 'http://localhost:9200',
                    index: 'my-data-index',
                    user: '',
                    password: ''
                }
            }
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "processors",
    });

    const processors = form.watch('processors');
    const sourceType = processors?.[0]?.type || 'N/A';
    
    const handleValidate = async () => {
        const values = form.getValues();
        if (!values.processors || values.processors.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one brick (a source) is required to validate.' });
            return;
        }
        const flowDefinition = JSON.stringify({ processors: values.processors.slice(1) }, null, 2);

        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateConfigurationAction({ 
                flowDefinition, 
                sourceType: values.processors[0].type, 
                sink: values.sink 
            });
            setValidationResult(result);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to validate configuration.' });
        } finally {
            setIsValidating(false);
        }
    };
    
    async function onSubmit(values: FormValues) {
        setIsDeploying(true);
        
        const pipelinePayload = {
            name: values.name,
            nifiProcessGroup: values.nifiProcessGroup,
            sourceType: values.processors[0].type,
            flowDefinition: JSON.stringify({ processors: values.processors.slice(1) }),
            sink: values.sink,
        }

        const result = await createPipelineAction(pipelinePayload);
        
        if (result.success) {
            toast({
                title: 'Deployment Successful',
                description: result.message,
            });
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: 'Deployment Failed',
                description: result.message,
                duration: 9000,
            });
        }

        setIsDeploying(false);
    }
    
    const sourceBricks = ['HTTP', 'File', 'Database'];
    const transformationBricks = ['CSV to JSON', 'XML to JSON', 'Excel to CSV', 'Split JSON', 'Add/Modify Fields', 'Merge Records'];

    const brickPlaceholders: Record<string, string> = {
        'HTTP': 'e.g., Listen on port 8080 and path /data',
        'File': 'e.g., Watch directory /var/data/input for new files.',
        'Database': 'e.g., Query "SELECT * FROM orders" every 5 minutes.',
        'CSV to JSON': 'e.g., Use first line as header. Trim whitespace from values.',
        'XML to JSON': 'e.g., Provide path to XSLT file. Or describe basic transformation.',
        'Excel to CSV': 'e.g., Use sheet "Sheet1". Skip first 3 rows.',
        'Split JSON': 'e.g., $.customers[*]',
        'Add/Modify Fields': 'e.g., Create field "fullName" by combining "firstName" and "lastName".',
        'Merge Records': 'e.g., Group by correlation ID. Combine into batches of 1000 records.',
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Details</CardTitle>
                            <CardDescription>Provide a name and target NiFi Process Group for your pipeline.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pipeline Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Customer Orders API Ingestion" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nifiProcessGroup"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NiFi Process Group ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., root" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Flow Bricks</CardTitle>
                            <CardDescription>Add and configure bricks to build your flow. The first brick defines the data source.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="bg-muted/30 relative pl-6">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <GripVertical className="h-5 w-5" />
                                    </span>
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                {index === 0 ? 'Source Brick' : `Transformation Brick #${index}`}
                                            </CardTitle>
                                           {index > 0 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                           )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                        <Controller
                                            control={form.control}
                                            name={`processors.${index}.type`}
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel>Brick Type</FormLabel>
                                                    <Select onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setValidationResult(null);
                                                    }} defaultValue={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a brick type" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {(index === 0 ? sourceBricks : transformationBricks).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage>{fieldState.error?.message}</FormMessage>
                                                </FormItem>
                                            )}
                                        />
                                        <div />
                                        <FormField
                                            control={form.control}
                                            name={`processors.${index}.properties`}
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Instructions</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={brickPlaceholders[form.watch(`processors.${index}.type`)] || 'Describe what this brick should do...'}
                                                            className="min-h-[100px] font-mono text-sm bg-background"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setValidationResult(null);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                            <Separator />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ type: 'Add/Modify Fields', properties: '' })}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Transformation Brick
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Sink</CardTitle>
                            <CardDescription>Configure the final destination for your data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="sink.properties.elasticsearchUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Elasticsearch URL</FormLabel>
                                        <FormControl><Input placeholder="http://localhost:9200" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sink.properties.index"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Elasticsearch Index</FormLabel>
                                        <FormControl><Input placeholder="my-pipeline-index" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Validation & Deployment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating}>
                                    {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Validate Flow with AI
                                </Button>
                            </div>
                            {validationResult && (
                                <div className={cn("mt-4 flex items-start gap-3 rounded-lg border p-4 w-full", validationResult.isValid ? "border-green-600 bg-green-50/50" : "border-destructive bg-destructive/10")}>
                                    {validationResult.isValid ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" /> : <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />}
                                    <div className="flex-1">
                                        <p className={cn("font-semibold", validationResult.isValid ? "text-green-800" : "text-destructive")}>
                                            {validationResult.isValid ? "Flow logic looks good!" : "Validation Issues Found"}
                                        </p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{validationResult.feedback}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex-col items-start gap-4">
                            <p className="text-sm text-muted-foreground">
                                After validation is successful, you can deploy the pipeline.
                            </p>
                            <Button type="submit" disabled={isDeploying || (validationResult && !validationResult.isValid)}>
                                {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Deploy Pipeline
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Flow Preview</CardTitle>
                             <CardDescription>A live visualization of your pipeline.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PipelineFlowPreview 
                                processors={form.watch('processors')} 
                                sink={form.watch('sink')}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 flex justify-end gap-2">
                     <Button type="button" variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                </div>
            </form>
        </Form>
    );
}
