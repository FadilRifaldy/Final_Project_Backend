import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Product templates dengan variants
const productTemplates = [
    {
        name: 'Beras Premium',
        category: 'Sembako',
        variants: [
            { size: '5kg', price: 65000, stock: 50 },
            { size: '10kg', price: 125000, stock: 30 },
            { size: '25kg', price: 300000, stock: 20 },
        ]
    },
    {
        name: 'Minyak Goreng',
        category: 'Sembako',
        variants: [
            { size: '1L', price: 18000, stock: 100 },
            { size: '2L', price: 35000, stock: 80 },
            { size: '5L', price: 85000, stock: 40 },
        ]
    },
    {
        name: 'Gula Pasir',
        category: 'Sembako',
        variants: [
            { size: '1kg', price: 15000, stock: 150 },
            { size: '5kg', price: 72000, stock: 60 },
            { size: '10kg', price: 140000, stock: 30 },
        ]
    },
    {
        name: 'Tepung Terigu',
        category: 'Sembako',
        variants: [
            { size: '1kg', price: 12000, stock: 120 },
            { size: '5kg', price: 58000, stock: 50 },
            { size: '10kg', price: 110000, stock: 25 },
        ]
    },
    {
        name: 'Kopi Bubuk',
        category: 'Minuman',
        variants: [
            { size: '100g', price: 25000, stock: 80 },
            { size: '250g', price: 60000, stock: 50 },
            { size: '500g', price: 115000, stock: 30 },
        ]
    },
    {
        name: 'Teh Celup',
        category: 'Minuman',
        variants: [
            { size: '25 sachet', price: 15000, stock: 100 },
            { size: '50 sachet', price: 28000, stock: 70 },
            { size: '100 sachet', price: 52000, stock: 40 },
        ]
    },
    {
        name: 'Susu UHT',
        category: 'Minuman',
        variants: [
            { size: '200ml', price: 5000, stock: 200 },
            { size: '1L', price: 18000, stock: 100 },
            { size: '1L (6 pack)', price: 100000, stock: 50 },
        ]
    },
    {
        name: 'Mie Instan',
        category: 'Makanan',
        variants: [
            { size: '1 pcs', price: 3000, stock: 500 },
            { size: '5 pcs', price: 14000, stock: 200 },
            { size: '1 dus (40 pcs)', price: 110000, stock: 50 },
        ]
    },
];

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Get or create categories
    const categoryMap = new Map<string, string>();
    for (const template of productTemplates) {
        if (!categoryMap.has(template.category)) {
            const category = await prisma.category.upsert({
                where: {
                    name: template.category
                },
                update: {},
                create: {
                    name: template.category,
                    slug: template.category.toLowerCase().replace(/\s+/g, '-'),
                },
            });
            categoryMap.set(template.category, category.id);
            console.log(`✅ Category: ${category.name}`);
        }
    }

    // 2. Get first store (atau buat jika belum ada)
    let store = await prisma.store.findFirst();
    if (!store) {
        store = await prisma.store.create({
            data: {
                name: 'Toko Pusat',
                address: 'Jl. Raya No. 123',
                city: 'Jakarta',
                province: 'DKI Jakarta',
                postalCode: '12345',
                phone: '081234567890',
                latitude: -6.2088,
                longitude: 106.8456,
                isActive: true,
            },
        });
        console.log(`✅ Store created: ${store.name}`);
    }

    // 3. Create products with variants
    for (const template of productTemplates) {
        const categoryId = categoryMap.get(template.category)!;

        // Create product
        const product = await prisma.product.create({
            data: {
                name: template.name,
                description: `${template.name} berkualitas tinggi dengan berbagai pilihan ukuran`,
                categoryId,
                isDeleted: false,
            },
        });

        // Generate slug for variants
        const productSlug = template.name.toLowerCase().replace(/\s+/g, '-');

        console.log(`\n📦 Product: ${product.name}`);

        // Create variants for this product
        for (let i = 0; i < template.variants.length; i++) {
            const variantData = template.variants[i];

            // Generate SKU
            const productCode = template.name.substring(0, 3).toUpperCase();
            const sizeCode = variantData.size.replace(/\s+/g, '').substring(0, 3).toUpperCase();
            const sku = `${productCode}-${sizeCode}-${String(i + 1).padStart(3, '0')}`;

            const variant = await prisma.productVariant.create({
                data: {
                    productId: product.id,
                    name: `${template.name} ${variantData.size}`,
                    slug: `${productSlug}-${variantData.size.toLowerCase().replace(/\s+/g, '-')}`,
                    sku,
                    price: variantData.price,
                    size: variantData.size,
                    weight: 1000, // Default 1kg
                    isActive: true,
                },
            });

            // Create inventory for this variant
            await prisma.inventory.create({
                data: {
                    storeId: store.id,
                    productVariantId: variant.id,
                    quantity: variantData.stock,
                    reserved: 0,
                },
            });

            console.log(`  ✓ ${variant.name} - ${sku} - Rp ${variantData.price.toLocaleString()} (Stock: ${variantData.stock})`);
        }
    }

    console.log('\n✨ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
