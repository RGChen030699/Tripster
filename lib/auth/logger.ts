import type { Logger } from "@/lib/auth/types";

export function createConsoleLogger(): Logger {
  return {
    info(message) {
      console.info(message);
    },
    error(message) {
      console.error(message);
    },
  };
}
