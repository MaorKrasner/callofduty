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

  cloneBasicFilter.unshift({
    $match: {
      _id: id,
    },
  });

  const aggregationArray = await calculateAggregation(cloneBasicFilter);

  return aggregationArray[0].score;
};
