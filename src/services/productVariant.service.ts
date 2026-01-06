import prisma from "../prisma";
import { generateSKU } from "../lib/sku.util";
import { extractProductCode } from "../lib/productCode.util";
import { generateSlug } from "../lib/slug.util";

class ProductVariantService {

    async getVariantsByProduct(productId: string) {
        // cek product nya dulu ada/tidak
        const product = await prisma.product.findUnique({
            where: {
                id: productId,
                isDeleted: false
            }
        })
        if (!product) {
            throw new Error("Product not found")
        }

        // get all variant dengan images
        const variants = await prisma.productVariant.findMany({
            where: {
                productId,
                isActive: true
            },
            orderBy: {
                createdAt: "asc"
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                assignedImages: {
                    include: {
                        image: true
                    },
                    orderBy: [
                        { isPrimary: "desc" },
                        { createdAt: "asc" }
                    ]
                }
            }
        })
        return variants
    }

    async createVariant(
        productId: string,
        name: string,
        price: number,
        color?: string,
        size?: string,
        weight: number = 0,
    ) {
        const product = await prisma.product.findUnique({
            where: {
                id: productId
            }
        })
        if (!product) {
            throw new Error("Product not found")
        }
        // generate slug
        const slug = generateSlug(name)

        // bikin product code dan hitung variant
        const productCode = extractProductCode(product.name)
        const variantCount = await prisma.productVariant.count({
            where: { productId }
        })
        const counter = variantCount + 1

        // generate sku
        const sku = generateSKU(productCode, color, size, counter)

        // create variant
        try {
            const variant = await prisma.productVariant.create({
                data: {
                    productId,
                    name,
                    slug,
                    sku,
                    price,
                    weight,
                    color,
                    size,
                }
            })
            return variant

        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error("SKU or Slug already exists")
            }
            throw error
        }
    }
}

export default new ProductVariantService();