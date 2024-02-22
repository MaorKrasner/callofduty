import { ObjectId } from "mongodb"

import { client } from "./connections.js"
import { deleteOne, findMany, findOne, insertOne, updateOne } from "./operations.js"
import { type Duty } from "../types/duty.js"

const dutiesCollectionName = "duties";

export const insertDuty = async (duty: Duty) => {
    const insertionResult = await insertOne<Duty & Document>(client, dutiesCollectionName, duty as (Duty & Document));
    return insertionResult;
};

export const findDuty = async (id: ObjectId) => {
    const duty = await findOne<Duty & Document>(client, dutiesCollectionName, {_id: id});
    return duty as Duty;
}

export const isDutyExists = async (id: ObjectId) => {
    const duty = await findDuty(id);
    return duty !== null;
}