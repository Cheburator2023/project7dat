import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity("json_data")
export class JsonDataEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 255 })
	name: string;

	@Column({ type: "jsonb" })
	data: Record<string, any>;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ nullable: true })
	authorName: string;

	@Column({ type: "varchar", length: 20, default: "1.0.0" })
	schemaVersion: string;

	@Column({ type: "boolean", default: false })
	deprecated: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}