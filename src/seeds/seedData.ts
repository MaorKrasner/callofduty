import type { Soldier } from "../types/soldier";
import type { Duty } from "../types/duty";

export const soldiers: Partial<Soldier>[] = [
  {
    _id: "7654321",
    name: "Maor Krasner",
    rank: {
      name: "colonel",
      value: 6,
    },
    limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  },
  {
    _id: "8765432",
    name: "Den Morgun",
    rank: {
      name: "major",
      value: 5,
    },
    limitations: ["beard", "hatash7", "hair", "standing", "sun", "food"],
  },
  {
    _id: "6543210",
    name: "Tom Yanover",
    rank: {
      name: "sergeant",
      value: 2,
    },
    limitations: ["beard", "hatash7", "hair"],
  },
  {
    _id: "7409873",
    name: "Yehonatan Moreno",
    rank: {
      name: "corporal",
      value: 1,
    },
    limitations: ["beard", "hair", "dust", "hatash7"],
  },
  {
    _id: "6549871",
    name: "Shay Hanuna",
    rank: {
      name: "colonel",
      value: 6,
    },
    limitations: ["beard", "hatash7", "hair", "dust"],
  },
];

export const duties: Partial<Duty>[] = [
  {
    name: "Hagnash",
    description: "Securing arab villages",
    location: {
      type: "Point",
      coordinates: [1857.57, 264.54],
    },
    startTime: new Date("2028-04-0418:45:30.500Z"),
    endTime: new Date("2028-04-11T10:45:30.500Z"),
    minRank: 4,
    maxRank: 4,
    constraints: ["windy", "Dust", "Shabbat closing", "Endurance"],
    soldiersRequired: 1,
    value: 8,
  },
  {
    name: "Toranut rasar",
    description: "Hanfatzot",
    location: {
      type: "Point",
      coordinates: [693.45, 462.45],
    },
    startTime: new Date("2028-04-2618:45:30.500Z"),
    endTime: new Date("2028-04-27T10:45:30.500Z"),
    minRank: 3,
    maxRank: 6,
    constraints: ["Dust", "Endurance", "Lifting heavy weights"],
    soldiersRequired: 1,
    value: 8,
  },
  {
    name: "Dalpak laila",
    description: "Securing marpam building",
    location: {
      type: "Point",
      coordinates: [1857.57, 264.54],
    },
    startTime: new Date("2028-04-0418:45:30.500Z"),
    endTime: new Date("2028-04-11T10:45:30.500Z"),
    minRank: 0,
    maxRank: 2,
    constraints: ["After darkness"],
    soldiersRequired: 1,
    value: 8,
  },
];
