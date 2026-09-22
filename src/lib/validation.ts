import { z } from "zod";
import {
  MATRIC_NUMBER_FORMAT_MESSAGE,
  MATRIC_NUMBER_PATTERN,
} from "@/lib/student-identifiers";

export const uuidSchema = z.uuid();

export const matricNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    MATRIC_NUMBER_PATTERN,
    MATRIC_NUMBER_FORMAT_MESSAGE,
  );

export const verifyRequestSchema = z
  .object({
    matricNumber: matricNumberSchema,
    surname: z.string().trim().min(1).max(120),
  })
  .strict();

export const ballotSelectionSchema = z
  .object({
    positionId: z.uuid(),
    candidateId: z.uuid(),
  })
  .strict();

export const voteRequestSchema = z
  .object({
    selections: z.array(ballotSelectionSchema).min(1).max(50),
  })
  .strict()
  .superRefine(({ selections }, context) => {
    const positions = new Set(selections.map(({ positionId }) => positionId));
    if (positions.size !== selections.length) {
      context.addIssue({
        code: "custom",
        message: "Each position may be selected only once.",
        path: ["selections"],
      });
    }
  });

export const loginSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(8).max(200),
  })
  .strict();

export const studentSchema = z
  .object({
    id: z.uuid().optional(),
    matricNumber: matricNumberSchema,
    firstName: z.string().trim().min(1).max(120),
    surname: z.string().trim().min(1).max(120),
    department: z.string().trim().min(1).max(160),
    level: z.string().trim().min(1).max(40),
    isEligible: z
      .union([z.boolean(), z.enum(["on", "true", "false", "1", "0"])])
      .transform((value) => value === true || value === "on" || value === "true" || value === "1")
      .default(true),
  })
  .strict();

export const studentCsvRowSchema = z
  .object({
    matric_number: matricNumberSchema,
    first_name: z.string().trim().min(1).max(120),
    surname: z.string().trim().min(1).max(120),
    department: z.string().trim().min(1).max(160),
    level: z.string().trim().min(1).max(40),
  })
  .strict();

export const positionSchema = z
  .object({
    id: z.uuid().optional(),
    electionId: z.uuid(),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).default(""),
    displayOrder: z.coerce.number().int().positive(),
  })
  .strict();

export const positionOrderSchema = z
  .object({
    electionId: z.uuid(),
    orderedIds: z.array(z.uuid()).min(1).max(50),
  })
  .strict();

export const candidateSchema = z
  .object({
    id: z.uuid().optional(),
    positionId: z.uuid(),
    fullName: z.string().trim().min(2).max(160),
    department: z.string().trim().min(1).max(160),
    level: z.string().trim().min(1).max(40),
    manifesto: z.string().trim().max(5000).default(""),
  })
  .strict();

export const electionSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(5000).default(""),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
  })
  .strict()
  .refine((value) => new Date(value.startTime) < new Date(value.endTime), {
    message: "Start time must be before end time.",
    path: ["endTime"],
  });

export const electionStatusSchema = z
  .object({
    electionId: z.uuid(),
    status: z.enum(["pending", "open", "paused", "closed"]),
  })
  .strict();
