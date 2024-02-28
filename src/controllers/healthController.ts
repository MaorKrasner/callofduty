import { FastifyReply, FastifyRequest } from "fastify";

import logger from "../logger.js";
import { client } from "../db/connections.js";

export const healthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await reply.code(200).send({ status: "ok" });
    } catch (error: unknown) {
        const err = error as Error;
        logger.error(`Health check failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code health check : ${reply.statusCode}`);
    }
};

export const dbHealthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        if (client) {
            await reply.code(200).send({ status: "Connected to db"});
        } else {
            await reply.code(400).send({error: "Not connected to db"});
        }
    } catch (error: unknown) {
        const err = error as Error;
        logger.error(`DB Health check failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code health db check : ${reply.statusCode}`);
    }
}