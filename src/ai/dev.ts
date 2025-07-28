import { config } from 'dotenv';
config();

import '@/ai/flows/validate-configuration.ts';
import '@/ai/flows/create-nifi-pipeline.ts';
import '@/ai/flows/translate-flow-to-nifi.ts';
