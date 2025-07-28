"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, FileText, Database, Loader2, Sparkles, CheckCircle, XCircle, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { validateConfigurationAction, createPipelineAction } from '@/app/actions';
import type { ValidateConfigurationOutput } from '@/ai/flows/validate-configuration';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, "Pipeline name must be at least 3 characters long."),
  nifiProcessGroup: z.string().min(1, "NiFi Process Group is required."),
  sourceType: z.enum(['HTTP', 'FILE', 'DATABASE']),
  config: z.string().min(10, "Configuration must be at least 10 characters long."),
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
            sourceType: 'HTTP',
            config: '',
        },
    });

    const sourceType = form.watch('sourceType');

    const handleValidate = async () => {
        const config = form.getValues('config');
        if (!config) {
            toast({ variant: 'destructive', title: 'Error', description: 'Configuration cannot be empty to validate.' });
            return;
        }
        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateConfigurationAction({ configuration: config, sourceType });
            setValidationResult(result);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to validate configuration.' });
        } finally {
            setIsValidating(false);
        }
    };
    
    async function onSubmit(values: FormValues) {
        setIsDeploying(true);
        
        const result = await createPipelineAction(values);
        
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
    
    const configPlaceholders: Record<z.infer<typeof formSchema>['sourceType'], string> = {
        HTTP: '{\n  "url": "https://api.example.com/data",\n  "method": "GET",\n  "headers": {\n    "Authorization": "Bearer YOUR_TOKEN"\n  }\n}',
        FILE: '{\n  "path": "/var/log/app.log",\n  "format": "json"\n}',
        DATABASE: '{\n  "connectionString": "postgresql://user:pass@host:port/db",\n  "query": "SELECT * FROM public.orders;"\n}',
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
                                        <Input placeholder="e.g., Customer Orders API" {...field} />
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
                                    <FormLabel>NiFi Process Group</FormLabel>
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
                        <CardTitle>Source Configuration</CardTitle>
                        <CardDescription>Select a data source and provide the configuration in JSON format.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="HTTP" className="w-full" onValueChange={(val) => form.setValue('sourceType', val as FormValues['sourceType'])}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="HTTP"><Globe className="mr-2 h-4 w-4" />HTTP</TabsTrigger>
                                <TabsTrigger value="FILE"><FileText className="mr-2 h-4 w-4" />File</TabsTrigger>
                                <TabsTrigger value="DATABASE"><Database className="mr-2 h-4 w-4" />Database</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <FormField
                            control={form.control}
                            name="config"
                            render={({ field }) => (
                                <FormItem className="mt-6">
                                    <FormLabel>Configuration</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            key={sourceType}
                                            placeholder={configPlaceholders[sourceType]}
                                            className="min-h-[200px] font-mono text-sm"
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
                         <div className="mt-4 flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={handleValidate} disabled={isValidating}>
                                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Validate with AI
                            </Button>
                        </div>
                        {validationResult && (
                            <div className={cn("mt-4 flex items-start gap-3 rounded-lg border p-4", validationResult.isValid ? "border-green-600 bg-green-50" : "border-destructive bg-destructive/10")}>
                                {validationResult.isValid ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" /> : <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />}
                                <div className="flex-1">
                                    <p className={cn("font-semibold", validationResult.isValid ? "text-green-800" : "text-destructive")}>
                                        {validationResult.isValid ? "Configuration looks good!" : "Validation Issues Found"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{validationResult.feedback}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-6">
                        <Button type="button" variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                        <Button type="submit" disabled={isDeploying}>
                            {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deploy Pipeline
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
