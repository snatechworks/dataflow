'use server';

/**
 * @fileOverview Validates pipeline configurations using AI to provide immediate feedback.
 *
 * - validateConfiguration - A function that validates the configuration.
 * - ValidateConfigurationInput - The input type for the validateConfiguration function.
 * - ValidateConfigurationOutput - The return type for the validateConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateConfigurationInputSchema = z.object({
  configuration: z.string().describe('The NiFi flow configuration as a JSON string, containing an array of processors.'),
  sourceType: z.string().describe('The type of data source (e.g., HTTP, File, Database).'),
});
export type ValidateConfigurationInput = z.infer<typeof ValidateConfigurationInputSchema>;

const ValidateConfigurationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the configuration is valid or not.'),
  feedback: z.string().describe('Feedback on the configuration, including potential issues, correctness of processor properties, and flow logic.'),
});
export type ValidateConfigurationOutput = z.infer<typeof ValidateConfigurationOutputSchema>;

export async function validateConfiguration(input: ValidateConfigurationInput): Promise<ValidateConfigurationOutput> {
  return validateConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateConfigurationPrompt',
  input: {schema: ValidateConfigurationInputSchema},
  output: {schema: ValidateConfigurationOutputSchema},
  prompt: `You are an AI expert in Apache NiFi data pipeline configurations.

You will receive a pipeline configuration as a JSON string and the primary source type. The JSON contains a "processors" array, where each object has a "type" and "properties" (as a JSON string).

Your task is to validate the entire flow configuration. Check for:
1.  **Logical Flow**: Does the sequence of processors make sense? (e.g., a Get processor should be at or near the beginning).
2.  **Processor Properties**: Are the properties for each processor type plausible? You don't need to know every valid property, but check for common mistakes (e.g., a GetHTTP processor should have a URL property).
3.  **JSON Validity**: Is the properties string for each processor valid JSON?
4.  **Completeness**: Is the flow likely to be functional? Does it handle data ingress and egress logically?

Based on your analysis, determine if the overall configuration is valid and set the \`isValid\` output field. Provide detailed, constructive feedback in the \`feedback\` field, explaining any issues found and suggesting improvements. Be specific in your feedback.

Source Type: {{{sourceType}}}
Configuration:
\`\`\`json
{{{configuration}}}
\`\`\`
`,
});

const validateConfigurationFlow = ai.defineFlow(
  {
    name: 'validateConfigurationFlow',
    inputSchema: ValidateConfigurationInputSchema,
    outputSchema: ValidateConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
