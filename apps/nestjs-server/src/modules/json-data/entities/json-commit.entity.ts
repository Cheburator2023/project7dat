import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { JsonDataEntity } from "./json-data.entity";

@Entity("json_commits")
export class JsonCommitEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 500 })
	message: string;

	@Column({ type: "jsonb" })
	diff: Record<string, any>;

	@Column({ type: "uuid" })
	graphId: string;

	@Column({ type: "varchar", length: 20 })
	version: string;

	@Column({ type: "varchar", length: 50 })
	status: string;

	@ManyToOne(() => JsonDataEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "graphId" })
	jsonData: JsonDataEntity;

	@Column({ nullable: true })
	authorName: string;

	@CreateDateColumn()
	createdAt: Date;
}
