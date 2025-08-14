import {
	Entity,
	PrimaryColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	BeforeInsert,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity("json_data")
export class JsonDataEntity {
	@PrimaryColumn("uuid")
	id: string;

	@BeforeInsert()
	generateId() {
		if (!this.id) {
			this.id = uuidv4();
		}
	}

	@Column({ type: "varchar", length: 255 })
	name: string;

	@Column({ type: "jsonb" })
	data: Record<string, any>;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ type: "varchar", length: 50, default: "1.0.0" })
	version: string;

	@Column({ type: "boolean", default: false })
	isCurrent: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
