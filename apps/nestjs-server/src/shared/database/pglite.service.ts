import { Injectable, OnModuleInit } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";

@Injectable()
export class PGLiteService implements OnModuleInit {
	private db: PGlite;

	async onModuleInit() {
		if (process.env.NODE_ENV !== "production") {
			this.db = new PGlite("./dev-database");
			await this.initializeDatabase();
		}
	}

	private async initializeDatabase() {
		await this.db.exec(`
			CREATE TABLE IF NOT EXISTS json_data (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				name VARCHAR(255) NOT NULL,
				data JSONB NOT NULL,
				description TEXT,
				"createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				"updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);

			CREATE OR REPLACE FUNCTION update_updated_at_column()
			RETURNS TRIGGER AS $$
			BEGIN
				NEW."updatedAt" = CURRENT_TIMESTAMP;
				RETURN NEW;
			END;
			$$ language 'plpgsql';

			DROP TRIGGER IF EXISTS update_json_data_updated_at ON json_data;
			CREATE TRIGGER update_json_data_updated_at
				BEFORE UPDATE ON json_data
				FOR EACH ROW
				EXECUTE FUNCTION update_updated_at_column();
		`);
	}

	async query(sql: string, params: any[] = []): Promise<any[]> {
		if (!this.db) {
			throw new Error("PGLite не инициализирован");
		}
		const result = await this.db.query(sql, params);
		return result.rows;
	}

	async exec(sql: string): Promise<void> {
		if (!this.db) {
			throw new Error("PGLite не инициализирован");
		}
		await this.db.exec(sql);
	}
}
