import { z } from "zod";

export const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Tubers",
  "Legumes",
  "Dairy",
  "Poultry",
  "Honey",
  "Herbs",
] as const;

export const UNITS = ["kg", "sack", "basket", "piece", "litre", "dozen", "bundle"] as const;

export const createProductSchema = z.object({
  title: z.string().trim().min(3, "Product title is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().min(2, "Category is required"),
  price: z.number().positive("Price must be greater than zero"),
  currency: z.string().trim().default("UGX"),
  unit: z.string().trim().min(1, "Unit is required"),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  status: z.enum(["ACTIVE", "HIDDEN", "SOLD_OUT"]).default("ACTIVE"),
  images: z.array(z.string().min(1, "Invalid image")).max(5, "At most 5 images allowed").min(1, "At least one product image is required"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
