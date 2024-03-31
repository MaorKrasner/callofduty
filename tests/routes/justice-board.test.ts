import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import * as HttpStatus from "http-status-codes";
import { FastifyInstance } from "fastify";

import { createServer } from "../../src/server.js";
import {
  client,
  closeDBConnection,
  connectToDB,
} from "../../src/db/connections.js";
import { deleteDuty } from "../../src/collections/duty.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";
import { deleteSoldier, insertSoldier } from "../../src/collections/soldier.js";
import { notFoundSoldierId } from "../testData/soldier.js";
import {
  justiceBoardTestDuty,
  secondJusticeBoardTestDuty,
  justiceBoardTestSoldier,
  secondJusticeBoardTestSoldier,
} from "../testData/justice-board.js";
import { createSoldierDocument } from "../../src/controllers/soldierController.js";
import { aggregateJusticeBoardById } from "../../src/collections/justice-board.js";
import { createDutyDocument } from "../../src/controllers/dutyController.js";
import { insertDuty, updateDuty } from "../../src/collections/duty.js";

describe("justice board routes", () => {
  let testSoldierId: string;
  let secondTestSoldierId: string;

  let testDuty: Duty;
  let testDutyFromDb: Duty;
  let testDutyId: string;

  let secondTestDuty: Duty;
  let secondTestDutyFromDb: Duty;
  let secondTestDutyId: string;

  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await connectToDB();

    const soldierToInsert = createSoldierDocument(justiceBoardTestSoldier);
    await insertSoldier(soldierToInsert);
    testSoldierId = soldierToInsert._id!.toString();

    const secondSoldierToInsert = createSoldierDocument(
      secondJusticeBoardTestSoldier
    );
    await insertSoldier(secondSoldierToInsert);
    secondTestSoldierId = secondSoldierToInsert._id!.toString();

    testDuty = createDutyDocument(justiceBoardTestDuty);
    await insertDuty(testDuty);

    testDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
      name: testDuty.name,
    })) as Duty;
    testDutyId = testDutyFromDb._id!.toString();

    secondTestDuty = createDutyDocument(secondJusticeBoardTestDuty);
    await insertDuty(secondTestDuty);

    secondTestDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
      name: secondTestDuty.name,
    })) as Duty;
    secondTestDutyId = secondTestDutyFromDb._id!.toString();
  });

  afterEach(async () => {
    await updateDuty(testDutyId, {
      soldiers: [],
    });

    await updateDuty(secondTestDutyId, {
      soldiers: [],
    });
  });

  afterAll(async () => {
    await deleteSoldier(testSoldierId);
    await deleteSoldier(secondTestSoldierId);

    await deleteDuty(testDutyId);
    await deleteDuty(secondTestDutyId);

    await closeDBConnection();
  });

  describe("GET routes for justice board", () => {
    it("Should return 200 when trying to get the justice board", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/justice-board",
      });

      const score = await aggregateJusticeBoardById(testSoldierId);
      const secondScore = await aggregateJusticeBoardById(secondTestSoldierId);

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toContainEqual({
        _id: testSoldierId,
        score: score,
      });
      expect(response.json()).toContainEqual({
        _id: secondTestSoldierId,
        score: secondScore,
      });
      expect(score).toBe(0);
      expect(secondScore).toBe(0);
    });

    it("Should return 200 when trying to get justice-board by id. score must be 0.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${testSoldierId}`,
      });

      const score = await aggregateJusticeBoardById(testSoldierId);

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).deep.eq({
        score: score,
      });
      expect(score).toBe(0);
    });

    it(`Should return 200 when trying to get justice-board by id. score must be value from first test.`, async () => {
      await updateDuty(testDutyId, {
        soldiers: [testSoldierId],
      });

      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${testSoldierId}`,
      });

      const score = await aggregateJusticeBoardById(testSoldierId);

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).deep.eq({
        score: score,
      });
      expect(score).toBe(testDutyFromDb.value);
    });

    it("Should return 200 when trying to get justice-board by id. score must sum of first test duty value and second duty test value.", async () => {
      await updateDuty(testDutyId, {
        soldiers: [testSoldierId],
      });

      await updateDuty(secondTestDutyId, {
        soldiers: [testSoldierId, secondTestSoldierId],
      });

      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${testSoldierId}`,
      });

      const score = await aggregateJusticeBoardById(testSoldierId);

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).deep.eq({
        score: score,
      });
      expect(score).toBe(testDutyFromDb.value + secondTestDutyFromDb.value);
    });

    it("Should return 200 when trying to get justice-board by id. score must be as the value of the second test duty.", async () => {
      await updateDuty(secondTestDutyId, {
        soldiers: [secondTestSoldierId],
      });

      const response = await server.inject({
        method: "GET",
        url: `/justice-board/${secondTestSoldierId}`,
      });

      const score = await aggregateJusticeBoardById(secondTestSoldierId);

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).deep.eq({
        score: score,
      });
      expect(score).toBe(secondTestDutyFromDb.value);
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
