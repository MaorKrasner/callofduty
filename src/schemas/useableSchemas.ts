import { string, z } from "zod";
import { dutyValidFields } from "../logic/projectionLogic.js";

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

export const dutiesGetRouteSchema = z
  .object({
    sort: z.string().min(1).optional(),
    order: z.string().optional(),
    filter: z.string().min(1).optional(),
    page: z.number().positive().optional(),
    limit: z.number().positive().optional(),
    select: z.string().min(1).optional(),
    populate: z.string().min(1).optional(),
    near: z.string().min(1).optional(),
    radius: z.string().optional(),
  })
  .strict()
  .refine((obj) => {
    if (obj.order) {
      const validOrders = ["desc", "ascend"];
      return validOrders.includes(obj.order) && obj.sort !== undefined;
    }
    if (obj.page) {
      return obj.limit !== undefined;
    }
    if (obj.limit) {
      return obj.page !== undefined;
    }
    if (obj.populate) {
      return obj.populate === "soldiers";
    }
    if (obj.near) {
      return obj.radius !== undefined && !isNaN(+obj.radius);
    }
    if (obj.filter) {
      let [field, operator, valueStr] = obj.filter
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      const validFilters = ["minRank", "maxRank", "soldiersRequired", "value"];

      return validFilters.includes(field) && !isNaN(+valueStr);
    }
    if (obj.select) {
      const projectionParameters = obj.select.replace(" ", "").split(",");

      return (
        projectionParameters.filter((param) => dutyValidFields.includes(param))
          .length > 0
      );
    }
    return true;
  });

export const soldiersGetRouteSchema = z
  .object({
    sort: z.string().min(1).optional(),
    order: z.string().optional(),
    filter: z.string().min(1).optional(),
    page: z.number().positive().optional(),
    limit: z.number().positive().optional(),
    select: z.string().min(1).optional(),
  })
  .strict()
  .refine((obj) => {
    if (obj.order) {
      const validOrders = ["desc", "ascend"];
      return validOrders.includes(obj.order) && obj.sort !== undefined;
    }
    if (obj.page) {
      return obj.limit !== undefined;
    }
    if (obj.limit) {
      return obj.page !== undefined;
    }
    if (obj.filter) {
      let [field, operator, valueStr] = obj.filter
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      const validFilters = ["minRank", "maxRank", "soldiersRequired", "value"];

      return validFilters.includes(field) && !isNaN(+valueStr);
    }
    if (obj.select) {
      const projectionParameters = obj.select.replace(" ", "").split(",");

      return (
        projectionParameters.filter((param) => dutyValidFields.includes(param))
          .length > 0
      );
    }
    return true;
  });

export const mongoSignsParsingDictionary: { [key: string]: string } = {
  ">=": "$gte",
  "<=": "$lte",
  "=": "$eq",
  ">": "$gt",
  "<": "$lt",
};
