-- CreateTable
CREATE TABLE "product_variant_images" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "productImageId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variant_images_productVariantId_idx" ON "product_variant_images"("productVariantId");

-- CreateIndex
CREATE INDEX "product_variant_images_productImageId_idx" ON "product_variant_images"("productImageId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_images_productVariantId_productImageId_key" ON "product_variant_images"("productVariantId", "productImageId");

-- AddForeignKey
ALTER TABLE "product_variant_images" ADD CONSTRAINT "product_variant_images_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_images" ADD CONSTRAINT "product_variant_images_productImageId_fkey" FOREIGN KEY ("productImageId") REFERENCES "product_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
