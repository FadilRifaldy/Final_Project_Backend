import prisma from "../prisma";

class ProductService {

  async getAllProducts(
    page: number = 1,
    limit: number = 10,
    city?: string // ← TAMBAH parameter city
  ) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = { isDeleted: false };

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { order: "asc" },
          },
          variants: {
            where: { isActive: true },
            include: {
              inventory: {
                where: {
                  quantity: { gt: 0 }, // ← Hanya yang ada stock
                  ...(city && {
                    store: {
                      city: city, // ← Filter by city
                      isActive: true,
                    },
                  }),
                },
                include: {
                  store: {
                    select: {
                      id: true,
                      name: true,
                      city: true,
                      address: true,
                    },
                  },
                },
                orderBy: {
                  quantity: "desc", // ← Store dengan stock terbanyak duluan
                },
                take: 1, // ← Ambil 1 store saja per variant
              },
            },
          },
        },
      }),
      prisma.product.count({
        where: whereClause,
      }),
    ]);

    // Transform data: ambil store dari variant pertama yang punya stock
    const productsWithStore = products.map((product) => {
      // Cari variant pertama yang punya inventory
      const variantWithStock = product.variants.find(
        (v) => v.inventory && v.inventory.length > 0
      );

      return {
        ...product,
        // Attach store info dari inventory
        store: variantWithStock?.inventory[0]?.store || null,
      };
    }).filter((p) => p.store !== null); // ← Filter out products tanpa stock di city ini

    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      products: productsWithStore,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: productsWithStore.length,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async createProduct(name: string, description: string, categoryId: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Product name is required");
    }

    // Validasi category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.deletedAt) {
      throw new Error("Category not found");
    }

    try {
      const product = await prisma.product.create({
        data: {
          name: trimmedName,
          description,
          categoryId,
        },
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      });
      return product;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Product name already exists");
      }
      throw error;
    }
  }

  async updateProduct(
    id: string,
    name: string,
    description: string,
    categoryId: string
  ) {
    try {
      await this.getProductById(id);

      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Product name is required");
      }
      // validasi category
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category || category.deletedAt) {
        throw new Error("Category not found");
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: trimmedName,
          description,
          categoryId,
        },
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      });
      return product;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Product name already exists");
      }
      throw error;
    }
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    // Soft delete: set isDeleted = true
    const deletedProduct = await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    return deletedProduct;
  }
}
export default new ProductService();
