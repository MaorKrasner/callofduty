import { ObjectId } from "mongodb";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as HttpStatus from "http-status-codes";

import { initialize } from "../../src/app.js";
import { close } from "../../src/server.js";
import { client } from "../../src/db/connections.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";
import {
  notFoundDutyId,
  notWorkingPatchPayload,
  notWorkingUrlParameter,
  postWorkingPayload,
  putPayload,
  patchPayload,
  secondTestPostWorkingPayload,
  testPostWorkingPayload,
} from "../testData/duty.js";
import {
  deleteDuty,
  findDuty,
  findManyDuties,
  updateDuty,
} from "../../src/collections/duty.js";
import { createDutyDocument } from "../../src/controllers/dutyController.js";
import { insertDuty } from "../../src/collections/duty.js";

let attackingIranDuty: Duty;
let attackingIranId: ObjectId;

let testDuty: Duty;
let testDutyId: ObjectId;

let secondGazaAttack: Duty;
let secondGazaAttackId: ObjectId;

const server = await initialize();

beforeAll(async () => {
  attackingIranDuty = createDutyDocument(postWorkingPayload);
  await insertDuty(attackingIranDuty);
  const IranDuty = (await findOne<Duty & Document>(client, "duties", {
    name: attackingIranDuty.name,
  })) as Duty;
  attackingIranId = IranDuty._id!;

  testDuty = createDutyDocument(testPostWorkingPayload);
  await insertDuty(testDuty);
  const testDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
    name: testDuty.name,
  })) as Duty;
  testDutyId = testDutyFromDb._id!;

  const updateData = { status: "scheduled" } as Partial<Duty>;
  await updateDuty(testDutyId.toString(), updateData);

  secondGazaAttack = createDutyDocument(secondTestPostWorkingPayload);
  await insertDuty(secondGazaAttack);
  const secondTestDutyFromDb = (await findOne<Duty & Document>(
    client,
    "duties",
    {
      name: secondGazaAttack.name,
    }
  )) as Duty;
  secondGazaAttackId = secondTestDutyFromDb._id!;
});

afterAll(async () => {
  await deleteDuty(testDutyId.toString());
  await deleteDuty(secondGazaAttackId.toString());

  const testDutyToDelete = await findManyDuties({
    name: testPostWorkingPayload.name,
  });
  const idToDelete = testDutyToDelete[0]._id!;

  await deleteDuty(idToDelete.toString());

  await close(server);
});

describe("Duty routes", () => {
  describe("GET routes for duties", () => {
    it("Should return 200 when trying to get existing duties.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/duties?name=${attackingIranDuty.name}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toHaveProperty("data");
    });

    it("Should return 200 when trying to find duty by id.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/duties/${attackingIranId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toHaveProperty("data");
    });

    it("Should return 400 when trying to get existing duties.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/duties?${notWorkingUrlParameter}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
    });

    it("Should return 404 when trying to find duty by id.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/duties/${notFoundDutyId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("POST routes for duties", () => {
    it("Should return 201 when creating a new duty.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/duties",
        payload: testPostWorkingPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CREATED);
      expect(response.json()).toHaveProperty("createdAt");
      expect(response.json()).toHaveProperty("updatedAt");
    });

    it("Should return 400 when creating a new duty.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/duties",
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
    });
  });

  describe("DELETE routes for duties", () => {
    it("Should return 204 when trying to delete duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${attackingIranId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NO_CONTENT);
      expect(await findDuty(attackingIranId.toString())).toBe(null);
    });

    it("Should return 409 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${testDutyId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
    });

    it("Should return 404 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${notFoundDutyId}`,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("PATCH routes for duties", () => {
    it("Should return 200 when trying to update a duty.", async () => {
      const dutyBeforeUpdate = await findDuty(secondGazaAttackId.toString());

      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${secondGazaAttackId}`,
        payload: patchPayload,
      });

      const dutyAfterUpdate = response.json() as Duty;

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(dutyAfterUpdate.soldiersRequired).not.toStrictEqual(
        dutyBeforeUpdate.soldiersRequired
      );
    });

    it("Should return 409 when trying to update a duty (scheduled).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${testDutyId}`,
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
    });

    it("Should return 400 when trying to update a duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${secondGazaAttackId}`, // change here
        payload: notWorkingPatchPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({
        error: `Failed to pass schema.`,
      });
    });

    it("Should return 404 when trying to update duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${notFoundDutyId}`,
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("PUT routes for duties", () => {
    it("Should return 200 when adding new constraints to a duty.", async () => {
      const dutyBeforeUpdate = await findDuty(secondGazaAttackId.toString());

      const response = await server.inject({
        method: "PUT",
        url: `/duties/${secondGazaAttackId}/constraints`,
        payload: putPayload,
      });

      const dutyAfterUpdate = response.json() as Duty;

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(dutyAfterUpdate.updatedAt).not.toStrictEqual(
        dutyBeforeUpdate.updatedAt
      );
    });

    it("Should return 404 when trying to add new constraints to a duty.", async () => {
      const response = await server.inject({
        method: "PUT",
        url: `/duties/${notFoundDutyId}/constraints`,
        payload: putPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });
});
