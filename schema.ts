import { boolean, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique user identifier — a nanoid generated at registration time. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** bcrypt hash of the user's password. Null for legacy/imported accounts. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pizza menu items table
 */
export const pizzas = mysqlTable("pizzas", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  smallPrice: decimal("smallPrice", { precision: 10, scale: 2 }),
  mediumPrice: decimal("mediumPrice", { precision: 10, scale: 2 }),
  largePrice: decimal("largePrice", { precision: 10, scale: 2 }),
  allergens: text("allergens"),
  vegetarian: boolean("vegetarian").default(false).notNull(),
  spicy: boolean("spicy").default(false).notNull(),
  bestSeller: boolean("bestSeller").default(false).notNull(),
  sweet: boolean("sweet").default(false).notNull(),
  specialty: boolean("specialty").default(false).notNull(),
  isGlutenFree: boolean("isGlutenFree").default(false).notNull(),
  category: varchar("category", { length: 50 }).default("main").notNull(), // 'main' or 'gluten_free'
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pizza = typeof pizzas.$inferSelect;
export type InsertPizza = typeof pizzas.$inferInsert;

/**
 * Wings menu items table
 */
export const wings = mysqlTable("wings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'bone-in' or 'boneless'
  isGlutenFree: boolean("isGlutenFree").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wing = typeof wings.$inferSelect;
export type InsertWing = typeof wings.$inferInsert;

/**
 * Wing pricing options (different sizes/counts)
 */
export const wingPrices = mysqlTable("wingPrices", {
  id: int("id").autoincrement().primaryKey(),
  wingId: int("wingId").notNull(),
  size: varchar("size", { length: 50 }).notNull(), // '8pc', '12pc', '20pc', '40pc', '10pc', '20pc'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WingPrice = typeof wingPrices.$inferSelect;
export type InsertWingPrice = typeof wingPrices.$inferInsert;

/**
 * Wing flavors table
 */
export const wingFlavors = mysqlTable("wingFlavors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  isGlutenFree: boolean("isGlutenFree").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WingFlavor = typeof wingFlavors.$inferSelect;
export type InsertWingFlavor = typeof wingFlavors.$inferInsert;

/**
 * Sides menu items table
 */
export const sides = mysqlTable("sides", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }).default("side").notNull(), // 'side', 'drink', 'dip'
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Side = typeof sides.$inferSelect;
export type InsertSide = typeof sides.$inferInsert;
/**
 * Unified menu items table for all products
 */
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["pizza", "wings", "sides", "drinks"]).notNull(),
  imageUrl: text("imageUrl"),
  available: boolean("available").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Menu item pricing options (for items with multiple sizes)
 */
export const menuItemPrices = mysqlTable("menuItemPrices", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  size: varchar("size", { length: 50 }).notNull(), // 'small', 'medium', 'large', '8pc', '12pc', etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItemPrice = typeof menuItemPrices.$inferSelect;
export type InsertMenuItemPrice = typeof menuItemPrices.$inferInsert;

/**
 * Shopping cart items
 */
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["pizza", "wings", "sides", "drinks", "dips"]).default("pizza").notNull(),
  menuItemId: int("menuItemId").notNull(),
  size: varchar("size", { length: 50 }),
  quantity: int("quantity").default(1).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  customizations: text("customizations"), // JSON string for topping modifications, cooking preferences, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderType: mysqlEnum("orderType", ["pickup", "delivery"]).default("delivery").notNull(),
  status: mysqlEnum("status", ["pending", "preparing", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"]).default("pending").notNull(),
  customerName: varchar("customerName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  deliveryAddress: text("deliveryAddress"),
  additionalInfo: text("additionalInfo"),
  paymentMethod: mysqlEnum("paymentMethod", ["debit", "credit_visa", "credit_mastercard", "cash", "etransfer"]),
  scheduledPickupTime: timestamp("scheduledPickupTime"),
  orderNotes: text("orderNotes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  statusUpdatedAt: timestamp("statusUpdatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items (junction table)
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  menuItemName: varchar("menuItemName", { length: 100 }).notNull(),
  size: varchar("size", { length: 50 }),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  customizations: text("customizations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Toppings table for pizza customization
 */
export const toppings = mysqlTable("toppings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["vegetable", "meat", "cheese"]).notNull(),
  smallPrice: decimal("smallPrice", { precision: 10, scale: 2 }).notNull(),
  mediumPrice: decimal("mediumPrice", { precision: 10, scale: 2 }).notNull(),
  largePrice: decimal("largePrice", { precision: 10, scale: 2 }).notNull(),
  available: boolean("available").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Topping = typeof toppings.$inferSelect;
export type InsertTopping = typeof toppings.$inferInsert;

/**
 * Pizza toppings - tracks which toppings come with each pizza by default
 */
export const pizzaToppings = mysqlTable("pizzaToppings", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  toppingId: int("toppingId").notNull(),
  isDefault: boolean("isDefault").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PizzaTopping = typeof pizzaToppings.$inferSelect;
export type InsertPizzaTopping = typeof pizzaToppings.$inferInsert;

/**
 * Cart item customizations - tracks topping modifications for cart items
 */
export const cartItemCustomizations = mysqlTable("cartItemCustomizations", {
  id: int("id").autoincrement().primaryKey(),
  cartItemId: int("cartItemId").notNull(),
  modificationType: mysqlEnum("modificationType", ["add", "remove", "replace"]).notNull(),
  toppingId: int("toppingId").notNull(),
  replacedToppingId: int("replacedToppingId"), // For replace operations
  halfPizza: mysqlEnum("halfPizza", ["whole", "left", "right"]).default("whole").notNull(),
  additionalCharge: decimal("additionalCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItemCustomization = typeof cartItemCustomizations.$inferSelect;
export type InsertCartItemCustomization = typeof cartItemCustomizations.$inferInsert;

/**
 * Coupon codes table for exclusive discounts (checkout only)
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimumOrderAmount", { precision: 10, scale: 2 }),
  expiresAt: timestamp("expiresAt"),
  usageLimit: int("usageLimit"), // null = unlimited
  usageCount: int("usageCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Text-only specials for display purposes (no ordering functionality)
 */
export const textSpecials = mysqlTable("textSpecials", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TextSpecial = typeof textSpecials.$inferSelect;
export type InsertTextSpecial = typeof textSpecials.$inferInsert;

/**
 * Deal templates for pre-configured bundles with special pricing
 */
export const dealTemplates = mysqlTable("dealTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  items: json("items").notNull(), // Array of {menuItemId, size, quantity, allowCustomization}
  regularPrice: decimal("regularPrice", { precision: 10, scale: 2 }).notNull(),
  specialPrice: decimal("specialPrice", { precision: 10, scale: 2 }).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DealTemplate = typeof dealTemplates.$inferSelect;
export type InsertDealTemplate = typeof dealTemplates.$inferInsert;

/**
 * Customer reviews table - first-party reviews submitted directly on the website
 * These reviews are eligible for Review Schema markup (unlike third-party reviews)
 */
export const customerReviews = mysqlTable("customerReviews", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }), // Optional, for follow-up
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText").notNull(),
  approved: boolean("approved").default(false).notNull(), // Admin approval required
  featured: boolean("featured").default(false).notNull(), // Highlight on homepage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // User ID of admin who approved
});

export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = typeof customerReviews.$inferInsert;
