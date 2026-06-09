import { logger, LogLevel } from "./logger.ts";

Deno.test("LogLevel enum has expected values", () => {
  if (LogLevel.DEBUG !== 0) {
    throw new Error(`Expected 0, got ${LogLevel.DEBUG}`);
  }
  if (LogLevel.INFO !== 1) throw new Error(`Expected 1, got ${LogLevel.INFO}`);
  if (LogLevel.WARN !== 2) throw new Error(`Expected 2, got ${LogLevel.WARN}`);
  if (LogLevel.ERROR !== 3) {
    throw new Error(`Expected 3, got ${LogLevel.ERROR}`);
  }
});

Deno.test("logger has all log methods", () => {
  if (typeof logger.debug !== "function") {
    throw new Error(`Expected function, got ${typeof logger.debug}`);
  }
  if (typeof logger.info !== "function") {
    throw new Error(`Expected function, got ${typeof logger.info}`);
  }
  if (typeof logger.warn !== "function") {
    throw new Error(`Expected function, got ${typeof logger.warn}`);
  }
  if (typeof logger.error !== "function") {
    throw new Error(`Expected function, got ${typeof logger.error}`);
  }
});

Deno.test("logger methods can be called without throwing", () => {
  logger.debug("debug test");
  logger.info("info test");
  logger.warn("warn test");
  logger.error("error test");
});

Deno.test("logger handles multiple arguments", () => {
  logger.info("multiple", "args", { key: "value" });
  logger.error(new Error("test error"));
});
