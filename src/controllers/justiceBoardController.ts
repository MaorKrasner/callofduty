import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import {
  aggregateJusticeBoard,
  aggregateJusticeBoardById,
} from "../collections/justice-board.js";
import { findSoldier } from "../collections/soldier.js";
import type { justiceBoardElement } from "../types/justice-board.js";

export const getJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const justiceBoard = await aggregateJusticeBoard();

  return await reply.code(HttpStatus.StatusCodes.OK).send(justiceBoard);
};

export const getJusticeBoardById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  if (!(await findSoldier(id))) {
    return await reply
      .code(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Couldn't find soldier with id ${id}` });
  }

  const soldierScore = await aggregateJusticeBoardById(id);
  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ score: soldierScore });
};
