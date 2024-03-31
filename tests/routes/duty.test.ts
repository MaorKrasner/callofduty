import { ObjectId } from "mongodb";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as HttpStatus from "http-status-codes";

import { initialize } from "../../src/app.js";
import { close } from "../../src/server.js";
import { client } from "../../src/db/connections.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";
import {
  cancelDutyPayload,
  notFoundDutyId,
  notWorkingPatchPayload,
  notWorkingUrlParameter,
  postWorkingPayload,
  putPayload,
  cancelledDutyPayload,
  patchPayload,
  secondTestPostWorkingPayload,
  scheduleDutyPayload,
  testPostWorkingPayload,
  dutyInPast,
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

let dutyInPastDuty: Duty;
let dutyInPastId: ObjectId;

let cancelledDuty: Duty;
let cancelledDutyId: ObjectId;

let toScheduleDuty: Duty;
let toScheduleDutyId: ObjectId;

let toCancelDuty: Duty;
let toCancelDutyId: ObjectId;

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

  dutyInPastDuty = createDutyDocument(dutyInPast);
  await insertDuty(dutyInPastDuty);

  const pastDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
    name: dutyInPastDuty.name,
  })) as Duty;
  dutyInPastId = pastDutyFromDb._id!;

  cancelledDuty = createDutyDocument(cancelledDutyPayload);
  await insertDuty(cancelledDuty);

  const cancelledDutyFromDb = (await findOne<Duty & Document>(
    client,
    "duties",
    {
      name: cancelledDuty.name,
    }
  )) as Duty;
  cancelledDutyId = cancelledDutyFromDb._id!;

  const cancelUpdateData = { status: "canceled" } as Partial<Duty>;
  await updateDuty(cancelledDutyId.toString(), cancelUpdateData);

  toScheduleDuty = createDutyDocument(scheduleDutyPayload);
  await insertDuty(toScheduleDuty);

  const toScheduleDutyFromDb = (await findOne<Duty & Document>(
    client,
    "duties",
    {
      name: toScheduleDuty.name,
    }
  )) as Duty;
  toScheduleDutyId = toScheduleDutyFromDb._id!;

  toCancelDuty = createDutyDocument(cancelDutyPayload);
  await insertDuty(toCancelDuty);

  const toCancelDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
    name: toCancelDuty.name,
  })) as Duty;
  toCancelDutyId = toCancelDutyFromDb._id!;
});

afterAll(async () => {
  await deleteDuty(testDutyId.toString());
  await deleteDuty(secondGazaAttackId.toString());
  await deleteDuty(dutyInPastId.toString());
  await deleteDuty(cancelledDutyId.toString());
  await deleteDuty(toScheduleDutyId.toString());
  await deleteDuty(toCancelDutyId.toString());

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
        url: `/duties/${secondGazaAttackId}`,
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
    describe("PUT : constraints", () => {
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

    describe("PUT : schedule", () => {
      it("Should return 200 when trying to schedule a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${toScheduleDutyId}/schedule`,
        });

        const dutyAfterSchedule = await findDuty(toScheduleDutyId.toString());
        const isScheduleSuccessful =
          dutyAfterSchedule.statusHistory.length -
            toScheduleDuty.statusHistory.length ===
            1 && dutyAfterSchedule.status === "scheduled";

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(isScheduleSuccessful).toBe(true);
      });

      it("Should return 409 when trying to schedule a duty (scheduled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${testDutyId}/schedule`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is scheduled`,
        });
      });

      it("Should return 409 when trying to schedule a duty (cancelled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${cancelledDutyId}/schedule`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is canceled`,
        });
      });

      it("Should return 409 when trying to schedule a duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${dutyInPastId}/schedule`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot schedule the duty because it's in the past.",
        });
      });

      it("Should return 404 when trying to schedule a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${notFoundDutyId}/schedule`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });

    describe("PUT: cancel", () => {
      it("Should return 200 when trying to cancel a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${toCancelDutyId}/cancel`,
        });

        const dutyAfterCancel = await findDuty(toCancelDutyId.toString());
        const isCancelSuccessful =
          dutyAfterCancel.statusHistory.length -
            toCancelDuty.statusHistory.length ===
            1 &&
          dutyAfterCancel.status === "canceled" &&
          dutyAfterCancel.soldiers.length === 0;

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(isCancelSuccessful).toBe(true);
      });

      it("Should return 409 when trying to cancel a duty (cancelled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${cancelledDutyId}/cancel`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot cancel canceled duties.",
        });
      });

      it("Should return 409 when trying to cancel a duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${dutyInPastId}/cancel`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot cancel the duty because it's in the past.",
        });
      });

      it("Should return 404 when trying to cancel a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${notFoundDutyId}/cancel`,
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });
  });
});
