"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeMongoDBConnection = exports.connectToMongoDB = void 0;
const mongodb_1 = require("mongodb");
const server_1 = require("./server"); // Update the import statement
const logger_1 = __importDefault(require("./logger"));
const mongodbUri = process.env.MONGODB_URI || "";
let client;
let db;
const connectToMongoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        client = yield mongodb_1.MongoClient.connect(mongodbUri);
        db = client.db();
        logger_1.default.info("Connected to MongoDB");
        return "Connection created";
    }
    catch (error) {
        logger_1.default.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
});
exports.connectToMongoDB = connectToMongoDB;
const closeMongoDBConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    if (client) {
        yield client.close();
        logger_1.default.info("MongoDB connection closed");
        return "Connection closed";
    }
});
exports.closeMongoDBConnection = closeMongoDBConnection;
const mysrvr = (0, server_1.createServer)();
(0, server_1.start)(mysrvr);
