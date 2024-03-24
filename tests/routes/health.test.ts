import { describe, expect, it } from "vitest";
import * as HttpStatus from "http-status-codes";

import { initialize } from "../../src/app.js";

const server = await initialize();

describe("Health routes", () => {
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
