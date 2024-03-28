import { FastifyRequest, FastifyReply } from "fastify";
import * as HttpStatus from "http-status-codes";

import {
  dutyPatchSchema,
  dutyPostSchema,
  dutyGetFilterSchema,
} from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import { type Soldier } from "../types/soldier.js";
import logger from "../logger.js";
import {
  addConstraintsToDuty,
  deleteDuty,
  findAllDuties,
  findDuty,
  findManyDuties,
  insertDuty,
  updateDuty,
} from "../collections/duty.js";
import { findAllSoldiers } from "../collections/soldier.js";
import { aggregateJusticeBoard } from "../collections/justice-board.js";
import { justiceBoardElement } from "../types/justice-board.js";
import { validateSchema } from "../schemas/validator.js";

const validateLimitations = (
  limitations: string[],
  dutyConstraints: string[]
) => {
  return (
    limitations.filter((limit) => dutyConstraints.includes(limit)).length === 0
  );
};

const validateRank = (
  soldierRank: number,
  minRank: number | null,
  maxRank: number | null
) => {
  if (!!minRank) {
    if (soldierRank < minRank) {
      return false;
    }
  }

  if (!!maxRank) {
    if (soldierRank > maxRank) {
      return false;
    }
  }

  return true;
};

const validateDates = (
  firstStartTime: number,
  firstEndTime: number,
  secondStartTime: number,
  secondEndTime: number
) => {
  return firstStartTime > secondEndTime || firstEndTime < secondStartTime;
};

const fixJusticeBoard = (
  justiceBoard: justiceBoardElement[],
  soldiers: Soldier[],
  duty: Duty
): justiceBoardElement[] => {
  justiceBoard = justiceBoard.filter((element) => {
    return soldiers.map((soldier) => soldier._id).includes(element._id);
  });

  justiceBoard = justiceBoard.sort((a, b) => {
    return a.score > b.score ? 1 : a.score < b.score ? -1 : 0;
  });

  if (soldiers.length > duty.soldiersRequired) {
    justiceBoard = justiceBoard.slice(0, duty.soldiersRequired);
  }

  return justiceBoard;
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

  let soldiers = await findAllSoldiers();

  const duties = await findAllDuties();

  const canParticipateArray: boolean[] = new Array<boolean>(
    soldiers.length
  ).fill(true);

  let i = 0;
  let j = 0;

  const constraints = duty.constraints;

  for (; i < soldiers.length; i++) {
    canParticipateArray[i] = validateLimitations(
      soldiers[i].limitations,
      constraints
    );

    if (canParticipateArray[i]) {
      canParticipateArray[i] = validateRank(
        soldiers[i].rank.value,
        duty.minRank,
        duty.maxRank
      );
    }

    if (canParticipateArray[i]) {
      for (; j < duties.length; j++) {
        if (duties[j]._id !== duty._id) {
          if (
            duties[j].soldiers.includes(soldiers[i]._id) &&
            duties[j].status === "scheduled"
          ) {
            canParticipateArray[i] = validateDates(
              new Date(duty.startTime).getTime(),
              new Date(duty.endTime).getTime(),
              new Date(duties[j].startTime).getTime(),
              new Date(duties[j].endTime).getTime()
            );
          }
        }
      }
    }
  }

  soldiers = soldiers.filter(
    (soldier) => canParticipateArray[soldiers.indexOf(soldier)]
  );

  let justiceBoard = await aggregateJusticeBoard();

  justiceBoard = fixJusticeBoard(justiceBoard, soldiers, duty);

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

  if (!newDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Couldn't schedule the duty" });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(newDuty);
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

  const status = duty.status;

  if (status === "canceled") {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Cannot cancel canceled duties." });
  }

  if (new Date(duty.startTime).getTime() < new Date().getTime()) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Cannot cancel the duty because it's in the past." });
  }

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

  if (!newDuty) {
    return await reply
      .code(HttpStatus.StatusCodes.CONFLICT)
      .send({ error: "Couldn't cancel the duty." });
  }

  return await reply.code(HttpStatus.StatusCodes.OK).send(newDuty);
};
