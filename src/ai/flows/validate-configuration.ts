'use server';

/**
 * @fileOverview Validates a high-level pipeline configuration using AI.
 *
 * - validateConfiguration - A function that validates the configuration.
 * - ValidateConfigurationInput - The input type for the validateConfiguration function.
 * - ValidateConfigurationOutput - The return type for the validateConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  name: 'validatePipelineLogicPrompt',
  input: {schema: ValidateConfigurationInputSchema},
  output: {schema: ValidateConfigurationOutputSchema},
  prompt: `You are an AI expert in data processing pipelines. Your task is to validate a high-level flow definition.

You will receive a flow definition using abstract "bricks", a source type, and a sink configuration.

Your only goal is to **Validate the Flow Logic**. Check the logical sequence of bricks. Does the flow make sense? For example, you can't split JSON before converting the source data to JSON. Are the properties for each brick plausible for that type of operation?

**Validation Logic:**
*   Analyze the sequence of bricks. A common mistake is trying to process data in one format when it's actually in another. For example, if the source is CSV, a 'CSV to JSON' brick must appear before a 'Split JSON' brick.
*   Check the properties for each brick for any obvious logical errors.
*   Based on your analysis, set \`isValid\` to \`true\` or \`false\`.
*   Provide detailed, constructive feedback in the \`feedback\` field. If invalid, explain exactly why. If valid, confirm that the logic is sound.

**You are NOT translating or executing anything. You are only providing feedback on the logical structure.**

---
**User's Configuration to Analyze:**

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
    const result = await prompt(input);
    if (!result.output) {
      return {
        isValid: false,
        feedback: "The AI validator failed to return a result. Please check the configuration."
      }
    }
    // Since we are not translating, we remove the translatedFlow property.
    const { translatedFlow, ...output } = result.output as any;
    return output;
  }
);
