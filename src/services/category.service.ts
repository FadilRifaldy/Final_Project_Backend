import prisma from "../prisma";

/**
 * Category Service
 * Business logic untuk Category CRUD operations
 */

class CategoryService {
  /**
   * Get all categories
   * TODO: Include product count untuk setiap category
   */
  async getAllCategories() {
    // HINT: Gunakan prisma.category.findMany()
    // HINT: Pakai _count untuk hitung jumlah products
    const categories = await prisma.category.findMany({
      where: {
        // hanya ambil kategori yang belum di-soft delete
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    return categories;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    // HINT: Gunakan findUnique
    // HINT: Include _count untuk products
    // HINT: Throw error jika tidak ditemukan
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }

  /**
   * Create new category
   */
  async createCategory(name: string, description?: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("Category name is required");
    }
    try {
      const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");
      const category = await prisma.category.create({
        data: {
          name: trimmedName,
          slug,
          // description optional, bisa null kalau tidak diisi
          description: description?.trim() || null,
        },
      });
      return category;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Category name already exists");
      }
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, name: string, description?: string) {
    try {
      await this.getCategoryById(id);
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Category name is required");
      }
      const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");
      const category = await prisma.category.update({
        where: { id },
        data: {
          name: trimmedName,
          slug,
          description: description?.trim() || null,
        },
      });
      return category;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Category name already exists");
      }
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string) {
    // HINT: Check apakah category exists dan belum di-soft delete
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new Error("Category not found");
    }

    if (category._count.products > 0) {
      throw new Error("Cannot delete category with products");
    }

    // Soft delete: tandai deletedAt, tidak benar-benar dihapus dari DB
    const softDeleted = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return softDeleted;
  }
}

export default new CategoryService();
