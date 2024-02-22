import { FastifyRequest, FastifyReply } from "fastify";
import { ObjectId } from "mongodb";

import logger from "../logger.js";
import { rankValueNameDictionary, type Soldier } from "../types/soldier.js";
import { soldierPostSchema, soldierPatchSchema } from "../schemas/soldierSchemas.js";
import { deleteSoldier, findManySoldiers, findSoldier, insertSoldier, isSoldierExists, updateSoldier } from "../db/usefulDBFunctions.js";

export const createSoldier = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const soldierData = request.body as Soldier;

        const exists = await isSoldierExists(soldierData._id);

        logger.info(`Exists ? ${exists}`);

        if (exists) {
            return await reply.code(400).send(`Soldier with id ${soldierData._id} already exists.`);
        }

        const validateData = soldierPostSchema.parse(soldierData);

        if (!validateData) {
            return;
        }

        const soldier: Soldier = {
            _id: soldierData._id,
            name: soldierData.name,
            rank: soldierData.rank,
            limitations: soldierData.limitations.map(limitation => limitation.toLowerCase()),
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const insertionResult = await insertSoldier(soldier);

        if (insertionResult.insertedId) {
            await reply.code(201).send(soldier);
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: "Internal Server Error. Accessing route /soldiers (creating soldier) failed."});
        logger.error(`Creating a new soldier has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for creating a new soldier : ${reply.statusCode}`);
    }
};

export const getSoldierById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const soldier = await findSoldier(id);

        if (soldier) {
            await reply.code(200).send({message: `Soldier found!`, data: soldier});
        } else {
            await reply.code(404).send({error : `Soldier not found. Check the length of the id you passed and the id itself.`});
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /soldiers/${id} (finding) failed.`});
        logger.error(`Finding soldier by id has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for soldier with the id ${id} is ${reply.statusCode}`);
    }
};

export const getSoldiersByFilters = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { name, limitations, rankValue, rankName } = request.query as {
            name?: string;
            limitations?: string;
            rankValue?: number;
            rankName?: string;
        };

        let limitationsAsStringArray: string[] | undefined = undefined;
        
        if (limitations) {
            limitationsAsStringArray = limitations.split(',');
        }

        const filteredSoldiers = await findManySoldiers(name, limitationsAsStringArray, rankName, rankValue);

        await reply.code(200).send({data: filteredSoldiers});
        logger.info(`Found soldiers with parameters. The soldiers are : \n${filteredSoldiers}`);
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /soldiers via filters failed.`});
        logger.error(`Finding soldiers via filters in route /soldiers failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for searching soldiers via filters is ${reply.statusCode}`);
    }
};

export const deleteSoldierById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const soldier = await findSoldier(id);

        if (soldier) {
            const deleteResult = await deleteSoldier(id);

            if (deleteResult.deletedCount > 0) {
                await reply.code(204).send();
            } else {
                await reply.code(400).send({error: `Error. The deletion has failed.`});
            }
        } else {
            await reply.code(404).send({error: `Soldier not found. There is no soldier with id ${id}`});
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /soldiers/${id} (deleting) failed.`});
        logger.error(`Deleting soldier with id ${id} failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for deleting soldier with id ${id} is ${reply.statusCode}`);
    }
}

export const updateSoldierById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const updatedSoldierData = request.body as Partial<Soldier>;

        if (!await isSoldierExists(id)) {
            return await reply.status(404).send({ error: `Soldier not found. There is no soldier with id ${id}.` });
        }

        const validateData = soldierPatchSchema.parse(updatedSoldierData);

        if (!validateData) {
            return;
        }

        const firstUpdateResult = await updateSoldier(id, updatedSoldierData);
        const secondUpdateResult = await updateSoldier(id, {updatedAt: new Date()});

        if (firstUpdateResult.modifiedCount <= 0 && secondUpdateResult.modifiedCount <= 0) {
            return;
        }

        const newSoldier = await findSoldier(id);
        return await reply.status(200).send(newSoldier);
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accesing route /soldiers/${id} (patching) failed.`});
        logger.info(`Patching soldier with id ${id} has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for patching soldier with id ${id} is ${reply.statusCode}`);
    }
};