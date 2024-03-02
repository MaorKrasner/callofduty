import { FastifyInstance } from "fastify";

import { aggregateJusticeBoard } from "../db/justiceBoardFunctions.js";

const justiceBoardRoutes = async (server: FastifyInstance) => {
    server.get("/justice-board", aggregateJusticeBoard);
}

export default justiceBoardRoutes;