import { z } from "zod";

import { rankValueNameDictionary } from "../types/soldier.js";

let postRankIndex: number;
let patchRankIndex: number;

export const soldierPostSchema = z.object({
    _id: z.string().min(7).max(7),
    name: z.string().min(3).max(50),
    rank: z.object({
        name: z.string().refine((rankName) => { 
            postRankIndex = Object.values(rankValueNameDictionary).indexOf(rankName);
            return Object.values(rankValueNameDictionary).includes(rankName); 
          }),
        value: z.number().min(0).max(6).refine((rankValue) => { 
            return rankValue === postRankIndex 
          }),
    }).strict(),
    limitations: z.array(z.string()),
}).strict();

export const soldierPatchSchema = z.object({
    name: z.optional(z.string()),
    limitations: z.optional(z.array(z.string())),
    rank: z.optional(z.object({
      name: z.string().refine((rankName) => { 
          patchRankIndex = Object.values(rankValueNameDictionary).indexOf(rankName);
          return Object.values(rankValueNameDictionary).includes(rankName); 
        }),
      value: z.number().min(0).max(6).refine((rankValue) => { 
          return rankValue === patchRankIndex; 
        }),
    }).strict()),
}).strict();
