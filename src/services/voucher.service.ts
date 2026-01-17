import prisma from "../prisma";

// Logic CRUD untuk Voucher dengan 3 scope:
// PRODUCT - Voucher untuk produk tertentu
// CART - Voucher untuk total belanja (min purchase)
// SHIPPING - Voucher untuk ongkir
// Lihat line 455-487 schema.prisma

class VoucherService {
    // ========================================
    // CRUD OPERATIONS
    // ========================================

    async getAllVouchers() {
        const vouchers = await prisma.voucher.findMany({
            include: {
                userVouchers: {
                    select: {
                        id: true,
                        userId: true,
                        isUsed: true,
                        usedAt: true,
                    }
                },
                voucherUsages: {
                    select: {
                        id: true,
                        orderId: true,
                        discountAmount: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return vouchers;
    }

    async getVoucherById(id: string) {
        const voucher = await prisma.voucher.findUnique({
            where: { id },
            include: {
                userVouchers: true,
                voucherUsages: true,
            }
        });
        return voucher;
    }

    async getVoucherByCode(code: string) {
        const voucher = await prisma.voucher.findUnique({
            where: { code },
            include: {
                userVouchers: true,
                voucherUsages: true,
            }
        });
        return voucher;
    }

    async getActiveVouchers() {
        const vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true,
                startDate: {
                    lte: new Date(),
                },
                endDate: {
                    gte: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return vouchers;
    }

    async createVoucher(data: {
        code: string;
        name: string;
        description?: string;
        scope: string; // PRODUCT, CART, SHIPPING
        discountType: string; // PERCENTAGE, NOMINAL
        discountValue: number;
        minPurchase?: number;
        maxDiscount?: number;
        maxUsagePerUser: number;
        maxTotalUsage?: number; // null = unlimited
        startDate: Date;
        endDate: Date;
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
        if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
            throw new Error("Percentage discount cannot exceed 100%");
        }

        // Validasi 4: Code harus unique
        const existingVoucher = await prisma.voucher.findUnique({
            where: { code: data.code }
        });

        if (existingVoucher) {
            throw new Error("Voucher code already exists");
        }

        // Validasi 5: Berdasarkan scope
        if (data.scope === 'CART' || data.scope === 'SHIPPING') {
            if (!data.minPurchase || data.minPurchase <= 0) {
                throw new Error("Minimum purchase required for CART/SHIPPING voucher");
            }
        }

        // Create voucher
        const voucher = await prisma.voucher.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                scope: data.scope as any,
                discountType: data.discountType as any,
                discountValue: data.discountValue,
                minPurchase: data.minPurchase,
                maxDiscount: data.maxDiscount,
                maxUsagePerUser: data.maxUsagePerUser,
                maxTotalUsage: data.maxTotalUsage,
                startDate: data.startDate,
                endDate: data.endDate,
                isActive: true,
            },
        });

        return voucher;
    }

    async updateVoucher(id: string, data: {
        code?: string;
        name?: string;
        description?: string;
        scope?: string;
        discountType?: string;
        discountValue?: number;
        minPurchase?: number;
        maxDiscount?: number;
        maxUsagePerUser?: number;
        maxTotalUsage?: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        // Validasi: Cek voucher exist
        const existingVoucher = await prisma.voucher.findUnique({
            where: { id }
        });

        if (!existingVoucher) {
            throw new Error("Voucher not found");
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
        if (data.discountType === 'PERCENTAGE' && data.discountValue && data.discountValue > 100) {
            throw new Error("Percentage discount cannot exceed 100%");
        }

        // Validasi: Jika update code, cek uniqueness
        if (data.code && data.code !== existingVoucher.code) {
            const codeExists = await prisma.voucher.findUnique({
                where: { code: data.code }
            });

            if (codeExists) {
                throw new Error("Voucher code already exists");
            }
        }

        // Update voucher
        const voucher = await prisma.voucher.update({
            where: { id },
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                scope: data.scope as any,
                discountType: data.discountType as any,
                discountValue: data.discountValue,
                minPurchase: data.minPurchase,
                maxDiscount: data.maxDiscount,
                maxUsagePerUser: data.maxUsagePerUser,
                maxTotalUsage: data.maxTotalUsage,
                startDate: data.startDate,
                endDate: data.endDate,
            },
        });

        return voucher;
    }

    // Soft delete untuk data history voucher
    async deleteVoucher(id: string) {
        // Cek apakah voucher exist
        const existingVoucher = await prisma.voucher.findUnique({
            where: { id }
        });

        if (!existingVoucher) {
            throw new Error("Voucher not found");
        }

        // Soft delete: set isActive = false
        const voucher = await prisma.voucher.update({
            where: { id },
            data: { isActive: false },
        });

        return voucher;
    }

    // ========================================
    // VOUCHER CLAIM & USAGE
    // ========================================

    async claimVoucher(userId: string, voucherId: string) {
        // 1. Cek voucher exist dan active
        const voucher = await prisma.voucher.findUnique({
            where: { id: voucherId },
            include: {
                userVouchers: {
                    where: { userId }
                }
            }
        });

        if (!voucher) {
            throw new Error("Voucher not found");
        }

        if (!voucher.isActive) {
            throw new Error("Voucher is not active");
        }

        // 2. Cek validity period
        const now = new Date();
        if (now < voucher.startDate || now > voucher.endDate) {
            throw new Error("Voucher is not valid at this time");
        }

        // 3. Cek apakah user sudah claim voucher ini
        if (voucher.userVouchers.length > 0) {
            throw new Error("You have already claimed this voucher");
        }

        // 4. Cek max total usage
        if (voucher.maxTotalUsage && voucher.currentUsage >= voucher.maxTotalUsage) {
            throw new Error("Voucher has reached maximum usage limit");
        }

        // 5. Create UserVoucher
        const userVoucher = await prisma.userVoucher.create({
            data: {
                userId,
                voucherId,
                expiresAt: voucher.endDate,
            },
            include: {
                voucher: true,
            }
        });

        return userVoucher;
    }

    async getUserVouchers(userId: string) {
        const userVouchers = await prisma.userVoucher.findMany({
            where: {
                userId,
                isUsed: false,
                expiresAt: {
                    gte: new Date(),
                }
            },
            include: {
                voucher: true,
            },
            orderBy: {
                claimedAt: 'desc'
            }
        });

        return userVouchers;
    }

    // ========================================
    // VALIDATE VOUCHER CODE (untuk checkout)
    // ========================================
    async validateVoucherCode(code: string, cartData: any, userId: string) {
        // 1. Cari voucher berdasarkan code
        const voucher = await prisma.voucher.findFirst({
            where: {
                code,
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
            include: {
                userVouchers: {
                    where: { userId }
                },
                voucherUsages: {
                    where: {
                        order: {
                            userId
                        }
                    }
                }
            }
        });

        if (!voucher) {
            throw new Error("Invalid or expired voucher code");
        }

        // 2. Cek apakah user sudah claim voucher ini
        const userVoucher = voucher.userVouchers[0];
        if (!userVoucher) {
            throw new Error("You need to claim this voucher first");
        }

        if (userVoucher.isUsed) {
            throw new Error("This voucher has already been used");
        }

        // 3. Cek max usage per user
        const userUsageCount = voucher.voucherUsages.length;
        if (userUsageCount >= voucher.maxUsagePerUser) {
            throw new Error(`You have reached the maximum usage limit (${voucher.maxUsagePerUser}x) for this voucher`);
        }

        // 4. Cek max total usage
        if (voucher.maxTotalUsage && voucher.currentUsage >= voucher.maxTotalUsage) {
            throw new Error("Voucher has reached maximum usage limit");
        }

        // 5. Hitung subtotal dari cartData
        const subtotal = cartData.items.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // 6. Validasi berdasarkan scope
        let discountAmount = 0;
        let message = "Voucher applied successfully";

        switch (voucher.scope) {
            case 'PRODUCT':
                // Untuk PRODUCT scope, voucher bisa apply ke semua produk di cart
                // (berbeda dengan Discount PRODUCT yang hanya untuk produk tertentu)
                if (voucher.discountType === 'PERCENTAGE') {
                    discountAmount = subtotal * (Number(voucher.discountValue) / 100);
                } else {
                    discountAmount = Number(voucher.discountValue);
                }
                break;

            case 'CART':
                // Validasi minimum purchase
                if (voucher.minPurchase && subtotal < Number(voucher.minPurchase)) {
                    throw new Error(`Minimum purchase of Rp${voucher.minPurchase} required`);
                }

                // Hitung discount
                if (voucher.discountType === 'PERCENTAGE') {
                    discountAmount = subtotal * (Number(voucher.discountValue) / 100);
                } else {
                    discountAmount = Number(voucher.discountValue);
                }
                break;

            case 'SHIPPING':
                // Validasi minimum purchase
                if (voucher.minPurchase && subtotal < Number(voucher.minPurchase)) {
                    throw new Error(`Minimum purchase of Rp${voucher.minPurchase} required`);
                }

                // Untuk shipping, discount amount akan di-apply ke shipping fee
                // Bukan ke subtotal cart
                if (voucher.discountType === 'PERCENTAGE') {
                    // Shipping fee akan dihitung di checkout controller
                    discountAmount = Number(voucher.discountValue); // Simpan percentage
                } else {
                    discountAmount = Number(voucher.discountValue);
                }
                message = "Shipping voucher will be applied at checkout";
                break;
        }

        // 7. Apply max discount jika ada
        if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
            discountAmount = Number(voucher.maxDiscount);
            message = `Discount capped at Rp${voucher.maxDiscount}`;
        }

        // 8. Return hasil
        return {
            valid: true,
            voucher,
            userVoucher,
            discountAmount,
            message,
        };
    }

    // ========================================
    // TOGGLE VOUCHER STATUS
    // ========================================
    async toggleVoucherStatus(id: string, isActive: boolean) {
        const voucher = await prisma.voucher.update({
            where: { id },
            data: { isActive },
        });

        return voucher;
    }
}

export default new VoucherService();

