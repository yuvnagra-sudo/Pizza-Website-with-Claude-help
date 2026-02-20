export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Admin bootstrap — first registration with this email gets admin role automatically
  adminEmail: process.env.ADMIN_EMAIL ?? "",

  // LLM — Anthropic Claude via OpenAI-compatible endpoint
  // Set ANTHROPIC_API_KEY to enable AI chat features
  llmApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "https://api.anthropic.com/openai/v1",

  // Email (SendGrid) — set SENDGRID_API_KEY to enable customer confirmation emails
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  fromEmail: process.env.FROM_EMAIL ?? "orders@johnnyspizza-wings.com",
  fromName: process.env.FROM_NAME ?? "Johnny's Pizza & Wings",

  // Kitchen webhook notifications — set either to post new orders to Slack/Discord
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
};
