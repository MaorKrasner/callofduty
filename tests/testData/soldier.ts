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
  limitations: ["beard", "hatash7", "hair", "standing", "no work after 6pm"],
};

export const notWorkingPostPayloads = [
  {
    _id: "1234568",
    rank: { name: "captain", value: 4 },
    limitations: ["beard", "hatash7"],
  },

  {
    _id: "1234567",
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
