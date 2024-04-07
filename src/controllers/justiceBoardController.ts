import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import {
  aggregateJusticeBoard,
  aggregateJusticeBoardById,
  filterJusticeBoardByQuery,
} from "../collections/justice-board.js";
import { findSoldier } from "../collections/soldier.js";
import { validateSchema } from "../schemas/validator.js";
import {
  mongoSignsParsingDictionary,
  sortingSchema,
} from "../schemas/useableSchemas.js";
import logger from "../logger.js";

export const getJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const justiceBoard = await aggregateJusticeBoard();

  if (justiceBoard.length === 0) {
    return await reply.code(HttpStatus.StatusCodes.OK).send({});
  }

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

export const sortJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const validSortFilters = ["_id", "score"];

  const { ...sortingFilter } = request.query as {
    sort: string;
    order: string;
  };

  const schemaResult = validateSchema(sortingSchema, sortingFilter);

  if (!schemaResult || !validSortFilters.includes(sortingFilter.sort)) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema` });
  }

  const justiceBoard = await aggregateJusticeBoard();
  const sortedJusticeBoard = justiceBoard.sort((a, b) => {
    const ascendingSign = sortingFilter.order === "ascend" ? 1 : -1;
    if (sortingFilter.sort === "score") {
      return a.score > b.score
        ? 1 * ascendingSign
        : a.score < b.score
        ? -1 * ascendingSign
        : 0;
    }

    return a._id.localeCompare(b._id) * ascendingSign;
  });

  return await reply.code(HttpStatus.StatusCodes.OK).send(sortedJusticeBoard);
};

export const filterJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...query } = request.query as {
    filter: string;
  };

  if (!query.filter.includes("score")) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  let [field, operator, valueStr] = query.filter.split(/(>=|<=|<|>|=)/);

  const value = Number(valueStr);

  let justiceBoard = await aggregateJusticeBoard();

  logger.info(`Justice board: ${JSON.stringify(justiceBoard)}`);

  switch (operator) {
    case ">=":
      justiceBoard = justiceBoard.filter((element) => element.score >= value);
      break;
    case "<=":
      justiceBoard = justiceBoard.filter((element) => element.score <= value);
      break;
    case ">":
      justiceBoard = justiceBoard.filter((element) => element.score > value);
      break;
    case "<":
      justiceBoard = justiceBoard.filter((element) => element.score < value);
      break;
    case "=":
      justiceBoard = justiceBoard.filter((element) => element.score === value);
      break;
    default:
      logger.info("Default case.");
      break;
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(justiceBoard);
};

export const handleJusticeBoardRoute = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { filter } = request.query as { filter?: string };
  const { sort, order } = request.query as { sort?: string; order?: string };

  return filter
    ? await filterJusticeBoard(request, reply)
    : sort && order
    ? sortJusticeBoard(request, reply)
    : await getJusticeBoard(request, reply);
};
