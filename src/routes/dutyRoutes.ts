import { FastifyInstance } from "fastify";

import { createDuty, deleteDutyById, getDutiesByFilters, getDutyById, putConstraintsById, updateDutyById } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
    server.get("/duties", getDutiesByFilters);
    server.get("/duties/:id", getDutyById);
    server.delete("/duties/:id", deleteDutyById);
    server.patch("/duties/:id", updateDutyById);
    server.put("/duties/:id/constraints", putConstraintsById);
};

export default dutyRoutes;