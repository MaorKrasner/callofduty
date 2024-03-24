import { ZodSchema } from "zod";

export const validateSchema = (schema: ZodSchema, data: unknown) => {
  const parsingResult = schema.safeParse(data);
  return parsingResult.success;
};
