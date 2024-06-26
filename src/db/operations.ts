import {
  Filter,
  MongoClient,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from "mongodb";

import config from "../config.js";

const dbName: string = config.dbName;

export const insertOne = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  data: P
) => {
  return client
    .db(dbName)
    .collection<P>(collectionName)
    .insertOne(data as OptionalUnlessRequiredId<P>);
};

export const deleteOne = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>
) => {
  return client.db(dbName).collection<P>(collectionName).deleteOne(filter);
};

export const deleteMany = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>
) => {
  return client.db(dbName).collection<P>(collectionName).deleteMany(filter);
};

export const findOne = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>
) => {
  return client.db(dbName).collection<P>(collectionName).findOne(filter);
};

export const findMany = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>
) => {
  return client.db(dbName).collection<P>(collectionName).find(filter).toArray();
};

export const findAll = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string
) => {
  return await client
    .db(dbName)
    .collection<P>(collectionName)
    .find({})
    .toArray();
};

export const updateOne = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>,
  update: UpdateFilter<P>
) => {
  return client
    .db(dbName)
    .collection<P>(collectionName)
    .updateOne(filter, update);
};

export const updateMany = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>,
  update: P
) => {
  return client
    .db(dbName)
    .collection<P>(collectionName)
    .updateMany(filter, { $set: update });
};

export const aggregate = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  filter: Filter<P>[]
) => {
  return await client
    .db(dbName)
    .collection<P>(collectionName)
    .aggregate(filter)
    .toArray();
};

export const paginate = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  startIndex: number,
  limitNumber: number
) => {
  return await client
    .db(dbName)
    .collection<P>(collectionName)
    .find()
    .skip(startIndex)
    .limit(limitNumber)
    .toArray();
};

export const project = async <P extends Document = Document>(
  client: MongoClient,
  collectionName: string,
  query: Object
) => {
  return await client
    .db(dbName)
    .collection<P>(collectionName)
    .find({})
    .project(query)
    .toArray();
};
