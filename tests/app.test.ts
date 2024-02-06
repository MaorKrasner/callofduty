import { test, assert } from "vitest";
import { connectToMongoDB, closeMongoDBConnection } from "../src/app";

test("Connect to MongoDB", async () => {
    const connection = await connectToMongoDB();
    assert.equal(connection, "Connection created");
});

test("Close MongoDB connection", async () => {
    const connection = await closeMongoDBConnection();
    assert.equal(connection, "Connection closed");
});