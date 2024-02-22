import { describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js"

const server = await initialize();

describe("GET routes for health", () => {
    it('Should return {status: ok} when sending request to /health route. Expected 200.', async () => {
        const response = await server.inject({
            method: "GET",
            url: "/health",
        });
    
        expect(response.statusCode).toBe(200);
        expect(response.json()).toStrictEqual({status: "ok"});
    });

    it('Should return {status: ok} when sending request to /health/db route. Expected 200.', async () => {
        const response = await server.inject({
            method: "GET",
            url: "/health",
        });
    
        expect(response.statusCode).toBe(200);
        expect(response.json()).toStrictEqual({status: "ok"});
    });
});