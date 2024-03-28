import { type Soldier } from "../../src/types/soldier.js";

import { type Duty } from "../../src/types/duty.js"

export const justiceBoardTestSoldier: Partial<Soldier> = {
  _id: "4567810",
  name: "Test man",
  rank: { name: "sergeant", value: 2 },
  limitations: ["beard", "hair", "hatash7"],
};

export const secondJusticeBoardTestSoldier: Partial<Soldier> = {
  _id: "5453744",
  name: "Second test man",
  rank: { name: "major", value: 5 },
  limitations: ["hair"],
};

export const justiceBoardTestDuty: Partial<Duty> = {
  name: "Justice board test duty",
  description: "Duty for justice board tests to check score",
  location: {
    type: "Point",
    coordinates: [123.78, 98.46]
  },
  startTime: new Date("2024-04-27T12:30:00.000Z"),
  endTime: new Date("2024-04-30T12:30:00.000Z"),
  minRank: 0,
  maxRank: 6,
  constraints: [],
  soldiersRequired: 2,
  value: 15
};

export const secondJusticeBoardTestDuty: Partial<Duty> = {
  name: "Justice board second test duty",
  description: "Second duty for justice board tests to check score",
  location: {
    type: "Point",
    coordinates: [1568.08, 948.45]
  },
  startTime: new Date("2024-05-14T12:30:00.000Z"),
  endTime: new Date("2024-05-18T12:30:00.000Z"),
  minRank: 0,
  maxRank: 6,
  constraints: [],
  soldiersRequired: 5,
  value: 20
};