import { Duty } from "../../src/types/duty.js";

export const removeAllDateVariablesFromDutyArray = (
  duties: Partial<Duty>[]
) => {
  return duties.map((duty) => {
    const {
      startTime,
      endTime,
      createdAt,
      updatedAt,
      statusHistory,
      ...other
    } = duty;

    return other;
  });
};
