import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import type { InsertOrder, InsertOrderItem } from "../drizzle/schema";

describe("Order History and Reorder Functionality", () => {
  let testUserId: number;
  let testOrderId: number;
  let testMenuItemId: number;

  beforeAll(async () => {
    // Create/upsert a test user
    const testOpenId = `test-order-user-${Date.now()}`;
    await db.upsertUser({
      openId: testOpenId,
      name: "Test Order User",
      email: "testorder@example.com",
      loginMethod: "email",
      role: "user",
    });
    
    // Get the user ID
    const user = await db.getUserByOpenId(testOpenId);
    if (!user) {
      throw new Error("Failed to create test user");
    }
    testUserId = user.id;

    // Get a menu item for testing
    const menuItems = await db.getAllMenuItems("pizza");
    if (menuItems.length === 0) {
      throw new Error("No menu items found for testing");
    }
    testMenuItemId = menuItems[0].id;
  });

  it("should create an order successfully", async () => {
    const orderData: InsertOrder = {
      userId: testUserId,
      orderType: "pickup",
      status: "completed",
      phoneNumber: "403-123-4567",
      email: "testorder@example.com",
      customerName: "Test Order User",
      deliveryAddress: null,
      additionalInfo: null,
      paymentMethod: "cash",
      scheduledPickupTime: null,
      orderNotes: "Test order for reorder functionality",
      subtotal: "25.00",
      tax: "3.25",
      total: "28.25",
    };

    testOrderId = await db.createOrder(orderData);
    expect(testOrderId).toBeGreaterThan(0);
  });

  it("should create order items successfully", async () => {
    const orderItemsData: InsertOrderItem[] = [
      {
        orderId: testOrderId,
        menuItemId: testMenuItemId,
        menuItemName: "Test Pizza",
        size: "Large (14\")",
        quantity: 2,
        price: "12.50",
        notes: "Extra cheese",
      },
    ];

    await db.createOrderItems(orderItemsData);
    
    // Verify items were created
    const order = await db.getOrderWithItems(testOrderId, testUserId);
    expect(order).toBeDefined();
    expect(order?.items).toHaveLength(1);
    expect(order?.items?.[0].quantity).toBe(2);
  });

  it("should retrieve user orders", async () => {
    const orders = await db.getUserOrders(testUserId);
    expect(orders).toBeDefined();
    expect(orders.length).toBeGreaterThan(0);
    
    const testOrder = orders.find(o => o.id === testOrderId);
    expect(testOrder).toBeDefined();
    expect(testOrder?.status).toBe("completed");
    expect(testOrder?.total).toBe("28.25");
  });

  it("should retrieve order with items for reorder", async () => {
    const order = await db.getOrderWithItems(testOrderId, testUserId);
    
    expect(order).toBeDefined();
    expect(order?.id).toBe(testOrderId);
    expect(order?.items).toBeDefined();
    expect(order?.items?.length).toBeGreaterThan(0);
    
    // Verify item details needed for reorder
    const item = order?.items?.[0];
    expect(item?.menuItemId).toBeDefined();
    expect(item?.quantity).toBeDefined();
    expect(item?.price).toBeDefined();
    expect(item?.size).toBeDefined();
  });

  it("should simulate reorder by adding items to cart", async () => {
    // Get order details
    const order = await db.getOrderWithItems(testOrderId, testUserId);
    expect(order).toBeDefined();
    expect(order?.items).toBeDefined();
    
    // Clear cart first
    await db.clearCart(testUserId);
    
    // Add each order item to cart (simulating reorder)
    for (const item of order?.items || []) {
      await db.addToCart({
        userId: testUserId,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        price: item.price?.toString() || "0",
        size: item.size || undefined,
        quantity: item.quantity,
        notes: item.notes || undefined,
        customizations: undefined,
      });
    }
    
    // Verify items were added to cart
    const cartItems = await db.getCartItems(testUserId);
    expect(cartItems.length).toBeGreaterThan(0);
    expect(cartItems[0].menuItemId).toBe(testMenuItemId);
    expect(cartItems[0].quantity).toBe(2);
  });
});
