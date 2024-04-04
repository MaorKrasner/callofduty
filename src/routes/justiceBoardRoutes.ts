import { FastifyInstance } from "fastify";

import {
  getJusticeBoardById,
  handleJusticeBoardRoute,
} from "../controllers/justiceBoardController.js";

const justiceBoardRoutes = async (server: FastifyInstance) => {
  server.get("/justice-board", handleJusticeBoardRoute);
  server.get("/justice-board/:id", getJusticeBoardById);
};

export default justiceBoardRoutes;
