import { z } from "zod";

export const createVoucherSchema = z.object({
    code: z.string().min(3).max(50),
    name: z.string().min(3),
    description: z.string().optional(),
    scope: z.enum(['PRODUCT', 'CART', 'SHIPPING']),
    discountType: z.enum(['PERCENTAGE', 'NOMINAL']),
    discountValue: z.number().positive(),
    minPurchase: z.number().positive().optional(),
    maxDiscount: z.number().positive().optional(),
    maxUsagePerUser: z.number().int().positive(),
    maxTotalUsage: z.number().int().positive().optional(), // null = unlimited
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
});

export const updateVoucherSchema = z.object({
    code: z.string().min(3).max(50).optional(),
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    scope: z.enum(['PRODUCT', 'CART', 'SHIPPING']).optional(),
    discountType: z.enum(['PERCENTAGE', 'NOMINAL']).optional(),
    discountValue: z.number().positive().optional(),
    minPurchase: z.number().positive().optional(),
    maxDiscount: z.number().positive().optional(),
    maxUsagePerUser: z.number().int().positive().optional(),
    maxTotalUsage: z.number().int().positive().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
});

export const validateVoucherCodeSchema = z.object({
    code: z.string(),
    cartData: z.object({
        items: z.array(z.object({
            productVariantId: z.string(),
            price: z.number(),
            quantity: z.number(),
        }))
    }),
    userId: z.string(),
});

export const claimVoucherSchema = z.object({
    userId: z.string(),
});

export const toggleVoucherStatusSchema = z.object({
    isActive: z.boolean(),
});

// Type exports
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
export type ValidateVoucherCodeInput = z.infer<typeof validateVoucherCodeSchema>;
export type ClaimVoucherInput = z.infer<typeof claimVoucherSchema>;
export type ToggleVoucherStatusInput = z.infer<typeof toggleVoucherStatusSchema>;
