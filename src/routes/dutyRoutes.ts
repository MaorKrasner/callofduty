import { FastifyInstance } from "fastify";

import { createDuty, getDutiesByFilters } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
    server.get("/duties", getDutiesByFilters);
};

export default dutyRoutes;