import { string, z } from "zod";

export const sortingSchema = z
  .object({
    sort: z.string().min(1),
    order: z.string().optional(), // desc / ascend
  })
  .strict()
  .refine((obj) => {
    if (obj.order) {
      const validOrders = ["desc", "ascend"];
      return validOrders.includes(obj.order);
    }

    return true;
  });

export const queryFilteringSchema = z
  .object({
    filter: z.string().min(1),
  })
  .strict();

export const paginationSchema = z
  .object({
    page: z.number().positive(),
    limit: z.number().positive(),
  })
  .strict();

export const projectionSchema = z
  .object({
    select: z.string().min(1),
  })
  .strict();

export const nearDutiesSchema = z.object({
  coordinates: z.array(z.number().positive()).length(2),
  radiusAsNumber: z.number().positive(),
});

export const justiceBoardGetRouteSchema = z
  .object({
    sort: z.string().optional(),
    order: z.string().optional(),
    filter: z.string().optional(),
    page: z.number().positive().optional(),
    limit: z.number().positive().optional(),
    select: z.string().optional(),
    populate: z.string().optional(),
  })
  .strict()
  .refine((obj) => {
    if (obj.order) {
      return (
        obj.sort! &&
        !obj.filter &&
        !obj.page &&
        !obj.limit &&
        !obj.select &&
        !obj.populate
      );
    }
    if (obj.page) {
      return obj.limit!;
    }
    if (obj.limit) {
      return obj.page !== undefined;
    }
  });

export const mongoSignsParsingDictionary: { [key: string]: string } = {
  ">=": "$gte",
  "<=": "$lte",
  "=": "$eq",
  ">": "$gt",
  "<": "$lt",
};
