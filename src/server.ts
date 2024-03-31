import { fastify, FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
// import fastifyBasicAuth from "fastify-basic-auth";
import fastifyRateLimit from "@fastify/rate-limit";

import config from "./config.js";
import dutyRoutes from "./routes/dutyRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import justiceBoardRoutes from "./routes/justiceBoardRoutes.js";
import logger from "./logger.js";
import soldierRoutes from "./routes/soldierRoutes.js";

const createServer = async () => {
  const server = fastify({ logger: true });

  server.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  /*
  server.register(fastifyBasicAuth);

  const users = {
    admin: "adminpassword",
    user: "userpassword",
  };
  */

  await server.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Test swagger",
        description: "Testing the Fastify swagger API",
        version: "0.1.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [
        { name: "user", description: "User related end-points" },
        { name: "code", description: "Code related end-points" },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "apiKey",
            in: "header",
          },
        },
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
    },
  });

  /*
  await server.register(fastifySwagger, {
    routePrefix: "/documentation",
    swagger: {
      info: {
        title: "My API Documentation",
        description: "A documentation for my API",
        version: "1.0.0",
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });
  */

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
    logger.error(err);
    process.exit(1);
  }
};

const close = async (server: FastifyInstance) => {
  await server.close();
};

export { createServer, start, close };
