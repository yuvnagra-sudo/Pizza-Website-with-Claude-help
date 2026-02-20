import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";

/**
 * Email Notification Service for Johnny's Pizza & Wings
 * 
 * This module handles:
 * 1. Customer order confirmations (via external email service)
 * 2. Owner kitchen order notifications (via Manus notifyOwner)
 * 3. System error alerts (via Manus notifyOwner)
 */

export interface OrderDetails {
  orderId: number;
  orderNumber: string;
  orderType: "pickup" | "delivery";
  customerName: string;
  email: string;
  phoneNumber: string;
  deliveryAddress?: string | null;
  additionalInfo?: string | null;
  paymentMethod?: string | null;
  scheduledPickupTime?: Date | null;
  orderNotes?: string | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
}

export interface OrderItem {
  name: string;
  size?: string | null;
  quantity: number;
  price: number;
  customizations?: string | null;
}

/**
 * Send order confirmation email to customer via SendGrid.
 * Requires SENDGRID_API_KEY env variable. Falls back to console log when not set.
 */
export async function sendCustomerOrderConfirmation(
  order: OrderDetails
): Promise<boolean> {
  try {
    const emailHtml = generateCustomerConfirmationEmail(order);
    const emailText = generateCustomerConfirmationText(order);
    const subject = `Order Confirmation #${order.orderNumber} - Johnny's Pizza & Wings`;

    if (!ENV.sendgridApiKey) {
      console.log("[Email] SENDGRID_API_KEY not set — logging instead of sending.");
      console.log(`  To: ${order.email} | Subject: ${subject}`);
      return true;
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: order.email, name: order.customerName }] }],
        from: { email: ENV.fromEmail, name: ENV.fromName },
        reply_to: { email: ENV.fromEmail, name: ENV.fromName },
        subject,
        content: [
          { type: "text/plain", value: emailText },
          { type: "text/html", value: emailHtml },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Email] SendGrid error ${response.status}: ${body}`);
      return false;
    }

    console.log(`[Email] Confirmation sent to ${order.email} (Order #${order.orderNumber})`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send customer confirmation:", error);
    return false;
  }
}

/**
 * Send kitchen order notification to owner via Manus + optional Slack/Discord webhooks
 */
export async function sendOwnerKitchenNotification(
  order: OrderDetails
): Promise<boolean> {
  try {
    const title = `🍕 New ${order.orderType.toUpperCase()} Order #${order.orderNumber}`;
    const content = generateKitchenOrderContent(order);

    const results = await Promise.allSettled([
      // Always attempt Manus owner notification
      notifyOwner({ title, content }),

      // Slack webhook — only if configured
      ENV.slackWebhookUrl
        ? sendSlackNotification(order, title, content)
        : Promise.resolve(true),

      // Discord webhook — only if configured
      ENV.discordWebhookUrl
        ? sendDiscordNotification(order, title, content)
        : Promise.resolve(true),
    ]);

    const [manusResult, slackResult, discordResult] = results;

    if (manusResult.status === "rejected" || manusResult.value === false) {
      console.warn("[Notification] Manus owner notification service unavailable");
    }
    if (ENV.slackWebhookUrl && (slackResult.status === "rejected" || slackResult.value === false)) {
      console.warn("[Notification] Slack webhook delivery failed");
    }
    if (ENV.discordWebhookUrl && (discordResult.status === "rejected" || discordResult.value === false)) {
      console.warn("[Notification] Discord webhook delivery failed");
    }

    // Return true if at least one channel succeeded
    return results.some((r) => r.status === "fulfilled" && r.value === true);
  } catch (error) {
    console.error("[Notification] Failed to send owner notification:", error);
    return false;
  }
}

/**
 * Post a new order notification to a Slack incoming webhook
 */
async function sendSlackNotification(
  order: OrderDetails,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const response = await fetch(ENV.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: title,
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: title, emoji: true },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: content },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Total:* $${order.total.toFixed(2)} | *Phone:* ${order.phoneNumber} | *Time:* ${order.createdAt.toLocaleString()}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Slack] Webhook error ${response.status}: ${body}`);
      return false;
    }

    console.log(`[Slack] Kitchen notification sent for Order #${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error("[Slack] Failed to send webhook:", error);
    return false;
  }
}

/**
 * Post a new order notification to a Discord incoming webhook
 */
async function sendDiscordNotification(
  order: OrderDetails,
  title: string,
  content: string
): Promise<boolean> {
  try {
    const color = order.orderType === "delivery" ? 0x5865f2 : 0xf59e0b; // purple for delivery, amber for pickup

    const response = await fetch(ENV.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Johnny's Pizza Kitchen",
        embeds: [
          {
            title,
            description: content,
            color,
            footer: {
              text: `Order placed at ${order.createdAt.toLocaleString()}`,
            },
            fields: [
              { name: "Total", value: `$${order.total.toFixed(2)}`, inline: true },
              { name: "Phone", value: order.phoneNumber, inline: true },
              { name: "Type", value: order.orderType.toUpperCase(), inline: true },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Discord] Webhook error ${response.status}: ${body}`);
      return false;
    }

    console.log(`[Discord] Kitchen notification sent for Order #${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error("[Discord] Failed to send webhook:", error);
    return false;
  }
}

/**
 * Send system error alert to owner
 */
export async function sendErrorAlert(
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
): Promise<boolean> {
  try {
    const title = `⚠️ System Error: ${errorType}`;
    const content = `
**Error Type:** ${errorType}

**Message:** ${errorMessage}

**Time:** ${new Date().toISOString()}

${context ? `**Context:**\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`` : ""}

Please investigate this issue as soon as possible.
    `.trim();

    const success = await notifyOwner({ title, content });
    
    if (!success) {
      console.warn("[Notification] Error alert notification service unavailable");
    }

    return success;
  } catch (error) {
    console.error("[Notification] Failed to send error alert:", error);
    return false;
  }
}

/**
 * Generate HTML email for customer order confirmation
 */
function generateCustomerConfirmationEmail(order: OrderDetails): string {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.size ? `<br><span style="color: #666; font-size: 14px;">${item.size}</span>` : ""}
        ${item.customizations ? `<br><span style="color: #666; font-size: 13px;">${item.customizations}</span>` : ""}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">Johnny's Pizza & Wings</h1>
    <p style="margin: 10px 0 0; font-size: 16px;">Order Confirmation</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #1e3a8a; margin-top: 0;">Thank You, ${order.customerName}!</h2>
      <p style="font-size: 16px;">Your order has been received and is being prepared.</p>
      
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">Order #${order.orderNumber}</p>
        <p style="margin: 5px 0 0; color: #92400e;">${order.orderType === "pickup" ? "🚶 Pickup" : "🚗 Delivery"}</p>
      </div>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #1e3a8a;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left;">Item</th>
            <th style="padding: 12px; text-align: center;">Qty</th>
            <th style="padding: 12px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 12px; text-align: right;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          ${
            order.deliveryFee > 0
              ? `
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Delivery Fee:</td>
            <td style="padding: 12px; text-align: right;">$${order.deliveryFee.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr style="background: #f3f4f6;">
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #1e3a8a;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #1e3a8a;">${order.orderType === "pickup" ? "Pickup" : "Delivery"} Information</h3>
      ${
        order.orderType === "delivery"
          ? `
      <p><strong>Delivery Address:</strong><br>${order.deliveryAddress || "N/A"}</p>
      ${order.additionalInfo ? `<p><strong>Additional Info:</strong><br>${order.additionalInfo}</p>` : ""}
      `
          : ""
      }
      ${order.scheduledPickupTime ? `<p><strong>Scheduled Pickup:</strong><br>${new Date(order.scheduledPickupTime).toLocaleString()}</p>` : ""}
      <p><strong>Phone:</strong> ${order.phoneNumber}</p>
      ${order.paymentMethod ? `<p><strong>Payment Method:</strong> ${order.paymentMethod}</p>` : ""}
      ${order.orderNotes ? `<p><strong>Special Instructions:</strong><br>${order.orderNotes}</p>` : ""}
    </div>

    <div style="background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center;">
      <p style="margin: 0; font-size: 16px; color: #1e3a8a;">
        <strong>Questions about your order?</strong><br>
        Call us at <a href="tel:4039482020" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">403-948-2020</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
    <p>Johnny's Pizza & Wings<br>Airdrie, AB<br>403-948-2020</p>
    <p style="margin-top: 10px;">Thank you for choosing Johnny's!</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for customer order confirmation
 */
function generateCustomerConfirmationText(order: OrderDetails): string {
  const itemsText = order.items
    .map((item) => {
      let line = `${item.name}`;
      if (item.size) line += ` (${item.size})`;
      line += ` ×${item.quantity} - $${item.price.toFixed(2)}`;
      if (item.customizations) line += `\n  ${item.customizations}`;
      return line;
    })
    .join("\n");

  return `
JOHNNY'S PIZZA & WINGS
Order Confirmation

Thank You, ${order.customerName}!

Your order has been received and is being prepared.

Order #${order.orderNumber}
${order.orderType === "pickup" ? "PICKUP" : "DELIVERY"}

ORDER DETAILS:
${itemsText}

Subtotal: $${order.subtotal.toFixed(2)}
${order.deliveryFee > 0 ? `Delivery Fee: $${order.deliveryFee.toFixed(2)}\n` : ""}Total: $${order.total.toFixed(2)}

${order.orderType === "delivery" ? `DELIVERY ADDRESS:\n${order.deliveryAddress || "N/A"}\n${order.additionalInfo ? `Additional Info: ${order.additionalInfo}\n` : ""}` : ""}
${order.scheduledPickupTime ? `SCHEDULED PICKUP:\n${new Date(order.scheduledPickupTime).toLocaleString()}\n` : ""}
PHONE: ${order.phoneNumber}
${order.paymentMethod ? `PAYMENT METHOD: ${order.paymentMethod}\n` : ""}
${order.orderNotes ? `SPECIAL INSTRUCTIONS:\n${order.orderNotes}\n` : ""}

Questions about your order?
Call us at 403-948-2020

Johnny's Pizza & Wings
Airdrie, AB
403-948-2020

Thank you for choosing Johnny's!
  `.trim();
}

/**
 * Generate kitchen order content for owner notification
 */
function generateKitchenOrderContent(order: OrderDetails): string {
  const itemsList = order.items
    .map((item) => {
      let line = `- **${item.name}**`;
      if (item.size) line += ` (${item.size})`;
      line += ` ×${item.quantity}`;
      if (item.customizations) line += `\n  _${item.customizations}_`;
      return line;
    })
    .join("\n");

  return `
**Order #${order.orderNumber}** | ${order.orderType.toUpperCase()}

**Customer:** ${order.customerName}
**Phone:** ${order.phoneNumber}
${order.email ? `**Email:** ${order.email}\n` : ""}
${order.orderType === "delivery" ? `**Address:** ${order.deliveryAddress || "N/A"}\n${order.additionalInfo ? `**Additional Info:** ${order.additionalInfo}\n` : ""}` : ""}
${order.scheduledPickupTime ? `**Scheduled Pickup:** ${new Date(order.scheduledPickupTime).toLocaleString()}\n` : ""}
${order.paymentMethod ? `**Payment:** ${order.paymentMethod}\n` : ""}

**Items:**
${itemsList}

${order.orderNotes ? `**Special Instructions:**\n${order.orderNotes}\n\n` : ""}**Subtotal:** $${order.subtotal.toFixed(2)}
${order.deliveryFee > 0 ? `**Delivery Fee:** $${order.deliveryFee.toFixed(2)}\n` : ""}**TOTAL:** $${order.total.toFixed(2)}

**Order Time:** ${order.createdAt.toLocaleString()}
  `.trim();
}
