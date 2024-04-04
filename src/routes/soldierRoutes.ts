import { FastifyInstance } from "fastify";

import {
  createSoldier,
  deleteSoldierById,
  getSoldierById,
  handleGetFilterFunctions,
  updateSoldierById,
} from "../controllers/soldierController.js";

const soldierRoutes = async (server: FastifyInstance) => {
  server.post("/soldiers", createSoldier);
  server.get("/soldiers/:id", getSoldierById);
  server.get("/soldiers", handleGetFilterFunctions);
  server.delete("/soldiers/:id", deleteSoldierById);
  server.patch("/soldiers/:id", updateSoldierById);
};

export default soldierRoutes;
