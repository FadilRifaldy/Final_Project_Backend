import prisma from "../prisma";
import { StockJournalType } from "../generated/prisma/enums";

class StockJournalService {
    /**
     * Create Stock IN journal dengan ATOMIC transaction,digunakan untuk: Purchase Order, Return, Restock
     */
    async createStockIn(
        storeId: string,
        productVariantId: string,
        quantity: number,
        referenceNo: string,
        reason: string,
        createdBy: string,
        notes?: string
    ) {
        // Validation
        if (quantity <= 0) {
            throw new Error("Quantity must be greater than 0");
        }

        if (!referenceNo || referenceNo.trim().length === 0) {
            throw new Error("Reference number is required");
        }

        if (!reason || reason.trim().length < 5) {
            throw new Error("Reason must be at least 5 characters");
        }

        // ATOMIC TRANSACTION - Critical untuk data consistency
        return await prisma.$transaction(async (tx) => {
            // 1. Get atau create inventory record
            let inventory = await tx.inventory.findUnique({
                where: {
                    productVariantId_storeId: {
                        productVariantId,
                        storeId,
                    },
                },
            });

            // Jika inventory belum ada, create dengan quantity 0
            if (!inventory) {
                inventory = await tx.inventory.create({
                    data: {
                        productVariantId,
                        storeId,
                        quantity: 0,
                        reserved: 0,
                    },
                });
            }

            const stockBefore = inventory.quantity;
            const stockAfter = stockBefore + quantity;

            // 2. Create stock journal record
            const journal = await tx.stockJournal.create({
                data: {
                    productVariantId,
                    storeId,
                    type: StockJournalType.IN,
                    quantity,
                    stockBefore,
                    stockAfter,
                    referenceNo: referenceNo.trim(),
                    reason: reason.trim(),
                    notes: notes?.trim(),
                    createdBy,
                },
                include: {
                    productVariant: {
                        include: {
                            product: true,
                        },
                    },
                    store: true,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // 3. Update inventory quantity
            await tx.inventory.update({
                where: {
                    productVariantId_storeId: {
                        productVariantId,
                        storeId,
                    },
                },
                data: {
                    quantity: stockAfter,
                },
            });

            return journal;
        });
    }

    /**
     * Create Stock OUT journal dengan ATOMIC transaction
     * Digunakan untuk: Adjustment, Damaged goods, Manual correction
     */
    async createStockOut(
        storeId: string,
        productVariantId: string,
        quantity: number,
        referenceNo: string,
        reason: string,
        createdBy: string,
        notes?: string
    ) {
        // Validation
        if (quantity <= 0) {
            throw new Error("Quantity must be greater than 0");
        }

        if (!referenceNo || referenceNo.trim().length === 0) {
            throw new Error("Reference number is required");
        }

        if (!reason || reason.trim().length < 5) {
            throw new Error("Reason must be at least 5 characters");
        }

        // ATOMIC TRANSACTION
        return await prisma.$transaction(async (tx) => {
            // 1. Get inventory (harus sudah ada untuk stock OUT)
            const inventory = await tx.inventory.findUnique({
                where: {
                    productVariantId_storeId: {
                        productVariantId,
                        storeId,
                    },
                },
            });

            if (!inventory) {
                throw new Error(
                    "Inventory not found. Cannot perform stock OUT on non-existent inventory."
                );
            }

            const stockBefore = inventory.quantity;
            const stockAfter = stockBefore - quantity;

            // Validation: Stock tidak boleh negatif
            if (stockAfter < 0) {
                throw new Error(
                    `Insufficient stock. Available: ${stockBefore}, Requested: ${quantity}`
                );
            }

            // 2. Create stock journal record
            const journal = await tx.stockJournal.create({
                data: {
                    productVariantId,
                    storeId,
                    type: StockJournalType.OUT,
                    quantity,
                    stockBefore,
                    stockAfter,
                    referenceNo: referenceNo.trim(),
                    reason: reason.trim(),
                    notes: notes?.trim(),
                    createdBy,
                },
                include: {
                    productVariant: {
                        include: {
                            product: true,
                        },
                    },
                    store: true,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // 3. Update inventory quantity
            await tx.inventory.update({
                where: {
                    productVariantId_storeId: {
                        productVariantId,
                        storeId,
                    },
                },
                data: {
                    quantity: stockAfter,
                },
            });

            return journal;
        });
    }

    /**
     * Get stock history untuk variant tertentu di store tertentu
     */
    async getStockHistory(
        storeId: string,
        productVariantId: string,
        page: number = 1,
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [journals, totalItems] = await Promise.all([
            prisma.stockJournal.findMany({
                where: {
                    storeId,
                    productVariantId,
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    productVariant: {
                        include: {
                            product: true,
                        },
                    },
                    store: true,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        },
                    },
                },
            }),
            prisma.stockJournal.count({
                where: {
                    storeId,
                    productVariantId,
                },
            }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            journals,
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
     * Get all stock history untuk store tertentu
     * Untuk Store Admin view
     */
    async getStockHistoryByStore(
        storeId: string,
        page: number = 1,
        limit: number = 20,
        type?: StockJournalType
    ) {
        const skip = (page - 1) * limit;

        const where: any = { storeId };
        if (type) {
            where.type = type;
        }

        const [journals, totalItems] = await Promise.all([
            prisma.stockJournal.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    productVariant: {
                        include: {
                            product: true,
                        },
                    },
                    store: true,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        },
                    },
                },
            }),
            prisma.stockJournal.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            journals,
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
     * Get stock journal by ID
     */
    async getStockJournalById(id: string) {
        const journal = await prisma.stockJournal.findUnique({
            where: { id },
            include: {
                productVariant: {
                    include: {
                        product: true,
                    },
                },
                store: true,
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                    },
                },
            },
        });

        if (!journal) {
            throw new Error("Stock journal not found");
        }

        return journal;
    }

    // get stock journal monthly summary
    async getStockJournalMonthlySummary(
        storeId: string,
        startDate: string,
        endDate: string,
        page: number = 1,
        limit: number = 20
    ) {
        // 1. Get semua journal entries di bulan tersebut
        const journals = await prisma.stockJournal.findMany({
            where: {
                storeId,
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                productVariant: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // 2. Group & aggregate per variant
        const summaryMap = new Map();

        journals.forEach(journal => {
            const variantId = journal.productVariantId;

            if (!summaryMap.has(variantId)) {
                summaryMap.set(variantId, {
                    productVariantId: variantId,
                    productName: journal.productVariant.product.name,
                    variantName: journal.productVariant.name,
                    stockStart: journal.stockBefore, // Stok awal (dari journal pertama)
                    totalIn: 0,
                    totalOut: 0,
                    stockEnd: 0,
                });
            }

            const summary = summaryMap.get(variantId);

            // Akumulasi IN/OUT
            if (journal.type === 'IN') {
                summary.totalIn += journal.quantity;
            } else {
                summary.totalOut += journal.quantity;
            }

            // Update stok akhir (dari journal terakhir)
            summary.stockEnd = journal.stockAfter;
        });

        // 3. Convert Map to Array & apply pagination
        const summaryArray = Array.from(summaryMap.values());
        const totalItems = summaryArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;
        const paginatedData = summaryArray.slice(skip, skip + limit);

        return {
            summary: paginatedData,
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
}

export default new StockJournalService();