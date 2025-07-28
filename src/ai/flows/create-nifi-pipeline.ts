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

export const CreateNifiPipelineInputSchema = z.object({
    name: z.string().describe('The name for the new process group.'),
    nifiProcessGroup: z.string().describe('The ID of the parent process group where the new group will be created.'),
});
export type CreateNifiPipelineInput = z.infer<typeof CreateNifiPipelineInputSchema>;

export const CreateNifiPipelineOutputSchema = z.object({
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

        const parentGroupId = input.nifiProcessGroup;
        const url = `${nifiApiUrl}/process-groups/${parentGroupId}/process-groups`;

        try {
            // NiFi APIs often require fetching the latest revision first to perform a subsequent write operation.
            // For simplicity in this example, we are skipping that and creating a process group which doesn't require revision.
            // A real implementation would require more complex state management.
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    component: {
                        name: input.name,
                        position: {
                            x: 0,
                            y: 0,
                        },
                    },
                    revision: {
                        version: 0,
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: `Successfully created NiFi process group "${data.component.name}" with ID: ${data.id}`,
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
