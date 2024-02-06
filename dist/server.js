"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.createServer = void 0;
const fastify_1 = require("fastify");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./logger"));
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
    const server = (0, fastify_1.fastify)({ logger: true });
    server.get("/health", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield reply.code(200).send({ status: "ok" });
        }
        catch (error) {
            logger_1.default.error(`Health check failed. Error: ${error.message}`);
            reply.code(500).send({ status: "error", error: "Health check failed" });
        }
        finally {
            logger_1.default.info(`Status code health check : ${reply.statusCode}`);
        }
    }));
    server.get("/health/db", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            reply.code(200).send({ status: "ok" });
        }
        catch (error) {
            logger_1.default.error(`Health db check with MongoDB failed. Error: ${error.message}`);
            reply.code(500).send({ status: "error", error: "Health db check with MongoDB failed" });
        }
        finally {
            logger_1.default.info(`Status code health db check : ${reply.statusCode}`);
        }
    }));
    return server;
});
exports.createServer = createServer;
const start = (srvr) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield srvr.listen({ port: Number(config_1.default.server_port) });
        logger_1.default.info(`Server is running on http://localhost:${config_1.default.server_port}`);
    }
    catch (err) {
        srvr.log.error(err);
        process.exit(1);
    }
});
exports.start = start;
