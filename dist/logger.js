"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const logLevel = process.env.LOG_LEVEL || 'info';
const isTestEnvironment = process.env.NODE_ENV === 'test';
const isDevEnvironment = process.env.NODE_ENV === 'development';
const logger = (0, pino_1.default)(Object.assign({ level: isTestEnvironment ? 'silent' : logLevel }, (isDevEnvironment ?
    { prettyPrint: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss"
        } }
    : {})));
pino_1.default.destination("./pino-logger.log");
exports.default = logger;
