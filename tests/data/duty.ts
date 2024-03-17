export const postWorkingPayload = {
  name: "attacking iran",
  description: "attacking iran's nuclear factories",
  location: {
    type: "Point",
    coordinates: [2754.9, 7689.27],
  },
  startTime: "2024-05-14T18:45:30.500Z",
  endTime: "2024-05-17T14:45:30.500Z",
  value: 15,
  constraints: ["big area", "massive attack", "secret operation"],
  soldiersRequired: 410,
  minRank: 3,
  maxRank: 6,
};

export const putPayload = {
  constraints: ["big area", "windy", "shabbat closing"],
};

export const patchPayload = {
  soldiersRequired: 50,
};
