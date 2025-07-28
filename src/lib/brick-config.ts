import { z } from 'zod';

type BrickField = {
    label: string;
    placeholder: string;
    description: string;
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
        description: "Listens for incoming HTTP requests on a specific port and path.",
        fields: {
            port: { label: "Listening Port", placeholder: "e.g., 8080", description: "The port number to listen on." },
            path: { label: "Path", placeholder: "e.g., /data", description: "The URL path to listen on." },
        },
        schema: z.object({
            port: z.string().min(1, 'Port is required'),
            path: z.string().min(1, 'Path is required'),
        }),
        defaultValue: { type: 'HTTP', properties: { port: '8080', path: '/data' } },
        format: (props) => `Port: ${props.port}\nPath: "${props.path}"`,
    },
    'File': {
        description: "Watches a directory for new files to process.",
        fields: {
            path: { label: "Input Directory", placeholder: "e.g., /var/data/input", description: "The full path to the directory to watch." },
        },
        schema: z.object({
            path: z.string().min(1, "Path is required"),
        }),
        defaultValue: { type: 'File', properties: { path: '/var/data/input' } },
        format: (props) => `Input Directory: "${props.path}"`,
    },
    'Database': {
        description: "Queries a database at regular intervals.",
        fields: {
            query: { label: "SQL Query", placeholder: "e.g., SELECT * FROM orders", description: "The SQL query to execute." },
            interval: { label: "Polling Interval", placeholder: "e.g., 5 minutes", description: "How often to run the query." },
        },
        schema: z.object({
            query: z.string().min(1, "Query is required"),
            interval: z.string().min(1, "Interval is required"),
        }),
        defaultValue: { type: 'Database', properties: { query: 'SELECT * FROM orders', interval: '5 minutes' } },
        format: (props) => `Query: "${props.query}"\nInterval: ${props.interval}`,
    },
    // Transformations
    'CSV to JSON': {
        description: "Converts data from CSV format to JSON format. Provide high-level instructions.",
        fields: {
            options: { label: "Conversion Options", placeholder: "e.g., Use first line as header", description: "Instructions for the CSV conversion (e.g., 'Use first line as header', 'Ignore comments starting with #')." },
        },
        schema: z.object({
            options: z.string().optional(),
        }),
        defaultValue: { type: 'CSV to JSON', properties: { options: 'Use first line as header' } },
        format: (props) => `Options: ${props.options || 'Default'}`,
    },
    'XML to JSON': {
        description: "Converts data from XML format to JSON format. You can provide an XSLT for complex transformations.",
        fields: {
            options: { label: "XSLT or Options", placeholder: "e.g., Paste XSLT here or describe conversion", description: "For simple cases, AI will infer the transformation. For complex cases, provide an XSLT." },
        },
        schema: z.object({
            options: z.string().optional(),
        }),
        defaultValue: { type: 'XML to JSON', properties: { options: '' } },
        format: (props) => `Options: ${props.options ? 'Custom XSLT/Options provided' : 'Default behavior'}`,
    },
    'Excel to CSV': {
        description: "Converts spreadsheet data from an Excel file to CSV format. The AI will generate a script to handle this.",
        fields: {
            sheetName: { label: "Sheet Name", placeholder: "e.g., Sheet1", description: "The name of the Excel sheet to process." },
        },
        schema: z.object({
            sheetName: z.string().min(1, "Sheet name is required"),
        }),
        defaultValue: { type: 'Excel to CSV', properties: { sheetName: 'Sheet1' } },
        format: (props) => `Sheet Name: "${props.sheetName}"`,
    },
    'Split JSON': {
        description: "Splits a single JSON object or array into multiple FlowFiles using a JSONPath expression.",
        fields: {
            jsonPath: { label: "JSONPath Expression", placeholder: "e.g., $.customers[*]", description: "The JSONPath to select the elements to split." },
        },
        schema: z.object({
            jsonPath: z.string().min(1, "JSONPath is required"),
        }),
        defaultValue: { type: 'Split JSON', properties: { jsonPath: '$.customers[*]' } },
        format: (props) => `JSONPath: ${props.jsonPath}`,
    },
    'Add/Modify Fields': {
        description: "Uses a JOLT specification to transform the JSON structure. Describe the change you want or provide a full JOLT spec.",
        fields: {
            joltSpec: { label: "JOLT Specification or Description", placeholder: "e.g., Add a new 'fullName' field by combining 'firstName' and 'lastName'", description: "The AI can generate the JOLT spec from a high-level description." },
        },
        schema: z.object({
            joltSpec: z.string().min(1, "JOLT spec or description is required"),
        }),
        defaultValue: { type: 'Add/Modify Fields', properties: { joltSpec: '' } },
        format: (props) => `Spec: ${props.joltSpec.substring(0, 100)}${props.joltSpec.length > 100 ? '...' : ''}`,
    },
    'Merge Records': {
        description: "Merges multiple records into a single batch based on size.",
        fields: {
            batchSize: { label: "Batch Size", placeholder: "e.g., 1000", description: "The number of records to include in each batch." },
        },
        schema: z.object({
            batchSize: z.string().min(1, "Batch size is required"),
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
