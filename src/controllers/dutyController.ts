import { FastifyRequest, FastifyReply } from "fastify";
import { ObjectId } from "mongodb";

import { dutyPostSchema } from "../schemas/dutySchemas.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";
import { insertDuty, isDutyExists } from "../db/dutyDBFunctions.js";

export const createDuty = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const dutyData = request.body as Duty;

        const validateData = dutyPostSchema.parse(dutyData);
    
        if (!validateData) {
            return;
        }

        const objId = new ObjectId();

        if (await isDutyExists(objId)) {
            return;
        }

        const duty: Duty = {
            _id: objId,
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