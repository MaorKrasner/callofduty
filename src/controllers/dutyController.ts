import { FastifyRequest, FastifyReply } from "fastify";
import type { GeoJSON } from "geojson";
import { ObjectId } from "mongodb";

import { dutyPatchSchema, dutyPostSchema, dutyPutSchema } from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";
import { deleteDuty, findDuty, findManyDuties, insertDuty, updateDuty } from "../db/dutyDBFunctions.js";

export const createDuty = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const dutyData = request.body as Duty;

        const validateData = dutyPostSchema.parse(dutyData);
    
        if (!validateData) {
            return;
        }

        const duty: Duty = {
            name: dutyData.name,
            description: dutyData.description,
            location: dutyData.location,
            startTime: dutyData.startTime,
            endTime: dutyData.endTime,
            minRank: dutyData.minRank,
            maxRank: dutyData.maxRank,
            constraints: dutyData.constraints,
            soldiersRequired: dutyData.soldiersRequired,
            value: dutyData.value,
            soldiers: [],
            status: "unscheduled",
            statusHistory: [{
                status: "unscheduled",
                date: new Date()
            }],
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const insertionResult = await insertDuty(duty);

        if (insertionResult.insertedId) {
            await reply.code(201).send(duty);
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: "Internal Server Error. Accessing route /duties (creating duty) failed."});
        logger.error(`Creating a new duty has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for creating a new duty is ${reply.statusCode}`);
    }
};

export const getDutiesByFilters = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const {
            name,
            location,
            startTime,
            endTime,
            constraints,
            soldiersRequired,
            value,
            minRank,
            maxRank
        } = request.query as {
            name?: string,
            location?: string,
            startTime?: Date,
            endTime?: Date,
            constraints?: string,
            soldiersRequired?: number,
            value?: number,
            minRank?: number,
            maxRank?: number
        }

        let constraintsAsStringArray: string[] | undefined = undefined;
        let locationAsNumberArray: number[] | undefined = undefined;

        if (constraints) {
            constraintsAsStringArray = constraints.split(',');
        }

        if (location) {
            locationAsNumberArray = location.split(',').map((coordinate) => parseFloat(coordinate));
        }

        const filteredDuties = await findManyDuties(
            name,
            locationAsNumberArray,
            startTime,
            endTime,
            constraintsAsStringArray,
            soldiersRequired,
            value,
            minRank,
            maxRank
        );

        await reply.code(200).send({data: filteredDuties});
        logger.info(`Found duties with parameters. The duties are \n${filteredDuties}`);
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: "Internal Server Error. Accessing route /duties via filters failed."});
        logger.error(`Creating a new duty has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for searching duties via filters is ${reply.statusCode}`);
    }
};

export const getDutyById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const duty = await findDuty(id);

        if (duty) {
            await reply.code(200).send({message: "Duty Found!", data: duty});
        } else {
            await reply.code(404).send({error : `Duty not found. Check the length of the id you passed and the id itself.`});
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /duties/${id} (search duty by id) failed.`});
        logger.error(`Searching duty by id has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for searching duty with id ${id} is ${reply.statusCode}`);
    }
};

export const deleteDutyById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const duty = await findDuty(id);
        
        if (duty) {
            if (duty.status === "scheduled") {
                await reply.code(400).send({error: "Cannot delete scheduled duties."});
            } else {
                const deletionResult = await deleteDuty(id);
                if (deletionResult.deletedCount > 0) {
                    await reply.code(204).send({message: "Duty deleted."});
                    logger.info(`Duty with id ${id} delete successfully.`);
                } else {
                    await reply.code(400).send({error: "The deletion has failed."});
                }
            }
        } else {
            await reply.code(404).send({error : "Duty not found. Check the length of the id you passed and the id itself."});
        }
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /duties/${id} (delete duty by id) failed.`});
        logger.error(`Deleting duty by id has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for deleting duty with id ${id} is ${reply.statusCode}`);
    }
};

export const updateDutyById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
        const updatedDutyData = request.body as Partial<Duty>;

        const duty = await findDuty(id);

        if (!duty) {
            return await reply.status(404).send({ error: `Duty not found. There is no duty with id ${id}.` });
        }

        if (duty.status === "scheduled") {
            return await reply.code(400).send({ error: `Can't update duties that are scheduled.`});
        }

        const validateData = dutyPatchSchema.parse(updatedDutyData);

        if (!validateData) {
            return;
        }

        const firstUpdateResult = await updateDuty(id, updatedDutyData);
        const secondUpdateResult = await updateDuty(id, {updatedAt: new Date()});

        if (firstUpdateResult.modifiedCount <= 0 && secondUpdateResult.modifiedCount <= 0) {
            return;
        }

        const newDuty = await findDuty(id);
        return await reply.code(200).send(newDuty);
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: `Internal Server Error. Accessing route /duties/${id} (update duty by id) failed.`});
        logger.error(`Updating duty by id has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for updating duty with id ${id} is ${reply.statusCode}`);
    }
};

export const putConstraintsById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { constraints } = request.body as { constraints: string[] };

    try {
        const duty = await findDuty(id);

        if (!duty) {
            return await reply.code(404).send({error: "Duty not found."});
        }

        const validateData = dutyPutSchema.parse({constraints});

        if (!validateData) {
            return;
        }

        const unDuplicatedConstraints = constraints.filter((constraint) => !duty.constraints.includes(constraint));

        const updateDutyData = {} as Partial<Duty>;

        updateDutyData.constraints = unDuplicatedConstraints.concat(duty.constraints);

        const firstUpdateResult = await updateDuty(id, updateDutyData);
        const secondUpdateResult = await updateDuty(id, {updatedAt: new Date()});

        if (firstUpdateResult.modifiedCount <= 0 && secondUpdateResult.modifiedCount <= 0) {
            return;
        }

        const newDuty = await findDuty(id);
        return await reply.code(200).send(newDuty);
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err,
             error: `Internal Server Error. Accessing route /duties/${id}/constraints (put constraints by id) failed.`});
        logger.error(`Put constraints into duty by id has failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code for adding constraints to a duty with id ${id} is ${reply.statusCode}`);
    }
};