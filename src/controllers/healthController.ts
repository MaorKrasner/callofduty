import { FastifyReply, FastifyRequest } from "fastify";

import logger from "../logger.js";

export const healthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await reply.code(200).send({ status: "ok" });
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: "Internal Server Error. Accessing route /health failed."});
        logger.error(`Health check failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code health check : ${reply.statusCode}`);
    }
};

export const dbHealthCheck = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await reply.code(200).send({ status: "ok"});
    } catch (error: unknown) {
        const err = error as Error;
        await reply.code(500).send({status: err, error: "Internal Server Error. Accessing route /health/db failed."});
        logger.error(`DB Health check failed. Error: ${err.message}`);
    } finally {
        logger.info(`Status code health db check : ${reply.statusCode}`);
    }
}