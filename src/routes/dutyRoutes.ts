import { FastifyInstance } from "fastify";

import { createDuty, deleteDutyById, getDutiesByFilters, getDutyById } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
    server.get("/duties", getDutiesByFilters);
    server.get("/duties/:id", getDutyById);
    server.delete("/duties/:id", deleteDutyById);
};

export default dutyRoutes;