import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import config from "./config";
import logger from "./logger"

/*
IMPORTANT!!!
THIS PIECE OF CODE LED TO AN ERROR WHILE RUNNING THE TESTS.

THE ERROR :

TypeError: createServer is not a function
 ❯ mainfunc src/app.ts:73:20
     71|
     72| const mainfunc = async () => {
     73|     const mysrvr = createServer();
       |                    ^
     74|     await start(mysrvr);
     75| }
 ❯ src/app.ts:77:1

THE CODE :

server.addHook('onListen', async () => {
  await connectToMongoDB();
});

server.addHook('onClose', async () => {
  await closeMongoDBConnection();
});
*/

const createServer = (() => {
    const server = fastify({ logger: true });

    server.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await reply.code(200).send({ status: "ok" });
        } catch (error: any) {
            logger.error(`Health check failed. Error: ${error.message}`);
            reply.code(500).send({ status: "error", error: "Health check failed" });
        } finally {
            logger.info(`Status code health check : ${reply.statusCode}`);
        }
    });
  
    server.get("/health/db", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            reply.code(200).send({ status: "ok"});
        } catch (error: any) {
            logger.error(`Health db check with MongoDB failed. Error: ${error.message}`);
            reply.code(500).send({ status: "error", error: "Health db check with MongoDB failed" });
        } finally {
            logger.info(`Status code health db check : ${reply.statusCode}`);
        }
    });

    return server;
});

const start = async (srvr: FastifyInstance) => {
    try {
        await srvr.listen({ port: Number(config.server_port) });
        logger.info(`Server is running on http://localhost:${config.server_port}`);
    } catch (err) {
        srvr.log.error(err);
        process.exit(1);
    }
};

export { createServer, start };