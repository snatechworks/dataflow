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
  type: z.string().min(1, "Processor type is required."),
  properties: z.string().min(1, "Processor properties are required (at least '{}')."),
});

const formSchema = z.object({
  name: z.string().min(3, "Pipeline name must be at least 3 characters long."),
  nifiProcessGroup: z.string().min(1, "NiFi Process Group is required."),
  processors: z.array(processorSchema).min(1, "At least one processor is required."),
});

type FormValues = z.infer<typeof formSchema>;

const initialProcessors: Record<string, z.infer<typeof processorSchema>[]> = {
    HTTP: [{ type: 'GetHTTP', properties: '{\n  "URL": "https://api.example.com/data",\n  "Filename": "${UUID()}"\n}' }],
    FILE: [{ type: 'GetFile', properties: '{\n  "Input Directory": "/path/to/source",\n  "Keep Source File": "true"\n}' }],
    DATABASE: [{ type: 'QueryDatabaseRecord', properties: '{\n  "Database Connection Pooling Service": "your-db-pool-service-id",\n  "SQL select query": "SELECT * FROM users"\n}' }],
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
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "processors",
    });

    const handleSourceTypeChange = (value: string) => {
        setSelectedSourceType(value);
        // Reset processors to the default for the selected source type
        const newProcessors = initialProcessors[value] || [];
        form.setValue('processors', newProcessors);
        setValidationResult(null);
    }

    const handleValidate = async () => {
        const processors = form.getValues('processors');
        if (!processors || processors.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one processor is required to validate.' });
            return;
        }
        const config = JSON.stringify({ processors }, null, 2);

        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateConfigurationAction({ configuration: config, sourceType: selectedSourceType });
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
            // The backend expects `sourceType` and `config`
            sourceType: selectedSourceType,
            config: JSON.stringify({ processors: values.processors }),
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
    
    const availableProcessors = ['GetHTTP', 'PutFile', 'GetFile', 'QueryDatabaseRecord', 'JoltTransformJSON', 'UpdateAttribute', 'RouteOnAttribute', 'LogAttribute'];

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
                        <CardDescription>Select the primary data source for this pipeline. This will provide a default starting processor.</CardDescription>
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
                        <CardTitle>Define NiFi Flow</CardTitle>
                        <CardDescription>Add and configure the processors that will make up your data flow. The order of processors matters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                            <Card key={field.id} className="bg-secondary/50">
                                <CardHeader className="py-4">
                                    <div className="flex items-center justify-between">
                                       <CardTitle className="text-lg">Processor #{index + 1}</CardTitle>
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
                                                <FormLabel>Processor Type</FormLabel>
                                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a processor type" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableProcessors.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                                                <FormLabel>Properties (JSON)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='{ "Property": "Value" }'
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
                            onClick={() => append({ type: '', properties: '{}' })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Processor
                        </Button>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                         <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating}>
                                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Validate Flow with AI
                            </Button>
                        </div>
                        {validationResult && (
                            <div className={cn("flex items-start gap-3 rounded-lg border p-4 w-full", validationResult.isValid ? "border-green-600 bg-green-50" : "border-destructive bg-destructive/10")}>
                                {validationResult.isValid ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" /> : <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />}
                                <div className="flex-1">
                                    <p className={cn("font-semibold", validationResult.isValid ? "text-green-800" : "text-destructive")}>
                                        {validationResult.isValid ? "Configuration looks good!" : "Validation Issues Found"}
                                    </p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{validationResult.feedback}</p>
                                </div>
                            </div>
                        )}
                    </CardFooter>
                </Card>
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                    <Button type="submit" disabled={isDeploying}>
                        {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Deploy Pipeline
                    </Button>
                </div>
            </form>
        </Form>
    );
}
