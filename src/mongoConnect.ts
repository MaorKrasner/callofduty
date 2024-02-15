import { MongoClient } from "mongodb";
import logger from "./logger.js"
import config from "./config.js";

const mongodbUri: string = config.mongo_uri;

const dbName: string = config.mongo_db_name;

let client: MongoClient;

export const connectToMongoDB = async () => {
    try {
        client = new MongoClient(mongodbUri);
        await client.connect();
        const db = client.db();
        logger.info("Connected to MongoDB");
    } catch (error: any) {
        logger.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};
  
export const closeMongoDBConnection = async (client: MongoClient) => {
    if (client) {
        await client.close();
        logger.info("MongoDB connection closed");
        return "Connection closed";
    }
    return "Connection failed to close"
};

export const addDataToDb = async (client: MongoClient, collectionName: string, data: any) => {
    return await client.db(dbName).collection(collectionName).insertOne(data);
};

export const deleteDataFromDb = async (client: MongoClient, collectionName: string, filter: any) => {
    await client.db(dbName).collection(collectionName).deleteOne(filter);
};

export const getDataFromDb = async (client: MongoClient, collectionName: string, filter: any) => {
    return await client.db(dbName).collection(collectionName).find(filter).toArray();
};

export const updateDataInDb = async (client: MongoClient, collectionName: string, filter: any, update: any) => {
    return await client.db(dbName).collection(collectionName).updateOne(filter, { $set: update });
};

export { client }