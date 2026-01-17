// controllers/search.controller.ts
import type { Request, Response } from "express";
import prisma from "../prisma";
import productService from "../services/product.service"; // Reuse existing service

// controllers/search.controller.ts
// Search Suggestions
export async function getSearchSuggestions(req: Request, res: Response) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    const query = q.trim();

    // Search products
    const productVariants = await productService.searchVariants(query, 5);

    // Search stores
    const stores = await prisma.store.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        isActive: true,
      },
      take: 5,
    });

    // Transform to suggestions
    const productSuggestions = productVariants.map((v: any) => {
      const availableCity = v.product.variants?.[0]?.inventory?.[0]?.store?.city || null;

      return {
        id: v.product.id,
        name: v.product.name,
        type: "product" as const,
        category: v.product.category?.name || "Uncategorized",
        image: v.product.images?.[0]?.imageUrl || null,
        city: availableCity,
      };
    });

    const storeSuggestions = stores.map((s) => ({
      id: s.id,
      name: s.name,
      type: "store" as const,
      city: s.city,
      image: null,
    }));

    // Remove duplicate products
    const uniqueProducts = Array.from(
      new Map(productSuggestions.map((p) => [p.id, p])).values()
    );

    const suggestions = [...uniqueProducts, ...storeSuggestions];

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("[SEARCH SUGGESTIONS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get search suggestions",
      suggestions: [],
    });
  }
}

// Get Available Cities
export async function getAvailableCities(req: Request, res: Response) {
  try {
    const cities = await prisma.store.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });

    const cityList = cities.map((c) => c.city).filter(Boolean);

    return res.status(200).json({
      success: true,
      cities: cityList,
    });
  } catch (error) {
    console.error("[GET CITIES ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get cities",
      cities: [],
    });
  }
}

// Search Products (City-Based)
export async function searchProducts(req: Request, res: Response) {
  try {
    const {
      city,
      search,
      categorySlug,
      storeId,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isDeleted: false,
    };

    // Search filter: Product Name OR Store Name
    if (search && typeof search === "string" && search.trim()) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { 
          variants: { 
            some: { 
              inventory: { 
                some: { 
                  store: { 
                    name: { contains: query, mode: "insensitive" },
                    isActive: true
                  } 
                } 
              } 
            } 
          } 
        }
      ];
    }

    // Category filter
    if (categorySlug && typeof categorySlug === "string") {
      where.category = { slug: categorySlug };
    }

    // Build variants filter
    const variantsFilter: any = {
      isActive: true,
    };

    // Inventory filter with city
    if (city || storeId) {
      variantsFilter.inventory = {
        some: {
          quantity: { gt: 0 },
          store: {
            ...(city && {
              city: {
                contains: city as string,
                mode: "insensitive",
              },
            }),
            ...(storeId && { id: storeId as string }),
            isActive: true,
          },
        },
      };
    } else {
      variantsFilter.inventory = {
        some: {
          quantity: { gt: 0 },
          store: { isActive: true },
        },
      };
    }

    where.variants = {
      some: variantsFilter,
    };

    // Get products
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { order: "asc" },
          },
          variants: {
            where: { isActive: true },
            include: {
              inventory: {
                where: city || storeId
                  ? {
                    quantity: { gt: 0 },
                    store: {
                      isActive: true,
                      ...(city && {
                        city: {
                          contains: city as string,
                          mode: "insensitive",
                        },
                      }),
                      ...(storeId && { id: storeId as string }),
                    },
                  }
                  : {
                    quantity: { gt: 0 },
                    store: { isActive: true },
                  },
                include: {
                  store: true,
                },
              },
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    // Format response
    const data = products.map((product) => {
      const store = product.variants[0]?.inventory[0]?.store;

      const availableStock = product.variants.reduce((total, variant) => {
        const stock = variant.inventory.reduce((sum, inv) => {
          return sum + (inv.quantity - inv.reserved);
        }, 0);
        return total + stock;
      }, 0);

      const lowestPrice = Math.min(
        ...product.variants.map((v) => parseFloat(v.price.toString()))
      );

      return {
        ...product,
        storeId: store?.id || null,
        storeName: store?.name || null,
        storeCity: store?.city || null,
        availableStock,
        lowestPrice,
      };
    });

    const totalPages = Math.ceil(totalItems / limitNum);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("[SEARCH PRODUCTS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      data: [],
      pagination: null,
    });
  }
}

// Search Stores (City-Based)
export async function searchStores(req: Request, res: Response) {
  try {
    const {
      city,
      search,
      hasProduct,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // City filter
    if (city && typeof city === "string" && city.trim()) {
      where.city = {
        contains: city.trim(),
        mode: "insensitive",
      };
    }

    // Hybrid Search: Store Name OR Product Name
    const query = (search as string) || (hasProduct as string);
    if (query && typeof query === "string" && query.trim()) {
      const searchTerm = query.trim();
      where.OR = [
        // Match Store Name
        { 
          name: { contains: searchTerm, mode: "insensitive" } 
        },
        // Match Product Name in Inventory
        {
          inventory: {
            some: {
              quantity: { gt: 0 },
              productVariant: {
                isActive: true,
                product: {
                  name: { contains: searchTerm, mode: "insensitive" },
                  isDeleted: false,
                },
              },
            },
          }
        }
      ];
    }

    // Get stores
    const [stores, totalItems] = await Promise.all([
      prisma.store.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          province: true,
          phone: true,
          _count: {
            select: {
              inventory: {
                where: {
                  quantity: { gt: 0 },
                  productVariant: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { name: "asc" },
      }),
      prisma.store.count({ where }),
    ]);

    // Format response
    const data = stores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      province: store.province,
      phone: store.phone,
      totalProducts: store._count.inventory,
    }));

    const totalPages = Math.ceil(totalItems / limitNum);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("[SEARCH STORES ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mencari toko",
      data: [],
      pagination: null,
    });
  }
}