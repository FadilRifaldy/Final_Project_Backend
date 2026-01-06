import prisma from "../prisma";

class InventoryService {
    /**
     * Get inventory untuk store tertentu (untuk Store Admin)
     * Include product & variant details
     */
    async getInventoryByStore(
        storeId: string,
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = { storeId };

        // Search by product name or variant name or SKU
        if (search && search.trim().length > 0) {
            where.productVariant = {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { sku: { contains: search, mode: "insensitive" } },
                    {
                        product: {
                            name: { contains: search, mode: "insensitive" },
                        },
                    },
                ],
            };
        }

        const [inventories, totalItems] = await Promise.all([
            prisma.inventory.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    updatedAt: "desc",
                },
                include: {
                    productVariant: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                    images: {
                                        take: 1,
                                        orderBy: { order: "asc" },
                                    },
                                },
                            },
                        },
                    },
                    store: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                        },
                    },
                },
            }),
            prisma.inventory.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        // Calculate available stock untuk setiap inventory
        const inventoriesWithAvailable = inventories.map((inv) => ({
            ...inv,
            available: inv.quantity - inv.reserved,
        }));

        return {
            inventories: inventoriesWithAvailable,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Get ALL product variants dengan inventory data (show stock 0 jika belum ada inventory)
     * Untuk inventory management page - show semua variants
     */
    async getAllVariantsWithInventory(
        storeId: string,
        page: number = 1,
        limit: number = 20,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        // Build where clause untuk variants
        const variantWhere: any = {
            isActive: true,
        };

        // Search by product name, variant name, or SKU
        if (search && search.trim().length > 0) {
            variantWhere.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                {
                    product: {
                        name: { contains: search, mode: "insensitive" },
                    },
                },
            ];
        }

        // Get all active variants with pagination
        const [variants, totalItems] = await Promise.all([
            prisma.productVariant.findMany({
                where: variantWhere,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    product: {
                        include: {
                            category: true,
                            images: {
                                take: 1,
                                orderBy: { order: "asc" },
                            },
                        },
                    },
                    inventory: {
                        where: {
                            storeId,
                        },
                    },
                },
            }),
            prisma.productVariant.count({ where: variantWhere }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        // Transform to inventory-like structure
        const inventoriesWithAvailable = variants.map((variant) => {
            const inventory = variant.inventory[0]; // Get inventory untuk store ini

            if (inventory) {
                // Variant sudah punya inventory
                return {
                    productVariantId: variant.id,
                    storeId,
                    quantity: inventory.quantity,
                    reserved: inventory.reserved,
                    available: inventory.quantity - inventory.reserved,
                    productVariant: {
                        id: variant.id,
                        name: variant.name,
                        sku: variant.sku,
                        price: variant.price,
                        product: variant.product,
                    },
                };
            } else {
                // Variant belum punya inventory - show stock 0
                return {
                    productVariantId: variant.id,
                    storeId,
                    quantity: 0,
                    reserved: 0,
                    available: 0,
                    productVariant: {
                        id: variant.id,
                        name: variant.name,
                        sku: variant.sku,
                        price: variant.price,
                        product: variant.product,
                    },
                };
            }
        });

        return {
            inventories: inventoriesWithAvailable,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Get inventory untuk variant tertentu di semua store (untuk Super Admin)
     */
    async getInventoryByVariant(variantId: string) {
        const inventories = await prisma.inventory.findMany({
            where: {
                productVariantId: variantId,
            },
            include: {
                productVariant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                store: true,
            },
            orderBy: {
                store: {
                    name: "asc",
                },
            },
        });

        // Calculate available stock dan total
        const inventoriesWithAvailable = inventories.map((inv) => ({
            ...inv,
            available: inv.quantity - inv.reserved,
        }));

        const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
        const totalReserved = inventories.reduce((sum, inv) => sum + inv.reserved, 0);
        const totalAvailable = totalQuantity - totalReserved;

        return {
            inventories: inventoriesWithAvailable,
            summary: {
                totalStores: inventories.length,
                totalQuantity,
                totalReserved,
                totalAvailable,
            },
        };
    }

    /**
     * Check stock availability untuk variant di store tertentu
     * Digunakan untuk validasi add to cart
     */
    async checkStockAvailability(storeId: string, variantId: string, requestedQty: number) {
        const inventory = await prisma.inventory.findUnique({
            where: {
                productVariantId_storeId: {
                    productVariantId: variantId,
                    storeId,
                },
            },
            include: {
                productVariant: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        price: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!inventory) {
            return {
                available: false,
                reason: "Product not available in this store",
                inventory: null,
            };
        }

        const availableStock = inventory.quantity - inventory.reserved;

        if (availableStock < requestedQty) {
            return {
                available: false,
                reason: `Insufficient stock. Available: ${availableStock}, Requested: ${requestedQty}`,
                inventory: {
                    ...inventory,
                    available: availableStock,
                },
            };
        }

        return {
            available: true,
            reason: "Stock available",
            inventory: {
                ...inventory,
                available: availableStock,
            },
        };
    }

    /**
     * Get inventory detail untuk specific variant di specific store
     */
    async getInventoryDetail(storeId: string, variantId: string) {
        const inventory = await prisma.inventory.findUnique({
            where: {
                productVariantId_storeId: {
                    productVariantId: variantId,
                    storeId,
                },
            },
            include: {
                productVariant: {
                    include: {
                        product: {
                            include: {
                                category: true,
                                images: {
                                    orderBy: { order: "asc" },
                                },
                            },
                        },
                    },
                },
                store: true,
            },
        });

        if (!inventory) {
            throw new Error("Inventory not found");
        }

        return {
            ...inventory,
            available: inventory.quantity - inventory.reserved,
        };
    }

    /**
     * Initialize inventory untuk variant baru di semua store
     * Dipanggil saat create product variant baru
     */
    async initializeInventoryForVariant(variantId: string) {
        // Get all active stores
        const stores = await prisma.store.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        // Create inventory record untuk setiap store dengan quantity 0
        const inventories = await Promise.all(
            stores.map((store) =>
                prisma.inventory.upsert({
                    where: {
                        productVariantId_storeId: {
                            productVariantId: variantId,
                            storeId: store.id,
                        },
                    },
                    create: {
                        productVariantId: variantId,
                        storeId: store.id,
                        quantity: 0,
                        reserved: 0,
                    },
                    update: {}, // Do nothing if already exists
                })
            )
        );

        return {
            variantId,
            storesInitialized: inventories.length,
        };
    }

    /**
     * Reserve stock untuk pending order
     * Dipanggil saat customer checkout
     */
    async reserveStock(storeId: string, variantId: string, quantity: number) {
        // Check availability first
        const check = await this.checkStockAvailability(storeId, variantId, quantity);

        if (!check.available) {
            throw new Error(check.reason);
        }

        // Update reserved quantity
        const inventory = await prisma.inventory.update({
            where: {
                productVariantId_storeId: {
                    productVariantId: variantId,
                    storeId,
                },
            },
            data: {
                reserved: {
                    increment: quantity,
                },
            },
        });

        return inventory;
    }

    /**
     * Release reserved stock
     * Dipanggil saat order cancelled atau expired
     */
    async releaseReservedStock(storeId: string, variantId: string, quantity: number) {
        const inventory = await prisma.inventory.update({
            where: {
                productVariantId_storeId: {
                    productVariantId: variantId,
                    storeId,
                },
            },
            data: {
                reserved: {
                    decrement: quantity,
                },
            },
        });

        return inventory;
    }
}

export default new InventoryService();
