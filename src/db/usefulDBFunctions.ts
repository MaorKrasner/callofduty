import { client } from "./connections.js"
import logger from "../logger.js"
import { deleteOne, findMany, findOne, insertOne, updateOne } from "./operations.js"
import { type Soldier } from "../types/soldier.js";

const soldiersCollectionName = "soldiers";
const dutiesCollectionName = "duties";

export const findSoldier = async (id: string) => {
    const soldier = await findOne<Soldier & Document>(client, soldiersCollectionName, {_id : id});
    return soldier as Soldier;
}

export const isSoldierExists = async (id: string) => {
    const soldier = await findSoldier(id);
    return soldier !== null;
}

export const insertSoldier = async (soldier: Soldier) => {
    const insertionResult = await insertOne<Soldier & Document>(client, soldiersCollectionName, soldier as (Soldier & Document));
    return insertionResult;
}

export const findManySoldiers = async (
    name: string | undefined,
    limitations: string[] | undefined,
    rankName: string | undefined,
    rankValue: number | undefined
    ) => {
    
    const filtersArray: any = [];

    if (name) {
        filtersArray.push({name: name});
    }

    if (limitations) {
        filtersArray.push({limitations: {$all: limitations}});
    }

    if (rankName) {
        filtersArray.push({'rank.name': rankName});
    }

    if (rankValue) {
        filtersArray.push({'rank.value': rankValue});
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