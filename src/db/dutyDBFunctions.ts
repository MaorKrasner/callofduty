import { ObjectId } from "mongodb"

import { client } from "./connections.js"
import { deleteOne, findMany, findOne, insertOne, updateOne } from "./operations.js"
import { type Duty } from "../types/duty.js"

const dutiesCollectionName = "duties";

export const insertDuty = async (duty: Duty) => {
    const insertionResult = await insertOne<Duty & Document>(client, dutiesCollectionName, duty as (Duty & Document));
    return insertionResult;
};

export const findDuty = async (id: string) => {
    const duty = await findOne<Duty & Document>(client, dutiesCollectionName, {_id: new ObjectId(id)});
    return duty as Duty;
};

export const isDutyExists = async (id: string) => {
    const duty = await findDuty(id);
    return duty !== null;
};

export const deleteDuty = async (id: string) => {
    const deletionResult = await deleteOne<Duty & Document>(client, dutiesCollectionName, {_id: new ObjectId(id)});
    return deletionResult;
};

export const findManyDuties = async (
    name: string | undefined,
    location: number[] | undefined,
    startTime: Date | undefined,
    endTime: Date | undefined,
    constraints: string[] | undefined,
    soldiersRequired: number | undefined,
    value: number | undefined,
    minRank: number | undefined,
    maxRank: number | undefined
) => {
    const filtersArray: any = [];

    if (name) {
        filtersArray.push({name: name});
    }

    if (location) {
        filtersArray.push({'location.coordinates': {$all: location}});
    }

    if (startTime) {
        const timeAsString = new Date(startTime).toISOString();
        filtersArray.push({startTime: timeAsString});
    }

    if (endTime) {
        const timeAsString = new Date(endTime).toISOString();
        filtersArray.push({endTime: timeAsString});
    }

    if (constraints) {
        filtersArray.push({constraints: {$all: constraints}});
    }

    if (soldiersRequired) {
        filtersArray.push({soldiersRequired: parseInt(String(soldiersRequired))});
    }

    if (value) {
        filtersArray.push({value: parseInt(String(value))});
    }

    if (minRank) {
        filtersArray.push({minRank: parseInt(String(minRank))});
    }

    if (maxRank) {
        filtersArray.push({maxRank: parseInt(String(maxRank))});
    }

    const combinedFilter = {$and : filtersArray};
    const duties = await findMany<Duty & Document>(client, dutiesCollectionName, combinedFilter);
    return duties as Duty[];
};