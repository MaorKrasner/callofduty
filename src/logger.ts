import pino from "pino";

const logLevel = process.env.LOG_LEVEL || "info";
const isTestEnvironment = process.env.NODE_ENV === "test";
const isDevEnvironment = process.env.NODE_ENV === "development";

const logger = pino({
  level: isTestEnvironment ? "silent" : logLevel,
  ...(isDevEnvironment
    ? {
        prettyPrint: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
      }
    : {}),
});

export default logger;
