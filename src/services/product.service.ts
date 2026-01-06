import prisma from "../prisma";

class ProductService {
  async getAllProducts(page: number = 1, limit: number = 10) {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
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
          _count: {
            select: {
              variants: true,
            },
          },
        },
      }),
      prisma.product.count({
        where: { isDeleted: false },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
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
