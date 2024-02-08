import { MongoClient, Db } from "mongodb";
import logger from "./logger"
import config from "./config";

const mongodbUri: string = config.mongo_uri;

const connectToMongoDB = async () => {
    try {
        const client = new MongoClient(mongodbUri);
        await client.connect();
        const db = client.db();
        logger.info("Connected to MongoDB");
        return { db, client };
    } catch (error: any) {
        logger.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};
  
const closeMongoDBConnection = async (client: MongoClient) => {
    if (client) {
        await client.close();
        logger.info("MongoDB connection closed");
        return "Connection closed";
    }
    return "Connection failed to close"
};

export { connectToMongoDB, closeMongoDBConnection };