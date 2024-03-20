import { ObjectId } from "mongodb";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as HttpStatus from "http-status-codes";

import { initialize } from "../../src/app.js";
import { close } from "../../src/server.js";
import { client } from "../../src/db/connections.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";
import {
  DutyInPastId,
  notFoundDutyId,
  postWorkingPayload,
  putPayload,
  patchPayload,
  putScheduleNotWorkingPayloads,
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

let secondTestDuty: Duty;
let secondTestDutyId: ObjectId;

let putCancelDuty: Duty;
let putCancelDutyId: ObjectId;

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

  secondTestDuty = createDutyDocument(secondTestPostWorkingPayload);
  await insertDuty(secondTestDuty);
  const secondTestDutyFromDb = (await findOne<Duty & Document>(
    client,
    "duties",
    {
      name: secondTestDuty.name,
    }
  )) as Duty;
  secondTestDutyId = secondTestDutyFromDb._id!;

  putCancelDuty = createDutyDocument(putScheduleNotWorkingPayloads[1]);
  await insertDuty(putCancelDuty);

  const putCancelDutyFromDb = (await findOne<Duty & Document>(
    client,
    "duties",
    {
      name: putCancelDuty.name,
    }
  )) as Duty;
  putCancelDutyId = putCancelDutyFromDb._id!;

  const putUpdateData = { status: "canceled" } as Partial<Duty>;
  await updateDuty(putCancelDutyId.toString(), putUpdateData);
});

afterAll(async () => {
  await deleteDuty(testDutyId.toString());
  await deleteDuty(secondTestDutyId.toString());
  await deleteDuty(putCancelDutyId.toString());

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
      const dutyBeforeUpdate = await findDuty(secondTestDutyId.toString());

      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${secondTestDutyId}`,
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
    describe("constraints PUT route", () => {
      it("Should return 200 when adding new constraints to a duty.", async () => {
        const dutyBeforeUpdate = await findDuty(secondTestDutyId.toString());

        const response = await server.inject({
          method: "PUT",
          url: `/duties/${secondTestDutyId}/constraints`,
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

    describe("schedule PUT route", () => {
      it("Should return 200 when trying to schedule a new duty.", async () => {
        const dutyBeforeChanges = await findDuty(secondTestDutyId.toString());

        const response = await server.inject({
          method: "PUT",
          url: `/duties/${secondTestDutyId}/schedule`,
        });

        const dutyAfterChanges = await findDuty(secondTestDutyId.toString());
        const statementToCheck =
          dutyAfterChanges.statusHistory.length -
            dutyBeforeChanges.statusHistory.length ===
            1 &&
          dutyAfterChanges.statusHistory[
            dutyAfterChanges.statusHistory.length - 1
          ].status === "scheduled";

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(statementToCheck).toBe(true);
      });

      it("Should return 409 when trying to schedule a new duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${DutyInPastId}/schedule`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot schedule the duty because it's in the past.",
        });
      });

      it("Should return 409 when trying to schedule a new duty (scheduled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${testDutyId}/schedule`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is scheduled`,
        });
      });

      it("Should return 409 when trying to schedule a new duty (canceled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${putCancelDutyId}/schedule`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is canceled`,
        });
      });

      it("Should return 404 when trying to schedule a new duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${notFoundDutyId}/schedule`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
        expect(response.json()).deep.eq({
          error: `Cannot find Duty with id ${notFoundDutyId}.`,
        });
      });
    });

    describe("cancel PUT route", () => {
      it("Should return 200 when trying to cancel a duty.", async () => {
        const dutyBeforeChanges = await findDuty(testDutyId.toString());

        const response = await server.inject({
          method: "PUT",
          url: `/duties/${testDutyId}/cancel`,
        });

        const dutyAfterChanges = await findDuty(testDutyId.toString());
        const statementToCheck =
          dutyAfterChanges.statusHistory.length -
            dutyBeforeChanges.statusHistory.length ===
            1 &&
          dutyAfterChanges.statusHistory[
            dutyAfterChanges.statusHistory.length - 1
          ].status === "canceled";

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(statementToCheck).toBe(true);
      });

      it("Should return 409 when trying to cancel a duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${DutyInPastId}/cancel`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot cancel the duty because it's in the past.",
        });
      });

      it("Should return 409 when trying to cancel a duty (canceled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${putCancelDutyId}/cancel`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Cannot cancel canceled duties.`,
        });
      });

      it("Should return 404 when trying to cancel a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${notFoundDutyId}/cancel`,
          payload: putPayload,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
        expect(response.json()).deep.eq({
          error: `Cannot find Duty with id ${notFoundDutyId}.`,
        });
      });
    });
  });
});
