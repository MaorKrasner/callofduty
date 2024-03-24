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
  findDuty,
  findManyDuties,
  insertDuty,
  updateDuty,
} from "../collections/duty.js";
import { validateSchema } from "../schemas/validator.js";

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
  const { location, constraints, ...filter } = request.query as {
    name?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    constraints?: string;
    soldiersRequired?: number;
    value?: number;
    minRank?: number;
    maxRank?: number;
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

  if (constraints) {
    constraintsAsStringArray = constraints.split(",");
  }

  if (location) {
    locationAsNumberArray = location
      .split(",")
      .map((coordinate) => parseFloat(coordinate));
  }

  const filteredDuties = await findManyDuties({
    ...filter,
    constraints: constraintsAsStringArray,
    location: locationAsNumberArray,
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
