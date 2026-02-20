import { sendErrorAlert } from "./notifications";

/**
 * Global error handler for system failures
 * 
 * This module provides utilities to catch and report critical errors
 * to the owner via Manus notification system.
 */

export interface ErrorContext {
  userId?: number;
  endpoint?: string;
  input?: unknown;
  [key: string]: unknown;
}

/**
 * Handle and report critical errors
 */
export async function handleCriticalError(
  error: Error,
  errorType: string,
  context?: ErrorContext
): Promise<void> {
  // Log error locally
  console.error(`[Critical Error] ${errorType}:`, error);
  console.error("Context:", context);

  // Send alert to owner (don't await, don't block)
  sendErrorAlert(errorType, error.message, context).catch((alertError) => {
    console.error("[Error Handler] Failed to send error alert:", alertError);
  });
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleCriticalError(
        error instanceof Error ? error : new Error(String(error)),
        errorType,
        { args }
      );
      throw error; // Re-throw after logging
    }
  }) as T;
}

/**
 * Monitor database connection errors
 */
export function monitorDatabaseErrors(error: Error): void {
  const errorMessage = error.message.toLowerCase();
  
  // Check for common critical database errors
  if (
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("pool") ||
    errorMessage.includes("too many connections")
  ) {
    handleCriticalError(error, "Database Connection Error", {
      severity: "high",
      component: "database",
    });
  }
}

/**
 * Monitor payment processing errors
 */
export function monitorPaymentErrors(error: Error, orderId?: number): void {
  handleCriticalError(error, "Payment Processing Error", {
    severity: "critical",
    component: "payment",
    orderId,
  });
}

/**
 * Monitor order placement errors
 */
export function monitorOrderErrors(error: Error, userId?: number): void {
  handleCriticalError(error, "Order Placement Error", {
    severity: "high",
    component: "orders",
    userId,
  });
}
