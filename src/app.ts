import { validateConfig } from "./config.js";
import { createServer, start } from "./server.js";
import { connectToDB } from "./db/connections.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM signal");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT signal");
  process.exit(0);
});

export const initialize = async () => {
  validateConfig();

  await connectToDB();

  const server = await createServer();
  start(server);

  return server;
};

initialize();
