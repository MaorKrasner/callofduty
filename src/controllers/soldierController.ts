import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import logger from "../logger.js";
import {
  deleteSoldier,
  findAllSoldiers,
  findManySoldiers,
  findSoldier,
  getSoldiersByQuery,
  insertSoldier,
  skipSoldiers,
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
  soldiersGetRouteSchema,
} from "../schemas/useableSchemas.js";
import { getSoldiersProjection } from "../logic/projectionLogic.js";

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

export const getQuerySoldiers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const dictionary = request.query as { [key: string]: string | number };
  const keys = Object.keys(dictionary);

  const query: Object[] = [];

  if (keys.includes("page")) {
    let page = dictionary["page"] as number;
    let limit = dictionary["limit"] as number;

    page = Math.trunc(page);
    limit = Math.trunc(limit);

    const startIndex = (page - 1) * limit;

    const soldiers = await skipSoldiers(startIndex, limit);

    const amountOfSoldiers = (await findAllSoldiers()).length;

    const totalPages = Math.ceil(amountOfSoldiers / limit);

    return [soldiers, `${page}/${totalPages}`];
  }

  keys.forEach((key) => {
    if (key === "sort") {
      let sortOrderAsNumber = 1;

      if (keys.includes("order")) {
        sortOrderAsNumber = dictionary["order"] === "ascend" ? 1 : -1;
      }

      const $sort = {} as Record<string, number>;
      $sort[dictionary[key]] = sortOrderAsNumber;
      query.push({ $sort });
    }

    if (key === "filter") {
      const filterPhrase = dictionary["filter"] as string;

      let [field, operator, valueStr] = filterPhrase
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      operator = mongoSignsParsingDictionary[operator];
      const value = +valueStr;

      query.push({ $match: { [field]: { [operator]: value } } });
    }

    if (key === "select") {
      const selectPhrase = dictionary["select"] as string;
      const projectionParameters = selectPhrase.replace(" ", "").split(",");

      const projection = getSoldiersProjection(projectionParameters);

      query.push({ $project: projection });
    }
  });

  const soldiers = await getSoldiersByQuery(query);

  return [soldiers, `0`];
};

export const handleGetQueryFilters = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const queryParams = request.query as Object;

  const validQueryParams = [
    "sort",
    "order",
    "filter",
    "page",
    "limit",
    "select",
  ];

  if (
    Object.keys(queryParams).every((param) => !validQueryParams.includes(param))
  ) {
    return await getSoldiersByFilters(request, reply);
  }

  const schemaResult = validateSchema(soldiersGetRouteSchema, queryParams);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const [soldiers, resultCode] = await getQuerySoldiers(request, reply);

  if (resultCode !== `0`) {
    return await reply
      .code(HttpStatus.StatusCodes.OK)
      .send({ page: resultCode, soldiers });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(soldiers);
};
