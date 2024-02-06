import { MongoClient, Db } from "mongodb";
import {createServer, start} from "./server";  // Update the import statement
import logger from "./logger"

const mongodbUri: string = process.env.MONGODB_URI || "";
let client: MongoClient;
let db: Db;

const connectToMongoDB = async () => {
    try {
        client = await MongoClient.connect(mongodbUri);
        db = client.db();
        logger.info("Connected to MongoDB");
        return "Connection created";
    } catch (error: any) {
        logger.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};
  
const closeMongoDBConnection = async () => {
    if (client) {
        await client.close();
        logger.info("MongoDB connection closed");
        return "Connection closed";
    }
};

const mysrvr = createServer();
start(mysrvr);

export { connectToMongoDB, closeMongoDBConnection };
