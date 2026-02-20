import { TRPCError } from "@trpc/server";
import { sendCustomerOrderConfirmation, sendOwnerKitchenNotification, type OrderDetails } from "./notifications";
import { monitorOrderErrors } from "./errorHandler";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { aiChatbotRouter } from "./aiChatbot";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  aiChatbot: aiChatbotRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await sdk.register(input.name, input.email, input.password);
          const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
          return { success: true, user } as const;
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message ?? "Registration failed" });
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const token = await sdk.login(input.email, input.password);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
          const user = await db.getUserByEmail(input.email);
          return { success: true, user } as const;
        } catch (error: any) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: error.message ?? "Login failed" });
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  menu: router({
    list: publicProcedure
      .input(z.object({
        category: z.enum(["pizza", "wings", "sides", "drinks"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        // Use optimized single-query function instead of N+1 queries
        const itemsWithPrices = await db.getAllMenuItemsWithPrices(input?.category);
        return itemsWithPrices;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMenuItemWithPrices(input.id);
      }),
  }),

  toppings: router({
    list: publicProcedure.query(async () => {
      return await db.getAllToppings();
    }),

    getForPizza: publicProcedure
      .input(z.object({ pizzaName: z.string() }))
      .query(async ({ input }) => {
        return await db.getPizzaToppings(input.pizzaName);
      }),
  }),

  wings: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllWings();
    }),

    getFlavors: publicProcedure.query(async () => {
      return await db.getAllWingFlavors();
    }),
  }),

  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      
      // Calculate total
      const total = items.reduce((sum, item) => {
        const price = parseFloat(item.price?.toString() || "0");
        return sum + (price * item.quantity);
      }, 0);
      
      return { items, total };
    }),

    add: protectedProcedure
      .input(z.object({
        menuItemId: z.number(),
        size: z.string().optional(),
        quantity: z.number().min(1).default(1),
        price: z.number(),
        notes: z.string().optional(),
        customizations: z.string().optional(),
        itemType: z.enum(["pizza", "wings", "sides", "drinks", "dips"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addToCart({
          userId: ctx.user.id,
          menuItemId: input.menuItemId,
          size: input.size || null,
          quantity: input.quantity,
          price: input.price.toString(),
          notes: input.notes || null,
          customizations: input.customizations || null,
          itemType: input.itemType || "pizza",
        });
        
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCartItem(input.id, ctx.user.id, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromCart(input.id, ctx.user.id);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),

    customize: protectedProcedure
      .input(z.object({
        id: z.number(),
        size: z.string().optional(), // Updated size
        customizations: z.string(), // JSON string of customizations
        price: z.string().optional(), // Updated price after customization
        notes: z.string().optional(), // Special instructions/notes
      }))
      .mutation(async ({ ctx, input }) => {
        await db.customizeCartItem(input.id, ctx.user.id, input.customizations, input.price, input.notes, input.size);
        return { success: true };
      }),
  }),

  orders: router({
    create: protectedProcedure
      .input(z.object({
        orderType: z.enum(["pickup", "delivery"]),
        phoneNumber: z.string().min(1),
        email: z.string().email(),
        customerName: z.string().min(1),
        deliveryAddress: z.string().optional(),
        additionalInfo: z.string().optional(),
        paymentMethod: z.enum(["debit", "credit_visa", "credit_mastercard", "cash", "etransfer"]).optional(),
        scheduledPickupTime: z.string().optional(),
        orderNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get cart items
          const cartData = await db.getCartItems(ctx.user.id);
        
        if (cartData.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cart is empty' });
        }
        
        // Calculate totals
        const subtotal = cartData.reduce((sum, item) => {
          const price = parseFloat(item.price?.toString() || "0");
          return sum + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.05; // 5% GST
        const total = subtotal + tax;
        
        // Prepare order data
        const orderData = {
          userId: ctx.user.id,
          status: "pending" as const,
          orderType: input.orderType,
          deliveryAddress: input.deliveryAddress || null,
          phoneNumber: input.phoneNumber,
          email: input.email,
          customerName: input.customerName,
          additionalInfo: input.additionalInfo || null,
          paymentMethod: input.paymentMethod || null,
          scheduledPickupTime: input.scheduledPickupTime ? new Date(input.scheduledPickupTime) : null,
          orderNotes: input.orderNotes || null,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
        };
        
        // Prepare order items data (orderId will be set in transaction)
        const orderItemsData = cartData.map(item => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName || "Unknown Item",
          size: item.size,
          quantity: item.quantity,
          price: item.price?.toString() || "0",
          notes: item.notes,
          customizations: item.customizations,
        }));
        
        // Create order, items, and clear cart in a single transaction
        const orderId = await db.createOrderWithTransaction(orderData, orderItemsData, ctx.user.id);
        
        // Send notifications (don't block order completion if notifications fail)
        const orderDetails: OrderDetails = {
          orderId: orderId as number,
          orderNumber: `${orderId}`.padStart(6, '0'),
          orderType: input.orderType,
          customerName: input.customerName,
          email: input.email,
          phoneNumber: input.phoneNumber,
          deliveryAddress: input.deliveryAddress || null,
          additionalInfo: input.additionalInfo || null,
          paymentMethod: input.paymentMethod || null,
          scheduledPickupTime: input.scheduledPickupTime ? new Date(input.scheduledPickupTime) : null,
          orderNotes: input.orderNotes || null,
          items: cartData.map(item => ({
            name: item.menuItemName || "Unknown Item",
            size: item.size || null,
            quantity: item.quantity,
            price: parseFloat(item.price?.toString() || "0") * item.quantity,
            customizations: item.customizations || null,
          })),
          subtotal: parseFloat(subtotal.toFixed(2)),
          deliveryFee: input.orderType === "delivery" ? 5.00 : 0,
          total: parseFloat(total.toFixed(2)),
          createdAt: new Date(),
        };
        
        // Send customer confirmation (async, don't await)
        sendCustomerOrderConfirmation(orderDetails).catch(err => {
          console.error("[Order] Failed to send customer confirmation:", err);
        });
        
        // Send owner kitchen notification (async, don't await)
        sendOwnerKitchenNotification(orderDetails).catch(err => {
          console.error("[Order] Failed to send owner notification:", err);
        });
        
          return { orderId, success: true };
        } catch (error) {
          // Monitor and report order errors
          monitorOrderErrors(
            error instanceof Error ? error : new Error(String(error)),
            ctx.user.id
          );
          throw error; // Re-throw to let tRPC handle it
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserOrders(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getOrderWithItems(input.id, ctx.user.id);
      }),

    listAll: adminProcedure.query(async () => {
      return await db.getAllOrders();
    }),

    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "preparing", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
  }),

  admin: router({
    menu: router({
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.enum(["pizza", "wings", "sides", "drinks"]),
          imageUrl: z.string().optional(),
          available: z.boolean().default(true),
          sortOrder: z.number().default(0),
          prices: z.array(z.object({
            size: z.string(),
            price: z.number(),
          })),
        }))
        .mutation(async ({ input }) => {
          const result = await db.createMenuItem({
            name: input.name,
            description: input.description || null,
            category: input.category,
            imageUrl: input.imageUrl || null,
            available: input.available,
            sortOrder: input.sortOrder,
          });
          
          const menuItemId = result[0].insertId;
          
          // Add prices
          for (const price of input.prices) {
            await db.createMenuItemPrice({
              menuItemId,
              size: price.size,
              price: price.price.toFixed(2),
            });
          }
          
          // Return the created menu item with prices
          const createdItem = await db.getMenuItemWithPrices(menuItemId);
          return createdItem;
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          category: z.enum(["pizza", "wings", "sides", "drinks"]).optional(),
          imageUrl: z.string().optional(),
          available: z.boolean().optional(),
          sortOrder: z.number().optional(),
          prices: z.array(z.object({
            size: z.string(),
            price: z.number(),
          })).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, prices, ...updateData } = input;
          
          // Update menu item
          await db.updateMenuItem(id, updateData);
          
          // Update prices if provided
          if (prices) {
            await db.deleteMenuItemPrices(id);
            for (const price of prices) {
              await db.createMenuItemPrice({
                menuItemId: id,
                size: price.size,
                price: price.price.toFixed(2),
              });
            }
          }
          
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteMenuItemPrices(input.id);
          await db.deleteMenuItem(input.id);
          return { success: true };
        }),

      toggleAvailability: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.toggleMenuItemAvailability(input.id);
          return { success: true };
        }),
    }),

    orders: router({
      list: adminProcedure.query(async () => {
        return await db.getAllOrders();
      }),

      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await db.getOrderWithItemsAdmin(input.id);
        }),

      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["pending", "preparing", "out_for_delivery", "completed", "cancelled"]),
        }))
        .mutation(async ({ input }) => {
          await db.updateOrderStatus(input.id, input.status);
          return { success: true };
        }),
    }),
  }),

  // Analytics router (admin-only)
  analytics: router({
    getAnalytics: adminProcedure
      .input(z.object({
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
      }))
      .query(async ({ input }) => {
        try {
          console.log('[Analytics] Fetching analytics for date range:', input.startDate, input.endDate);
          const result = await db.getAnalytics(input.startDate, input.endDate);
          console.log('[Analytics] Result:', JSON.stringify(result, null, 2));
          return result;
        } catch (error) {
          console.error('[Analytics] Error fetching analytics:', error);
          throw error;
        }
      }),

    getCustomerRetention: adminProcedure
      .input(z.object({
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
      }))
      .query(async ({ input }) => {
        return await db.getCustomerRetention(input.startDate, input.endDate);
      }),
  }),

  // Specials & Promotions router
  specials: router({
    // Coupons (admin-only management)
    coupons: router({
      list: adminProcedure.query(async () => {
        return await db.getAllCoupons();
      }),

      create: adminProcedure
        .input(z.object({
          code: z.string().min(1).max(50),
          description: z.string().optional(),
          discountType: z.enum(["percentage", "fixed"]),
          discountValue: z.string(),
          minimumOrderAmount: z.string().optional(),
          expiresAt: z.string().optional(),
          usageLimit: z.number().optional(),
          isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          await db.createCoupon(input);
          const result = await db.getCouponByCode(input.code);
          return result?.[0] || { success: true };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          code: z.string().min(1).max(50).optional(),
          description: z.string().optional(),
          discountType: z.enum(["percentage", "fixed"]).optional(),
          discountValue: z.string().optional(),
          minimumOrderAmount: z.string().optional(),
          expiresAt: z.string().optional(),
          usageLimit: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateCoupon(id, data);
          const result = await db.getCouponById(id);
          return result?.[0] || { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteCoupon(input.id);
          return { success: true };
        }),

      validate: publicProcedure
        .input(z.object({ code: z.string(), orderTotal: z.number() }))
        .query(async ({ input }) => {
          const result = await db.getCouponByCode(input.code);
          if (!result || result.length === 0) {
            return { valid: false, error: "Invalid coupon code" };
          }

          const coupon = result[0];

          if (!coupon.isActive) {
            return { valid: false, error: "This coupon is no longer active" };
          }

          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return { valid: false, error: "This coupon has expired" };
          }

          if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, error: "This coupon has reached its usage limit" };
          }

          if (coupon.minimumOrderAmount && parseFloat(coupon.minimumOrderAmount) > input.orderTotal) {
            return { 
              valid: false, 
              error: `Minimum order amount of $${coupon.minimumOrderAmount} required` 
            };
          }

          return { valid: true, coupon };
        }),
    }),

    // Text specials
    textSpecials: router({
      list: publicProcedure.query(async () => {
        return await db.getActiveTextSpecials();
      }),

      listAll: adminProcedure.query(async () => {
        return await db.getAllTextSpecials();
      }),

      create: adminProcedure
        .input(z.object({
          title: z.string().min(1).max(200),
          description: z.string().min(1),
          displayOrder: z.number().default(0),
          isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          await db.createTextSpecial(input);
          const all = await db.getAllTextSpecials();
          // Return the most recently created item with this title
          const matches = all.filter(s => s.title === input.title).sort((a, b) => b.id - a.id);
          return matches[0] || { success: true };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().min(1).max(200).optional(),
          description: z.string().min(1).optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateTextSpecial(id, data);
          const all = await db.getAllTextSpecials();
          return all.find(s => s.id === id) || { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteTextSpecial(input.id);
          return { success: true };
        }),
    }),

    // Deal templates
    dealTemplates: router({
      list: publicProcedure.query(async () => {
        return await db.getActiveDealTemplates();
      }),

      listAll: adminProcedure.query(async () => {
        return await db.getAllDealTemplates();
      }),

      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await db.getDealTemplateById(input.id);
        }),

      create: adminProcedure
        .input(z.object({
          name: z.string().min(1).max(200),
          description: z.string().min(1),
          items: z.any(), // JSON array
          regularPrice: z.string(),
          specialPrice: z.string(),
          displayOrder: z.number().default(0),
          isActive: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          await db.createDealTemplate(input);
          const all = await db.getAllDealTemplates();
          // Return the most recently created item with this name
          const matches = all.filter(d => d.name === input.name).sort((a, b) => b.id - a.id);
          return matches[0] || { success: true };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().min(1).max(200).optional(),
          description: z.string().min(1).optional(),
          items: z.any().optional(),
          regularPrice: z.string().optional(),
          specialPrice: z.string().optional(),
          displayOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateDealTemplate(id, data);
          const result = await db.getDealTemplateById(id);
          return (Array.isArray(result) ? result[0] : result) || { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteDealTemplate(input.id);
          return { success: true };
        }),
    }),
  }),

  // Customer Reviews (First-Party) - SEO-eligible with schema markup
  reviews: router({
    // Public: Submit a new review (requires approval before showing)
    submit: publicProcedure
      .input(z.object({
        customerName: z.string().min(2).max(100),
        email: z.string().email().optional(),
        rating: z.number().int().min(1).max(5),
        reviewText: z.string().min(10).max(1000),
      }))
      .mutation(async ({ input }) => {
        const review = await db.createCustomerReview(input);
        return { success: true, reviewId: review.id };
      }),

    // Public: Get all approved reviews for display
    getApproved: publicProcedure
      .query(async () => {
        return await db.getApprovedReviews();
      }),

    // Public: Get aggregate rating stats
    getStats: publicProcedure
      .query(async () => {
        return await db.getReviewStats();
      }),

    // Admin: Get all reviews (including pending)
    getAll: adminProcedure
      .query(async () => {
        return await db.getAllReviews();
      }),

    // Admin: Approve a review
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.approveReview(input.id, ctx.user.id);
        return { success: true };
      }),

    // Admin: Toggle featured status
    toggleFeatured: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.toggleReviewFeatured(input.id);
        return { success: true };
      }),

    // Admin: Delete a review
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteReview(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
