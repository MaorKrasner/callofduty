import { FastifyInstance } from "fastify";

import {
  createSoldier,
  deleteSoldierById,
  getSoldierById,
  handleGetQueryFilters,
  updateSoldierById,
} from "../controllers/soldierController.js";

const soldierRoutes = async (server: FastifyInstance) => {
  server.post("/soldiers", createSoldier);
  server.get("/soldiers/:id", getSoldierById);
  server.get("/soldiers", handleGetQueryFilters);
  server.delete("/soldiers/:id", deleteSoldierById);
  server.patch("/soldiers/:id", updateSoldierById);
};

export default soldierRoutes;
