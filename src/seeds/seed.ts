import { createServer, start, close } from "../server.js";
import { connectToDB, closeDBConnection } from "../db/connections.js";
import { soldiers, duties } from "./seedData.js";
import { createSoldierDocument } from "../controllers/soldierController.js";
import { insertSoldier } from "../collections/soldier.js";
import { findManyDuties, insertDuty } from "../collections/duty.js";
import { createDutyDocument } from "../controllers/dutyController.js";
import { findSoldier } from "../collections/soldier.js";
import logger from "../logger.js";

export const createSeeds = async () => {
  let soldiersInsertedCounter = 0;
  let dutiesInsertedCounter = 0;

  await connectToDB();

  const server = await createServer();
  start(server);

  for (const soldierData of soldiers) {
    if (!(await findSoldier(soldierData._id!.toString()))) {
      const soldier = createSoldierDocument(soldierData);
      await insertSoldier(soldier);
      soldiersInsertedCounter++;
    }
  }

  for (const dutyData of duties) {
    if ((await findManyDuties({ name: dutyData.name! })).length === 0) {
      const duty = createDutyDocument(dutyData);
      await insertDuty(duty);
      dutiesInsertedCounter++;
    }
  }

  closeDBConnection();
  close(server);

  logger.info(
    `Inserted ${soldiersInsertedCounter} soldiers and inserted ${dutiesInsertedCounter} duties. Total objects inserted : ${
      soldiersInsertedCounter + dutiesInsertedCounter
    }`
  );
};

createSeeds();
