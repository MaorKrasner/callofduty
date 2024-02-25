import { FastifyRequest, FastifyReply } from "fastify";
import type { GeoJSON } from "geojson";
import { ObjectId } from "mongodb";

import { dutyPostSchema } from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";
import { deleteDuty, findDuty, findManyDuties, insertDuty } from "../db/dutyDBFunctions.js";

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