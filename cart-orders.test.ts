import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createRegularUser(): AuthenticatedUser {
  return {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createAdminUser(): AuthenticatedUser {
  return {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("cart procedures", () => {
  describe("cart.add", () => {
    it("should add an item to cart for authenticated user", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Get a menu item to add
      const menuItems = await caller.menu.list({});
      
      if (menuItems.length > 0 && menuItems[0].prices && menuItems[0].prices.length > 0) {
        const menuItem = menuItems[0];
        const price = menuItems[0].prices[0];

        const result = await caller.cart.add({
          menuItemId: menuItem.id,
          size: price.size,
          price: parseFloat(price.price?.toString() || "0"),
          quantity: 1,
        });

        expect(result).toHaveProperty("id");
        expect(result.menuItemId).toBe(menuItem.id);
        expect(result.quantity).toBe(1);
      }
    });

    it("should reject cart add for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.cart.add({
          menuItemId: 1,
          size: "small",
          price: 10.99,
          quantity: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("cart.get", () => {
    it("should return cart for authenticated user", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.cart.get();

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should reject cart get for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.cart.get()).rejects.toThrow();
    });
  });

  describe("cart.update", () => {
    it("should update cart item quantity", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Get cart items
      const cart = await caller.cart.get();
      
      if (cart.items.length > 0) {
        const item = cart.items[0];
        const newQuantity = item.quantity + 1;

        const result = await caller.cart.update({
          id: item.id,
          quantity: newQuantity,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("cart.remove", () => {
    it("should remove item from cart", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Add an item first
      const menuItems = await caller.menu.list({});
      
      if (menuItems.length > 0 && menuItems[0].prices && menuItems[0].prices.length > 0) {
        const menuItem = menuItems[0];
        const price = menuItems[0].prices[0];

        const addedItem = await caller.cart.add({
          menuItemId: menuItem.id,
          size: price.size,
          price: parseFloat(price.price?.toString() || "0"),
          quantity: 1,
        });

        const result = await caller.cart.remove({ id: addedItem.id });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("cart.clear", () => {
    it("should clear all items from cart", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.cart.clear();

      expect(result.success).toBe(true);

      // Verify cart is empty
      const cart = await caller.cart.get();
      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
    });
  });
});

describe("order procedures", () => {
  describe("orders.create", () => {
    it("should create an order from cart items", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Add items to cart first
      const menuItems = await caller.menu.list({});
      
      if (menuItems.length > 0 && menuItems[0].prices && menuItems[0].prices.length > 0) {
        const menuItem = menuItems[0];
        const price = menuItems[0].prices[0];

        await caller.cart.add({
          menuItemId: menuItem.id,
          size: price.size,
          price: parseFloat(price.price?.toString() || "0"),
          quantity: 2,
        });

        const result = await caller.orders.create({
          deliveryAddress: "123 Test Street, Test City",
          phoneNumber: "123-456-7890",
          orderNotes: "Test order",
        });

        expect(result).toHaveProperty("orderId");
        expect(typeof result.orderId).toBe("number");
      }
    });

    it("should reject order creation with empty cart", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Clear cart first
      await caller.cart.clear();

      await expect(
        caller.orders.create({
          deliveryAddress: "123 Test Street",
          phoneNumber: "123-456-7890",
        })
      ).rejects.toThrow("Cart is empty");
    });

    it("should reject order creation for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.orders.create({
          deliveryAddress: "123 Test Street",
          phoneNumber: "123-456-7890",
        })
      ).rejects.toThrow();
    });
  });

  describe("orders.list", () => {
    it("should return user's orders", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.orders.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject orders list for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.orders.list()).rejects.toThrow();
    });
  });

  describe("orders.getById", () => {
    it("should return order details for user's own order", async () => {
      const user = createRegularUser();
      const ctx = createContext(user);
      const caller = appRouter.createCaller(ctx);

      // Get user's orders
      const orders = await caller.orders.list();
      
      if (orders.length > 0) {
        const order = orders[0];
        const result = await caller.orders.getById({ id: order.id });

        expect(result).toBeDefined();
        expect(result?.id).toBe(order.id);
        expect(result).toHaveProperty("items");
      }
    });

    it("should reject order details for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.orders.getById({ id: 1 })).rejects.toThrow();
    });
  });
});

describe("admin order procedures", () => {
  describe("admin.orders.list", () => {
    it("should return all orders for admin", async () => {
      const adminUser = createAdminUser();
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.orders.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject orders list for non-admin users", async () => {
      const regularUser = createRegularUser();
      const ctx = createContext(regularUser);
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.orders.list()).rejects.toThrow();
    });
  });

  describe("admin.orders.updateStatus", () => {
    it("should update order status as admin", async () => {
      const adminUser = createAdminUser();
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      // Get an order
      const orders = await caller.admin.orders.list();
      
      if (orders.length > 0) {
        const order = orders[0];

        const result = await caller.admin.orders.updateStatus({
          id: order.id,
          status: "preparing",
        });

        expect(result.success).toBe(true);
      }
    });

    it("should reject status update for non-admin users", async () => {
      const regularUser = createRegularUser();
      const ctx = createContext(regularUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.orders.updateStatus({
          id: 1,
          status: "preparing",
        })
      ).rejects.toThrow();
    });
  });
});
