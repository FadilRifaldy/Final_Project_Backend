import prisma from "../prisma";

// logic crud untuk discount dengan 3 tipe:
// Direct Product Discount
// Minimum Purchase Discount
// Buy One Get One (BOGO)
// lihat line 394 - 496 schema.prisma

class DiscountService {
    async getAllDiscounts() {
        const discounts = await prisma.discount.findMany({
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                productDiscounts: {
                    include: {
                        productVariant: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                    }
                                }
                            }
                        },
                    }
                }
            }
        });
        return discounts;
    }

    async getDiscountById(id: string) {
        const discount = await prisma.discount.findUnique({
            where: {
                id,
            },
            include: {
                productDiscounts: {
                    include: {
                        productVariant: true,
                    }
                }
            }
        });
        return discount;
    }

    async getActiveDiscounts() {
        const discounts = await prisma.discount.findMany({
            where: {
                isActive: true,
                startDate: {
                    lte: new Date(),
                },
                endDate: {
                    gte: new Date(),
                },
            },
            include: {
                productDiscounts: {
                    include: {
                        productVariant: true,
                    }
                }
            }
        });
        return discounts;
    }

    async createDiscount(data: {
        name: string;
        description?: string;
        type: string;
        discountValueType: string;
        discountValue: number;
        minPurchase?: number;
        maxDiscount?: number;
        buyQuantity?: number;
        getQuantity?: number;
        productVariantIds?: string[];
        startDate: Date;
        endDate: Date;
        storeId?: string; // null = global (Super Admin), filled = specific store
        createdBy: string; // User ID yang membuat
    }) {
        // Validasi 1: Date range
        if (new Date(data.startDate) >= new Date(data.endDate)) {
            throw new Error("Start date must be before end date");
        }

        // Validasi 2: Discount value harus > 0
        if (data.discountValue <= 0) {
            throw new Error("Discount value must be greater than 0");
        }

        // Validasi 3: Percentage max 100%
        if (data.discountValueType === 'PERCENTAGE' && data.discountValue > 100) {
            throw new Error("Percentage discount cannot exceed 100%");
        }

        // Validasi 4: Berdasarkan type
        if (data.type === 'PRODUCT' || data.type === 'BUY_ONE_GET_ONE') {
            if (!data.productVariantIds || data.productVariantIds.length === 0) {
                throw new Error("Product variants required for this discount type");
            }
        }

        if (data.type === 'CART') {
            if (!data.minPurchase || data.minPurchase <= 0) {
                throw new Error("Minimum purchase required for cart discount");
            }
        }

        if (data.type === 'BUY_ONE_GET_ONE') {
            if (!data.buyQuantity || data.buyQuantity <= 0 || !data.getQuantity || data.getQuantity <= 0) {
                throw new Error("Buy and get quantity required for BOGO discount");
            }
        }

        // Create dengan transaction (penting untuk data consistency!)
        const discount = await prisma.$transaction(async (tx: any) => {
            // Step 1: Create discount
            const newDiscount = await tx.discount.create({
                data: {
                    name: data.name,
                    description: data.description,
                    type: data.type as any,
                    discountValueType: data.discountValueType as any,
                    discountValue: data.discountValue,
                    minPurchase: data.minPurchase,
                    maxDiscount: data.maxDiscount,
                    buyQuantity: data.buyQuantity,
                    getQuantity: data.getQuantity,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isActive: true,
                    storeId: data.storeId || null, // null = global
                    createdBy: data.createdBy,
                },
            });

            // Step 2: Link ke products (jika PRODUCT atau BOGO)
            if ((data.type === 'PRODUCT' || data.type === 'BUY_ONE_GET_ONE') && data.productVariantIds) {
                await tx.productDiscount.createMany({
                    data: data.productVariantIds.map(variantId => ({
                        discountId: newDiscount.id,
                        productVariantId: variantId,
                    })),
                });
            }

            // Step 3: Return dengan includes
            return await tx.discount.findUnique({
                where: { id: newDiscount.id },
                include: {
                    productDiscounts: {
                        include: {
                            productVariant: true,
                        }
                    }
                }
            });
        });

        return discount;
    }

    async updateDiscount(id: string, data: {
        name?: string;
        description?: string;
        type?: string;
        discountValueType?: string;
        discountValue?: number;
        minPurchase?: number;
        maxDiscount?: number;
        buyQuantity?: number;
        getQuantity?: number;
        productVariantIds?: string[];
        startDate?: Date;
        endDate?: Date;
    }) {
        // Validasi: Cek discount exist
        const existingDiscount = await prisma.discount.findUnique({
            where: { id }
        });

        if (!existingDiscount) {
            throw new Error("Discount not found");
        }

        // Validasi: Jika ada startDate & endDate, cek range
        if (data.startDate && data.endDate) {
            if (new Date(data.startDate) >= new Date(data.endDate)) {
                throw new Error("Start date must be before end date");
            }
        }

        // Validasi: Jika ada discountValue, cek > 0
        if (data.discountValue !== undefined && data.discountValue <= 0) {
            throw new Error("Discount value must be greater than 0");
        }

        // Validasi: Jika percentage, cek <= 100
        if (data.discountValueType === 'PERCENTAGE' && data.discountValue && data.discountValue > 100) {
            throw new Error("Percentage discount cannot exceed 100%");
        }

        // Update dengan transaction
        const discount = await prisma.$transaction(async (tx: any) => {
            // Step 1: Update discount data
            const updatedDiscount = await tx.discount.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    type: data.type as any,
                    discountValueType: data.discountValueType as any,
                    discountValue: data.discountValue,
                    minPurchase: data.minPurchase,
                    maxDiscount: data.maxDiscount,
                    buyQuantity: data.buyQuantity,
                    getQuantity: data.getQuantity,
                    startDate: data.startDate,
                    endDate: data.endDate,
                },
            });

            // Step 2: Jika ada productVariantIds, sync ProductDiscount
            if (data.productVariantIds !== undefined) {
                // Hapus semua link lama
                await tx.productDiscount.deleteMany({
                    where: { discountId: id }
                });

                // Buat link baru (jika ada)
                if (data.productVariantIds.length > 0) {
                    await tx.productDiscount.createMany({
                        data: data.productVariantIds.map(variantId => ({
                            discountId: id,
                            productVariantId: variantId,
                        })),
                    });
                }
            }

            // Step 3: Return dengan includes
            return await tx.discount.findUnique({
                where: { id },
                include: {
                    productDiscounts: {
                        include: {
                            productVariant: true,
                        }
                    }
                }
            });
        });

        return discount;
    }

    // soft delete untuk data history discount
    async deleteDiscount(id: string) {
        // Cek apakah discount exist
        const existingDiscount = await prisma.discount.findUnique({
            where: { id }
        });

        if (!existingDiscount) {
            throw new Error("Discount not found");
        }

        // Soft delete: set isActive = false
        const discount = await prisma.discount.update({
            where: { id },
            data: { isActive: false },
        });

        return discount;
    }

    // ========================================
    // TOGGLE DISCOUNT STATUS
    // ========================================

    // ini untuk mengaktifkan atau menonaktifkan discount
    async toggleDiscountStatus(id: string, isActive: boolean) {
        const discount = await prisma.discount.update({
            where: { id },
            data: { isActive },
        });

        return discount;
    }
}
export default new DiscountService();