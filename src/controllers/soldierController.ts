import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import logger from "../logger.js";
import {
  deleteSoldier,
  filterSoldiers,
  findAllSoldiers,
  findManySoldiers,
  findSoldier,
  insertSoldier,
  skipSoldiers,
  soldiersProjection,
  sortSoldiersWithFilter,
  updateSoldier,
} from "../collections/soldier.js";
import { type Soldier } from "../types/soldier.js";
import {
  soldierPostSchema,
  soldierPatchSchema,
  soldierGetFilterSchema,
} from "../schemas/soldierSchemas.js";
import { validateSchema } from "../schemas/validator.js";
import {
  mongoSignsParsingDictionary,
  paginationSchema,
  projectionSchema,
  queryFilteringSchema,
  sortingSchema,
} from "../schemas/useableSchemas.js";
import {
  getSoldiersProjection,
  soldierValidFields,
} from "../logic/projectionLogic.js";

export const createSoldierDocument = (soldier: Partial<Soldier>): Soldier => {
  return {
    _id: soldier._id!,
    name: soldier.name!,
    rank: soldier.rank!,
    limitations: soldier.limitations!,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createSoldier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const soldierData = request.body as Soldier;

  const soldier = await findSoldier(soldierData._id);

  if (soldier) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send(`Soldier with id ${soldierData._id} already exists.`);
  }

  const schemaResult = validateSchema(soldierPostSchema, soldierData);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  soldierData.limitations = soldierData.limitations.map((limitation) =>
    limitation.toLowerCase()
  );

  const soldierToInsert = createSoldierDocument(soldierData);

  const insertionResult = await insertSoldier(soldierToInsert);

  if (insertionResult.insertedId) {
    await reply.code(HttpStatus.StatusCodes.CREATED).send(soldierToInsert);
  } else {
    await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: "Couldn't insert soldier" });
  }
};

export const getSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const soldier = await findSoldier(id);

  if (soldier) {
    await reply
      .code(HttpStatus.StatusCodes.OK)
      .send({ message: `Soldier found!`, data: soldier });
  } else {
    await reply.code(HttpStatus.StatusCodes.NOT_FOUND).send({
      error: `Soldier not found. Check the length of the id you passed and the id itself.`,
    });
  }
};

export const getSoldiersByFilters = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { limitations, rankValue, ...filter } = request.query as {
    name?: string;
    limitations?: string;
    rankValue?: number;
    rankName?: string;
  };

  const schemaResult = validateSchema(soldierGetFilterSchema, {
    limitations,
    rankValue,
    ...filter,
  });

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  let limitationsAsStringArray: string[] | undefined = undefined;

  if (limitations) {
    limitationsAsStringArray = limitations.split(",");
  }

  const filteredSoldiers = await findManySoldiers({
    ...filter,
    limitations: limitationsAsStringArray,
    rankValue: parseInt(String(rankValue)),
  });

  await reply.code(HttpStatus.StatusCodes.OK).send({ data: filteredSoldiers });
  logger.info(
    `Found soldiers with parameters. The soldiers are : \n${filteredSoldiers}`
  );
};

export const deleteSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  if (!(await findSoldier(id))) {
    return await reply
      .code(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Soldier not found. There is no soldier with id ${id}` });
  }

  const deleteResult = await deleteSoldier(id);

  if (deleteResult.deletedCount <= 0) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Error. The deletion has failed.` });
  }

  return await reply.code(HttpStatus.StatusCodes.NO_CONTENT).send();
};

export const updateSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const updatedSoldierData = request.body as Partial<Soldier>;

  if (!(await findSoldier(id))) {
    return await reply
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Soldier not found. There is no soldier with id ${id}.` });
  }

  const schemaResult = validateSchema(soldierPatchSchema, updatedSoldierData);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const newSoldier = await updateSoldier(id, updatedSoldierData);

  if (!newSoldier) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send("Something wrong happened during the update.");
  }

  return await reply.status(HttpStatus.StatusCodes.OK).send(newSoldier);
};

export const sortSoldiers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const validSortFilters = [
    "_id",
    "name",
    "rank.value",
    "createdAt",
    "updatedAt",
  ];

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

  const sortedSoldiers = await sortSoldiersWithFilter(
    sortingFilter.sort!,
    sortingFilter.order ? sortingFilter.order : "ascend"
  );

  return await reply.code(HttpStatus.StatusCodes.OK).send(sortedSoldiers);
};

export const filterSoldiersByQueries = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...query } = request.query as {
    filter: string;
  };

  let [field, operator, valueStr] = query.filter
    .replace(" ", "")
    .split(/(>=|<=|<|>|=)/);

  const schemaResult = validateSchema(queryFilteringSchema, query);

  const validFilters = ["rank.value"];

  if (!schemaResult || !validFilters.includes(field) || isNaN(+valueStr)) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  operator = mongoSignsParsingDictionary[operator];

  const filteredSoldiers = await filterSoldiers(
    field,
    operator,
    Number(valueStr)
  );

  return await reply.code(HttpStatus.StatusCodes.OK).send(filteredSoldiers);
};

export const paginateSoldiers = async (
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

  const soldiers = await skipSoldiers(startIndex, limit);

  const amountOfSoldiers = (await findAllSoldiers()).length;

  const totalPages = Math.ceil(amountOfSoldiers / limit);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ page: page, totalPages: totalPages, soldiers });
};

export const projectSoldiers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { select } = request.query as { select?: string };

  const schemaResult = validateSchema(projectionSchema, { select });

  const projectionParameters = select!.replace(" ", "").split(",");

  if (
    !schemaResult ||
    projectionParameters.filter((param) => soldierValidFields.includes(param))
      .length === 0
  ) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const projection = getSoldiersProjection(projectionParameters);

  const soldiersAfterProjection = await soldiersProjection(projection);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send(soldiersAfterProjection);
};

export const initializeSoldierRouteHandler = () => {
  const soldierGetRouteHandler: Map<string, Function> = new Map();

  soldierGetRouteHandler.set(
    JSON.stringify(["filter"]),
    filterSoldiersByQueries
  );
  soldierGetRouteHandler.set(JSON.stringify(["sort", "order"]), sortSoldiers);
  soldierGetRouteHandler.set(JSON.stringify(["sort"]), sortSoldiers);
  soldierGetRouteHandler.set(
    JSON.stringify(["page", "limit"]),
    paginateSoldiers
  );
  soldierGetRouteHandler.set(JSON.stringify(["select"]), projectSoldiers);

  return soldierGetRouteHandler;
};

export const handleGetFilterFunctions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const soldierRoutesHandler = initializeSoldierRouteHandler();

  const queryParams = Object.keys(request.query as Object);

  const func = soldierRoutesHandler.get(JSON.stringify(queryParams));

  return func
    ? await func(request, reply)
    : await getSoldiersByFilters(request, reply);
};
