import { FastifyReply, FastifyRequest } from "fastify";
import * as HttpStatus from "http-status-codes";

import { client } from "../db/connections.js";

export const healthCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  await reply.code(HttpStatus.StatusCodes.OK).send({ status: "ok" });
};

export const dbHealthCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!(await client.db("admin").command({ ping: 1 }))) {
    return await reply
      .code(HttpStatus.StatusCodes.BAD_REQUEST)
      .send({ error: "Not connected to db" });
  }

  return await reply
    .code(HttpStatus.StatusCodes.OK)
    .send({ status: "Connected to db" });
};
