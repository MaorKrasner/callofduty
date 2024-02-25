import type { GeoJSON } from "geojson";
import type { ObjectId } from "mongodb";

export interface Duty {
    _id?: ObjectId;
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