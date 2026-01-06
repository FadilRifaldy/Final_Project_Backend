import { Router } from "express";
import productVariantImageController from "../controllers/productVariantImage.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

// All routes require authentication dan SUPER_ADMIN role
router.use(verifyToken);
router.use(checkRoles(["SUPER_ADMIN"]));

// Assign/Remove images to variant
router.post(
    "/:variantId/images/assign",
    productVariantImageController.assignImage
);

router.post(
    "/:variantId/images/bulk-assign",
    productVariantImageController.bulkAssignImages
);

router.delete(
    "/:variantId/images/:imageId",
    productVariantImageController.removeImage
);

router.put(
    "/:variantId/images/:imageId/primary",
    productVariantImageController.setPrimaryImage
);

// Get variant images
router.get(
    "/:variantId/images",
    productVariantImageController.getVariantImages
);

export default router;
