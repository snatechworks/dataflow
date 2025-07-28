'use server';

/**
 * @fileOverview A flow for creating a NiFi process group and all required components from a translated flow definition.
 *
 * - createNifiPipeline - A function that creates a NiFi process group and its components.
 * - CreateNifiPipelineInput - The input type for the createNifiPipeline function.
 * - CreateNifiPipelineOutput - The return type for the createNifiPipeline function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateNifiPipelineInputSchema = z.object({
    name: z.string().describe('The name for the new process group.'),
    nifiProcessGroup: z.string().describe('The ID of the parent process group where the new group will be created.'),
    translatedFlow: z.string().describe('A JSON string representing the full, translated NiFi flow definition, including processors and controller services.'),
});
export type CreateNifiPipelineInput = z.infer<typeof CreateNifiPipelineInputSchema>;

const CreateNifiPipelineOutputSchema = z.object({
    success: z.boolean().describe('Whether the process group and components were created successfully.'),
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
        // This flow would contain the complex logic to interact with the NiFi API.
        // For this example, we'll simulate the creation process.
        // A real implementation would require a series of API calls to:
        // 1. Create the process group.
        // 2. Create each controller service within the group.
        // 3. Create each processor within the group.
        // 4. Connect all the processors in the correct sequence.
        // 5. Enable controller services and start the processors.
        
        const nifiApiUrl = process.env.NIFI_API_URL;
        if (!nifiApiUrl) {
            return {
                success: false,
                message: 'NIFI_API_URL is not configured in the environment.',
            };
        }

        try {
            const flow = JSON.parse(input.translatedFlow);
            const numProcessors = flow.processors?.length || 0;
            const numServices = flow.controllerServices?.length || 0;

            // Simulate creating the main process group
            const processGroupResponse = {
                id: `pg-` + Math.random().toString(36).substring(7),
                component: { name: input.name }
            };

            return {
                success: true,
                message: `Successfully created placeholder NiFi process group "${processGroupResponse.component.name}" with ID: ${processGroupResponse.id}. The translated flow includes ${numProcessors} processors and ${numServices} controller services. A real implementation would now create and connect these components.`,
            };

        } catch (error: any) {
            return {
                success: false,
                message: `An error occurred during the simulated NiFi deployment: ${error.message}. Check if the translated flow is valid JSON.`,
            };
        }
    }
);
