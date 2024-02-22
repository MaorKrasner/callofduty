import { FastifyInstance } from "fastify";

import { dbHealthCheck, healthCheck } from "../controllers/healthController.js";

const healthRoutes = (server: FastifyInstance) => {
  server.get("/health", healthCheck);
  server.get("/health/db", dbHealthCheck);
};

export default healthRoutes;
