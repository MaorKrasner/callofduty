import { client } from "./connections.js";
import type { Duty } from "../types/duty.js";
import { aggregate } from "./operations.js";
import type { justiceBoardElement } from "../types/justice-board.js";

const dutiesCollectionName = "duties";

export const aggregateJusticeBoard = async () => {
  const filter: Object[] = [
    {
      $unwind: "$soldiers",
    },
    {
      $group: {
        _id: "$soldiers",
        score: { $sum: "$value" },
      },
    },
    {
      $lookup: {
        from: "soldiers",
        localField: "_id",
        foreignField: "_id",
        as: "soldierDetails",
      },
    },
    {
      $unwind: "$soldierDetails",
    },
    {
      $project: {
        _id: "$soldierDetails._id",
        score: "$score",
      },
    },
  ];

  const aggregationArray = await aggregate<justiceBoardElement & Document>(
    client,
    dutiesCollectionName,
    filter
  );

  return aggregationArray as justiceBoardElement[];
};

export const aggregateJusticeBoardById = async (id: string) => {
  const aggregationArray = await aggregateJusticeBoard();
  const idArray = aggregationArray.map((element) => element._id);
  const scoreArray = aggregationArray.map((element) => element.score);

  return !idArray.includes(id) ? 0 : scoreArray[idArray.indexOf(id)];
};
