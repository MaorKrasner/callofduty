import { FastifyRequest, FastifyReply } from "fastify";

import logger from "../logger.js";
import {
  deleteSoldier,
  findManySoldiers,
  findSoldier,
  insertSoldier,
  updateSoldier,
} from "../db/soldierDBFunctions.js";
import { type Soldier } from "../types/soldier.js";
import {
  soldierPostSchema,
  soldierPatchSchema,
} from "../schemas/soldierSchemas.js";

const createSoldierDocument = (
  id: string,
  name: string,
  rank: {
    name: string;
    value: number;
  },
  limitations: string[]
): Soldier => {
  return {
    _id: id,
    name: name,
    rank: rank,
    limitations: limitations,
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
      .code(400)
      .send(`Soldier with id ${soldierData._id} already exists.`);
  }

  soldierPostSchema.parse(soldierData);

  const soldierToInsert = createSoldierDocument(
    soldierData._id,
    soldierData.name,
    soldierData.rank,
    soldierData.limitations.map((limitation) => limitation.toLowerCase())
  );

  const insertionResult = await insertSoldier(soldierToInsert);

  if (insertionResult.insertedId) {
    await reply.code(201).send(soldierToInsert);
  } else {
    await reply.code(400).send({ error: "Couldn't insert soldier" });
  }
};

export const getSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const soldier = await findSoldier(id);

  if (soldier) {
    await reply.code(200).send({ message: `Soldier found!`, data: soldier });
  } else {
    await reply.code(404).send({
      error: `Soldier not found. Check the length of the id you passed and the id itself.`,
    });
  }
};

export const getSoldiersByFilters = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { name, limitations, rankValue, rankName } = request.query as {
    name?: string;
    limitations?: string;
    rankValue?: number;
    rankName?: string;
  };

  let limitationsAsStringArray: string[] | undefined = undefined;

  if (limitations) {
    limitationsAsStringArray = limitations.split(",");
  }

  const filter = {
    name,
    limitations: limitationsAsStringArray,
    rankName,
    rankValue: parseInt(String(rankValue)),
  };

  const filteredSoldiers = await findManySoldiers(filter);

  await reply.code(200).send({ data: filteredSoldiers });
  logger.info(
    `Found soldiers with parameters. The soldiers are : \n${filteredSoldiers}`
  );
};

export const deleteSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  if (await findSoldier(id)) {
    const deleteResult = await deleteSoldier(id);

    if (deleteResult.deletedCount > 0) {
      await reply.code(204).send();
    } else {
      await reply.code(400).send({ error: `Error. The deletion has failed.` });
    }
  } else {
    await reply
      .code(404)
      .send({ error: `Soldier not found. There is no soldier with id ${id}` });
  }
};

export const updateSoldierById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };
  const updatedSoldierData = request.body as Partial<Soldier>;

  if (!(await findSoldier(id))) {
    return await reply
      .status(404)
      .send({ error: `Soldier not found. There is no soldier with id ${id}.` });
  }

  soldierPatchSchema.parse(updatedSoldierData);

  const firstUpdateResult = await updateSoldier(id, updatedSoldierData);
  const secondUpdateResult = await updateSoldier(id, { updatedAt: new Date() });

  if (
    firstUpdateResult.modifiedCount <= 0 &&
    secondUpdateResult.modifiedCount <= 0
  ) {
    return;
  }

  const newSoldier = await findSoldier(id);
  return await reply.status(200).send(newSoldier);
};
