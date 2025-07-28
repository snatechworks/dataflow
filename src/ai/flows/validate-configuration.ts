'use server';

/**
 * @fileOverview Validates high-level pipeline configurations using AI.
 *
 * - validateConfiguration - A function that validates the configuration.
 * - ValidateConfigurationInput - The input type for the validateConfiguration function.
 * - ValidateConfigurationOutput - The return type for the validateConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { translateFlowToNifi, type TranslateFlowToNifiInput } from './translate-flow-to-nifi';

const ValidateConfigurationInputSchema = z.object({
  flowDefinition: z.string().describe('The high-level flow definition as a JSON string, containing an array of abstract processors (bricks) with their structured properties.'),
  sourceType: z.string().describe('The type of data source (e.g., HTTP, File, Database).'),
  sink: z.object({
    type: z.string().describe("The type of data sink (e.g., 'Elasticsearch')."),
    properties: z.record(z.any()).describe("A map of sink properties (e.g., URL, index name)."),
  }).describe('The configuration for the data destination.'),
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
  prompt: `You are an AI expert in data pipeline configurations. You will receive a high-level flow definition using abstract "bricks", a source type, and a sink type. Each brick has structured properties instead of free-form text.

Your task is to validate this high-level flow. Check for:
1.  **Logical Flow**: Does the sequence of bricks make sense? (e.g., you can't split JSON before you've converted a source like CSV or XML to JSON). Is there a sensible path from the source to the sink?
2.  **Brick Properties**: Are the properties for each brick plausible and correctly structured? For example, a Split JSON brick should have a 'jsonPath' property.
3.  **Completeness**: Is the flow likely to be functional? Does it handle data ingress, transformation, and egress logically?

Based on your analysis, determine if the overall configuration is valid and set the \`isValid\` output field. Provide detailed, constructive feedback in the \`feedback\` field, explaining any issues found and suggesting improvements. Be specific.

Source Type: {{{sourceType}}}
High-Level Flow Definition (Bricks and their properties):
\`\`\`json
{{{flowDefinition}}}
\`\`\`
Sink Definition:
\`\`\`json
{{{sink}}}
\`\`\`
`,
});

const validateConfigurationFlow = ai.defineFlow(
  {
    name: 'validateConfigurationFlow',
    inputSchema: ValidateConfigurationInputSchema,
    outputSchema: ValidateConfigurationOutputSchema,
  },
  async (input) => {
    // First, do a logical check of the high-level flow.
    const logicalValidation = await prompt(input);
    if (!logicalValidation.output?.isValid) {
      return logicalValidation.output!;
    }
    
    // If the logic seems okay, try to translate it to a concrete NiFi configuration.
    try {
        const translateInput: TranslateFlowToNifiInput = {
            flowDefinition: input.flowDefinition,
            sourceType: input.sourceType,
            sink: input.sink,
        };
        await translateFlowToNifi(translateInput);

        // If translation is successful, return the positive feedback from the initial validation.
        return {
          isValid: true,
          feedback: logicalValidation.output.feedback,
        }

    } catch (error: any) {
        // If translation fails, it indicates a problem with the high-level definition.
        return {
            isValid: false,
            feedback: `The flow logic seems plausible, but it failed to be translated into a concrete NiFi plan. This usually means there is a subtle error in the properties or flow structure. \n\nTranslation Error: ${error.message}`,
        };
    }
  }
);
