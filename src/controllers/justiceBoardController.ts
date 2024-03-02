import { FastifyRequest, FastifyReply } from "fastify";

import { aggregateJusticeBoard, aggregateJusticeBoardById } from "../db/justiceBoardFunctions.js";
import { findSoldier } from "../db/soldierDBFunctions.js";
import type { justiceBoardElement } from "../types/justice-board.js";

export const getJusticeBoard = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const justiceBoard: justiceBoardElement[] = await aggregateJusticeBoard();

    await reply.code(200).send(justiceBoard);
};

export const getJusticeBoardById = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const soldier = await findSoldier(id);

  if (soldier) {
    const soldierScore = await aggregateJusticeBoardById(id);
    await reply.code(200).send({score: soldierScore});
  } else {
    await reply
      .code(400)
      .send({error: `Couldn't find soldier with id ${id}`});
  }
};