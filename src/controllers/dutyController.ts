import { FastifyRequest, FastifyReply } from "fastify";

import {
  dutyPatchSchema,
  dutyPostSchema,
  dutyPutSchema,
} from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";
import {
  deleteDuty,
  findDuty,
  findManyDuties,
  insertDuty,
  updateDuty,
} from "../collections/duty.js";

const createDutyDocument = (duty: Partial<Duty>): Duty => {
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

  dutyPostSchema.parse(dutyData);

  const duty = createDutyDocument(dutyData);

  const insertionResult = await insertDuty(duty);

  if (!insertionResult.insertedId) {
    return await reply.code(409).send({ error: `Couldn't insert duty.` });
  }

  return await reply.code(201).send(duty);
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

  await reply.code(200).send({ data: filteredDuties });
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

  if (duty) {
    await reply.code(200).send({ message: "Duty Found!", data: duty });
  } else {
    await reply.code(404).send({
      error: `Duty not found. Check the length of the id you passed and the id itself.`,
    });
  }
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
        .code(409)
        .send({ error: "Cannot delete scheduled duties." });
    }
    const deletionResult = await deleteDuty(id);
    if (deletionResult.deletedCount > 0) {
      return await reply.code(204).send({ message: "Duty deleted." });
    }
    return await reply.code(409).send({ error: "The deletion has failed." });
  } else {
    return await reply.code(404).send({
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
      .status(404)
      .send({ error: `Duty not found. There is no duty with id ${id}.` });
  }

  if (duty.status === "scheduled") {
    return await reply
      .code(409)
      .send({ error: `Can't update duties that are scheduled.` });
  }

  dutyPatchSchema.parse(updatedDutyData);

  updatedDutyData.updatedAt = new Date();

  const newDuty = await updateDuty(id, updatedDutyData);

  if (!newDuty) {
    return await reply.code(409).send({ error: "Couldn't update the duty." });
  }

  return await reply.code(200).send(newDuty);
};

export const putConstraintsById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const { constraints } = request.body as { constraints: string[] };

  const duty = await findDuty(id);

  if (!duty) {
    return await reply.code(404).send({ error: "Duty not found." });
  }

  dutyPutSchema.parse({ constraints });

  const unDuplicatedConstraints = constraints.filter(
    (constraint) => !duty.constraints.includes(constraint)
  );

  const updateDutyData = {} as Partial<Duty>;

  updateDutyData.constraints = unDuplicatedConstraints.concat(duty.constraints);
  updateDutyData.updatedAt = new Date();

  const newDuty = await updateDuty(id, updateDutyData);

  if (!newDuty) {
    return await reply
      .code(409)
      .send({ error: "Something wrong happened during the update." });
  }

  return await reply.code(200).send(newDuty);
};
