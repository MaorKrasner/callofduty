import { ObjectId, UpdateFilter } from "mongodb";

import { client } from "../db/connections.js";
import {
  deleteMany,
  deleteOne,
  findAll,
  findMany,
  findOne,
  insertOne,
  updateOne,
} from "../db/operations.js";
import { type Duty } from "../types/duty.js";
import logger from "../logger.js";

const dutiesCollectionName = "duties";

export const insertDuty = async (duty: Duty) => {
  const insertionResult = await insertOne<Duty & Document>(
    client,
    dutiesCollectionName,
    duty as Duty & Document
  );
  return insertionResult;
};

export const findDuty = async (id: string) => {
  const duty = await findOne<Duty & Document>(client, dutiesCollectionName, {
    _id: new ObjectId(id),
  });
  return duty as Duty;
};

export const findAllDuties = async () => {
  return (await findAll<Duty & Document>(
    client,
    dutiesCollectionName
  )) as Duty[];
};

export const deleteDuty = async (id: string) => {
  const deletionResult = await deleteOne<Duty & Document>(
    client,
    dutiesCollectionName,
    { _id: new ObjectId(id) }
  );
  return deletionResult;
};

export const deleteAllDuties = async () => {
  const deletionResult = await deleteMany<Duty & Document>(
    client,
    dutiesCollectionName,
    {}
  );
  return deletionResult;
};

export const updateDuty = async (id: string, data: Partial<Duty>) => {
  const updatedResult = await updateOne<Duty & Document>(
    client,
    dutiesCollectionName,
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } } as UpdateFilter<
      Duty & Document
    >
  );

  return updatedResult.modifiedCount > 0 ? await findDuty(id) : undefined;
};

export const findManyDuties = async (filter: {
  name?: string;
  location?: number[];
  startTime?: Date;
  endTime?: Date;
  constraints?: string[];
  soldiersRequired?: number;
  value?: number;
  minRank?: number;
  maxRank?: number;
  soldiers?: string[];
}) => {
  const filtersArray: any = [];

  if (filter.name) {
    filtersArray.push({ name: filter.name });
  }

  if (filter.location) {
    filtersArray.push({
      "location.coordinates": { $all: filter.location },
    });
  }

  if (filter.soldiers) {
    filtersArray.push({
      soldiers: { $all: filter.soldiers },
    });
  }

  if (filter.startTime) {
    filtersArray.push({ startTime: filter.startTime });
  }

  if (filter.endTime) {
    filtersArray.push({ endTime: filter.endTime });
  }

  if (filter.constraints) {
    filtersArray.push({ constraints: { $all: filter.constraints } });
  }

  if (filter.soldiersRequired) {
    filtersArray.push({
      soldiersRequired: parseInt(String(filter.soldiersRequired)),
    });
  }

  if (filter.value) {
    filtersArray.push({ value: parseInt(String(filter.value)) });
  }

  if (filter.minRank) {
    filtersArray.push({ minRank: parseInt(String(filter.minRank)) });
  }

  if (filter.maxRank) {
    filtersArray.push({ maxRank: parseInt(String(filter.maxRank)) });
  }

  const combinedFilter = filtersArray.length > 0 ? { $and: filtersArray } : {};
  const duties = await findMany<Duty & Document>(
    client,
    dutiesCollectionName,
    combinedFilter
  );
  return duties as Duty[];
};

export const addConstraintsToDuty = async (
  id: string,
  constraintsToAdd: string[]
) => {
  const updatedResult = await updateOne<Duty & Document>(
    client,
    dutiesCollectionName,
    { _id: new ObjectId(id) },
    {
      $addToSet: { constraints: { $each: constraintsToAdd } },
      $set: { updatedAt: new Date() },
    } as UpdateFilter<Duty & Document>
  );

  return updatedResult.modifiedCount > 0 ? await findDuty(id) : undefined;
};
