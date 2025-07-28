'use server';

/**
 * @fileOverview A flow for creating a NiFi process group.
 *
 * - createNifiPipeline - A function that creates a NiFi process group.
 * - CreateNifiPipelineInput - The input type for the createNifiPipeline function.
 * - CreateNifiPipelineOutput - The return type for the createNifiPipeline function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateNifiPipelineInputSchema = z.object({
    name: z.string().describe('The name for the new process group.'),
    nifiProcessGroup: z.string().describe('The ID of the parent process group where the new group will be created.'),
    flowDefinition: z.string().describe('A JSON string representing the full flow definition, including source, processors, and sink.'),
    sourceType: z.string().describe('The type of data source (e.g., HTTP, File, Database).'),
    sink: z.object({
        type: z.string().describe("The type of data sink (e.g., 'Elasticsearch')."),
        properties: z.record(z.any()).describe("A map of sink properties (e.g., URL, index name)."),
    }).describe('The configuration for the data destination.'),
});
export type CreateNifiPipelineInput = z.infer<typeof CreateNifiPipelineInputSchema>;

const CreateNifiPipelineOutputSchema = z.object({
    success: z.boolean().describe('Whether the process group was created successfully.'),
    message: z.string().describe('A message indicating the result of the operation.'),
});
export type CreateNifiPipelineOutput = z.infer<typeof CreateNifiPipelineOutputSchema>;

export async function createNifiPipeline(input: CreateNifiPipelineInput): Promise<CreateNifiPipelineOutput> {
    return createNifiPipelineFlow(input);
}

const createNifiPipelineFlow = ai.defineFlow(
    {
        name: 'createNifiPipelineFlow',
        inputSchema: CreateNifiPipelineInputSchema,
        outputSchema: CreateNifiPipelineOutputSchema,
    },
    async (input) => {
        const nifiApiUrl = process.env.NIFI_API_URL;
        if (!nifiApiUrl) {
            return {
                success: false,
                message: 'NIFI_API_URL is not configured in the environment.',
            };
        }

        // For this simplified version, we are creating a single process group
        // and storing the user-defined flow in the comments. A full implementation
        // would require a client-side NiFi topology builder to create and connect
        // each processor based on the flowDefinition.

        const parentGroupId = input.nifiProcessGroup;
        const url = `${nifiApiUrl}/process-groups/${parentGroupId}/process-groups`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    component: {
                        name: input.name,
                        position: { x: 0, y: 0 },
                        comments: `High-level flow definition:\n\n${input.flowDefinition}`
                    },
                    revision: { version: 0 },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: `Successfully created placeholder NiFi process group "${data.component.name}" with ID: ${data.id}. The full flow definition has been added to the process group comments.`,
                };
            } else {
                const errorText = await response.text();
                return {
                    success: false,
                    message: `Failed to create NiFi process group. Status: ${response.status}. Details: ${errorText}`,
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: `An error occurred while communicating with NiFi: ${error.message}`,
            };
        }
    }
);