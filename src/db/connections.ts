import { MongoClient } from "mongodb";

import config from "../config.js";
import logger from "../logger.js";

const dbUri: string = config.dbUri;

let client: MongoClient;

export const connectToDB = async () => {
  try {
    client = new MongoClient(dbUri);
    await client.connect();
    logger.info("Connected to MongoDB");
  } catch (error: any) {
    logger.error(error, "Error connecting to DB:");
    process.exit(1);
  }
};

export const closeDBConnection = async () => {
  await client.close();
  logger.info("MongoDB connection closed");
  return "Connection closed";
};

logger.info(`This is ${dbUri}`);

export { client };
