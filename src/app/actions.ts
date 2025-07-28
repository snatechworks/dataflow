"use server";

import { validateConfiguration, type ValidateConfigurationInput, type ValidateConfigurationOutput } from "@/ai/flows/validate-configuration";
import { createNifiPipeline, type CreateNifiPipelineInput, type CreateNifiPipelineOutput } from "@/ai/flows/create-nifi-pipeline";
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

const CreatePipelineActionInputSchema = z.object({
  name: z.string(),
  nifiProcessGroup: z.string(),
  flowDefinition: z.string(),
  sourceType: z.string(),
  sink: z.object({
    type: z.string(),
    properties: z.record(z.any()),
  }),
});

export async function createPipelineAction(input: CreateNifiPipelineInput): Promise<CreateNifiPipelineOutput> {
  const parsedInput = CreatePipelineActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      success: false,
      message: `Invalid input provided for pipeline creation. Please check the data format. Errors: ${JSON.stringify(parsedInput.error.issues)}`,
    };
  }
  
  try {
    const result = await createNifiPipeline(parsedInput.data);
    return result;
  } catch (error: any) {
    console.error("NiFi pipeline creation flow failed:", error);
    return {
      success: false,
      message: `An unexpected error occurred while creating the pipeline: ${error.message}`,
    };
  }
}