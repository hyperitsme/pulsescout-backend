import "dotenv/config";

const parseList = (s) =>
  (s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 8000),
  corsOrigins: parseList(process.env.CORS_ORIGINS) || ["*"],
  dbUrl: process.env.DATABASE_URL,
  solReceiver: process.env.SOL_RECEIVER || "",
  demoAlertInterval: Number(process.env.DEMO_ALERT_INTERVAL_MS || 7000),
  nodeEnv: process.env.NODE_ENV || "production"
};
