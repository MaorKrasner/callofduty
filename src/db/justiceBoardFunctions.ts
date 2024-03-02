import { client } from "./connections.js";
import type { Duty } from "../types/duty.js";
import { aggregate } from "./operations.js";
import type { justiceBoardElement } from "../types/justice-board.js";

const dutiesCollectionName = "duties";

export const aggregateJusticeBoard = async () => {
    const filter = [
        {
            $match: {
                soldiers: { $exists: true, $not: { $size: 0 } }
            }
        },
        {
            $unwind: "$soldiers"
        },
        {
            $lookup: {
                from: "soldiers",
                localField: "soldiers",
                foreignField: "_id",
                as: "soldierInfo"
            }
        },
        {
            $unwind: "$soldierInfo"
        },
        {
            $project: {
                soldierId: "$soldierInfo._id",
                dutyValue: "$value"
            }
        },
        {
            $group: {
                _id: "$soldierId",
                totalDutyValue: { $sum: "$dutyValue" }
            }
        }
    ]
  
    const aggregationArray = await aggregate<Duty & Document>(
      client,
      dutiesCollectionName,
      filter
    );
  
    return aggregationArray as justiceBoardElement[];
};

export const aggregateJusticeBoardById = async (id: string) => {
    const filter = [
        {
            $match: {
                soldiers: id
            }
        },
        {
            $unwind: "$soldiers"
        }
    ];

    const aggregationArray = await aggregate<Duty & Document>(
      client,
      dutiesCollectionName,
      filter
    ) as justiceBoardElement[];

    return aggregationArray[0].score;
};