import { findAllDuties } from "../collections/duty.js";
import { schedule } from "../controllers/dutyController.js";

const intervalTime = 5 * 60 * 1000;

export const runInterval = async () => {
  const duties = await findAllDuties();

  for (const duty of duties) {
    if (
      duty.status !== "scheduled" &&
      duty.status !== "canceled" &&
      !(new Date(duty.startTime).getTime() < new Date().getTime())
    ) {
      setInterval(async () => {
        await schedule(duty._id!.toString(), duty);
      }, intervalTime);
    }
  }
};
