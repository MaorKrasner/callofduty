import * as dotenv from "dotenv";
import "dotenv/config";

if (['test', 'dev'].includes(process.env.NODE_ENV!)) dotenv.config({path: `.${process.env.NODE_ENV}.env`})

const config = { 
    serverPort: process.env.SERVER_PORT!,
    dbUri: process.env.DB_URI!,
    dbName: process.env.DB_NAME!
};

export const validateConfig = () => {
    let isValid = true;
    for (const key in config) {
        if (!key) {
            isValid = false;
        }
    }
    return isValid;
}

export default config; 