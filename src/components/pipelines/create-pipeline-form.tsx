"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, FileText, Database, Loader2, Sparkles, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
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
  processors: z.array(processorSchema).min(1, "At least one brick is required."),
  sink: sinkSchema,
});

type FormValues = z.infer<typeof formSchema>;

const initialProcessors: Record<string, z.infer<typeof processorSchema>[]> = {
    HTTP: [{ type: 'Add/Modify Fields', properties: 'Define a URI for each record using the expression: ${http.request.uri}/${json.id}' }],
    FILE: [{ type: 'CSV to JSON', properties: 'The first line is a header line.' }],
    DATABASE: [{ type: 'Add/Modify Fields', properties: 'Create a "source_system" field with the static value "MainDB".' }],
}

export function CreatePipelineForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeploying, setIsDeploying] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidateConfigurationOutput | null>(null);
    const [selectedSourceType, setSelectedSourceType] = useState('HTTP');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            nifiProcessGroup: 'root',
            processors: initialProcessors.HTTP,
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

    const handleSourceTypeChange = (value: string) => {
        setSelectedSourceType(value);
        const newProcessors = initialProcessors[value] || [];
        form.setValue('processors', newProcessors);
        setValidationResult(null);
    }

    const handleValidate = async () => {
        const values = form.getValues();
        if (!values.processors || values.processors.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one brick is required to validate.' });
            return;
        }
        const flowDefinition = JSON.stringify({ processors: values.processors }, null, 2);

        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateConfigurationAction({ flowDefinition, sourceType: selectedSourceType, sink: values.sink });
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
            sourceType: selectedSourceType,
            flowDefinition: JSON.stringify({ processors: values.processors }),
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
    
    const availableBricks = ['CSV to JSON', 'XML to JSON', 'Excel to CSV', 'Split JSON', 'Add/Modify Fields', 'Merge Records'];
    const brickPlaceholders: Record<string, string> = {
        'CSV to JSON': 'e.g., Use first line as header. Trim whitespace from values.',
        'XML to JSON': 'e.g., Provide path to XSLT file. Or describe basic transformation.',
        'Excel to CSV': 'e.g., Use sheet "Sheet1". Skip first 3 rows.',
        'Split JSON': 'e.g., $.customers[*]',
        'Add/Modify Fields': 'e.g., Create field "fullName" by combining "firstName" and "lastName". Set "processed_timestamp" to now().',
        'Merge Records': 'e.g., Group by correlation ID. Combine into batches of 1000 records.',
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <CardTitle>Source Type</CardTitle>
                        <CardDescription>Select the primary data source for this pipeline. This will provide a default starting brick.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <FormControl>
                            <div className="grid w-full grid-cols-3 gap-2">
                                <Button type="button" variant={selectedSourceType === 'HTTP' ? 'default' : 'outline'} onClick={() => handleSourceTypeChange('HTTP')}><Globe className="mr-2 h-4 w-4" />HTTP</Button>
                                <Button type="button" variant={selectedSourceType === 'FILE' ? 'default' : 'outline'} onClick={() => handleSourceTypeChange('FILE')}><FileText className="mr-2 h-4 w-4" />File</Button>
                                <Button type="button" variant={selectedSourceType === 'DATABASE' ? 'default' : 'outline'} onClick={() => handleSourceTypeChange('DATABASE')}><Database className="mr-2 h-4 w-4" />Database</Button>
                            </div>
                        </FormControl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Define Your Data Flow</CardTitle>
                        <CardDescription>Add and configure "bricks" to build your data flow. The AI will translate these into a NiFi pipeline.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="bg-secondary/50">
                                <CardHeader className="py-4">
                                    <div className="flex items-center justify-between">
                                       <CardTitle className="text-lg">Brick #{index + 1}</CardTitle>
                                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                           <Trash2 className="h-4 w-4 text-destructive" />
                                       </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name={`processors.${index}.type`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Brick Type</FormLabel>
                                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a brick type" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableBricks.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
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
                                                        className="min-h-[120px] font-mono text-sm"
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
                            onClick={() => append({ type: '', properties: '' })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Brick
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Data Sink</CardTitle>
                        <CardDescription>Configure the destination for your data.</CardDescription>
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
                     <CardContent className="flex-col items-start gap-4 pt-0">
                         <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating}>
                                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Validate Flow with AI
                            </Button>
                        </div>
                        {validationResult && (
                            <div className={cn("mt-4 flex items-start gap-3 rounded-lg border p-4 w-full", validationResult.isValid ? "border-green-600 bg-green-50" : "border-destructive bg-destructive/10")}>
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
                    <CardFooter>
                         <Button type="submit" disabled={isDeploying || (validationResult && !validationResult.isValid)}>
                            {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deploy Pipeline
                        </Button>
                    </CardFooter>
                </Card>
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                </div>
            </form>
        </Form>
    );
}
