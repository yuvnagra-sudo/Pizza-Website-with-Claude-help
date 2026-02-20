import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { 
  InsertUser, 
  users, 
  menuItems, 
  menuItemPrices, 
  cartItems, 
  orders, 
  orderItems,
  toppings,
  pizzaToppings,
  coupons,
  textSpecials,
  dealTemplates,
  customerReviews,
  wings,
  wingPrices,
  wingFlavors,
  InsertMenuItem,
  InsertMenuItemPrice,
  InsertCartItem,
  InsertOrder,
  InsertOrderItem,
  InsertCoupon,
  Coupon,
  InsertTextSpecial,
  InsertDealTemplate,
  InsertCustomerReview,
  CustomerReview
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _lastConnectionAttempt = 0;
const CONNECTION_RETRY_DELAY = 5000; // 5 seconds

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const now = Date.now();
    // Prevent rapid reconnection attempts
    if (now - _lastConnectionAttempt < CONNECTION_RETRY_DELAY) {
      return null;
    }
    _lastConnectionAttempt = now;
    
    try {
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Helper function to retry database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  operationName = "database operation"
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.code === 'ECONNRESET' || 
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ETIMEDOUT';
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`[Database] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        // Clear the connection to force reconnect
        _db = null;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  return retryOperation(async () => {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot upsert user: database not available");
      return;
    }

    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  }, 2, "upsertUser");
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return null;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createUser(user: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  loginMethod: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    openId: user.openId,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    loginMethod: user.loginMethod,
    role: user.role ?? "user",
    lastSignedIn: new Date(),
  });
}

// Menu Items Query Helpers
export async function getAllMenuItems(category?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = category ? [eq(menuItems.category, category as any)] : [];
  const items = await db
    .select()
    .from(menuItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(menuItems.sortOrder, menuItems.name);

  return items;
}

// Optimized: Get all menu items with prices in a single query using JOIN
export async function getAllMenuItemsWithPrices(category?: string) {
  const db = await getDb();
  if (!db) return [];

  // Use LEFT JOIN to get items and their prices in one query
  const results = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      category: menuItems.category,
      sortOrder: menuItems.sortOrder,
      priceId: menuItemPrices.id,
      size: menuItemPrices.size,
      price: menuItemPrices.price,
    })
    .from(menuItems)
    .leftJoin(menuItemPrices, eq(menuItems.id, menuItemPrices.menuItemId))
    .where(category ? eq(menuItems.category, category as any) : undefined)
    .orderBy(menuItems.sortOrder, menuItems.name);

  // Group prices by menu item
  const itemsMap = new Map<number, any>();
  
  for (const row of results) {
    if (!itemsMap.has(row.id)) {
      itemsMap.set(row.id, {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        sortOrder: row.sortOrder,
        prices: [],
      });
    }
    
    if (row.priceId) {
      itemsMap.get(row.id).prices.push({
        id: row.priceId,
        size: row.size,
        price: row.price,
      });
    }
  }

  return Array.from(itemsMap.values());
}

export async function getMenuItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMenuItemWithPrices(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const item = await getMenuItemById(id);
  if (!item) return undefined;

  const prices = await db
    .select()
    .from(menuItemPrices)
    .where(eq(menuItemPrices.menuItemId, id));

  return { ...item, prices };
}

export async function createMenuItem(item: InsertMenuItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(menuItems).values(item);
  return result;
}

export async function updateMenuItem(id: number, item: Partial<InsertMenuItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(menuItems).set(item).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(menuItems).where(eq(menuItems.id, id));
}

export async function toggleMenuItemAvailability(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const item = await getMenuItemById(id);
  if (!item) throw new Error("Menu item not found");

  await db.update(menuItems).set({ available: !item.available }).where(eq(menuItems.id, id));
}

export async function createMenuItemPrice(price: InsertMenuItemPrice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(menuItemPrices).values(price);
}

export async function deleteMenuItemPrices(menuItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(menuItemPrices).where(eq(menuItemPrices.menuItemId, menuItemId));
}

// Cart Query Helpers
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      menuItemId: cartItems.menuItemId,
      itemType: cartItems.itemType,
      size: cartItems.size,
      quantity: cartItems.quantity,
      price: cartItems.price,
      notes: cartItems.notes,
      customizations: cartItems.customizations,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      menuItemName: menuItems.name,
      menuItemDescription: menuItems.description,
      menuItemImageUrl: menuItems.imageUrl,
      menuItemCategory: menuItems.category,
    })
    .from(cartItems)
    .leftJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
    .where(eq(cartItems.userId, userId));

  return items;
}

export async function addToCart(item: InsertCartItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if item already exists in cart with EXACT same properties
  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, item.userId),
        eq(cartItems.menuItemId, item.menuItemId),
        item.size ? eq(cartItems.size, item.size) : sql`${cartItems.size} IS NULL`,
        item.customizations ? eq(cartItems.customizations, item.customizations) : sql`${cartItems.customizations} IS NULL`,
        item.notes ? eq(cartItems.notes, item.notes) : sql`${cartItems.notes} IS NULL`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Only group if items are EXACTLY identical (same size, customizations, notes)
    // Update quantity
    await db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + (item.quantity || 1) })
      .where(eq(cartItems.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new item (different customizations or notes)
    const result = await db.insert(cartItems).values(item);
    return result[0].insertId;
  }
}

export async function updateCartItem(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function removeFromCart(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function customizeCartItem(id: number, userId: number, customizations: string, price?: string, notes?: string, size?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { customizations };
  if (price !== undefined) {
    updateData.price = price;
  }
  if (notes !== undefined) {
    updateData.notes = notes;
  }
  if (size !== undefined) {
    updateData.size = size;
  }

  await db
    .update(cartItems)
    .set(updateData)
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

// Orders Query Helpers
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  return result[0].insertId;
}

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(orderItems).values(items);
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return userOrders;
}

export async function getOrderById(orderId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderWithItems(orderId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const order = await getOrderById(orderId, userId);
  if (!order) return undefined;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      orderType: orders.orderType,
      deliveryAddress: orders.deliveryAddress,
      phoneNumber: orders.phoneNumber,
      customerName: orders.customerName,
      email: orders.email,
      scheduledPickupTime: orders.scheduledPickupTime,
      orderNotes: orders.orderNotes,
      subtotal: orders.subtotal,
      tax: orders.tax,
      total: orders.total,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      statusUpdatedAt: orders.statusUpdatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    allOrders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    })
  );

  return ordersWithItems;
}

export async function getOrderWithItemsAdmin(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      deliveryAddress: orders.deliveryAddress,
      phoneNumber: orders.phoneNumber,
      orderNotes: orders.orderNotes,
      subtotal: orders.subtotal,
      tax: orders.tax,
      total: orders.total,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (result.length === 0) return undefined;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...result[0], items };
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ 
    status: status as any,
    statusUpdatedAt: new Date(),
  }).where(eq(orders.id, orderId));
}

// Topping Query Helpers
export async function getAllToppings() {
  const db = await getDb();
  if (!db) return [];

  const allToppings = await db.select().from(toppings).orderBy(toppings.category, toppings.name);
  return allToppings;
}

export async function getPizzaToppings(pizzaName: string) {
  const db = await getDb();
  if (!db) return [];

  // Get pizza by name
  const menuItem = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.name, pizzaName))
    .limit(1);

  if (menuItem.length === 0 || !menuItem[0].description) return [];

  // Import the parser
  const { parseToppingsFromDescription } = await import('../shared/toppingParser');
  
  // Parse toppings from description
  const toppingNames = parseToppingsFromDescription(menuItem[0].description);
  
  return toppingNames;
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get analytics data for a date range
 */
export async function getAnalytics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return retryOperation(async () => {
    // Get total sales and order count
    const salesData = await db
      .select({
        totalRevenue: sql<number>`SUM(${orders.total})`,
        orderCount: sql<number>`COUNT(*)`,
        avgOrderValue: sql<number>`AVG(${orders.total})`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    // Get delivery vs pickup breakdown
    const orderTypeBreakdown = await db
      .select({
        orderType: orders.orderType,
        count: sql<number>`COUNT(*)`,
        revenue: sql<number>`SUM(${orders.total})`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.orderType);

    // Get top selling items
    const topItems = await db
      .select({
        itemName: menuItems.name,
        category: menuItems.category,
        quantitySold: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(menuItems.id, menuItems.name, menuItems.category)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    // Get hourly order distribution
    const hourlyDistribution = await db
      .select({
        hour: sql<number>`HOUR(createdAt)`.as('hour'),
        orderCount: sql<number>`COUNT(*)`.as('orderCount'),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(sql`HOUR(createdAt)`)
      .orderBy(sql`HOUR(createdAt)`);

    // Get daily sales trend
    const dailySales = await db
      .select({
        date: sql<string>`DATE(createdAt)`.as('date'),
        revenue: sql<number>`SUM(total)`.as('revenue'),
        orderCount: sql<number>`COUNT(*)`.as('orderCount'),
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`);

    // Get order status breakdown
    const statusBreakdown = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.status);

    return {
      summary: salesData[0] || { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 },
      orderTypeBreakdown,
      topItems,
      hourlyDistribution,
      dailySales,
      statusBreakdown,
    };
  }, 2, "getAnalytics");
}

/**
 * Get customer retention metrics
 */
export async function getCustomerRetention(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return retryOperation(async () => {
    // Get new vs returning customers
    const customerMetrics = await db
      .select({
        phoneNumber: orders.phoneNumber,
        orderCount: sql<number>`COUNT(*)`,
        firstOrderDate: sql<Date>`MIN(${orders.createdAt})`,
        lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
        totalSpent: sql<number>`SUM(${orders.total})`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.phoneNumber);

    const newCustomers = customerMetrics.filter(c => c.orderCount === 1).length;
    const returningCustomers = customerMetrics.filter(c => c.orderCount > 1).length;
    const totalCustomers = customerMetrics.length;

    return {
      newCustomers,
      returningCustomers,
      totalCustomers,
      retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      topCustomers: customerMetrics
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10),
    };
  }, 2, "getCustomerRetention");
}

// ===== COUPONS =====

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    2,
    "getAllCoupons"
  );
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1),
    2,
    "getCouponByCode"
  );
}

export async function getCouponById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(coupons).where(eq(coupons.id, id)).limit(1),
    2,
    "getCouponById"
  );
}

export async function createCoupon(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure code is uppercase
  const couponData = { ...data, code: data.code.toUpperCase() };
  
  return await retryOperation(
    () => db.insert(coupons).values(couponData),
    2,
    "createCoupon"
  );
}

export async function updateCoupon(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure code is uppercase if provided
  const couponData = data.code ? { ...data, code: data.code.toUpperCase() } : data;
  
  return await retryOperation(
    () => db.update(coupons).set(couponData).where(eq(coupons.id, id)),
    2,
    "updateCoupon"
  );
}

export async function deleteCoupon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.delete(coupons).where(eq(coupons.id, id)),
    2,
    "deleteCoupon"
  );
}

export async function incrementCouponUsage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.update(coupons).set({ usageCount: sql`${coupons.usageCount} + 1` }).where(eq(coupons.id, id)),
    2,
    "incrementCouponUsage"
  );
}

// ===== TEXT SPECIALS =====

export async function getAllTextSpecials() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(textSpecials).orderBy(textSpecials.displayOrder),
    2,
    "getAllTextSpecials"
  );
}

export async function getActiveTextSpecials() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(textSpecials).where(eq(textSpecials.isActive, true)).orderBy(textSpecials.displayOrder),
    2,
    "getActiveTextSpecials"
  );
}

export async function createTextSpecial(data: InsertTextSpecial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.insert(textSpecials).values(data),
    2,
    "createTextSpecial"
  );
}

export async function updateTextSpecial(id: number, data: Partial<InsertTextSpecial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.update(textSpecials).set(data).where(eq(textSpecials.id, id)),
    2,
    "updateTextSpecial"
  );
}

export async function deleteTextSpecial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.delete(textSpecials).where(eq(textSpecials.id, id)),
    2,
    "deleteTextSpecial"
  );
}

// ===== DEAL TEMPLATES =====

export async function getAllDealTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(dealTemplates).orderBy(dealTemplates.displayOrder),
    2,
    "getAllDealTemplates"
  );
}

export async function getActiveDealTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.select().from(dealTemplates).where(eq(dealTemplates.isActive, true)).orderBy(dealTemplates.displayOrder),
    2,
    "getActiveDealTemplates"
  );
}

export async function getDealTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await retryOperation(
    () => db.select().from(dealTemplates).where(eq(dealTemplates.id, id)).limit(1),
    2,
    "getDealTemplateById"
  );
  
  return result[0] || null;
}

export async function createDealTemplate(data: InsertDealTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.insert(dealTemplates).values(data),
    2,
    "createDealTemplate"
  );
}

export async function updateDealTemplate(id: number, data: Partial<InsertDealTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.update(dealTemplates).set(data).where(eq(dealTemplates.id, id)),
    2,
    "updateDealTemplate"
  );
}

export async function deleteDealTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await retryOperation(
    () => db.delete(dealTemplates).where(eq(dealTemplates.id, id)),
    2,
    "deleteDealTemplate"
  );
}

// ============================================================================
// Customer Reviews (First-Party) - SEO-eligible with schema markup
// ============================================================================

/**
 * Create a new customer review (pending approval)
 */
export async function createCustomerReview(data: Omit<InsertCustomerReview, 'id' | 'createdAt' | 'approved' | 'approvedAt' | 'approvedBy' | 'featured'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [review] = await db.insert(customerReviews).values({
    ...data,
    approved: false,
    featured: false,
  }).$returningId();
  
  return { id: review.id };
}

/**
 * Get all approved reviews for public display
 */
export async function getApprovedReviews() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(customerReviews)
    .where(eq(customerReviews.approved, true))
    .orderBy(desc(customerReviews.createdAt));
}

/**
 * Get aggregate rating statistics
 */
export async function getReviewStats() {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalReviews: 0 };
  
  const result = await db
    .select({
      averageRating: sql<number>`AVG(${customerReviews.rating})`,
      totalReviews: sql<number>`COUNT(*)`,
    })
    .from(customerReviews)
    .where(eq(customerReviews.approved, true));
  
  return {
    averageRating: result[0]?.averageRating ? Number(Number(result[0].averageRating).toFixed(1)) : 0,
    totalReviews: result[0]?.totalReviews || 0,
  };
}

/**
 * Get all reviews (including pending) - Admin only
 */
export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(customerReviews)
    .orderBy(desc(customerReviews.createdAt));
}

/**
 * Approve a review - Admin only
 */
export async function approveReview(reviewId: number, adminUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(customerReviews)
    .set({
      approved: true,
      approvedAt: new Date(),
      approvedBy: adminUserId,
    })
    .where(eq(customerReviews.id, reviewId));
}

/**
 * Toggle featured status - Admin only
 */
export async function toggleReviewFeatured(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [review] = await db
    .select()
    .from(customerReviews)
    .where(eq(customerReviews.id, reviewId))
    .limit(1);
  
  if (!review) throw new Error("Review not found");
  
  await db
    .update(customerReviews)
    .set({ featured: !review.featured })
    .where(eq(customerReviews.id, reviewId));
}

/**
 * Delete a review - Admin only
 */
export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(customerReviews)
    .where(eq(customerReviews.id, reviewId));
}


// Transaction wrapper for order creation (ensures atomicity)
export async function createOrderWithTransaction(
  orderData: InsertOrder,
  orderItemsData: Omit<InsertOrderItem, 'orderId'>[],
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Wrap all order operations in a transaction
  return await db.transaction(async (tx) => {
    // 1. Create order
    const orderResult = await tx.insert(orders).values(orderData);
    const orderId = orderResult[0].insertId;

    // 2. Create order items with the generated orderId
    const itemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      orderId: orderId as number,
    }));
    await tx.insert(orderItems).values(itemsWithOrderId);

    // 3. Clear cart
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));

    return orderId;
  });
}

// ============================================================================
// Wings Query Helpers
// ============================================================================

export async function getAllWings() {
  const db = await getDb();
  if (!db) return [];

  const allWings = await db.select().from(wings);
  return allWings;
}

export async function getAllWingFlavors() {
  const db = await getDb();
  if (!db) return [];

  const flavors = await db.select().from(wingFlavors).orderBy(wingFlavors.name);
  return flavors;
}
