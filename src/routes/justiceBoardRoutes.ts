import { FastifyInstance } from "fastify";

import {
  getJusticeBoard,
  getJusticeBoardById,
} from "../controllers/justiceBoardController.js";

const justiceBoardRoutes = async (server: FastifyInstance) => {
  server.get("/justice-board", getJusticeBoard);
  server.get("/justice-board/:id", getJusticeBoardById);
};

export default justiceBoardRoutes;
