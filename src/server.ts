import { fastify, FastifyInstance } from "fastify";

import config from "./config.js";
import dutyRoutes from "./routes/dutyRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import justiceBoardRoutes from "./routes/justiceBoardRoutes.js";
import logger from "./logger.js";
import soldierRoutes from "./routes/soldierRoutes.js";

const createServer = async () => {
  const server = fastify({ logger: true });

  healthRoutes(server);

  await server.register(soldierRoutes);

  await server.register(dutyRoutes);

  await server.register(justiceBoardRoutes);

  return server;
};

const start = async (server: FastifyInstance) => {
  try {
    await server.listen({ port: Number(config.serverPort) });
    logger.info(`Server is running on ${config.serverPort}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

const close = async (server: FastifyInstance) => {
  await server.close();
};

export { createServer, start, close };
