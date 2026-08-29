import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  phone: z.string().trim().optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  role: z.enum(["BUYER", "FARMER"], {
    message: "Role must be BUYER or FARMER",
  }),
  farmName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  defaultAddress: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "FARMER") {
    if (!data.farmName || data.farmName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Farm name is required for farmers",
        path: ["farmName"],
      });
    }
    if (!data.location || data.location.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location is required for farmers",
        path: ["location"],
      });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
