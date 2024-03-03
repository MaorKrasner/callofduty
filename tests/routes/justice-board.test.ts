import { describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js";

const server = await initialize();

describe("justice board routes", () => {
  describe("GET routes for justice board", () => {
    it("Should return 200 when trying to get the justice board", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/justice-board",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 200 when trying to get justice-board by id", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/justice-board/1234567",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 404 when trying to get justice-board by id", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/justice-board/1234567890",
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
