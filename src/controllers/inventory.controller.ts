import { Request, Response, NextFunction } from "express";
import inventoryService from "../services/inventory.service";

class InventoryController {
    /**
     * GET /api/inventory/store/:storeId
     * Get inventory untuk store tertentu
     */
    async getInventoryByStore(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;

            const result = await inventoryService.getInventoryByStore(
                storeId,
                page,
                limit,
                search
            );

            res.status(200).json({
                success: true,
                data: result.inventories,
                pagination: result.pagination,
                message: "Inventory retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/inventory/store/:storeId/all-variants
     * Get ALL variants dengan inventory data (show stock 0 untuk variants tanpa inventory)
     */
    async getAllVariantsWithInventory(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;
            const categoryId = req.query.categoryId as string;
            const stockStatus = req.query.stockStatus as string;
            const sortBy = req.query.sortBy as string;

            const result = await inventoryService.getAllVariantsWithInventory(
                storeId,
                page,
                limit,
                search,
                categoryId,
                stockStatus,
                sortBy
            );

            res.status(200).json({
                success: true,
                data: result.inventories,
                pagination: result.pagination,
                message: "All variants with inventory retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/inventory/variant/:variantId
     * Get inventory untuk variant di semua store (Super Admin only)
     */
    async getInventoryByVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId } = req.params;

            const result = await inventoryService.getInventoryByVariant(variantId);

            res.status(200).json({
                success: true,
                data: result.inventories,
                summary: result.summary,
                message: "Inventory retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/inventory/check/:storeId/:variantId
     * Check stock availability
     */
    async checkStockAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, variantId } = req.params;
            const quantity = parseInt(req.query.quantity as string) || 1;

            const result = await inventoryService.checkStockAvailability(
                storeId,
                variantId,
                quantity
            );

            res.status(200).json({
                success: true,
                data: result,
                message: result.available ? "Stock available" : "Stock not available",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/inventory/detail/:storeId/:variantId
     * Get inventory detail
     */
    async getInventoryDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, variantId } = req.params;

            const inventory = await inventoryService.getInventoryDetail(storeId, variantId);

            res.status(200).json({
                success: true,
                data: inventory,
                message: "Inventory detail retrieved successfully",
            });
        } catch (error: any) {
            if (error.message === "Inventory not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }

    /**
     * POST /api/inventory/reserve
     * Reserve stock untuk order
     */
    async reserveStock(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, variantId, quantity } = req.body;

            if (!storeId || !variantId || !quantity) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: storeId, variantId, quantity",
                });
            }

            const inventory = await inventoryService.reserveStock(
                storeId,
                variantId,
                parseInt(quantity)
            );

            res.status(200).json({
                success: true,
                data: inventory,
                message: "Stock reserved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * POST /api/inventory/release
     * Release reserved stock
     */
    async releaseReservedStock(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, variantId, quantity } = req.body;

            if (!storeId || !variantId || !quantity) {
                return res.status(400).json({
                    success: false,
                    error: "Missing required fields: storeId, variantId, quantity",
                });
            }

            const inventory = await inventoryService.releaseReservedStock(
                storeId,
                variantId,
                parseInt(quantity)
            );

            res.status(200).json({
                success: true,
                data: inventory,
                message: "Reserved stock released successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }
}

export default new InventoryController();
