"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, CheckCircle, XCircle, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { validateConfigurationAction, createPipelineAction } from '@/app/actions';
import type { ValidateConfigurationOutput } from '@/ai/flows/validate-configuration';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PipelineFlowPreview } from './pipeline-flow-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { brickConfig, brickTypes, sourceBrickTypes, transformationBrickTypes, getBrickConfig } from '@/lib/brick-config';

// Create a discriminated union schema
const processorSchema = z.union(
  Object.entries(brickConfig).map(([key, config]) => 
    z.object({
      type: z.literal(key),
      properties: config.schema,
    })
  )
);

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
            processors: [
              brickConfig.HTTP.defaultValue
            ],
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

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "processors",
    });

    const formatPropertiesForAI = (processors: FormValues['processors']) => {
        return processors.map(p => ({
            type: p.type,
            properties: p.properties // The properties are already structured, no need for custom formatting here.
        }));
    }

    const handleValidate = async () => {
        setValidationResult(null);
        const isFormValid = await form.trigger();
        if (!isFormValid) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fix the errors in the form before validating.' });
            return;
        }

        const values = form.getValues();
        if (!values.processors || values.processors.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one brick (a source) is required to validate.' });
            return;
        }
        
        const aiPayload = formatPropertiesForAI(values.processors);
        const flowDefinition = JSON.stringify({ processors: aiPayload.slice(1) }, null, 2);

        setIsValidating(true);
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
        
        const aiPayload = formatPropertiesForAI(values.processors);

        const pipelinePayload = {
            name: values.name,
            nifiProcessGroup: values.nifiProcessGroup,
            sourceType: values.processors[0].type,
            flowDefinition: JSON.stringify({ processors: aiPayload.slice(1) }),
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

    const renderBrickFields = (index: number) => {
        const brickType = form.watch(`processors.${index}.type`);
        const config = getBrickConfig(brickType);
        if (!config) return null;

        return Object.entries(config.fields).map(([fieldName, fieldConfig]) => (
            <FormField
                key={fieldName}
                control={form.control}
                name={`processors.${index}.properties.${fieldName}`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{fieldConfig.label}</FormLabel>
                        <FormControl>
                            <Input placeholder={fieldConfig.placeholder} {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>{fieldConfig.description}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        ));
    };

    const getFormattedProperties = (index: number) => {
        const processor = form.watch(`processors.${index}`);
        const config = getBrickConfig(processor.type);
        if (!config) return "No configuration available.";
        
        const formatted = config.format(processor.properties);
        if (!formatted || formatted.trim() === '') {
            return <span className="text-muted-foreground/70">No properties configured. Click 'Configure' to add them.</span>;
        }
        return formatted;
    }

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
                                <Card key={field.id} className="bg-muted/30 relative pl-8">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground cursor-grab">
                                        <GripVertical className="h-5 w-5" />
                                    </span>
                                    <CardHeader className="py-3 pr-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">
                                                {index === 0 ? 'Source Brick' : `Transformation Brick #${index}`}
                                            </CardTitle>
                                           {index > 0 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-7 w-7">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                           )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pr-4">
                                        <Controller
                                            control={form.control}
                                            name={`processors.${index}.type`}
                                            render={({ field, fieldState }) => (
                                                <FormItem>
                                                    <FormLabel>Brick Type</FormLabel>
                                                    <Select onValueChange={(value) => {
                                                        const newBrickType = value as keyof typeof brickConfig;
                                                        const newDefaultValue = brickConfig[newBrickType].defaultValue;
                                                        update(index, newDefaultValue);
                                                        setValidationResult(null);
                                                    }} defaultValue={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a brick type" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {(index === 0 ? sourceBrickTypes : transformationBrickTypes).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage>{fieldState.error?.message}</FormMessage>
                                                </FormItem>
                                            )}
                                        />

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <FormLabel>Configuration</FormLabel>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                                                            <Settings className="h-4 w-4" />
                                                            Configure
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Configure Brick: {form.watch(`processors.${index}.type`)}</DialogTitle>
                                                            <DialogDescription>
                                                                {getBrickConfig(form.watch(`processors.${index}.type`))?.description}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            {renderBrickFields(index)}
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button type="button">Done</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="text-sm text-muted-foreground bg-background p-3 rounded-md border whitespace-pre-wrap break-words min-h-[60px]">
                                                {getFormattedProperties(index)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Separator />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const newBrick = brickConfig['Add/Modify Fields'].defaultValue;
                                    append(newBrick);
                                }}
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
