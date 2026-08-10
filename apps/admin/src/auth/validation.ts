import { z } from "zod";

export const masterAdminPasswordSchema = z.string()
  .min(16, "Password must contain at least 16 characters.")
  .max(256, "Password must not exceed 256 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
