import productVariantService from "../services/productVariant.service";
import { Request, Response, NextFunction } from "express";

class ProductVariantController {

    async getVariantsByProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params
            const variants = await productVariantService.getVariantsByProduct(productId)
            res.status(200).json({
                success: true,
                data: variants,
                message: "Variants retrieved successfully"
            })
        } catch (error: any) {
            if (error.message === "Product not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error)
        }
    }


    async createVariant(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params
            const { name, price, color, size, weight } = req.body
            const variant = await productVariantService.createVariant(productId, name, price, color, size, weight)

            if (!name || !price) {
                return res.status(400).json({
                    success: false,
                    error: "Name and price are required",
                });
            }

            res.status(201).json(
                {
                    success: true,
                    data: variant,
                    message: "Variant created successfully"
                }
            )
        } catch (error: any) {
            if (error.message === "Product not found") {
                return res.status(404).json({
                    success: false,
                    error: error.message,
                });
            }

            if (error.message === "SKU or Slug already exists.") {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
}

export default new ProductVariantController()