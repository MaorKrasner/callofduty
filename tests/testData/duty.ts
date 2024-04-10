import { Duty } from "../../src/types/duty";

export const postWorkingPayload: Partial<Duty> = {
  name: "attacking iran",
  description: "attacking iran's nuclear factories",
  location: {
    type: "Point",
    coordinates: [54.9, 89.27],
  },
  startTime: new Date("2024-05-14T18:45:30.500Z"),
  endTime: new Date("2024-05-17T14:45:30.500Z"),
  value: 15,
  constraints: ["big area", "massive attack", "secret operation"],
  soldiersRequired: 410,
  minRank: 3,
  maxRank: 6,
};

export const testPostWorkingPayload: Partial<Duty> = {
  name: "attacking gaza",
  description: "attacking gaza's rocket factories",
  location: {
    type: "Point",
    coordinates: [54.9, 23.33],
  },
  startTime: new Date("2024-06-27T09:00:30.500Z"),
  endTime: new Date("2024-06-30T12:00:30.500Z"),
  value: 20,
  constraints: ["massive attack", "secret operation", "big explosions"],
  soldiersRequired: 200,
  minRank: 1,
  maxRank: 6,
};

export const dutyInPast: Partial<Duty> = {
  name: "Duty in the past",
  description: "Test duty for past times",
  location: {
    type: "Point",
    coordinates: [27.54, 9.63],
  },
  startTime: new Date("2024-03-30T09:00:30.500Z"),
  endTime: new Date("2024-03-31T09:00:30.500Z"),
  value: 5,
  constraints: ["dust"],
  soldiersRequired: 10,
  minRank: 1,
  maxRank: 6,
};

export const secondTestPostWorkingPayload: Partial<Duty> = {
  name: "attacking gaza 2.0",
  description: "attacking gaza's terrorists",
  location: {
    type: "Point",
    coordinates: [74.9, 76.33],
  },
  startTime: new Date("2024-04-15T10:00:30.500Z"),
  endTime: new Date("2024-05-20T14:00:30.500Z"),
  value: 25,
  constraints: ["massive attack", "secret operation", "big explosions"],
  soldiersRequired: 130,
  minRank: 1,
  maxRank: 6,
};

export const cancelledDutyPayload: Partial<Duty> = {
  name: "schedule test 2",
  description: "schedule test 2 - cancelled duty",
  location: {
    type: "Point",
    coordinates: [14.7, 6.33],
  },
  startTime: new Date("2024-04-15T10:00:30.500Z"),
  endTime: new Date("2024-05-20T14:00:30.500Z"),
  value: 25,
  constraints: ["massive attack", "secret operation", "big explosions"],
  soldiersRequired: 130,
  minRank: 1,
  maxRank: 6,
};

export const scheduleDutyPayload: Partial<Duty> = {
  name: "schedule test",
  description: "schedule test duty",
  location: {
    type: "Point",
    coordinates: [14.7, 6.33],
  },
  startTime: new Date("2024-04-15T10:00:30.500Z"),
  endTime: new Date("2024-05-20T14:00:30.500Z"),
  value: 10,
  constraints: ["massive attack", "secret operation"],
  soldiersRequired: 20,
  minRank: 1,
  maxRank: 6,
};

export const cancelDutyPayload: Partial<Duty> = {
  name: "cancel test",
  description: "cancel test duty",
  location: {
    type: "Point",
    coordinates: [14.7, 6.33],
  },
  startTime: new Date("2024-04-15T10:00:30.500Z"),
  endTime: new Date("2024-05-20T14:00:30.500Z"),
  value: 10,
  constraints: ["massive attack"],
  soldiersRequired: 20,
  minRank: 1,
  maxRank: 6,
};

export const putPayload = {
  constraints: ["big area", "windy", "shabbat closing"],
};

export const patchPayload = {
  soldiersRequired: 50,
};

export const notWorkingPatchPayload = {
  amount: 4,
};

export const notFoundDutyId = Array(24).fill("0").join("");

export const notWorkingUrlParameter = "lim=abc";

export const dutySortingUrlsDictionary: [string, string][] = [
  ["duties?sort=value", "200"],
  ["duties?sort=val", "400"],
  ["duties?sort=value&order=desc", "200"],
  ["duties?sort=val&order=desc", "400"],
  ["duties?sort=value&order=asc", "400"],
  ["duties?sort=val&order=asc", "400"],
  ["duties?sort=value&order=ascend", "200"],
  ["duties?sort=value&ord=desc", "400"],
];

export const dutyFilteringUrlsDictionary: [string, string][] = [
  ["duties?filter=minRank>1", "200"],
  ["duties?filter=minRank<=1", "200"],
  ["duties?filter=maxRank>6", "200"], // []
  ["duties?filter=soldiersRequired=-1", "200"], // []
  ["duties?filter=soldiersRequired=1", "200"],
  ["duties?filter=value=8", "200"],
  ["duties?filter=value>200", "200"], // []
  ["duties?filter=val=4", "400"],
  ["duties?filt=minRank>1", "400"],
  ["duties?filter=rank.value>=8c", "400"],
];

export const dutyPaginationUrlsDictionary: [string, string][] = [
  ["duties?page=1&limit=1", "200"],
  ["duties?page=1000&limit=5", "200"], // []
  ["duties?page=8cb&limit=2", "400"],
  ["duties?page=&limit=2", "400"],
  ["duties?pa=1&limit=2", "400"],
  ["duties?page=-3&limit=2", "400"],
];

export const dutyProjectionUrlsDictionary: [string, string][] = [
  ["duties?select=name", "200"],
  ["duties?select=nameeeeee", "400"],
  ["duties?sel=name", "400"],
];

export const dutyPopulationUrlsDictionary: [string, string][] = [
  ["duties?populate=soldiers", "200"],
  ["duties?populate=solds", "400"],
  ["duties?pop=soldiers", "400"],
  ["duties?pop=solds", "400"],
];

export const dutyGeoQueriesUrlsDictionary: [string, string][] = [
  ["duties?near=32.0853,34.7818&radius=10000000000", "200"],
  ["duties?near=32.0853,34.7818&radius=1", "200"], // []
  ["duties?near=32.0853c,34.7818&radius=100", "400"],
  ["duties?n=32.0853,34.7818&radius=100", "400"],
  ["duties?near=32.0853,34.7818&rad=100", "400"],
];
