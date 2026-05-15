import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../src/generated/prisma/client";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  loadEnvFile(".env");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao foi configurada para os testes e2e.");
}

export const e2ePrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ["error"],
});
