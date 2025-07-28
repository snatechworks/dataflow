import { z } from 'zod';

type BrickField = {
    label: string;
    placeholder: string;
    description: string;
    type?: 'input' | 'textarea';
};

type BrickConfig = {
    [key: string]: {
        description: string;
        fields: Record<string, BrickField>;
        schema: z.AnyZodObject;
        defaultValue: any;
        format: (properties: any) => string;
    }
};

export const brickConfig = {
    // Sources
    'HTTP': {
        description: "Listens for incoming HTTP POST requests on a specific path. This will trigger the pipeline.",
        fields: {
            path: { label: "Webhook Path", placeholder: "e.g., /webhooks/new-order", description: "The unique path that will trigger this pipeline." },
        },
        schema: z.object({
            path: z.string().min(1, 'Path is required').startsWith('/', "Path must start with '/'"),
        }),
        defaultValue: { type: 'HTTP', properties: { path: '/webhooks/new-data' } },
        format: (props) => `Path: "${props.path}"`,
    },
    'File': {
        description: "Watches a directory for new files to process. (Simulated)",
        fields: {
            path: { label: "Input Directory", placeholder: "e.g., /var/data/input", description: "The full path to the directory to watch." },
        },
        schema: z.object({
            path: z.string().min(1, "Path is required"),
        }),
        defaultValue: { type: 'File', properties: { path: '/var/data/input' } },
        format: (props) => `Directory: "${props.path}"`,
    },
    'Database': {
        description: "Queries a database for new or updated records.",
        fields: {
            query: { label: "SQL Query", placeholder: "e.g., SELECT * FROM orders WHERE updated_at > ?", description: "The SQL query to execute. Use '?' for incremental state.", type: 'textarea' },
            connectionString: { label: "Connection String", placeholder: "e.g., postgresql://user:pass@host:port/db", description: "Database connection URI." },
        },
        schema: z.object({
            query: z.string().min(1, "Query is required"),
            connectionString: z.string().min(1, "Connection string is required"),
        }),
        defaultValue: { type: 'Database', properties: { query: 'SELECT * FROM new_users', connectionString: '' } },
        format: (props) => `Query: "${props.query.substring(0, 50)}..."`,
    },
    // Transformations
    'CSV to JSON': {
        description: "Converts data from CSV format to JSON.",
        fields: {
            delimiter: { label: "Delimiter", placeholder: "e.g., ,", description: "The character separating columns." },
        },
        schema: z.object({
            delimiter: z.string().max(1).optional().default(','),
        }),
        defaultValue: { type: 'CSV to JSON', properties: { delimiter: ',' } },
        format: (props) => `Delimiter: "${props.delimiter}"`,
    },
    'XML to JSON': {
        description: "Converts data from XML format to JSON format.",
        fields: {},
        schema: z.object({}),
        defaultValue: { type: 'XML to JSON', properties: {} },
        format: () => `Standard XML to JSON conversion`,
    },
    'Excel to CSV': {
        description: "Converts spreadsheet data from an Excel file (.xlsx) to CSV format.",
        fields: {
            sheetName: { label: "Sheet Name (Optional)", placeholder: "e.g., Sheet1", description: "The name of the sheet to convert. Defaults to the first sheet." },
        },
        schema: z.object({
            sheetName: z.string().optional(),
        }),
        defaultValue: { type: 'Excel to CSV', properties: { sheetName: '' } },
        format: (props) => `Sheet: ${props.sheetName || 'First available'}`,
    },
    'Split JSON': {
        description: "Splits a single JSON object or array into multiple records using a JSONPath expression.",
        fields: {
            jsonPath: { label: "JSONPath Expression", placeholder: "e.g., $.customers[*]", description: "The JSONPath to select the elements to split." },
        },
        schema: z.object({
            jsonPath: z.string().min(1, "JSONPath is required").startsWith('$.', "JSONPath must start with '$.'"),
        }),
        defaultValue: { type: 'Split JSON', properties: { jsonPath: '$.[*]' } },
        format: (props) => `JSONPath: ${props.jsonPath}`,
    },
    'Add/Modify Fields': {
        description: "Adds, removes, or modifies fields in a JSON object. Provide a JSON object representing the modifications.",
        fields: {
            modificationSpec: { label: "Modification (JSON)", placeholder: '{\n  "new_field": "static_value",\n  "existing_field": "${original.field}"\n}', description: "JSON object detailing the changes.", type: 'textarea' },
        },
        schema: z.object({
            modificationSpec: z.string().min(1, "Modification spec is required"),
        }),
        defaultValue: { type: 'Add/Modify Fields', properties: { modificationSpec: '{\n  "processed_at": "${timestamp()}"\n}' } },
        format: (props) => `Spec: ${props.modificationSpec.substring(0, 100)}${props.modificationSpec.length > 100 ? '...' : ''}`,
    },
    'Merge Records': {
        description: "Merges multiple records into a single batch before sending to the sink.",
        fields: {
            batchSize: { label: "Batch Size", placeholder: "e.g., 1000", description: "The number of records to include in a batch." },
        },
        schema: z.object({
            batchSize: z.string().min(1, "Batch size is required").regex(/^\d+$/, 'Batch size must be a number.'),
        }),
        defaultValue: { type: 'Merge Records', properties: { batchSize: '1000' } },
        format: (props) => `Batch Size: ${props.batchSize}`,
    },
} satisfies BrickConfig;


export const sourceBrickTypes = ['HTTP', 'File', 'Database'] as const;
export const transformationBrickTypes = ['CSV to JSON', 'XML to JSON', 'Excel to CSV', 'Split JSON', 'Add/Modify Fields', 'Merge Records'] as const;
export const brickTypes = [...sourceBrickTypes, ...transformationBrickTypes];

export const getBrickConfig = (type: string | undefined) => {
    return type ? brickConfig[type as keyof typeof brickConfig] : undefined;
};
