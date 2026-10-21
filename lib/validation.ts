import { z } from "zod";

export const memberSchema = z.object({
  regNumber: z.string().trim().min(1).max(50),
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(50),
  image: z.string().trim().max(1000)
    .refine((value) => value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/"),
      "Image must be an HTTP URL or application path")
    .nullable().optional()
});

export const loginSchema = z.object({
  regNumber: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(128)
});
