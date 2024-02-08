/*
// Collection of a soldier
interface Soldier {
    _id: string;
    name: string;
    rank: {
      name: string;
      value: number;
    };
    limitations: string[];
    createdAt: ISODate;
    updatedAt: ISODate;
}

// Collection of a duty
interface Duty {
    _id: ObjectId;
    name: string;
    description: string;
    location: GeoJSON Point;
    startTime: ISODate;
    endTime: ISODate;
    minRank: number;
    maxRank: number;
    constraints: string[];
    soldiersRequired: number;
    value: number;
    soldiers: ObjectId[];
    status: string;
    statusHistory: {
      status: string;
      date: ISODate;
    }[];
    createdAt: ISODate;
    updatedAt: ISODate;
}
*/