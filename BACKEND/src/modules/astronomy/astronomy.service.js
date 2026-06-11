import prisma from "../../config/db.js";

export const getAllPlanets = () =>
  prisma.planet.findMany({ orderBy: { orderIndex: "asc" } });

export const getPlanetById = (id) =>
  prisma.planet.findUnique({ where: { id } });

export const getAllConstellations = () =>
  prisma.constellation.findMany({ orderBy: { name: "asc" } });

export const getConstellationById = (id) =>
  prisma.constellation.findUnique({ where: { id } });