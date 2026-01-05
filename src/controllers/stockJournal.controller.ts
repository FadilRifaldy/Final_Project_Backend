import { Request, Response, NextFunction } from "express";
import stockJournalService from "../services/stockJournal.service";
import { StockJournalType } from "../generated/prisma/enums";

class StockJournalController {
    /**
     * POST /api/stock-journal/in
     * Create stock IN journal (restock, purchase order)
     */
    async createStockIn(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productVariantId, quantity, referenceNo, reason, notes } = req.body;

            // Validation
            if (!storeId || !productVariantId || !quantity || !referenceNo || !reason) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: storeId, productVariantId, quantity, referenceNo, reason",
                });
            }

            // Get user ID from authenticated user (dari middleware verifyToken)
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }

            const journal = await stockJournalService.createStockIn(
                storeId,
                productVariantId,
                parseInt(quantity),
                referenceNo,
                reason,
                userId,
                notes
            );

            res.status(201).json({
                success: true,
                data: journal,
                message: "Stock IN created successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * POST /api/stock-journal/out
     * Create stock OUT journal (adjustment, damaged goods)
     */
    async createStockOut(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productVariantId, quantity, referenceNo, reason, notes } = req.body;

            // Validation
            if (!storeId || !productVariantId || !quantity || !referenceNo || !reason) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: storeId, productVariantId, quantity, referenceNo, reason",
                });
            }

            // Get user ID from authenticated user
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }

            const journal = await stockJournalService.createStockOut(
                storeId,
                productVariantId,
                parseInt(quantity),
                referenceNo,
                reason,
                userId,
                notes
            );

            res.status(201).json({
                success: true,
                data: journal,
                message: "Stock OUT created successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/stock-journal/variant/:storeId/:variantId
     * Get stock history untuk variant tertentu di store tertentu
     */
    async getStockHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, variantId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = await stockJournalService.getStockHistory(
                storeId,
                variantId,
                page,
                limit
            );

            res.status(200).json({
                success: true,
                data: result.journals,
                pagination: result.pagination,
                message: "Stock history retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/stock-journal/store/:storeId
     * Get all stock history untuk store tertentu
     */
    async getStockHistoryByStore(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const type = req.query.type as StockJournalType | undefined;

            const result = await stockJournalService.getStockHistoryByStore(
                storeId,
                page,
                limit,
                type
            );

            res.status(200).json({
                success: true,
                data: result.journals,
                pagination: result.pagination,
                message: "Stock history retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/stock-journal/:id
     * Get stock journal by ID
     */
    async getStockJournalById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const journal = await stockJournalService.getStockJournalById(id);

            res.status(200).json({
                success: true,
                data: journal,
                message: "Stock journal retrieved successfully",
            });
        } catch (error: any) {
            if (error.message === "Stock journal not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
}

export default new StockJournalController();
