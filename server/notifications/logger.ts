import type { SafeLogger } from "./types.js";

export const consoleSafeLogger: SafeLogger = {
  info(event, fields) {
    console.info(JSON.stringify({ event, ...fields }));
  },
  warn(event, fields) {
    console.warn(JSON.stringify({ event, ...fields }));
  },
};
