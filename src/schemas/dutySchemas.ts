import { z } from "zod"

let startDate: Date;
let minimumRank: number;

export const dutyPostSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().min(1),
    location: z.object({
        type: z.literal("Point"),
        coordinates: z.array(z.number().positive()).length(2),
    }).strict(),
    startTime: z.string().transform((date) => new Date(date)),
    endTime: z.string().transform((date) => new Date(date)),
    value: z.number().positive(),
    constraints: z.array(z.string()),
    soldiersRequired: z.number().positive(),
    minRank: z.optional(z.number().min(0).max(6)),
    maxRank: z.optional(z.number().min(0).max(6))
}).strict().refine((obj) =>{
    if (obj.startTime < new Date()) {
        return false;
    }

    if (obj.startTime >= obj.endTime) {
        return false;
    }

    if (obj.minRank && obj.maxRank) {
        if (obj.minRank > obj.maxRank) {
            return false;
        }
    }

    return true;
});