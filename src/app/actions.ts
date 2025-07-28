"use server";

import { validateConfiguration, type ValidateConfigurationInput, type ValidateConfigurationOutput } from "@/ai/flows/validate-configuration";
import { z } from 'zod';

const ActionInputSchema = z.object({
  configuration: z.string(),
  sourceType: z.string(),
});

export async function validateConfigurationAction(input: ValidateConfigurationInput): Promise<ValidateConfigurationOutput> {
  const parsedInput = ActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    // This provides basic error feedback for invalid input shape.
    return {
      isValid: false,
      feedback: 'Invalid input provided for validation. Please check the data format.',
    };
  }
  
  try {
    const result = await validateConfiguration(parsedInput.data);
    return result;
  } catch (error) {
    console.error("AI validation flow failed:", error);
    // Return a structured, user-friendly error to the client
    return {
      isValid: false,
      feedback: "An unexpected error occurred while validating the configuration. The AI model may be temporarily unavailable. Please try again later.",
    };
  }
}
