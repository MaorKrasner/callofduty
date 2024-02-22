import { afterAll, describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js";
import { close } from "../../src/server.js";

const server = await initialize();

afterAll(async () => {
  await close(server);
});

const workingPostPayload = {
  _id: "5789483",
  name: "Moby Brown",
  rank: { name: "sergeant", value: 2 },
  limitations: ["beard", "hatash7", "hair", "standing", "no work after 6pm"],
};

const notWorkingPostPayloads = [
  {
    _id: "1234568",
    rank: { name: "captain", value: 4 },
    limitations: ["beard", "hatash7"],
  },

  {
    _id: "1234567",
    rank: { name: "corporal", value: 1 },
    limitations: ["beard", "hatash7"],
  },
];

const workingPatchPayload = {
  rank: { name: "colonel", value: 6 },
  limitations: ["beard", "hair", "hatash7", "standing", "sun"],
};

const notWorkingPatchPayloads = [
  {
    _id: "2345678",
    rank: { name: "colonel", value: 7 },
    limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  },

  {
    rank: { name: "colonel", value: 7 },
    limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  },
];

describe("Soldier routes", () => {
  describe("GET routes for soldiers", () => {
    it("Should return 200 when trying to get a soldier.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/soldiers/1234567",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 404 when trying to get a soldier.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/soldiers/3456789",
      });

      expect(response.statusCode).toBe(404);
    });

    it("Should return 200 when trying to get soldiers by filters.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/soldiers?limitations=hair,hatash7",
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 200 and data: [] when trying to get soldiers by filters.", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/soldiers?limitations=hatash4",
      });

      expect(response.statusCode).toBe(200);
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
      });

      expect(response.statusCode).toBe(201);
      // check if in db
    });

    it("Should return 500 when trying to create a new soldier.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload: notWorkingPostPayloads[0],
      });

      expect(response.statusCode).toBe(500);
    });

    it("Should return 400 when trying to create a new soldier.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload: notWorkingPostPayloads[1],
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE routes for soldiers", () => {
    it("Should return 204 when deleteing a soldier.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/soldiers/${workingPostPayload._id}`,
      });

      expect(response.statusCode).toBe(204);
    });
    it("Should return 404 when trying to delete a soldier.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: "/soldiers/3456789",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH routes for soldiers", () => {
    it("Should return 200 when updating a soldier.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload: workingPatchPayload,
      });

      expect(response.statusCode).toBe(200);
    });

    it("Should return 500 when not trying to update a soldier (trying to update _id).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload: notWorkingPatchPayloads[0],
      });

      expect(response.statusCode).toBe(500);
    });

    it("Should return 500 when trying to update a soldier (not passing schema).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload: notWorkingPatchPayloads[1],
      });

      expect(response.statusCode).toBe(500);
    });

    it("Should return 404 when trying to update a soldier.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234569",
        payload: notWorkingPatchPayloads[1],
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
