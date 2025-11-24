/** biome-ignore-all lint/suspicious/noUselessEscapeInString: <explanation> */
import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";

// Named export to keep code consistent with project rules
export async function initPostgresDatabase() {
	// Load env from .env.development.<NODE_ENV>, default to development
	const envFile = `.env.${process.env.NODE_ENV || "development"}`;
	dotenv.config({ path: path.resolve(process.cwd(), envFile) });

	const host = process.env.DB_HOST || "localhost";
	const port = Number.parseInt(process.env.DB_PORT || "5432", 10);
	const user = process.env.DB_USERNAME || "postgres";
	const password = process.env.DB_PASSWORD || "postgres";

	// Safety: do not alter remote databases
	if (!/^(localhost|127\.0\.0\.1)$/.test(host)) {
		console.error(
			"Remote database modification is blocked. Set DB_HOST to localhost for local init.",
		);
		process.exit(1);
	}

	const targetDbName = "data_lineage"; // requested database name

	// Connect to default database to issue CREATE DATABASE
	const client = new Client({
		host,
		port,
		user,
		password,
		database: "postgres",
	});

	try {
		await client.connect();

		const existsQuery = "SELECT 1 FROM pg_database WHERE datname = $1";
		const existsRes = await client.query(existsQuery, [targetDbName]);

		if (existsRes.rowCount && existsRes.rowCount > 0) {
			console.log(`Database \"${targetDbName}\" already exists.`);
			return;
		}

		// Simple and safe create; owner defaults to current user
		// Note: identifiers cannot be parameterized; ensure static validated name
		const safeName = targetDbName;
		if (!/^[a-zA-Z0-9_]+$/.test(safeName)) {
			throw new Error(
				"Invalid database name. Use alphanumeric and underscores only.",
			);
		}

		await client.query(`CREATE DATABASE "${safeName}"`);
		console.log(`Database \"${safeName}\" created successfully.`);
	} catch (err) {
		console.error("Failed to initialize PostgreSQL database:", err);
		process.exitCode = 1;
	} finally {
		try {
			await client.end();
		} catch {}
	}
}

// Execute when called via CLI
initPostgresDatabase().catch((err) => {
	console.error("Unexpected error:", err);
	process.exit(1);
});
