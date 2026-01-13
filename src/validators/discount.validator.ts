import { z } from "zod";

export const createDiscountSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    discountValueType: z.string(),
    discountValue: z.number(),
    minPurchase: z.number().optional(),
    maxDiscount: z.number().optional(),
    buyQuantity: z.number().optional(),
    getQuantity: z.number().optional(),
    productVariantIds: z.array(z.string()).optional(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
});

export const updateDiscountSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    discountValueType: z.string().optional(),
    discountValue: z.number().optional(),
    minPurchase: z.number().optional(),
    maxDiscount: z.number().optional(),
    buyQuantity: z.number().optional(),
    getQuantity: z.number().optional(),
    productVariantIds: z.array(z.string()).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
});

export const toggleDiscountStatusSchema = z.object({
    isActive: z.boolean(),
});

// Type exports
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ToggleDiscountStatusInput = z.infer<typeof toggleDiscountStatusSchema>;
