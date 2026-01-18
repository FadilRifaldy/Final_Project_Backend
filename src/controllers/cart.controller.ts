// controllers/cart.controller.ts
import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /cart
 * Get user's cart with all items
 */
export async function getCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                assignedImages: {
                  include: {
                    image: {
                      select: {
                        imageUrl: true,
                        order: true,
                      },
                    },
                  },
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
                inventory: {
                  where: {
                    storeId: undefined, // Will be set dynamically
                  },
                  select: {
                    quantity: true,
                    reserved: true,
                    storeId: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cart) {
      return res.json({
        success: true,
        data: null,
        message: 'Keranjang kosong',
      });
    }

    // Re-fetch inventory with correct storeId
    const formattedItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const inventory = await prisma.inventory.findFirst({
          where: {
            productVariantId: item.productVariant.id,
            storeId: cart.storeId,
          },
        });

        const availableStock = inventory ? inventory.quantity - inventory.reserved : 0;
        
        // Get primary image
        const primaryImage = item.productVariant.assignedImages.find((img: any) => img.isPrimary);
        const imageUrl = primaryImage 
          ? primaryImage.image.imageUrl 
          : item.productVariant.assignedImages[0]?.image.imageUrl || null;

        return {
          id: item.id,
          quantity: item.quantity,
          priceAtAdd: Number(item.priceAtAdd),
          variant: {
            id: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.name,
            slug: item.productVariant.slug,
            price: Number(item.productVariant.price),
            color: item.productVariant.color,
            size: item.productVariant.size,
            weight: item.productVariant.weight,
            isActive: item.productVariant.isActive,
            product: {
              id: item.productVariant.product.id,
              name: item.productVariant.product.name,
              category: item.productVariant.product.category,
            },
            primaryImage: imageUrl,
            availableStock,
          },
          subtotal: Number(item.priceAtAdd) * item.quantity,
        };
      })
    );

    // Calculate summary
    const subtotal = formattedItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const totalItems = formattedItems.length;
    const totalQuantity = formattedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const estimatedWeight = formattedItems.reduce(
      (sum: number, item: any) => sum + item.variant.weight * item.quantity,
      0
    );

    return res.json({
      success: true,
      data: {
        id: cart.id,
        store: cart.store,
        items: formattedItems,
        summary: {
          subtotal,
          totalItems,
          totalQuantity,
          estimatedWeight,
        },
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting cart:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal memuat keranjang',
    });
  }
}

/**
 * POST /cart
 * Add item to cart
 */
export async function addItemToCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { productVariantId, quantity = 1, storeId } = req.body;

    // Validation
    if (!productVariantId) {
      return res.status(400).json({
        success: false,
        message: 'Product variant ID wajib diisi',
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID wajib diisi',
      });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah minimal adalah 1',
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          storeId,
        },
      });
    } else if (cart.storeId !== storeId) {
      // Check if cart has items from different store
      const itemCount = await prisma.cartItem.count({
        where: { cartId: cart.id },
      });

      if (itemCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Keranjang Anda sudah berisi produk dari toko lain. Harap checkout atau kosongkan keranjang terlebih dahulu.',
        });
      }

      // Update cart store if empty
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId },
      });
    }

    // Get product variant with price and stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: {
        inventory: {
          where: { storeId },
        },
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan',
      });
    }

    if (!variant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Produk tidak tersedia',
      });
    }

    // Check stock availability
    const inventory = variant.inventory[0];
    const availableStock = inventory ? inventory.quantity - inventory.reserved : 0;

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Tersedia: ${availableStock}, Diminta: ${quantity}`,
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (availableStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi. Tersedia: ${availableStock}, Diminta: ${newQuantity}`,
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          priceAtAdd: variant.price,
        },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productVariantId,
          quantity,
          priceAtAdd: variant.price,
        },
      });
    }

    // Get updated cart summary
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const totalItems = updatedCart?.items.length || 0;
    const totalQuantity = updatedCart?.items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

    return res.json({
      success: true,
      message: 'Item berhasil ditambahkan ke keranjang',
      data: {
        totalItems,
        totalQuantity,
      },
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return res.status(400).json({
      success: false,
      message: 'Gagal menambahkan item ke keranjang',
    });
  }
}

/**
 * PUT /cart/:itemId
 * Update cart item quantity
 */
export async function updateCartItem(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validation
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah minimal adalah 1',
      });
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
      include: {
        cart: true,
        productVariant: {
          include: {
            inventory: {
              where: {
                storeId: undefined, // Will be set dynamically
              },
            },
          },
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan di keranjang',
      });
    }

    // Get inventory for the cart's store
    const inventory = await prisma.inventory.findFirst({
      where: {
        productVariantId: cartItem.productVariant.id,
        storeId: cartItem.cart.storeId,
      },
    });

    const availableStock = inventory ? inventory.quantity - inventory.reserved : 0;

    if (availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Tersedia: ${availableStock}, Diminta: ${quantity}`,
      });
    }

    // Update cart item
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Get updated cart summary
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            quantity: true,
            priceAtAdd: true,
          },
        },
      },
    });

    const totalItems = updatedCart?.items.length || 0;
    const totalQuantity = updatedCart?.items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const subtotal = updatedCart?.items.reduce(
      (sum: number, item: any) => sum + Number(item.priceAtAdd) * item.quantity,
      0
    ) || 0;

    return res.json({
      success: true,
      message: 'Jumlah item berhasil diperbarui',
      data: {
        totalItems,
        totalQuantity,
        subtotal,
      },
    });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return res.status(400).json({
      success: false,
      message: 'Gagal memperbarui jumlah item',
    });
  }
}

/**
 * DELETE /cart/:itemId
 * Remove item from cart
 */
export async function deleteCartItem(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan di keranjang',
      });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Get updated cart summary
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            quantity: true,
            priceAtAdd: true,
          },
        },
      },
    });

    const totalItems = updatedCart?.items.length || 0;
    const totalQuantity = updatedCart?.items.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const subtotal = updatedCart?.items.reduce(
      (sum: number, item: any) => sum + Number(item.priceAtAdd) * item.quantity,
      0
    ) || 0;

    return res.json({
      success: true,
      message: 'Item berhasil dihapus dari keranjang',
      data: {
        totalItems,
        totalQuantity,
        subtotal,
      },
    });
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    return res.status(400).json({
      success: false,
      message: 'Gagal menghapus item dari keranjang',
    });
  }
}

/**
 * DELETE /cart
 * Clear all items from cart
 */
export async function clearUserCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.json({
        success: true,
        message: 'Keranjang sudah kosong',
      });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return res.json({
      success: true,
      message: 'Keranjang berhasil dikosongkan',
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengosongkan keranjang',
    });
  }
}

/**
 * POST /cart/validate
 * Validate cart before checkout
 */
export async function validateUserCart(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang kosong',
        data: {
          isValid: false,
        },
      });
    }

    const errors: string[] = [];

    for (const item of cart.items) {
      // Check if variant is active
      if (!item.productVariant.isActive) {
        errors.push(`${item.productVariant.name} tidak tersedia lagi`);
        continue;
      }

      // Check stock availability
      const inventory = await prisma.inventory.findFirst({
        where: {
          productVariantId: item.productVariant.id,
          storeId: cart.storeId,
        },
      });

      const availableStock = inventory ? inventory.quantity - inventory.reserved : 0;

      if (availableStock < item.quantity) {
        errors.push(
          `${item.productVariant.name}: Stok tidak mencukupi (Tersedia: ${availableStock}, Di keranjang: ${item.quantity})`
        );
      }

      // Check if price changed significantly (more than 10%)
      const currentPrice = Number(item.productVariant.price);
      const priceAtAdd = Number(item.priceAtAdd);
      const priceChange = Math.abs(currentPrice - priceAtAdd) / priceAtAdd;

      if (priceChange > 0.1) {
        errors.push(
          `${item.productVariant.name}: Harga berubah dari Rp ${priceAtAdd.toLocaleString('id-ID')} menjadi Rp ${currentPrice.toLocaleString('id-ID')}`
        );
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('; '),
        data: {
          isValid: false,
        },
      });
    }

    // Calculate summary
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + Number(item.priceAtAdd) * item.quantity,
      0
    );
    const totalItems = cart.items.length;
    const totalQuantity = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const estimatedWeight = cart.items.reduce(
      (sum: number, item: any) => sum + item.productVariant.weight * item.quantity,
      0
    );

    return res.json({
      success: true,
      message: 'Keranjang valid',
      data: {
        isValid: true,
        summary: {
          subtotal,
          totalItems,
          totalQuantity,
          estimatedWeight,
        },
      },
    });
  } catch (error: any) {
    console.error('Error validating cart:', error);
    return res.status(400).json({
      success: false,
      message: 'Validasi keranjang gagal',
      data: {
        isValid: false,
      },
    });
  }
}