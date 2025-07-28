'use server';

/**
 * @fileOverview Validates and translates a high-level pipeline configuration into a NiFi-specific flow.
 *
 * - validateConfiguration - A function that validates and translates the configuration.
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
  translatedFlow: z.string().optional().describe('The translated, NiFi-specific JSON configuration for the entire flow if validation is successful.'),
});
export type ValidateConfigurationOutput = z.infer<typeof ValidateConfigurationOutputSchema>;

export async function validateConfiguration(input: ValidateConfigurationInput): Promise<ValidateConfigurationOutput> {
  return validateConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateAndTranslateConfigurationPrompt',
  input: {schema: ValidateConfigurationInputSchema},
  output: {schema: ValidateConfigurationOutputSchema},
  prompt: `You are an AI expert in Apache NiFi data pipelines. Your task is to act as both a validator and a translator. You will receive a high-level flow definition using abstract "bricks", a source type, and a sink configuration.

**Your two primary goals are:**
1.  **Validate the Flow:** Check the logical sequence of bricks. Does the flow make sense? (e.g., you can't split JSON before converting the source data to JSON). Are the properties for each brick plausible?
2.  **Translate to NiFi JSON:** If the flow is valid, you MUST translate the entire high-level definition into a detailed, executable NiFi JSON structure. This structure will be used to create processors and controller services via the NiFi API.

**Validation Logic:**
*   Analyze the sequence of bricks. A common mistake is trying to process JSON before the data is in JSON format. For example, if the source is CSV, a 'CSV to JSON' brick must appear before a 'Split JSON' brick.
*   Check the properties for each brick for any obvious errors or inconsistencies.
*   Based on your analysis, set \`isValid\` to \`true\` or \`false\`.
*   Provide detailed, constructive feedback in the \`feedback\` field. If invalid, explain exactly why. If valid, confirm that the logic is sound.

**NiFi Translation Rules (VERY IMPORTANT):**
If \`isValid\` is \`true\`, you MUST populate the \`translatedFlow\` field with a JSON string. This JSON should contain two keys: \`processors\` and \`controllerServices\`.

**Bricks and their NiFi Equivalents:**

*   **Source (\`sourceType\` parameter):**
    *   'HTTP': Creates one processor: \`GetHTTP\`. The brick's \`port\` property maps to \`Listen Port\`, and \`path\` maps to \`Base Path\`.
    *   'File': Creates one processor: \`GetFile\`. The brick's \`path\` property maps to \`Input Directory\`.
    *   'Database': Creates one processor: \`QueryDatabaseRecord\`. The brick's \`query\` property maps to the processor's \`SQL select query\` property. It will also require a \`DBCPConnectionPool\` controller service. Generate a default one and link it.

*   **Transformation Bricks (\`flowDefinition.processors\` array):**
    *   'CSV to JSON': Creates one processor: \`ConvertRecord\`. This requires two controller services: a \`CSVReader\` and a \`JSONRecordSetWriter\`. You must generate the configurations for these services and link them to the processor.
    *   'XML to JSON': Creates one processor: \`TransformXml\`. The brick's \`xslt\` property maps to the \`XSLT file content\` property.
    *   'Excel to CSV': Creates one processor: \`ExecuteScript\`. Use the brick's \`script\` property as the \`Script Body\`. The script should be written in Groovy and use the Apache POI library to convert Excel to CSV.
    *   'Split JSON': Creates one processor: \`SplitJson\`. The brick's \`jsonPath\` property maps to \`JsonPath Expression\`.
    *   'Add/Modify Fields': Creates one processor: \`JoltTransformJSON\`. The brick's \`joltSpec\` property maps to the \`Jolt Specification\` property.
    *   'Merge Records': Creates one processor: \`MergeRecord\`. The brick's \`batchSize\` property maps to the \`Minimum Number of Records\` property.

*   **Sink (\`sink\` parameter):**
    *   'Elasticsearch': This is the final step. Create a \`PutElasticsearchHttp\` processor.
    *   This processor requires an \`ElasticSearchClientService\`. You must generate a new controller service of type \`ElasticSearchClientServiceImpl\`.
    *   The sink's \`elasticsearchUrl\` property maps to the \`Elasticsearch URL\` property in the client service.
    *   The sink's \`index\` property maps to the \`Index\` property in the \`PutElasticsearchHttp\` processor itself.
    *   The \`user\` and \`password\` properties map to the client service's username and password properties.

**Example Output Structure for \`translatedFlow\`:**
\`\`\`json
{
  "processors": [
    { "type": "GetHTTP", "name": "Ingest from HTTP", "properties": { "Listen Port": "8080", "Base Path": "/data" } },
    { "type": "SplitJson", "name": "Split Records", "properties": { "JsonPath Expression": "$.records[*]" } },
    { "type": "PutElasticsearchHttp", "name": "Send to ES", "properties": { "Index": "my-data-index", "Elastic Search Client Service": "es-client-service-1" } }
  ],
  "controllerServices": [
    { "type": "ElasticSearchClientServiceImpl", "name": "es-client-service-1", "properties": { "Elasticsearch URL": "http://localhost:9200", "Username": "user", "Password": "password" } }
  ]
}
\`\`\`

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
    return result.output;
  }
);
