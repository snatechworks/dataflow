"use server";

import { validateConfiguration, type ValidateConfigurationInput, type ValidateConfigurationOutput } from "@/ai/flows/validate-configuration";
import { executePipeline, type ExecutePipelineInput, type ExecutePipelineOutput } from "@/ai/flows/execute-pipeline";
import { z } from 'zod';

const ValidateActionInputSchema = z.object({
  flowDefinition: z.string(),
  sourceType: z.string(),
  sink: z.object({
    type: z.string(),
    properties: z.record(z.any()),
  }),
});

export async function validateConfigurationAction(input: ValidateConfigurationInput): Promise<ValidateConfigurationOutput> {
  const parsedInput = ValidateActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      isValid: false,
      feedback: 'Invalid input provided for validation. Please check the data format.',
    };
  }
  
  try {
    const result = await validateConfiguration(parsedInput.data);
    return result;
  } catch (error: any) {
    console.error("AI validation flow failed:", error);
    return {
      isValid: false,
      feedback: `An unexpected error occurred while validating the configuration: ${error.message}`,
    };
  }
}

const RunPipelineActionInputSchema = z.object({
  name: z.string(),
  flowDefinition: z.string(),
  sourceType: z.string(),
  sink: z.object({
    type: z.string(),
    properties: z.record(z.any()),
  }),
});

export async function runPipelineAction(input: ExecutePipelineInput): Promise<ExecutePipelineOutput> {
  
  const parsedInput = RunPipelineActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      message: `Invalid input provided for pipeline execution. Please check the data format. Errors: ${JSON.stringify(parsedInput.error.issues)}`,
    };
  }
  
  try {
    const result = await executePipeline(parsedInput.data);
    return result;
  } catch (error: any)
  {
    console.error("Pipeline execution flow failed:", error);
    return {
      success: false,
      message: `An unexpected error occurred while running the pipeline: ${error.message}`,
    };
  }
}
