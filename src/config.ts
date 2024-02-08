import * as dotenv from "dotenv";
import "dotenv/config";

if (['test', 'dev'].includes(process.env.NODE_ENV!)) dotenv.config({path: `.${process.env.NODE_ENV}.env`})

const config  = { server_port: process.env.SERVER_PORT, mongo_uri: process.env.MONGO_URI || ''}; 

export default config; 