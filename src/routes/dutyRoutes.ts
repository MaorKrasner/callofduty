import { FastifyInstance } from "fastify";

import { createDuty, deleteDutyById, getDutiesByFilters, getDutyById, updateDutyById } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
    server.get("/duties", getDutiesByFilters);
    server.get("/duties/:id", getDutyById);
    server.delete("/duties/:id", deleteDutyById);
    server.patch("/duties/:id", updateDutyById);
};

export default dutyRoutes;