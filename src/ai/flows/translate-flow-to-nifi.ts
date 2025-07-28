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
  flowDefinition: z.string().describe('The high-level flow definition as a JSON string, containing an array of abstract processors (bricks) and their structured properties.'),
  sourceType: z.string().describe('The type of data source (e.g., HTTP, File, Database).'),
  sink: z.object({
    type: z.string().describe("The type of data sink (e.g., 'Elasticsearch')."),
    properties: z.record(z.any()).describe("A map of sink properties (e.g., URL, index name)."),
  }).describe('The configuration for the data destination.'),
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
  prompt: `You are an expert Apache NiFi architect. Your task is to translate a high-level, abstract data flow definition (composed of "bricks" with structured properties) into a concrete, executable NiFi processor configuration. You will be given a JSON object describing the source, the flow, and the sink.

**Context:**
- The goal is to create a full end-to-end data pipeline in NiFi.
- You must generate ALL necessary processors, from the source to the sink.
- Connections between processors are implied by the order in the array. You don't need to model the connections, just the processors in the correct sequence.
- Controller Services (like for database connections or record readers/writers) are critical. You must generate configurations for them. For IDs, create descriptive, unique placeholders like \`csv-reader-service\`, \`json-writer-service\`, or \`elasticsearch-dbcp-service\`.

**High-Level Bricks and NiFi Equivalents (Based on their structured properties):**

*   **Source (\`sourceType\` parameter):**
    *   'HTTP': Start with a \`ListenHTTP\` processor. Use the 'port' and 'path' properties.
    *   'File': Start with a \`GetFile\` processor. Use the 'path' property for the 'Input Directory'.
    *   'Database': Start with a \`QueryDatabaseRecord\` processor. Use the 'query' and 'interval' properties. You MUST also define a DBCPConnectionPool controller service.
*   **Transformation Bricks (\`flowDefinition\`):**
    *   'CSV to JSON': Use a \`ConvertRecord\` processor. You must define a \`CSVReader\` and a \`JSONRecordSetWriter\` controller service. Use the brick's 'options' property (e.g., "Use first line as header") to configure the reader.
    *   'XML to JSON': Use a \`TransformXml\` processor. The user may provide an XSLT in the 'options' property. If not, create a basic XSLT for a simple conversion.
    *   'Excel to CSV': This is complex. Use an \`ExecuteScript\` processor. The 'sheetName' property is provided. Generate a Groovy script that uses Apache POI to read the specified Excel sheet and write CSV to the flowfile content. Assume Apache POI JARs are on the classpath.
    *   'Split JSON': Use a \`SplitJson\` processor. Use the 'jsonPath' property for the 'JsonPath Expression'.
    *   'Add/Modify Fields': Use a \`JoltTransformJSON\` processor. The 'joltSpec' property contains a high-level request or a full spec. Generate a valid JOLT spec based on their request.
    *   'Merge Records': Use a \`MergeRecord\` processor. Use the 'batchSize' property to configure it. This also needs reader/writer services.
*   **Sink (\`sink\` parameter):**
    *   'Elasticsearch': The final step must be a \`PutElasticsearchHttp\` processor.
        *   You must also define a \`StandardElasticsearchClientService\` controller service.
        *   Use the properties from the sink configuration (e.g., \`elasticsearchUrl\`, \`index\`, \`user\`, \`password\`) to configure both the processor and the client service.

**Your Task:**

1.  Analyze the incoming source, flow (with structured properties), and sink definitions.
2.  Create an initial processor based on the \`sourceType\`.
3.  For each "brick" in the \`flowDefinition\`, create the corresponding one or more NiFi processors, using its structured properties to set the NiFi configuration values.
4.  Create the final "sink" processor based on the \`sink.type\`.
5.  Pay close attention to the properties of each brick to configure the NiFi processors correctly. For Jolt transformations or Scripts, you must generate the required code/spec.
6.  For any processor requiring a Controller Service, create a separate configuration block for that service.
7.  Generate a descriptive name for each processor and service instance.
8.  Return a final JSON object containing a single array of all fully-configured NiFi processors AND controller services.

Source Type: {{{sourceType}}}
High-Level Flow Definition:
\`\`\`json
{{{flowDefinition}}}
\`\`\`
Sink Definition:
\`\`\`json
{{{sink}}}
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
