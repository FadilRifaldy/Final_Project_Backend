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

        console.log(`[ProductImageService] Starting upload for ${files.length} files`);

        // Upload ke cloudinary dengan individual error handling
        const uploadResults: Array<{ success: boolean; result?: any; error?: any; index: number }> = [];

        for (let i = 0; i < files.length; i++) {
            try {
                console.log(`[ProductImageService] Uploading file ${i + 1}/${files.length}`);
                const result = await this.uploadToCloudinary(files[i].buffer);
                uploadResults.push({ success: true, result, index: i });
                console.log(`[ProductImageService] File ${i + 1} uploaded successfully: ${result.secure_url}`);
            } catch (error) {
                console.error(`[ProductImageService] Failed to upload file ${i + 1}:`, error);
                uploadResults.push({ success: false, error, index: i });
            }
        }

        // Filter hanya yang berhasil
        const successfulUploads = uploadResults.filter(r => r.success);

        if (successfulUploads.length === 0) {
            throw new Error("All image uploads failed");
        }

        console.log(`[ProductImageService] ${successfulUploads.length}/${files.length} files uploaded successfully`);

        // Save ke database lewat prisma atomic transaction
        try {
            const images = await prisma.$transaction(
                successfulUploads.map((upload) => prisma.productImage.create({
                    data: {
                        productId,
                        imageUrl: upload.result!.secure_url,
                        order: upload.index
                    }
                }))
            )

            console.log(`[ProductImageService] ${images.length} images saved to database`);

            // Log failed uploads
            const failedUploads = uploadResults.filter(r => !r.success);
            if (failedUploads.length > 0) {
                console.warn(`[ProductImageService] ${failedUploads.length} files failed to upload`);
            }

            return images;
        } catch (error) {
            console.error("[ProductImageService] Database save failed, cleaning up cloudinary uploads");
            // Cleanup: delete uploaded images from cloudinary
            await Promise.allSettled(
                successfulUploads.map(upload =>
                    cloudinary.uploader.destroy(upload.result!.public_id)
                )
            )
            throw error
        }
    }
}

export default new ProductImageService()
