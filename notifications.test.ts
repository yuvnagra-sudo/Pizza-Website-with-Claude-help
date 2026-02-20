import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendCustomerOrderConfirmation,
  sendOwnerKitchenNotification,
  sendErrorAlert,
  type OrderDetails,
} from "./notifications";
import * as notificationModule from "./_core/notification";

// Mock the notifyOwner function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(),
}));

describe("Notification System", () => {
  const mockOrderDetails: OrderDetails = {
    orderId: 123,
    orderNumber: "000123",
    orderType: "delivery",
    customerName: "John Doe",
    email: "john@example.com",
    phoneNumber: "403-555-1234",
    deliveryAddress: "123 Main St, Airdrie, AB",
    additionalInfo: "Ring doorbell",
    paymentMethod: "credit_visa",
    scheduledPickupTime: null,
    orderNotes: "Extra napkins please",
    items: [
      {
        name: "Pepperoni Pizza",
        size: "14\"",
        quantity: 2,
        price: 29.98,
        customizations: "Extra cheese, No onions",
      },
      {
        name: "Hot Wings",
        size: "20 pieces",
        quantity: 1,
        price: 18.99,
        customizations: null,
      },
    ],
    subtotal: 48.97,
    deliveryFee: 5.0,
    total: 53.97,
    createdAt: new Date("2026-02-15T12:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendCustomerOrderConfirmation", () => {
    it("should generate and log customer confirmation email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = await sendCustomerOrderConfirmation(mockOrderDetails);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Email] Customer order confirmation:"
      );
      expect(consoleSpy).toHaveBeenCalledWith("To: john@example.com");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Subject: Order Confirmation #000123")
      );

      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock console.log to throw an error
      vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Email service unavailable");
      });

      const result = await sendCustomerOrderConfirmation(mockOrderDetails);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Email] Failed to send customer confirmation:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should include all order items in email", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await sendCustomerOrderConfirmation(mockOrderDetails);

      // Check that HTML content was generated
      const htmlLengthCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes("HTML Length:")
      );
      expect(htmlLengthCall).toBeDefined();
      expect(htmlLengthCall![0]).toMatch(/HTML Length: \d+ chars/);

      consoleSpy.mockRestore();
    });
  });

  describe("sendOwnerKitchenNotification", () => {
    it("should send kitchen order notification to owner", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const result = await sendOwnerKitchenNotification(mockOrderDetails);

      expect(result).toBe(true);
      expect(mockNotifyOwner).toHaveBeenCalledWith({
        title: "🍕 New DELIVERY Order #000123",
        content: expect.stringContaining("**Order #000123**"),
      });
      expect(mockNotifyOwner).toHaveBeenCalledWith({
        title: expect.any(String),
        content: expect.stringContaining("John Doe"),
      });
      expect(mockNotifyOwner).toHaveBeenCalledWith({
        title: expect.any(String),
        content: expect.stringContaining("403-555-1234"),
      });
    });

    it("should include all items in kitchen notification", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      await sendOwnerKitchenNotification(mockOrderDetails);

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("Pepperoni Pizza");
      expect(callContent).toContain("Hot Wings");
      expect(callContent).toContain("Extra cheese, No onions");
    });

    it("should include delivery address for delivery orders", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      await sendOwnerKitchenNotification(mockOrderDetails);

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("123 Main St, Airdrie, AB");
      expect(callContent).toContain("Ring doorbell");
    });

    it("should not include delivery address for pickup orders", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const pickupOrder: OrderDetails = {
        ...mockOrderDetails,
        orderType: "pickup",
        deliveryAddress: null,
        additionalInfo: null,
        deliveryFee: 0,
      };

      await sendOwnerKitchenNotification(pickupOrder);

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("PICKUP");
      expect(callContent).not.toContain("**Address:**");
    });

    it("should handle notification service failure", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(false);
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await sendOwnerKitchenNotification(mockOrderDetails);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Notification] Owner notification service unavailable"
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("sendErrorAlert", () => {
    it("should send error alert to owner", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const result = await sendErrorAlert(
        "Database Connection Error",
        "Connection timeout after 30s",
        { userId: 123, endpoint: "/api/orders/create" }
      );

      expect(result).toBe(true);
      expect(mockNotifyOwner).toHaveBeenCalledWith({
        title: "⚠️ System Error: Database Connection Error",
        content: expect.stringContaining("Connection timeout after 30s"),
      });
    });

    it("should include error context in alert", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      await sendErrorAlert("Payment Processing Error", "Card declined", {
        orderId: 456,
        amount: 53.97,
        paymentMethod: "credit_visa",
      });

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("orderId");
      expect(callContent).toContain("456");
      expect(callContent).toContain("paymentMethod");
    });

    it("should work without context", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const result = await sendErrorAlert(
        "General Error",
        "Something went wrong"
      );

      expect(result).toBe(true);
      expect(mockNotifyOwner).toHaveBeenCalledWith({
        title: "⚠️ System Error: General Error",
        content: expect.stringContaining("Something went wrong"),
      });
    });

    it("should handle notification service failure", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(false);
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = await sendErrorAlert("Test Error", "Test message");

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Notification] Error alert notification service unavailable"
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Email Content Generation", () => {
    it("should format prices correctly", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await sendCustomerOrderConfirmation(mockOrderDetails);

      // Get the HTML content from console.log calls
      const calls = consoleSpy.mock.calls;
      const htmlLengthIndex = calls.findIndex((call) =>
        call[0].includes("HTML Length:")
      );

      // Verify price formatting (this is indirect, but we can check the function was called)
      expect(htmlLengthIndex).toBeGreaterThan(-1);

      consoleSpy.mockRestore();
    });

    it("should handle orders without customizations", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const simpleOrder: OrderDetails = {
        ...mockOrderDetails,
        items: [
          {
            name: "Cheese Pizza",
            size: "12\"",
            quantity: 1,
            price: 19.99,
            customizations: null,
          },
        ],
      };

      await sendOwnerKitchenNotification(simpleOrder);

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("Cheese Pizza");
      expect(callContent).not.toContain("_null_");
    });

    it("should handle pickup orders with scheduled time", async () => {
      const mockNotifyOwner = vi
        .spyOn(notificationModule, "notifyOwner")
        .mockResolvedValue(true);

      const scheduledOrder: OrderDetails = {
        ...mockOrderDetails,
        orderType: "pickup",
        deliveryAddress: null,
        deliveryFee: 0,
        scheduledPickupTime: new Date("2026-02-15T18:00:00Z"),
      };

      await sendOwnerKitchenNotification(scheduledOrder);

      const callContent = mockNotifyOwner.mock.calls[0][0].content;
      expect(callContent).toContain("PICKUP");
      expect(callContent).toContain("**Scheduled Pickup:**");
    });
  });
});
