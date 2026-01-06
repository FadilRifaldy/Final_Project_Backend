import { Request, Response, NextFunction } from "express";
import productVariantImageService from "../services/productVariantImage.service";

class ProductVariantImageController {
    /**
     * POST /api/products/var/:variantId/images/assign
     * Assign image to variant
     */
    async assignImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId } = req.params;
            const { productImageId, isPrimary } = req.body;

            if (!productImageId) {
                return res.status(400).json({
                    success: false,
                    error: "productImageId is required",
                });
            }

            const assignment = await productVariantImageService.assignImageToVariant(
                variantId,
                productImageId,
                isPrimary || false
            );

            res.status(201).json({
                success: true,
                data: assignment,
                message: "Image assigned to variant successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * DELETE /api/products/var/:variantId/images/:imageId
     * Remove image from variant
     */
    async removeImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId, imageId } = req.params;

            const result = await productVariantImageService.removeImageFromVariant(
                variantId,
                imageId
            );

            res.status(200).json({
                success: true,
                data: result,
                message: "Image removed from variant successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * PUT /api/products/var/:variantId/images/:imageId/primary
     * Set image as primary
     */
    async setPrimaryImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId, imageId } = req.params;

            const assignment = await productVariantImageService.setPrimaryImage(
                variantId,
                imageId
            );

            res.status(200).json({
                success: true,
                data: assignment,
                message: "Primary image set successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/products/var/:variantId/images
     * Get all images for variant
     */
    async getVariantImages(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId } = req.params;

            const assignments = await productVariantImageService.getVariantImages(
                variantId
            );

            res.status(200).json({
                success: true,
                data: assignments,
                message: "Variant images retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * POST /api/products/var/:variantId/images/bulk-assign
     * Bulk assign images to variant
     */
    async bulkAssignImages(req: Request, res: Response, next: NextFunction) {
        try {
            const { variantId } = req.params;
            const { imageIds, primaryImageId } = req.body;

            if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "imageIds array is required and must not be empty",
                });
            }

            const assignments = await productVariantImageService.bulkAssignImages(
                variantId,
                imageIds,
                primaryImageId
            );

            res.status(201).json({
                success: true,
                data: assignments,
                message: "Images assigned to variant successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * GET /api/products/images/:imageId/variants
     * Get variants using this image
     */
    async getVariantsByImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { imageId } = req.params;

            const variants = await productVariantImageService.getVariantsByImage(
                imageId
            );

            res.status(200).json({
                success: true,
                data: variants,
                message: "Variants retrieved successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }
}

export default new ProductVariantImageController();
