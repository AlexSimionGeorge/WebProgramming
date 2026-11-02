import { z } from "zod";

export const accountRoles = ["centerAdmin", "player"] as const;
export type AccountRole = (typeof accountRoles)[number];

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registrationSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().min(1).max(100),
  role: z.enum(accountRoles),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export type Registration = z.output<typeof registrationSchema>;
export type LoginCredentials = z.output<typeof loginSchema>;
