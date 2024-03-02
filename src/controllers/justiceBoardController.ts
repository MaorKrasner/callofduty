import { FastifyRequest, FastifyReply } from "fastify";

import { aggregateJusticeBoard } from "../db/justiceBoardFunctions.js";
import type { justiceBoardElement } from "../types/justice-board.js";

export const getJusticeBoard = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const justiceBoard: justiceBoardElement[] = await aggregateJusticeBoard();

    await reply.code(200).send(justiceBoard);
};