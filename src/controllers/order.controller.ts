
import { Request, Response } from 'express';
import prisma from '../prisma';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../generated/prisma/enums';

/**
 * CREATE ORDER (Super Simple Version)
 * POST /api/orders
 * 
 * Body:
 * {
 *   "productVariantId": "uuid",
 *   "quantity": 1,
 *   "addressId": "uuid",
 *   "storeId": "uuid"
 * }
 */
export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id; // Dari auth middleware
        const { productVariantId, quantity, addressId, storeId } = req.body;

        // Validasi input
        if (!productVariantId || !quantity || !addressId || !storeId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // 1. Get product variant info
        const variant = await prisma.productVariant.findUnique({
            where: { id: productVariantId },
            include: {
                product: true
            }
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Product variant not found'
            });
        }

        // 2. Check stock
        const inventory = await prisma.inventory.findUnique({
            where: {
                productVariantId_storeId: {
                    productVariantId,
                    storeId
                }
            }
        });

        if (!inventory || inventory.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // 3. Verify address belongs to user
        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // 4. Calculate prices (simplified - no discount/voucher)
        const price = variant.price;
        const itemSubtotal = price.toNumber() * quantity;
        const shippingFee = 10000; // Hardcoded untuk MVP
        const total = itemSubtotal + shippingFee;

        // 5. Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // 6. Create order with transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    orderNumber,
                    shippingAddressId: addressId,
                    shippingStoreId: storeId,

                    // Shipping info (hardcoded untuk MVP)
                    shippingCourier: 'JNE',
                    shippingService: 'REG',
                    shippingDescription: 'Layanan Reguler',
                    shippingEstimate: '2-3 hari',
                    shippingFee,

                    subtotal: itemSubtotal,
                    tax: 0,
                    totalDiscount: 0,
                    total,

                    paymentMethod: PaymentMethod.MANUAL_TRANSFER,
                    paymentStatus: PaymentStatus.UNPAID,
                    orderStatus: OrderStatus.PENDING_PAYMENT,

                    // Auto cancel after 1 hour if not paid
                    autoCancelAt: new Date(Date.now() + 60 * 60 * 1000),

                    items: {
                        create: {
                            productVariantId,
                            sku: variant.sku,
                            productName: variant.product.name,
                            variantName: variant.name,
                            price,
                            quantity,
                            subtotal: itemSubtotal,
                            discount: 0,
                            total: itemSubtotal
                        }
                    }
                },
                include: {
                    items: {
                        include: {
                            productVariant: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    },
                    shippingAddress: true,
                    shippingStore: true
                }
            });

            // Create order history
            await tx.orderHistory.create({
                data: {
                    orderId: newOrder.id,
                    fromStatus: null,
                    toStatus: OrderStatus.PENDING_PAYMENT,
                    note: 'Order created',
                    createdBy: userId
                }
            });

            // Reserve stock
            await tx.inventory.update({
                where: {
                    productVariantId_storeId: {
                        productVariantId,
                        storeId
                    }
                },
                data: {
                    reserved: {
                        increment: quantity
                    }
                }
            });

            return newOrder;
        });

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * GET USER ORDERS
 * GET /api/orders
 * 
 * Query params:
 * - status: OrderStatus (optional)
 * - page: number (default: 1)
 * - limit: number (default: 10)
 */
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { status, page = '1', limit = '10' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = { userId };
        if (status) {
            where.orderStatus = status;
        }

        // Get orders
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            productVariant: {
                                include: {
                                    product: true,
                                    assignedImages: {
                                        include: {
                                            image: true
                                        },
                                        where: {
                                            isPrimary: true
                                        },
                                        take: 1
                                    }
                                }
                            }
                        }
                    },
                    shippingAddress: true,
                    shippingStore: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limitNum
            }),
            prisma.order.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * GET ORDER DETAIL
 * GET /api/orders/:orderId
 */
export const getOrderDetail = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId // Ensure user can only see their own orders
            },
            include: {
                items: {
                    include: {
                        productVariant: {
                            include: {
                                product: true,
                                assignedImages: {
                                    include: {
                                        image: true
                                    },
                                    where: {
                                        isPrimary: true
                                    },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                shippingAddress: true,
                shippingStore: true,
                history: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                payment: true
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order detail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}; 
