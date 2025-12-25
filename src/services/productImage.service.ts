import { Readable } from "stream";
import cloudinary from "../lib/cloudinary";
import prisma from "../prisma";

class ProductImageService {
    // Helper cloudinary nya
    private uploadToCloudinary(buffer: Buffer): Promise<any> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'products' }, (error, result) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(result)
                    }
                })
            Readable.from(buffer).pipe(stream)
        })
    }

    // Main function untuk services nya

    async uploadImages(productId: string, files: Express.Multer.File[]) {
        // validasi produck
        const product = await prisma.product.findUnique({
            where: {
                id: productId
            }
        })
        if (!product) {
            throw new Error("Product not found")
        }

        // upload ke cloudinareeh
        const uploadResults = await Promise.all(
            files.map(file => this.uploadToCloudinary(file.buffer))
        )

        // save ke database lewat prisma atomic txc
        try {
            const images = await prisma.$transaction(
                uploadResults.map((result, index) => prisma.productImage.create({
                    data: {
                        productId,
                        imageUrl: result.secure_url,
                        order: index
                    }
                }))
            )
            return images
        } catch (error) {
            await Promise.all(
                uploadResults.map(result => cloudinary.uploader.destroy(result.public_id))
            )
            throw error
        }
    }
}

export default new ProductImageService()
