import { fastify, FastifyInstance } from "fastify";

import config from "./config.js";
import logger from "./logger.js";
import healthRoutes from "./routes/healthRoutes.js";
import soldierRoutes from "./routes/soldierRoutes.js";

const createServer = async() => {
    const server = fastify({ logger: true });

    healthRoutes(server);

    await server.register(soldierRoutes);

    return server;
};

const start = async (server: FastifyInstance) => {
    try {
        await server.listen({ port: Number(config.serverPort) });
        logger.info(`Server is running on http://localhost:${config.serverPort}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

export { createServer, start };