import { client } from "../db/connections.js";
import { aggregate } from "../db/operations.js";
import type { justiceBoardElement } from "../types/justice-board.js";

const soldiersCollectionName = "soldiers";

export const aggregateJusticeBoard = async () => {
  const filter: Object[] = [
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

  const aggregationArray = await aggregate<justiceBoardElement & Document>(
    client,
    soldiersCollectionName,
    filter
  );

  return aggregationArray as justiceBoardElement[];
};

export const aggregateJusticeBoardById = async (id: string) => {
  const aggregationArray = await aggregateJusticeBoard();
  const idArray = aggregationArray.map((element) => element._id);
  const scoreArray = aggregationArray.map((element) => element.score);

  return scoreArray[idArray.indexOf(id)];
};
