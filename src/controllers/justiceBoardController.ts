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
  paginationSchema,
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

  logger.info(`Field: ${field}`);
  logger.info(`ValueStr: ${valueStr}`);

  operator = mongoSignsParsingDictionary[operator];

  logger.info(`Operator: ${operator}`);

  const filteredJusticeBoard = await filterJusticeBoardByQuery(
    operator,
    Number(valueStr)
  );

  return await reply.code(HttpStatus.StatusCodes.OK).send(filteredJusticeBoard);
};

export const paginateJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...query } = request.query as {
    page?: string;
    limit?: string;
  };

  const page = Number(query.page!);
  const limit = Number(query.limit!);

  const schemaResult = validateSchema(paginationSchema, { page, limit });

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // I don't know why but every time I aggregate the justice board, the order of the elements is not constant...
  // For this task only, I just sort the justice board by id so the order will be constant.
  let justiceBoard = await aggregateJusticeBoard();

  justiceBoard = justiceBoard.sort((a, b) => {
    return a._id.localeCompare(b._id);
  });

  const justiceBoardPage = justiceBoard.slice(startIndex, endIndex);

  const amountOfJusticeBoardElements = justiceBoard.length;

  const totalPages = Math.ceil(amountOfJusticeBoardElements / limit);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ page: page, totalPages: totalPages, justiceBoardPage });
};

export const handleJusticeBoardRoute = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { filter } = request.query as { filter?: string };
  const { sort, order } = request.query as { sort?: string; order?: string };
  const { page, limit } = request.query as { page?: string; limit?: string };

  return filter
    ? await filterJusticeBoard(request, reply)
    : sort && order
    ? await sortJusticeBoard(request, reply)
    : page && limit
    ? await paginateJusticeBoard(request, reply)
    : await getJusticeBoard(request, reply);
};
