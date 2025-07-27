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

	@Column({ type: "varchar", length: 64, unique: true })
	hash: string;

	@Column({ type: "varchar", length: 500 })
	message: string;

	@Column({ type: "jsonb" })
	diff: Record<string, any>;

	@Column({ type: "jsonb" })
	fullData: Record<string, any>;

	@Column({ type: "uuid" })
	jsonDataId: string;

	@ManyToOne(() => JsonDataEntity, { onDelete: "CASCADE" })
	@JoinColumn({ name: "jsonDataId" })
	jsonData: JsonDataEntity;

	@CreateDateColumn()
	createdAt: Date;
}
