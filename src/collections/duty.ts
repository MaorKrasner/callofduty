import { ObjectId, UpdateFilter } from "mongodb";

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
import { type Duty } from "../types/duty.js";
import config from "../config.js";

const dbName: string = config.dbName;

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
  description?: string;
  status?: string;
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

  if (filter.description) {
    filtersArray.push({ description: filter.description });
  }

  if (filter.status) {
    filtersArray.push({ status: filter.status });
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

export const sortDutiesWithFilter = async (sort: string, order: string) => {
  const sortOrderAsNumber = order === "ascend" ? 1 : -1;
  const sortedDuties = await aggregate<Duty & Document>(
    client,
    dutiesCollectionName,
    [{ $sort: { [sort]: sortOrderAsNumber } }]
  );

  return sortedDuties as Duty[];
};

export const filterDuties = async (
  field: string,
  operator: string,
  value: number
) => {
  const findResult = await findMany<Duty & Document>(
    client,
    dutiesCollectionName,
    { [field]: { [operator]: value } }
  );

  return findResult as Duty[];
};

export const skipDuties = async (startIndex: number, limit: number) => {
  const dutiesAfterSkipping = await paginate<Duty & Document>(
    client,
    dutiesCollectionName,
    startIndex,
    limit
  );

  return dutiesAfterSkipping as Duty[];
};

export const dutiesProjection = async (projection: {
  [key: string]: 0 | 1;
}) => {
  const dutiesAfterProjection = await project<Duty & Document>(
    client,
    dutiesCollectionName,
    projection
  );

  return dutiesAfterProjection as Partial<Duty>[];
};

export const findNearDutiesByQuery = async (
  coordinates: number[],
  radius: number
) => {
  await client
    .db(dbName)
    .collection<Duty>(dutiesCollectionName)
    .createIndex({ location: "2dsphere" });
  const nearQuery = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [coordinates[0], coordinates[1]],
        },
        $maxDistance: radius,
      },
    },
  };

  const duties = await findMany<Duty & Document>(
    client,
    dutiesCollectionName,
    nearQuery
  );

  return duties as Duty[];
};

export const populateDutiesByQuery = async () => {
  const query = [
    {
      $lookup: {
        from: "soldiers",
        localField: "soldiers",
        foreignField: "_id",
        as: "soldiers",
      },
    },
  ];

  const result = await aggregate<Duty & Document>(
    client,
    dutiesCollectionName,
    query
  );

  return result as Duty[];
};

export const getDutiesByQuery = async (query: Object[]) => {
  await client
    .db(dbName)
    .collection<Duty>(dutiesCollectionName)
    .createIndex({ location: "2dsphere" });

  const result = await aggregate<Duty & Document>(
    client,
    dutiesCollectionName,
    query
  );

  return result as Partial<Duty>[];
};
