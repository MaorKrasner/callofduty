import { describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js";

const server = await initialize();

describe("Health routes", () => {
  describe("GET routes for health", () => {
    it("Should return 200 and {status: ok} when sending request to /health route.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toStrictEqual({ status: "ok" });
    });

    it("Should return 200 and {status: ok} when sending request to /health/db route.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health/db",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toStrictEqual({ status: "Connected to db" });
    });
  });
});
