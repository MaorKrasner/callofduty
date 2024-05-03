import { ObjectId } from "mongodb";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import * as HttpStatus from "http-status-codes";

import { createServer } from "../../src/server.js";
import {
  client,
  closeDBConnection,
  connectToDB,
} from "../../src/db/connections.js";
import { findOne } from "../../src/db/operations.js";
import type { Duty } from "../../src/types/duty.js";
import {
  cancelDutyPayload,
  notFoundDutyId,
  notWorkingPatchPayload,
  notWorkingUrlParameter,
  postWorkingPayload,
  putPayload,
  cancelledDutyPayload,
  patchPayload,
  secondTestPostWorkingPayload,
  scheduleDutyPayload,
  testPostWorkingPayload,
  dutyInPast,
  workingProjectionField,
  notWorkingProjectionField,
  workingPopulationField,
  workingForeignField,
  notWorkingPopulationField,
  workingPaginationPage,
  workingPaginationLimit,
  workingEmptyPaginationPage,
  workingEmptyPaginationLimit,
  notWorkingPaginationPages,
  notWorkingPaginationLimit,
  workingGeoQueryCoordinates,
  workingGeoQueryRadius,
  emptyWorkingGeoQueryRadius,
  notWorkingGeoQueryCoordinates,
  emptyWorkingGeoQueryCoordinates,
  workingSortFilter,
  workingSortOrders,
  notWorkingSortFilter,
  notWorkingSortOrders,
  notWorkingFilterFields,
  notWorkingFilterValues,
  emptyWorkingFilterFields,
  workingFilterField,
  workingFilterValue,
  workingDutyValue,
} from "../testData/duty.js";
import {
  deleteDuty,
  findAllDuties,
  findDuty,
  findManyDuties,
  getDutiesByQuery,
  skipDuties,
  updateDuty,
} from "../../src/collections/duty.js";
import { createDutyDocument } from "../../src/controllers/dutyController.js";
import { insertDuty } from "../../src/collections/duty.js";
import { FastifyInstance } from "fastify";
import { getDutiesProjection } from "../../src/logic/projectionLogic.js";
import { removeAllDateVariablesFromDutyArray } from "../helpers/helperFunctions.js";

describe("Duty routes", () => {
  let attackingIranDuty: Duty;
  let attackingIranId: ObjectId;

  let testDuty: Duty;
  let testDutyId: ObjectId;

  let secondGazaAttack: Duty;
  let secondGazaAttackId: ObjectId;

  let dutyInPastDuty: Duty;
  let dutyInPastId: ObjectId;

  let cancelledDuty: Duty;
  let cancelledDutyId: ObjectId;

  let toScheduleDuty: Duty;
  let toScheduleDutyId: ObjectId;

  let toCancelDuty: Duty;
  let toCancelDutyId: ObjectId;

  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await connectToDB();

    attackingIranDuty = createDutyDocument(postWorkingPayload);
    await insertDuty(attackingIranDuty);
    const IranDuty = (await findOne<Duty & Document>(client, "duties", {
      name: attackingIranDuty.name,
    })) as Duty;
    attackingIranId = IranDuty._id!;

    testDuty = createDutyDocument(testPostWorkingPayload);
    await insertDuty(testDuty);
    const testDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
      name: testDuty.name,
    })) as Duty;
    testDutyId = testDutyFromDb._id!;

    const updateData = { status: "scheduled" } as Partial<Duty>;
    await updateDuty(testDutyId.toString(), updateData);

    secondGazaAttack = createDutyDocument(secondTestPostWorkingPayload);
    await insertDuty(secondGazaAttack);
    const secondTestDutyFromDb = (await findOne<Duty & Document>(
      client,
      "duties",
      {
        name: secondGazaAttack.name,
      }
    )) as Duty;
    secondGazaAttackId = secondTestDutyFromDb._id!;

    dutyInPastDuty = createDutyDocument(dutyInPast);
    await insertDuty(dutyInPastDuty);

    const pastDutyFromDb = (await findOne<Duty & Document>(client, "duties", {
      name: dutyInPastDuty.name,
    })) as Duty;
    dutyInPastId = pastDutyFromDb._id!;

    cancelledDuty = createDutyDocument(cancelledDutyPayload);
    await insertDuty(cancelledDuty);

    const cancelledDutyFromDb = (await findOne<Duty & Document>(
      client,
      "duties",
      {
        name: cancelledDuty.name,
      }
    )) as Duty;
    cancelledDutyId = cancelledDutyFromDb._id!;

    const cancelUpdateData = { status: "canceled" } as Partial<Duty>;
    await updateDuty(cancelledDutyId.toString(), cancelUpdateData);

    toScheduleDuty = createDutyDocument(scheduleDutyPayload);
    await insertDuty(toScheduleDuty);

    const toScheduleDutyFromDb = (await findOne<Duty & Document>(
      client,
      "duties",
      {
        name: toScheduleDuty.name,
      }
    )) as Duty;
    toScheduleDutyId = toScheduleDutyFromDb._id!;

    toCancelDuty = createDutyDocument(cancelDutyPayload);
    await insertDuty(toCancelDuty);

    const toCancelDutyFromDb = (await findOne<Duty & Document>(
      client,
      "duties",
      {
        name: toCancelDuty.name,
      }
    )) as Duty;
    toCancelDutyId = toCancelDutyFromDb._id!;
  });

  afterAll(async () => {
    await deleteDuty(testDutyId.toString());
    await deleteDuty(secondGazaAttackId.toString());
    await deleteDuty(dutyInPastId.toString());
    await deleteDuty(cancelledDutyId.toString());
    await deleteDuty(toScheduleDutyId.toString());
    await deleteDuty(toCancelDutyId.toString());

    const testDutyToDelete = await findManyDuties({
      name: testPostWorkingPayload.name,
    });
    const idToDelete = testDutyToDelete[0]._id!;

    await deleteDuty(idToDelete.toString());

    await closeDBConnection();
  });

  describe("GET routes for duties", () => {
    describe("GET : Search by filters", () => {
      it("Should return 200 when trying to get existing duties.", async () => {
        const response = await server.inject({
          method: "GET",
          url: `/duties?name=${attackingIranDuty.name}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).toHaveProperty("data");
      });

      it("Should return 400 when trying to get existing duties.", async () => {
        const response = await server.inject({
          method: "GET",
          url: `/duties?${notWorkingUrlParameter}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
        expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
      });
    });

    describe("GET: Find by duty id", () => {
      it("Should return 200 when trying to find duty by id.", async () => {
        const response = await server.inject({
          method: "GET",
          url: `/duties/${attackingIranId}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).toHaveProperty("data");
      });

      it("Should return 404 when trying to find duty by id.", async () => {
        const response = await server.inject({
          method: "GET",
          url: `/duties/${notFoundDutyId}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });

    describe("GET : sorting", () => {
      it(`Should return 200 when trying to sort duties (value).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${workingSortFilter}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const $sort = {} as Record<string, number>;
        $sort[workingSortFilter] = 1;

        const duties = await getDutiesByQuery([{ $sort }]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to sort duties (value & desc).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${workingSortFilter}&order=${workingSortOrders[0]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const orderKey = workingSortOrders[0] === "ascend" ? 1 : -1;

        const $sort = {} as Record<string, number>;
        $sort[workingSortFilter] = orderKey;

        const duties = await getDutiesByQuery([{ $sort }]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to sort duties (value & ascend).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${workingSortFilter}&order=${workingSortOrders[1]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const orderKey = workingSortOrders[1] === "ascend" ? 1 : -1;

        const $sort = {} as Record<string, number>;
        $sort[workingSortFilter] = orderKey;

        const duties = await getDutiesByQuery([{ $sort }]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 400 when trying to sort duties (val).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${notWorkingSortFilter}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to sort duties (val & desc).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${notWorkingSortFilter}&order=${workingSortOrders[0]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to sort duties (value & asc).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${workingSortFilter}&order=${notWorkingSortOrders[1]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to sort duties (val & asc).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${notWorkingSortFilter}&order=${notWorkingSortOrders[1]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to sort duties (ord).`, async () => {
        const response = await server.inject({
          url: `/duties?sort=${workingSortFilter}&ord=${workingSortOrders[0]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET : filtering by query parameters", () => {
      it(`Should return 200 when trying to filter duties (maxRank).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${emptyWorkingFilterFields[0]}>=${workingFilterValue}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const duties = await getDutiesByQuery([
          {
            $match: {
              [emptyWorkingFilterFields[0]]: { $gte: workingFilterValue },
            },
          },
        ]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to filter duties (soldiersRequired).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${emptyWorkingFilterFields[1]}=${workingFilterValue}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const duties = await getDutiesByQuery([
          {
            $match: {
              [emptyWorkingFilterFields[1]]: { $eq: workingFilterValue },
            },
          },
        ]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to filter duties (value).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${workingFilterField}=${workingDutyValue}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const duties = await getDutiesByQuery([
          {
            $match: {
              [workingFilterField]: { $eq: workingDutyValue },
            },
          },
        ]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to filter duties([]).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${emptyWorkingFilterFields[0]}>6`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).deep.eq([]);
      });

      it(`Should return 200 when trying to filter duties([]).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${emptyWorkingFilterFields[1]}=-1`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).deep.eq([]);
      });

      it(`Should return 200 when trying to filter duties([]).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${workingFilterField}>200`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).deep.eq([]);
      });

      it(`Should return 400 when trying to filter duties (val).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${notWorkingFilterFields[0]}=${notWorkingFilterValues[0]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to filter duties (filt).`, async () => {
        const response = await server.inject({
          url: `/duties?filt=${notWorkingFilterFields[0]}=${notWorkingFilterValues[0]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to filter duties (value >= 8c).`, async () => {
        const response = await server.inject({
          url: `/duties?filter=${notWorkingFilterFields[1]}>=${notWorkingFilterValues[1]}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET : Geo queries", () => {
      it(`Should return 200 when trying to geo query the duties`, async () => {
        const response = await server.inject({
          url: `/duties?near=${workingGeoQueryCoordinates}&radius=${workingGeoQueryRadius}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const coordinates = workingGeoQueryCoordinates
          .replace(" ", "")
          .split(",");

        const duties = await getDutiesByQuery([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  parseFloat(coordinates[0]),
                  parseFloat(coordinates[1]),
                ],
              },
              distanceField: "distance",
              maxDistance: workingGeoQueryRadius,
              spherical: true,
            },
          },
        ]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to geo query the duties ([])`, async () => {
        const response = await server.inject({
          url: `/duties?near=${emptyWorkingGeoQueryCoordinates}&radius=${emptyWorkingGeoQueryRadius}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).deep.eq([]);
      });

      it(`Should return 400 when trying to geo query the duties (bad coordinates)`, async () => {
        const response = await server.inject({
          url: `/duties?near=${notWorkingGeoQueryCoordinates}&radius=${workingGeoQueryRadius}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to geo query the duties (n)`, async () => {
        const response = await server.inject({
          url: `/duties?n=${workingGeoQueryCoordinates}&radius=${workingGeoQueryRadius}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to geo query the duties (rad)`, async () => {
        const response = await server.inject({
          url: `/duties?near=${workingGeoQueryCoordinates}&rad=${workingGeoQueryRadius}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET : pagination", () => {
      it(`Should return 200 when trying to paginate duties`, async () => {
        const response = await server.inject({
          url: `/duties?page=${workingPaginationPage}&limit=${workingPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const page = Math.trunc(workingPaginationPage);
        const limit = Math.trunc(workingPaginationLimit);

        const startIndex = (page - 1) * limit;

        const duties = await skipDuties(startIndex, limit);

        const amountOfSoldiers = (await findAllDuties()).length;
        const totalPages = Math.ceil(amountOfSoldiers / limit);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const newJsonDuties = removeAllDateVariablesFromDutyArray(
          response.json().duties as Duty[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);

        expect(response.json().page).deep.eq(`${page}/${totalPages}`);
        expect(newJsonDuties).deep.eq(newDuties);
      });

      it(`Should return 200 when trying to paginate duties ([])`, async () => {
        const response = await server.inject({
          url: `/duties?page=${workingEmptyPaginationPage}&limit=${workingEmptyPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(response.json()).deep.eq({
          page: "1000/1",
          duties: [],
        });
      });

      it(`Should return 400 when trying to paginate duties (page)`, async () => {
        const response = await server.inject({
          url: `/duties?page=${notWorkingPaginationPages[0]}&limit=${notWorkingPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to paginate duties (empty page)`, async () => {
        const response = await server.inject({
          url: `/duties?page=&limit=${notWorkingPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to paginate duties (pa)`, async () => {
        const response = await server.inject({
          url: `/duties?pa=${workingPaginationPage}&limit=${notWorkingPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to paginate duties (negative page)`, async () => {
        const response = await server.inject({
          url: `/duties?page=${notWorkingPaginationPages[1]}&limit=${notWorkingPaginationLimit}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET : population", () => {
      it(`Should return 200 when trying to populate the duties.`, async () => {
        const response = await server.inject({
          url: `/duties?populate=${workingPopulationField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const duties = await getDutiesByQuery([
          {
            $lookup: {
              from: `${workingPopulationField}`,
              localField: `${workingPopulationField}`,
              foreignField: `${workingForeignField}`,
              as: `${workingPopulationField}`,
            },
          },
        ]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();
        const jsonAsDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(jsonAsDuties).deep.eq(newDuties);
      });

      it(`Should return 400 when trying to populate duties (solds)`, async () => {
        const response = await server.inject({
          url: `/duties?populate=${notWorkingPopulationField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to populate duties (pop)`, async () => {
        const response = await server.inject({
          url: `/duties?pop=${workingPopulationField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to populate duties (pop, solds)`, async () => {
        const response = await server.inject({
          url: `/duties?pop=${notWorkingPopulationField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });

    describe("GET : projection", () => {
      it(`Should return 200 when trying to project the duties.`, async () => {
        const response = await server.inject({
          url: `/duties?select=${workingProjectionField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const projection = getDutiesProjection([`${workingProjectionField}`]);

        const duties = await getDutiesByQuery([{ $project: projection }]);

        const newDuties =
          removeAllDateVariablesFromDutyArray(duties).toString();

        const newJsonDuties = removeAllDateVariablesFromDutyArray(
          response.json() as Partial<Duty>[]
        ).toString();

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(newJsonDuties).deep.eq(newDuties);
      });

      it(`Should return 400 when trying to project the duties (nameeee).`, async () => {
        const response = await server.inject({
          url: `/duties?select=${notWorkingProjectionField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });

      it(`Should return 400 when trying to project the duties (sel).`, async () => {
        const response = await server.inject({
          url: `/duties?sel=${workingProjectionField}`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      });
    });
  });

  describe("POST routes for duties", () => {
    it("Should return 201 when creating a new duty.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/duties",
        payload: testPostWorkingPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CREATED);
      expect(response.json()).toHaveProperty("createdAt");
      expect(response.json()).toHaveProperty("updatedAt");
    });

    it("Should return 400 when creating a new duty.", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/duties",
        payload: patchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({ error: `Failed to pass schema.` });
    });
  });

  describe("DELETE routes for duties", () => {
    it("Should return 204 when trying to delete duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${attackingIranId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NO_CONTENT);
      expect(await findDuty(attackingIranId.toString())).toBe(null);
    });

    it("Should return 409 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${testDutyId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
    });

    it("Should return 404 when trying to delete a duty.", async () => {
      const response = await server.inject({
        method: "DELETE",
        url: `/duties/${notFoundDutyId}`,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("PATCH routes for duties", () => {
    it("Should return 200 when trying to update a duty.", async () => {
      const dutyBeforeUpdate = await findDuty(secondGazaAttackId.toString());

      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${secondGazaAttackId}`,
        payload: patchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      const dutyAfterUpdate = response.json() as Duty;

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
      expect(dutyAfterUpdate.soldiersRequired).not.toStrictEqual(
        dutyBeforeUpdate.soldiersRequired
      );
    });

    it("Should return 409 when trying to update a duty (scheduled).", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${testDutyId}`,
        payload: patchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
    });

    it("Should return 400 when trying to update a duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${secondGazaAttackId}`,
        payload: notWorkingPatchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST);
      expect(response.json()).deep.eq({
        error: `Failed to pass schema.`,
      });
    });

    it("Should return 404 when trying to update duty.", async () => {
      const response = await server.inject({
        method: "PATCH",
        url: `/duties/${notFoundDutyId}`,
        payload: patchPayload,
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
        },
      });

      expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
    });
  });

  describe("PUT routes for duties", () => {
    describe("PUT : constraints", () => {
      it("Should return 200 when adding new constraints to a duty.", async () => {
        const dutyBeforeUpdate = await findDuty(secondGazaAttackId.toString());

        const response = await server.inject({
          method: "PUT",
          url: `/duties/${secondGazaAttackId}/constraints`,
          payload: putPayload,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const dutyAfterUpdate = response.json() as Duty;

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(dutyAfterUpdate.updatedAt).not.toStrictEqual(
          dutyBeforeUpdate.updatedAt
        );
      });

      it("Should return 404 when trying to add new constraints to a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `/duties/${notFoundDutyId}/constraints`,
          payload: putPayload,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });

    describe("PUT : schedule", () => {
      it("Should return 200 when trying to schedule a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${toScheduleDutyId}/schedule`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const dutyAfterSchedule = await findDuty(toScheduleDutyId.toString());
        const isScheduleSuccessful =
          dutyAfterSchedule.statusHistory.length -
            toScheduleDuty.statusHistory.length ===
            1 && dutyAfterSchedule.status === "scheduled";

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(isScheduleSuccessful).toBe(true);
      });

      it("Should return 409 when trying to schedule a duty (scheduled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${testDutyId}/schedule`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is scheduled`,
        });
      });

      it("Should return 409 when trying to schedule a duty (cancelled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${cancelledDutyId}/schedule`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: `Duty cannot be scheduled because it is canceled`,
        });
      });

      it("Should return 409 when trying to schedule a duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${dutyInPastId}/schedule`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot schedule the duty because it's in the past.",
        });
      });

      it("Should return 404 when trying to schedule a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${notFoundDutyId}/schedule`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });

    describe("PUT: cancel", () => {
      it("Should return 200 when trying to cancel a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${toCancelDutyId}/cancel`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        const dutyAfterCancel = await findDuty(toCancelDutyId.toString());
        const isCancelSuccessful =
          dutyAfterCancel.statusHistory.length -
            toCancelDuty.statusHistory.length ===
            1 &&
          dutyAfterCancel.status === "canceled" &&
          dutyAfterCancel.soldiers.length === 0;

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK);
        expect(isCancelSuccessful).toBe(true);
      });

      it("Should return 409 when trying to cancel a duty (cancelled duty).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${cancelledDutyId}/cancel`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot cancel canceled duties.",
        });
      });

      it("Should return 409 when trying to cancel a duty (duty in the past).", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${dutyInPastId}/cancel`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.CONFLICT);
        expect(response.json()).deep.eq({
          error: "Cannot cancel the duty because it's in the past.",
        });
      });

      it("Should return 404 when trying to cancel a duty.", async () => {
        const response = await server.inject({
          method: "PUT",
          url: `duties/${notFoundDutyId}/cancel`,
          headers: {
            authorization: "Basic YWRtaW46cGFzc3dvcmQ=",
          },
        });

        expect(response.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND);
      });
    });
  });
});
