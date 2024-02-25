import { FastifyInstance } from "fastify";

import { createDuty, getDutiesByFilters, getDutyById } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
    server.get("/duties", getDutiesByFilters);
    server.get("/duties/:id", getDutyById);
};

export default dutyRoutes;