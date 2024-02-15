import { test, expect } from "vitest";
import {createServer, start} from "../src/server";
import { connectToMongoDB } from "../src/mongoConnect";

const connection = async () => await connectToMongoDB();

connection();

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

test("Create new soldier by POST method (Code 201)", async () => {
    const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload:
        {
            "_id": "1234567",
            "name": "Maor Krasner",
            "rank": {
                "name": "corporal",
                "value": 1
            },
            "limitations": [
                "beard",
                "hatash7",
                "hair",
                "standing",
                "no work after 6pm"
            ]
        }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).to.have.property("_id");
    expect(response.json()).to.have.property("name");
    expect(response.json()).to.have.property("rank");
    expect(response.json()).to.have.property("limitations");
});

test("Create new soldier by POST method (Code 400, missing name)", async () => {
    const response = await server.inject({
        method: "POST",
        url: "/soldiers",
        payload:
        {
            "_id": "1234567",
            "rank": {
                "name": "corporal",
                "value": 1
            },
            "limitations": [
                "beard",
                "hatash7"
            ]
        }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toStrictEqual({ error: 'Invalid request. Missing required parameters.' });
});

test("Get soldier information by soldier id. id : 1234567 (Code 200)", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/soldiers/1234567"
    });

    expect(response.statusCode).toBe(200);
});

test("Get soldier information by soldier id. id : 123456 (Code 404)", async () => {
    const response = await server.inject({
        method: "GET",
        url: "/soldiers/123456"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toStrictEqual({error : `Soldier not found. Check the length of the id you passed and the id itself.`});
});

test("Get information about soldiers with filters (Code 200)", async () => {
    const response = await server.inject({
        method: "GET",
        url:"/soldiers?limitations=hair,hatash7"
    });

    expect(response.statusCode).toBe(200);
});

test("Get information about soldiers with filters (Code 200 second attempt)", async () => {
    const response = await server.inject({
        method: "GET",
        url:"/soldiers?limitations=hair,hatash5"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toStrictEqual({
        "data": []
    });
});

test("Delete soldier by soldier id. id: 0123456 (Code 204)", async () => {
    const response = await server.inject({
        method: "DELETE",
        url: "/soldiers/0123456" 
    });

    expect(response.statusCode).toBe(204);
});

test("Delete soldier by soldier id. id: 012345 (Code 404)", async () => {
    const response = await server.inject({
        method: "DELETE",
        url: "/soldiers/012345" 
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toStrictEqual({error: "There is no soldier with id 012345"});
});

test("Patch soldier inforamtion by soldier id. id: 1234567 (Code 200)", async () => {
    const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload:
        {
            "limitations": [
                "beard", "hair", "hatash7", "standing", "sun"
            ],
            "rank": {
                "name": "colonel",
                "value": 7
            }
        }
    });
    
    expect(response.statusCode).toBe(200);
});

test("Patch soldier information by soldier id. id 1234567 (Code 400 because can't modify _id)", async () => {
    const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload:
        {
            "limitations": [
                "beard", "hair", "hatash7", "standing", "sun"
            ],
            "_id": "2345678",
            "rank": {
                "name": "colonel",
                "value": 7
            }
        } 
    });

    expect(response.statusCode).toBe(500);
});

test("Patch soldier information by soldier id. id 1234567 (Code 400 because Invalid update)", async () => {
    const response = await server.inject({
        method: "PATCH",
        url: "/soldiers/1234567",
        payload:
        {
            "limitations": [
                "beard", "hair", "hatash7", "standing", "sun"
            ],
            "rank": {
                "name": "colonel",
                "rankValue": 7
            }
        } 
    });

    expect(response.statusCode).toBe(500);
});