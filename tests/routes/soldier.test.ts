import { describe, expect, it } from "vitest";

import { initialize } from "../../src/app.js"

const server = await initialize();

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
            payload:
            {
                "_id": "1234560",
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

    it("Should not create a new soldier due to a lack of parameters. Expected 500.", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/soldiers",
            payload:
            {
                "_id": "1234568",
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

        expect(response.statusCode).toBe(500);
    });

    it("Should not create a new soldier due to id duplication. Expected 400.", async () => {
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
    });
});

describe("DELETE routes for soldiers", () => {
    it("Should delete successfully the soldier with the id 0123456. Expected 204.", async () => {
        const response = await server.inject({
            method: "DELETE",
            url: "/soldiers/0123456" 
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
            payload:
            {
                "limitations": [
                    "beard", "hair", "hatash7", "standing", "sun"
                ],
                "rank": {
                    "name": "colonel",
                    "value": 6
                }
            }
        });
        
        expect(response.statusCode).toBe(200);
    });
    
    it("Should not patch soldier with id 1234567 because trying to modify _id. Expected 400.", async () => {
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
    
    it("Should not patch soldier with id 1234567 because not passing schema validation. Expected 500.", async () => {
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

    it("Should not patch soldier with id 1234569 because soldier doesn't exist. Expected 404.", async () => {
        const response = await server.inject({
            method: "PATCH",
            url: "/soldiers/1234569",
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
    
        expect(response.statusCode).toBe(404);
    });
});