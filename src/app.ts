import { validateConfig } from "./config.js";
import { createServer, start } from "./server.js";
import { connectToDB } from "./db/connections.js";

export const initialize = async () => {
  validateConfig();

  await connectToDB();

  const server = await createServer();
  start(server);

  return server;
};

initialize();
