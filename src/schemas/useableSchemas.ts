import { string, z } from "zod";

export const sortingSchema = z
  .object({
    sort: z.string().min(1),
    order: z.string(), // desc / ascend
  })
  .strict()
  .refine((obj) => {
    return obj.order.length === 4 || obj.order.length === 6;
  });

export const queryFilteringSchema = z
  .object({
    filter: z.string().min(1),
  })
  .strict();

export const mongoSignsParsingDictionary: { [key: string]: string } = {
  ">=": "$gte",
  "<=": "$lte",
  "=": "$eq",
  ">": "$gt",
  "<": "$lt",
};
