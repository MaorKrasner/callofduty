import { client } from "../db/connections.js";
import { aggregate } from "../db/operations.js";
import type { justiceBoardElement } from "../types/justice-board.js";

const soldiersCollectionName = "soldiers";

const basicFilter: Object[] = [
  {
    $lookup: {
      from: "duties",
      localField: "_id",
      foreignField: "soldiers",
      as: "duties",
    },
  },
  {
    $unwind: {
      path: "$duties",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $group: {
      _id: "$_id",
      score: { $sum: { $ifNull: ["$duties.value", 0] } },
    },
  },
  {
    $project: {
      _id: 1,
      score: 1,
    },
  },
];

const calculateAggregation = async (filter: Object[]) => {
  const aggregationArray = await aggregate<justiceBoardElement & Document>(
    client,
    soldiersCollectionName,
    filter
  );

  return aggregationArray as justiceBoardElement[];
};

export const aggregateJusticeBoard = async () => {
  return await calculateAggregation(basicFilter);
};

export const aggregateJusticeBoardById = async (id: string) => {
  const cloneBasicFilter = Array.from(basicFilter);

  cloneBasicFilter.push({
    $match: {
      _id: id,
    },
  });

  const aggregationArray = await calculateAggregation(cloneBasicFilter);

  return aggregationArray[0].score;
};

export const filterJusticeBoardByQuery = async (
  operator: string,
  value: number
) => {
  const cloneBasicFilter = Array.from(basicFilter);

  cloneBasicFilter.push({
    $match: {
      score: { [operator]: value },
    },
  });

  const aggregationArray = await calculateAggregation(cloneBasicFilter);

  return aggregationArray;
};

export const projectJusticeBoardByQuery = async (projection: {
  [key: string]: 0 | 1;
}) => {
  const cloneBasicFilter = Array.from(basicFilter);

  cloneBasicFilter.pop();
  cloneBasicFilter.push({
    $project: projection,
  });

  const aggregationArray = await calculateAggregation(cloneBasicFilter);

  return aggregationArray;
};

export const populateJusticeBoardByQuery = async () => {
  const cloneBasicFilter = Array.from(basicFilter);

  cloneBasicFilter.push({
    $lookup: {
      from: "soldiers",
      localField: "_id",
      foreignField: "_id",
      as: "soldier",
    },
  });

  const aggregationArray = await calculateAggregation(cloneBasicFilter);

  return aggregationArray;
};
