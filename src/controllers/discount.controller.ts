import DiscountService from "../services/discount.service";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    createDiscountSchema,
    updateDiscountSchema,
    toggleDiscountStatusSchema
} from "../validators/discount.validator";

class DiscountController {
    // GET /api/discounts/:id
    async getDiscountById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const discount = await DiscountService.getDiscountById(id);

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    error: "Discount not found"
                });
            }

            res.status(200).json({
                success: true,
                data: discount,
                message: "Discount retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // GET /api/discounts
    async getAllDiscounts(req: Request, res: Response, next: NextFunction) {
        try {
            const discounts = await DiscountService.getAllDiscounts();

            res.status(200).json({
                success: true,
                data: discounts,
                message: "Discounts retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // GET /api/discounts/active
    async getActiveDiscounts(req: Request, res: Response, next: NextFunction) {
        try {
            const discounts = await DiscountService.getActiveDiscounts();

            res.status(200).json({
                success: true,
                data: discounts,
                message: "Active discounts retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // POST /api/discounts
    async createDiscount(req: Request, res: Response, next: NextFunction) {
        try {
            // Validasi input dengan Zod
            const validatedData = createDiscountSchema.parse(req.body);

            // Convert dates to Date objects
            const discountData = {
                ...validatedData,
                startDate: new Date(validatedData.startDate),
                endDate: new Date(validatedData.endDate),
            };

            const discount = await DiscountService.createDiscount(discountData);

            res.status(201).json({
                success: true,
                data: discount,
                message: "Discount created successfully"
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                });
            }

            // Business logic errors
            if (error.message.includes("must be") ||
                error.message.includes("required") ||
                error.message.includes("cannot exceed")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }

    // PUT /api/discounts/:id
    async updateDiscount(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Validasi input dengan Zod
            const validatedData = updateDiscountSchema.parse(req.body);

            // Convert dates if provided
            const updateData: any = { ...validatedData };
            if (validatedData.startDate) {
                updateData.startDate = new Date(validatedData.startDate);
            }
            if (validatedData.endDate) {
                updateData.endDate = new Date(validatedData.endDate);
            }

            const discount = await DiscountService.updateDiscount(id, updateData);

            res.status(200).json({
                success: true,
                data: discount,
                message: "Discount updated successfully"
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                });
            }

            // Not found error
            if (error.message === "Discount not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            // Business logic errors
            if (error.message.includes("must be") ||
                error.message.includes("required") ||
                error.message.includes("cannot exceed")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }

    // DELETE /api/discounts/:id (Soft delete)
    async deleteDiscount(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const discount = await DiscountService.deleteDiscount(id);

            res.status(200).json({
                success: true,
                data: discount,
                message: "Discount deleted successfully"
            });
        } catch (error: any) {
            if (error.message === "Discount not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    // PATCH /api/discounts/:id/toggle
    async toggleDiscountStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Validasi input
            const { isActive } = toggleDiscountStatusSchema.parse(req.body);

            const discount = await DiscountService.toggleDiscountStatus(id, isActive);

            res.status(200).json({
                success: true,
                data: discount,
                message: `Discount ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                });
            }

            if (error.message === "Discount not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }
}

export default new DiscountController();