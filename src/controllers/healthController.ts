import { FastifyReply, FastifyRequest } from "fastify";

import { client } from "../db/connections.js";

export const healthCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  await reply.code(200).send({ status: "ok" });
};

export const dbHealthCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (await client.db("admin").command({ ping: 1 })) {
    await reply.code(200).send({ status: "Connected to db" });
  } else {
    await reply.code(400).send({ error: "Not connected to db" });
  }
};
