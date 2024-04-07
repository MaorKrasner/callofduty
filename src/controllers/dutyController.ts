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
  filterDuties,
  findDuty,
  findManyDuties,
  insertDuty,
  sortDutiesWithFilter,
  updateDuty,
} from "../collections/duty.js";
import { validateSchema } from "../schemas/validator.js";
import { calculateJusticeBoardWithSchedulingLogic } from "../logic/schedulingLogic.js";
import {
  mongoSignsParsingDictionary,
  queryFilteringSchema,
  sortingSchema,
} from "../schemas/useableSchemas.js";
import { object } from "zod";

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
  const validSortFilters = [
    "_id",
    "name",
    "description",
    "location",
    "startTime",
    "endTime",
    "minRank",
    "maxRank",
    "soldiersRequired",
    "value",
    "createdAt",
    "updatedAt",
  ];

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

  const sortedDuties = await sortDutiesWithFilter(
    sortingFilter.sort,
    sortingFilter.order
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

  const schemaResult = validateSchema(queryFilteringSchema, query);

  if (!schemaResult) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: `Failed to pass schema.` });
  }

  let [field, operator, valueStr] = query.filter.split(/(>=|<=|<|>|=)/);

  operator = mongoSignsParsingDictionary[operator];

  const filteredDuties = await filterDuties(field, operator, Number(valueStr));

  return await reply.code(HttpStatus.StatusCodes.OK).send(filteredDuties);
};

export const handleGetFilterFunctions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { filter } = request.query as { filter?: string };
  const { sort, order } = request.query as { sort?: string; order?: string };

  return filter
    ? await filterDutiesByQueries(request, reply)
    : sort && order
    ? await sortDuties(request, reply)
    : await getDutiesByFilters(request, reply);
};
