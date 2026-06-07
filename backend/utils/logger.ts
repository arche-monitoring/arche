const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colors.gray,
  [LogLevel.INFO]: colors.green,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
};

const levelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

const currentLevel = LogLevel.DEBUG;

function log(level: LogLevel, ...args: unknown[]) {
  if (level < currentLevel) return;
  const timestamp = new Date().toISOString();
  const color = levelColors[level];
  const prefix = `${colors.gray}[${timestamp}]${colors.reset} ${color}[${
    levelNames[level]
  }]${colors.reset} ${colors.blue}arche${colors.reset}`;
  const message = args.map((
    a,
  ) => (typeof a === "object" ? JSON.stringify(a, null, 0) : String(a))).join(
    " ",
  );
  console.log(`${prefix} ${message}`);
}

export const logger = {
  debug: (...args: unknown[]) => log(LogLevel.DEBUG, ...args),
  info: (...args: unknown[]) => log(LogLevel.INFO, ...args),
  warn: (...args: unknown[]) => log(LogLevel.WARN, ...args),
  error: (...args: unknown[]) => log(LogLevel.ERROR, ...args),
};
