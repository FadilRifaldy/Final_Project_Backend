import VoucherService from "../services/voucher.service";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    createVoucherSchema,
    updateVoucherSchema,
    validateVoucherCodeSchema,
    claimVoucherSchema,
    toggleVoucherStatusSchema
} from "../validators/voucher.validator";

class VoucherController {
    // GET /api/vouchers
    async getAllVouchers(req: Request, res: Response, next: NextFunction) {
        try {
            const vouchers = await VoucherService.getAllVouchers();

            res.status(200).json({
                success: true,
                data: vouchers,
                message: "Vouchers retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // GET /api/vouchers/:id
    async getVoucherById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const voucher = await VoucherService.getVoucherById(id);

            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    error: "Voucher not found"
                });
            }

            res.status(200).json({
                success: true,
                data: voucher,
                message: "Voucher retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // GET /api/vouchers/code/:code
    async getVoucherByCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.params;
            const voucher = await VoucherService.getVoucherByCode(code);

            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    error: "Voucher not found"
                });
            }

            res.status(200).json({
                success: true,
                data: voucher,
                message: "Voucher retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // GET /api/vouchers/active
    async getActiveVouchers(req: Request, res: Response, next: NextFunction) {
        try {
            const vouchers = await VoucherService.getActiveVouchers();

            res.status(200).json({
                success: true,
                data: vouchers,
                message: "Active vouchers retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // POST /api/vouchers
    async createVoucher(req: Request, res: Response, next: NextFunction) {
        try {
            // Validasi input dengan Zod
            const validatedData = createVoucherSchema.parse(req.body);

            // Convert dates to Date objects
            const voucherData = {
                ...validatedData,
                startDate: new Date(validatedData.startDate),
                endDate: new Date(validatedData.endDate),
            };

            const voucher = await VoucherService.createVoucher(voucherData);

            res.status(201).json({
                success: true,
                data: voucher,
                message: "Voucher created successfully"
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: error.issues
                });
            }

            // Business logic errors
            if (error.message.includes("must be") ||
                error.message.includes("required") ||
                error.message.includes("already exists") ||
                error.message.includes("cannot exceed")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }

    // PUT /api/vouchers/:id
    async updateVoucher(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Validasi input dengan Zod
            const validatedData = updateVoucherSchema.parse(req.body);

            // Convert dates if provided
            const updateData: any = { ...validatedData };
            if (validatedData.startDate) {
                updateData.startDate = new Date(validatedData.startDate);
            }
            if (validatedData.endDate) {
                updateData.endDate = new Date(validatedData.endDate);
            }

            const voucher = await VoucherService.updateVoucher(id, updateData);

            res.status(200).json({
                success: true,
                data: voucher,
                message: "Voucher updated successfully"
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: error.issues
                });
            }

            // Not found error
            if (error.message === "Voucher not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            // Business logic errors
            if (error.message.includes("must be") ||
                error.message.includes("required") ||
                error.message.includes("already exists") ||
                error.message.includes("cannot exceed")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }

    // DELETE /api/vouchers/:id (Soft delete)
    async deleteVoucher(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const voucher = await VoucherService.deleteVoucher(id);

            res.status(200).json({
                success: true,
                data: voucher,
                message: "Voucher deleted successfully"
            });
        } catch (error: any) {
            if (error.message === "Voucher not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    // POST /api/vouchers/validate
    async validateVoucherCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, cartData, userId } = req.body;

            // Validasi input
            if (!code || !cartData || !userId) {
                return res.status(400).json({
                    success: false,
                    error: "Code, cart data, and user ID are required"
                });
            }

            const result = await VoucherService.validateVoucherCode(code, cartData, userId);

            res.status(200).json({
                success: true,
                data: result,
                message: "Voucher validated successfully"
            });
        } catch (error: any) {
            if (error.message.includes("Invalid") ||
                error.message.includes("expired") ||
                error.message.includes("claim") ||
                error.message.includes("used") ||
                error.message.includes("limit") ||
                error.message.includes("required")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    // POST /api/vouchers/:id/claim
    async claimVoucher(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            // Extract userId
            const userId = user?.id || user?.userId || user?.sub;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized - User ID not found"
                });
            }

            const userVoucher = await VoucherService.claimVoucher(userId, id);

            res.status(201).json({
                success: true,
                data: userVoucher,
                message: "Voucher claimed successfully"
            });
        } catch (error: any) {
            if (error.message === "Voucher not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            if (error.message.includes("not active") ||
                error.message.includes("not valid") ||
                error.message.includes("already claimed") ||
                error.message.includes("maximum usage")) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }

    // GET /api/vouchers/user/:userId
    async getUserVouchers(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const userVouchers = await VoucherService.getUserVouchers(userId);

            res.status(200).json({
                success: true,
                data: userVouchers,
                message: "User vouchers retrieved successfully"
            });
        } catch (error: any) {
            next(error);
        }
    }

    // PATCH /api/vouchers/:id/toggle
    async toggleVoucherStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Validasi input
            const { isActive } = toggleVoucherStatusSchema.parse(req.body);

            const voucher = await VoucherService.toggleVoucherStatus(id, isActive);

            res.status(200).json({
                success: true,
                data: voucher,
                message: `Voucher ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error: any) {
            // Zod validation error
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation error",
                    details: error.issues
                });
            }

            if (error.message === "Voucher not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            next(error);
        }
    }
}

export default new VoucherController();
