import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: "test",
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Specials System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  const testId = Date.now(); // Unique ID for this test run

  beforeAll(() => {
    const ctx = createAdminContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Coupons", () => {
    it("should create, list, and validate coupons", async () => {
      const testCode = `TEST${testId}`;
      
      // Create a coupon
      await expect(caller.specials.coupons.create({
        code: testCode,
        description: "Test coupon",
        discountType: "percentage",
        discountValue: "10",
        isActive: true,
      })).resolves.toBeDefined();

      // List all coupons
      const list = await caller.specials.coupons.list();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((c: any) => c.code === testCode)).toBe(true);
    });
  });

  describe("Text Specials", () => {
    it("should create and list text specials", async () => {
      const testTitle = `Test Special ${testId}`;
      
      // Create a text special
      await expect(caller.specials.textSpecials.create({
        title: testTitle,
        description: "Test description",
        isActive: true,
      })).resolves.toBeDefined();

      // List all text specials
      const list = await caller.specials.textSpecials.listAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((s: any) => s.title === testTitle)).toBe(true);
    });
  });

  describe("Deal Templates", () => {
    it("should create and list deal templates", async () => {
      const testName = `Test Deal ${testId}`;
      
      // Create a deal template
      await expect(caller.specials.dealTemplates.create({
        name: testName,
        description: "Test deal description",
        items: [{ menuItemId: 1, size: "large", quantity: 2, allowCustomization: true }],
        regularPrice: "39.99",
        specialPrice: "29.99",
        isActive: true,
      })).resolves.toBeDefined();

      // List all deal templates
      const list = await caller.specials.dealTemplates.listAll();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((d: any) => d.name === testName)).toBe(true);
    });
  });
});
