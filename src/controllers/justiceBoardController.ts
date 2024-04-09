import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import {
  aggregateJusticeBoard,
  aggregateJusticeBoardById,
  filterJusticeBoardByQuery,
  populateJusticeBoardByQuery,
  projectJusticeBoardByQuery,
} from "../collections/justice-board.js";
import { findSoldier } from "../collections/soldier.js";
import { validateSchema } from "../schemas/validator.js";
import {
  mongoSignsParsingDictionary,
  paginationSchema,
  projectionSchema,
  sortingSchema,
} from "../schemas/useableSchemas.js";
import logger from "../logger.js";
import {
  getJusticeBoardProjection,
  justiceBoardValidFields,
} from "../logic/projectionLogic.js";

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
    sort?: string;
    order?: string;
  };

  const schemaResult = validateSchema(sortingSchema, sortingFilter);

  if (!schemaResult || !validSortFilters.includes(sortingFilter.sort!)) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema` });
  }

  const justiceBoard = await aggregateJusticeBoard();
  const sortedJusticeBoard = justiceBoard.sort((a, b) => {
    const ascendingSign = sortingFilter.order
      ? sortingFilter.order === "ascend"
        ? 1
        : -1
      : 1;
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

  logger.info(`Filter: ${query.filter}`);

  if (query.filter.replace(" ", "").slice(0, 5) !== "score") {
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

  const page = Number(query.page);
  const limit = Number(query.limit);

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

export const projectJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { select } = request.query as { select?: string };

  const schemaResult = validateSchema(projectionSchema, { select });

  const projectionParameters = select!.replace(" ", "").split(",");

  if (
    !schemaResult ||
    projectionParameters.filter((param) => {
      return justiceBoardValidFields.includes(param);
    }).length === 0
  ) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const projection = getJusticeBoardProjection(projectionParameters);

  const projectedJusticeBoard = await projectJusticeBoardByQuery(projection);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send(projectedJusticeBoard);
};

export const populateJusticeBoard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { populate } = request.query as { populate?: string };

  if (populate !== "_id") {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const justiceBoard = await populateJusticeBoardByQuery();

  return await reply.code(HttpStatus.StatusCodes.OK).send(justiceBoard);
};

const initializeJusticeBoardRouteHandler = () => {
  const justiceBoardGetRouteHandler: Map<string, Function> = new Map();

  justiceBoardGetRouteHandler.set(
    JSON.stringify(["filter"]),
    filterJusticeBoard
  );
  justiceBoardGetRouteHandler.set(
    JSON.stringify(["sort", "order"]),
    sortJusticeBoard
  );
  justiceBoardGetRouteHandler.set(
    JSON.stringify(["sort"]),
    sortJusticeBoard
  );
  justiceBoardGetRouteHandler.set(
    JSON.stringify(["page", "limit"]),
    paginateJusticeBoard
  );
  justiceBoardGetRouteHandler.set(
    JSON.stringify(["select"]),
    projectJusticeBoard
  );
  justiceBoardGetRouteHandler.set(
    JSON.stringify(["populate"]),
    populateJusticeBoard
  );

  return justiceBoardGetRouteHandler;
};

export const handleJusticeBoardRoute = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const justiceBoardRouteHandler = initializeJusticeBoardRouteHandler();

  const queryParams = Object.keys(request.query as Object);

  const func = justiceBoardRouteHandler.get(JSON.stringify(queryParams));

  return func
    ? await func(request, reply)
    : await getJusticeBoard(request, reply);
};
