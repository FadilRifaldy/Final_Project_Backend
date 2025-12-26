import productImageService from "../services/productImage.service";
import { Request, Response, NextFunction } from "express";

class ProductImageController {
    async uploadImages(req: Request, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params
            const files = req.files as Express.Multer.File[]

            if (!productId || !files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "no file uploaded"
                })
            }

            const images = await productImageService.uploadImages(productId, files)

            return res.status(201).json({
                success: true,
                data: images,
                message: `${images.length} images uploaded successfully`,
            })

        } catch (error: any) {
            next(error)
        }
    }


}
export default new ProductImageController()