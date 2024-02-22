import { ObjectId } from "mongodb";

import { client } from "./connections.js";
import {
  deleteOne,
  findMany,
  findOne,
  insertOne,
  updateOne,
} from "./operations.js";
import { type Duty } from "../types/duty.js";

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

export const deleteDuty = async (id: string) => {
  const deletionResult = await deleteOne<Duty & Document>(
    client,
    dutiesCollectionName,
    { _id: new ObjectId(id) }
  );
  return deletionResult;
};

export const updateDuty = async (id: string, data: Partial<Duty>) => {
  const updatedResult = await updateOne<Duty & Document>(
    client,
    dutiesCollectionName,
    { _id: new ObjectId(id) },
    data as Duty & Document
  );
  return updatedResult;
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
}) => {
  const filtersArray: any = [];

  if (filter.name) {
    filtersArray.push({ name: name });
  }

  if (filter.location) {
    filtersArray.push({ "location.coordinates": { $all: location } });
  }

  if (filter.startTime) {
    const timeAsString = new Date(filter.startTime).toISOString();
    filtersArray.push({ startTime: timeAsString });
  }

  if (filter.endTime) {
    const timeAsString = new Date(filter.endTime).toISOString();
    filtersArray.push({ endTime: timeAsString });
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

  const combinedFilter = { $and: filtersArray };
  const duties = await findMany<Duty & Document>(
    client,
    dutiesCollectionName,
    combinedFilter
  );
  return duties as Duty[];
};
