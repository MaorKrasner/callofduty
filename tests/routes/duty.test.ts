import { describe, expect, it } from "vitest";

import { client } from "../../src/db/connections.js";
import type { Duty } from "../../src/types/duty.js"
import { findOne } from "../../src/db/operations.js";
import { initialize } from "../../src/app.js";
import { ObjectId } from "mongodb";

const server = await initialize();

let attackingIranDuty: Duty;
let attackingIranId: ObjectId;

describe("GET routes for duties", () => {
    it("Should get existing duties by the filters. Expected 200", async () => {
        const response = await server.inject({
            method: "GET",
            url: "/duties?name=attacking northen terror organizations"
        });

        expect(response.statusCode).toBe(200);
    });

    it("Should get existing duty by id, id: 65db36be5af6c332cc1e519b. Expected 200.", async () => {
        const response = await server.inject({
            method: "GET",
            url: "/duties/65db36be5af6c332cc1e519b"
        });

        expect(response.statusCode).toBe(200);
    });

    it("Should NOT get existing duty by id, id: 66db36be5df6c332cc1e527e. Expected 404.", async () => {
        const response = await server.inject({
            method: "GET",
            url: "/duties/66db36be5df6c332cc1e527e"
        });

        expect(response.statusCode).toBe(404);
    });
});

describe("POST routes for duties", () => {
    it("Should create a new duty. Expected 201.", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/duties",
            payload:
            {
                "name": "attacking iran",
                "description": "attacking iran's nuclear factories",
                "location": {
                    "type": "Point",
                    "coordinates": [2754.90, 7689.27]
                },
                "startTime": "2024-02-28T18:45:30.500Z",
                "endTime": "2024-03-01T14:45:30.500Z",
                "value": 15,
                "constraints": ["big area", "massive attack", "secret operation"],
                "soldiersRequired": 410,
                "minRank": 3,
                "maxRank": 6
            }
        });

        expect(response.statusCode).toBe(201);
    });
});

describe("DELETE routes for duties", () => {
    it("Should delete duty attacking iran. Expected 204.", async () => {
        attackingIranDuty = await findOne<Duty & Document>(client, "duties", {name: "attacking iran"}) as Duty;
        attackingIranId = attackingIranDuty._id!;
        const response = await server.inject({
            method: "DELETE",
            url: `/duties/${attackingIranId}`
        });

        expect(response.statusCode).toBe(204);
    });

    it("Should NOT delete duty with id 65db36be5af6c332cc1e519b (scheduled). Expected 400.", async () => {
        const response = await server.inject({
            method: "DELETE",
            url: "/duties/65db36be5af6c332cc1e519b"
        });

        expect(response.statusCode).toBe(400);
    });

    it("Should NOT delete duty with id 77da35be5af6c458cc1e523d (duty doesn't exist). Expected 404.", async () => {
        const response = await server.inject({
            method: "DELETE",
            url: "/duties/77da35be5af6c458cc1e523d"
        });

        expect(response.statusCode).toBe(404);
    });
});

describe("PATCH routes for duties", () => {
    it("Should update duty with id 65dc9d72f40678a9e92ad2f8. Expected 200.", async () => {
        const response = await server.inject({
            method: "PATCH",
            url: "/duties/65dc9d72f40678a9e92ad2f8",
            payload:
            {
                "soldiersRequired": 50
            }
        });

        expect(response.statusCode).toBe(200);
    });

    it("Should NOT update duty with id 65db36be5af6c332cc1e519b (scheduled). Expected 400.", async () => {
        const response = await server.inject({
            method: "PATCH",
            url: "/duties/65db36be5af6c332cc1e519b",
            payload:
            {
                "soldiersRequired": 50
            }
        });

        expect(response.statusCode).toBe(400);
    });

    it("Should NOT update duty with id 77da35be5af6c458cc1e523d (duty doesn't exist). Expected 404.", async () => {
        const response = await server.inject({
            method: "PATCH",
            url: "/duties/77da35be5af6c458cc1e523d",
            payload:
            {
                "soldiersRequired": 50
            }
        });

        expect(response.statusCode).toBe(404);
    });
});

describe("PUT routes for duties", () => {
    it("Should add new constraints to duty with id 65dc9d72f40678a9e92ad2f8. Expected 200.", async () => {
        const response = await server.inject({
            method: "PUT",
            url: "/duties/65dc9d72f40678a9e92ad2f8/constraints",
            payload:
            {
                "constraints": [
                    "big area",
                    "windy",
                    "shabbat closing"
                ]
            }
        });

        expect(response.statusCode).toBe(200);
    });

    it("Should NOT add new constraints to duty with id 77da35be5af6c458cc1e523d (duty doesn't exist). Expected 404.", async () => {
        const response = await server.inject({
            method: "PUT",
            url: "/duties/77da35be5af6c458cc1e523d/constraints",
            payload:
            {
                "constraints": [
                    "big area",
                    "windy",
                    "a lot of targets"
                ]
            }
        });

        expect(response.statusCode).toBe(404);
    });
});