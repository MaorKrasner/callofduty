export const dutyValidFields = [
  "_id",
  "name",
  "description",
  "location",
  "startTime",
  "endTime",
  "minRank",
  "maxRank",
  "constraints",
  "soldiersRequired",
  "value",
  "soldiers",
  "status",
  "statusHistory",
  "createdAt",
  "updatedAt",
];

export const soldierValidFields = [
  "_id",
  "name",
  "rank",
  "limitations",
  "createdAt",
  "updatedAt",
];

export const justiceBoardValidFields = ["_id", "score"];

export const getDutiesProjection = (projectionParameters: string[]) => {
  const projection: { [key: string]: 0 | 1 } = {};

  projectionParameters.forEach((parameter) => {
    if (dutyValidFields.includes(parameter)) {
      projection[parameter] = 1;
    }
  });

  if (!projection["_id"]) {
    projection["_id"] = 0;
  }

  return projection;
};

export const getSoldiersProjection = (projectionParameters: string[]) => {
  const projection: { [key: string]: 0 | 1 } = {};

  projectionParameters.forEach((parameter) => {
    if (soldierValidFields.includes(parameter)) {
      projection[parameter] = 1;
    }
  });

  if (!projection["_id"]) {
    projection["_id"] = 0;
  }

  return projection;
};

export const getJusticeBoardProjection = (projectionParameters: string[]) => {
  const projection: { [key: string]: 0 | 1 } = {};

  projectionParameters.forEach((parameter) => {
    if (justiceBoardValidFields.includes(parameter)) {
      projection[parameter] = 1;
    }
  });

  if (!projection["_id"]) {
    projection["_id"] = 0;
  }

  return projection; // trim the spaces in the string.
};
