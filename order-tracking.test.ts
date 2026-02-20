import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Order Tracking System", () => {
  let testUserId: number;
  let testOrderId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-tracking-user-v2",
      name: "Test Tracker",
      email: "tracker@test.com",
      avatarUrl: null,
    });
    const user = await db.getUserByOpenId("test-tracking-user-v2");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create test order
    const orderData = {
      userId: testUserId,
      orderType: "delivery" as const,
      status: "pending" as const,
      customerName: "Test Customer",
      email: "test@example.com",
      phoneNumber: "403-555-0123",
      deliveryAddress: "123 Test St, Calgary, AB",
      paymentMethod: "credit_visa" as const,
      subtotal: "25.00",
      tax: "1.25",
      total: "26.25",
    };

    const order = await db.createOrder(orderData);
    testOrderId = order.id;
  });

  it("should create order with pending status and statusUpdatedAt", async () => {
    const orders = await db.getUserOrders(testUserId);
    const order = orders.find(o => o.id === testOrderId);
    
    expect(order).toBeDefined();
    expect(order?.status).toBe("pending");
    expect(order?.statusUpdatedAt).toBeDefined();
  });

  it("should retrieve user orders for tracking", async () => {
    const orders = await db.getUserOrders(testUserId);
    expect(orders.length).toBeGreaterThan(0);
    
    const order = orders.find(o => o.id === testOrderId);
    expect(order).toBeDefined();
    expect(order?.customerName).toBe("Test Customer");
    expect(order?.orderType).toBe("delivery");
  });

  it("should have all required fields for order tracking", async () => {
    const orders = await db.getUserOrders(testUserId);
    const order = orders.find(o => o.id === testOrderId);
    
    expect(order?.id).toBe(testOrderId);
    expect(order?.userId).toBe(testUserId);
    expect(order?.status).toBeDefined();
    expect(order?.customerName).toBeDefined();
    expect(order?.phoneNumber).toBeDefined();
    expect(order?.total).toBeDefined();
  });
});
