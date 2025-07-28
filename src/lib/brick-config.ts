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
            query: { label: "SQL Query", placeholder: "e.g., SELECT * FROM orders", description: "The SQL query to execute.", type: 'textarea' },
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
        description: "Converts data from CSV format to JSON format. You must configure a CSVReader and a JSONRecordSetWriter controller service in NiFi.",
        fields: {
            'reader-service-id': { label: "CSV Reader Service ID", placeholder: "e.g., csv-reader-service", description: "The ID of your pre-configured CSVReader Controller Service in NiFi." },
            'writer-service-id': { label: "JSON Writer Service ID", placeholder: "e.g., json-writer-service", description: "The ID of your pre-configured JSONRecordSetWriter Controller Service in NiFi." },
        },
        schema: z.object({
            'reader-service-id': z.string().min(1, 'Reader Service ID is required'),
            'writer-service-id': z.string().min(1, 'Writer Service ID is required'),
        }),
        defaultValue: { type: 'CSV to JSON', properties: { 'reader-service-id': 'csv-reader-service', 'writer-service-id': 'json-writer-service' } },
        format: (props) => `Reader: ${props['reader-service-id']}\nWriter: ${props['writer-service-id']}`,
    },
    'XML to JSON': {
        description: "Converts data from XML format to JSON format using an XSLT transformation.",
        fields: {
            xslt: { label: "XSLT Content", placeholder: "e.g., <xsl:stylesheet ...>", description: "The full XSLT stylesheet content for the transformation.", type: 'textarea' },
        },
        schema: z.object({
            xslt: z.string().optional(),
        }),
        defaultValue: { type: 'XML to JSON', properties: { xslt: '' } },
        format: (props) => `Options: ${props.xslt ? 'Custom XSLT provided' : 'Default behavior'}`,
    },
    'Excel to CSV': {
        description: "Converts spreadsheet data from an Excel file to CSV format. This typically requires a script (e.g., Groovy) in an ExecuteScript processor.",
        fields: {
            script: { label: "Groovy Script", placeholder: "e.g., import org.apache.poi...", description: "The full Groovy script content to perform the conversion.", type: 'textarea' },
        },
        schema: z.object({
            script: z.string().min(1, "Script is required"),
        }),
        defaultValue: { type: 'Excel to CSV', properties: { script: '' } },
        format: (props) => `Script: ${props.script ? 'Provided' : 'Not Provided'}`,
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
        description: "Uses a JOLT specification to transform the JSON structure. You must provide the full JOLT spec.",
        fields: {
            joltSpec: { label: "JOLT Specification", placeholder: "e.g., [{...}]", description: "The full JOLT specification JSON.", type: 'textarea' },
        },
        schema: z.object({
            joltSpec: z.string().min(1, "JOLT spec is required"),
        }),
        defaultValue: { type: 'Add/Modify Fields', properties: { joltSpec: '' } },
        format: (props) => `Spec: ${props.joltSpec.substring(0, 100)}${props.joltSpec.length > 100 ? '...' : ''}`,
    },
    'Merge Records': {
        description: "Merges multiple records into a single batch based on size.",
        fields: {
            batchSize: { label: "Minimum Records", placeholder: "e.g., 1000", description: "The minimum number of records to include in a batch." },
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