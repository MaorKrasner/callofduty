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
  startTime: new Date("2025-04-15T10:00:30.500Z"),
  endTime: new Date("2025-05-20T14:00:30.500Z"),
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
  startTime: new Date("2025-04-15T10:00:30.500Z"),
  endTime: new Date("2025-05-20T14:00:30.500Z"),
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

export const workingProjectionField = "name";

export const notWorkingProjectionField = "nameeeeeee";

export const workingPopulationField = "soldiers";

export const notWorkingPopulationField = "solds";

export const workingForeignField = "_id";

export const workingPaginationPage = 1;

export const workingPaginationLimit = 1;

export const workingEmptyPaginationPage = 1000;

export const workingEmptyPaginationLimit = 90;

export const notWorkingPaginationPages = ["8cb", "-3"];

export const notWorkingPaginationLimit = 2;

export const workingGeoQueryCoordinates = "32.0853,34.7818";

export const workingGeoQueryRadius = 10000000000;

export const emptyWorkingGeoQueryCoordinates = "67.57,64.64";

export const emptyWorkingGeoQueryRadius = 1;

export const notWorkingGeoQueryCoordinates = "32.0853c,34.7818";

export const workingSortFilter = "value";

export const notWorkingSortFilter = "val";

export const workingSortOrders = ["desc", "ascend"];

export const notWorkingSortOrders = ["de", "asc"];

export const workingFilterField = "value";

export const notWorkingFilterFields = ["val", "rank.value"];

export const notWorkingFilterValues = ["4", "8c"];

export const emptyWorkingFilterFields = ["maxRank", "soldiersRequired"];

export const workingFilterValue = 1;

export const workingDutyValue = 8;
