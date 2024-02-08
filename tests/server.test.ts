import { test, expect } from "vitest";
import {createServer, start} from "../src/server";

const server = createServer();
start(server);

test("Health check endpoint returns status ok", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toStrictEqual({status: "ok"});
});

test("Health db check endpoint returns status ok", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/health/db",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toStrictEqual({status: "ok"});
});
