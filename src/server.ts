import { fastify, FastifyInstance } from "fastify";

import config from "./config.js";
import logger from "./logger.js";
import healthRoutes from "./routes/healthRoutes.js";
import soldierRoutes from "./routes/soldierRoutes.js";
import dutyRoutes from "./routes/dutyRoutes.js";

const createServer = async () => {
  const server = fastify({ logger: true });

  healthRoutes(server);

  await server.register(soldierRoutes);

  await server.register(dutyRoutes);

  return server;
};

const start = async (server: FastifyInstance) => {
  try {
    await server.listen({ port: Number(config.serverPort) });
    logger.info(`Server is running on ${config.serverPort}`);
  } catch (err) {
    logger.error(err);
  }
};

const close = async (server: FastifyInstance) => {
  await server.close();
};

export { createServer, start, close };
