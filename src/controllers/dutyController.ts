import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import {
  dutyPatchSchema,
  dutyPostSchema,
  dutyGetFilterSchema,
} from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";
import {
  addConstraintsToDuty,
  deleteDuty,
  dutiesProjection,
  filterDuties,
  findAllDuties,
  findDuty,
  findManyDuties,
  findNearDutiesByQuery,
  getDutiesByQuery,
  insertDuty,
  populateDutiesByQuery,
  skipDuties,
  sortDutiesWithFilter,
  updateDuty,
} from "../collections/duty.js";
import { validateSchema } from "../schemas/validator.js";
import { calculateJusticeBoardWithSchedulingLogic } from "../logic/schedulingLogic.js";
import {
  dutiesGetRouteSchema,
  mongoSignsParsingDictionary,
  nearDutiesSchema,
} from "../schemas/useableSchemas.js";
import { getDutiesProjection } from "../logic/projectionLogic.js";

export const schedule = async (id: string, duty: Duty) => {
  const justiceBoard = await calculateJusticeBoardWithSchedulingLogic(duty);

  const statusHistory = duty.statusHistory;

  statusHistory.push({
    status: "scheduled",
    date: new Date(),
  });

  const dataToUpdate: Partial<Duty> = {
    status: "scheduled",
    statusHistory: statusHistory,
    soldiers: justiceBoard.map((element) => element._id),
  };

  const newDuty = await updateDuty(id, dataToUpdate);

  return newDuty;
};

export const cancel = async (id: string, duty: Duty) => {
  const statusHistory = duty.statusHistory;

  statusHistory.push({
    status: "canceled",
    date: new Date(),
  });

  const dataToUpdate: Partial<Duty> = {
    status: "canceled",
    statusHistory: statusHistory,
    soldiers: [],
  };

  const newDuty = await updateDuty(id, dataToUpdate);

  return newDuty;
};

export const createDutyDocument = (duty: Partial<Duty>): Duty => {
  return {
    name: duty.name!,
    description: duty.description!,
    location: duty.location!,
    startTime: duty.startTime!,
    endTime: duty.endTime!,
    minRank: duty.minRank!,
    maxRank: duty.maxRank!,
    constraints: duty.constraints!,
    soldiersRequired: duty.soldiersRequired!,
    value: duty.value!,
    soldiers: [],
    status: "unscheduled",
    statusHistory: [
      {
        status: "unscheduled",
        date: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createDuty = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const dutyData = request.body as Partial<Duty>;

  const schemaResult = validateSchema(dutyPostSchema, dutyData);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const duty = createDutyDocument(dutyData);

  const insertionResult = await insertDuty(duty);

  if (!insertionResult.insertedId) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: `Couldn't insert duty.` });
  }

  return await reply.code(HttpStatus.StatusCodes.CREATED).send(duty);
};

export const getDutiesByFilters = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { location, constraints, soldiers, ...filter } = request.query as {
    name?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    constraints?: string;
    soldiersRequired?: number;
    value?: number;
    minRank?: number;
    maxRank?: number;
    description?: string;
    status?: string;
    soldiers?: string;
  };

  const schemaResult = validateSchema(dutyGetFilterSchema, {
    location,
    constraints,
    ...filter,
  });

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  let constraintsAsStringArray: string[] | undefined = undefined;
  let locationAsNumberArray: number[] | undefined = undefined;
  let soldiersAsStringArray: string[] | undefined = undefined;

  if (constraints) {
    constraintsAsStringArray = constraints.split(",");
  }

  if (location) {
    locationAsNumberArray = location
      .split(",")
      .map((coordinate) => parseFloat(coordinate));
  }

  if (soldiers) {
    soldiersAsStringArray = soldiers.split(",");
  }

  const filteredDuties = await findManyDuties({
    ...filter,
    constraints: constraintsAsStringArray,
    location: locationAsNumberArray,
    soldiers: soldiersAsStringArray,
  });

  await reply.code(HttpStatus.StatusCodes.OK).send({ data: filteredDuties });
  logger.info(
    `Found duties with parameters. The duties are \n${filteredDuties}`
  );
};

export const getDutyById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const duty = await findDuty(id);

  if (!duty) {
    return await reply.code(HttpStatus.StatusCodes.NOT_FOUND).send({
      error: `Duty not found. Check the length of the id you passed and the id itself.`,
    });
  }

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ message: "Duty Found!", data: duty });
};

export const deleteDutyById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const duty = await findDuty(id);

  if (duty) {
    if (duty.status === "scheduled") {
      return await reply
        .code(HttpStatus.StatusCodes.CONFLICT)
        .send({ error: "Cannot delete scheduled duties." });
    }
    const deletionResult = await deleteDuty(id);
    if (deletionResult.deletedCount > 0) {
      return await reply
        .code(HttpStatus.StatusCodes.NO_CONTENT)
        .send({ message: "Duty deleted." });
    }
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "The deletion has failed." });
  } else {
    return await reply.code(HttpStatus.StatusCodes.NOT_FOUND).send({
      error:
        "Duty not found. Check the length of the id you passed and the id itself.",
    });
  }
};

export const updateDutyById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const updatedDutyData = request.body as Partial<Duty>;

  const duty = await findDuty(id);

  if (!duty) {
    return await reply
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Duty not found. There is no duty with id ${id}.` });
  }

  if (duty.status === "scheduled") {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: `Can't update duties that are scheduled.` });
  }

  const schemaResult = validateSchema(dutyPatchSchema, updatedDutyData);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const newDuty = await updateDuty(id, updatedDutyData);

  if (!newDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Couldn't update the duty." });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(newDuty);
};

export const putConstraintsById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const { constraints } = request.body as { constraints: string[] };

  if (!(await findDuty(id))) {
    return await reply
      .code(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: "Duty not found." });
  }

  const newDuty = await addConstraintsToDuty(id, constraints);

  if (!newDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Something went wrong." });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(newDuty);
};

export const putScheduleById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  const duty = await findDuty(id);

  if (!duty) {
    return await reply
      .code(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Cannot find Duty with id ${id}.` });
  }

  const status = duty.status;

  if (status === "scheduled" || status === "canceled") {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: `Duty cannot be scheduled because it is ${status}` });
  }

  if (new Date(duty.startTime).getTime() < new Date().getTime()) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Cannot schedule the duty because it's in the past." });
  }

  const scheduledDuty = await schedule(id, duty);

  if (!scheduledDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Couldn't schedule the duty" });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(scheduledDuty);
};

export const putCancelById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  const duty = await findDuty(id);

  if (!duty) {
    return await reply
      .code(HttpStatus.StatusCodes.NOT_FOUND)
      .send({ error: `Cannot find Duty with id ${id}.` });
  }

  if (duty.status === "canceled") {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Cannot cancel canceled duties." });
  }

  if (new Date(duty.startTime).getTime() < new Date().getTime()) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Cannot cancel the duty because it's in the past." });
  }

  const cancelledDuty = await cancel(id, duty);

  if (!cancelledDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Couldn't cancel the duty." });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(cancelledDuty);
};

export const sortDuties = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...sortingFilter } = request.query as {
    sort?: string;
    order?: string;
  };

  const sortedDuties = await sortDutiesWithFilter(
    sortingFilter.sort!,
    sortingFilter.order ? sortingFilter.order : "ascend"
  );

  return await reply.code(HttpStatus.StatusCodes.OK).send(sortedDuties);
};

export const filterDutiesByQueries = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...query } = request.query as {
    filter: string;
  };

  let [field, operator, valueStr] = query.filter
    .replace(" ", "")
    .split(/(>=|<=|<|>|=)/);

  operator = mongoSignsParsingDictionary[operator];

  const filteredDuties = await filterDuties(field, operator, Number(valueStr));

  return await reply.code(HttpStatus.StatusCodes.OK).send(filteredDuties);
};

export const paginateDuties = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { ...query } = request.query as {
    page?: string;
    limit?: string;
  };

  const page = Number(query.page);
  const limit = Number(query.limit);

  const startIndex = (page - 1) * limit;

  const duties = await skipDuties(startIndex, limit);

  const amountOfDuties = (await findAllDuties()).length;

  const totalPages = Math.ceil(amountOfDuties / limit);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ page: page, totalPages: totalPages, duties });
};

export const projectDuties = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { select } = request.query as { select?: string };

  const projectionParameters = select!.replace(" ", "").split(",");

  const projection = getDutiesProjection(projectionParameters);

  const dutiesAfterProjection = await dutiesProjection(projection);

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send(dutiesAfterProjection);
};

export const findNearDuties = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { near, radius } = request.query as { near?: string; radius?: string };

  const coordinates = near!
    .replace(" ", "")
    .split(",")
    .map((element) => Number(element));
  const radiusAsNumber = Number(radius);

  const schemaResult = validateSchema(nearDutiesSchema, {
    coordinates,
    radiusAsNumber,
  });

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const nearDuties = await findNearDutiesByQuery(coordinates, radiusAsNumber);

  return await reply.code(HttpStatus.StatusCodes.OK).send(nearDuties);
};

export const populateDuties = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { populate } = request.query as { populate?: string };

  if (populate !== "soldiers") {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema` });
  }

  const duties = await populateDutiesByQuery();

  return await reply.code(HttpStatus.StatusCodes.OK).send(duties);
};

export const initializeDutyRouteHandler = () => {
  const dutyGetRouteHandler: Map<string, Function> = new Map();

  dutyGetRouteHandler.set(JSON.stringify(["filter"]), filterDutiesByQueries);
  dutyGetRouteHandler.set(JSON.stringify(["sort"]), sortDuties);
  dutyGetRouteHandler.set(JSON.stringify(["sort", "order"]), sortDuties);
  dutyGetRouteHandler.set(JSON.stringify(["page", "limit"]), paginateDuties);
  dutyGetRouteHandler.set(JSON.stringify(["select"]), projectDuties);
  dutyGetRouteHandler.set(JSON.stringify(["near", "radius"]), findNearDuties);
  dutyGetRouteHandler.set(JSON.stringify(["populate"]), populateDuties);

  return dutyGetRouteHandler;
};

export const handleGetFilterFunctions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const dutyRoutesHandler = initializeDutyRouteHandler();

  const queryParams = Object.keys(request.query as Object);

  const func = dutyRoutesHandler.get(JSON.stringify(queryParams));

  return func
    ? await func(request, reply)
    : await getDutiesByFilters(request, reply);
};

export const getQueryDuties = async (
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

    const duties = await skipDuties(startIndex, limit);

    const amountOfSoldiers = (await findAllDuties()).length;

    const totalPages = Math.ceil(amountOfSoldiers / limit);

    return [duties, `${page}/${totalPages}`];
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

    if (key === "populate") {
      query.push({
        $lookup: {
          from: "soldiers",
          localField: "soldiers",
          foreignField: "_id",
          as: "soldiers",
        },
      });
    }

    if (key === "near") {
      const coordinates = (dictionary["near"] as string)
        .replace(" ", "")
        .split(",");
      const radius = parseFloat(dictionary["radius"] as string);

      query.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [
              parseFloat(coordinates[0]),
              parseFloat(coordinates[1]),
            ],
          },
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
        },
      });
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

      const projection = getDutiesProjection(projectionParameters);

      query.push({ $project: projection });
    }
  });

  const duties = await getDutiesByQuery(query);

  return [duties, `0`];
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
    "populate",
    "near",
    "radius",
  ];

  if (
    Object.keys(queryParams).every((param) => !validQueryParams.includes(param))
  ) {
    return await getDutiesByFilters(request, reply);
  }

  const schemaResult = validateSchema(dutiesGetRouteSchema, queryParams);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  const [duties, resultCode] = await getQueryDuties(request, reply);

  if (resultCode !== `0`) {
    return await reply
      .code(HttpStatus.StatusCodes.OK)
      .send({ page: resultCode, duties });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(duties);
};
