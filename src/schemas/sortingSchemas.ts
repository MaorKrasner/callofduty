import { z } from "zod";

export const sortingSchema = z
  .object({
    sort: z.string().min(1),
    order: z.string().min(4).max(6), // desc / ascend
  })
  .strict();
