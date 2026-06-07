import { assertEquals } from "@std/assert";
import { logger, LogLevel } from "./logger.ts";

Deno.test("LogLevel enum has expected values", () => {
  assertEquals(LogLevel.DEBUG, 0);
  assertEquals(LogLevel.INFO, 1);
  assertEquals(LogLevel.WARN, 2);
  assertEquals(LogLevel.ERROR, 3);
});

Deno.test("logger has all log methods", () => {
  assertEquals(typeof logger.debug, "function");
  assertEquals(typeof logger.info, "function");
  assertEquals(typeof logger.warn, "function");
  assertEquals(typeof logger.error, "function");
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
