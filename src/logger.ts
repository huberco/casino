/**
 * Central logging via @slackgram/logger — console, optional file rotation,
 * and optional Discord / Slack / Telegram hooks (env-driven).
 * Load .env before this module runs (see import order in entrypoint).
 */
import "dotenv/config";
import log, { config as loggerConfig } from "@slackgram/logger";
import type { EnvironmentMode, LogLevel, RotationStrategy } from "@slackgram/logger";

function parseLevel(s: string | undefined, fallback: LogLevel): LogLevel {
  const v = s?.toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return fallback;
}

function parseEnvMode(): EnvironmentMode {
  const n = process.env.NODE_ENV?.toLowerCase();
  if (n === "production" || n === "test" || n === "development") return n;
  return "development";
}

function parseRotation(): RotationStrategy {
  const s = process.env.LOG_ROTATION?.toUpperCase();
  if (s === "1H" || s === "1D" || s === "1W") return s;
  return "1D";
}

const fileEnabled =
  process.env.LOG_FILE === "1" ||
  process.env.LOG_FILE === "true" ||
  process.env.LOG_FILE_ENABLED === "1" ||
  process.env.LOG_FILE_ENABLED === "true";

loggerConfig({
  env: parseEnvMode(),
  minLevel: parseLevel(process.env.LOG_LEVEL, "info"),
  debug: process.env.LOG_DEBUG === "1" || process.env.LOG_DEBUG === "true",
  silent: process.env.LOG_SILENT === "1" || process.env.LOG_SILENT === "true",
  colors: process.env.LOG_COLORS !== "0" && !process.env.NO_COLOR,
  file: fileEnabled
    ? {
        enabled: true,
        filePath: process.env.LOG_FILE_PATH ?? "logs/bot.log",
        rotation: {
          strategy: parseRotation(),
          maxFiles: Math.max(1, Number(process.env.LOG_MAX_FILES) || 7),
        },
        flushIntervalMs: Math.max(500, Number(process.env.LOG_FLUSH_MS) || 2000),
        prettyJson: process.env.LOG_PRETTY_JSON !== "0",
      }
    : false,
  hooks: {
    minLevel: parseLevel(process.env.MB_LOG_HOOK_LEVEL, "error"),
    discord: {
      enabled: Boolean(process.env.DISCORD_WEBHOOK_URL),
      webhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
    },
    slack: {
      enabled: Boolean(process.env.SLACK_WEBHOOK_URL),
      webhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
    },
    telegram: {
      enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
      chatId: process.env.TELEGRAM_CHAT_ID ?? "",
    },
  },
});

/** Best-effort flush on exit so file/hooks get last lines */
function setupExitFlush(): void {
  const flush = () => {
    void log.flush().catch(() => {});
  };
  process.once("beforeExit", flush);
  process.once("SIGINT", () => {
    flush();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    flush();
    process.exit(143);
  });
}
setupExitFlush();

export default log;
export { tag } from "@slackgram/logger";
