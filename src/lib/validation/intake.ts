import { z } from "zod";

const platformSchema = z.enum(["x", "linkedin", "instagram", "tiktok"]);

export const intakeSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(10, "Goal must be at least 10 characters"),
  name: z.string().trim().min(2).max(80).optional(),
  targetUser: z.string().trim().max(200).optional(),
  deadline: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Deadline must be a valid date"),
  budgetUsd: z
    .number({ invalid_type_error: "Budget must be a number" })
    .positive("Budget must be greater than 0")
    .max(1_000_000, "Budget is too large for a Rivera run"),
  technology: z.string().trim().max(400).optional(),
  domain: z.string().trim().max(120).optional(),
  preferredChannels: z.array(platformSchema).optional(),
  autoPublish: z.boolean().optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

export function parseIntake(input: unknown) {
  return intakeSchema.safeParse(input);
}

export function dollarsToCents(usd: number): number {
  return Math.round(usd * 100);
}
