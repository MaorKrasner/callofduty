import {createServer, start} from "./server.js";
import { connectToMongoDB } from "./mongoConnect.js";


await connectToMongoDB();

const server = createServer();
start(server);

