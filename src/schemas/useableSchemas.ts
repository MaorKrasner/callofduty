import { z } from "zod";

import { dutyValidFields } from "../logic/projectionLogic.js";
import {
  dutySample,
  soldierSample,
  justiceBoardSample,
} from "../useableSamples.js";

const dutyKeys = Object.keys(dutySample);
const soldierKeys = Object.keys(soldierSample);
const justiceBoardKeys = Object.keys(justiceBoardSample);

const stringSchema = z.string().min(1).optional();

export const nearDutiesSchema = z.object({
  coordinates: z.array(z.number().positive()).length(2),
  radiusAsNumber: z.number().positive(),
});

export const dutiesGetRouteSchema = z
  .object({
    sort: stringSchema,
    order: stringSchema,
    filter: stringSchema,
    page: stringSchema,
    limit: stringSchema,
    select: stringSchema,
    populate: stringSchema,
    near: stringSchema,
    radius: stringSchema,
  })
  .strict()
  .refine((obj) => {
    const conditionsArray = new Array<boolean>();

    if (obj.sort) {
      conditionsArray.push(dutyKeys.includes(obj.sort));
    }
    if (obj.order) {
      if (!obj.sort) return false;

      const validOrders = ["desc", "ascend"];
      conditionsArray.push(
        validOrders.includes(obj.order) && dutyKeys.includes(obj.sort)
      );
    }
    if (obj.page) {
      conditionsArray.push(
        !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0 &&
          obj.limit !== undefined &&
          !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0
      );
    }
    if (obj.limit) {
      conditionsArray.push(
        !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0 &&
          obj.page !== undefined &&
          !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0
      );
    }
    if (obj.populate) {
      conditionsArray.push(obj.populate === "soldiers");
    }
    if (obj.near) {
      const coordinates = obj.near.replace(" ", "").split(",");
      conditionsArray.push(
        obj.radius !== undefined &&
          !isNaN(+obj.radius) &&
          coordinates.every((coordinate) => !isNaN(+coordinate))
      );
    }
    if (obj.filter) {
      let [field, operator, valueStr] = obj.filter
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      const validFilters = ["minRank", "maxRank", "soldiersRequired", "value"];

      conditionsArray.push(validFilters.includes(field) && !isNaN(+valueStr));
    }
    if (obj.select) {
      const projectionParameters = obj.select.replace(" ", "").split(",");

      conditionsArray.push(
        projectionParameters.filter((param) => dutyValidFields.includes(param))
          .length > 0
      );
    }

    return conditionsArray.every((condition) => condition === true);
  });

export const soldiersGetRouteSchema = z
  .object({
    sort: stringSchema,
    order: stringSchema,
    filter: stringSchema,
    page: stringSchema,
    limit: stringSchema,
    select: stringSchema,
  })
  .strict()
  .refine((obj) => {
    const conditionsArray = new Array<boolean>();

    if (obj.sort) {
      conditionsArray.push(soldierKeys.includes(obj.sort));
    }
    if (obj.order) {
      if (!obj.sort) return false;

      const validOrders = ["desc", "ascend"];
      conditionsArray.push(
        validOrders.includes(obj.order) && soldierKeys.includes(obj.sort)
      );
    }
    if (obj.page) {
      conditionsArray.push(
        !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0 &&
          obj.limit !== undefined &&
          !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0
      );
    }
    if (obj.limit) {
      conditionsArray.push(
        !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0 &&
          obj.page !== undefined &&
          !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0
      );
    }
    if (obj.filter) {
      let [field, operator, valueStr] = obj.filter
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      conditionsArray.push(field === "rank.value" && !isNaN(+valueStr));
    }
    if (obj.select) {
      const projectionParameters = obj.select.replace(" ", "").split(",");

      conditionsArray.push(
        projectionParameters.filter((param) => dutyValidFields.includes(param))
          .length > 0
      );
    }

    return conditionsArray.every((condition) => condition === true);
  });

export const justiceBoardRouteSchema = z
  .object({
    sort: stringSchema,
    order: stringSchema,
    filter: stringSchema,
    page: stringSchema,
    limit: stringSchema,
    select: stringSchema,
    populate: stringSchema,
  })
  .strict()
  .refine((obj) => {
    const conditionsArray = new Array<boolean>();

    if (obj.sort) {
      conditionsArray.push(justiceBoardKeys.includes(obj.sort));
    }
    if (obj.order) {
      if (!obj.sort) return false;

      const validOrders = ["desc", "ascend"];
      conditionsArray.push(
        validOrders.includes(obj.order) && justiceBoardKeys.includes(obj.sort)
      );
    }
    if (obj.page) {
      conditionsArray.push(
        !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0 &&
          obj.limit !== undefined &&
          !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0
      );
    }
    if (obj.limit) {
      conditionsArray.push(
        !isNaN(+obj.limit) &&
          Number.isInteger(+obj.limit) &&
          +obj.limit > 0 &&
          obj.page !== undefined &&
          !isNaN(+obj.page) &&
          Number.isInteger(+obj.page) &&
          +obj.page > 0
      );
    }
    if (obj.populate) {
      conditionsArray.push(obj.populate === "_id");
    }
    if (obj.filter) {
      let [field, operator, valueStr] = obj.filter
        .replace(" ", "")
        .split(/(>=|<=|<|>|=)/);

      conditionsArray.push(field !== "score" && !isNaN(+valueStr));
    }
    if (obj.select) {
      const projectionParameters = obj.select.replace(" ", "").split(",");

      conditionsArray.push(
        projectionParameters.filter((param) => dutyValidFields.includes(param))
          .length > 0
      );
    }

    return conditionsArray.every((condition) => condition === true);
  });

export const mongoSignsParsingDictionary: { [key: string]: string } = {
  ">=": "$gte",
  "<=": "$lte",
  "=": "$eq",
  ">": "$gt",
  "<": "$lt",
};
