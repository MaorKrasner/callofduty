import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import * as HttpStatus from "http-status-codes";

import { closeDBConnection, connectToDB } from "../../src/db/connections.js";
import { createServer } from "../../src/server.js";

describe("Health routes", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await connectToDB();
  });

  afterAll(async () => {
    await closeDBConnection();
  });

  describe("GET routes for health", () => {
    it("Should return {status: ok} when sending request to /health route.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toStrictEqual({ status: "ok" });
    });

    it("Should return {status: ok} when sending request to /health/db route.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toStrictEqual({ status: "ok" });
    });
  });
});
