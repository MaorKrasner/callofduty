import { UpdateFilter } from "mongodb";
import { client } from "../db/connections.js";
import {
  aggregate,
  deleteMany,
  deleteOne,
  findAll,
  findMany,
  findOne,
  insertOne,
  paginate,
  project,
  updateOne,
} from "../db/operations.js";
import { type Soldier } from "../types/soldier.js";

const soldiersCollectionName = "soldiers";

export const findSoldier = async (id: string) => {
  const soldier = await findOne<Soldier & Document>(
    client,
    soldiersCollectionName,
    { _id: id }
  );
  return soldier as Soldier;
};

export const findAllSoldiers = async () => {
  return (await findAll<Soldier & Document>(
    client,
    soldiersCollectionName
  )) as Soldier[];
};

export const insertSoldier = async (soldier: Soldier) => {
  const insertionResult = await insertOne<Soldier & Document>(
    client,
    soldiersCollectionName,
    soldier as Soldier & Document
  );
  return insertionResult;
};

export const findManySoldiers = async (filter: {
  name?: string;
  limitations?: string[];
  rankName?: string;
  rankValue?: number;
}) => {
  const filtersArray: any = [];

  if (filter.name) {
    filtersArray.push({ name: filter.name });
  }

  if (filter.limitations) {
    filtersArray.push({ limitations: { $all: filter.limitations } });
  }

  if (filter.rankName) {
    filtersArray.push({ "rank.name": filter.rankName });
  }

  // Could do if (filter.rankValue) but then the case of '0' won't count (if (0)). This is the solution for all cases from 0 to 6.
  if (
    filter.rankValue?.toString() &&
    filter.rankValue >= 0 &&
    filter.rankValue <= 6
  ) {
    filtersArray.push({ "rank.value": filter.rankValue });
  }

  const combinedFilter = filtersArray.length > 0 ? { $and: filtersArray } : {};
  const soldiers = await findMany<Soldier & Document>(
    client,
    soldiersCollectionName,
    combinedFilter
  );
  return soldiers as Soldier[];
};

export const deleteSoldier = async (id: string) => {
  const deletionResult = await deleteOne<Soldier & Document>(
    client,
    soldiersCollectionName,
    { _id: id }
  );
  return deletionResult;
};

export const deleteAllSoldiers = async () => {
  const deletionResult = await deleteMany<Soldier & Document>(
    client,
    soldiersCollectionName,
    {}
  );
  return deletionResult;
};

export const updateSoldier = async (id: string, data: Partial<Soldier>) => {
  const updateResult = await updateOne<Soldier & Document>(
    client,
    soldiersCollectionName,
    { _id: id },
    { $set: { ...data, updatedAt: new Date() } } as UpdateFilter<
      Soldier & Document
    >
  );

  return updateResult.modifiedCount > 0 ? await findSoldier(id) : undefined;
};

export const sortSoldiersWithFilter = async (sort: string, order: string) => {
  const sortOrderAsNumber = order === "ascend" ? 1 : -1;
  const sortedSoldiers = await aggregate<Soldier & Document>(
    client,
    soldiersCollectionName,
    [{ $sort: { [sort]: sortOrderAsNumber } }]
  );

  return sortedSoldiers as Soldier[];
};

export const filterSoldiers = async (
  field: string,
  operator: string,
  value: number
) => {
  const findResult = await findMany<Soldier & Document>(
    client,
    soldiersCollectionName,
    { [field]: { [operator]: value } }
  );

  return findResult as Soldier[];
};

export const skipSoldiers = async (startIndex: number, limit: number) => {
  const soldiersAfterSkipping = await paginate<Soldier & Document>(
    client,
    soldiersCollectionName,
    startIndex,
    limit
  );

  return soldiersAfterSkipping as Soldier[];
};

export const soldiersProjection = async (projection: {
  [key: string]: 0 | 1;
}) => {
  const soldiersAfterProjection = await project<Soldier & Document>(
    client,
    soldiersCollectionName,
    projection
  );

  return soldiersAfterProjection as Partial<Soldier>[];
};
