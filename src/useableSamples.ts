import { ObjectId } from "mongodb";

import { type Duty } from "./types/duty.js";
import { type Soldier } from "./types/soldier.js";
import { type justiceBoardElement } from "./types/justice-board.js";

export const dutySample: Duty = {
  _id: new ObjectId("661e187990b90fe6ad9fb4a0"),
  name: "Hagnash",
  description: "Securing arab villages",
  location: {
    type: "Point",
    coordinates: [157.57, 64.54],
  },
  startTime: new Date("2028-04-04T18:45:30.500Z"),
  endTime: new Date("2028-04-11T10:45:30.500Z"),
  minRank: 4,
  maxRank: 4,
  constraints: ["windy", "Dust", "Shabbat closing", "Endurance"],
  soldiersRequired: 1,
  value: 8,
  soldiers: [],
  status: "unscheduled",
  statusHistory: [
    {
      status: "unscheduled",
      date: new Date("2024-04-16T06:19:37.815Z"),
    },
  ],
  createdAt: new Date("2024-04-16T06:19:37.815Z"),
  updatedAt: new Date("2024-04-16T06:19:37.815Z"),
};

export const soldierSample: Soldier = {
  _id: "7654321",
  name: "Maor Krasner",
  rank: {
    name: "colonel",
    value: 6,
  },
  limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  createdAt: new Date("2024-04-16T06:19:37.777Z"),
  updatedAt: new Date("2024-04-16T06:19:37.777Z"),
};

export const justiceBoardSample: justiceBoardElement = {
  _id: "1234567",
  score: 28,
};
