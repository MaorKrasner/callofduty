import { type Soldier } from "../../src/types/soldier.js";

import { type Duty } from "../../src/types/duty.js";

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
    coordinates: [32.0853, 34.7818],
  },
  startTime: new Date("2024-04-27T12:30:00.000Z"),
  endTime: new Date("2024-04-30T12:30:00.000Z"),
  minRank: 0,
  maxRank: 6,
  constraints: [],
  soldiersRequired: 2,
  value: 15,
};

export const secondJusticeBoardTestDuty: Partial<Duty> = {
  name: "Justice board second test duty",
  description: "Second duty for justice board tests to check score",
  location: {
    type: "Point",
    coordinates: [32.0853, 34.7818],
  },
  startTime: new Date("2024-05-14T12:30:00.000Z"),
  endTime: new Date("2024-05-18T12:30:00.000Z"),
  minRank: 0,
  maxRank: 6,
  constraints: [],
  soldiersRequired: 5,
  value: 20,
};

export const justiceBoardSortingUrlsDictionary: [string, string][] = [
  ["justice-board?sort=score", "200"],
  ["justice-board?sort=sc", "400"],
  ["justice-board?srt=score", "400"],
  ["justice-board?srt=sc", "400"],
  ["justice-board?sort=score&order=desc", "200"],
  ["justice-board?sort=score&order=ascend", "200"],
  ["justice-board?sort=score&order=d", "400"],
  ["justice-board?sort=score&order=a", "400"],
  ["justice-board?sort=score&ord=desc", "400"],
  ["justice-board?sort=score&ord=ascend", "400"],
];

export const justiceBoardFilteringUrlsDictionary: [string, string][] = [
  ["justice-board?filter=score>1", "200"],
  ["justice-board?filter=score<0", "200"], // []
  ["justice-board?filter=sc>1", "400"],
  ["justice-board?filter=sc<1", "400"],
  ["justice-board?filt=score>1", "400"],
  ["justice-board?filt=sc>1", "400"],
];

export const justiceBoardPaginationUrlsDictionary: [string, string][] = [
  ["justice-board?page=1&limit=2", "200"],
  ["justice-board?page=10000&limit=2", "200"], // []
  ["justice-board?page=-3&limit=2", "400"],
  ["justice-board?page=8cb&limit=2", "400"],
  ["justice-board?page=&limit=2", "400"],
  ["justice-board?pa=1&limit=2", "400"],
  ["justice-board?page=1&lim=3", "400"],
];

export const justiceBoardProjectionUrlsDictionary: [string, string][] = [
  ["justice-board?select=score", "200"],
  ["justice-board?select=scoreeee", "400"],
  ["justice-board?sel=sco", "400"],
  ["justice-board?sel=score", "400"],
];

export const justiceBoardPopulationUrlsDictionary: [string, string][] = [
  ["justice-board?populate=_id", "200"],
  ["justice-board?populate=id", "400"],
  ["justice-board?pop=_id", "400"],
  ["justice-board?pop=id", "400"],
];
