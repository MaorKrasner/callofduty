import { z } from "zod";

export const dutyPostSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().min(1),
    location: z
      .object({
        type: z.literal("Point"),
        coordinates: z.array(z.number().positive()).length(2),
      })
      .strict(),
    startTime: z.string().transform((date) => new Date(date)),
    endTime: z.string().transform((date) => new Date(date)),
    value: z.number().positive(),
    constraints: z.array(z.string()),
    soldiersRequired: z.number().positive(),
    minRank: z.optional(z.number().min(0).max(6)),
    maxRank: z.optional(z.number().min(0).max(6)),
  })
  .strict()
  .refine((obj) => {
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

export const dutyPatchSchema = z
  .object({
    name: z.optional(z.string().min(3).max(50)),
    description: z.optional(z.string().min(1)),
    location: z.optional(
      z
        .object({
          type: z.literal("Point"),
          coordinates: z.array(z.number().positive()).length(2),
        })
        .strict()
    ),
    startTime: z.optional(z.string().transform((date) => new Date(date))),
    endTime: z.optional(z.string().transform((date) => new Date(date))),
    minRank: z.optional(z.number().min(0).max(6)),
    maxRank: z.optional(z.number().min(0).max(6)),
    constraints: z.optional(z.array(z.string())),
    soldiersRequired: z.optional(z.number().positive()),
    value: z.optional(z.number().positive()),
    soldiers: z.optional(z.array(z.string().min(7).max(7))),
    status: z.optional(z.string().min(1)),
    statusHistory: z.optional(
      z.array(
        z
          .object({
            status: z.string().min(1),
            date: z.string().transform((date) => new Date(date)),
          })
          .strict()
      )
    ),
  })
  .strict()
  .refine((obj) => {
    if (obj.startTime) {
      if (obj.startTime < new Date()) {
        return false;
      }
    }

    if (obj.startTime && obj.endTime) {
      if (obj.startTime >= obj.endTime) {
        return false;
      }
    }

    if (obj.minRank && obj.maxRank) {
      if (obj.minRank > obj.maxRank) {
        return false;
      }
    }

    return true;
  });

export const dutyGetFilterSchema = z
  .object({
    name: z.optional(z.string().min(3).max(50)),
    location: z.optional(z.string()),
    startTime: z.optional(z.string().transform((date) => new Date(date))),
    endTime: z.optional(z.string().transform((date) => new Date(date))),
    constraints: z.optional(z.array(z.string())),
    soldiersRequired: z.optional(z.number().positive()),
    value: z.optional(z.number().positive()),
    minRank: z.optional(z.number().min(0).max(6)),
    maxRank: z.optional(z.number().min(0).max(6)),
    description: z.optional(z.string().min(1)),
    status: z.optional(z.string()),
    soldiers: z.optional(z.array(z.string())),
  })
  .strict()
  .refine((obj) => {
    if (obj.startTime) {
      if (obj.startTime < new Date()) {
        return false;
      }
    }

    if (obj.startTime && obj.endTime) {
      if (obj.startTime >= obj.endTime) {
        return false;
      }
    }

    if (obj.minRank && obj.maxRank) {
      if (obj.minRank > obj.maxRank) {
        return false;
      }
    }

    return true;
  });
