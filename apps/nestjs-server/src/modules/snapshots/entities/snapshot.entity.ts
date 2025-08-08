import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
} from "typeorm";

@Entity("snapshots")
export class SnapshotEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", length: 255 })
	name: string;

	@Column({ type: "jsonb" })
	data: Record<string, any>;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ type: "varchar", length: 255 })
	sourceDataId: string;

	@CreateDateColumn()
	createdAt: Date;
}
