import { test, assert } from "vitest";
import {createServer, start} from "../src/server";  // Update the import statement

const server = createServer();

async () => {
    await start(server);
};

test("Health check endpoint returns status ok", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/health",
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
});

test("Health db check endpoint returns status ok", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/health/db",
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
});
