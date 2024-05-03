import { afterAll, describe, expect, it, beforeAll } from "vitest";
import * as HttpStatus from "http-status-codes";
import { FastifyInstance } from "fastify";

import { close, createServer } from "../../src/server.js";
import { Soldier } from "../../src/types/soldier.js";
import {
  deleteSoldier,
  findSoldier,
  insertSoldier,
} from "../../src/collections/soldier.js";
import {
  existingLimitations,
  notWorkingPostPayloads,
  notWorkingPatchPayloads,
  notFoundSoldierId,
  notExistingLimitation,
  testSoldier,
  workingPatchPayload,
  workingPostPayload,
} from "../testData/soldier.js";
import { createSoldierDocument } from "../../src/controllers/soldierController.js";
import { closeDBConnection, connectToDB } from "../../src/db/connections.js";

describe("Soldier routes", () => {
  let server: FastifyInstance;

  let testSoldierId: string;

  beforeAll(async () => {
    server = await createServer();
    await connectToDB();

    const soldierToInsert = createSoldierDocument(testSoldier);
    await insertSoldier(soldierToInsert);
    testSoldierId = testSoldier._id!.toString();
  });

  afterAll(async () => {
    await deleteSoldier(testSoldierId);
    await closeDBConnection();
  });

  describe("GET routes for soldiers", () => {
    it("Should return 200 when trying to get a soldier.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/soldiers/${testSoldierId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toHaveProperty("data");
    });

    it("Should return 404 when trying to get a soldier.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/soldiers/${notFoundSoldierId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });

    it("Should return 200 when trying to get soldiers by filters.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/soldiers?limitations=${existingLimitations[0]},${existingLimitations[1]}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toHaveProperty("data");
    });

    it("Should return 200 and data: [] when trying to get soldiers by filters.", async () => {
      const response = await server.inject({
        method: "GET",
        url: `/soldiers?limitations=${notExistingLimitation}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(response.json()).toStrictEqual({
        data: [],
      });
    });
  });

  describe("POST routes for soldiers", () => {
    it("Should return 201 when creating a new soldier.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload: workingPostPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CREATED);
      expect(response.json()).toHaveProperty("createdAt");
    });

    it("Should return 400 when trying to create a new soldier.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload: notWorkingPostPayloads[0],
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
    });

    it("Should return 409 when trying to create a new soldier.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload: notWorkingPostPayloads[1],
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
    });
  });

  describe("DELETE routes for soldiers", () => {
    it("Should return 204 when deleting a soldier.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/soldiers/${workingPostPayload._id}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NO_CONTENT);
      expect(await findSoldier(workingPostPayload._id)).toBe(null);
    });
    it("Should return 404 when trying to delete a soldier.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/soldiers/${notFoundSoldierId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("PATCH routes for soldiers", () => {
    it("Should return 200 when updating a soldier.", async () => {
      const soldierBeforeUpdate = await findSoldier(testSoldierId);

      const response = await server.inject({
        method: "PATCH",
        url: `/soldiers/${testSoldierId}`,
        payload: workingPatchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      const responseAsSoldier = response.json() as Soldier;

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(responseAsSoldier.limitations).deep.eq(
        workingPatchPayload.limitations
      );
      expect(responseAsSoldier.rank).deep.eq(workingPatchPayload.rank);
    });

    it("Should return 400 when not trying to update a soldier (trying to update _id).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/soldiers/${testSoldierId}`,
        payload: notWorkingPatchPayloads[0],
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
    });

    it("Should return 400 when trying to update a soldier (not passing schema).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/soldiers/${testSoldierId}`,
        payload: notWorkingPatchPayloads[1],
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).toStrictEqual({
        error: `Failed to pass schema.`,
      });
    });

    it("Should return 404 when trying to update a soldier.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/soldiers/${notFoundSoldierId}`,
        payload: notWorkingPatchPayloads[1],
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });
});
