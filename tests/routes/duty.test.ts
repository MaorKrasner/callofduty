import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js";
import { client } from "../../src/db/connections.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";

const server = await initialize();

let attackingIranDuty: Duty;
let attackingIranId: ObjectId;

const postWorkingPayload = {
  name: "attacking iran",
  description: "attacking iran's nuclear factories",
  location: {
    type: "Point",
    coordinates: [2754.9, 7689.27],
  },
  startTime: "2024-02-28T18:45:30.500Z",
  endTime: "2024-03-01T14:45:30.500Z",
  value: 15,
  constraints: ["big area", "massive attack", "secret operation"],
  soldiersRequired: 410,
  minRank: 3,
  maxRank: 6,
};

const putPayload = {
  constraints: ["big area", "windy", "shabbat closing"],
};

const patchPayload = {
  soldiersRequired: 50,
};

describe("Duty routes", () => {
  describe("GET routes for duties", () => {
    it("Should return 200 when trying to get existing duties.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/duties?name=attacking northen terror organizations",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 200 when trying to find duty by id.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/duties/65db36be5af6c332cc1e519b",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 404 when trying to find duty by id.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/duties/66db36be5df6c332cc1e527e",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST routes for duties", () => {
    it("Should return 201 when creating a new duty.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/duties",
        payload: postWorkingPayload,
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe("DELETE routes for duties", () => {
    it("Should return 204 when trying to delete duty.", async () => {
      attackingIranDuty = (await findOne<Duty & Document>(client, "duties", {
        name: "attacking iran",
      })) as Duty;
      attackingIranId = attackingIranDuty._id!;
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${attackingIranId}`,
      });

      expect(response.statusCode).toBe(204);
    });

    it("Should return 400 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: "/duties/65db36be5af6c332cc1e519b",
      });

      expect(response.statusCode).toBe(400);
    });

    it("Should return 404 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: "/duties/77da35be5af6c458cc1e523d",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH routes for duties", () => {
    it("Should return 200 when trying to update a duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/duties/65dc9d72f40678a9e92ad2f8",
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 400 when trying to update a duty (scheduled).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/duties/65db36be5af6c332cc1e519b",
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it("Should return 404 when trying to update duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/duties/77da35be5af6c458cc1e523d",
        payload: patchPayload,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PUT routes for duties", () => {
    it("Should return 200 when adding new constraints to a duty.", async () => {
      const response = await server.inject({
        method: "PUT",
        url: "/duties/65dc9d72f40678a9e92ad2f8/constraints",
        payload: putPayload,
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 404 when trying to add new constraints to a duty.", async () => {
      const response = await server.inject({
        method: "PUT",
        url: "/duties/77da35be5af6c458cc1e523d/constraints",
        payload: putPayload,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
