import { ObjectId } from "mongodb";
import { GeoJSON} from "geojson";

interface Soldier {
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

interface Duty {
    _id: ObjectId;
    name: string;
    description: string;
    location: GeoJSON;
    startTime: Date;
    endTime: Date;
    minRank: number;
    maxRank: number;
    constraints: string[];
    soldiersRequired: number;
    value: number;
    soldiers: ObjectId[];
    status: string;
    statusHistory: {
      status: string;
      date: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const rankValueNameDictionary = {
  0 : "private",
  1 : "corporal",
  2 : "sergeant",
  3 : "lieutenant",
  4 : "captain",
  5 : "major",
  6 : "colonel"
}

export { Soldier, Duty, rankValueNameDictionary };