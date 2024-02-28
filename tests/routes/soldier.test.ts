import { afterAll, describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js";
import { buildSoldierPayload } from "../testsHelper.js";
import { close } from "../../src/server.js";

const server = await initialize();

afterAll(async () => {
    await close(server);
});

const workingPostPayload = buildSoldierPayload(
    "5789483",
    "Moby Brown",
    {name: "sergeant", value: 2},
    ["beard", "hatash7", "hair", "standing", "no work after 6pm"]
);

const notWorkingPostPayloads = [
    buildSoldierPayload(
    "1234568",
    "",
    {name: "captain", value: 4},
    ["beard", "hatash7"]),

    buildSoldierPayload(
        "1234567",
        "",
        {name: "corporal", value: 1},
        ["beard", "hatash7"]
    )
]

const workingPatchPayload = buildSoldierPayload(
    "",
    "",
    {name: "colonel", value: 6},
    ["beard", "hair", "hatash7", "standing", "sun"]
);

const notWorkingPatchPayloads = [
    buildSoldierPayload(
        "2345678",
        "",
        {name: "colonel", value: 7},
        ["beard", "hair", "hatash7", "standing", "sun"]
    ),
    
    buildSoldierPayload(
        "",
        "",
        {name: "colonel", value: 7},
        ["beard", "hair", "hatash7", "standing", "sun"]
    )
]

describe("Soldier routes", () => {
    describe("GET routes for soldiers", () => {
        it("Should find a soldier with id 01234567. Expected 200.", async () => {
            const response = await server.inject({
                method: "GET",
                url: "/soldiers/1234567"
            });
    
            expect(response.statusCode).toBe(200);
        });
    
        it("Should not find a soldier with id 3456789. Expected 404.", async () => {
            const response = await server.inject({
                method: "GET",
                url: "/soldiers/3456789"
            });
    
            expect(response.statusCode).toBe(404);
        });
    
        it("Should find soldiers with limitations hair and hatash7. Expected 200.", async () => {
            const response = await server.inject({
                method: "GET",
                url:"/soldiers?limitations=hair,hatash7"
            });
        
            expect(response.statusCode).toBe(200);
        });
    
        it("Should not find soldiers with limitation hatash4. Expected 200 and data: [].", async () => {
            const response = await server.inject({
                method: "GET",
                url:"/soldiers?limitations=hatash4"
            });
        
            expect(response.statusCode).toBe(200);
            expect(response.json()).toStrictEqual({
                "data": []
            });
        });
    });
    
    describe("POST routes for soldiers", () => {
        it("Should create a new soldier and put it inside the db. Expected 201.", async () => {
            const response = await server.inject({
                method: "POST",
                url: "/soldiers",
                payload: workingPostPayload
            });
        
            expect(response.statusCode).toBe(201);
        });
    
        it("Should not create a new soldier due to a lack of parameters. Expected 500.", async () => {
            const response = await server.inject({
                method: "POST",
                url: "/soldiers",
                payload: notWorkingPostPayloads[0]
            });
    
            expect(response.statusCode).toBe(500);
        });
    
        it("Should not create a new soldier due to id duplication. Expected 400.", async () => {
            const response = await server.inject({
                method: "POST",
                url: "/soldiers",
                payload: notWorkingPostPayloads[1]
            });
    
            expect(response.statusCode).toBe(400);
        });
    });
    
    describe("DELETE routes for soldiers", () => {
        it("Should delete successfully the soldier with the id 0123456. Expected 204.", async () => {
            const response = await server.inject({
                method: "DELETE",
                url: `/soldiers/${workingPostPayload._id}` 
            });
        
            expect(response.statusCode).toBe(204);
        });
        it("Should not delete a soldier with id 3456789. Expected 404.", async () => {
            const response = await server.inject({
                method: "DELETE",
                url: "/soldiers/3456789"
            });
    
            expect(response.statusCode).toBe(404);
        });
    });
    
    describe("PATCH routes for soldiers", () => {
        it("Should patch soldier with id 1234567. Expected 200.", async () => {
            const response = await server.inject({
                method: "PATCH",
                url: "/soldiers/1234567",
                payload: workingPatchPayload
            });
            
            expect(response.statusCode).toBe(200);
        });
        
        it("Should not patch soldier with id 1234567 because trying to modify _id. Expected 500.", async () => {
            const response = await server.inject({
                method: "PATCH",
                url: "/soldiers/1234567",
                payload: notWorkingPatchPayloads[0]
            });
        
            expect(response.statusCode).toBe(500);
        });
        
        it("Should not patch soldier with id 1234567 because not passing schema validation. Expected 500.", async () => {
            const response = await server.inject({
                method: "PATCH",
                url: "/soldiers/1234567",
                payload: notWorkingPatchPayloads[1]
            });
        
            expect(response.statusCode).toBe(500);
        });
    
        it("Should not patch soldier with id 1234569 because soldier doesn't exist. Expected 404.", async () => {
            const response = await server.inject({
                method: "PATCH",
                url: "/soldiers/1234569",
                payload: notWorkingPatchPayloads[1]
            });
        
            expect(response.statusCode).toBe(404);
        });
    });
});