import type { Soldier } from "../src/types/soldier.js";

export const buildSoldierPayload = (
    _id: string,
    name: string,
    rank: {
        name: string,
        value: number
    },
    limitations: string[]
) => {
    const soldier: Partial<Soldier> = {};

    if (_id !== "") {
        soldier._id = _id;
    }

    if (name !== "") {
        soldier.name = name;
    }

    if (rank.value !== -1) {
        soldier.rank = rank;
    }

    if (limitations.length > 0) {
        soldier.limitations = limitations;
    }

    return soldier;
};