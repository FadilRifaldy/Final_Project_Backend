import prisma from "../prisma";

class ProductVariantImageService {
    /**
     * Assign product image to variant
     * Jika isPrimary = true, set image lain jadi false
     */
    async assignImageToVariant(
        variantId: string,
        imageId: string,
        isPrimary: boolean = false
    ) {
        // Validasi: Check variant exists
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true },
        });

        if (!variant) {
            throw new Error("Product variant not found");
        }

        // Validasi: Check image exists dan belongs to same product
        const image = await prisma.productImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            throw new Error("Product image not found");
        }

        if (image.productId !== variant.productId) {
            throw new Error("Image does not belong to the same product");
        }

        // Check if already assigned
        const existing = await prisma.productVariantImage.findUnique({
            where: {
                productVariantId_productImageId: {
                    productVariantId: variantId,
                    productImageId: imageId,
                },
            },
        });

        if (existing) {
            // Update isPrimary if needed
            if (isPrimary && !existing.isPrimary) {
                return await this.setPrimaryImage(variantId, imageId);
            }
            return existing;
        }

        // Jika isPrimary = true, set semua image lain jadi false
        if (isPrimary) {
            await prisma.productVariantImage.updateMany({
                where: { productVariantId: variantId },
                data: { isPrimary: false },
            });
        }

        // Create assignment
        const assignment = await prisma.productVariantImage.create({
            data: {
                productVariantId: variantId,
                productImageId: imageId,
                isPrimary,
            },
            include: {
                image: true,
                variant: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return assignment;
    }

    /**
     * Remove image assignment from variant
     */
    async removeImageFromVariant(variantId: string, imageId: string) {
        const assignment = await prisma.productVariantImage.findUnique({
            where: {
                productVariantId_productImageId: {
                    productVariantId: variantId,
                    productImageId: imageId,
                },
            },
        });

        if (!assignment) {
            throw new Error("Image assignment not found");
        }

        await prisma.productVariantImage.delete({
            where: {
                productVariantId_productImageId: {
                    productVariantId: variantId,
                    productImageId: imageId,
                },
            },
        });

        // Jika yang dihapus adalah primary image, set image pertama jadi primary
        if (assignment.isPrimary) {
            const firstImage = await prisma.productVariantImage.findFirst({
                where: { productVariantId: variantId },
                orderBy: { createdAt: "asc" },
            });

            if (firstImage) {
                await prisma.productVariantImage.update({
                    where: { id: firstImage.id },
                    data: { isPrimary: true },
                });
            }
        }

        return { success: true, message: "Image removed from variant" };
    }

    /**
     * Set primary image untuk variant
     * Otomatis set image lain jadi false
     */
    async setPrimaryImage(variantId: string, imageId: string) {
        // Check assignment exists
        const assignment = await prisma.productVariantImage.findUnique({
            where: {
                productVariantId_productImageId: {
                    productVariantId: variantId,
                    productImageId: imageId,
                },
            },
        });

        if (!assignment) {
            throw new Error("Image not assigned to this variant");
        }

        // Set all images to non-primary
        await prisma.productVariantImage.updateMany({
            where: { productVariantId: variantId },
            data: { isPrimary: false },
        });

        // Set selected image as primary
        const updated = await prisma.productVariantImage.update({
            where: {
                productVariantId_productImageId: {
                    productVariantId: variantId,
                    productImageId: imageId,
                },
            },
            data: { isPrimary: true },
            include: {
                image: true,
            },
        });

        return updated;
    }

    /**
     * Get all images assigned to variant
     */
    async getVariantImages(variantId: string) {
        const assignments = await prisma.productVariantImage.findMany({
            where: { productVariantId: variantId },
            include: {
                image: true,
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });

        return assignments;
    }

    /**
     * Get primary image untuk variant
     */
    async getPrimaryImage(variantId: string) {
        const assignment = await prisma.productVariantImage.findFirst({
            where: {
                productVariantId: variantId,
                isPrimary: true,
            },
            include: {
                image: true,
            },
        });

        return assignment;
    }

    /**
     * Bulk assign images to variant
     * Useful untuk assign multiple images sekaligus
     */
    async bulkAssignImages(
        variantId: string,
        imageIds: string[],
        primaryImageId?: string
    ) {
        // Validasi variant exists
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true },
        });

        if (!variant) {
            throw new Error("Product variant not found");
        }

        // Validasi all images exist dan belongs to same product
        const images = await prisma.productImage.findMany({
            where: {
                id: { in: imageIds },
                productId: variant.productId,
            },
        });

        if (images.length !== imageIds.length) {
            throw new Error("Some images not found or do not belong to the product");
        }

        // Remove existing assignments
        await prisma.productVariantImage.deleteMany({
            where: { productVariantId: variantId },
        });

        // Create new assignments
        const assignments = await Promise.all(
            imageIds.map((imageId, index) =>
                prisma.productVariantImage.create({
                    data: {
                        productVariantId: variantId,
                        productImageId: imageId,
                        isPrimary: imageId === primaryImageId || (index === 0 && !primaryImageId),
                    },
                    include: {
                        image: true,
                    },
                })
            )
        );

        return assignments;
    }

    /**
     * Get variants yang menggunakan image tertentu
     */
    async getVariantsByImage(imageId: string) {
        const assignments = await prisma.productVariantImage.findMany({
            where: { productImageId: imageId },
            include: {
                variant: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return assignments.map((a: any) => a.variant);
    }
}

export default new ProductVariantImageService();
