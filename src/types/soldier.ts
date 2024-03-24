import { type Document } from "mongodb";

export interface Soldier extends Document {
  _id: string;
  name: string;
  rank: {
    name: string;
    value: number;
  };
  limitations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SoldierDocument = Soldier & Document;

const rankValueNameDictionary = {
  0: "private",
  1: "corporal",
  2: "sergeant",
  3: "lieutenant",
  4: "captain",
  5: "major",
  6: "colonel",
};

export { rankValueNameDictionary };
