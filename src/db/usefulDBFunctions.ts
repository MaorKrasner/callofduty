import { client } from "./connections.js"
import logger from "../logger.js"
import { deleteOne, findMany, findOne, insertOne, updateOne } from "./operations.js"
import { type Soldier } from "../types/soldier.js";

const soldiersCollectionName = "soldiers";

export const findSoldier = async (id: string) => {
    const soldier = await findOne<Soldier & Document>(client, soldiersCollectionName, {_id : id});
    return soldier as Soldier;
}

export const insertSoldier = async (soldier: Soldier) => {
    const insertionResult = await insertOne<Soldier & Document>(client, soldiersCollectionName, soldier as (Soldier & Document));
    return insertionResult;
}

export const findManySoldiers = async (
    filter: {
        name?: string,
        limitations?: string[],
        rankName?: string,
        rankValue?: number
    }
) => {
    
    const filtersArray: any = [];

    if (filter.name) {
        filtersArray.push({name: filter.name});
    }

    if (filter.limitations) {
        filtersArray.push({limitations: {$all: filter.limitations}});
    }

    if (filter.rankName) {
        filtersArray.push({'rank.name': filter.rankName});
    }

    // Could do if (filter.rankValue) but then the case of '0' won't count (if (0)). This is the solution for all cases from 0 to 6.
    if (filter.hasOwnProperty('rankValue')) {
        filtersArray.push({'rank.value': filter.rankValue});
    }

    const combinedFilter = { $and: filtersArray };
    const soldiers = await findMany<Soldier & Document>(client, soldiersCollectionName, combinedFilter);
    return soldiers as Soldier[];
}

export const deleteSoldier = async (id: string) => {
    const deletionResult = await deleteOne<Soldier & Document>(client, soldiersCollectionName, {_id: id});
    return deletionResult;
}

export const updateSoldier = async (id: string, data: Partial<Soldier>) => {
    const updateResult = await updateOne<Soldier & Document>(client, soldiersCollectionName, {_id : id}, data as (Soldier & Document));
    return updateResult;
}