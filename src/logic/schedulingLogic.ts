import { aggregateJusticeBoard } from "../collections/justice-board.js";
import type { Duty } from "../types/duty.js";
import { findAllSoldiers } from "../collections/soldier.js";
import { findAllDuties } from "../collections/duty.js";
import type { justiceBoardElement } from "../types/justice-board.js";
import type { Soldier } from "../types/soldier.js";

const validateLimitations = (
  limitations: string[],
  dutyConstraints: string[]
) => {
  return (
    limitations.filter((limit) => dutyConstraints.includes(limit)).length === 0
  );
};

const validateRank = (
  soldierRank: number,
  minRank: number | null,
  maxRank: number | null
) => {
  if (!!minRank) {
    if (soldierRank < minRank) {
      return false;
    }
  }

  if (!!maxRank) {
    if (soldierRank > maxRank) {
      return false;
    }
  }

  return true;
};

const validateDates = (
  firstStartTime: number,
  firstEndTime: number,
  secondStartTime: number,
  secondEndTime: number
) => {
  return firstStartTime > secondEndTime || firstEndTime < secondStartTime;
};

const fixJusticeBoard = (
  justiceBoard: justiceBoardElement[],
  soldiers: Soldier[],
  duty: Duty
): justiceBoardElement[] => {
  justiceBoard = justiceBoard.filter((element) => {
    return soldiers.map((soldier) => soldier._id).includes(element._id);
  });

  justiceBoard = justiceBoard.sort((a, b) => {
    return a.score > b.score ? 1 : a.score < b.score ? -1 : 0;
  });

  if (soldiers.length > duty.soldiersRequired) {
    justiceBoard = justiceBoard.slice(0, duty.soldiersRequired);
  }

  return justiceBoard;
};

export const calculateJusticeBoardWithSchedulingLogic = async (duty: Duty) => {
  let soldiers = await findAllSoldiers();

  const duties = await findAllDuties();

  const canParticipateArray: boolean[] = new Array<boolean>(
    soldiers.length
  ).fill(true);

  let i = 0;
  let j = 0;

  const constraints = duty.constraints;

  for (; i < soldiers.length; i++) {
    canParticipateArray[i] = validateLimitations(
      soldiers[i].limitations,
      constraints
    );

    if (canParticipateArray[i]) {
      canParticipateArray[i] = validateRank(
        soldiers[i].rank.value,
        duty.minRank,
        duty.maxRank
      );
    }

    if (canParticipateArray[i]) {
      for (; j < duties.length; j++) {
        if (duties[j]._id !== duty._id) {
          if (
            duties[j].soldiers.includes(soldiers[i]._id) &&
            duties[j].status === "scheduled"
          ) {
            canParticipateArray[i] = validateDates(
              new Date(duty.startTime).getTime(),
              new Date(duty.endTime).getTime(),
              new Date(duties[j].startTime).getTime(),
              new Date(duties[j].endTime).getTime()
            );
          }
        }
      }
    }
  }

  soldiers = soldiers.filter(
    (soldier) => canParticipateArray[soldiers.indexOf(soldier)]
  );

  let justiceBoard = await aggregateJusticeBoard();

  justiceBoard = fixJusticeBoard(justiceBoard, soldiers, duty);

  return justiceBoard;
};
