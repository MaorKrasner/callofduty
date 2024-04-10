import { Soldier } from "../../src/types/soldier";

export const testSoldier: Partial<Soldier> = {
  _id: "4567890",
  name: "Test man",
  rank: { name: "sergeant", value: 2 },
  limitations: ["beard", "hair", "hatash7"],
};

export const workingPostPayload = {
  _id: "5789483",
  name: "Moby Brown",
  rank: { name: "sergeant", value: 2 },
  limitations: [
    "beard",
    "hatash7",
    "hair",
    "standing",
    "be home after darkness",
  ],
};

export const notWorkingPostPayloads = [
  {
    _id: "1234568",
    rank: { name: "captain", value: 4 },
    limitations: ["beard", "hatash7"],
  },

  {
    _id: "7654321",
    rank: { name: "corporal", value: 1 },
    limitations: ["beard", "hatash7"],
  },
];

export const workingPatchPayload = {
  rank: { name: "colonel", value: 6 },
  limitations: ["beard", "hair", "hatash7", "standing", "sun"],
};

export const notWorkingPatchPayloads = [
  {
    _id: "2345678",
    rank: { name: "colonel", value: 7 },
    limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  },

  {
    rank: { name: "colonel", value: 7 },
    limitations: ["beard", "hair", "hatash7", "standing", "sun"],
  },
];

export const notFoundSoldierId = "123";

export const existingLimitations = ["hair", "hatash7"];

export const notExistingLimitation = "c";

export const soldierSortingUrlsDictionary: [string, string][] = [
  ["soldiers?sort=rank.value", "200"],
  ["soldiers?sort=value", "400"],
  ["soldiers?sort=_id", "200"],
  ["soldiers?sort=id", "400"],
  ["soldiers?sort=rank.value&order=desc", "200"],
  ["soldiers?sort=rank.value&order=d", "400"],
  ["soldiers?sort=rank.value&order=ascend", "200"],
  ["soldiers?sort=rank.value&order=a", "400"],
];

export const soldierFilteringUrlsDictionary: [string, string][] = [
  ["soldiers?filter=rank.value>=1", "200"],
  ["soldiers?filter=rank.value>=20", "200"], // []
  ["soldiers?filter=rank>=1", "400"],
  ["soldiers?filter=value>=1", "400"],
];

export const soldierPaginationUrlsDictionary: [string, string][] = [
  ["soldiers?page=1&limit=2", "200"],
  ["soldiers?page=10000&limit=2", "200"], // []
  ["soldiers?page=-3&limit=2", "400"],
  ["soldiers?page=8cb&limit=2", "400"],
  ["soldiers?page=&limit=2", "400"],
  ["soldiers?pa=1&limit=2", "400"],
  ["soldiers?page=1&lim=3", "400"],
];

export const soldierProjectionUrlsDictionary: [string, string][] = [
  ["soldiers?select=name", "200"],
  ["soldiers?select=nameeee", "400"],
  ["soldiers?sel=name", "400"],
];
