import { FastifyRequest, FastifyReply } from "fastify";
import type { GeoJSON } from "geojson";

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
} from "../db/dutyDBFunctions.js";

const createDutyDocument = (
  name: string,
  description: string,
  location: GeoJSON,
  startTime: Date,
  endTime: Date,
  minRank: number,
  maxRank: number,
  constraints: string[],
  soldiersRequired: number,
  value: number
): Duty => {
  return {
    name: name,
    description: description,
    location: location,
    startTime: startTime,
    endTime: endTime,
    minRank: minRank,
    maxRank: maxRank,
    constraints: constraints,
    soldiersRequired: soldiersRequired,
    value: value,
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
  const dutyData = request.body as Duty;

  dutyPostSchema.parse(dutyData);

  const duty = createDutyDocument(
    dutyData.name,
    dutyData.description,
    dutyData.location,
    dutyData.startTime,
    dutyData.endTime,
    dutyData.minRank,
    dutyData.maxRank,
    dutyData.constraints,
    dutyData.soldiersRequired,
    dutyData.value
  );

  const insertionResult = await insertDuty(duty);

  if (insertionResult.insertedId) {
    await reply.code(201).send(duty);
  } else {
    await reply.code(400).send({ error: `Couldn't insert duty.` });
  }
};

export const getDutiesByFilters = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const {
    name,
    location,
    startTime,
    endTime,
    constraints,
    soldiersRequired,
    value,
    minRank,
    maxRank,
  } = request.query as {
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

  const filter = {
    name,
    location: locationAsNumberArray,
    startTime,
    endTime,
    constraints: constraintsAsStringArray,
    soldiersRequired,
    value,
    minRank,
    maxRank,
  };

  const filteredDuties = await findManyDuties(filter);

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
      await reply.code(400).send({ error: "Cannot delete scheduled duties." });
    } else {
      const deletionResult = await deleteDuty(id);
      if (deletionResult.deletedCount > 0) {
        await reply.code(204).send({ message: "Duty deleted." });
        logger.info(`Duty with id ${id} delete successfully.`);
      } else {
        await reply.code(400).send({ error: "The deletion has failed." });
      }
    }
  } else {
    await reply.code(404).send({
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
      .code(400)
      .send({ error: `Can't update duties that are scheduled.` });
  }

  dutyPatchSchema.parse(updatedDutyData);

  const firstUpdateResult = await updateDuty(id, updatedDutyData);
  const secondUpdateResult = await updateDuty(id, { updatedAt: new Date() });

  if (
    firstUpdateResult.modifiedCount <= 0 &&
    secondUpdateResult.modifiedCount <= 0
  ) {
    return await reply.code(400).send({ error: "Couldn't update the duty." });
  }

  const newDuty = await findDuty(id);
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

  const firstUpdateResult = await updateDuty(id, updateDutyData);
  const secondUpdateResult = await updateDuty(id, { updatedAt: new Date() });

  if (
    firstUpdateResult.modifiedCount <= 0 &&
    secondUpdateResult.modifiedCount <= 0
  ) {
    return;
  }

  const newDuty = await findDuty(id);
  return await reply.code(200).send(newDuty);
};
