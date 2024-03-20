import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as HttpStatus from "http-status-codes";

import { close } from "../../src/server.js";
import { initialize } from "../../src/app.js";
import { deleteSoldier, insertSoldier } from "../../src/collections/soldier.js";
import { notFoundSoldierId } from "../testData/soldier.js";
import { justiceBoardTestSoldier } from "../testData/justice-board.js";
import { createSoldierDocument } from "../../src/controllers/soldierController.js";
import { aggregateJusticeBoardById } from "../../src/collections/justice-board.js";
import exp from "constants";

let testSoldierId: string;

const server = await initialize();

beforeAll(async () => {
  const soldierToInsert = createSoldierDocument(justiceBoardTestSoldier);
  await insertSoldier(soldierToInsert);
  testSoldierId = soldierToInsert._id!.toString();
});

afterAll(async () => {
  await deleteSoldier(testSoldierId);
  await close(server);
});

describe("justice board routes", () => {
  describe("GET routes for justice board", () => {
    it("Should return 200 when trying to get the justice board", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/justice-board",
      });

      const score = await aggregateJusticeBoardById(testSoldierId.toString());

      expect(response.statusCode).toBe(200);
      expect(response.json()).toContainEqual({
        _id: testSoldierId,
        score: score,
      });
    });

    it("Should return 200 when trying to get justice-board by id", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${testSoldierId}`,
      });

      const score = await aggregateJusticeBoardById(testSoldierId);

      expect(response.statusCode).toBe(200);
      expect(response.json()).toStrictEqual({
        score: score,
      });
    });

    it("Should return 404 when trying to get justice-board by id", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${notFoundSoldierId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      expect(response.json()).deep.eq({
        error: `Couldn't find soldier with id ${notFoundSoldierId}`,
      });
    });
  });
});
