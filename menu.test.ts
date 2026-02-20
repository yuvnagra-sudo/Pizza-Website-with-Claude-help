import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("menu procedures", () => {
  describe("menu.list", () => {
    it("should return all menu items when no category filter is provided", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menu.list({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter menu items by category", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menu.list({ category: "pizza" });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((item) => {
        expect(item.category).toBe("pizza");
      });
    });

    it("should include prices for each menu item", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menu.list({});

      if (result.length > 0) {
        expect(result[0]).toHaveProperty("prices");
        expect(Array.isArray(result[0].prices)).toBe(true);
      }
    });
  });

  describe("menu.getById", () => {
    it("should return a menu item by id", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // First get all items to find a valid ID
      const allItems = await caller.menu.list({});
      
      if (allItems.length > 0) {
        const firstItem = allItems[0];
        const result = await caller.menu.getById({ id: firstItem.id });

        expect(result).toBeDefined();
        expect(result?.id).toBe(firstItem.id);
        expect(result?.name).toBe(firstItem.name);
      }
    });

    it("should return null for non-existent menu item", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.menu.getById({ id: 999999 });

      expect(result).toBeUndefined();
    });
  });
});

describe("admin menu procedures", () => {
  describe("admin.menu.create", () => {
    it("should create a new menu item as admin", async () => {
      const adminUser = createAdminUser();
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const newItem = {
        name: "Test Pizza",
        description: "A test pizza",
        category: "pizza" as const,
        prices: [
          { size: "small", price: 10.99 },
          { size: "large", price: 15.99 },
        ],
      };

      const result = await caller.admin.menu.create(newItem);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBeDefined();
        expect(result.name).toBe(newItem.name);
        expect(result.category).toBe(newItem.category);
      }
    });

    it("should reject menu creation for non-admin users", async () => {
      const regularUser = createRegularUser();
      const ctx = createContext(regularUser);
      const caller = appRouter.createCaller(ctx);

      const newItem = {
        name: "Test Pizza",
        description: "A test pizza",
        category: "pizza" as const,
        prices: [{ size: "small", price: 10.99 }],
      };

      await expect(caller.admin.menu.create(newItem)).rejects.toThrow();
    });

    it("should reject menu creation for unauthenticated users", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const newItem = {
        name: "Test Pizza",
        description: "A test pizza",
        category: "pizza" as const,
        prices: [{ size: "small", price: 10.99 }],
      };

      await expect(caller.admin.menu.create(newItem)).rejects.toThrow();
    });
  });

  describe("admin.menu.toggleAvailability", () => {
    it("should toggle menu item availability as admin", async () => {
      const adminUser = createAdminUser();
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      // Get an existing menu item
      const allItems = await caller.menu.list({});
      
      if (allItems.length > 0) {
        const item = allItems[0];
        const originalAvailability = item.available;

        await caller.admin.menu.toggleAvailability({ id: item.id });

        const updatedItem = await caller.menu.getById({ id: item.id });
        expect(updatedItem?.available).toBe(!originalAvailability);
      }
    });

    it("should reject availability toggle for non-admin users", async () => {
      const regularUser = createRegularUser();
      const ctx = createContext(regularUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.menu.toggleAvailability({ id: 1 })
      ).rejects.toThrow();
    });
  });

  describe("admin.menu.delete", () => {
    it("should delete a menu item as admin", async () => {
      const adminUser = createAdminUser();
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      // Create a test item first
      const newItem = await caller.admin.menu.create({
        name: "Item to Delete",
        description: "Will be deleted",
        category: "sides" as const,
        prices: [{ size: "regular", price: 5.99 }],
      });

      if (newItem && newItem.id) {
        const result = await caller.admin.menu.delete({ id: newItem.id });

        expect(result.success).toBe(true);

        // Verify it's deleted
        const deletedItem = await caller.menu.getById({ id: newItem.id });
        expect(deletedItem).toBeUndefined();
      }
    });

    it("should reject delete for non-admin users", async () => {
      const regularUser = createRegularUser();
      const ctx = createContext(regularUser);
      const caller = appRouter.createCaller(ctx);

      await expect(caller.admin.menu.delete({ id: 1 })).rejects.toThrow();
    });
  });
});
