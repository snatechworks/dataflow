'use server';
/**
 * @fileOverview Translates a high-level flow definition into a NiFi-specific processor configuration.
 *
 * - translateFlowToNifi - A function that performs the translation.
 * - TranslateFlowToNifiInput - The input type for the translateFlowToNifi function.
 * - TranslateFlowToNifiOutput - The return type for the translateFlowToNifi function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NifiProcessorSchema = z.object({
  type: z.string().describe("The specific NiFi Processor type (e.g., 'GetHTTP', 'JoltTransformJSON')."),
  name: z.string().describe("A descriptive name for the processor instance."),
  properties: z.record(z.any()).describe("A map of NiFi processor properties and their values."),
});

const TranslateFlowToNifiInputSchema = z.object({
  flowDefinition: z.string().describe('The high-level flow definition as a JSON string, containing an array of abstract processors (bricks).'),
  sourceType: z.string().describe('The type of data source (e.g., HTTP, File, Database).'),
});
export type TranslateFlowToNifiInput = z.infer<typeof TranslateFlowToNifiInputSchema>;

const TranslateFlowToNifiOutputSchema = z.object({
  processors: z.array(NifiProcessorSchema).describe('An array of NiFi processors with their configurations.'),
});
export type TranslateFlowToNifiOutput = z.infer<typeof TranslateFlowToNifiOutputSchema>;


export async function translateFlowToNifi(input: TranslateFlowToNifiInput): Promise<TranslateFlowToNifiOutput> {
  return translateFlowToNifiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateFlowToNifiPrompt',
  input: { schema: TranslateFlowToNifiInputSchema },
  output: { schema: TranslateFlowToNifiOutputSchema },
  prompt: `You are an expert Apache NiFi architect. Your task is to translate a high-level, abstract data flow definition (composed of "bricks") into a concrete, executable NiFi processor configuration.

You will be given a JSON object describing the flow and the initial source type.

**Bricks and their NiFi equivalents:**

*   **Source (`sourceType` parameter):**
    *   'HTTP': Start with a \`GetHTTP\` processor.
    *   'FILE': Start with a \`GetFile\` processor.
    *   'DATABASE': Start with a \`QueryDatabaseRecord\` processor.
*   **'CSV to JSON':** Use a \`ConvertRecord\` processor. You will need to define CSVReader and JSONRecordSetWriter controller services. For this task, create placeholder service IDs like \`csv-reader-service\` and \`json-writer-service\`.
*   **'Split JSON':** Use a \`SplitJson\` processor. The user will provide a JsonPath expression in the brick's properties.
*   **'Add/Modify Fields':** Use a \`JoltTransformJSON\` processor. The user will provide a JOLT specification in the brick's properties. Generate a valid JOLT spec based on their request (e.g., to define a URI or add fields). For defining a URI, you can use NiFi Expression Language like "\${http.request.uri}/\${json.id}".
*   **'Merge Records':** Use a \`MergeRecord\` processor. The user may specify a batch size. You'll need reader/writer services here as well.

**Your Task:**

1.  Analyze the incoming \`flowDefinition\` JSON.
2.  Create an initial "Get" processor based on the \`sourceType\`.
3.  For each "brick" in the definition, create the corresponding one or more NiFi processors.
4.  Pay close attention to the \`properties\` of each brick to configure the NiFi processors correctly. For Jolt transformations, you must generate the JOLT specification based on the user's plain-text request in the properties.
5.  Generate a descriptive name for each processor instance (e.g., "Split Customer Records").
6.  Return a final JSON object containing an array of fully-configured NiFi processors.

Source Type: {{{sourceType}}}
High-Level Flow Definition:
\`\`\`json
{{{flowDefinition}}}
\`\`\`
`,
});

const translateFlowToNifiFlow = ai.defineFlow(
  {
    name: 'translateFlowToNifiFlow',
    inputSchema: TranslateFlowToNifiInputSchema,
    outputSchema: TranslateFlowToNifiOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("Failed to get a translated output from the AI model.");
    }
    return output;
  }
);
