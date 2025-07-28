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
        description: "Listens for incoming HTTP requests on a specific port and path. NiFi's GetHTTP processor will be used.",
        fields: {
            port: { label: "Listening Port", placeholder: "e.g., 8080", description: "The port number to listen on." },
            path: { label: "Base Path", placeholder: "e.g., /data", description: "The URL base path to listen on." },
        },
        schema: z.object({
            port: z.string().min(1, 'Port is required').regex(/^\d+$/, 'Port must be a number.'),
            path: z.string().min(1, 'Path is required').startsWith('/', "Path must start with '/'"),
        }),
        defaultValue: { type: 'HTTP', properties: { port: '8080', path: '/data' } },
        format: (props) => `Port: ${props.port}\nPath: "${props.path}"`,
    },
    'File': {
        description: "Watches a directory for new files to process. NiFi's GetFile processor will be used.",
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
        description: "Queries a database at regular intervals. NiFi's QueryDatabaseRecord will be used.",
        fields: {
            query: { label: "SQL Query", placeholder: "e.g., SELECT * FROM orders WHERE updated_at > ?", description: "The SQL query to execute. Use '?' for incremental state.", type: 'textarea' },
            interval: { label: "Polling Interval", placeholder: "e.g., 5 minutes", description: "How often to run the query (e.g., 60 sec, 5 min)." },
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
        description: "Converts data from CSV format to JSON. This will create a ConvertRecord processor with CSVReader and JSONRecordSetWriter services.",
        fields: {
            'csv-reader-config': { label: "CSV Reader Config (JSON)", placeholder: 'e.g., {"schema-access-strategy": "infer-schema"}', description: 'JSON configuration for the CSVReader controller service.', type: 'textarea'},
        },
        schema: z.object({
            'csv-reader-config': z.string().optional(),
        }),
        defaultValue: { type: 'CSV to JSON', properties: { 'csv-reader-config': '{\n  "schema-access-strategy": "infer-schema",\n  "header-derived-schema": "true"\n}' } },
        format: (props) => `Uses a dynamically configured CSVReader and JSONRecordSetWriter.`,
    },
    'XML to JSON': {
        description: "Converts data from XML format to JSON format using an XSLT transformation. NiFi's TransformXml processor will be used.",
        fields: {
            xslt: { label: "XSLT Content", placeholder: "Leave empty for default XML-to-JSON, or provide a custom XSLT.", description: "The full XSLT stylesheet content for the transformation.", type: 'textarea' },
        },
        schema: z.object({
            xslt: z.string().optional(),
        }),
        defaultValue: { type: 'XML to JSON', properties: { xslt: '' } },
        format: (props) => `Options: ${props.xslt ? 'Custom XSLT provided' : 'Default NiFi XML to JSON'}`,
    },
    'Excel to CSV': {
        description: "Converts spreadsheet data from an Excel file (.xlsx) to CSV format. This requires a custom script in an ExecuteScript processor.",
        fields: {
            script: { label: "Groovy Script (Optional)", placeholder: "Leave empty to use a default Apache POI-based script.", description: "The full Groovy script content to perform the conversion.", type: 'textarea' },
        },
        schema: z.object({
            script: z.string().optional(),
        }),
        defaultValue: { type: 'Excel to CSV', properties: { script: '' } },
        format: (props) => `Script: ${props.script ? 'Custom script provided' : 'Default Excel script'}`,
    },
    'Split JSON': {
        description: "Splits a single JSON object or array into multiple FlowFiles using a JSONPath expression. NiFi's SplitJson processor will be used.",
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
        description: "Uses a JOLT specification to transform the JSON structure. NiFi's JoltTransformJSON processor will be used.",
        fields: {
            joltSpec: { label: "JOLT Specification", placeholder: '[{\n  "operation": "shift",\n  "spec": { ... }\n}]', description: "The full JOLT specification JSON.", type: 'textarea' },
        },
        schema: z.object({
            joltSpec: z.string().min(1, "JOLT spec is required"),
        }),
        defaultValue: { type: 'Add/Modify Fields', properties: { joltSpec: '' } },
        format: (props) => `Spec: ${props.joltSpec.substring(0, 100)}${props.joltSpec.length > 100 ? '...' : ''}`,
    },
    'Merge Records': {
        description: "Merges multiple records into a single batch based on size. NiFi's MergeRecord processor will be used.",
        fields: {
            batchSize: { label: "Minimum Records", placeholder: "e.g., 1000", description: "The minimum number of records to include in a batch." },
            maxBinAge: { label: "Max Bin Age", placeholder: "e.g., 30 sec", description: "The maximum age of a bin before it is flushed." },
        },
        schema: z.object({
            batchSize: z.string().min(1, "Batch size is required").regex(/^\d+$/, 'Batch size must be a number.'),
            maxBinAge: z.string().optional(),
        }),
        defaultValue: { type: 'Merge Records', properties: { batchSize: '1000', maxBinAge: '30 sec' } },
        format: (props) => `Min Records: ${props.batchSize}\nMax Age: ${props.maxBinAge || 'Not set'}`,
    },
} satisfies BrickConfig;


export const sourceBrickTypes = ['HTTP', 'File', 'Database'] as const;
export const transformationBrickTypes = ['CSV to JSON', 'XML to JSON', 'Excel to CSV', 'Split JSON', 'Add/Modify Fields', 'Merge Records'] as const;
export const brickTypes = [...sourceBrickTypes, ...transformationBrickTypes];

export const getBrickConfig = (type: string | undefined) => {
    return type ? brickConfig[type as keyof typeof brickConfig] : undefined;
};
