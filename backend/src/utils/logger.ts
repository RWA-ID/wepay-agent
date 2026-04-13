// Never log private keys, seed phrases, or wallet secrets.
// This logger redacts anything matching a private key pattern before output.

const PRIVATE_KEY_PATTERN = /0x[a-fA-F0-9]{64}/g;

function redact(value: unknown): string {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return str.replace(PRIVATE_KEY_PATTERN, "[REDACTED]");
}

function format(level: string, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${redact(meta)}` : "";
  return `[${ts}] ${level.toUpperCase()} ${redact(message)}${metaStr}`;
}

export const logger = {
  info:  (msg: string, meta?: unknown) => console.log(format("info", msg, meta)),
  warn:  (msg: string, meta?: unknown) => console.warn(format("warn", msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(format("error", msg, meta)),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "production") console.debug(format("debug", msg, meta));
  },
};
