import path from "path";
import dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { databaseConfig } from "src/core/config/database.config";

// Load environment variables for CLI usage (development by default)
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Named export to comply with project conventions (no default exports)
export const dataSource = new DataSource(databaseConfig());
