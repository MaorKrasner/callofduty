import { validateConfig } from "./config.js";
import { connectToDB } from "./db/connections.js";
import {createServer, start} from "./server.js";

export const initialize = async () => {
    validateConfig();

    await connectToDB();

    const server = await createServer();
    start(server);

    return server;
}

initialize();