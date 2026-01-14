import multer from "multer";
import path from "path";
import { NextFunction, Request, Response } from "express";

export const fileUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (request, file, cb) => {
        const allowedTypes = /jpg|jpeg|png|gif|webp/i;
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        const extName = path.extname(file.originalname);

        const isTypeValid = allowedTypes.test(extName);
        const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);

        if (isTypeValid && isMimeTypeValid) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, JPEG, PNG, GIF, and WEBP files are allowed"));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    },
})

export const uploadSingle = fileUpload.single("image");
export const uploadMultiple = fileUpload.array("images", 5);

export const handleUploadError = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size exceeds the limit" });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ message: "File upload maximum 5 files" });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err.message === "Only JPG, JPEG, PNG, GIF, and WEBP files are allowed") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
}
