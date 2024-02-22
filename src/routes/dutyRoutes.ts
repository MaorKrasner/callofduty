import { FastifyInstance } from "fastify";

import { createDuty } from "../controllers/dutyController.js";

const dutyRoutes = async (server: FastifyInstance) => {
    server.post("/duties", createDuty);
};

export default dutyRoutes;