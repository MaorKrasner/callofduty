import {
  fastify,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyUnderPressure from "@fastify/under-pressure";

import config from "./config.js";
import dutyRoutes from "./routes/dutyRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import justiceBoardRoutes from "./routes/justiceBoardRoutes.js";
import logger from "./logger.js";
import soldierRoutes from "./routes/soldierRoutes.js";

const basicAuthMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    reply.status(401).send({
      error: "Unauthorized",
      message: "Missing or invalid authorization header",
    });
    return;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  if (username !== "admin" || password !== "password") {
    reply
      .status(401)
      .send({ error: "Unauthorized", message: "Invalid username or password" });
    return;
  }
};

const createServer = async () => {
  const server = fastify({ logger: true });

  server.decorate("basicAuthMiddleware", basicAuthMiddleware);

  server.get(
    "/",
    { preHandler: basicAuthMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return "Authenticated!";
    }
  );

  /*
  // Define mock users (replace this with your actual user data)
  const users: { [key: string]: string } = {
    admin: "password",
  };

  // Register fastify-basic-auth plugin
  server.register(fastifyBasicAuth, {
    authenticate: async (username: string, password: string) => {
      const isValidUser = users[username] === password;
      return { isValid: isValidUser };
    },
    authenticateErrorHandler: (
      error: unknown,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      reply.status(401).send({ error: "Unauthorized" });
    },
  });

  server.get('/protected-route', { preHandler: server.auth([server.basicAuth]) }, (request, reply) => {
    reply.send('You are authenticated!');
  });
  */

  server.register(fastifyUnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
    message: "Under pressure!",
    retryAfter: 50,
  });

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

  server.register(fastifySwagger, {
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
    await server.listen({ port: Number(config.serverPort), host: "0.0.0.0" });
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
