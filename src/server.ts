import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import config from "./config.js";
import logger from "./logger.js"
import { Soldier, rankValueNameDictionary } from "./collections.js"
import { z } from "zod"
import { addDataToDb, deleteDataFromDb, getDataFromDb, updateDataInDb, client } from "./mongoConnect.js";

const createServer = (() => {
    const server = fastify({ logger: true });
    
    server.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await reply.code(200).send({ status: "ok" });
        } catch (error: any) {
            await reply.code(500).send({status: error, error: "Internal Server Error. Accessing route /health failed."});
            logger.error(`Health check failed. Error: ${error.message}`);
        } finally {
            logger.info(`Status code health check : ${reply.statusCode}`);
        }
    });
  
    server.get("/health/db", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await reply.code(200).send({ status: "ok"});
        } catch (error: any) {
            logger.error(`Health db check with MongoDB failed. Error: ${error.message}`);
            reply.code(500).send({status: error, error: "Internal Server Error. Accessing route /health/db failed."});
        } finally {
            logger.info(`Status code health db check : ${reply.statusCode}`);
        }
    });

    server.post("/soldiers", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { _id, name, rank, limitations } = request.body as Soldier;

            if (!_id || !name || rank === undefined || !limitations) {
                return await reply.code(400).send({ error: 'Invalid request. Missing required parameters.' });
            }

            if (_id.length !== 7) {
                return await reply.code(400).send({ error: "Invalid _id format. Must be a 7-digit number."});
            }

            if (name.length < 3 || name.length > 50) {
                return await reply.code(400).send({error: "Invalid name length. Must be between 3 and 50 characters."});
            }

            if (!Object.values(rankValueNameDictionary).includes(rank.name)) {
                return await reply.code(400).send(
                    {error: `Invalid rank name. rank name can be only one of the names ${Object.values(rankValueNameDictionary)}`}
                );
            }

            if (rank.value < 0 || rank.value > 6) {
                return await reply.code(400).send({error: "Invalid rank value, rank value must be between 0 and 6."});
            }

            if (Object.values(rankValueNameDictionary).indexOf(rank.name) !== rank.value) {
                return await reply.code(400).send({error: "Rank value and rank name does not match"});
            }

            const lowerCaseLimitations = limitations.map(limitation => limitation.toLowerCase());

            const soldier: Soldier = {
                _id,
                name,
                rank,
                limitations: lowerCaseLimitations,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            addDataToDb(client, "soldiers", soldier);

            await reply.code(201).send(soldier);
        } catch (error: any) {
            await reply.code(500).send({status: error, error: "Internal Server Error. Accessing route /soldiers (creating soldier) failed."});
            logger.error(`Creating a new soldier has failed. Error: ${error.message}`);
        } finally {
            logger.info(`Status code for creating a new soldier : ${reply.statusCode}`);
        }
    });

    server.get("/soldiers/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            const soldier = await getDataFromDb(client, "soldiers", { _id: id });

            if (Object.keys(soldier).length !== 0) {
                await reply.code(200).send({message: `Soldier found!`, data: soldier});
            } else {
                await reply.code(404).send({error : `Soldier not found. Check the length of the id you passed and the id itself.`});
            }
        } catch (error: any) {
            await reply.code(500).send({status: error, error: `Internal Server Error. Accessing route /soldiers/${id} (finding) failed.`});
            logger.error(`Finding soldier by id has failed. Error: ${error.message}`);
        } finally {
            logger.info(`Status code for soldier with the id ${id} is ${reply.statusCode}`);
        }
    });

    server.get("/soldiers", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { name, limitations, rankValue, rankName } = request.query as {
                name?: string;
                limitations?: string; // keep reading the code, it will make sense that limitations is string and not string[]
                rankValue?: number;
                rankName?: string;
            };

            const soldiers = await getDataFromDb(client, "soldiers", {});
            
            const filteredSoldiers = Object.values(soldiers).filter((soldier) => {
                if (name && !soldier.name.toLowerCase().includes(name.toLowerCase())) {
                  return false;
                }

                if (limitations) {
                    const limitationsAsStringArray: string[] = limitations.split(',');
                    if (!limitationsAsStringArray.every((limitation) => soldier.limitations.includes(limitation.toLowerCase()))) {
                        return false;
                    }
                }
        
                if (rankValue !== undefined && soldier.rank.value.toLocaleString() !== rankValue.toLocaleString()) {
                  return false;
                }
        
                if (rankName && soldier.rank.name.toLowerCase() !== rankName.toLowerCase()) {
                  return false;
                }
        
                return true;
            });
    
            await reply.code(200).send({data: filteredSoldiers});
            logger.info(`found soldiers with parameters. The soldiers are : \n${filteredSoldiers}`);
        } catch (error: any) {
            await reply.code(500).send({status: error, error: `Internal Server Error. Accessing route /soldiers via filters failed.`});
            logger.error(`Finding soldiers via filters in route /soldiers failed. Error: ${error.message}`);
        } finally {
            logger.info(`Status code for searching soldiers via filters is ${reply.statusCode}`);
        }
    });

    server.delete("/soldiers/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            const soldier = await getDataFromDb(client, "soldiers", { _id: id });

            if (Object.keys(soldier).length !== 0) {
                await deleteDataFromDb(client, "soldiers", { _id: id });
                await reply.code(204).send();
            } else {
                await reply.code(404).send({error: `There is no soldier with id ${id}`});
            }
        } catch (error: any) {
            await reply.code(500).send({status: error, error: `Internal Server Error. Accessing route /soldiers/${id} (deleting) failed.`});
            logger.error(`Deleting soldier with id ${id} failed. Error: ${error.message}`);
        } finally {
            logger.info(`Status code for deleting soldier with id ${id} is ${reply.statusCode}`);
        }
    });

    server.patch("/soldiers/:id", async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            const updatedSoldier: Partial<Soldier> = request.body as Soldier;

            const soldier = await getDataFromDb(client, "soldiers", { _id: id });

            logger.info(`Soldier type is ${typeof(soldier)}`);

            if (Object.keys(soldier).length === 0) {
                return await reply.status(404).send({ error: 'Soldier not found' });
            }

            let rankIndex: number;

            const soldierSchema = z.object({
                name: z.optional(z.string()),
                limitations: z.optional(z.array(z.string())),
                rank: z.optional(z.object({
                  name: z.string().refine((rankName) => { 
                      rankIndex = Object.values(rankValueNameDictionary).indexOf(rankName);
                      return Object.values(rankValueNameDictionary).includes(rankName); 
                    }),
                  value: z.number().min(0).max(6).refine((rankValue) => { 
                      return rankValue === rankIndex 
                    }),
                }).strict()),
            }).strict();

            if (!soldierSchema.parse(updatedSoldier)) {
                return;
            }

            updateDataInDb(client, "soldiers", {_id : id}, updatedSoldier);
            updateDataInDb(client, "soldiers", {_id: id}, {updatedAt: new Date()});

            const newSoldier = await getDataFromDb(client, "soldiers", {_id: id});
            return await reply.status(200).send(newSoldier);
        } catch (error: any) {
            await reply.code(500).send({status: error, error: `Internal Server Error. Accesing route /soldiers/${id} (patching) failed.`});
        } finally {
            logger.info(`Status code for patching soldier with id ${id} is ${reply.statusCode}`);
        }
    });

    return server;
});

const start = async (server: FastifyInstance) => {
    try {
        await server.listen({ port: Number(config.server_port) });
        logger.info(`Server is running on http://localhost:${config.server_port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

export { createServer, start };